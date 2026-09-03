"use client";

import { useState } from "react";
import { adminMutate } from "@/lib/admin-client";
import { confirmDestructive } from "@/lib/environment";

type TrashItem = {
  id: string;
  kind: "collection" | "product" | "campaign";
  name: string;
  slug: string | null;
  status: string | null;
  deletedAt: string | Date;
};

const KIND_LABEL = {
  collection: "Coleção",
  product: "Produto",
  campaign: "Campanha",
};

export function TrashTable({ initial }: { initial: TrashItem[] }) {
  const [items, setItems] = useState(initial);
  const [error, setError] = useState("");

  async function restore(item: TrashItem) {
    if (!confirmDestructive(`Restaurar “${item.name}” como rascunho?`)) return;
    setError("");
    try {
      await adminMutate(`/v1/admin/trash/${item.kind}/${item.id}/restore`, "POST");
      setItems((current) => current.filter((entry) => entry.id !== item.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível restaurar.");
    }
  }

  return (
    <div className="mt-8">
      {error ? <p className="mb-4 text-sm text-danger">{error}</p> : null}
      {items.length === 0 ? (
        <p className="text-sm text-foreground-muted">A lixeira está vazia.</p>
      ) : (
        <table className="w-full text-left text-sm">
          <thead className="text-foreground-muted">
            <tr>
              <th className="py-3">Tipo</th>
              <th>Nome</th>
              <th>Slug</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={`${item.kind}-${item.id}`} className="border-t border-border">
                <td className="py-3">{KIND_LABEL[item.kind]}</td>
                <td>{item.name}</td>
                <td>{item.slug ?? "—"}</td>
                <td>
                  <button type="button" className="underline" onClick={() => restore(item)}>
                    Restaurar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
