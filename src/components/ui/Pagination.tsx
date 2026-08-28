import { ChevronLeft, ChevronRight } from "lucide-react";
import { Select } from "./Controls";

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100].map((size) => ({
  label: `${size}개 보기`,
  value: String(size),
}));

export interface PaginationProps {
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  page: number;
  totalPages: number;
  pageSize: number;
}

export function Pagination({
  onPageChange,
  onPageSizeChange,
  page,
  pageSize,
  totalPages,
}: PaginationProps) {
  const canGoPrevious = Boolean(onPageChange) && page > 1;
  const canGoNext = Boolean(onPageChange) && page < totalPages;

  return (
    <nav aria-label="페이지 이동" className="hsas-pagination">
      <button
        aria-label="이전 페이지"
        className={canGoPrevious
          ? "hsas-pagination__button hsas-pagination__button--interactive"
          : "hsas-pagination__button"}
        disabled={!canGoPrevious}
        onClick={() => onPageChange?.(page - 1)}
        type="button"
      >
        <ChevronLeft aria-hidden="true" size={19} strokeWidth={2.25} />
      </button>
      <span aria-current="page" className="hsas-pagination__summary">
        {page} / {totalPages} 페이지
      </span>
      <span className="hsas-pagination__size">
        <Select
          aria-label="페이지당 표시 개수"
          className="hsas-pagination__size-select"
          disabled={!onPageSizeChange}
          onChange={(event) => onPageSizeChange?.(Number(event.target.value))}
          options={PAGE_SIZE_OPTIONS}
          value={String(pageSize)}
        />
      </span>
      <button
        aria-label="다음 페이지"
        className={canGoNext
          ? "hsas-pagination__button hsas-pagination__button--interactive"
          : "hsas-pagination__button"}
        disabled={!canGoNext}
        onClick={() => onPageChange?.(page + 1)}
        type="button"
      >
        <ChevronRight aria-hidden="true" size={19} strokeWidth={2.25} />
      </button>
    </nav>
  );
}
