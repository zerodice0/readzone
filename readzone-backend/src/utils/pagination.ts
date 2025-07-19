import { PaginationParams, PaginationMeta } from '@/types/api';

export const createPaginationMeta = (
  page: number,
  limit: number,
  total: number
): PaginationMeta => {
  const totalPages = Math.ceil(total / limit);
  
  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
};

export const parsePaginationParams = (params: PaginationParams) => {
  const page = Math.max(1, parseInt(String(params.page)) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(String(params.limit)) || 20));
  const skip = (page - 1) * limit;
  
  return { page, limit, skip };
};