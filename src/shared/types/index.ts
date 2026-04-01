import type { Request } from 'express';
import type { Types } from 'mongoose';
import type { IUserDocument } from '../../modules/Auth/auth.types.js';
import type { Lang } from '@i18n/index.js';
import type { Translations } from '@i18n/index.js';

// Augment Express Request with custom fields
declare global {
  namespace Express {
    interface Request {
      authUser?: IUserDocument;
      uploadPath?: string;
      lang: Lang;
      t: Translations;
    }
  }
}

export interface PaginationMeta {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface ApiSuccessResponse<T = unknown> {
  success: true;
  message: string;
  data?: T;
  pagination?: PaginationMeta;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: string[];
}

export type ObjectId = Types.ObjectId;

export interface TokenPayload {
  _id: string;
  email: string;
  role: string;
}

export interface PaginationQuery {
  page?: string;
  size?: string;
}
