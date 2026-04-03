import type { Request, Response, NextFunction } from 'express';
import type { Types } from 'mongoose';
import { asyncHandler } from '@utils/asyncHandler.js';
import { sendSuccess } from '@utils/response.js';
import { AppError } from '@utils/AppError.js';
import createCustomId from '@utils/customIdGenerator.js';
import cloudinary from '@config/cloudinary.js';
import { env } from '@config/env.js';
import type { TypedRequest } from '@types-app/index.js';
import type {
  AddProductBodyDTO,
  AddProductQueryDTO,
  UpdateProductBodyDTO,
  UpdateProductQueryDTO,
} from './product.validationSchema.js';
import { productService } from './services/product.service.js';

export const addProduct = asyncHandler(async (_req: Request, res: Response, next: NextFunction) => {
  const req = _req as TypedRequest<AddProductBodyDTO, AddProductQueryDTO>;

  if (!req.files || !(req.files as Express.Multer.File[]).length) {
    return next(new AppError(req.t.product.uploadImages, 400));
  }

  const customId = createCustomId();
  req.uploadPath = `${env.PROJECT_FOLDER}/Products/${customId}`;

  const images = [];
  for (const file of req.files as Express.Multer.File[]) {
    const { secure_url, public_id } = await cloudinary.uploader.upload(file.path, {
      folder: req.uploadPath,
    });
    images.push({ secure_url, public_id });
  }

  const result = await productService.createProduct({
    title: req.body.title,
    desc: req.body.desc,
    price: req.body.price,
    appliedDiscount: req.body.appliedDiscount,
    colors: req.body.colors,
    sizes: req.body.sizes,
    stock: req.body.stock,
    brandId: req.query.brandId,
    subCategoryId: req.query.subCategoryId,
    images,
    customId,
    createdBy: req.authUser!._id as Types.ObjectId,
  });
  if (!result.ok) return next(result.error);

  return sendSuccess(res, { product: result.value }, req.t.done, 201);
});

export const updateProduct = asyncHandler(
  async (_req: Request, res: Response, next: NextFunction) => {
    const req = _req as TypedRequest<UpdateProductBodyDTO, UpdateProductQueryDTO>;
    const { productId } = req.query;

    const findResult = await productService.findById(productId);
    if (!findResult.ok) return next(findResult.error);
    const product = findResult.value;

    let images: { secure_url: string; public_id: string }[] | undefined;
    if (req.files && (req.files as Express.Multer.File[]).length) {
      req.uploadPath = `${env.PROJECT_FOLDER}/Products/${product.customId}`;
      const newImages: { secure_url: string; public_id: string }[] = [];
      const oldPublicIds: string[] = product.images.map((img) => img.public_id);

      for (const file of req.files as Express.Multer.File[]) {
        const { secure_url, public_id } = await cloudinary.uploader.upload(file.path, {
          folder: req.uploadPath,
        });
        newImages.push({ secure_url, public_id });
      }

      if (oldPublicIds.length) await cloudinary.api.delete_resources(oldPublicIds);
      images = newImages;
    }

    const result = await productService.updateProduct(product, {
      title: req.body.title,
      desc: req.body.desc,
      price: req.body.price,
      appliedDiscount: req.body.appliedDiscount,
      colors: req.body.colors,
      sizes: req.body.sizes,
      stock: req.body.stock,
      newBrandId: req.query.newBrandId,
      newSubCategoryId: req.query.newSubCategoryId,
      images,
      updatedBy: req.authUser!._id as Types.ObjectId,
    });
    if (!result.ok) return next(result.error);

    return sendSuccess(res, { product: result.value });
  },
);

export const getAllProducts = asyncHandler(async (_req: Request, res: Response) => {
  const req = _req as TypedRequest<Record<string, never>, { page?: string; size?: string }>;
  const { products, pagination } = await productService.getAllProducts(
    req.query.page ?? '1',
    req.query.size ?? '10',
  );
  return sendSuccess(res, { products }, req.t.done, 200, pagination);
});

export const getProductByTitle = asyncHandler(async (_req: Request, res: Response) => {
  const req = _req as TypedRequest<Record<string, never>, { title: string }>;
  const products = await productService.searchByTitle(req.query.title);
  return sendSuccess(res, { products });
});

export const listProducts = asyncHandler(async (_req: Request, res: Response) => {
  const req = _req as TypedRequest<Record<string, never>, Record<string, string>>;
  const { products, pagination } = await productService.listProducts(req.query);
  return sendSuccess(res, { data: products }, req.t.done, 200, pagination);
});
