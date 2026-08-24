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
  useEffect(() => {
    const timeoutId = window.setTimeout(() => setShowTooltip(false), 2000);
    return () => window.clearTimeout(timeoutId);
  }, []);

  return (
    <div
      className="hsas-view-mode-toggle-wrap"
      onMouseEnter={() => setShowTooltip(false)}
    >
      <div
        aria-describedby={tooltipId}
        aria-label="보기 방식"
        className={`hsas-view-mode-toggle is-${value}`}
        role="group"
      >
        <span aria-hidden="true" className="hsas-view-mode-toggle__slider" />
        <button
          aria-pressed={value === "grid"}
          onClick={() => onChange("grid")}
          type="button"
        >
          카드
        </button>
        <button
          aria-pressed={value === "list"}
          onClick={() => onChange("list")}
          type="button"
        >
          목록
        </button>
      </div>
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
