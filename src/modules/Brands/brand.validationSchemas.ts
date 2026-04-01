import { z } from 'zod';
import { generalFields } from '@middlewares/validation.js';
import type { ValidationSchema } from '@middlewares/validation.js';

export const addBrandSchema: ValidationSchema = {
  body: z.object({ name: z.string().trim().min(2).max(50) }),
};

export const updateBrandSchema: ValidationSchema = {
  body: z.object({ name: z.string().trim().min(2).max(50).optional() }),
  query: z.object({ brandId: generalFields.objectId }),
};

export const deleteBrandSchema: ValidationSchema = {
  query: z.object({ brandId: generalFields.objectId }),
};

export const getBrandsByCategorySchema: ValidationSchema = {
  query: z.object({ categoryId: generalFields.objectId }),
};

export const getBrandsBySubCategorySchema: ValidationSchema = {
  query: z.object({ subCategoryId: generalFields.objectId }),
};
