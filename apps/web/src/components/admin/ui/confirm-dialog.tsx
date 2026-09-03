"use client";

import { useCallback } from "react";
import { useFocusTrap } from "./use-focus-trap";

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  destructive = false,
  busy = false,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const close = useCallback(() => {
    if (!busy) onClose();
  }, [busy, onClose]);
  const trapRef = useFocusTrap(open, close);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/50" onClick={close} />
      <div
        ref={trapRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-desc"
        className="relative z-10 w-full max-w-md border border-border bg-surface-elevated p-6 shadow-soft"
      >
        <h2 id="confirm-title" className="text-xl">
          {title}
        </h2>
        <p id="confirm-desc" className="mt-3 text-sm text-foreground-muted">
          {description}
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" className="border border-border px-4 py-2 text-sm" onClick={close} disabled={busy}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={destructive ? "bg-danger px-4 py-2 text-sm text-danger-foreground" : "bg-foreground px-4 py-2 text-sm text-foreground-inverse"}
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? "Aguarde…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
