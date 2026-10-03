"use client";

import { useEffect, useRef, useState } from "react";
import { adminMutate, AdminApiError } from "@/lib/admin-client";
import { formatRelativeDay } from "@/lib/admin-format";
import { ConfirmDialog } from "./ui/confirm-dialog";
import { EmptyState } from "./ui/empty-state";

export type HistoryChange = { field: string; label?: string; previous: unknown; next: unknown };

export type HistoryVersion = {
  id?: string;
  version: number;
  createdAt: string;
  actorName?: string | null;
  actorEmail?: string | null;
  summary?: string | null;
  changeSummary?: string | null;
  changes?: HistoryChange[];
  snapshot?: Record<string, unknown>;
};

const FIELD_LABEL: Record<string, string> = {
  name: "Nome",
  title: "Título",
  slug: "Slug",
  shortDescription: "Resumo",
  description: "Descrição",
  seoTitle: "Título SEO",
  seoDescription: "Meta description",
  status: "Status",
  featured: "Destaque",
  imageIds: "Imagens",
  coverImageId: "Capa",
  desktopImageId: "Imagem desktop",
  mobileImageId: "Imagem mobile",
  primaryCtaLabel: "CTA",
  primaryCtaUrl: "URL do CTA",
};

function pretty(value: unknown) {
  if (value == null || value === "") return "—";
  if (typeof value === "boolean") return value ? "sim" : "não";
  if (Array.isArray(value)) return value.map((item) => (typeof item === "object" ? JSON.stringify(item) : String(item))).join(", ");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function summarize(version: HistoryVersion) {
  if (version.summary) return version.summary;
  if (version.changeSummary) return version.changeSummary;
  const fields = (version.changes ?? []).map((change) => FIELD_LABEL[change.field] ?? change.label ?? change.field);
  if (fields.length === 0) return "Alterou o conteúdo";
  if (fields.length === 1) return `Alterou ${fields[0]}`;
  const last = fields[fields.length - 1];
  return `Alterou ${fields.slice(0, -1).join(", ")} e ${last}`;
}

export function HistoryView({
  entityLabel,
  entityName,
  versionsPath,
  currentVersion,
}: {
  entityLabel: string;
  entityName: string;
  versionsPath: string;
  currentVersion: number;
}) {
  const [versions, setVersions] = useState<HistoryVersion[] | null>(null);
  const [error, setError] = useState("");
  const [open, setOpen] = useState<number | null>(null);
  const [restore, setRestore] = useState<HistoryVersion | null>(null);
  const [busy, setBusy] = useState(false);
  const expectedVersion = useRef(currentVersion);

  useEffect(() => {
    expectedVersion.current = currentVersion;
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [versionsPath, currentVersion]);

  async function load() {
    setError("");
    const response = await fetch(versionsPath, { credentials: "include" });
    if (response.status === 404) {
      setVersions([]);
      setError("");
      return;
    }
    if (!response.ok) {
      setVersions([]);
      setError("O histórico versionado ainda não está disponível nesta API.");
      return;
    }
    const payload = (await response.json()) as { data?: HistoryVersion[] };
    setVersions(payload.data ?? []);
  }

  async function confirmRestore() {
    if (!restore) return;
    setBusy(true);
    try {
      const result = await adminMutate<{ data: { version: number } }>(
        `${versionsPath}/${encodeURIComponent(String(restore.id ?? restore.version))}/restore`,
        "POST",
        { expectedVersion: expectedVersion.current, changeSummary: `Restaurou a versão ${restore.version}` },
      );
      expectedVersion.current = result.data.version;
      setRestore(null);
      await load();
    } catch (err) {
      setError(err instanceof AdminApiError ? err.message : "Não foi possível restaurar esta versão.");
    } finally {
      setBusy(false);
    }
  }

  const rows = versions ?? [];

  return (
    <div className="mt-8">
      {error ? <p className="mb-4 text-sm text-foreground-muted">{error}</p> : null}
      {versions !== null && rows.length === 0 ? (
        <EmptyState
          title={`Ainda não há versões de ${entityName}.`}
          description="Cada publicação e salvamento relevante cria uma versão. Volte aqui depois da primeira edição com versionamento ativo."
        />
      ) : (
        <ol className="divide-y divide-border border border-border bg-surface">
          {rows.map((version) => {
            const expanded = open === version.version;
            const who = version.actorName ?? version.actorEmail ?? "Alguém";
            return (
              <li key={version.id ?? version.version} className="p-4">
                <button type="button" className="flex w-full items-start justify-between gap-4 text-left" onClick={() => setOpen(expanded ? null : version.version)}>
                  <span>
                    <span className="font-medium">v{version.version}</span>
                    <span className="text-foreground-muted"> — {formatRelativeDay(version.createdAt)} — {who.split(" ")[0]} — {summarize(version)}</span>
                  </span>
                  <span className="text-xs underline">{expanded ? "Recolher" : "Ver campos"}</span>
                </button>
                {expanded ? (
                  <div className="mt-4">
                    {(version.changes ?? []).length === 0 ? (
                      <p className="text-sm text-foreground-muted">Não há detalhe campo a campo nesta versão.</p>
                    ) : (
                      <dl className="grid gap-3 text-sm">
                        {(version.changes ?? []).map((change) => (
                          <div key={change.field} className="grid gap-1 sm:grid-cols-[8rem_1fr_1fr]">
                            <dt className="text-foreground-muted">{FIELD_LABEL[change.field] ?? change.label ?? change.field}</dt>
                            <dd>
                              <span className="text-[0.65rem] uppercase text-foreground-muted">Antes</span>
                              <p>{pretty(change.previous)}</p>
                            </dd>
                            <dd>
                              <span className="text-[0.65rem] uppercase text-foreground-muted">Depois</span>
                              <p>{pretty(change.next)}</p>
                            </dd>
                          </div>
                        ))}
                      </dl>
                    )}
                    <button type="button" className="mt-4 border border-border px-4 py-2 text-sm" onClick={() => setRestore(version)}>
                      Restaurar esta versão
                    </button>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ol>
      )}
      <ConfirmDialog
        open={Boolean(restore)}
        title={`Restaurar versão ${restore?.version ?? ""}`}
        description={`Restaurar a versão ${restore?.version} de "${entityName}" cria uma nova versão com aquele conteúdo. A versão atual de ${entityLabel} não é apagada.`}
        confirmLabel="Restaurar esta versão"
        busy={busy}
        onClose={() => setRestore(null)}
        onConfirm={() => void confirmRestore()}
      />
    </div>
  );
}
