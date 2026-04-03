import type { ClientSession, Types } from 'mongoose';
import { BaseRepository } from '@repository/BaseRepository.js';
import { productModel } from '@models/product.model.js';
import type { IProductDocument } from '@models/product.model.js';

export class ProductRepository extends BaseRepository<IProductDocument> {
  constructor() {
    super(productModel);
  }

  findByTitleRegex(title: string): Promise<IProductDocument[]> {
    const safe = title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return this.find({ title: { $regex: safe, $options: 'i' } });
  }

  /**
   * Atomically decrements stock by quantity only if stock >= quantity.
   * Returns null if product not found or insufficient stock.
   */
  reserveStock(
    productId: string | Types.ObjectId,
    quantity: number,
    session: ClientSession,
  ): Promise<IProductDocument | null> {
    return productModel
      .findOneAndUpdate(
        { _id: productId, stock: { $gte: quantity } },
        { $inc: { stock: -quantity } },
        { new: true, session },
      )
      .exec();
  }

  /** Restores stock after cancellation or failed payment. */
  releaseStock(productId: string | Types.ObjectId, quantity: number): Promise<IProductDocument | null> {
    return this.updateById(String(productId), { $inc: { stock: quantity } });
  }

  findAllPaginated(
    limit: number,
    skip: number,
  ): Promise<IProductDocument[]> {
    return productModel.find().limit(limit).skip(skip).populate('Reviews').exec();
  }
}

export const productRepository = new ProductRepository();
