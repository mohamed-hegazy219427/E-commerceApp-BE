import multer, { type FileFilterCallback } from 'multer';
import type { Request } from 'express';
import { AppError } from '@utils/AppError.js';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export const multerCloudFunction = (allowedMimeTypes: readonly string[]) => {
  const storage = multer.diskStorage({});

  const fileFilter = (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return cb(new AppError(`Invalid file type. Allowed: ${allowedMimeTypes.join(', ')}`, 400));
    }
    cb(null, true);
  };

  return multer({ storage, fileFilter, limits: { fileSize: MAX_FILE_SIZE_BYTES } });
};
