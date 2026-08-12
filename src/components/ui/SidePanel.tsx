import {
  useId,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { useDialogLifecycle } from "./useDialogLifecycle";

export interface SidePanelProps {
  actions?: ReactNode;
  children: ReactNode;
  onClose: () => void;
  title: string;
}

export function SidePanel({ actions, children, onClose, title }: SidePanelProps) {
  const titleId = useId();
  const backdropRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const [panelWidth, setPanelWidth] = useState<number | null>(null);

  useDialogLifecycle({
    backdropRef,
    dialogRef: panelRef,
    initialFocusSelector: "button",
    onClose,
  });

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
          <div className="fuma-detail-panel__controls">
            {actions}
            <button aria-label="상세 패널 닫기" className="fuma-detail-panel__close" type="button" onClick={onClose}>
              <span aria-hidden="true" />
            </button>
          </div>
        </header>
        <div className="fuma-detail-panel__body">{children}</div>
      </section>
    </div>,
    document.body,
  );
}
