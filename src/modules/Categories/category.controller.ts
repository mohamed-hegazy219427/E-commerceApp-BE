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
  CreateCategoryBodyDTO,
  UpdateCategoryBodyDTO,
  UpdateCategoryQueryDTO,
  DeleteCategoryQueryDTO,
} from './category.validationSchemas.js';

export const getAllCategories = asyncHandler(async (_req: Request, res: Response) => {
  const allCategories = await categoryModel
    .find()
    .populate([{ path: 'subCategories', populate: [{ path: 'products' }] }]);
  return sendSuccess(res, { allCategories });
});

export const createCategory = asyncHandler(
  async (_req: Request, res: Response, next: NextFunction) => {
    const req = _req as TypedRequest<CreateCategoryBodyDTO>;
    const { name } = req.body;

    if (await categoryModel.findOne({ name })) {
      return next(new AppError(req.t.category.duplicateName, 409));
    }
    if (!req.file) return next(new AppError(req.t.category.uploadImage, 400));

    const slug = slugify(name, { trim: true, replacement: '_', lower: true });
    const customId = createCustomId();

    req.uploadPath = `${env.PROJECT_FOLDER}/Categories/${customId}`;
    const { public_id, secure_url } = await cloudinary.uploader.upload(req.file.path, {
      folder: req.uploadPath,
    });

    const category = await categoryModel.create({
      name,
      slug,
      customId,
      image: { public_id, secure_url },
      createdBy: req.authUser!._id,
    });

    return sendSuccess(res, { category }, req.t.done, 201);
  },
);

export const updateCategory = asyncHandler(
  async (_req: Request, res: Response, next: NextFunction) => {
    const req = _req as TypedRequest<UpdateCategoryBodyDTO, UpdateCategoryQueryDTO>;
    const { categoryId } = req.query;
    const { name } = req.body;

    const category = await categoryModel.findById(categoryId);
    if (!category) return next(new AppError(req.t.category.notFound, 404));

    if (name) {
      if (category.name === name.toLowerCase())
        return next(new AppError(req.t.category.sameOldName, 400));
      if (await categoryModel.findOne({ name }))
        return next(new AppError(req.t.category.duplicateName, 409));
      category.name = name;
      category.slug = slugify(name, { trim: true, lower: true, replacement: '_' });
    }

    if (req.file) {
      const { secure_url, public_id } = await cloudinary.uploader.upload(req.file.path, {
        folder: `${env.PROJECT_FOLDER}/Categories/${category.customId}`,
      });
      if (category.image?.public_id) await cloudinary.uploader.destroy(category.image.public_id);
      category.image = { secure_url, public_id };
    }

    await category.save();
    return sendSuccess(res, { category });
  },
);

export const deleteCategory = asyncHandler(
  async (_req: Request, res: Response, next: NextFunction) => {
    const req = _req as TypedRequest<Record<string, never>, DeleteCategoryQueryDTO>;
    const { categoryId } = req.query;

    const category = await categoryModel
      .findByIdAndDelete(categoryId)
      .populate<{ subCategories: { customId: string }[] }>('subCategories')
      .populate<{ products: { customId: string }[] }>('products');

    if (!category) return next(new AppError(req.t.category.notFound, 404));

    if (category.subCategories.length) {
      const result = await subCategoryModel.deleteMany({ categoryId });
      if (!result.deletedCount)
        return next(new AppError(req.t.category.deleteSubCategoriesFailed, 500));
    }

    if (category.products.length) {
      const result = await productModel.deleteMany({ categoryId });
      if (!result.deletedCount) return next(new AppError(req.t.category.deleteProductsFailed, 500));
      for (const product of category.products) {
        await cloudinary.api.delete_resources_by_prefix(
          `${env.PROJECT_FOLDER}/Products/${product.customId}`,
        );
        await cloudinary.api.delete_folder(`${env.PROJECT_FOLDER}/Products/${product.customId}`);
      }
    }

    if (category.customId) {
      await cloudinary.api.delete_resources_by_prefix(
        `${env.PROJECT_FOLDER}/Categories/${category.customId}`,
      );
      await cloudinary.api.delete_folder(`${env.PROJECT_FOLDER}/Categories/${category.customId}`);
    }

    return sendSuccess(res, null, req.t.category.deletedDone);
  },
);
