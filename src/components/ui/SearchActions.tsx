import type { ReactNode } from "react";
import { Button } from "./Controls";

export interface SearchActionsProps {
  className?: string;
  onReset: () => void;
  onSearch: () => void;
  resetClassName?: string;
  resetLabel?: ReactNode;
  searchClassName?: string;
  searchLabel?: ReactNode;
}

function classes(...values: Array<string | undefined>) {
  return values.filter(Boolean).join(" ") || undefined;
}

export function SearchActions({
  className,
  onReset,
  onSearch,
  resetClassName,
  resetLabel = "초기화",
  searchClassName,
  searchLabel = "조회",
}: SearchActionsProps) {
  return (
    <>
      <Button
        className={classes(className, searchClassName)}
        onClick={onSearch}
        type="submit"
        variant="primary"
      >
        {searchLabel}
      </Button>
      <Button className={classes(className, resetClassName)} onClick={onReset}>
        {resetLabel}
      </Button>
    </>
  );
}
