import type { ReactNode } from "react";

export interface SearchPanelProps {
  children: ReactNode;
  actions?: ReactNode;
}

export function SearchPanel({ actions, children }: SearchPanelProps) {
  return (
    <form
      aria-label="검색 조건"
      className="hsas-search-panel"
      onSubmit={(event) => event.preventDefault()}
      role="search"
    >
      <div className="hsas-search-panel__fields">{children}</div>
      {actions ? <div className="hsas-search-panel__actions">{actions}</div> : null}
    </form>
  );
}
