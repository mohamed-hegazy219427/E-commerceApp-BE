import mongoose, { Schema, model, type Model, type HydratedDocument, type Types } from 'mongoose';

export interface ICouponAssignedUser {
  userId: Types.ObjectId;
  maxUsage: number;
  usageCount: number;
}

export interface ICoupon {
  couponCode: string;
  couponAmount: number;
  isPercentage: boolean;
  isFixedAmount: boolean;
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  couponAssignedUsers: ICouponAssignedUser[];
  fromDate: Date;
  toDate: Date;
  couponStatus: 'Expired' | 'Valid';
  isDeleted: boolean;
  deletedAt?: Date;
}

export type ICouponDocument = HydratedDocument<ICoupon>;

const couponSchema = new Schema<ICoupon>(
  {
    couponCode: { type: String, required: true, unique: true, lowercase: true, trim: true },
    couponAmount: { type: Number, required: true, min: 1 },
    isPercentage: { type: Boolean, required: true, default: false },
    isFixedAmount: { type: Boolean, required: true, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    couponAssignedUsers: [
      {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        maxUsage: { type: Number, required: true, default: 1, min: 1 },
        usageCount: { type: Number, required: true, default: 0, min: 0 },
      },
    ],
    fromDate: { type: Date, required: true },
    toDate: { type: Date, required: true },
    couponStatus: { type: String, required: true, enum: ['Expired', 'Valid'], default: 'Valid' },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

couponSchema.index({ couponCode: 1 }, { unique: true });
couponSchema.index({ couponStatus: 1, toDate: 1 });
couponSchema.index({ isDeleted: 1 });

couponSchema.pre(/^find/, function (this: mongoose.Query<unknown, unknown>) {
  this.where({ isDeleted: { $ne: true } });
});

export const couponModel: Model<ICoupon> =
  (mongoose.models.Coupon as Model<ICoupon>) ?? model<ICoupon>('Coupon', couponSchema);
