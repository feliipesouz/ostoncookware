"use client";

import { formatTime } from "@/lib/admin-format";

export function ConflictBanner({
  actorName,
  updatedAt,
  onReload,
}: {
  actorName?: string | null;
  updatedAt?: string | null;
  onReload: () => void;
}) {
  const who = actorName?.trim() || "outra pessoa";
  const when = formatTime(updatedAt);
  return (
    <div role="alert" className="border border-warning bg-warning/10 px-4 py-3 text-sm">
      <p>
        Este conteúdo foi alterado por outra pessoa enquanto você editava.
        {when ? ` Última alteração por ${who} às ${when}.` : ` Última alteração por ${who}.`}
      </p>
      <button type="button" className="mt-2 underline" onClick={onReload}>
        Recarregar versão atual
      </button>
    </div>
  );
}
