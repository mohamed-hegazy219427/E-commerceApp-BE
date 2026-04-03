import multer, { type FileFilterCallback } from 'multer';
import path from 'path';
import type { Request } from 'express';
import { AppError } from '@utils/AppError.js';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

export const multerLocalFunction = (
  allowedMimeTypes: readonly string[],
  destination = './Files',
) => {
  const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, destination),
    filename: (_req, file, cb) =>
      cb(
        null,
        `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`,
      ),
  });

  const fileFilter = (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return cb(new AppError(`Invalid file type. Allowed: ${allowedMimeTypes.join(', ')}`, 400));
    }
    cb(null, true);
  };

  return multer({ storage, fileFilter, limits: { fileSize: MAX_FILE_SIZE_BYTES } });
};
