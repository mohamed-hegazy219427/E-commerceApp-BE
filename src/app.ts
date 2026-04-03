import express, { type Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
import { createHandler } from 'graphql-http/lib/use/express';
import * as allRouters from './modules/index.routes.js';
import { globalErrorHandler } from './middlewares/errorHandler.js';
import { requestIdMiddleware, requestLogger } from './middlewares/requestLogger.js';
import { i18nMiddleware } from './middlewares/i18n.js';
import { generalLimiter } from './middlewares/rateLimiter.js';
import { changeCouponStatusCron } from './shared/utils/crons.js';
import { env } from './config/env.js';
import { AppError } from './shared/utils/AppError.js';
import { categorySchema } from './modules/Categories/GraphQl/graphqlCategorySchema.js';
import { ROUTES } from '@constants/index.js';

export const createApp = (): Application => {
  const app = express();

  // ── Security headers  ─
  app.use(helmet());

  // ── CORS      ─
  app.use(
    cors({
      origin: env.FRONTEND_URL,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    }),
  );

  // ── Body parsers   ──
  // NOTE: /api/v1/order/webhook uses express.raw() applied at the route level
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParser());

  // ── Sanitize MongoDB operators from user input          ─
  app.use(mongoSanitize());

  // ── Request ID + HTTP access logging             ─
  app.use(requestIdMiddleware);
  app.use(requestLogger);
  app.use(i18nMiddleware);

  // ── Global rate limiter                 ──
  app.use(generalLimiter);

  // ── Health check   ─
  app.get('/health', (_req, res) => res.status(200).json({ status: 'ok', env: env.NODE_ENV }));

  // ── GraphQL     ─
  app.use(ROUTES.GRAPHQL_CATEGORY, createHandler({ schema: categorySchema }));

  // ── REST API v1
  app.use(ROUTES.AUTH, allRouters.authRouter);
  app.use(ROUTES.CATEGORY, allRouters.categoryRouter);
  app.use(ROUTES.SUB_CATEGORY, allRouters.subCategoryRouter);
  app.use(ROUTES.BRAND, allRouters.brandRouter);
  app.use(ROUTES.PRODUCT, allRouters.productRouter);
  app.use(ROUTES.COUPON, allRouters.couponRouter);
  app.use(ROUTES.CART, allRouters.cartRouter);
  app.use(ROUTES.ORDER, allRouters.orderRouter);
  app.use(ROUTES.REVIEW, allRouters.reviewRouter);

  // ── 404 fallback   ─
  app.all('*', (req, _res, next) =>
    next(new AppError(`Cannot find ${req.method} ${req.originalUrl}`, 404)),
  );

  // ── Global error handler                 ─
  app.use(globalErrorHandler);

  return app;
};

export const startCronJobs = (): void => {
  changeCouponStatusCron();
};
