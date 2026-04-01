import type { Request, Response, NextFunction } from 'express';
import { brandModel } from '@models/brand.model.js';
import { productModel } from '@models/product.model.js';
import { categoryModel } from '@models/category.model.js';
import { subCategoryModel } from '@models/subCategory.model.js';
import { asyncHandler } from '@utils/asyncHandler.js';
import { sendSuccess } from '@utils/response.js';
import { AppError } from '@utils/AppError.js';
import createSlug from '@utils/slugGenerator.js';
import createCustomId from '@utils/customIdGenerator.js';
import cloudinary from '@config/cloudinary.js';
import { env } from '@config/env.js';

export const addBrand = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { name } = req.body as { name: string };

  if (await brandModel.findOne({ name })) return next(new AppError(req.t.brand.duplicateName, 409));
  if (!req.file) return next(new AppError(req.t.brand.uploadLogo, 400));

  const customId = createCustomId();
  req.uploadPath = `${env.PROJECT_FOLDER}/Brands/${customId}`;

  const { secure_url, public_id } = await cloudinary.uploader.upload(req.file.path, { folder: req.uploadPath });

  const brand = await brandModel.create({
    name,
    slug: createSlug(name),
    customId,
    logo: { secure_url, public_id },
    addBy: req.authUser!._id,
  });

  return sendSuccess(res, { brand }, req.t.done, 201);
});

export const updateBrand = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { brandId } = req.query as { brandId: string };
  const { name } = req.body as { name?: string };

  const brand = await brandModel.findById(brandId);
  if (!brand) return next(new AppError(req.t.brand.notFound, 404));

  if (name) {
    if (await brandModel.findOne({ name })) return next(new AppError(req.t.brand.duplicateName, 409));
    brand.name = name;
    brand.slug = createSlug(name);
  }

  if (req.file) {
    const { secure_url, public_id } = await cloudinary.uploader.upload(req.file.path, {
      folder: `${env.PROJECT_FOLDER}/Brands/${brand.customId}`,
    });
    if (brand.logo?.public_id) await cloudinary.api.delete_resources([brand.logo.public_id]);
    brand.logo = { secure_url, public_id };
  }

  await brand.save();
  return sendSuccess(res, { brand });
});

export const deleteBrand = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { brandId } = req.query as { brandId: string };

  const brand = await brandModel
    .findByIdAndDelete(brandId)
    .populate<{ products: { customId: string }[] }>('products');

  if (!brand) return next(new AppError(req.t.brand.notFound, 404));

  if (brand.products.length) {
    await productModel.deleteMany({ brandId });
    for (const product of brand.products) {
      await cloudinary.api.delete_resources_by_prefix(`${env.PROJECT_FOLDER}/Products/${product.customId}`);
      await cloudinary.api.delete_folder(`${env.PROJECT_FOLDER}/Products/${product.customId}`);
    }
  }

  await cloudinary.api.delete_resources_by_prefix(`${env.PROJECT_FOLDER}/Brands/${brand.customId}`);
  await cloudinary.api.delete_folder(`${env.PROJECT_FOLDER}/Brands/${brand.customId}`);

  return sendSuccess(res, { brand });
});

export const getBrandsByCategoryId = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { categoryId } = req.query as { categoryId: string };

  if (!(await categoryModel.findById(categoryId))) {
    return next(new AppError(req.t.brand.invalidCategoryId, 404));
  }

  const products = await productModel.find({ categoryId }).select('brandId').populate('brandId');
  const brands = [...new Map(products.map((p) => [String(p.brandId), p.brandId])).values()];

  return sendSuccess(res, { brands });
});

export const getBrandsBySubCategoryId = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { subCategoryId } = req.query as { subCategoryId: string };

  if (!(await subCategoryModel.findById(subCategoryId))) {
    return next(new AppError(req.t.brand.invalidSubCategoryId, 404));
  }

  const products = await productModel.find({ subCategoryId }).select('brandId').populate('brandId');
  const brands = [...new Map(products.map((p) => [String(p.brandId), p.brandId])).values()];

  return sendSuccess(res, { brands });
});
