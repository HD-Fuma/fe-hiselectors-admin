import { useId, type ReactNode } from "react";

export interface ModalProps {
  open: boolean;
  title: string;
  children: ReactNode;
  actions?: ReactNode;
}

export function Modal({ actions, children, open, title }: ModalProps) {
  const titleId = useId();

  if (!open) {
    return null;
  }

  return (
    <div className="hsas-modal-backdrop">
      <section
        aria-labelledby={titleId}
        aria-modal="true"
        className="hsas-modal"
        role="dialog"
      >
        <header className="hsas-modal__header">
          <h2 className="hsas-modal__title" id={titleId}>
            {title}
          </h2>
        </header>
        <div className="hsas-modal__body">{children}</div>
        {actions ? <footer className="hsas-modal__actions">{actions}</footer> : null}
      </section>
    </div>
  );
}
