import type { HTMLAttributes } from "react";

export interface StatusPillProps extends HTMLAttributes<HTMLSpanElement> {
  status?: "approved" | "pending" | "rejected" | "neutral";
  tone?: "approved" | "pending" | "rejected" | "neutral";
}

export function StatusPill({ className, status, tone, ...props }: StatusPillProps) {
  const resolvedTone = tone ?? status ?? "neutral";
  const classes = [
    "hsas-status-pill",
    "status-pill",
    `hsas-status-pill--${resolvedTone}`,
    `status-pill--${resolvedTone}`,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return <span className={classes} {...props} />;
}
