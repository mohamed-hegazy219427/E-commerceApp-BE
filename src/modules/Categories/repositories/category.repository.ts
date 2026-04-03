import { BaseRepository } from '@repository/BaseRepository.js';
import { categoryModel } from '@models/category.model.js';
import type { ICategoryDocument } from '@models/category.model.js';

export class CategoryRepository extends BaseRepository<ICategoryDocument> {
  constructor() {
    super(categoryModel);
  }

  findByName(name: string): Promise<ICategoryDocument | null> {
    return this.findOne({ name });
  }

  /** Returns all categories with their subCategories and products populated. */
  findAllPopulated(): Promise<ICategoryDocument[]> {
    return categoryModel
      .find()
      .populate([{ path: 'subCategories', populate: [{ path: 'products' }] }])
      .exec();
  }

  /** Find category with virtual relations populated (needed for cascade delete). */
  findByIdWithRelations(id: string): Promise<
    | (ICategoryDocument & {
        subCategories: { customId: string }[];
        products: { customId: string }[];
      })
    | null
  > {
    return categoryModel
      .findByIdAndDelete(id)
      .populate<{ subCategories: { customId: string }[] }>('subCategories')
      .populate<{ products: { customId: string }[] }>('products')
      .exec() as Promise<
      | (ICategoryDocument & {
          subCategories: { customId: string }[];
          products: { customId: string }[];
        })
      | null
    >;
  }
}

export const categoryRepository = new CategoryRepository();
