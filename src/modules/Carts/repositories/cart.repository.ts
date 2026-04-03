import type { Types } from 'mongoose';
import { BaseRepository } from '@repository/BaseRepository.js';
import { cartModel } from '@models/cart.model.js';
import type { ICartDocument } from '@models/cart.model.js';

export class CartRepository extends BaseRepository<ICartDocument> {
  constructor() {
    super(cartModel);
  }

  findByUserId(userId: string | Types.ObjectId): Promise<ICartDocument | null> {
    return this.findOne({ userId });
  }

  findByUserAndProduct(
    userId: string | Types.ObjectId,
    productId: string,
  ): Promise<ICartDocument | null> {
    return this.findOne({ userId, 'products.productId': productId });
  }
}

export const cartRepository = new CartRepository();
