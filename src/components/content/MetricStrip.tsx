import type { ReactNode } from "react";

export interface MetricStripItem {
  label: ReactNode;
  value: ReactNode;
}

interface MetricStripProps {
  ariaLabel: string;
  items: readonly MetricStripItem[];
}

export function MetricStrip({ ariaLabel, items }: MetricStripProps) {
  return (
    <dl
      aria-label={ariaLabel}
      className="fuma-metric-strip"
      data-visual-contract="metric-strip"
      role="group"
    >
      {items.map((item, index) => (
        <div className="fuma-metric-strip__item" key={index}>
          <dt>{item.label}</dt>
          <dd>{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
