import type { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { AppError } from '@utils/AppError.js';
import { logger } from '@services/logger.js';
import { env } from '@config/env.js';

interface ErrorWithExtras extends Error {
  statusCode?: number;
  errors?: string[];
  code?: number;
  keyValue?: Record<string, unknown>;
}

export const globalErrorHandler = (
  err: ErrorWithExtras,
  req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  logger.error(`${req.method} ${req.originalUrl} — ${err.message}`, {
    stack: env.isDev ? err.stack : undefined,
    errors: err.errors,
  });

  // Mongoose CastError → 400
  if (err instanceof mongoose.Error.CastError) {
    res.status(400).json({ success: false, message: `Invalid value for field: ${err.path}` });
    return;
  }

  // Mongoose ValidationError → 422
  if (err instanceof mongoose.Error.ValidationError) {
    const errors = Object.values(err.errors).map((e) => e.message);
    res.status(422).json({ success: false, message: 'Validation failed', errors });
    return;
  }

  // MongoDB duplicate key → 409
  if (err.code === 11000 && err.keyValue) {
    const field = Object.keys(err.keyValue)[0];
    res.status(409).json({ success: false, message: `Duplicate value for field: ${field}` });
    return;
  }

  // Validation middleware errors
  if (err.message === 'Validation failed' && err.errors?.length) {
    res.status(422).json({ success: false, message: 'Validation failed', errors: err.errors });
    return;
  }

  // Known operational error (AppError)
  if (err instanceof AppError && err.isOperational) {
    res.status(err.statusCode).json({ success: false, message: err.message });
    return;
  }

  // Unknown / programmer error
  res.status(err.statusCode ?? 500).json({
    success: false,
    message: env.isProd ? 'Something went wrong' : err.message,
    ...(env.isDev && { stack: err.stack }),
  });
};
