import { randomUUID } from 'crypto';
import morgan from 'morgan';
import { logger } from '@services/logger.js';
import type { RequestHandler } from 'express';

//   Request ID middleware                  ─
// Stamps every incoming request with a UUID so log lines can be correlated.
// Must be applied before requestLogger in the middleware stack.
//
export const requestIdMiddleware: RequestHandler = (req, _res, next) => {
  req.id = randomUUID();
  next();
};

//   HTTP access logger  ──
const stream = {
  write: (message: string) => logger.http(message.trim(), { module: 'http' }),
};

// Include :req[x-request-id] if forwarded, else fall back to nothing
morgan.token('id', (req) => (req as typeof req & { id?: string }).id ?? '-');

export const requestLogger: RequestHandler = morgan(
  ':id :method :url :status :res[content-length] - :response-time ms',
  { stream },
) as RequestHandler;
