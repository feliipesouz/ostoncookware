"use client";

import { useState } from "react";
import { adminMutate } from "@/lib/admin-client";

type PreviewRow = {
  line: number;
  action: string;
  name: string | null;
  sku: string | null;
  slug: string | null;
  field?: string;
  message?: string;
};

type Preview = {
  valid: boolean;
  updates: number;
  creates: number;
  skips?: number;
  errors: { line: number; field: string; message: string }[];
  rows: PreviewRow[];
};

export function ProductImport() {
  const [csv, setCsv] = useState("");
  const [preview, setPreview] = useState<Preview | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function onFile(file: File) {
    const text = await file.text();
    setCsv(text);
    setPreview(null);
    setMessage("");
  }

  async function runPreview() {
    setBusy(true);
    setMessage("");
    try {
      const result = await adminMutate<{ data: Preview }>("/v1/admin/products/import/preview", "POST", { csv });
      setPreview(result.data);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível ler o CSV.");
    } finally {
      setBusy(false);
    }
  }

  async function confirm() {
    if (!preview?.valid) return;
    setBusy(true);
    setMessage("");
    try {
      const result = await adminMutate<{ data: { imported: number; creates: number; updates: number } }>(
        "/v1/admin/products/import",
        "POST",
        { csv },
      );
      setMessage(`Importação concluída: ${result.data.creates} criados, ${result.data.updates} atualizados.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "A importação falhou e nada foi gravado.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-6">
      <label className="flex cursor-pointer flex-col items-center justify-center border border-dashed border-border px-6 py-12 text-sm">
        Envie um CSV de produtos
        <input
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.currentTarget.value = "";
            if (file) void onFile(file);
          }}
        />
      </label>
      <p className="mt-3 text-xs text-foreground-muted">
        Identificação por SKU, ou por slug se o SKU estiver vazio. Nunca por nome. Preview não grava nada.
      </p>
      <div className="mt-4 flex gap-2">
        <button
          type="button"
          disabled={busy || !csv}
          className="bg-foreground px-4 py-2 text-sm text-foreground-inverse disabled:opacity-50"
          onClick={() => void runPreview()}
        >
          Pré-visualizar
        </button>
        <button
          type="button"
          disabled={busy || !preview?.valid}
          className="border border-border px-4 py-2 text-sm disabled:opacity-50"
          onClick={() => void confirm()}
        >
          Confirmar importação
        </button>
      </div>
      {message ? <p className="mt-4 text-sm">{message}</p> : null}
      {preview ? (
        <div className="mt-6">
          <p className="text-sm text-foreground-muted">
            {preview.creates} criar · {preview.updates} atualizar · {preview.skips ?? 0} ignorar · {preview.errors.length} erros
          </p>
          {preview.errors.length > 0 ? (
            <ul className="mt-3 text-sm">
              {preview.errors.map((error) => (
                <li key={`${error.line}-${error.field}`}>
                  Linha {error.line} · {error.field}: {error.message}
                </li>
              ))}
            </ul>
          ) : null}
          <table className="mt-6 w-full text-left text-sm">
            <thead className="text-foreground-muted">
              <tr>
                <th className="py-3">Linha</th>
                <th>Ação</th>
                <th>Nome</th>
                <th>SKU</th>
                <th>Slug</th>
              </tr>
            </thead>
            <tbody>
              {preview.rows.map((row) => (
                <tr key={row.line} className="border-t border-border">
                  <td className="py-3">{row.line}</td>
                  <td>{row.action}</td>
                  <td>{row.name ?? "—"}</td>
                  <td>{row.sku ?? "—"}</td>
                  <td>{row.slug ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
