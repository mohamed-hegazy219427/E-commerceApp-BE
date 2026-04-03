import { z } from 'zod';
import { generalFields } from '@middlewares/validation.js';
import type { ValidationSchema } from '@middlewares/validation.js';

export const addBrandSchema = {
  body: z.object({ name: z.string().trim().min(2).max(50) }),
} satisfies ValidationSchema;

export const updateBrandSchema = {
  body: z.object({ name: z.string().trim().min(2).max(50).optional() }),
  query: z.object({ brandId: generalFields.objectId }),
} satisfies ValidationSchema;

export const deleteBrandSchema = {
  query: z.object({ brandId: generalFields.objectId }),
} satisfies ValidationSchema;

export const getBrandsByCategorySchema = {
  query: z.object({ categoryId: generalFields.objectId }),
} satisfies ValidationSchema;

export const getBrandsBySubCategorySchema = {
  query: z.object({ subCategoryId: generalFields.objectId }),
} satisfies ValidationSchema;

//   DTO types     ──
export type AddBrandBodyDTO = z.infer<typeof addBrandSchema.body>;
export type UpdateBrandBodyDTO = z.infer<typeof updateBrandSchema.body>;
export type UpdateBrandQueryDTO = z.infer<typeof updateBrandSchema.query>;
export type DeleteBrandQueryDTO = z.infer<typeof deleteBrandSchema.query>;
export type GetBrandsByCategoryQueryDTO = z.infer<typeof getBrandsByCategorySchema.query>;
export type GetBrandsBySubCategoryQueryDTO = z.infer<typeof getBrandsBySubCategorySchema.query>;
