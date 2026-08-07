import {
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

export interface SidePanelProps {
  children: ReactNode;
  onClose: () => void;
  title: string;
}

export function SidePanel({ children, onClose, title }: SidePanelProps) {
  const titleId = useId();
  const backdropRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const [panelWidth, setPanelWidth] = useState<number | null>(null);

  const clampWidth = (width: number) => {
    const maximum = Math.max(360, window.innerWidth - 56);
    const minimum = Math.min(580, maximum);
    return Math.max(minimum, Math.min(width, maximum));
  };

  const resizePanel = (change: number) => {
    setPanelWidth((currentWidth) => clampWidth((currentWidth ?? 920) + change));
  };

  const handleResizeStart = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) {
      return;
    }
    event.preventDefault();
    document.body.classList.add("fuma-detail-panel-is-resizing");

    const handlePointerMove = (moveEvent: PointerEvent) => {
      setPanelWidth(clampWidth(window.innerWidth - moveEvent.clientX));
    };
    const handlePointerUp = () => {
      document.body.classList.remove("fuma-detail-panel-is-resizing");
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp, { once: true });
  };

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
        style={panelWidth === null ? undefined : ({ "--fuma-detail-panel-width": `${panelWidth}px` } as CSSProperties)}
      >
        <div
          aria-label="패널 너비 조절"
          aria-orientation="vertical"
          className="fuma-detail-panel__resize-handle"
          onKeyDown={(event) => {
            if (event.key === "ArrowLeft") {
              event.preventDefault();
              resizePanel(40);
            }
            if (event.key === "ArrowRight") {
              event.preventDefault();
              resizePanel(-40);
            }
          }}
          onPointerDown={handleResizeStart}
          role="separator"
          tabIndex={0}
        />
        <header className="fuma-detail-panel__header">
          <div>
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
