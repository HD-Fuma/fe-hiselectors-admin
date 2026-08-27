import { useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useDialogLifecycle } from "./useDialogLifecycle";

interface BubbleDialogProps {
  actions: ReactNode;
  description: ReactNode;
  layer?: "local" | "screen";
  onClose?: () => void;
  open: boolean;
  title: ReactNode;
}

export function BubbleDialog({
  actions,
  description,
  layer = "screen",
  onClose,
  open,
  title,
}: BubbleDialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const layerRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLElement>(null);

  useDialogLifecycle({
    active: open && layer === "screen",
    backdropRef: layerRef,
    dialogRef,
    onClose,
  });

  if (!open) return null;

  const dialog = (
    <div className={`hsas-bubble-dialog-layer hsas-bubble-dialog-layer--${layer}`} ref={layerRef}>
      <section
        aria-describedby={descriptionId}
        aria-labelledby={titleId}
        aria-modal="true"
        className="hsas-bubble-dialog"
        ref={dialogRef}
        role="alertdialog"
      >
        <h2 id={titleId}>{title}</h2>
        <p id={descriptionId}>{description}</p>
        <div className="hsas-bubble-dialog__actions">{actions}</div>
      </section>
    </div>
  );

  return layer === "screen" && typeof document !== "undefined"
    ? createPortal(dialog, document.body)
    : dialog;
}
