import { z } from 'zod';
import { generalFields } from '@middlewares/validation.js';
import type { ValidationSchema } from '@middlewares/validation.js';

export const addProductSchema: ValidationSchema = {
  body: z.object({
    title: z.string().trim().min(2).max(200),
    desc: z.string().max(2000).optional(),
    price: z.coerce.number().min(0),
    appliedDiscount: z.coerce.number().min(0).max(100).optional(),
    colors: z.array(z.string()).optional(),
    sizes: z.array(z.string()).optional(),
    stock: z.coerce.number().min(0),
  }),
  query: z.object({
    brandId: generalFields.objectId,
    subCategoryId: generalFields.objectId,
  }),
};

export const updateProductSchema: ValidationSchema = {
  body: z.object({
    title: z.string().trim().min(2).max(200).optional(),
    desc: z.string().max(2000).optional(),
    price: z.coerce.number().min(0).optional(),
    appliedDiscount: z.coerce.number().min(0).max(100).optional(),
    colors: z.array(z.string()).optional(),
    sizes: z.array(z.string()).optional(),
    stock: z.coerce.number().min(0).optional(),
  }),
  query: z.object({
    productId: generalFields.objectId,
    newBrandId: generalFields.objectId.optional(),
    newSubCategoryId: generalFields.objectId.optional(),
  }),
};
