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

export function Button({ className, type = "button", variant = "secondary", ...props }: ButtonProps) {
  return (
    <button
      className={classes(
        "hsas-button",
        "ui-button",
        `hsas-button--${variant}`,
        `ui-button--${variant}`,
        className,
      )}
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
  options?: SelectOption[];
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

export interface SegmentedControlItem {
  id: string;
  label: ReactNode;
}

export interface SegmentedControlOption {
  value: string;
  label: ReactNode;
}

export interface SegmentedControlProps {
  activeId?: string;
  ariaLabel?: string;
  items?: SegmentedControlItem[];
  value?: string;
  options?: SegmentedControlOption[];
  onChange?: (id: string) => void;
}

export function SegmentedControl({
  activeId,
  ariaLabel = "Options",
  items = [],
  value,
  options,
  onChange,
}: SegmentedControlProps) {
  const selectedId = value ?? activeId;
  const normalizedItems = options
    ? options.map((option) => ({ id: option.value, label: option.label }))
    : items;

  return (
    <div
      aria-label={ariaLabel}
      className="hsas-segmented-control ui-segmented-control"
      role="group"
    >
      {normalizedItems.map((item) => {
        const isActive = item.id === selectedId;

        return (
          <button
            aria-pressed={isActive}
            className={classes(
              "hsas-segmented-control__item",
              "ui-segmented-control__item",
              isActive && "hsas-segmented-control__item--active",
              isActive && "ui-segmented-control__item--active",
            )}
            key={item.id}
            onClick={() => onChange?.(item.id)}
            type="button"
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
