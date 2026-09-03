"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminMutate, AdminApiError } from "@/lib/admin-client";
import { ConfirmDialog } from "./ui/confirm-dialog";
import { DataTable } from "./ui/data-table";
import { Field, fieldClass, FormSection } from "./ui/form-section";
import { isSafeCtaUrl, isSafeRedirectSource } from "@/lib/safe-url";

type RedirectRow = {
  id: string;
  sourcePath: string;
  destination: string;
  statusCode: number;
  active: boolean;
};

export function RedirectsManager({
  rows,
  meta,
  query,
}: {
  rows: RedirectRow[];
  meta: { page: number; pageCount: number; total: number };
  query: Record<string, string>;
}) {
  const router = useRouter();
  const [sourcePath, setSourcePath] = useState("");
  const [destination, setDestination] = useState("");
  const [statusCode, setStatusCode] = useState("301");
  const [error, setError] = useState("");
  const [deactivate, setDeactivate] = useState<RedirectRow | null>(null);

  async function create(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    if (!isSafeRedirectSource(sourcePath)) {
      setError("Caminho de origem inválido. Use /caminho, sem protocolo.");
      return;
    }
    if (!isSafeCtaUrl(destination) || destination.startsWith("/admin") || sourcePath === destination) {
      setError("Destino inválido. Use um caminho interno ou http(s), fora do CMS.");
      return;
    }
    try {
      await adminMutate("/v1/admin/redirects", "POST", {
        sourcePath,
        destination,
        statusCode: Number(statusCode),
        active: true,
      });
      setSourcePath("");
      setDestination("");
      router.refresh();
    } catch (err) {
      setError(err instanceof AdminApiError ? err.message : "Não foi possível criar o redirect.");
    }
  }

  return (
    <div className="grid gap-8">
      <FormSection title="Novo redirect" description="Quando um slug muda, o visitante antigo não pode cair em 404.">
        <form className="grid gap-4 sm:grid-cols-3" onSubmit={(event) => void create(event)}>
          <Field label="Origem">
            <input className={fieldClass} placeholder="/colecoes/antiga" value={sourcePath} onChange={(e) => setSourcePath(e.target.value)} />
          </Field>
          <Field label="Destino">
            <input className={fieldClass} placeholder="/colecoes/nova" value={destination} onChange={(e) => setDestination(e.target.value)} />
          </Field>
          <Field label="Código">
            <select className={fieldClass} value={statusCode} onChange={(e) => setStatusCode(e.target.value)}>
              <option value="301">301 permanente</option>
              <option value="302">302 temporário</option>
            </select>
          </Field>
          <button type="submit" className="justify-self-start bg-foreground px-4 py-2 text-sm text-foreground-inverse">
            Criar redirect
          </button>
        </form>
        {error ? <p className="text-sm text-danger">{error}</p> : null}
      </FormSection>

      <DataTable
        rows={rows}
        getRowId={(row) => row.id}
        pathname="/admin/redirects"
        query={query}
        meta={meta}
        searchPlaceholder="Buscar origem ou destino…"
        selectable={false}
        empty={{
          title: "Nenhum redirecionamento configurado.",
          description: "Redirects evitam páginas mortas quando um slug muda. Crie o primeiro acima.",
        }}
        columns={[
          { key: "sourcePath", header: "Origem", render: (row) => row.sourcePath },
          { key: "destination", header: "Destino", render: (row) => row.destination },
          { key: "statusCode", header: "Código", render: (row) => row.statusCode },
          { key: "active", header: "Ativo", render: (row) => (row.active ? "Sim" : "Não") },
        ]}
        rowActions={(row) =>
          row.active
            ? [
                {
                  label: "Desativar",
                  destructive: true,
                  onClick: () => setDeactivate(row),
                },
              ]
            : []
        }
      />

      <ConfirmDialog
        open={Boolean(deactivate)}
        title="Desativar redirect"
        description={
          deactivate
            ? `Você está prestes a desativar o redirect de "${deactivate.sourcePath}". Quem chegar nesse endereço deixa de ser enviado para ${deactivate.destination}.`
            : ""
        }
        confirmLabel="Desativar"
        destructive
        onClose={() => setDeactivate(null)}
        onConfirm={() => {
          if (!deactivate) return;
          void adminMutate(`/v1/admin/redirects/${deactivate.id}/deactivate`, "POST").then(() => {
            setDeactivate(null);
            router.refresh();
          });
        }}
      />
    </div>
  );
}
