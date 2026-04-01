import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction, RequestHandler } from 'express';
import { userModel } from '@models/user.model.js';
import { verifyToken } from '@utils/tokenFunctions.js';
import { AppError } from '@utils/AppError.js';
import { env } from '@config/env.js';
import type { SystemRole } from '@utils/systemRoles.js';
import type { TokenPayload } from '@types-app/index.js';
import type { IUserDocument } from '@models/user.model.js';

export const isAuth = (roles: SystemRole[]): RequestHandler => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const { authorization } = req.headers;

      if (!authorization) {
        return next(new AppError(req.t.auth.loginFirst, 401));
      }
      if (!authorization.startsWith(env.BEARER_TOKEN_KEY)) {
        return next(new AppError(req.t.auth.invalidTokenPrefix, 401));
      }

      const token = authorization.split('__')[1];
      if (!token) {
        return next(new AppError(req.t.auth.invalidToken, 401));
      }

      let decoded: TokenPayload;
      try {
        decoded = verifyToken<TokenPayload>({ token, signature: env.SIGN_IN_TOKEN_SECRET });
      } catch (err) {
        if (err instanceof jwt.TokenExpiredError) {
          return next(new AppError('Token expired, please refresh', 401));
        }
        return next(new AppError(req.t.auth.invalidToken, 401));
      }

      const user = await userModel.findById(decoded._id);
      if (!user) {
        return next(new AppError(req.t.auth.pleaseSignup, 401));
      }
      if (!roles.includes(user.role as SystemRole)) {
        return next(new AppError(req.t.unauthorized, 403));
      }

      req.authUser = user;
      next();
    } catch (err) {
      next(err);
    }
  };
};

// ─── GraphQL auth helper (throws instead of calling next) ───────────────────
export const isAuthQl = async (roles: SystemRole[], token: string): Promise<IUserDocument> => {
  if (!token) throw new Error('No token provided');

  let decoded: TokenPayload;
  try {
    decoded = verifyToken<TokenPayload>({ token, signature: env.SIGN_IN_TOKEN_SECRET });
  } catch {
    throw new Error('Invalid or expired token');
  }

  const user = await userModel.findById(decoded._id);
  if (!user) throw new Error('User not found');
  if (!roles.includes(user.role as SystemRole)) throw new Error('Unauthorized');

  return user;
};
