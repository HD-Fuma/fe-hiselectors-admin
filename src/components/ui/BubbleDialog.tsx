import { useId, type ReactNode } from "react";

interface BubbleDialogProps {
  actions: ReactNode;
  description: ReactNode;
  layer?: "local" | "screen";
  open: boolean;
  title: ReactNode;
}

export function BubbleDialog({
  actions,
  description,
  layer = "screen",
  open,
  title,
}: BubbleDialogProps) {
  const titleId = useId();
  const descriptionId = useId();

  if (!open) return null;

  return (
    <div className={`hsas-bubble-dialog-layer hsas-bubble-dialog-layer--${layer}`}>
      <section
        aria-describedby={descriptionId}
        aria-labelledby={titleId}
        aria-modal="true"
        className="hsas-bubble-dialog"
        role="alertdialog"
      >
        <h2 id={titleId}>{title}</h2>
        <p id={descriptionId}>{description}</p>
        <div className="hsas-bubble-dialog__actions">{actions}</div>
      </section>
    </div>
  );
}
