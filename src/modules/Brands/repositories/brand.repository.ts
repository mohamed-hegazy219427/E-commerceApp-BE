import { BaseRepository } from '@repository/BaseRepository.js';
import { brandModel } from '@models/brand.model.js';
import type { IBrandDocument } from '@models/brand.model.js';

export class BrandRepository extends BaseRepository<IBrandDocument> {
  constructor() {
    super(brandModel);
  }

  findByName(name: string): Promise<IBrandDocument | null> {
    return this.findOne({ name });
  }

  /** Find brand with its virtual products populated (needed for cascade delete). */
  findByIdWithProducts(
    id: string,
  ): Promise<(IBrandDocument & { products: { customId: string }[] }) | null> {
    return brandModel
      .findByIdAndDelete(id)
      .populate<{ products: { customId: string }[] }>('products')
      .exec() as Promise<(IBrandDocument & { products: { customId: string }[] }) | null>;
  }
}

export const brandRepository = new BrandRepository();
