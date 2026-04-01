import mongoose from 'mongoose';
import type { Request, Response, NextFunction } from 'express';
import { couponModel } from '@models/coupon.model.js';
import { productModel } from '@models/product.model.js';
import { orderModel } from '@models/order.model.js';
import { cartModel } from '@models/cart.model.js';
import { isCouponValid } from '@utils/couponValidation.js';
import { asyncHandler } from '@utils/asyncHandler.js';
import { sendSuccess } from '@utils/response.js';
import { AppError } from '@utils/AppError.js';
import { createCheckoutSession, createStripeCoupon, constructWebhookEvent } from '@utils/payment.js';
import { qrcodeFunction } from '@utils/qrCode.js';
import createInvoice from '@utils/pdfkit.js';
import { sendEmailService } from '@services/sendEmailService.js';
import { customAlphabet } from 'nanoid';
import { env } from '@config/env.js';
import { logger } from '@services/logger.js';
import type Stripe from 'stripe';

const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 3);

const computePaidAmount = (subTotal: number, coupon?: { isPercentage: boolean; isFixedAmount: boolean; couponAmount: number } | null) => {
  if (!coupon) return subTotal;
  if (coupon.isPercentage) return subTotal * (1 - coupon.couponAmount / 100);
  if (coupon.isFixedAmount) return Math.max(0, subTotal - coupon.couponAmount);
  return subTotal;
};

// ─── Create Order (single product) ───────────────────────────────────────────
export const createOrder = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.authUser!._id;
  const { productId, quantity, address, phoneNumbers, paymentMethod, couponCode } =
    req.body as { productId: string; quantity: number; address: Record<string, string>; phoneNumbers: string[]; paymentMethod: 'cash' | 'card'; couponCode?: string };

  let coupon = null;
  if (couponCode) {
    coupon = await couponModel.findOne({ couponCode }).select('isPercentage isFixedAmount couponAmount couponAssignedUsers _id');
    const result = await isCouponValid({ couponCode, userId: userId as mongoose.Types.ObjectId });
    if (!result.valid) return next(new AppError(result.msg, 400));
  }

  // ── Atomic stock reservation (fixes race condition) ──────────────────────
  const session = await mongoose.startSession();
  session.startTransaction();
  let orderDB;

  try {
    const updatedProduct = await productModel.findOneAndUpdate(
      { _id: productId, stock: { $gte: quantity } },
      { $inc: { stock: -quantity } },
      { new: true, session },
    );

    if (!updatedProduct) {
      await session.abortTransaction();
      return next(new AppError(req.t.order.invalidProductId, 400));
    }

    const productItem = {
      productId,
      quantity,
      title: updatedProduct.title,
      price: updatedProduct.priceAfterDiscount,
      finalPrice: updatedProduct.priceAfterDiscount * quantity,
    };

    const subTotal = productItem.finalPrice;
    const paidAmount = computePaidAmount(subTotal, coupon);
    const orderStatus = paymentMethod === 'cash' ? 'placed' : 'pending';

    orderDB = await orderModel.create(
      [{ userId, products: [productItem], address, phoneNumbers, orderStatus, paymentMethod, subTotal, paidAmount, couponId: coupon?._id }],
      { session },
    );
    orderDB = orderDB[0];

    // Increment coupon usage (fixes usagecount typo)
    if (coupon) {
      const userEntry = coupon.couponAssignedUsers.find((u) => u.userId.toString() === userId.toString());
      if (userEntry) { userEntry.usageCount += 1; await coupon.save({ session }); }
    }

    await session.commitTransaction();
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }

  // ── Stripe checkout (outside transaction) ───────────────────────────────
  let checkoutUrl = '';
  if (paymentMethod === 'card' && orderDB) {
    let stripeCouponId: string | undefined;
    if (coupon) {
      const sc = await createStripeCoupon(coupon.isPercentage, coupon.couponAmount);
      stripeCouponId = sc.id;
    }
    const orderSession = await createCheckoutSession({
      customerEmail: req.authUser!.email,
      metadata: { orderId: String(orderDB._id) },
      successUrl: `${req.protocol}://${req.headers.host}/api/v1/order/webhook`,
      cancelUrl: `${req.protocol}://${req.headers.host}/api/v1/order/webhook`,
      lineItems: orderDB.products.map((p) => ({ title: p.title, price: p.price, quantity: p.quantity })),
      discounts: stripeCouponId ? [{ coupon: stripeCouponId }] : [],
    });
    checkoutUrl = orderSession.url ?? '';
  }

  // ── Invoice + QR ────────────────────────────────────────────────────────
  const orderQr = await qrcodeFunction({ data: { orderId: orderDB!._id, products: orderDB!.products } });
  const orderCode = `${req.authUser!.userName}_${nanoid()}`;
  createInvoice({ orderCode, date: orderDB!.createdAt as Date, items: orderDB!.products, subTotal: orderDB!.subTotal, paidAmount: orderDB!.paidAmount, shipping: { name: req.authUser!.userName, address: address.street ?? '', city: address.city ?? 'Cairo', state: address.city ?? 'Cairo', country: address.country ?? 'Egypt' } }, `${orderCode}.pdf`);
  await sendEmailService({ to: req.authUser!.email, subject: 'Order Confirmation', message: '<h1>Thank you! Find your invoice attached.</h1>', attachments: [{ path: `./Files/${orderCode}.pdf` }] });

  return sendSuccess(res, { order: orderDB, orderQr, checkoutUrl }, req.t.order.created, 201);
});

