"use client";

import { Loader2 } from "lucide-react";
import { Modal } from "./Modal";

/**
 * Diálogo de confirmación on-system (sobre el Modal del CRM) para reemplazar los
 * confirm() nativos. `destructive` tiñe el botón de acción con el token --destructive.
 */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  destructive = false,
  pending = false,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  pending?: boolean;
}) {
  return (
    <Modal open={open} onClose={onClose} title={title} maxWidth={420}>
      {description && (
        <p className="text-[13.5px] leading-relaxed text-[var(--crm-ink-soft)]">{description}</p>
      )}
      <div className="mt-5 flex items-center justify-end gap-2">
        <button type="button" onClick={onClose} disabled={pending} className="crm-btn crm-btn-secondary crm-btn-sm">
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={pending}
          style={destructive ? { background: "var(--destructive)", color: "var(--destructive-foreground)" } : undefined}
          className={`crm-btn crm-btn-sm ${destructive ? "" : "crm-btn-primary"}`}
        >
          {pending && <Loader2 className="size-3.5 animate-spin" strokeWidth={2} />}
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
