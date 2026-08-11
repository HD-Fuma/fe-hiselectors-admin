export interface PaginationProps {
  onPageChange?: (page: number) => void;
  page: number;
  totalPages: number;
  pageSize: number;
}

export function Pagination({ onPageChange, page, pageSize, totalPages }: PaginationProps) {
  const canGoPrevious = Boolean(onPageChange) && page > 1;
  const canGoNext = Boolean(onPageChange) && page < totalPages;

  return (
    <nav aria-label="페이지 이동" className="hsas-pagination">
      <button
        aria-label="이전 페이지"
        className="hsas-pagination__button"
        disabled={!canGoPrevious}
        onClick={() => onPageChange?.(page - 1)}
        type="button"
      >
        ‹
      </button>
      <span aria-current="page" className="hsas-pagination__summary">
        {page} / {totalPages} 페이지
      </span>
      <span className="hsas-pagination__size">페이지당 {pageSize}개</span>
      <button
        aria-label="다음 페이지"
        className="hsas-pagination__button"
        disabled={!canGoNext}
        onClick={() => onPageChange?.(page + 1)}
        type="button"
      >
        ›
      </button>
    </nav>
  );
}