// ─── From Cart to Order ────────────────────────────────────────────────────────
export const fromCartToOrder = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.authUser!._id;
  const { cartId, address, phoneNumbers, paymentMethod, couponCode } =
    req.body as { cartId: string; address: Record<string, string>; phoneNumbers: string[]; paymentMethod: 'cash' | 'card'; couponCode?: string };

  const cart = await cartModel.findById(cartId);
  if (!cart) return next(new AppError(req.t.order.invalidCartId, 404));
  if (!cart.products.length) return next(new AppError(req.t.order.emptyCart, 400));

  let coupon = null;
  if (couponCode) {
    coupon = await couponModel.findOne({ couponCode }).select('isPercentage isFixedAmount couponAmount couponAssignedUsers _id');
    const result = await isCouponValid({ couponCode, userId: userId as mongoose.Types.ObjectId });
    if (!result.valid) return next(new AppError(result.msg, 400));
  }

  const session = await mongoose.startSession();
  session.startTransaction();
  let orderDB;

  try {
    const orderProducts = [];
    for (const item of cart.products) {
      // Re-validate stock for each cart item
      const updated = await productModel.findOneAndUpdate(
        { _id: item.productId, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity } },
        { new: true, session },
      );
      if (!updated) {
        await session.abortTransaction();
        return next(new AppError(`Product ${item.productId} has insufficient stock`, 400));
      }
      orderProducts.push({
        productId: item.productId,
        quantity: item.quantity,
        title: updated.title,
        price: updated.priceAfterDiscount,
        finalPrice: updated.priceAfterDiscount * item.quantity,
      });
    }

    const subTotal = cart.subTotal;
    const paidAmount = computePaidAmount(subTotal, coupon);
    const orderStatus = paymentMethod === 'cash' ? 'placed' : 'pending';

    orderDB = await orderModel.create(
      [{ userId, products: orderProducts, address, phoneNumbers, orderStatus, paymentMethod, subTotal, paidAmount, couponId: coupon?._id }],
      { session },
    );
    orderDB = orderDB[0];

    if (coupon) {
      const userEntry = coupon.couponAssignedUsers.find((u) => u.userId.toString() === userId.toString());
      if (userEntry) { userEntry.usageCount += 1; await coupon.save({ session }); }
    }

    cart.products = [];
    cart.subTotal = 0;
    await cart.save({ session });

    await session.commitTransaction();
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }

  let checkoutUrl = '';
  if (paymentMethod === 'card' && orderDB) {
    let stripeCouponId: string | undefined;
    if (coupon) {
      const sc = await createStripeCoupon(coupon.isPercentage, coupon.couponAmount);
      stripeCouponId = sc.id;
    }
    const orderSession = await createCheckoutSession({
      customerEmail: req.authUser!.email,
      metadata: { orderId: String(orderDB._id) },
      successUrl: `${req.protocol}://${req.headers.host}/api/v1/order/webhook`,
      cancelUrl: `${req.protocol}://${req.headers.host}/api/v1/order/webhook`,
      lineItems: orderDB.products.map((p) => ({ title: p.title, price: p.price, quantity: p.quantity })),
      discounts: stripeCouponId ? [{ coupon: stripeCouponId }] : [],
    });
    checkoutUrl = orderSession.url ?? '';
  }

  const orderQr = await qrcodeFunction({ data: { orderId: orderDB!._id, products: orderDB!.products } });
  const orderCode = `${req.authUser!.userName}_${nanoid()}`;
  createInvoice({ orderCode, date: orderDB!.createdAt as Date, items: orderDB!.products, subTotal: orderDB!.subTotal, paidAmount: orderDB!.paidAmount, shipping: { name: req.authUser!.userName, address: address.street ?? '', city: address.city ?? 'Cairo', state: address.city ?? 'Cairo', country: address.country ?? 'Egypt' } }, `${orderCode}.pdf`);
  await sendEmailService({ to: req.authUser!.email, subject: 'Order Confirmation', message: '<h1>Thank you! Find your invoice attached.</h1>', attachments: [{ path: `./Files/${orderCode}.pdf` }] });

  return sendSuccess(res, { order: orderDB, orderQr, checkoutUrl }, req.t.order.created, 201);
});

