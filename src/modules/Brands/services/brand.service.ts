import type { Types } from 'mongoose';
import { ok, fail } from '@utils/result.js';
import { AppError } from '@utils/AppError.js';
import createSlug from '@utils/slugGenerator.js';
import type { Result } from '@utils/result.js';
import type { IBrandDocument } from '@models/brand.model.js';
import { productModel } from '@models/product.model.js';
import { categoryModel } from '@models/category.model.js';
import { subCategoryModel } from '@models/subCategory.model.js';
import { brandRepository } from '../repositories/brand.repository.js';
import { cacheService } from '@services/cache.service.js';


export interface CreateBrandInput {
  name: string;
  logo: { secure_url: string; public_id: string };
  customId: string;
  addBy: Types.ObjectId;
}

export interface UpdateBrandInput {
  name?: string;
  logo?: { secure_url: string; public_id: string };
}

export interface BrandWithProducts extends IBrandDocument {
  products: { customId: string }[];
}

class BrandService {
  /** Checks name uniqueness and creates the brand DB record. */
  async createBrand(input: CreateBrandInput): Promise<Result<IBrandDocument>> {
    if (await brandRepository.findByName(input.name)) {
      return fail(new AppError('Brand name already exists', 409));
    }

    const brand = await brandRepository.create({
      name: input.name,
      slug: createSlug(input.name),
      customId: input.customId,
      logo: input.logo,
      addBy: input.addBy,
    });

    return ok(brand);
  }

  /** Returns a brand by id. */
  async findById(brandId: string): Promise<Result<IBrandDocument>> {
    const brand = await brandRepository.findById(brandId);
    if (!brand) return fail(new AppError('Brand not found', 404));
    return ok(brand);
  }

  /** Updates name/slug and/or logo. Caller handles cloudinary upload before calling. */
  async updateBrand(
    brand: IBrandDocument,
    input: UpdateBrandInput,
  ): Promise<Result<IBrandDocument>> {
    if (input.name) {
      if (await brandRepository.findByName(input.name)) {
        return fail(new AppError('Brand name already exists', 409));
      }
      brand.name = input.name;
      brand.slug = createSlug(input.name);
    }

    if (input.logo) {
      brand.logo = input.logo;
    }

    await brand.save();
    return ok(brand);
  }

  /**
   * Hard-deletes the brand. Returns the deleted doc (with products populated)
   * so the caller (controller) can clean up Cloudinary.
   */
  async deleteBrand(brandId: string): Promise<Result<BrandWithProducts>> {
    const brand = await brandRepository.findByIdWithProducts(brandId);
    if (!brand) return fail(new AppError('Brand not found', 404));

    if (brand.products.length) {
      await productModel.deleteMany({ brandId });
    }

    return ok(brand as BrandWithProducts);
  }

  /** Returns unique brands associated with a given categoryId via its products. */
  async getBrandsByCategoryId(categoryId: string): Promise<Result<unknown[]>> {
    const cacheKey = `brands:cat:${categoryId}`;
    const cached = await cacheService.get<unknown[]>(cacheKey);
    if (cached) return ok(cached);

    if (!(await categoryModel.findById(categoryId))) {
      return fail(new AppError('Category not found', 404));
    }
    const products = await productModel.find({ categoryId }).select('brandId').populate('brandId');
    const brands = [...new Map(products.map((p: any) => [String(p.brandId), p.brandId])).values()];
    
    await cacheService.set(cacheKey, brands, 300);
    return ok(brands);
  }

  /** Returns unique brands associated with a given subCategoryId via its products. */
  async getBrandsBySubCategoryId(subCategoryId: string): Promise<Result<unknown[]>> {
    const cacheKey = `brands:subcat:${subCategoryId}`;
    const cached = await cacheService.get<unknown[]>(cacheKey);
    if (cached) return ok(cached);

    if (!(await subCategoryModel.findById(subCategoryId))) {
      return fail(new AppError('SubCategory not found', 404));
    }
    const products = await productModel
      .find({ subCategoryId })
      .select('brandId')
      .populate('brandId');
    const brands = [...new Map(products.map((p: any) => [String(p.brandId), p.brandId])).values()];
    
    await cacheService.set(cacheKey, brands, 300);
    return ok(brands);
  }
}

export const brandService = new BrandService();
