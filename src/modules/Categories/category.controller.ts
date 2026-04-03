import type { Request, Response, NextFunction } from 'express';
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
import { categoryService } from './services/category.service.js';

export const getAllCategories = asyncHandler(async (_req: Request, res: Response) => {
  const allCategories = await categoryService.getAllCategories();
  return sendSuccess(res, { allCategories });
});

export const createCategory = asyncHandler(
  async (_req: Request, res: Response, next: NextFunction) => {
    const req = _req as TypedRequest<CreateCategoryBodyDTO>;

    if (!req.file) return next(new AppError(req.t.category.uploadImage, 400));

    const customId = createCustomId();
    req.uploadPath = `${env.PROJECT_FOLDER}/Categories/${customId}`;
    const { public_id, secure_url } = await cloudinary.uploader.upload(req.file.path, {
      folder: req.uploadPath,
    });

    const result = await categoryService.createCategory({
      name: req.body.name,
      image: { public_id, secure_url },
      customId,
      createdBy: req.authUser!._id as Parameters<typeof categoryService.createCategory>[0]['createdBy'],
    });
    if (!result.ok) return next(result.error);

    return sendSuccess(res, { category: result.value }, req.t.done, 201);
  },
);

export const updateCategory = asyncHandler(
  async (_req: Request, res: Response, next: NextFunction) => {
    const req = _req as TypedRequest<UpdateCategoryBodyDTO, UpdateCategoryQueryDTO>;
    const { categoryId } = req.query;

    const findResult = await categoryService.findById(categoryId);
    if (!findResult.ok) return next(findResult.error);
    const category = findResult.value;

    let image = category.image;
    if (req.file) {
      req.uploadPath = `${env.PROJECT_FOLDER}/Categories/${category.customId}`;
      const { secure_url, public_id } = await cloudinary.uploader.upload(req.file.path, {
        folder: req.uploadPath,
      });
      if (category.image?.public_id) await cloudinary.uploader.destroy(category.image.public_id);
      image = { secure_url, public_id };
    }

    const result = await categoryService.updateCategory(category, { name: req.body.name, image });
    if (!result.ok) return next(result.error);

    return sendSuccess(res, { category: result.value });
  },
);

export const deleteCategory = asyncHandler(
  async (_req: Request, res: Response, next: NextFunction) => {
    const req = _req as TypedRequest<Record<string, never>, DeleteCategoryQueryDTO>;

    const result = await categoryService.deleteCategory(req.query.categoryId);
    if (!result.ok) return next(result.error);
    const category = result.value;

    if (category.products.length) {
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
