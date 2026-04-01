import type { PaginationMeta } from '@types-app/index.js';

const MAX_PAGE_SIZE = 100;
const DEFAULT_PAGE_SIZE = 10;

export interface PaginationResult {
  limit: number;
  skip: number;
  page: number;
}

export const paginationFunction = ({
  page = 1,
  size = DEFAULT_PAGE_SIZE,
}: { page?: number; size?: number } = {}): PaginationResult => {
  const safePage = Math.max(1, page);
  const safeSize = Math.min(Math.max(1, size), MAX_PAGE_SIZE);
  return { limit: safeSize, skip: (safePage - 1) * safeSize, page: safePage };
};

export const buildPaginationMeta = ({
  page,
  limit,
  total,
}: {
  page: number;
  limit: number;
  total: number;
}): PaginationMeta => {
  const totalPages = Math.ceil(total / limit);
  return {
    currentPage: page,
    pageSize: limit,
    totalItems: total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
};
