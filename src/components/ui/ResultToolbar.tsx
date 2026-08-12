import type { ReactNode } from "react";

export interface ResultToolbarProps {
  actions?: ReactNode;
  className?: string;
  description?: ReactNode;
  meta?: ReactNode;
  title: ReactNode;
}

function hasSlot(value: ReactNode) {
  return value !== null && value !== undefined && value !== false;
}

export function ResultToolbar({
  actions,
  className,
  description,
  meta,
  title,
}: ResultToolbarProps) {
  return (
    <div className={["fuma-result-toolbar", className].filter(Boolean).join(" ")}>
      <strong>{title}</strong>
      {hasSlot(description) ? (
        <span className="fuma-result-toolbar__description">{description}</span>
      ) : null}
      {hasSlot(meta) ? <div className="fuma-settlement-result-meta">{meta}</div> : null}
      {hasSlot(actions) ? <div className="fuma-result-toolbar__actions">{actions}</div> : null}
    </div>
  );
}
