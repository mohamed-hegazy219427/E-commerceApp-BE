import { z } from 'zod';
import { generalFields } from '@middlewares/validation.js';
import type { ValidationSchema } from '@middlewares/validation.js';

export const createCategorySchema: ValidationSchema = {
  body: z.object({ name: z.string().trim().min(2).max(50) }),
};

export const updateCategorySchema: ValidationSchema = {
  body: z.object({ name: z.string().trim().min(2).max(50).optional() }),
  query: z.object({ categoryId: generalFields.objectId }),
};

export const deleteCategorySchema: ValidationSchema = {
  query: z.object({ categoryId: generalFields.objectId }),
};

export const createCategorySchemaQL = z.object({
  name: z.string().trim().min(2),
  token: z.string().min(1),
});
