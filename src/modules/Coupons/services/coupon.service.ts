import { Types } from 'mongoose';
import { ok, fail } from '@utils/result.js';
import { AppError } from '@utils/AppError.js';
import type { Result } from '@utils/result.js';
import type { ICouponDocument } from '@models/coupon.model.js';
import { couponRepository } from '../repositories/coupon.repository.js';

export interface CreateCouponInput {
  couponCode: string;
  couponAmount: number;
  isPercentage: boolean;
  isFixedAmount: boolean;
  fromDate: Date;
  toDate: Date;
  createdBy: Types.ObjectId;
}

class CouponService {
  async createCoupon(input: CreateCouponInput): Promise<Result<ICouponDocument>> {
    if (await couponRepository.findByCode(input.couponCode)) {
      return fail(new AppError('Coupon code already exists', 409));
    }
    if ((!input.isFixedAmount && !input.isPercentage) || (input.isFixedAmount && input.isPercentage)) {
      return fail(new AppError('Select exactly one discount type: percentage or fixed amount', 400));
    }

    const coupon = await couponRepository.create(input);
    return ok(coupon);
  }

  async deleteCoupon(couponId: string, createdBy: Types.ObjectId): Promise<Result<ICouponDocument>> {
    const coupon = await couponRepository.findByIdAndOwner(couponId, createdBy);
    if (!coupon) return fail(new AppError('Coupon not found or unauthorized', 404));
    return ok(coupon);
  }

  async assignUser(
    couponId: string,
    userId: string,
    maxUsage: number,
  ): Promise<Result<ICouponDocument>> {
    const coupon = await couponRepository.findById(couponId);
    if (!coupon) return fail(new AppError('Coupon not found', 404));

    const alreadyAssigned = coupon.couponAssignedUsers.some(
      (u) => u.userId.toString() === userId,
    );
    if (alreadyAssigned) return fail(new AppError('User already assigned to this coupon', 409));

    coupon.couponAssignedUsers.push({
      userId: new Types.ObjectId(userId),
      maxUsage,
      usageCount: 0,
    });
    await coupon.save();
    return ok(coupon);
  }
}

export const couponService = new CouponService();
