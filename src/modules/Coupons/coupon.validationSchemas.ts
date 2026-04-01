import { z } from 'zod';
import { generalFields } from '@middlewares/validation.js';
import type { ValidationSchema } from '@middlewares/validation.js';

export const addCouponSchema: ValidationSchema = {
  body: z
    .object({
      couponCode: z.string().min(3).max(20),
      couponAmount: z.number().min(1),
      isPercentage: z.boolean(),
      isFixedAmount: z.boolean(),
      fromDate: z.coerce.date(),
      toDate: z.coerce.date(),
    })
    .refine((d) => d.toDate > d.fromDate, { message: 'toDate must be after fromDate', path: ['toDate'] })
    .refine((d) => !(d.isPercentage && d.isFixedAmount), { message: 'Cannot be both percentage and fixed amount' })
    .refine((d) => d.isPercentage || d.isFixedAmount, { message: 'Must be either percentage or fixed amount' }),
};

export const deleteCouponSchema: ValidationSchema = {
  query: z.object({ couponId: generalFields.objectId }),
};

export const assignUserSchema: ValidationSchema = {
  query: z.object({ couponId: generalFields.objectId }),
  body: z.object({ userId: generalFields.objectId, maxUsage: z.number().min(1).default(1) }),
};
