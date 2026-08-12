import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
} from "react";

function classes(...values: Array<string | undefined | false>) {
  return values.filter(Boolean).join(" ");
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
}

// eslint-disable-next-line react-refresh/only-export-components -- Link controls share Button's visual contract.
export function buttonClassNames(
  variant: ButtonProps["variant"] = "secondary",
  className?: string,
) {
  return classes(
    "hsas-button",
    "ui-button",
    `hsas-button--${variant}`,
    `ui-button--${variant}`,
    className,
  );
}

export function Button({ className, type = "button", variant = "secondary", ...props }: ButtonProps) {
  return (
    <button
      className={buttonClassNames(variant, className)}
      type={type}
      {...props}
    />
  );
}

export type TextInputProps = InputHTMLAttributes<HTMLInputElement>;

export function TextInput({ className, type = "text", ...props }: TextInputProps) {
  return (
    <input
      className={classes("hsas-control", "hsas-text-input", "ui-input", className)}
      type={type}
      {...props}
    />
  );
}

export interface SelectOption {
  value: string;
  label: ReactNode;
  disabled?: boolean;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  options?: readonly SelectOption[];
}

export function Select({ children, className, options, ...props }: SelectProps) {
  return (
    <select
      className={classes("hsas-control", "hsas-select", "ui-select", className)}
      {...props}
    >
      {options
        ? options.map((option) => (
            <option disabled={option.disabled} key={option.value} value={option.value}>
              {option.label}
            </option>
          ))
        : children}
    </select>
  );
}

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: ReactNode;
}

export function Checkbox({ className, label, ...props }: CheckboxProps) {
  return (
    <label className="hsas-checkbox">
      <input
        className={classes("hsas-checkbox__input", "ui-checkbox", className)}
        type="checkbox"
        {...props}
      />
      <span className="hsas-checkbox__label">{label}</span>
    </label>
  );
}

export interface SegmentedControlOption {
  value: string;
  label: ReactNode;
}

export interface SegmentedControlProps {
  ariaLabel?: string;
  value: string;
  options: SegmentedControlOption[];
  onChange?: (id: string) => void;
}

export function SegmentedControl({
  ariaLabel = "선택 옵션",
  value,
  options,
  onChange,
}: SegmentedControlProps) {
  return (
    <div
      aria-label={ariaLabel}
      className="hsas-segmented-control ui-segmented-control"
      role="group"
    >
      {options.map((option) => {
        const isActive = option.value === value;

        return (
          <button
            aria-pressed={isActive}
            className={classes(
              "hsas-segmented-control__item",
              "ui-segmented-control__item",
              isActive && "hsas-segmented-control__item--active",
              isActive && "ui-segmented-control__item--active",
            )}
            key={option.value}
            onClick={() => onChange?.(option.value)}
            type="button"
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
