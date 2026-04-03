import slugify from 'slugify';
import type { Request, Response, NextFunction } from 'express';
import { categoryModel } from '@models/category.model.js';
import { subCategoryModel } from '@models/subCategory.model.js';
import { productModel } from '@models/product.model.js';
import { asyncHandler } from '@utils/asyncHandler.js';
import { sendSuccess } from '@utils/response.js';
import { AppError } from '@utils/AppError.js';
import createCustomId from '@utils/customIdGenerator.js';
import cloudinary from '@config/cloudinary.js';
import { env } from '@config/env.js';
import type { TypedRequest } from '@types-app/index.js';
import type {
  CreateSubCategoryBodyDTO,
  CreateSubCategoryQueryDTO,
  UpdateSubCategoryBodyDTO,
  UpdateSubCategoryQueryDTO,
  DeleteSubCategoryQueryDTO,
} from './subCategory.validationSchemas.js';

export const getAllSubCategories = asyncHandler(async (_req: Request, res: Response) => {
  const allSubCategories = await subCategoryModel.find().populate('categoryId');
  return sendSuccess(res, { allSubCategories });
});

export const createSubCategory = asyncHandler(
  async (_req: Request, res: Response, next: NextFunction) => {
    const req = _req as TypedRequest<CreateSubCategoryBodyDTO, CreateSubCategoryQueryDTO>;
    const { name } = req.body;
    const { categoryId } = req.query;

    const category = await categoryModel.findById(categoryId);
    if (!category) return next(new AppError(req.t.category.notFound, 404));

    if (await subCategoryModel.findOne({ name })) {
      return next(new AppError(req.t.subCategory.duplicateName, 409));
    }
    if (!req.file) return next(new AppError(req.t.subCategory.uploadImage, 400));

    const slug = slugify(name, { lower: true, trim: true, replacement: '_' });
    const customId = createCustomId();
    const folder = `${env.PROJECT_FOLDER}/Categories/${category.customId}/SubCategories/${customId}`;

    const { secure_url, public_id } = await cloudinary.uploader.upload(req.file.path, { folder });

    const subCategory = await subCategoryModel.create({
      name,
      slug,
      image: { public_id, secure_url },
      customId,
      categoryId,
      createdBy: req.authUser!._id,
    });

    return sendSuccess(res, { subCategory }, req.t.done, 201);
  },
);

export const updateSubCategory = asyncHandler(
  async (_req: Request, res: Response, next: NextFunction) => {
    const req = _req as TypedRequest<UpdateSubCategoryBodyDTO, UpdateSubCategoryQueryDTO>;
    const { subCategoryId } = req.query;
    const { name } = req.body;

    const subCategory = await subCategoryModel.findById(subCategoryId);
    if (!subCategory) return next(new AppError(req.t.subCategory.notFound, 404));

    if (name) {
      if (subCategory.name === name.toLowerCase()) {
        return next(new AppError(req.t.subCategory.sameOldName, 400));
      }
      if (await subCategoryModel.findOne({ name })) {
        return next(new AppError(req.t.subCategory.duplicateName, 409));
      }
      subCategory.name = name;
      subCategory.slug = slugify(name, { lower: true, trim: true, replacement: '_' });
    }

    if (req.file) {
      const category = await categoryModel.findById(subCategory.categoryId);
      if (!category) return next(new AppError(req.t.category.notFound, 404));
      const { secure_url, public_id } = await cloudinary.uploader.upload(req.file.path, {
        folder: `${env.PROJECT_FOLDER}/Categories/${category.customId}/SubCategories/${subCategory.customId}`,
      });
      await cloudinary.uploader.destroy(subCategory.image.public_id);
      subCategory.image = { secure_url, public_id };
    }

    await subCategory.save();
    return sendSuccess(res, { subCategory });
  },
);

export const deleteSubCategory = asyncHandler(
  async (_req: Request, res: Response, next: NextFunction) => {
    const req = _req as TypedRequest<Record<string, never>, DeleteSubCategoryQueryDTO>;
    const { subCategoryId } = req.query;

    const subCategory = await subCategoryModel
      .findByIdAndDelete(subCategoryId)
      .populate<{ products: { customId: string }[] }>('products');

    if (!subCategory) return next(new AppError(req.t.subCategory.notFound, 404));

    const category = await categoryModel.findById(subCategory.categoryId);
    if (!category) return next(new AppError(req.t.category.notFound, 404));

    if (subCategory.products.length) {
      await productModel.deleteMany({ subCategoryId });
      for (const product of subCategory.products) {
        await cloudinary.api.delete_resources_by_prefix(
          `${env.PROJECT_FOLDER}/Products/${product.customId}`,
        );
        await cloudinary.api.delete_folder(`${env.PROJECT_FOLDER}/Products/${product.customId}`);
      }
    }

    await cloudinary.api.delete_resources_by_prefix(
      `${env.PROJECT_FOLDER}/Categories/${category.customId}/SubCategories/${subCategory.customId}`,
    );
    await cloudinary.api.delete_folder(
      `${env.PROJECT_FOLDER}/Categories/${category.customId}/SubCategories/${subCategory.customId}`,
    );

    return sendSuccess(res, null, req.t.done);
  },
);
