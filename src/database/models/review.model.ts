import mongoose, { Schema, model, type Model, type HydratedDocument, type Types } from 'mongoose';
import { productModel } from './product.model.js';

export interface IReview {
  userId: Types.ObjectId;
  productId: Types.ObjectId;
  comment?: string;
  rate: 1 | 2 | 3 | 4 | 5;
}

export type IReviewDocument = HydratedDocument<IReview>;

const reviewSchema = new Schema<IReview>(
  {
    userId: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
    productId: { type: Schema.Types.ObjectId, required: true, ref: 'Product' },
    comment: String,
    rate: { type: Number, required: true, enum: [1, 2, 3, 4, 5], min: 1, max: 5 },
  },
  { timestamps: true },
);

reviewSchema.index({ productId: 1, userId: 1 }, { unique: true });

// Recalculate product ratings after each save/delete
const updateProductRatings = async (productId: Types.ObjectId): Promise<void> => {
  const stats = await reviewModel.aggregate([
    { $match: { productId } },
    { $group: { _id: '$productId', avg: { $avg: '$rate' }, count: { $sum: 1 } } },
  ]);
  if (stats.length) {
    await productModel.findByIdAndUpdate(productId, {
      totalRates: +stats[0].avg.toFixed(2),
      ratingsCount: stats[0].count,
    });
  } else {
    await productModel.findByIdAndUpdate(productId, { totalRates: 0, ratingsCount: 0 });
  }
};

reviewSchema.post('save', async (doc: IReviewDocument) => {
  await updateProductRatings(doc.productId);
});

reviewSchema.post('findOneAndDelete', async (doc: IReviewDocument | null) => {
  if (doc) await updateProductRatings(doc.productId);
});

export const reviewModel: Model<IReview> =
  (mongoose.models.Review as Model<IReview>) ?? model<IReview>('Review', reviewSchema);

export default reviewModel;
