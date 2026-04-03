import type { Request } from 'express';
import type { Types } from 'mongoose';
import type { IUserDocument } from '../../modules/Auth/auth.types.js';
import type { Lang } from '@i18n/index.js';
import type { Translations } from '@i18n/index.js';

//   Express Request augmentation               ──
declare global {
  namespace Express {
    interface Request {
      authUser?: IUserDocument;
      uploadPath?: string;
      lang: Lang;
      t: Translations;
      id: string; // requestId — injected by requestIdMiddleware
    }
  }
}

//   TypedRequest    ──
// Cast an Express Request to a strongly-typed shape after validation passes.
//
// Usage in controllers:
//   const req = _req as TypedRequest<LoginBodyDTO>
//   const { email, password } = req.body   // string, string — no cast
//
// With query / params:
//   const req = _req as TypedRequest<AddProductBodyDTO, AddProductQueryDTO>
//   const { brandId } = req.query          // string — from Zod schema
//
export type TypedRequest<
  TBody = Record<string, unknown>,
  TQuery = Record<string, string>,
  TParams extends Record<string, string> = Record<string, string>,
> = Omit<Request, 'body' | 'query' | 'params'> & {
  body: TBody;
  query: TQuery;
  params: TParams;
};

//   Pagination     ─
export interface PaginationMeta {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginationQuery {
  page?: string;
  size?: string;
}

//   API Response shapes  ─
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

//   Shared primitives
export type ObjectId = Types.ObjectId;

export interface TokenPayload {
  _id: string;
  email: string;
  role: string;
}
