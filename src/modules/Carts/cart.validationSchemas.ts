import { z } from 'zod';
import { generalFields } from '@middlewares/validation.js';
import type { ValidationSchema } from '@middlewares/validation.js';

export const addToCartSchema = {
  body: z.object({ productId: generalFields.objectId, quantity: z.number().min(1) }),
} satisfies ValidationSchema;

export const deleteFromCartSchema = {
  body: z.object({ productId: generalFields.objectId }),
} satisfies ValidationSchema;

//   DTO types     ──
export type AddToCartBodyDTO = z.infer<typeof addToCartSchema.body>;
export type DeleteFromCartBodyDTO = z.infer<typeof deleteFromCartSchema.body>;
