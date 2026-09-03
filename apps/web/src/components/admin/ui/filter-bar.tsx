"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toQueryString } from "@/lib/admin-query";

export type FilterOption = { value: string; label: string };
export type FilterDef = { key: string; label: string; options: FilterOption[] };

export function FilterBar({
  pathname,
  query,
  searchPlaceholder = "Buscar…",
  filters = [],
}: {
  pathname: string;
  query: Record<string, string>;
  searchPlaceholder?: string;
  filters?: FilterDef[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [q, setQ] = useState(query.q ?? "");

  function navigate(patch: Record<string, string | undefined>, resetPage = true) {
    const next = { ...query, ...patch };
    if (resetPage) next.page = "1";
    startTransition(() => {
      const qs = toQueryString(next);
      router.push(qs ? `${pathname}?${qs}` : pathname);
    });
  }

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
      <form
        className="min-w-0 flex-1"
        onSubmit={(event) => {
          event.preventDefault();
          navigate({ q });
        }}
      >
        <label className="grid gap-1 text-xs text-foreground-muted">
          Busca
          <input
            value={q}
            onChange={(event) => setQ(event.target.value)}
            placeholder={searchPlaceholder}
            className="w-full border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ring"
          />
        </label>
      </form>
      {filters.map((filter) => (
        <label key={filter.key} className="grid gap-1 text-xs text-foreground-muted">
          {filter.label}
          <select
            className="border border-border bg-background px-3 py-2 text-sm"
            value={query[filter.key] ?? ""}
            onChange={(event) => navigate({ [filter.key]: event.target.value || undefined })}
          >
            <option value="">Todos</option>
            {filter.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      ))}
      {pending ? <span className="text-xs text-foreground-muted">Atualizando…</span> : null}
    </div>
  );
}
