import rateLimit from 'express-rate-limit';

const buildLimiter = (max: number, windowMs: number, message: string) =>
  rateLimit({
    max,
    windowMs,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message },
  });

export const loginLimiter = buildLimiter(5, 15 * 60 * 1000, 'Too many login attempts, try again in 15 minutes');
export const registerLimiter = buildLimiter(10, 60 * 60 * 1000, 'Too many registrations from this IP');
export const forgetPasswordLimiter = buildLimiter(3, 60 * 60 * 1000, 'Too many password reset requests, try again in 1 hour');
export const generalLimiter = buildLimiter(100, 60 * 1000, 'Too many requests, please slow down');
