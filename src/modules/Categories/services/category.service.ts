import slugify from 'slugify';
import type { Types } from 'mongoose';
import { ok, fail } from '@utils/result.js';
import { AppError } from '@utils/AppError.js';
import type { Result } from '@utils/result.js';
import type { ICategoryDocument } from '@models/category.model.js';
import { subCategoryModel } from '@models/subCategory.model.js';
import { productModel } from '@models/product.model.js';
import { categoryRepository } from '../repositories/category.repository.js';

export interface CreateCategoryInput {
  name: string;
  image: { secure_url: string; public_id: string };
  customId: string;
  createdBy: Types.ObjectId;
}

export interface UpdateCategoryInput {
  name?: string;
  image?: { secure_url: string; public_id: string };
}

export interface CategoryWithRelations extends ICategoryDocument {
  subCategories: { customId: string }[];
  products: { customId: string }[];
}

const toSlug = (name: string) =>
  slugify(name, { trim: true, replacement: '_', lower: true });

class CategoryService {
  getAllCategories(): Promise<ICategoryDocument[]> {
    return categoryRepository.findAllPopulated();
  }

  async createCategory(input: CreateCategoryInput): Promise<Result<ICategoryDocument>> {
    if (await categoryRepository.findByName(input.name)) {
      return fail(new AppError('Category name already exists', 409));
    }

    const category = await categoryRepository.create({
      name: input.name,
      slug: toSlug(input.name),
      customId: input.customId,
      image: input.image,
      createdBy: input.createdBy,
    });

    return ok(category);
  }

  async findById(categoryId: string): Promise<Result<ICategoryDocument>> {
    const category = await categoryRepository.findById(categoryId);
    if (!category) return fail(new AppError('Category not found', 404));
    return ok(category);
  }

  /** Updates name/slug and/or image. Caller handles cloudinary upload before calling. */
  async updateCategory(
    category: ICategoryDocument,
    input: UpdateCategoryInput,
  ): Promise<Result<ICategoryDocument>> {
    if (input.name) {
      if (category.name === input.name.toLowerCase()) {
        return fail(new AppError('New name is the same as the current name', 400));
      }
      if (await categoryRepository.findByName(input.name)) {
        return fail(new AppError('Category name already exists', 409));
      }
      category.name = input.name;
      category.slug = toSlug(input.name);
    }

    if (input.image) {
      category.image = input.image;
    }

    await category.save();
    return ok(category);
  }

  /**
   * Hard-deletes the category along with its subCategories and products.
   * Returns the deleted doc (with relations populated) so caller can clean up Cloudinary.
   */
  async deleteCategory(categoryId: string): Promise<Result<CategoryWithRelations>> {
    const category = await categoryRepository.findByIdWithRelations(categoryId);
    if (!category) return fail(new AppError('Category not found', 404));

    if (category.subCategories.length) {
      await subCategoryModel.deleteMany({ categoryId });
    }

    if (category.products.length) {
      await productModel.deleteMany({ categoryId });
    }

    return ok(category as CategoryWithRelations);
  }
}

export const categoryService = new CategoryService();
