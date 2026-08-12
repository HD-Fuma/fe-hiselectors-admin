import type { ReactNode } from "react";
import { Button } from "./Controls";
import { Modal } from "./Modal";

export interface AlertDialogProps {
  confirmLabel?: string;
  message: ReactNode;
  onClose: () => void;
  open: boolean;
  title?: string;
}

export function AlertDialog({
  confirmLabel = "확인",
  message,
  onClose,
  open,
  title = "알림",
}: AlertDialogProps) {
  return (
    <Modal
      actions={<Button onClick={onClose} variant="primary">{confirmLabel}</Button>}
      className="hsas-alert-dialog"
      onClose={onClose}
      open={open}
      role="alertdialog"
      title={title}
    >
      <p className="hsas-alert-dialog__message">{message}</p>
    </Modal>
  );
}
