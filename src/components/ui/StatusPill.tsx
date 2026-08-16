import type { HTMLAttributes } from "react";

export interface StatusPillProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: "approved" | "danger" | "pending" | "rejected" | "neutral";
}

export function StatusPill({ className, tone = "neutral", ...props }: StatusPillProps) {
  const classes = [
    "hsas-status-pill",
    "status-pill",
    `hsas-status-pill--${tone}`,
    `status-pill--${tone}`,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return <span className={classes} {...props} />;
}
