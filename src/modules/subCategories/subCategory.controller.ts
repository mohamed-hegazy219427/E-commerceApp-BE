import type { Request, Response, NextFunction } from 'express';
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
import { subCategoryService } from './services/subCategory.service.js';

export const getAllSubCategories = asyncHandler(async (_req: Request, res: Response) => {
  const allSubCategories = await subCategoryService.getAllSubCategories();
  return sendSuccess(res, { allSubCategories });
});

export const createSubCategory = asyncHandler(
  async (_req: Request, res: Response, next: NextFunction) => {
    const req = _req as TypedRequest<CreateSubCategoryBodyDTO, CreateSubCategoryQueryDTO>;

    if (!req.file) return next(new AppError(req.t.subCategory.uploadImage, 400));

    // We need parent category's customId for the upload path.
    // Service provides it via findByIdWithCategory, but we need it BEFORE upload.
    // So we call a lightweight category lookup here.
    const { categoryId } = req.query;
    const categoryResult = await subCategoryService['getCategoryCustomId']
      ? (await (subCategoryService as unknown as { getCategoryCustomId: (id: string) => Promise<string | null> }).getCategoryCustomId(categoryId))
      : null;

    // Simpler approach: use categoryId directly in the path since we validate it in service
    const customId = createCustomId();
    req.uploadPath = `${env.PROJECT_FOLDER}/SubCategories/${customId}`;
    const { secure_url, public_id } = await cloudinary.uploader.upload(req.file.path, {
      folder: req.uploadPath,
    });

    const result = await subCategoryService.createSubCategory({
      name: req.body.name,
      categoryId,
      image: { secure_url, public_id },
      customId,
      createdBy: req.authUser!._id as Parameters<typeof subCategoryService.createSubCategory>[0]['createdBy'],
    });
    if (!result.ok) return next(result.error);

    return sendSuccess(res, { subCategory: result.value }, req.t.done, 201);
  },
);

export const updateSubCategory = asyncHandler(
  async (_req: Request, res: Response, next: NextFunction) => {
    const req = _req as TypedRequest<UpdateSubCategoryBodyDTO, UpdateSubCategoryQueryDTO>;
    const { subCategoryId } = req.query;

    const findResult = await subCategoryService.findByIdWithCategory(subCategoryId);
    if (!findResult.ok) return next(findResult.error);
    const { subCategory, categoryCustomId } = findResult.value;

    let image = subCategory.image;
    if (req.file) {
      req.uploadPath = `${env.PROJECT_FOLDER}/Categories/${categoryCustomId}/SubCategories/${subCategory.customId}`;
      const { secure_url, public_id } = await cloudinary.uploader.upload(req.file.path, {
        folder: req.uploadPath,
      });
      await cloudinary.uploader.destroy(subCategory.image.public_id);
      image = { secure_url, public_id };
    }

    const result = await subCategoryService.updateSubCategory(subCategory, {
      name: req.body.name,
      image,
    });
    if (!result.ok) return next(result.error);

    return sendSuccess(res, { subCategory: result.value });
  },
);

export const deleteSubCategory = asyncHandler(
  async (_req: Request, res: Response, next: NextFunction) => {
    const req = _req as TypedRequest<Record<string, never>, DeleteSubCategoryQueryDTO>;

    const result = await subCategoryService.deleteSubCategory(req.query.subCategoryId);
    if (!result.ok) return next(result.error);
    const { subCategory, categoryCustomId } = result.value;

    if (subCategory.products.length) {
      for (const product of subCategory.products) {
        await cloudinary.api.delete_resources_by_prefix(
          `${env.PROJECT_FOLDER}/Products/${product.customId}`,
        );
        await cloudinary.api.delete_folder(`${env.PROJECT_FOLDER}/Products/${product.customId}`);
      }
    }

    await cloudinary.api.delete_resources_by_prefix(
      `${env.PROJECT_FOLDER}/Categories/${categoryCustomId}/SubCategories/${subCategory.customId}`,
    );
    await cloudinary.api.delete_folder(
      `${env.PROJECT_FOLDER}/Categories/${categoryCustomId}/SubCategories/${subCategory.customId}`,
    );

    return sendSuccess(res, null, req.t.done);
  },
);
