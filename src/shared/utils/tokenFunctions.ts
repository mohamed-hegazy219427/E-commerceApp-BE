import jwt from 'jsonwebtoken';
import type { TokenPayload } from '@types-app/index.js';
import type { Result } from './result.js';
import { ok, fail } from './result.js';
import { AppError } from './AppError.js';

interface GenerateTokenOptions {
  payload: jwt.JwtPayload;
  signature: string;
  expiresIn?: string | number;
}

interface VerifyTokenOptions {
  token: string;
  signature: string;
}

export const generateToken = ({
  payload,
  signature,
  expiresIn = '1d',
}: GenerateTokenOptions): string => {
  if (!Object.keys(payload).length) {
    throw new Error('Token payload cannot be empty');
  }
  return jwt.sign(payload, signature, { expiresIn: expiresIn as jwt.SignOptions['expiresIn'] });
};

//   verifyToken
// Returns Result<T> instead of throwing, so callers handle errors explicitly:
//
//   const result = verifyToken<{ email: string }>({ token, signature })
//   if (!result.ok) return next(result.error)
//   const { email } = result.value
//
export const verifyToken = <T = TokenPayload>({
  token,
  signature,
}: VerifyTokenOptions): Result<T> => {
  if (!token) return fail(new AppError('Token is required', 401));
  try {
    return ok(jwt.verify(token, signature) as T);
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return fail(new AppError('Token expired, please refresh', 401));
    }
    return fail(new AppError('Invalid token', 401));
  }
};
