"use client";

import { formatDateTime } from "@/lib/admin-format";

export function SaveBar({
  dirty,
  saving,
  lastSavedAt,
  status,
  onSaveDraft,
  onPublish,
  onSchedule,
  previewHref,
  extra,
  hidePublish,
  saveDraftLabel,
}: {
  dirty: boolean;
  saving: boolean;
  lastSavedAt?: string | Date | null;
  status?: string;
  onSaveDraft: () => void;
  onPublish: () => void;
  onSchedule?: () => void;
  previewHref?: string;
  extra?: React.ReactNode;
  hidePublish?: boolean;
  saveDraftLabel?: string;
}) {
  return (
    <div className="sticky bottom-0 z-20 -mx-6 mt-10 border-t border-border bg-background/95 px-6 py-3 backdrop-blur md:-mx-10 md:px-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-foreground-muted">
          {saving
            ? "Salvando…"
            : dirty
              ? "Alterações não salvas"
              : lastSavedAt
                ? `Último salvamento ${formatDateTime(lastSavedAt)}`
                : "Nada para salvar"}
          {status ? ` · ${status}` : ""}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {extra}
          {previewHref ? (
            <a
              href={previewHref}
              target="_blank"
              rel="noreferrer"
              className="border border-border px-4 py-2 text-sm"
            >
              Preview
            </a>
          ) : null}
          <button
            type="button"
            data-testid="save-draft"
            disabled={saving || !dirty}
            onClick={onSaveDraft}
            className="border border-border px-4 py-2 text-sm disabled:opacity-40"
          >
            {saveDraftLabel ?? "Salvar rascunho"}
          </button>
          {onSchedule ? (
            <button type="button" disabled={saving} onClick={onSchedule} className="border border-border px-4 py-2 text-sm">
              Agendar
            </button>
          ) : null}
          {hidePublish ? null : (
            <button
              type="button"
              data-testid="publish"
              disabled={saving}
              onClick={onPublish}
              className="bg-foreground px-4 py-2 text-sm text-foreground-inverse disabled:opacity-40"
            >
              Publicar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
