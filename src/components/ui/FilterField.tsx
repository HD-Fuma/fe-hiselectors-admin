import type { ReactNode } from "react";

export interface FilterFieldProps {
  children: ReactNode;
  className?: string;
  htmlFor: string;
  label: ReactNode;
}

export function FilterField({ children, className, htmlFor, label }: FilterFieldProps) {
  return (
    <label
      className={["fuma-filter-field", className].filter(Boolean).join(" ")}
      htmlFor={htmlFor}
    >
      <span>{label}</span>
      {children}
    </label>
  );
}
