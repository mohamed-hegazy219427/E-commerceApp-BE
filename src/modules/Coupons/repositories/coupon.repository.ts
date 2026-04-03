import type { Types } from 'mongoose';
import { BaseRepository } from '@repository/BaseRepository.js';
import { couponModel } from '@models/coupon.model.js';
import type { ICouponDocument } from '@models/coupon.model.js';

export class CouponRepository extends BaseRepository<ICouponDocument> {
  constructor() {
    super(couponModel);
  }

  findByCode(couponCode: string): Promise<ICouponDocument | null> {
    return this.findOne({ couponCode });
  }

  findByIdAndOwner(couponId: string, createdBy: Types.ObjectId): Promise<ICouponDocument | null> {
    return couponModel.findOneAndDelete({ _id: couponId, createdBy }).exec();
  }
}

export const couponRepository = new CouponRepository();
