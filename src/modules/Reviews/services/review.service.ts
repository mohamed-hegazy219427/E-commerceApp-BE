import type { Types } from 'mongoose';
import { ok, fail } from '@utils/result.js';
import { AppError } from '@utils/AppError.js';
import type { Result } from '@utils/result.js';
import type { IReviewDocument } from '@models/review.model.js';
import { productRepository } from '../../Products/repositories/product.repository.js';
import { orderRepository } from '../../Orders/repositories/order.repository.js';
import { reviewRepository } from '../repositories/review.repository.js';
import { reviewModel, type IReview } from '@models/review.model.js';
import { cursorPaginate, type CursorPage } from '@utils/cursorPagination.js';


class ReviewService {
  async addReview(
    userId: Types.ObjectId,
    productId: string,
    comment: string | undefined,
    rate: 1 | 2 | 3 | 4 | 5,
  ): Promise<Result<{ review: IReviewDocument }>> {
    const product = await productRepository.findById(productId);
    if (!product) return fail(new AppError('Product not found', 404));

    const hasBought = await orderRepository.findOne({
      userId,
      'products.productId': productId,
    });
    if (!hasBought) {
      return fail(new AppError('You must purchase this product before reviewing it', 403));
    }

    const review = await reviewRepository.create({ userId, productId, comment, rate });
    return ok({ review });
  }

  async getReviews(productId: string, limit: number, cursor?: string): Promise<CursorPage<IReview>> {
    return cursorPaginate<IReview>(reviewModel, { productId }, limit, cursor);
  }
}

export const reviewService = new ReviewService();
