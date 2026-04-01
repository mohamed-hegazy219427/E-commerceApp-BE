import { z } from 'zod';
import { generalFields } from '@middlewares/validation.js';
import type { ValidationSchema } from '@middlewares/validation.js';

export const createSubCategorySchema: ValidationSchema = {
  body: z.object({ name: z.string().trim().min(2).max(50) }),
  query: z.object({ categoryId: generalFields.objectId }),
};

export const updateSubCategorySchema: ValidationSchema = {
  body: z.object({ name: z.string().trim().min(2).max(50).optional() }),
  query: z.object({ subCategoryId: generalFields.objectId }),
};

export const deleteSubCategorySchema: ValidationSchema = {
  query: z.object({ subCategoryId: generalFields.objectId }),
};
