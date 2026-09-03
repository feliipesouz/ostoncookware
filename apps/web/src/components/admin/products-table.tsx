"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { adminMutate } from "@/lib/admin-client";

type ProductRow = {
  id: string;
  name: string;
  slug: string;
  status: string;
  featured?: boolean;
  collectionName?: string;
};

export function ProductsTable({ initial }: { initial: ProductRow[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  function toggle(id: string) {
    setSelected((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  async function bulk(action: "publish" | "archive" | "feature" | "unfeature") {
    if (selected.length === 0) return;
    setBusy(true);
    setMessage("");
    try {
      await adminMutate("/v1/admin/products/bulk", "POST", { ids: selected, action });
      setSelected([]);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível aplicar a ação.");
    } finally {
      setBusy(false);
    }
  }

  function exportSelected() {
    const query = selected.length > 0 ? `?ids=${selected.join(",")}` : "";
    const link = document.createElement("a");
    link.href = `/v1/admin/products/export.csv${query}`;
    link.setAttribute("download", "produtos.csv");
    document.body.append(link);
    link.click();
    link.remove();
  }

  return (
    <div>
      <div className="mt-6 flex flex-wrap gap-2">
        <button type="button" disabled={busy} className="border border-border px-3 py-2 text-sm" onClick={() => void bulk("publish")}>
          Publicar
        </button>
        <button type="button" disabled={busy} className="border border-border px-3 py-2 text-sm" onClick={() => void bulk("archive")}>
          Arquivar
        </button>
        <button type="button" disabled={busy} className="border border-border px-3 py-2 text-sm" onClick={() => void bulk("feature")}>
          Destacar
        </button>
        <button type="button" disabled={busy} className="border border-border px-3 py-2 text-sm" onClick={exportSelected}>
          Exportar CSV
        </button>
        <Link href="/admin/produtos/importar" className="border border-border px-3 py-2 text-sm">
          Importar CSV
        </Link>
      </div>
      {message ? <p className="mt-3 text-sm text-foreground-muted">{message}</p> : null}
      <table className="mt-8 w-full text-left text-sm">
        <thead className="text-foreground-muted">
          <tr>
            <th className="py-3">
              <input
                type="checkbox"
                checked={initial.length > 0 && selected.length === initial.length}
                onChange={(event) => setSelected(event.target.checked ? initial.map((row) => row.id) : [])}
              />
            </th>
            <th>Nome</th>
            <th>Coleção</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {initial.map((row) => (
            <tr key={row.id} className="border-t border-border">
              <td className="py-3">
                <input type="checkbox" checked={selected.includes(row.id)} onChange={() => toggle(row.id)} />
              </td>
              <td>
                <Link className="underline" href={`/admin/produtos/${row.id}`}>
                  {row.name}
                </Link>
              </td>
              <td>{row.collectionName}</td>
              <td>{row.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
