import type { Request, Response, NextFunction } from 'express';
import { couponModel } from '@models/coupon.model.js';
import { asyncHandler } from '@utils/asyncHandler.js';
import { sendSuccess } from '@utils/response.js';
import { AppError } from '@utils/AppError.js';

export const addCoupon = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { couponCode, couponAmount, isPercentage, isFixedAmount, fromDate, toDate } =
    req.body as {
      couponCode: string;
      couponAmount: number;
      isPercentage: boolean;
      isFixedAmount: boolean;
      fromDate: string;
      toDate: string;
    };

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
    fromDate: new Date(fromDate),
    toDate: new Date(toDate),
    createdBy: req.authUser!._id,
  });

  return sendSuccess(res, { coupon }, req.t.done, 201);
});

export const deleteCoupon = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { couponId } = req.query as { couponId: string };
  const coupon = await couponModel.findOneAndDelete({ _id: couponId, createdBy: req.authUser!._id });
  if (!coupon) return next(new AppError(req.t.coupon.notFound, 404));
  return sendSuccess(res, { coupon });
});

export const assignUserToCoupon = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { couponId } = req.query as { couponId: string };
  const { userId, maxUsage } = req.body as { userId: string; maxUsage: number };

  const coupon = await couponModel.findById(couponId);
  if (!coupon) return next(new AppError(req.t.coupon.notFound, 404));

  const alreadyAssigned = coupon.couponAssignedUsers.some((u) => u.userId.toString() === userId);
  if (alreadyAssigned) return next(new AppError('User already assigned to this coupon', 409));

  coupon.couponAssignedUsers.push({ userId: userId as unknown as typeof coupon.couponAssignedUsers[0]['userId'], maxUsage, usageCount: 0 });
  await coupon.save();

  return sendSuccess(res, { coupon });
});
