import { useEffect, useId, useState } from "react";

export type ViewMode = "grid" | "list";

export interface ViewModeToggleProps {
  value: ViewMode;
  onChange: (value: ViewMode) => void;
  tooltip?: string;
}

export function ViewModeToggle({
  value,
  onChange,
  tooltip = "보기 방식을 변경할 수 있습니다",
}: ViewModeToggleProps) {
  const tooltipId = useId();
  const [showTooltip, setShowTooltip] = useState(true);
  const toggleView = () => onChange(value === "grid" ? "list" : "grid");

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setShowTooltip(false), 2000);
    return () => window.clearTimeout(timeoutId);
  }, []);

  return (
    <div
      className="hsas-view-mode-toggle-wrap"
      onMouseEnter={() => setShowTooltip(false)}
    >
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
          카드
        </span>
        <span aria-hidden="true" className="hsas-view-mode-toggle__label is-list">
          목록
        </span>
      </button>
      <span
        className={`hsas-view-mode-toggle__tooltip${showTooltip ? " is-visible" : ""}`}
        id={tooltipId}
        role="tooltip"
      >
        {tooltip}
      </span>
    </div>
  );
}
