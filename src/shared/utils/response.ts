import type { Response } from 'express';
import type { PaginationMeta, ApiSuccessResponse, ApiErrorResponse } from '@types-app/index.js';

export const sendSuccess = <T>(
  res: Response,
  data: T,
  message = 'Done',
  statusCode = 200,
  pagination?: PaginationMeta,
): Response<ApiSuccessResponse<T>> => {
  const payload: ApiSuccessResponse<T> = { success: true, message, data };
  if (pagination) payload.pagination = pagination;
  return res.status(statusCode).json(payload);
};

export const sendError = (
  res: Response,
  message: string,
  statusCode = 500,
  errors?: string[],
): Response<ApiErrorResponse> => {
  const payload: ApiErrorResponse = { success: false, message };
  if (errors?.length) payload.errors = errors;
  return res.status(statusCode).json(payload);
};
