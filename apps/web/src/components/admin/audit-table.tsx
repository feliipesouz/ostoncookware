"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export type AuditRow = {
  id: string;
  actorEmail: string | null;
  actorName?: string | null;
  action: string;
  entity: string;
  createdAt: string;
  humanMessage?: string;
};

export function AuditTable({
  initial,
  filters,
}: {
  initial: AuditRow[];
  filters: { actorId?: string; entity?: string; action?: string; from?: string; to?: string; q?: string };
}) {
  const router = useRouter();
  const [draft, setDraft] = useState(filters);

  function apply(event: React.FormEvent) {
    event.preventDefault();
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(draft)) {
      if (value) params.set(key, value);
    }
    router.push(`/admin/auditoria${params.toString() ? `?${params}` : ""}`);
  }

  return (
    <div>
      <form onSubmit={apply} className="mt-6 grid gap-3 md:grid-cols-3">
        <input
          value={draft.q ?? ""}
          onChange={(event) => setDraft((current) => ({ ...current, q: event.target.value }))}
          placeholder="Buscar ação, entidade ou e-mail"
          className="border border-border px-3 py-2 text-sm"
        />
        <input
          value={draft.entity ?? ""}
          onChange={(event) => setDraft((current) => ({ ...current, entity: event.target.value }))}
          placeholder="Entidade (lead, product…)"
          className="border border-border px-3 py-2 text-sm"
        />
        <input
          value={draft.action ?? ""}
          onChange={(event) => setDraft((current) => ({ ...current, action: event.target.value }))}
          placeholder="Ação (PUBLISH, EXPORT…)"
          className="border border-border px-3 py-2 text-sm"
        />
        <input
          value={draft.actorId ?? ""}
          onChange={(event) => setDraft((current) => ({ ...current, actorId: event.target.value }))}
          placeholder="ID do autor"
          className="border border-border px-3 py-2 text-sm"
        />
        <input
          type="date"
          value={draft.from ?? ""}
          onChange={(event) => setDraft((current) => ({ ...current, from: event.target.value }))}
          className="border border-border px-3 py-2 text-sm"
        />
        <input
          type="date"
          value={draft.to ?? ""}
          onChange={(event) => setDraft((current) => ({ ...current, to: event.target.value }))}
          className="border border-border px-3 py-2 text-sm"
        />
        <button type="submit" className="bg-foreground px-4 py-2 text-sm text-foreground-inverse">
          Filtrar
        </button>
      </form>
      <table className="mt-8 w-full text-left text-sm">
        <thead className="text-foreground-muted">
          <tr>
            <th className="py-3">Quando</th>
            <th>Quem</th>
            <th>O que aconteceu</th>
          </tr>
        </thead>
        <tbody>
          {initial.map((row) => (
            <tr key={row.id} className="border-t border-border">
              <td className="py-3">{new Date(row.createdAt).toLocaleString("pt-BR")}</td>
              <td>{row.actorName ?? row.actorEmail ?? "—"}</td>
              <td>{row.humanMessage ?? `${row.action} · ${row.entity}`}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
