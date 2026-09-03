"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toQueryString } from "@/lib/admin-query";
import { ConfirmDialog } from "./confirm-dialog";
import { EmptyState } from "./empty-state";
import { FilterBar, type FilterDef } from "./filter-bar";

export type TableColumn<T> = {
  key: string;
  header: string;
  sortable?: boolean;
  className?: string;
  render: (row: T) => React.ReactNode;
};

export type RowAction<T> = {
  label: string;
  href?: string | ((row: T) => string);
  onClick?: (row: T) => void;
  destructive?: boolean;
};

export type BulkAction = {
  id: string;
  label: string;
  confirmTitle: string;
  confirm: (count: number) => string;
  destructive?: boolean;
};

export function DataTable<T>({
  rows,
  columns,
  getRowId,
  pathname,
  query,
  searchPlaceholder,
  filters,
  meta,
  sortKey,
  sortOrder,
  empty,
  loading,
  error,
  rowActions,
  bulkActions,
  onBulk,
  selectable = true,
}: {
  rows: T[];
  columns: TableColumn<T>[];
  getRowId: (row: T) => string;
  pathname: string;
  query: Record<string, string>;
  searchPlaceholder?: string;
  filters?: FilterDef[];
  meta?: { page: number; pageCount: number; total: number };
  sortKey?: string;
  sortOrder?: string;
  empty: { title: string; description: string; action?: { label: string; href: string } };
  loading?: boolean;
  error?: string;
  rowActions?: (row: T) => RowAction<T>[];
  bulkActions?: BulkAction[];
  onBulk?: (actionId: string, ids: string[]) => Promise<void>;
  selectable?: boolean;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [confirm, setConfirm] = useState<BulkAction | null>(null);
  const [busy, setBusy] = useState(false);
  const ids = useMemo(() => rows.map(getRowId), [rows, getRowId]);
  const allSelected = ids.length > 0 && ids.every((id) => selected.includes(id));

  function setSort(key: string) {
    const nextOrder = sortKey === key && sortOrder === "asc" ? "desc" : "asc";
    const qs = toQueryString({ ...query, sort: key, order: nextOrder, page: "1" });
    router.push(`${pathname}?${qs}`);
  }

  function goPage(page: number) {
    const qs = toQueryString({ ...query, page });
    router.push(`${pathname}?${qs}`);
  }

  async function runBulk() {
    if (!confirm || !onBulk) return;
    setBusy(true);
    try {
      await onBulk(confirm.id, selected);
      setSelected([]);
      setConfirm(null);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-6">
      <FilterBar pathname={pathname} query={query} searchPlaceholder={searchPlaceholder} filters={filters} />

      {selected.length > 0 && bulkActions && bulkActions.length > 0 ? (
        <div className="mt-4 flex flex-wrap items-center gap-2 border border-border bg-surface px-3 py-2 text-sm">
          <span>{selected.length} selecionado{selected.length === 1 ? "" : "s"}</span>
          {bulkActions.map((action) => (
            <button
              key={action.id}
              type="button"
              className="border border-border px-3 py-1"
              onClick={() => setConfirm(action)}
            >
              {action.label}
            </button>
          ))}
          <button type="button" className="text-xs underline" onClick={() => setSelected([])}>
            Limpar
          </button>
        </div>
      ) : null}

      {error ? <p className="mt-4 text-sm text-danger">{error}</p> : null}

      {loading ? (
        <p className="mt-8 text-sm text-foreground-muted">Carregando…</p>
      ) : rows.length === 0 ? (
        <div className="mt-8">
          <EmptyState title={empty.title} description={empty.description} action={empty.action} />
        </div>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead className="text-foreground-muted">
              <tr>
                {selectable ? (
                  <th className="w-10 py-3">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      aria-label="Selecionar todos"
                      onChange={(event) => setSelected(event.target.checked ? ids : [])}
                    />
                  </th>
                ) : null}
                {columns.map((column) => (
                  <th key={column.key} className={`py-3 ${column.className ?? ""}`}>
                    {column.sortable ? (
                      <button type="button" className="hover:text-foreground" onClick={() => setSort(column.key)}>
                        {column.header}
                        {sortKey === column.key ? (sortOrder === "asc" ? " ↑" : " ↓") : ""}
                      </button>
                    ) : (
                      column.header
                    )}
                  </th>
                ))}
                {rowActions ? <th className="py-3 text-right">Ações</th> : null}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const id = getRowId(row);
                const actions = rowActions?.(row) ?? [];
                return (
                  <tr key={id} className="border-t border-border">
                    {selectable ? (
                      <td className="py-3">
                        <input
                          type="checkbox"
                          checked={selected.includes(id)}
                          aria-label="Selecionar linha"
                          onChange={(event) =>
                            setSelected((current) =>
                              event.target.checked ? [...current, id] : current.filter((item) => item !== id),
                            )
                          }
                        />
                      </td>
                    ) : null}
                    {columns.map((column) => (
                      <td key={column.key} className={`py-3 ${column.className ?? ""}`}>
                        {column.render(row)}
                      </td>
                    ))}
                    {rowActions ? (
                      <td className="py-3 text-right">
                        <div className="flex flex-wrap justify-end gap-2">
                          {actions.map((action) => {
                            const href = typeof action.href === "function" ? action.href(row) : action.href;
                            if (href) {
                              return (
                                <Link key={action.label} href={href} className="text-xs underline">
                                  {action.label}
                                </Link>
                              );
                            }
                            return (
                              <button
                                key={action.label}
                                type="button"
                                className={`text-xs underline ${action.destructive ? "text-danger" : ""}`}
                                onClick={() => action.onClick?.(row)}
                              >
                                {action.label}
                              </button>
                            );
                          })}
                        </div>
                      </td>
                    ) : null}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {meta && meta.pageCount > 1 ? (
        <div className="mt-4 flex items-center justify-between text-sm text-foreground-muted">
          <span>
            Página {meta.page} de {meta.pageCount} · {meta.total} itens
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              className="border border-border px-3 py-1 disabled:opacity-40"
              disabled={meta.page <= 1}
              onClick={() => goPage(meta.page - 1)}
            >
              Anterior
            </button>
            <button
              type="button"
              className="border border-border px-3 py-1 disabled:opacity-40"
              disabled={meta.page >= meta.pageCount}
              onClick={() => goPage(meta.page + 1)}
            >
              Próxima
            </button>
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        open={Boolean(confirm)}
        title={confirm?.confirmTitle ?? ""}
        description={confirm ? confirm.confirm(selected.length) : ""}
        confirmLabel={confirm?.label}
        destructive={confirm?.destructive}
        busy={busy}
        onClose={() => setConfirm(null)}
        onConfirm={() => void runBulk()}
      />
    </div>
  );
}
