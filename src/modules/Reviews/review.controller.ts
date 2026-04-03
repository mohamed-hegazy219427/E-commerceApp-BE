import type { Request, Response, NextFunction } from 'express';
import { productModel } from '@models/product.model.js';
import { orderModel } from '@models/order.model.js';
import reviewModel from '@models/review.model.js';
import { asyncHandler } from '@utils/asyncHandler.js';
import { sendSuccess } from '@utils/response.js';
import { AppError } from '@utils/AppError.js';
import type { TypedRequest } from '@types-app/index.js';
import type { AddReviewBodyDTO } from './review.validationSchemas.js';

export const addReview = asyncHandler(async (_req: Request, res: Response, next: NextFunction) => {
  const req = _req as TypedRequest<AddReviewBodyDTO>;
  const userId = req.authUser!._id;
  const { productId, comment, rate } = req.body;

  const product = await productModel.findById(productId);
  if (!product) return next(new AppError(req.t.review.notFound, 404));

  const hasBought = await orderModel.findOne({ userId, 'products.productId': productId });
  if (!hasBought) return next(new AppError(req.t.review.buyFirst, 403));

  const review = await reviewModel.create({ userId, productId, comment, rate });

  return sendSuccess(res, { review, product }, req.t.review.added);
});
