import mongoose from 'mongoose';
import { customAlphabet } from 'nanoid';
import { ok, fail } from '@utils/result.js';
import { AppError } from '@utils/AppError.js';
import { isCouponValid } from '@utils/couponValidation.js';
import { createCheckoutSession, createStripeCoupon, constructWebhookEvent } from '@utils/payment.js';
import { qrcodeFunction } from '@utils/qrCode.js';
import createInvoice from '@utils/pdfkit.js';
import { sendEmailService } from '@services/sendEmailService.js';
import { couponModel } from '@models/coupon.model.js';
import { logger } from '@services/logger.js';
import type { Result } from '@utils/result.js';
import type { IOrderDocument } from '@models/order.model.js';
import type Stripe from 'stripe';
import { productRepository } from '../../Products/repositories/product.repository.js';
import { cartRepository } from '../../Carts/repositories/cart.repository.js';
import { orderRepository } from '../repositories/order.repository.js';

const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 3);

export interface OrderAddress {
  street: string;
  city: string;
  country: string;
  postalCode?: string;
}

export interface CreateOrderInput {
  userId: mongoose.Types.ObjectId;
  productId: string;
  quantity: number;
  address: OrderAddress;
  phoneNumbers: string[];
  paymentMethod: 'cash' | 'card';
  couponCode?: string;
  customerEmail: string;
  userName: string;
  host: string;
  protocol: string;
}

export interface CartToOrderInput {
  userId: mongoose.Types.ObjectId;
  cartId: string;
  address: OrderAddress;
  phoneNumbers: string[];
  paymentMethod: 'cash' | 'card';
  couponCode?: string;
  customerEmail: string;
  userName: string;
  host: string;
  protocol: string;
}

export interface OrderResult {
  order: IOrderDocument;
  orderQr: string;
  checkoutUrl: string;
}

const computePaidAmount = (
  subTotal: number,
  coupon?: { isPercentage: boolean; isFixedAmount: boolean; couponAmount: number } | null,
): number => {
  if (!coupon) return subTotal;
  if (coupon.isPercentage) return subTotal * (1 - coupon.couponAmount / 100);
  if (coupon.isFixedAmount) return Math.max(0, subTotal - coupon.couponAmount);
  return subTotal;
};

const buildCheckoutUrl = async (
  order: IOrderDocument,
  coupon: { isPercentage: boolean; couponAmount: number } | null,
  customerEmail: string,
  host: string,
  protocol: string,
): Promise<Result<string>> => {
  let stripeCouponId: string | undefined;
  if (coupon) {
    const stripeCouponResult = await createStripeCoupon(coupon.isPercentage, coupon.couponAmount);
    if (!stripeCouponResult.ok) return stripeCouponResult;
    stripeCouponId = stripeCouponResult.value.id;
  }

  const sessionResult = await createCheckoutSession({
    customerEmail,
    metadata: { orderId: String(order._id) },
    successUrl: `${protocol}://${host}/api/v1/order/webhook`,
    cancelUrl: `${protocol}://${host}/api/v1/order/webhook`,
    lineItems: order.products.map((p) => ({
      title: p.title,
      price: p.price,
      quantity: p.quantity,
    })),
    discounts: stripeCouponId ? [{ coupon: stripeCouponId }] : [],
  });

  if (!sessionResult.ok) return sessionResult;
  return ok(sessionResult.value.url ?? '');
};

const generateOrderAssets = async (
  order: IOrderDocument,
  input: { address: OrderAddress; customerEmail: string; userName: string },
): Promise<string> => {
  const orderQr = await qrcodeFunction({
    data: { orderId: order._id, products: order.products },
  });
  const orderCode = `${input.userName}_${nanoid()}`;
  createInvoice(
    {
      orderCode,
      date: order.createdAt as Date,
      items: order.products,
      subTotal: order.subTotal,
      paidAmount: order.paidAmount,
      shipping: {
        name: input.userName,
        address: input.address.street ?? '',
        city: input.address.city ?? 'Cairo',
        state: input.address.city ?? 'Cairo',
        country: input.address.country ?? 'Egypt',
      },
    },
    `${orderCode}.pdf`,
  );
  await sendEmailService({
    to: input.customerEmail,
    subject: 'Order Confirmation',
    message: '<h1>Thank you! Find your invoice attached.</h1>',
    attachments: [{ path: `./Files/${orderCode}.pdf` }],
  });
  return orderQr;
};

