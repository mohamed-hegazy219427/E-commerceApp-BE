import type { Types } from 'mongoose';
import { couponModel } from '@models/coupon.model.js';

interface CouponValidationResult {
  valid: true;
} | {
  valid: false;
  msg: string;
}

// TypeScript union — simplified below for readability:
type CouponValidResult = { valid: true } | { valid: false; msg: string };

export const isCouponValid = async ({
  couponCode,
  userId,
}: {
  couponCode: string;
  userId: Types.ObjectId;
}): Promise<CouponValidResult> => {
  const coupon = await couponModel.findOne({ couponCode });

  if (!coupon) return { valid: false, msg: 'Invalid coupon code' };

  const now = new Date();

  if (coupon.couponStatus === 'Expired' || coupon.toDate < now) {
    return { valid: false, msg: 'Coupon has expired' };
  }

  if (coupon.fromDate > now) {
    return { valid: false, msg: "Coupon hasn't started yet" };
  }

  if (!coupon.couponAssignedUsers.length) {
    return { valid: false, msg: 'No assigned users for this coupon' };
  }

  const assignedUser = coupon.couponAssignedUsers.find(
    (u) => u.userId.toString() === userId.toString(),
  );

  if (!assignedUser) {
    return { valid: false, msg: 'You are not assigned to this coupon' };
  }

  if (assignedUser.usageCount >= assignedUser.maxUsage) {
    return { valid: false, msg: 'Exceeded maximum coupon usage' };
  }

  return { valid: true };
};
