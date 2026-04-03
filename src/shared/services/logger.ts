import winston from 'winston';
import { env } from '@config/env.js';

const { combine, timestamp, colorize, printf, json, errors } = winston.format;

//   Structured log context
// Pass a LogContext to every logger call so logs are machine-queryable.
//
export interface LogContext {
  requestId?: string;
  userId?: string;
  module?: string;
  durationMs?: number;
  [key: string]: unknown;
}

const devFormat = combine(
  colorize({ all: true }),
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  errors({ stack: true }),
  printf(({ timestamp, level, message, stack, ...meta }) => {
    const metaStr = Object.keys(meta).length ? `\n${JSON.stringify(meta, null, 2)}` : '';
    return `${timestamp} [${level}]: ${stack ?? message}${metaStr}`;
  }),
);

const prodFormat = combine(timestamp(), errors({ stack: true }), json());

const winstonLogger = winston.createLogger({
  level: env.isDev ? 'debug' : 'info',
  format: env.isProd ? prodFormat : devFormat,
  transports: [
    new winston.transports.Console(),
    ...(env.isProd
      ? [
          new winston.transports.File({
            filename: 'logs/error.log',
            level: 'error',
          }),
          new winston.transports.File({ filename: 'logs/combined.log' }),
        ]
      : []),
  ],
});

//   Typed logger wrapper
export const logger = {
  debug: (msg: string, ctx?: LogContext) => winstonLogger.debug(msg, ctx),
  info: (msg: string, ctx?: LogContext) => winstonLogger.info(msg, ctx),
  http: (msg: string, ctx?: LogContext) => winstonLogger.http(msg, ctx),
  warn: (msg: string, ctx?: LogContext) => winstonLogger.warn(msg, ctx),
  error: (msg: string, ctx?: LogContext) => winstonLogger.error(msg, ctx),
};
