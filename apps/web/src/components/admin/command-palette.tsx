"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type SearchItem = { id: string; title: string; href: string; subtitle?: string };
type SearchGroup = { type: string; items: SearchItem[] };

const GROUP_LABEL: Record<string, string> = {
  products: "Produtos",
  collections: "Coleções",
  campaigns: "Campanhas",
  leads: "Leads",
  pages: "Páginas",
};

export function CommandPalette({
  open: openProp,
  onClose,
}: {
  open?: boolean;
  onClose?: () => void;
}) {
  const router = useRouter();
  const [internalOpen, setInternalOpen] = useState(false);
  const controlled = openProp !== undefined;
  const open = controlled ? openProp : internalOpen;
  const [q, setQ] = useState("");
  const [groups, setGroups] = useState<SearchGroup[]>([]);

  const setOpen = useCallback(
    (next: boolean | ((current: boolean) => boolean)) => {
      const value = typeof next === "function" ? next(open) : next;
      if (controlled) {
        if (!value) onClose?.();
        return;
      }
      setInternalOpen(value);
    },
    [controlled, open, onClose],
  );

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        return;
      }
      if (controlled) {
        return;
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setInternalOpen((current) => !current);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [controlled, setOpen]);

  useEffect(() => {
    if (!open) return;
    const query = q.trim();
    if (query.length < 2) {
      return;
    }
    const handle = window.setTimeout(() => {
      void fetch(`/v1/admin/search?q=${encodeURIComponent(query)}`, { credentials: "include" })
        .then((response) => (response.ok ? response.json() : { groups: [] }))
        .then((payload: { groups?: SearchGroup[] }) => setGroups(payload.groups ?? []));
    }, 200);
    return () => window.clearTimeout(handle);
  }, [q, open]);

  const visibleGroups = q.trim().length < 2 ? [] : groups;

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 p-4" onClick={() => setOpen(false)}>
      <div
        className="mx-auto mt-24 max-w-xl border border-border bg-background p-4"
        onClick={(event) => event.stopPropagation()}
      >
        <input
          autoFocus
          value={q}
          onChange={(event) => setQ(event.target.value)}
          placeholder="Buscar produtos, coleções, campanhas, leads…"
          className="w-full border border-border px-3 py-2 text-sm"
        />
        <div className="mt-4 max-h-80 overflow-auto">
          {visibleGroups.length === 0 ? (
            <p className="text-sm text-foreground-muted">
              {q.trim().length < 2 ? "Digite pelo menos 2 caracteres." : "Nenhum resultado."}
            </p>
          ) : (
            visibleGroups.map((group) => (
              <section key={group.type} className="mb-4">
                <h3 className="text-xs uppercase tracking-[0.16em] text-foreground-muted">
                  {GROUP_LABEL[group.type] ?? group.type}
                </h3>
                <ul className="mt-2">
                  {group.items.map((item) => (
                    <li key={item.id}>
                      <button
                        type="button"
                        className="w-full px-2 py-2 text-left text-sm hover:bg-surface"
                        onClick={() => {
                          setOpen(false);
                          router.push(item.href);
                        }}
                      >
                        <span>{item.title}</span>
                        {item.subtitle ? (
                          <span className="block text-xs text-foreground-muted">{item.subtitle}</span>
                        ) : null}
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
