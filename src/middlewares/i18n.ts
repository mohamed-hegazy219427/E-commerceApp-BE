import type { Request, Response, NextFunction, RequestHandler } from 'express';
import { getTranslations, type Lang } from '@i18n/index.js';

/**
 * Reads Accept-Language header (e.g. "ar", "ar-EG", "en").
 * Attaches req.lang and req.t (translation dictionary) to every request.
 */
export const i18nMiddleware: RequestHandler = (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  const header = req.headers['accept-language'] ?? 'en';
  const lang: Lang = header.startsWith('ar') ? 'ar' : 'en';
  req.lang = lang;
  req.t = getTranslations(lang);
  next();
};
