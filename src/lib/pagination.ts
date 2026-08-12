export interface PaginationSlice<T> {
  currentPage: number;
  pagedItems: T[];
  totalPages: number;
}

function positiveInteger(value: number) {
  return Number.isFinite(value) && value >= 1 ? Math.floor(value) : 1;
}

export function paginate<T>(
  items: readonly T[],
  requestedPage: number,
  pageSize: number,
): PaginationSlice<T> {
  const validPageSize = positiveInteger(pageSize);
  const totalPages = Math.max(1, Math.ceil(items.length / validPageSize));
  const currentPage = Math.min(positiveInteger(requestedPage), totalPages);
  const startIndex = (currentPage - 1) * validPageSize;

  return {
    currentPage,
    pagedItems: items.slice(startIndex, startIndex + validPageSize),
    totalPages,
  };
}
