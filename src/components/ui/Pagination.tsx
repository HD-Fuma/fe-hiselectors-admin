export interface PaginationProps {
  page: number;
  totalPages: number;
  pageSize: number;
}

export function Pagination({ page, pageSize, totalPages }: PaginationProps) {
  return (
    <nav aria-label="페이지 이동" className="hsas-pagination">
      <button aria-label="이전 페이지" className="hsas-pagination__button" disabled type="button">
        ‹
      </button>
      <span aria-current="page" className="hsas-pagination__summary">
        {page} / {totalPages} 페이지
      </span>
      <span className="hsas-pagination__size">페이지당 {pageSize}개</span>
      <button aria-label="다음 페이지" className="hsas-pagination__button" disabled type="button">
        ›
      </button>
    </nav>
  );
}
