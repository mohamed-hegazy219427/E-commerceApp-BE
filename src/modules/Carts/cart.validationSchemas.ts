import { z } from 'zod';
import { generalFields } from '@middlewares/validation.js';
import type { ValidationSchema } from '@middlewares/validation.js';

export const addToCartSchema: ValidationSchema = {
  body: z.object({ productId: generalFields.objectId, quantity: z.number().min(1) }),
};

export const deleteFromCartSchema: ValidationSchema = {
  body: z.object({ productId: generalFields.objectId }),
};
