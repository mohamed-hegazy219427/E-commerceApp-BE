import { z } from 'zod';
import { generalFields } from '@middlewares/validation.js';
import { systemRoles } from '@utils/systemRoles.js';
import type { ValidationSchema } from '@middlewares/validation.js';

//   Schemas (satisfies preserves specific Zod type for z.infer)     ─

export const signUpSchema = {
  body: z
    .object({
      userName: z.string().trim().min(2).max(50),
      email: generalFields.email,
      password: generalFields.password,
      confirmPassword: z.string(),
      address: z
        .array(
          z.object({
            street: z.string(),
            city: z.string(),
            country: z.string(),
            postalCode: z.string().optional(),
          }),
        )
        .optional(),
      gender: z.enum(['male', 'female', 'not_specified']).default('not_specified').optional(),
      age: z.number().min(1).max(120).optional(),
      phoneNumber: z.string().regex(/^[+]?[\d\s\-()]{7,15}$/, 'Invalid phone number'),
      role: z
        .enum([systemRoles.USER, systemRoles.ADMIN, systemRoles.SUPER_ADMIN])
        .default(systemRoles.USER)
        .optional(),
    })
    .refine((d) => d.password === d.confirmPassword, {
      message: 'Passwords do not match',
      path: ['confirmPassword'],
    }),
} satisfies ValidationSchema;

export const logInSchema = {
  body: z.object({ email: generalFields.email, password: generalFields.password }),
} satisfies ValidationSchema;

export const confirmEmailSchema = {
  params: z.object({ token: generalFields.jwtToken }),
} satisfies ValidationSchema;

export const forgetPasswordSchema = {
  body: z.object({ email: generalFields.email }),
} satisfies ValidationSchema;

export const resetPasswordSchema = {
  params: z.object({ token: generalFields.jwtToken }),
  body: z.object({ otp: z.string().length(4), newPassword: generalFields.password }),
} satisfies ValidationSchema;

export const loginWithGoogleSchema = {
  body: z.object({ idToken: z.string().min(1) }),
} satisfies ValidationSchema;

//   DTO types — Zod is the single source of truth
export type SignUpBodyDTO = z.infer<typeof signUpSchema.body>;
export type LoginBodyDTO = z.infer<typeof logInSchema.body>;
export type ConfirmEmailParamsDTO = z.infer<typeof confirmEmailSchema.params>;
export type ForgetPasswordBodyDTO = z.infer<typeof forgetPasswordSchema.body>;
export type ResetPasswordBodyDTO = z.infer<typeof resetPasswordSchema.body>;
export type ResetPasswordParamsDTO = z.infer<typeof resetPasswordSchema.params>;
export type LoginWithGoogleBodyDTO = z.infer<typeof loginWithGoogleSchema.body>;