// ─── Stripe Webhook ─────────────────────────────────────────────────────────
export const stripeWebhook = async (req: Request, res: Response): Promise<void> => {
  const sig = req.headers['stripe-signature'] as string;
  let event: Stripe.Event;

  try {
    event = constructWebhookEvent(req.body as Buffer, sig);
  } catch (err) {
    logger.error('Stripe webhook signature verification failed', { err });
    res.status(400).json({ success: false, message: 'Invalid webhook signature' });
    return;
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.metadata?.orderId;
      if (orderId) {
        await orderModel.findOneAndUpdate({ _id: orderId, orderStatus: 'pending' }, { orderStatus: 'confirmed' });
      }
    } else if (event.type === 'checkout.session.expired') {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.metadata?.orderId;
      if (orderId) {
        const order = await orderModel.findOneAndUpdate(
          { _id: orderId, orderStatus: 'pending' },
          { orderStatus: 'canceled' },
          { new: true },
        );
        if (order) {
          // Restore stock
          for (const p of order.products) {
            await productModel.findByIdAndUpdate(p.productId, { $inc: { stock: p.quantity } });
          }
          // Restore coupon usage
          if (order.couponId) {
            const coupon = await couponModel.findById(order.couponId);
            if (coupon) {
              const entry = coupon.couponAssignedUsers.find((u) => u.userId.toString() === order.userId.toString());
              if (entry && entry.usageCount > 0) { entry.usageCount -= 1; await coupon.save(); }
            }
          }
        }
      }
    }
    res.status(200).json({ received: true });
  } catch (err) {
    logger.error('Stripe webhook handler error', { err });
    res.status(500).json({ success: false, message: 'Webhook processing failed' });
  }
};

// ─── Cancel Order ────────────────────────────────────────────────────────────
export const cancelOrder = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { orderId } = req.params;
  const { reason } = req.body as { reason?: string };

  const order = await orderModel.findById(orderId);
  if (!order) return next(new AppError(req.t.order.notFound, 404));
  if (order.orderStatus === 'canceled') return next(new AppError(req.t.order.alreadyCanceled, 400));
  if (['delivered', 'on_way'].includes(order.orderStatus ?? '')) {
    return next(new AppError('Cannot cancel an order that is already on the way or delivered', 400));
  }

  order.orderStatus = 'canceled';
  order.canceledBy = req.authUser!._id as typeof order.canceledBy;
  if (reason) order.reason = reason;
  await order.save();

  // Restore stock
  for (const p of order.products) {
    await productModel.findByIdAndUpdate(p.productId, { $inc: { stock: p.quantity } });
  }

  // Restore coupon usage
  if (order.couponId) {
    const coupon = await couponModel.findById(order.couponId);
    if (coupon) {
      const entry = coupon.couponAssignedUsers.find((u) => u.userId.toString() === order.userId.toString());
      if (entry && entry.usageCount > 0) { entry.usageCount -= 1; await coupon.save(); }
    }
  }

  return sendSuccess(res, { order });
});

// ─── Deliver Order ───────────────────────────────────────────────────────────
export const deliverOrder = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { orderId } = req.params;
  const order = await orderModel.findOneAndUpdate(
    { _id: orderId, orderStatus: { $nin: ['rejected', 'pending', 'delivered', 'canceled'] } },
    { orderStatus: 'delivered', updatedBy: req.authUser!._id },
    { new: true },
  );
  if (!order) return next(new AppError(req.t.order.invalidOrderId, 404));
  return sendSuccess(res, { order }, req.t.order.delivered);
});
