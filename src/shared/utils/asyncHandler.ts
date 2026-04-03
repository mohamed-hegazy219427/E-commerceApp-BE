import type { Request, Response, NextFunction, RequestHandler } from 'express';
import cloudinary from '@config/cloudinary.js';
import { logger } from '@services/logger.js';

//   Async Controller type                  ─
// Generic T preserves the controller's return type when used as a reference.
// The RequestHandler wrapper always returns void to satisfy Express.
//
type AsyncController<T = void | Response> = (
  req: Request,
  res: Response,
  next: NextFunction,
) => Promise<T>;

export const asyncHandler = <T = void | Response>(fn: AsyncController<T>): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(async (err: unknown) => {
      // Clean up any Cloudinary resources already uploaded before the error
      if (req.uploadPath) {
        try {
          await cloudinary.api.delete_resources_by_prefix(req.uploadPath);
          await cloudinary.api.delete_folder(req.uploadPath);
        } catch (cleanupErr) {
          logger.warn('Failed to clean up Cloudinary upload on error', {
            uploadPath: req.uploadPath,
            cleanupErr,
          });
        }
      }
      next(err);
    });
  };
};
