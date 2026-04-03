import { z } from 'zod';
import { generalFields } from '@middlewares/validation.js';
import type { ValidationSchema } from '@middlewares/validation.js';

export const addReviewSchema = {
  body: z.object({
    productId: generalFields.objectId,
    comment: z.string().max(1000).optional(),
    rate: z.number().int().min(1).max(5),
  }),
} satisfies ValidationSchema;

//   DTO types     ──
export type AddReviewBodyDTO = z.infer<typeof addReviewSchema.body>;
