import type { Types } from 'mongoose';
import { couponModel } from '@models/coupon.model.js';
import type { ICouponDocument } from '@models/coupon.model.js';
import type { Result } from './result.js';
import { ok, fail } from './result.js';
import { AppError } from './AppError.js';

//   isCouponValid    ─
// Returns Result<ICouponDocument> so callers get the document on success
// and an AppError (ready to pass to next()) on failure — no double-fetch needed.
//
//   const result = await isCouponValid({ couponCode, userId })
//   if (!result.ok) return next(result.error)
//   const coupon = result.value   // ICouponDocument, fully typed
//
export const isCouponValid = async ({
  couponCode,
  userId,
}: {
  couponCode: string;
  userId: Types.ObjectId;
}): Promise<Result<ICouponDocument>> => {
  const coupon = await couponModel.findOne({ couponCode });

  if (!coupon) return fail(new AppError('Invalid coupon code', 400));

  const now = new Date();

  if (coupon.couponStatus === 'Expired' || coupon.toDate < now) {
    return fail(new AppError('Coupon has expired', 400));
  }

  if (coupon.fromDate > now) {
    return fail(new AppError("Coupon hasn't started yet", 400));
  }

  if (!coupon.couponAssignedUsers.length) {
    return fail(new AppError('No assigned users for this coupon', 400));
  }

  const assignedUser = coupon.couponAssignedUsers.find(
    (u) => u.userId.toString() === userId.toString(),
  );

  if (!assignedUser) {
    return fail(new AppError('You are not assigned to this coupon', 400));
  }

  if (assignedUser.usageCount >= assignedUser.maxUsage) {
    return fail(new AppError('Exceeded maximum coupon usage', 400));
  }

  return ok(coupon);
};
