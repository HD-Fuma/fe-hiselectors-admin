import { useId, type ReactNode } from "react";

export interface FormRowProps {
  label: string;
  required?: boolean;
  help?: string;
  children: ReactNode;
}

export function FormRow({ children, help, label, required = false }: FormRowProps) {
  const rowId = useId();
  const labelId = `${rowId}-label`;
  const helpId = `${rowId}-help`;

  return (
    <div
      aria-describedby={help ? helpId : undefined}
      aria-labelledby={labelId}
      className="hsas-form-row"
      role="group"
    >
      <div className="hsas-form-row__label">
        <span id={labelId}>{label}</span>
        {required ? (
          <>
            <span aria-hidden="true" className="hsas-form-row__required-mark">
              *
            </span>
            <span className="hsas-visually-hidden">필수</span>
          </>
        ) : null}
      </div>
      <div className="hsas-form-row__control">{children}</div>
      {help ? (
        <div className="hsas-form-row__help" id={helpId}>
          {help}
        </div>
      ) : null}
    </div>
  );
}
