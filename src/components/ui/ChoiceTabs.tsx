import type { ReactNode } from "react";

export interface ChoiceTabOption<T extends string> {
  label: ReactNode;
  value: T;
}

interface ChoiceTabsProps<T extends string> {
  actions?: ReactNode;
  ariaLabel: string;
  className?: string;
  emptyOption?: {
    label: ReactNode;
    onSelect: () => void;
  };
  onChange: (value: T) => void;
  options: readonly (T | ChoiceTabOption<T>)[];
  value: T | null | undefined;
}

export function ChoiceTabs<T extends string>({
  actions,
  ariaLabel,
  className,
  emptyOption,
  onChange,
  options,
  value,
}: ChoiceTabsProps<T>) {
  const navClassName = ["fuma-creator-category-filter", className]
    .filter(Boolean)
    .join(" ");

  return (
    <nav aria-label={ariaLabel} className={navClassName}>
      <div>
        {emptyOption ? (
          <button
            aria-pressed={value == null}
            className="fuma-creator-category-filter__option"
            onClick={emptyOption.onSelect}
            type="button"
          >
            {emptyOption.label}
          </button>
        ) : null}
        {options.map((option) => {
          const optionValue = typeof option === "string" ? option : option.value;
          const optionLabel = typeof option === "string" ? option : option.label;

          return (
            <button
              aria-pressed={value === optionValue}
              className="fuma-creator-category-filter__option"
              key={optionValue}
              onClick={() => onChange(optionValue)}
              type="button"
            >
              {optionLabel}
            </button>
          );
        })}
      </div>
      {actions}
    </nav>
  );
}
