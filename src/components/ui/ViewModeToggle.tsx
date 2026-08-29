import { useEffect, useId, useState } from "react";
import { Tooltip } from "./Tooltip";

export type ViewMode = "grid" | "list";

export interface ViewModeToggleProps {
  value: ViewMode;
  onChange: (value: ViewMode) => void;
  gridLabel?: string;
  listLabel?: string;
  tooltip?: string;
  tooltipPlacement?: "bottom" | "top";
  autoShowTooltip?: boolean;
}

export function ViewModeToggle({
  value,
  onChange,
  gridLabel = "카드",
  listLabel = "목록",
  tooltip = "보기를 변경할 수 있습니다",
  tooltipPlacement = "top",
  autoShowTooltip = true,
}: ViewModeToggleProps) {
  const tooltipId = useId();
  const [showTooltip, setShowTooltip] = useState(autoShowTooltip);
  const toggleView = () => onChange(value === "grid" ? "list" : "grid");

  useEffect(() => {
    if (!autoShowTooltip) {
      return;
    }

    const timeoutId = window.setTimeout(() => setShowTooltip(false), 2000);
    return () => window.clearTimeout(timeoutId);
  }, [autoShowTooltip]);

  return (
    <div className="hsas-view-mode-toggle-wrap">
      <button
        aria-checked={value === "list"}
        aria-describedby={tooltipId}
        aria-label="보기 방식"
        className={`hsas-view-mode-toggle is-${value}`}
        onClick={toggleView}
        role="switch"
        type="button"
      >
        <span aria-hidden="true" className="hsas-view-mode-toggle__slider" />
        <span aria-hidden="true" className="hsas-view-mode-toggle__label is-grid">
          {gridLabel}
        </span>
        <span aria-hidden="true" className="hsas-view-mode-toggle__label is-list">
          {listLabel}
        </span>
      </button>
      <Tooltip
        id={tooltipId}
        placement={tooltipPlacement}
        visible={showTooltip}
      >
        {tooltip}
      </Tooltip>
    </div>
  );
}
