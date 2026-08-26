import type { ComponentPropsWithoutRef } from "react";

export interface TooltipProps extends ComponentPropsWithoutRef<"span"> {
  placement?: "bottom" | "none" | "top";
  visible?: boolean;
}

export function Tooltip({
  className,
  placement = "top",
  role = "tooltip",
  visible = false,
  ...props
}: TooltipProps) {
  return (
    <span
      {...props}
      className={[
        "hsas-tooltip",
        placement !== "none" ? `hsas-tooltip--${placement}` : "",
        visible ? "is-visible" : "",
        className,
      ].filter(Boolean).join(" ")}
      role={role}
    />
  );
}
