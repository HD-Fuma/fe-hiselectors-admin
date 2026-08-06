import { useEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";

export interface SidePanelProps {
  children: ReactNode;
  onClose: () => void;
  screenCode?: string;
  title: string;
}

export function SidePanel({ children, onClose, screenCode, title }: SidePanelProps) {
  const titleId = useId();
  const backdropRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const backdrop = backdropRef.current;
    const panel = panelRef.current;
    if (!backdrop || !panel) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    const backgroundElements = Array.from(document.body.children).filter(
      (element): element is HTMLElement => element instanceof HTMLElement && element !== backdrop,
    );
    const backgroundState = backgroundElements.map((element) => ({
      ariaHidden: element.getAttribute("aria-hidden"),
      element,
      inert: element.hasAttribute("inert"),
    }));

    document.body.style.overflow = "hidden";
    for (const element of backgroundElements) {
      element.setAttribute("aria-hidden", "true");
      element.setAttribute("inert", "");
    }

    panel.querySelector<HTMLElement>("button")?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
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
    };
  }, [onClose]);

  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      className="fuma-detail-panel-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
      ref={backdropRef}
    >
      <section
        aria-labelledby={titleId}
        aria-modal="true"
        className="fuma-detail-panel"
        data-visual-contract="detail-side-panel"
        ref={panelRef}
        role="dialog"
      >
        <header className="fuma-detail-panel__header">
          <div>
            {screenCode ? <span>{screenCode}</span> : null}
            <h2 id={titleId}>{title}</h2>
          </div>
          <button aria-label="상세 패널 닫기" className="fuma-detail-panel__close" type="button" onClick={onClose}>
            <span aria-hidden="true">×</span>
          </button>
        </header>
        <div className="fuma-detail-panel__body">{children}</div>
      </section>
    </div>,
    document.body,
  );
}
