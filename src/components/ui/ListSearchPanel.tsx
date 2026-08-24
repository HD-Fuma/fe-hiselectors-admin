import type { ReactNode } from "react";
import { SearchPanel } from "./SearchPanel";

interface ListSearchPanelProps {
  actions?: ReactNode;
  children: ReactNode;
}

export function ListSearchPanel({ actions, children }: ListSearchPanelProps) {
  return (
    <div
      className="fuma-operations-search fuma-settlement-search fuma-list-search"
      data-visual-contract="list-search-panel"
    >
      <SearchPanel actions={actions}>{children}</SearchPanel>
    </div>
  );
}
