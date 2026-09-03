"use client";

import { useState } from "react";
import type { NavigationItem, NavigationKey } from "@oston/contracts";
import { adminMutate } from "@/lib/admin-client";
import { ReorderControls, moveItem } from "./reorder-list";

function emptyItem(): NavigationItem {
  return {
    id: `nav-${crypto.randomUUID()}`,
    label: "",
    href: "/",
    kind: "INTERNAL",
    enabled: true,
    sortOrder: 0,
    parentId: null,
  };
}

export function NavigationEditor({
  initialHeader,
  initialFooter,
}: {
  initialHeader: NavigationItem[];
  initialFooter: NavigationItem[];
}) {
  const [tab, setTab] = useState<NavigationKey>("header");
  const [header, setHeader] = useState(initialHeader);
  const [footer, setFooter] = useState(initialFooter);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const items = tab === "header" ? header : footer;
  const setItems = tab === "header" ? setHeader : setFooter;

  async function save() {
    setError("");
    setMessage("");
    try {
      await adminMutate(`/v1/admin/navigation/${tab}`, "PUT", { items });
      setMessage(tab === "header" ? "Menu do topo salvo." : "Menu do rodapé salvo.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível salvar.");
    }
  }

  const roots = items.filter((item) => !item.parentId);

  return (
    <div className="grid max-w-3xl gap-6">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setTab("header")}
          className={tab === "header" ? "bg-foreground px-4 py-2 text-foreground-inverse" : "border border-border px-4 py-2"}
        >
          Cabeçalho
        </button>
        <button
          type="button"
          onClick={() => setTab("footer")}
          className={tab === "footer" ? "bg-foreground px-4 py-2 text-foreground-inverse" : "border border-border px-4 py-2"}
        >
          Rodapé
        </button>
      </div>
      <ol className="grid gap-3">
        {items.map((item, index) => (
          <li key={item.id} className="grid gap-3 border border-border p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={item.enabled}
                  onChange={(event) =>
                    setItems((current) =>
                      current.map((entry) => (entry.id === item.id ? { ...entry, enabled: event.target.checked } : entry)),
                    )
                  }
                />
                Visível
              </label>
              <ReorderControls
                index={index}
                total={items.length}
                label={item.label || "item"}
                onMove={(direction) => setItems((current) => moveItem(current, index, direction))}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-1 text-sm">
                Rótulo
                <input
                  className="border border-border px-3 py-2"
                  value={item.label}
                  onChange={(event) =>
                    setItems((current) =>
                      current.map((entry) => (entry.id === item.id ? { ...entry, label: event.target.value } : entry)),
                    )
                  }
                />
              </label>
              <label className="grid gap-1 text-sm">
                URL
                <input
                  className="border border-border px-3 py-2"
                  value={item.href}
                  onChange={(event) =>
                    setItems((current) =>
                      current.map((entry) => (entry.id === item.id ? { ...entry, href: event.target.value } : entry)),
                    )
                  }
                />
              </label>
              <label className="grid gap-1 text-sm">
                Tipo
                <select
                  className="border border-border px-3 py-2"
                  value={item.kind}
                  onChange={(event) =>
                    setItems((current) =>
                      current.map((entry) =>
                        entry.id === item.id ? { ...entry, kind: event.target.value as NavigationItem["kind"] } : entry,
                      ),
                    )
                  }
                >
                  <option value="INTERNAL">Interno</option>
                  <option value="EXTERNAL">Externo</option>
                </select>
              </label>
              <label className="grid gap-1 text-sm">
                Submenu de
                <select
                  className="border border-border px-3 py-2"
                  value={item.parentId ?? ""}
                  onChange={(event) =>
                    setItems((current) =>
                      current.map((entry) =>
                        entry.id === item.id ? { ...entry, parentId: event.target.value || null } : entry,
                      ),
                    )
                  }
                >
                  <option value="">Item principal</option>
                  {roots
                    .filter((root) => root.id !== item.id)
                    .map((root) => (
                      <option key={root.id} value={root.id}>
                        {root.label || root.id}
                      </option>
                    ))}
                </select>
              </label>
            </div>
            <button
              type="button"
              className="justify-self-start text-sm text-danger"
              onClick={() => setItems((current) => current.filter((entry) => entry.id !== item.id && entry.parentId !== item.id))}
            >
              Remover
            </button>
          </li>
        ))}
      </ol>
      <div className="flex flex-wrap gap-3">
        <button type="button" className="border border-border px-5 py-2" onClick={() => setItems((current) => [...current, emptyItem()])}>
          Adicionar item
        </button>
        <button type="button" className="bg-foreground px-5 py-2 text-foreground-inverse" onClick={save}>
          Salvar {tab === "header" ? "cabeçalho" : "rodapé"}
        </button>
      </div>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      {message ? <p className="text-sm text-success">{message}</p> : null}
    </div>
  );
}
