import type { Request, Response, NextFunction } from 'express';
import type { Types } from 'mongoose';
import { asyncHandler } from '@utils/asyncHandler.js';
import { sendSuccess } from '@utils/response.js';
import type { TypedRequest } from '@types-app/index.js';
import type { AddReviewBodyDTO } from './review.validationSchemas.js';
import { reviewService } from './services/review.service.js';

export const addReview = asyncHandler(async (_req: Request, res: Response, next: NextFunction) => {
  const req = _req as TypedRequest<AddReviewBodyDTO>;

  const result = await reviewService.addReview(
    req.authUser!._id as Types.ObjectId,
    req.body.productId,
    req.body.comment,
    req.body.rate,
  );
  if (!result.ok) return next(result.error);

  return sendSuccess(res, result.value, req.t.review.added);
});
