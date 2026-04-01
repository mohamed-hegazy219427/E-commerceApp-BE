import { z, type ZodSchema, type ZodError } from 'zod';
import { Types } from 'mongoose';
import type { Request, Response, NextFunction, RequestHandler } from 'express';

const REQ_SOURCES = ['body', 'query', 'params', 'headers', 'file', 'files'] as const;
type ReqSource = (typeof REQ_SOURCES)[number];

export type ValidationSchema = Partial<Record<ReqSource, ZodSchema>>;

// ─── Common reusable field schemas ──────────────────────────────────────────
export const generalFields = {
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])/, 'Password must contain uppercase, lowercase and a digit'),
  objectId: z.string().refine((v) => Types.ObjectId.isValid(v), { message: 'Invalid ObjectId' }),
  jwtToken: z.string().regex(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_.+/=]*$/, 'Invalid token format'),
};

// ─── Middleware factory ──────────────────────────────────────────────────────
export const validate = (schema: ValidationSchema): RequestHandler => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const errors: string[] = [];

    for (const source of REQ_SOURCES) {
      const fieldSchema = schema[source];
      if (!fieldSchema) continue;

      const result = fieldSchema.safeParse(req[source as keyof Request]);
      if (!result.success) {
        const zodErr = result.error as ZodError;
        errors.push(...zodErr.errors.map((e) => `${source}.${e.path.join('.')}: ${e.message}`));
      }
    }

    if (errors.length) {
      const err = Object.assign(new Error('Validation failed'), { statusCode: 422, errors });
      return next(err);
    }
    next();
  };
};

// ─── GraphQL validation helper ───────────────────────────────────────────────
export const graphqlValidation = (schema: ZodSchema, args: unknown): true => {
  const result = schema.safeParse(args);
  if (!result.success) throw new Error(result.error.errors.map((e) => e.message).join(', '));
  return true;
};
