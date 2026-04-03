import type { Request, Response, NextFunction } from 'express';
import type { Types } from 'mongoose';
import { asyncHandler } from '@utils/asyncHandler.js';
import { sendSuccess } from '@utils/response.js';
import { logger } from '@services/logger.js';
import type { TypedRequest } from '@types-app/index.js';
import type {
  CreateOrderBodyDTO,
  FromCartToOrderBodyDTO,
  CancelOrderBodyDTO,
  CancelOrderParamsDTO,
  DeliverOrderParamsDTO,
} from './order.validationSchemas.js';
import { orderService } from './services/order.service.js';

//   Create Order (single product)               ─
export const createOrder = asyncHandler(
  async (_req: Request, res: Response, next: NextFunction) => {
    const req = _req as TypedRequest<CreateOrderBodyDTO>;
    const { productId, quantity, address, phoneNumbers, paymentMethod, couponCode } = req.body;

    const result = await orderService.createOrder({
      userId: req.authUser!._id as Types.ObjectId,
      productId,
      quantity,
      address,
      phoneNumbers,
      paymentMethod,
      couponCode,
      customerEmail: req.authUser!.email,
      userName: req.authUser!.userName,
      host: req.headers.host as string,
      protocol: req.protocol,
    });
    if (!result.ok) return next(result.error);

    const { order, orderQr, checkoutUrl } = result.value;
    return sendSuccess(res, { order, orderQr, checkoutUrl }, req.t.order.created, 201);
  },
);

//   From Cart to Order  ──
export const fromCartToOrder = asyncHandler(
  async (_req: Request, res: Response, next: NextFunction) => {
    const req = _req as TypedRequest<FromCartToOrderBodyDTO>;
    const { cartId, address, phoneNumbers, paymentMethod, couponCode } = req.body;

    const result = await orderService.fromCartToOrder({
      userId: req.authUser!._id as Types.ObjectId,
      cartId,
      address,
      phoneNumbers,
      paymentMethod,
      couponCode,
      customerEmail: req.authUser!.email,
      userName: req.authUser!.userName,
      host: req.headers.host as string,
      protocol: req.protocol,
    });
    if (!result.ok) return next(result.error);

    const { order, orderQr, checkoutUrl } = result.value;
    return sendSuccess(res, { order, orderQr, checkoutUrl }, req.t.order.created, 201);
  },
);

//   Stripe Webhook   ─
export const stripeWebhook = async (req: Request, res: Response): Promise<void> => {
  const sig = req.headers['stripe-signature'] as string;

  try {
    await orderService.handleStripeWebhook(req.body as Buffer, sig);
    res.status(200).json({ received: true });
  } catch (err) {
    logger.error('Stripe webhook handler error', { err });
    const statusCode = (err as { statusCode?: number }).statusCode ?? 500;
    res.status(statusCode).json({
      success: false,
      message: statusCode === 400 ? 'Invalid webhook signature' : 'Webhook processing failed',
    });
  }
};

//   Cancel Order    ─
export const cancelOrder = asyncHandler(
  async (_req: Request, res: Response, next: NextFunction) => {
    const req = _req as TypedRequest<
      CancelOrderBodyDTO,
      Record<string, string>,
      CancelOrderParamsDTO
    >;

    const result = await orderService.cancelOrder(
      req.params.orderId,
      req.authUser!._id as Types.ObjectId,
      req.body.reason,
    );
    if (!result.ok) return next(result.error);

    return sendSuccess(res, { order: result.value });
  },
);

//   Deliver Order
export const deliverOrder = asyncHandler(
  async (_req: Request, res: Response, next: NextFunction) => {
    const req = _req as TypedRequest<
      Record<string, never>,
      Record<string, string>,
      DeliverOrderParamsDTO
    >;

    const result = await orderService.deliverOrder(
      req.params.orderId,
      req.authUser!._id as Types.ObjectId,
    );
    if (!result.ok) return next(result.error);

    return sendSuccess(res, { order: result.value }, req.t.order.delivered);
  },
);
