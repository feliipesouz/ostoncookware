"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminMutate } from "@/lib/admin-client";
import { formatRelativeDay } from "@/lib/admin-format";
import { ConfirmDialog } from "./ui/confirm-dialog";
import { EmptyState } from "./ui/empty-state";

type TrashItem = {
  id: string;
  kind: "collection" | "product" | "campaign";
  name: string;
  slug?: string | null;
  status?: string | null;
  deletedAt?: string | Date | null;
};

const KIND: Record<string, string> = {
  collection: "Coleção",
  product: "Produto",
  campaign: "Campanha",
};

export function TrashView({ items }: { items: TrashItem[] }) {
  const router = useRouter();
  const [target, setTarget] = useState<TrashItem | null>(null);

  return (
    <div className="mt-8">
      {items.length === 0 ? (
        <EmptyState
          title="A lixeira está vazia."
          description="Itens excluídos do catálogo aparecem aqui para restauração. Arquivados continuam em Campanhas, Coleções e Produtos."
        />
      ) : (
        <table className="w-full text-left text-sm">
          <thead className="text-foreground-muted">
            <tr>
              <th className="py-3">Nome</th>
              <th>Tipo</th>
              <th>Quando</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={`${item.kind}-${item.id}`} className="border-t border-border">
                <td className="py-3">{item.name}</td>
                <td>{KIND[item.kind] ?? item.kind}</td>
                <td>{formatRelativeDay(item.deletedAt)}</td>
                <td className="text-right">
                  <button type="button" className="text-xs underline" onClick={() => setTarget(item)}>
                    Restaurar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <ConfirmDialog
        open={Boolean(target)}
        title="Restaurar da lixeira"
        description={
          target
            ? `Restaurar "${target.name}" tira ${KIND[target.kind]?.toLowerCase() ?? "o item"} da lixeira e devolve como rascunho. Nada é publicado automaticamente.`
            : ""
        }
        confirmLabel="Restaurar"
        onClose={() => setTarget(null)}
        onConfirm={() => {
          if (!target) return;
          void adminMutate(`/v1/admin/trash/${target.kind}/${target.id}/restore`, "POST").then(() => {
            setTarget(null);
            router.refresh();
          });
        }}
      />
    </div>
  );
}
