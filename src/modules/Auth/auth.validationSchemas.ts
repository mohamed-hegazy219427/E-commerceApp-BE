import { z } from 'zod';
import { generalFields } from '@middlewares/validation.js';
import { systemRoles } from '@utils/systemRoles.js';
import type { ValidationSchema } from '@middlewares/validation.js';

export const signUpSchema: ValidationSchema = {
  body: z
    .object({
      userName: z.string().trim().min(2).max(50),
      email: generalFields.email,
      password: generalFields.password,
      confirmPassword: z.string(),
      address: z
        .array(z.object({ street: z.string(), city: z.string(), country: z.string(), postalCode: z.string().optional() }))
        .optional(),
      gender: z.enum(['male', 'female', 'not_specified']).default('not_specified').optional(),
      age: z.number().min(1).max(120).optional(),
      phoneNumber: z.string().regex(/^[+]?[\d\s\-()]{7,15}$/, 'Invalid phone number'),
      role: z.enum([systemRoles.USER, systemRoles.ADMIN, systemRoles.SUPER_ADMIN]).default(systemRoles.USER).optional(),
    })
    .refine((d) => d.password === d.confirmPassword, { message: 'Passwords do not match', path: ['confirmPassword'] }),
};

export const logInSchema: ValidationSchema = {
  body: z.object({ email: generalFields.email, password: generalFields.password }),
};

export const confirmEmailSchema: ValidationSchema = {
  params: z.object({ token: generalFields.jwtToken }),
};

export const forgetPasswordSchema: ValidationSchema = {
  body: z.object({ email: generalFields.email }),
};

export const resetPasswordSchema: ValidationSchema = {
  params: z.object({ token: generalFields.jwtToken }),
  body: z.object({ otp: z.string().length(4), newPassword: generalFields.password }),
};
