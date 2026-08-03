export interface PaginationProps {
  page: number;
  totalPages: number;
  pageSize: number;
}

export function Pagination({ page, pageSize, totalPages }: PaginationProps) {
  return (
    <nav aria-label="Pagination" className="hsas-pagination">
      <button aria-label="Previous page" className="hsas-pagination__button" disabled type="button">
        ‹
      </button>
      <span aria-current="page" className="hsas-pagination__summary">
        Page {page} of {totalPages}
      </span>
      <span className="hsas-pagination__size">{pageSize} per page</span>
      <button aria-label="Next page" className="hsas-pagination__button" disabled type="button">
        ›
      </button>
    </nav>
  );
}
