import morgan from 'morgan';
import { logger } from '@services/logger.js';
import type { RequestHandler } from 'express';

const stream = {
  write: (message: string) => logger.http(message.trim()),
};

export const requestLogger: RequestHandler = morgan(
  ':method :url :status :res[content-length] - :response-time ms',
  { stream },
) as RequestHandler;
