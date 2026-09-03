import { paginationMeta, paginationQuerySchema, type PaginationQuery } from "@oston/contracts";

export function parsePagination(query: unknown): PaginationQuery & { skip: number; take: number } {
  const parsed = paginationQuerySchema.parse(query);
  return {
    ...parsed,
    skip: (parsed.page - 1) * parsed.pageSize,
    take: parsed.pageSize,
  };
}

export function toPage<T>(rows: T[], total: number, page: number, pageSize: number) {
  return {
    data: rows,
    meta: paginationMeta(total, page, pageSize),
  };
}
