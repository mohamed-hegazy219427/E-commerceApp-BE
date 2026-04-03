import type { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { subCategoryModel } from '@models/subCategory.model.js';
import { brandModel } from '@models/brand.model.js';
import { productModel } from '@models/product.model.js';
import { asyncHandler } from '@utils/asyncHandler.js';
import { sendSuccess } from '@utils/response.js';
import { AppError } from '@utils/AppError.js';
import createSlug from '@utils/slugGenerator.js';
import createCustomId from '@utils/customIdGenerator.js';
import { paginationFunction, buildPaginationMeta } from '@utils/pagination.js';
import { ApiFeature } from '@utils/apiFeature.js';
import cloudinary from '@config/cloudinary.js';
import { env } from '@config/env.js';
import type { TypedRequest } from '@types-app/index.js';
import type {
  AddProductBodyDTO,
  AddProductQueryDTO,
  UpdateProductBodyDTO,
  UpdateProductQueryDTO,
} from './product.validationSchema.js';

// Typed populate shape — avoids `as unknown as` for populate results
interface PopulatedWithId {
  categoryId: { _id: Types.ObjectId };
}

export const addProduct = asyncHandler(async (_req: Request, res: Response, next: NextFunction) => {
  const req = _req as TypedRequest<AddProductBodyDTO, AddProductQueryDTO>;
  const { title, desc, price, appliedDiscount, colors, sizes, stock } = req.body;
  const { brandId, subCategoryId } = req.query;

  const subCategory = await subCategoryModel
    .findById(subCategoryId)
    .populate<PopulatedWithId>('categoryId');
  if (!subCategory) return next(new AppError(req.t.product.invalidSubCategoryId, 404));
  if (!subCategory.categoryId) return next(new AppError(req.t.product.categoryNotFound, 404));

  const brand = await brandModel.findById(brandId);
  if (!brand) return next(new AppError(req.t.product.invalidBrandId, 404));

  if (!req.files || !(req.files as Express.Multer.File[]).length) {
    return next(new AppError(req.t.product.uploadImages, 400));
  }

  const slug = createSlug(title);
  const customId = createCustomId();
  req.uploadPath = `${env.PROJECT_FOLDER}/Products/${customId}`;

  const images = [];
  for (const file of req.files as Express.Multer.File[]) {
    const { secure_url, public_id } = await cloudinary.uploader.upload(file.path, {
      folder: req.uploadPath,
    });
    images.push({ secure_url, public_id });
  }

  const categoryId = subCategory.categoryId._id;
  const priceAfterDiscount = appliedDiscount ? price * (1 - appliedDiscount / 100) : price;

  const product = await productModel.create({
    title,
    slug,
    desc,
    price,
    appliedDiscount: appliedDiscount ?? 0,
    priceAfterDiscount,
    colors,
    sizes,
    stock,
    brandId,
    subCategoryId,
    categoryId,
    images,
    customId,
    createdBy: req.authUser!._id,
  });

  return sendSuccess(res, { product }, req.t.done, 201);
});

export const updateProduct = asyncHandler(
  async (_req: Request, res: Response, next: NextFunction) => {
    const req = _req as TypedRequest<UpdateProductBodyDTO, UpdateProductQueryDTO>;
    const { title, desc, price, appliedDiscount, colors, sizes, stock } = req.body;
    const { newBrandId, newSubCategoryId, productId } = req.query;

    const product = await productModel.findById(productId);
    if (!product) return next(new AppError(req.t.product.notFound, 404));

    if (newSubCategoryId) {
      const subCategory = await subCategoryModel
        .findById(newSubCategoryId)
        .populate<PopulatedWithId>('categoryId');
      if (!subCategory) return next(new AppError(req.t.product.invalidSubCategoryId, 404));
      product.subCategoryId = new Types.ObjectId(newSubCategoryId);
      product.categoryId = subCategory.categoryId._id;
    }

    if (newBrandId) {
      if (!(await brandModel.findById(newBrandId)))
        return next(new AppError(req.t.product.invalidBrandId, 404));
      product.brandId = new Types.ObjectId(newBrandId);
    }

    if (title) {
      product.title = title;
      product.slug = createSlug(title);
    }
    if (desc !== undefined) product.desc = desc;
    if (stock !== undefined) product.stock = stock;
    if (colors) product.colors = colors;
    if (sizes) product.sizes = sizes;

    if (price !== undefined && appliedDiscount !== undefined) {
      product.price = price;
      product.appliedDiscount = appliedDiscount;
      product.priceAfterDiscount = price * (1 - appliedDiscount / 100);
    } else if (price !== undefined) {
      product.price = price;
      product.priceAfterDiscount = price * (1 - product.appliedDiscount / 100);
    } else if (appliedDiscount !== undefined) {
      product.appliedDiscount = appliedDiscount;
      product.priceAfterDiscount = product.price * (1 - appliedDiscount / 100);
    }

    if (req.files && (req.files as Express.Multer.File[]).length) {
      req.uploadPath = `${env.PROJECT_FOLDER}/Products/${product.customId}`;
      const newImages = [];
      const oldPublicIds: string[] = product.images.map((img) => img.public_id);

      for (const file of req.files as Express.Multer.File[]) {
        const { secure_url, public_id } = await cloudinary.uploader.upload(file.path, {
          folder: req.uploadPath,
        });
        newImages.push({ secure_url, public_id });
      }

      if (oldPublicIds.length) await cloudinary.api.delete_resources(oldPublicIds);
      product.images = newImages;
      product.updatedBy = req.authUser!._id as typeof product.updatedBy;
    }

    await product.save();
    return sendSuccess(res, { product });
  },
);

export const getAllProducts = asyncHandler(async (_req: Request, res: Response) => {
  const req = _req as TypedRequest<Record<string, never>, { page?: string; size?: string }>;
  const { page, size } = req.query;
  const {
    limit,
    skip,
    page: currentPage,
  } = paginationFunction({
    page: parseInt(page ?? '1'),
    size: parseInt(size ?? '10'),
  });

  const [products, total] = await Promise.all([
    productModel.find().limit(limit).skip(skip).populate('Reviews'),
    productModel.countDocuments(),
  ]);

  return sendSuccess(
    res,
    { products },
    req.t.done,
    200,
    buildPaginationMeta({ page: currentPage, limit, total }),
  );
});

export const getProductByTitle = asyncHandler(async (_req: Request, res: Response) => {
  const req = _req as TypedRequest<Record<string, never>, { title: string }>;
  const { title } = req.query;
  const safeTitle = title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const products = await productModel.find({ title: { $regex: safeTitle, $options: 'i' } });
  return sendSuccess(res, { products });
});

export const listProducts = asyncHandler(async (_req: Request, res: Response) => {
  const req = _req as TypedRequest<Record<string, never>, Record<string, string>>;
  const query = req.query;
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
    productModel.countDocuments(),
  ]);

  return sendSuccess(
    res,
    { data },
    req.t.done,
    200,
    buildPaginationMeta({ page: currentPage, limit, total }),
  );
});
