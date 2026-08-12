import { useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useDialogLifecycle } from "./useDialogLifecycle";

export interface ModalProps {
  open: boolean;
  title: string;
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
  onClose?: () => void;
  role?: "alertdialog" | "dialog";
}

export function Modal({ actions, children, className, onClose, open, role = "dialog", title }: ModalProps) {
  const titleId = useId();
  const backdropRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLElement>(null);

  useDialogLifecycle({ active: open, backdropRef, dialogRef, onClose });

  if (!open || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div className="hsas-modal-backdrop" ref={backdropRef}>
      <section
        aria-labelledby={titleId}
        aria-modal="true"
        className={["hsas-modal", className].filter(Boolean).join(" ")}
        data-visual-contract="modal"
        ref={dialogRef}
        role={role}
        tabIndex={-1}
      >
        <header className="hsas-modal__header">
          <h2 className="hsas-modal__title" id={titleId}>
            {title}
          </h2>
          {onClose ? (
            <button
              aria-label={`${title} 닫기`}
              className="hsas-modal__close"
              onClick={onClose}
              type="button"
            >
              ×
            </button>
          ) : null}
        </header>
        <div className="hsas-modal__body">{children}</div>
        {actions ? <footer className="hsas-modal__actions">{actions}</footer> : null}
      </section>
    </div>,
    document.body,
  );
}
