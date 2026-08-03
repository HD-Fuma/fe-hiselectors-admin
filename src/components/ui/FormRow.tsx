import type { ReactNode } from "react";

export interface FormRowProps {
  label: ReactNode;
  required?: boolean;
  help?: ReactNode;
  children: ReactNode;
}

export function FormRow({ children, help, label, required = false }: FormRowProps) {
  return (
    <label className="hsas-form-row">
      <div className="hsas-form-row__label">
        <span>{label}</span>
        {required ? (
          <>
            <span aria-hidden="true" className="hsas-form-row__required-mark">
              *
            </span>
            <span className="hsas-visually-hidden">required</span>
          </>
        ) : null}
      </div>
      <div className="hsas-form-row__control">{children}</div>
      {help ? <div className="hsas-form-row__help">{help}</div> : null}
    </label>
  );
}