class OrderService {
  async createOrder(input: CreateOrderInput): Promise<Result<OrderResult>> {
    let coupon = null;
    if (input.couponCode) {
      const couponResult = await isCouponValid({ couponCode: input.couponCode, userId: input.userId });
      if (!couponResult.ok) return couponResult;
      coupon = couponResult.value;
    }

    const session = await mongoose.startSession();
    session.startTransaction();
    let orderDB: IOrderDocument;

    try {
      const updatedProduct = await productRepository.reserveStock(
        input.productId,
        input.quantity,
        session,
      );
      if (!updatedProduct) {
        await session.abortTransaction();
        return fail(new AppError('Product not found or insufficient stock', 400));
      }

      const productItem = {
        productId: input.productId,
        quantity: input.quantity,
        title: updatedProduct.title,
        price: updatedProduct.priceAfterDiscount,
        finalPrice: updatedProduct.priceAfterDiscount * input.quantity,
      };

      const subTotal = productItem.finalPrice;
      const paidAmount = computePaidAmount(subTotal, coupon);
      const orderStatus = input.paymentMethod === 'cash' ? 'placed' : 'pending';

      const [created] = await orderRepository.createWithSession(
        [
          {
            userId: input.userId,
            products: [productItem],
            address: input.address,
            phoneNumbers: input.phoneNumbers,
            orderStatus,
            paymentMethod: input.paymentMethod,
            subTotal,
            paidAmount,
            couponId: coupon?._id,
          },
        ],
        session,
      );
      orderDB = created;

      if (coupon) {
        const userEntry = coupon.couponAssignedUsers.find(
          (u) => u.userId.toString() === input.userId.toString(),
        );
        if (userEntry) {
          userEntry.usageCount += 1;
          await coupon.save({ session });
        }
      }

      await session.commitTransaction();
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }

    let checkoutUrl = '';
    if (input.paymentMethod === 'card') {
      const urlResult = await buildCheckoutUrl(
        orderDB!,
        coupon,
        input.customerEmail,
        input.host,
        input.protocol,
      );
      if (!urlResult.ok) return urlResult;
      checkoutUrl = urlResult.value;
    }

    const orderQr = await generateOrderAssets(orderDB!, {
      address: input.address,
      customerEmail: input.customerEmail,
      userName: input.userName,
    });

    return ok({ order: orderDB!, orderQr, checkoutUrl });
  }

