import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  KeyboardEventHandler,
  MouseEventHandler,
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

const DATE_EDIT_KEYS = new Set([
  "Backspace",
  "Delete",
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "Home",
  "End",
  "PageUp",
  "PageDown",
  "Insert",
]);
const VALUE_CHANGING_SHORTCUT_KEYS = new Set(["v", "x", "z"]);

function showInputPicker(input: HTMLInputElement) {
  if (input.disabled || input.readOnly || typeof input.showPicker !== "function") {
    return false;
  }

  try {
    input.showPicker();
    return true;
  } catch {
    return false;
  }
}

export function TextInput({
  className,
  onClick,
  onKeyDown,
  type = "text",
  ...props
}: TextInputProps) {
  const usesPicker = type === "date" || type === "month";
  const handleClick: MouseEventHandler<HTMLInputElement> = (event) => {
    onClick?.(event);
    if (!event.defaultPrevented && usesPicker) {
      showInputPicker(event.currentTarget);
    }
  };
  const handleKeyDown: KeyboardEventHandler<HTMLInputElement> = (event) => {
    onKeyDown?.(event);
    if (event.defaultPrevented || !usesPicker) {
      return;
    }

    if (event.altKey) {
      return;
    }

    if (event.ctrlKey || event.metaKey) {
      const shortcutKey = event.key.toLowerCase();
      if (
        VALUE_CHANGING_SHORTCUT_KEYS.has(shortcutKey)
        || (event.ctrlKey && shortcutKey === "y")
      ) {
        event.preventDefault();
      }
      return;
    }

    if (event.key === " " || event.key === "Spacebar") {
      if (showInputPicker(event.currentTarget)) {
        event.preventDefault();
      }
      return;
    }

    if (
      event.key !== "Tab"
      && event.key !== "Escape"
      && event.key !== "Enter"
      && !/^F\d+$/.test(event.key)
      && (event.key.length === 1 || DATE_EDIT_KEYS.has(event.key))
    ) {
      event.preventDefault();
    }
  };

  return (
    <input
      className={classes("hsas-control", "hsas-text-input", "ui-input", className)}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
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

export interface SwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: ReactNode;
}

export function Switch({ className, label, ...props }: SwitchProps) {
  return (
    <label className={classes("hsas-switch", className)}>
      <input type="checkbox" {...props} />
      <span aria-hidden="true" className="hsas-switch__track" />
      <b className="hsas-switch__label">{label}</b>
    </label>
  );
}

export interface SegmentedControlOption<T extends string = string> {
  value: T;
  label: ReactNode;
}

export interface SegmentedControlProps<T extends string = string> {
  ariaLabel?: string;
  value: T;
  options: readonly SegmentedControlOption<T>[];
  onChange?: (id: T) => void;
}

export function SegmentedControl<T extends string>({
  ariaLabel = "선택 옵션",
  value,
  options,
  onChange,
}: SegmentedControlProps<T>) {
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
