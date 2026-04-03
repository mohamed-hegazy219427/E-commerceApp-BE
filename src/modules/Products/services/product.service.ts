import { Types } from 'mongoose';
import { ok, fail } from '@utils/result.js';
import { AppError } from '@utils/AppError.js';
import createSlug from '@utils/slugGenerator.js';
import { paginationFunction, buildPaginationMeta } from '@utils/pagination.js';
import { ApiFeature } from '@utils/apiFeature.js';
import { productModel } from '@models/product.model.js';
import type { Result } from '@utils/result.js';
import type { IProductDocument } from '@models/product.model.js';
import type { PaginationMeta } from '@types-app/index.js';
import { subCategoryRepository } from '../../subCategories/repositories/subCategory.repository.js';
import { brandRepository } from '../../Brands/repositories/brand.repository.js';
import { productRepository } from '../repositories/product.repository.js';

interface PopulatedWithId {
  categoryId: { _id: Types.ObjectId };
}

export interface CreateProductInput {
  title: string;
  desc?: string;
  price: number;
  appliedDiscount?: number;
  colors?: string[];
  sizes?: string[];
  stock: number;
  brandId: string;
  subCategoryId: string;
  images: { secure_url: string; public_id: string }[];
  customId: string;
  createdBy: Types.ObjectId;
}

export interface UpdateProductInput {
  title?: string;
  desc?: string;
  price?: number;
  appliedDiscount?: number;
  colors?: string[];
  sizes?: string[];
  stock?: number;
  newBrandId?: string;
  newSubCategoryId?: string;
  images?: { secure_url: string; public_id: string }[];
  updatedBy?: Types.ObjectId;
}

export interface ProductListResult {
  products: IProductDocument[];
  pagination: PaginationMeta;
}

class ProductService {
  async createProduct(input: CreateProductInput): Promise<Result<IProductDocument>> {
    const subCategory = await subCategoryRepository
      .model
      .findById(input.subCategoryId)
      .populate<PopulatedWithId>('categoryId')
      .exec();
    if (!subCategory) return fail(new AppError('SubCategory not found', 404));
    if (!subCategory.categoryId) return fail(new AppError('Category not found for this subCategory', 404));

    const brand = await brandRepository.findById(input.brandId);
    if (!brand) return fail(new AppError('Brand not found', 404));

    const priceAfterDiscount = input.appliedDiscount
      ? input.price * (1 - input.appliedDiscount / 100)
      : input.price;

    const product = await productRepository.create({
      title: input.title,
      slug: createSlug(input.title),
      desc: input.desc,
      price: input.price,
      appliedDiscount: input.appliedDiscount ?? 0,
      priceAfterDiscount,
      colors: input.colors,
      sizes: input.sizes,
      stock: input.stock,
      brandId: input.brandId,
      subCategoryId: input.subCategoryId,
      categoryId: subCategory.categoryId._id,
      images: input.images,
      customId: input.customId,
      createdBy: input.createdBy,
    });

    return ok(product);
  }

  async findById(productId: string): Promise<Result<IProductDocument>> {
    const product = await productRepository.findById(productId);
    if (!product) return fail(new AppError('Product not found', 404));
    return ok(product);
  }

  async updateProduct(
    product: IProductDocument,
    input: UpdateProductInput,
  ): Promise<Result<IProductDocument>> {
    if (input.newSubCategoryId) {
      const subCategory = await subCategoryRepository
        .model
        .findById(input.newSubCategoryId)
        .populate<PopulatedWithId>('categoryId')
        .exec();
      if (!subCategory) return fail(new AppError('SubCategory not found', 404));
      product.subCategoryId = new Types.ObjectId(input.newSubCategoryId);
      product.categoryId = subCategory.categoryId._id;
    }

    if (input.newBrandId) {
      const brand = await brandRepository.findById(input.newBrandId);
      if (!brand) return fail(new AppError('Brand not found', 404));
      product.brandId = new Types.ObjectId(input.newBrandId);
    }

    if (input.title) {
      product.title = input.title;
      product.slug = createSlug(input.title);
    }
    if (input.desc !== undefined) product.desc = input.desc;
    if (input.stock !== undefined) product.stock = input.stock;
    if (input.colors) product.colors = input.colors;
    if (input.sizes) product.sizes = input.sizes;

    if (input.price !== undefined && input.appliedDiscount !== undefined) {
      product.price = input.price;
      product.appliedDiscount = input.appliedDiscount;
      product.priceAfterDiscount = input.price * (1 - input.appliedDiscount / 100);
    } else if (input.price !== undefined) {
      product.price = input.price;
      product.priceAfterDiscount = input.price * (1 - product.appliedDiscount / 100);
    } else if (input.appliedDiscount !== undefined) {
      product.appliedDiscount = input.appliedDiscount;
      product.priceAfterDiscount = product.price * (1 - input.appliedDiscount / 100);
    }

    if (input.images) {
      product.images = input.images;
    }

    if (input.updatedBy) {
      product.updatedBy = input.updatedBy as typeof product.updatedBy;
    }

    await product.save();
    return ok(product);
  }

  async getAllProducts(page: string, size: string): Promise<ProductListResult> {
    const { limit, skip, page: currentPage } = paginationFunction({
      page: parseInt(page ?? '1'),
      size: parseInt(size ?? '10'),
    });

    const [products, total] = await Promise.all([
      productRepository.findAllPaginated(limit, skip),
      productRepository.countDocuments(),
    ]);

    return { products, pagination: buildPaginationMeta({ page: currentPage, limit, total }) };
  }

  searchByTitle(title: string): Promise<IProductDocument[]> {
    return productRepository.findByTitleRegex(title);
  }

  async listProducts(query: Record<string, string>): Promise<ProductListResult> {
    const { limit, page: currentPage } = paginationFunction({
      page: parseInt(query.page ?? '1'),
      size: parseInt(query.size ?? '10'),
    });

    const apiFeature = new ApiFeature(productModel.find(), query)
      .filters()
      .search(['title', 'desc'])
      .sort()
      .select()
      .pagination();

    const [data, total] = await Promise.all([
      apiFeature.mongooseQuery,
      productRepository.countDocuments(),
    ]);

    return { products: data, pagination: buildPaginationMeta({ page: currentPage, limit, total }) };
  }
}

export const productService = new ProductService();