  async fromCartToOrder(input: CartToOrderInput): Promise<Result<OrderResult>> {
    const cart = await cartRepository.findById(input.cartId);
    if (!cart) return fail(new AppError('Cart not found', 404));
    if (!cart.products.length) return fail(new AppError('Cart is empty', 400));

    let coupon = null;
    if (input.couponCode) {
      const couponResult = await isCouponValid({ couponCode: input.couponCode, userId: input.userId });
      if (!couponResult.ok) return couponResult;
      coupon = couponResult.value;
    }

    const session = await mongoose.startSession();
    session.startTransaction();
    let orderDB: IOrderDocument;

    try {
      const orderProducts = [];
      for (const item of cart.products) {
        const updated = await productRepository.reserveStock(item.productId, item.quantity, session);
        if (!updated) {
          await session.abortTransaction();
          return fail(new AppError(`Product ${item.productId} has insufficient stock`, 400));
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
      const orderStatus = input.paymentMethod === 'cash' ? 'placed' : 'pending';

      const [created] = await orderRepository.createWithSession(
        [
          {
            userId: input.userId,
            products: orderProducts,
            address: input.address,
            phoneNumbers: input.phoneNumbers,
            orderStatus,
            paymentMethod: input.paymentMethod,
            subTotal,
            paidAmount,
            couponId: coupon?._id,
          },
        ],
        session,
      );
      orderDB = created;

      if (coupon) {
        const userEntry = coupon.couponAssignedUsers.find(
          (u) => u.userId.toString() === input.userId.toString(),
        );
        if (userEntry) {
          userEntry.usageCount += 1;
          await coupon.save({ session });
        }
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
    if (input.paymentMethod === 'card') {
      const urlResult = await buildCheckoutUrl(
        orderDB!,
        coupon,
        input.customerEmail,
        input.host,
        input.protocol,
      );
      if (!urlResult.ok) return urlResult;
      checkoutUrl = urlResult.value;
    }

    const orderQr = await generateOrderAssets(orderDB!, {
      address: input.address,
      customerEmail: input.customerEmail,
      userName: input.userName,
    });

    return ok({ order: orderDB!, orderQr, checkoutUrl });
  }

  async handleStripeWebhook(body: Buffer, signature: string): Promise<void> {
    let event: Stripe.Event;
    try {
      event = constructWebhookEvent(body, signature);
    } catch {
      throw new AppError('Invalid webhook signature', 400);
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.metadata?.orderId;
      if (orderId) {
        await orderRepository.updateStatusByIdAndCurrentStatus(orderId, 'pending', 'confirmed');
      }
    } else if (event.type === 'checkout.session.expired') {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.metadata?.orderId;
      if (orderId) {
        const order = await orderRepository.updateStatusByIdAndCurrentStatus(
          orderId,
          'pending',
          'canceled',
        );
        if (order) {
          for (const p of order.products) {
            await productRepository.releaseStock(p.productId, p.quantity);
          }
          if (order.couponId) {
            const coupon = await couponModel.findById(order.couponId);
            if (coupon) {
              const entry = coupon.couponAssignedUsers.find(
                (u) => u.userId.toString() === order.userId.toString(),
              );
              if (entry && entry.usageCount > 0) {
                entry.usageCount -= 1;
                await coupon.save();
              }
            }
          }
        }
      }
    }
  }

  async cancelOrder(
    orderId: string,
    canceledBy: mongoose.Types.ObjectId,
    reason?: string,
  ): Promise<Result<IOrderDocument>> {
    const order = await orderRepository.findById(orderId);
    if (!order) return fail(new AppError('Order not found', 404));
    if (order.orderStatus === 'canceled') return fail(new AppError('Order already canceled', 400));
    if (['delivered', 'on_way'].includes(order.orderStatus ?? '')) {
      return fail(new AppError('Cannot cancel an order that is on the way or delivered', 400));
    }

    order.orderStatus = 'canceled';
    order.canceledBy = canceledBy as typeof order.canceledBy;
    if (reason) order.reason = reason;
    await order.save();

    for (const p of order.products) {
      await productRepository.releaseStock(p.productId, p.quantity);
    }

    if (order.couponId) {
      const coupon = await couponModel.findById(order.couponId);
      if (coupon) {
        const entry = coupon.couponAssignedUsers.find(
          (u) => u.userId.toString() === order.userId.toString(),
        );
        if (entry && entry.usageCount > 0) {
          entry.usageCount -= 1;
          await coupon.save();
        }
      }
    }

    return ok(order);
  }

  async deliverOrder(
    orderId: string,
    updatedBy: mongoose.Types.ObjectId,
  ): Promise<Result<IOrderDocument>> {
    const order = await orderRepository.findByIdWithStatusGuard(orderId, [
      'rejected',
      'pending',
      'delivered',
      'canceled',
    ]);

    // The repository method already updates to 'delivered' — but we need updatedBy
    if (!order) return fail(new AppError('Order not found or cannot be marked as delivered', 404));

    // updatedBy is set via a separate update since the guard already committed the status
    await orderRepository.updateOneFilter(
      { _id: orderId },
      { updatedBy },
    );

    return ok(order);
  }
}

export const orderService = new OrderService();
