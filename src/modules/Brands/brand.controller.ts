import type { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '@utils/asyncHandler.js';
import { sendSuccess } from '@utils/response.js';
import { AppError } from '@utils/AppError.js';
import createCustomId from '@utils/customIdGenerator.js';
import cloudinary from '@config/cloudinary.js';
import { env } from '@config/env.js';
import type { TypedRequest } from '@types-app/index.js';
import type {
  AddBrandBodyDTO,
  UpdateBrandBodyDTO,
  UpdateBrandQueryDTO,
  DeleteBrandQueryDTO,
  GetBrandsByCategoryQueryDTO,
  GetBrandsBySubCategoryQueryDTO,
} from './brand.validationSchemas.js';
import { brandService } from './services/brand.service.js';

export const addBrand = asyncHandler(async (_req: Request, res: Response, next: NextFunction) => {
  const req = _req as TypedRequest<AddBrandBodyDTO>;

  if (!req.file) return next(new AppError(req.t.brand.uploadLogo, 400));

  const customId = createCustomId();
  req.uploadPath = `${env.PROJECT_FOLDER}/Brands/${customId}`;

  const { secure_url, public_id } = await cloudinary.uploader.upload(req.file.path, {
    folder: req.uploadPath,
  });

  const result = await brandService.createBrand({
    name: req.body.name,
    logo: { secure_url, public_id },
    customId,
    addBy: req.authUser!._id as Parameters<typeof brandService.createBrand>[0]['addBy'],
  });
  if (!result.ok) return next(result.error);

  return sendSuccess(res, { brand: result.value }, req.t.done, 201);
});

export const updateBrand = asyncHandler(
  async (_req: Request, res: Response, next: NextFunction) => {
    const req = _req as TypedRequest<UpdateBrandBodyDTO, UpdateBrandQueryDTO>;
    const { brandId } = req.query;

    const findResult = await brandService.findById(brandId);
    if (!findResult.ok) return next(findResult.error);
    const brand = findResult.value;

    let logo = brand.logo;
    if (req.file) {
      req.uploadPath = `${env.PROJECT_FOLDER}/Brands/${brand.customId}`;
      const { secure_url, public_id } = await cloudinary.uploader.upload(req.file.path, {
        folder: req.uploadPath,
      });
      if (brand.logo?.public_id) await cloudinary.api.delete_resources([brand.logo.public_id]);
      logo = { secure_url, public_id };
    }

    const result = await brandService.updateBrand(brand, { name: req.body.name, logo });
    if (!result.ok) return next(result.error);

    return sendSuccess(res, { brand: result.value });
  },
);

export const deleteBrand = asyncHandler(
  async (_req: Request, res: Response, next: NextFunction) => {
    const req = _req as TypedRequest<Record<string, never>, DeleteBrandQueryDTO>;

    const result = await brandService.deleteBrand(req.query.brandId);
    if (!result.ok) return next(result.error);
    const brand = result.value;

    if (brand.products.length) {
      for (const product of brand.products) {
        await cloudinary.api.delete_resources_by_prefix(
          `${env.PROJECT_FOLDER}/Products/${product.customId}`,
        );
        await cloudinary.api.delete_folder(`${env.PROJECT_FOLDER}/Products/${product.customId}`);
      }
    }

    await cloudinary.api.delete_resources_by_prefix(
      `${env.PROJECT_FOLDER}/Brands/${brand.customId}`,
    );
    await cloudinary.api.delete_folder(`${env.PROJECT_FOLDER}/Brands/${brand.customId}`);

    return sendSuccess(res, { brand });
  },
);

export const getBrandsByCategoryId = asyncHandler(
  async (_req: Request, res: Response, next: NextFunction) => {
    const req = _req as TypedRequest<Record<string, never>, GetBrandsByCategoryQueryDTO>;

    const result = await brandService.getBrandsByCategoryId(req.query.categoryId);
    if (!result.ok) return next(result.error);

    return sendSuccess(res, { brands: result.value });
  },
);

export const getBrandsBySubCategoryId = asyncHandler(
  async (_req: Request, res: Response, next: NextFunction) => {
    const req = _req as TypedRequest<Record<string, never>, GetBrandsBySubCategoryQueryDTO>;

    const result = await brandService.getBrandsBySubCategoryId(req.query.subCategoryId);
    if (!result.ok) return next(result.error);

    return sendSuccess(res, { brands: result.value });
  },
);
