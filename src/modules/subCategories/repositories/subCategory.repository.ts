import { BaseRepository } from '@repository/BaseRepository.js';
import { subCategoryModel } from '@models/subCategory.model.js';
import type { ISubCategoryDocument, ISubCategory } from '@models/subCategory.model.js';

export class SubCategoryRepository extends BaseRepository<ISubCategoryDocument> {
  constructor() {
    super(subCategoryModel);
  }

  findByName(name: string): Promise<ISubCategoryDocument | null> {
    return this.findOne({ name });
  }

  findAllWithCategory(): Promise<ISubCategory[]> {
    return subCategoryModel.find().populate('categoryId').lean<ISubCategory[]>().exec();
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
