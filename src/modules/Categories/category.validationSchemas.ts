import { z } from 'zod';
import { generalFields } from '@middlewares/validation.js';
import type { ValidationSchema } from '@middlewares/validation.js';

export const createCategorySchema = {
  body: z.object({ name: z.string().trim().min(2).max(50) }),
} satisfies ValidationSchema;

export const updateCategorySchema = {
  body: z.object({ name: z.string().trim().min(2).max(50).optional() }),
  query: z.object({ categoryId: generalFields.objectId }),
} satisfies ValidationSchema;

export const deleteCategorySchema = {
  query: z.object({ categoryId: generalFields.objectId }),
} satisfies ValidationSchema;

export const createCategorySchemaQL = z.object({
  name: z.string().trim().min(2),
  token: z.string().min(1),
});

//   DTO types     ──
export type CreateCategoryBodyDTO = z.infer<typeof createCategorySchema.body>;
export type UpdateCategoryBodyDTO = z.infer<typeof updateCategorySchema.body>;
export type UpdateCategoryQueryDTO = z.infer<typeof updateCategorySchema.query>;
export type DeleteCategoryQueryDTO = z.infer<typeof deleteCategorySchema.query>;
