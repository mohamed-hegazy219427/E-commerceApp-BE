import { BaseRepository } from '@repository/BaseRepository.js';
import { subCategoryModel } from '@models/subCategory.model.js';
import type { ISubCategoryDocument } from '@models/subCategory.model.js';

export class SubCategoryRepository extends BaseRepository<ISubCategoryDocument> {
  constructor() {
    super(subCategoryModel);
  }

  findByName(name: string): Promise<ISubCategoryDocument | null> {
    return this.findOne({ name });
  }

  findAllWithCategory(): Promise<ISubCategoryDocument[]> {
    return subCategoryModel.find().populate('categoryId').exec();
  }

  /** Find subCategory with its products populated (needed for cascade delete). */
  findByIdWithProducts(
    id: string,
  ): Promise<(ISubCategoryDocument & { products: { customId: string }[] }) | null> {
    return subCategoryModel
      .findByIdAndDelete(id)
      .populate<{ products: { customId: string }[] }>('products')
      .exec() as Promise<(ISubCategoryDocument & { products: { customId: string }[] }) | null>;
  }
}

export const subCategoryRepository = new SubCategoryRepository();
