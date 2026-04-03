import type { Types } from 'mongoose';
import { BaseRepository } from '@repository/BaseRepository.js';
import { reviewModel } from '@models/review.model.js';
import type { IReviewDocument } from '@models/review.model.js';

export class ReviewRepository extends BaseRepository<IReviewDocument> {
  constructor() {
    super(reviewModel);
  }

  findByProductAndUser(
    productId: string | Types.ObjectId,
    userId: string | Types.ObjectId,
  ): Promise<IReviewDocument | null> {
    return this.findOne({ productId, userId });
  }

  findByProduct(productId: string | Types.ObjectId): Promise<IReviewDocument[]> {
    return this.find({ productId });
  }
}

export const reviewRepository = new ReviewRepository();
