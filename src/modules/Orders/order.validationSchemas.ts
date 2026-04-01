import { z } from 'zod';
import { generalFields } from '@middlewares/validation.js';
import type { ValidationSchema } from '@middlewares/validation.js';

const addressSchema = z.object({
  street: z.string().min(1),
  city: z.string().min(1),
  country: z.string().min(1),
  postalCode: z.string().optional(),
});

export const createOrderSchema: ValidationSchema = {
  body: z.object({
    productId: generalFields.objectId,
    quantity: z.number().min(1),
    address: addressSchema,
    phoneNumbers: z.array(z.string().regex(/^[+]?[\d\s\-()]{7,15}$/)).min(1),
    paymentMethod: z.enum(['cash', 'card']),
    couponCode: z.string().optional(),
  }),
};

export const fromCartToOrderSchema: ValidationSchema = {
  body: z.object({
    cartId: generalFields.objectId,
    address: addressSchema,
    phoneNumbers: z.array(z.string()).min(1),
    paymentMethod: z.enum(['cash', 'card']),
    couponCode: z.string().optional(),
  }),
};

export const deliverOrderSchema: ValidationSchema = {
  params: z.object({ orderId: generalFields.objectId }),
};

export const cancelOrderSchema: ValidationSchema = {
  params: z.object({ orderId: generalFields.objectId }),
  body: z.object({ reason: z.string().max(500).optional() }),
};
