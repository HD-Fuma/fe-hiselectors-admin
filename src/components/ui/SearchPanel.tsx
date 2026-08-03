import type { ReactNode } from "react";

export interface SearchPanelProps {
  children: ReactNode;
  actions?: ReactNode;
}

export function SearchPanel({ actions, children }: SearchPanelProps) {
  return (
    <section aria-label="Search filters" className="hsas-search-panel" role="search">
      <div className="hsas-search-panel__fields">{children}</div>
      {actions ? <div className="hsas-search-panel__actions">{actions}</div> : null}
    </section>
  );
}
