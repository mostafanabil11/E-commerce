/**
 * Response envelopes matching what the frontend already parses:
 * lists are `{ status, results, metadata, data }`, single items `{ status, data }`.
 */

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
}

export interface ListMetadata {
  currentPage: number;
  numberOfPages: number;
  limit: number;
  nextPage?: number;
  prevPage?: number;
}

export function buildMetadata({ page, limit, total }: PaginationInfo): ListMetadata {
  const numberOfPages = limit > 0 ? Math.ceil(total / limit) : 0;
  const metadata: ListMetadata = {
    currentPage: page,
    numberOfPages,
    limit,
  };
  if (page < numberOfPages) metadata.nextPage = page + 1;
  if (page > 1) metadata.prevPage = page - 1;
  return metadata;
}

export function listResponse<T>(data: T[], pagination: PaginationInfo) {
  return {
    status: 'success' as const,
    results: pagination.total,
    metadata: buildMetadata(pagination),
    data,
  };
}

export function itemResponse<T>(data: T) {
  return {
    status: 'success' as const,
    data,
  };
}
