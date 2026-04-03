import type { Request, Response, NextFunction } from 'express';
import type { Types } from 'mongoose';
import { asyncHandler } from '@utils/asyncHandler.js';
import { sendSuccess } from '@utils/response.js';
import type { TypedRequest } from '@types-app/index.js';
import type {
  AddCouponBodyDTO,
  DeleteCouponQueryDTO,
  AssignUserBodyDTO,
  AssignUserQueryDTO,
} from './coupon.validationSchemas.js';
import { couponService } from './services/coupon.service.js';

export const addCoupon = asyncHandler(async (_req: Request, res: Response, next: NextFunction) => {
  const req = _req as TypedRequest<AddCouponBodyDTO>;
  const { couponCode, couponAmount, isPercentage, isFixedAmount, fromDate, toDate } = req.body;

  const result = await couponService.createCoupon({
    couponCode,
    couponAmount,
    isPercentage,
    isFixedAmount,
    fromDate,
    toDate,
    createdBy: req.authUser!._id as Types.ObjectId,
  });
  if (!result.ok) return next(result.error);

  return sendSuccess(res, { coupon: result.value }, req.t.done, 201);
});

export const deleteCoupon = asyncHandler(
  async (_req: Request, res: Response, next: NextFunction) => {
    const req = _req as TypedRequest<Record<string, never>, DeleteCouponQueryDTO>;

    const result = await couponService.deleteCoupon(
      req.query.couponId,
      req.authUser!._id as Types.ObjectId,
    );
    if (!result.ok) return next(result.error);

    return sendSuccess(res, { coupon: result.value });
  },
);

export const assignUserToCoupon = asyncHandler(
  async (_req: Request, res: Response, next: NextFunction) => {
    const req = _req as TypedRequest<AssignUserBodyDTO, AssignUserQueryDTO>;

    const result = await couponService.assignUser(
      req.query.couponId,
      req.body.userId,
      req.body.maxUsage,
    );
    if (!result.ok) return next(result.error);

    return sendSuccess(res, { coupon: result.value });
  },
);
