import slugify from 'slugify';
import type { Types } from 'mongoose';
import { ok, fail } from '@utils/result.js';
import { AppError } from '@utils/AppError.js';
import type { Result } from '@utils/result.js';
import type { ISubCategoryDocument } from '@models/subCategory.model.js';
import { productModel } from '@models/product.model.js';
import { categoryRepository } from '../../Categories/repositories/category.repository.js';
import { subCategoryRepository } from '../repositories/subCategory.repository.js';

export interface CreateSubCategoryInput {
  name: string;
  categoryId: string;
  image: { secure_url: string; public_id: string };
  customId: string;
  createdBy: Types.ObjectId;
}

export interface UpdateSubCategoryInput {
  name?: string;
  image?: { secure_url: string; public_id: string };
}

export interface SubCategoryWithProducts extends ISubCategoryDocument {
  products: { customId: string }[];
}

const toSlug = (name: string) =>
  slugify(name, { lower: true, trim: true, replacement: '_' });

class SubCategoryService {
  getAllSubCategories(): Promise<ISubCategoryDocument[]> {
    return subCategoryRepository.findAllWithCategory();
  }

  async createSubCategory(input: CreateSubCategoryInput): Promise<Result<ISubCategoryDocument>> {
    const category = await categoryRepository.findById(input.categoryId);
    if (!category) return fail(new AppError('Category not found', 404));

    if (await subCategoryRepository.findByName(input.name)) {
      return fail(new AppError('SubCategory name already exists', 409));
    }

    const subCategory = await subCategoryRepository.create({
      name: input.name,
      slug: toSlug(input.name),
      image: input.image,
      customId: input.customId,
      categoryId: input.categoryId,
      createdBy: input.createdBy,
    });

    return ok(subCategory);
  }

  /** Returns the category's customId along with the subCategory (needed for upload path). */
  async findByIdWithCategory(
    subCategoryId: string,
  ): Promise<Result<{ subCategory: ISubCategoryDocument; categoryCustomId: string }>> {
    const subCategory = await subCategoryRepository.findById(subCategoryId);
    if (!subCategory) return fail(new AppError('SubCategory not found', 404));

    const category = await categoryRepository.findById(String(subCategory.categoryId));
    if (!category) return fail(new AppError('Parent category not found', 404));

    return ok({ subCategory, categoryCustomId: category.customId });
  }

  async updateSubCategory(
    subCategory: ISubCategoryDocument,
    input: UpdateSubCategoryInput,
  ): Promise<Result<ISubCategoryDocument>> {
    if (input.name) {
      if (subCategory.name === input.name.toLowerCase()) {
        return fail(new AppError('New name is the same as the current name', 400));
      }
      if (await subCategoryRepository.findByName(input.name)) {
        return fail(new AppError('SubCategory name already exists', 409));
      }
      subCategory.name = input.name;
      subCategory.slug = toSlug(input.name);
    }

    if (input.image) {
      subCategory.image = input.image;
    }

    await subCategory.save();
    return ok(subCategory);
  }

  /**
   * Hard-deletes the subCategory and its products.
   * Returns the deleted doc (with products populated) and the parent category's customId
   * so the caller can clean up Cloudinary.
   */
  async deleteSubCategory(subCategoryId: string): Promise<
    Result<{
      subCategory: SubCategoryWithProducts;
      categoryCustomId: string;
    }>
  > {
    const subCategory = await subCategoryRepository.findByIdWithProducts(subCategoryId);
    if (!subCategory) return fail(new AppError('SubCategory not found', 404));

    const category = await categoryRepository.findById(String(subCategory.categoryId));
    if (!category) return fail(new AppError('Parent category not found', 404));

    if (subCategory.products.length) {
      await productModel.deleteMany({ subCategoryId });
    }

    return ok({
      subCategory: subCategory as SubCategoryWithProducts,
      categoryCustomId: category.customId,
    });
  }
}

export const subCategoryService = new SubCategoryService();
