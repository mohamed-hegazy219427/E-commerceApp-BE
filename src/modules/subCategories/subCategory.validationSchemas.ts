import { z } from 'zod';
import { generalFields } from '@middlewares/validation.js';
import type { ValidationSchema } from '@middlewares/validation.js';

export const createSubCategorySchema = {
  body: z.object({ name: z.string().trim().min(2).max(50) }),
  query: z.object({ categoryId: generalFields.objectId }),
} satisfies ValidationSchema;

export const updateSubCategorySchema = {
  body: z.object({ name: z.string().trim().min(2).max(50).optional() }),
  query: z.object({ subCategoryId: generalFields.objectId }),
} satisfies ValidationSchema;

export const deleteSubCategorySchema = {
  query: z.object({ subCategoryId: generalFields.objectId }),
} satisfies ValidationSchema;

//   DTO types     ──
export type CreateSubCategoryBodyDTO = z.infer<typeof createSubCategorySchema.body>;
export type CreateSubCategoryQueryDTO = z.infer<typeof createSubCategorySchema.query>;
export type UpdateSubCategoryBodyDTO = z.infer<typeof updateSubCategorySchema.body>;
export type UpdateSubCategoryQueryDTO = z.infer<typeof updateSubCategorySchema.query>;
export type DeleteSubCategoryQueryDTO = z.infer<typeof deleteSubCategorySchema.query>;
