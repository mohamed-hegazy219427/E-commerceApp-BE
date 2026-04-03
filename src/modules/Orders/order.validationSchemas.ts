import { z } from 'zod';
import { generalFields } from '@middlewares/validation.js';
import type { ValidationSchema } from '@middlewares/validation.js';

const addressSchema = z.object({
  street: z.string().min(1),
  city: z.string().min(1),
  country: z.string().min(1),
  postalCode: z.string().optional(),
});

export type AddressDTO = z.infer<typeof addressSchema>;

export const createOrderSchema = {
  body: z.object({
    productId: generalFields.objectId,
    quantity: z.number().min(1),
    address: addressSchema,
    phoneNumbers: z.array(z.string().regex(/^[+]?[\d\s\-()]{7,15}$/)).min(1),
    paymentMethod: z.enum(['cash', 'card']),
    couponCode: z.string().optional(),
  }),
} satisfies ValidationSchema;

export const fromCartToOrderSchema = {
  body: z.object({
    cartId: generalFields.objectId,
    address: addressSchema,
    phoneNumbers: z.array(z.string()).min(1),
    paymentMethod: z.enum(['cash', 'card']),
    couponCode: z.string().optional(),
  }),
} satisfies ValidationSchema;

export const deliverOrderSchema = {
  params: z.object({ orderId: generalFields.objectId }),
} satisfies ValidationSchema;

export const cancelOrderSchema = {
  params: z.object({ orderId: generalFields.objectId }),
  body: z.object({ reason: z.string().max(500).optional() }),
} satisfies ValidationSchema;

//   DTO types     ──
export type CreateOrderBodyDTO = z.infer<typeof createOrderSchema.body>;
export type FromCartToOrderBodyDTO = z.infer<typeof fromCartToOrderSchema.body>;
export type DeliverOrderParamsDTO = z.infer<typeof deliverOrderSchema.params>;
export type CancelOrderBodyDTO = z.infer<typeof cancelOrderSchema.body>;
export type CancelOrderParamsDTO = z.infer<typeof cancelOrderSchema.params>;
