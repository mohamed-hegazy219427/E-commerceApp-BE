import type { Request, Response, NextFunction } from 'express';
import type { Types } from 'mongoose';
import { asyncHandler } from '@utils/asyncHandler.js';
import { sendSuccess } from '@utils/response.js';
import type { TypedRequest } from '@types-app/index.js';
import type { AddToCartBodyDTO, DeleteFromCartBodyDTO } from './cart.validationSchemas.js';
import { cartService } from './services/cart.service.js';

export const addToCart = asyncHandler(async (_req: Request, res: Response, next: NextFunction) => {
  const req = _req as TypedRequest<AddToCartBodyDTO>;

  const result = await cartService.addToCart(
    req.authUser!._id as Types.ObjectId,
    req.body.productId,
    req.body.quantity,
  );
  if (!result.ok) return next(result.error);

  return sendSuccess(res, { cart: result.value });
});

export const deleteFromCart = asyncHandler(
  async (_req: Request, res: Response, next: NextFunction) => {
    const req = _req as TypedRequest<DeleteFromCartBodyDTO>;

    const result = await cartService.deleteFromCart(
      req.authUser!._id as Types.ObjectId,
      req.body.productId,
    );
    if (!result.ok) return next(result.error);

    return sendSuccess(res, { cart: result.value });
  },
);

export const clearCart = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const result = await cartService.clearCart(req.authUser!._id as Types.ObjectId);
  if (!result.ok) return next(result.error);

  return sendSuccess(res, { cart: result.value });
});
