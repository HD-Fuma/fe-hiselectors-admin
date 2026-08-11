import { useEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";

export interface ModalProps {
  open: boolean;
  title: string;
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
  onClose?: () => void;
}

const focusableSelector = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

function focusableElements(dialog: HTMLElement) {
  return Array.from(dialog.querySelectorAll<HTMLElement>(focusableSelector)).filter(
    (element) => element.tabIndex >= 0 && !element.hasAttribute("hidden"),
  );
}

export function Modal({ actions, children, className, onClose, open, title }: ModalProps) {
  const titleId = useId();
  const backdropRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const backdrop = backdropRef.current;
    const dialog = dialogRef.current;
    if (!backdrop || !dialog) {
      return undefined;
    }

    const previousFocus =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const backgroundElements = Array.from(document.body.children).filter(
      (element): element is HTMLElement => element instanceof HTMLElement && element !== backdrop,
    );
    const backgroundState = backgroundElements.map((element) => ({
      ariaHidden: element.getAttribute("aria-hidden"),
      element,
      inert: element.hasAttribute("inert"),
    }));

    for (const element of backgroundElements) {
      element.setAttribute("aria-hidden", "true");
      element.setAttribute("inert", "");
    }

    (focusableElements(dialog)[0] ?? dialog).focus();

    const containFocus = (event: KeyboardEvent) => {
      if (event.key === "Escape" && onClose) {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const elements = focusableElements(dialog);
      if (elements.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }

      const first = elements[0];
      const last = elements[elements.length - 1];
      const activeElement = document.activeElement;

      if (event.shiftKey && (activeElement === first || !dialog.contains(activeElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (activeElement === last || !dialog.contains(activeElement))) {
        event.preventDefault();
        first.focus();
      }
    };

    dialog.addEventListener("keydown", containFocus);

    return () => {
      dialog.removeEventListener("keydown", containFocus);
      for (const { ariaHidden, element, inert } of backgroundState) {
        if (ariaHidden == null) {
          element.removeAttribute("aria-hidden");
        } else {
          element.setAttribute("aria-hidden", ariaHidden);
        }

        if (!inert) {
          element.removeAttribute("inert");
        }
      }

      if (previousFocus?.isConnected) {
        previousFocus.focus();
      }
    };
  }, [onClose, open]);

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
        role="dialog"
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
