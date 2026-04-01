import type { Request, Response, NextFunction, RequestHandler } from 'express';
import cloudinary from '@config/cloudinary.js';
import { logger } from '@services/logger.js';

type AsyncController = (req: Request, res: Response, next: NextFunction) => Promise<void | Response>;

export const asyncHandler = (fn: AsyncController): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(async (err: unknown) => {
      // Clean up any Cloudinary resources that were already uploaded
      if (req.uploadPath) {
        try {
          await cloudinary.api.delete_resources_by_prefix(req.uploadPath);
          await cloudinary.api.delete_folder(req.uploadPath);
        } catch (cleanupErr) {
          logger.warn('Failed to clean up Cloudinary upload on error', { uploadPath: req.uploadPath, cleanupErr });
        }
      }
      next(err);
    });
  };
};
