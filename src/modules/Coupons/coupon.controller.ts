import type { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { couponModel } from '@models/coupon.model.js';
import { asyncHandler } from '@utils/asyncHandler.js';
import { sendSuccess } from '@utils/response.js';
import { AppError } from '@utils/AppError.js';
import type { TypedRequest } from '@types-app/index.js';
import type {
  AddCouponBodyDTO,
  DeleteCouponQueryDTO,
  AssignUserBodyDTO,
  AssignUserQueryDTO,
} from './coupon.validationSchemas.js';

export const addCoupon = asyncHandler(async (_req: Request, res: Response, next: NextFunction) => {
  const req = _req as TypedRequest<AddCouponBodyDTO>;
  const { couponCode, couponAmount, isPercentage, isFixedAmount, fromDate, toDate } = req.body;

  if (await couponModel.findOne({ couponCode })) {
    return next(new AppError(req.t.coupon.duplicateCode, 409));
  }
  if ((!isFixedAmount && !isPercentage) || (isFixedAmount && isPercentage)) {
    return next(new AppError(req.t.coupon.selectType, 400));
  }

  const coupon = await couponModel.create({
    couponCode,
    couponAmount,
    isPercentage,
    isFixedAmount,
    fromDate,
    toDate,
    createdBy: req.authUser!._id,
  });

  return sendSuccess(res, { coupon }, req.t.done, 201);
});

export const deleteCoupon = asyncHandler(
  async (_req: Request, res: Response, next: NextFunction) => {
    const req = _req as TypedRequest<Record<string, never>, DeleteCouponQueryDTO>;
    const { couponId } = req.query;

    const coupon = await couponModel.findOneAndDelete({
      _id: couponId,
      createdBy: req.authUser!._id,
    });
    if (!coupon) return next(new AppError(req.t.coupon.notFound, 404));
    return sendSuccess(res, { coupon });
  },
);

export const assignUserToCoupon = asyncHandler(
  async (_req: Request, res: Response, next: NextFunction) => {
    const req = _req as TypedRequest<AssignUserBodyDTO, AssignUserQueryDTO>;
    const { couponId } = req.query;
    const { userId, maxUsage } = req.body;

    const coupon = await couponModel.findById(couponId);
    if (!coupon) return next(new AppError(req.t.coupon.notFound, 404));

    const alreadyAssigned = coupon.couponAssignedUsers.some((u) => u.userId.toString() === userId);
    if (alreadyAssigned) return next(new AppError('User already assigned to this coupon', 409));

    coupon.couponAssignedUsers.push({
      userId: new Types.ObjectId(userId),
      maxUsage,
      usageCount: 0,
    });
    await coupon.save();

    return sendSuccess(res, { coupon });
  },
);
