"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { adminMutate } from "@/lib/admin-client";
import { formatDateTime } from "@/lib/admin-format";
import { toQueryString } from "@/lib/admin-query";
import { DataTable } from "./ui/data-table";
import { StatusBadge } from "./ui/status-badge";

export type LeadRow = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  interest: string;
  collectionName: string | null;
  source: string | null;
  status: string;
  createdAt: string;
  assignedTo?: { id: string; name: string } | null;
  tags?: string[];
};

const INTEREST: Record<string, string> = {
  COLLECTION: "Coleção",
  CONSULTANT: "Consultor",
  CATALOG: "Catálogo",
  OTHER: "Outro",
};

export function LeadsTable({
  initial,
  meta,
  query,
  canWrite = false,
  canExport = false,
  assignees = [],
  collections = [],
}: {
  initial: LeadRow[];
  meta?: { page: number; pageCount: number; total: number };
  query?: Record<string, string>;
  canWrite?: boolean;
  canExport?: boolean;
  assignees?: { id: string; name: string }[];
  collections?: { id: string; name: string }[];
}) {
  const router = useRouter();
  const currentQuery = query ?? {};

  async function exportCsv() {
    const params = new URLSearchParams(currentQuery);
    const response = await fetch(`/v1/admin/leads/export?${params}`, { credentials: "include" });
    if (!response.ok) {
      throw new Error("Você não tem permissão para exportar leads.");
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "leads.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <form
        className="mb-4 grid gap-3 md:grid-cols-4"
        onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          const next = { ...currentQuery };
          for (const key of ["source", "utmCampaign", "from", "to"]) {
            const value = String(form.get(key) ?? "").trim();
            if (value) next[key] = value;
            else delete next[key];
          }
          const qs = toQueryString({ ...next, page: "1" });
          router.push(qs ? `/admin/leads?${qs}` : "/admin/leads");
        }}
      >
        <input name="source" defaultValue={currentQuery.source ?? ""} placeholder="Origem" className="border border-border px-3 py-2 text-sm" />
        <input name="utmCampaign" defaultValue={currentQuery.utmCampaign ?? ""} placeholder="Campanha UTM" className="border border-border px-3 py-2 text-sm" />
        <input type="date" name="from" defaultValue={currentQuery.from ?? ""} className="border border-border px-3 py-2 text-sm" />
        <input type="date" name="to" defaultValue={currentQuery.to ?? ""} className="border border-border px-3 py-2 text-sm" />
        <div className="flex gap-2 md:col-span-4">
          <button type="submit" className="bg-foreground px-4 py-2 text-sm text-foreground-inverse">
            Período e origem
          </button>
          {canExport ? (
            <button type="button" className="border border-border px-4 py-2 text-sm" onClick={() => void exportCsv()}>
              Exportar CSV
            </button>
          ) : null}
        </div>
      </form>
      <DataTable
        rows={initial}
        getRowId={(row) => row.id}
        pathname="/admin/leads"
        query={currentQuery}
        meta={meta}
        sortKey={currentQuery.sort}
        sortOrder={currentQuery.order}
        searchPlaceholder="Buscar por nome, e-mail ou telefone…"
        filters={[
          {
            key: "status",
            label: "Status",
            options: [
              { value: "NEW", label: "Novo" },
              { value: "CONTACTED", label: "Contatado" },
              { value: "QUALIFIED", label: "Qualificado" },
              { value: "WON", label: "Ganho" },
              { value: "LOST", label: "Perdido" },
            ],
          },
          {
            key: "assignedToId",
            label: "Responsável",
            options: assignees.map((user) => ({ value: user.id, label: user.name })),
          },
          {
            key: "collectionId",
            label: "Coleção",
            options: collections.map((collection) => ({ value: collection.id, label: collection.name })),
          },
          {
            key: "interest",
            label: "Interesse",
            options: Object.entries(INTEREST).map(([value, label]) => ({ value, label })),
          },
        ]}
        empty={{
          title: "Nenhum lead ainda.",
          description: "Quando alguém pede catálogo ou fala com o consultor, o pedido aparece aqui para o time comercial.",
        }}
        columns={[
          {
            key: "name",
            header: "Nome",
            sortable: true,
            render: (row) => (
              <Link className="underline" href={`/admin/leads/${row.id}`}>
                {row.name}
              </Link>
            ),
          },
          { key: "phone", header: "Telefone", render: (row) => row.phone },
          { key: "interest", header: "Interesse", render: (row) => INTEREST[row.interest] ?? row.interest },
          { key: "collectionName", header: "Coleção", render: (row) => row.collectionName ?? "—" },
          { key: "source", header: "Origem", render: (row) => row.source ?? "—" },
          { key: "assignedTo", header: "Responsável", render: (row) => row.assignedTo?.name ?? "—" },
          {
            key: "createdAt",
            header: "Data",
            sortable: true,
            render: (row) => formatDateTime(row.createdAt),
          },
          {
            key: "status",
            header: "Status",
            sortable: true,
            render: (row) =>
              canWrite ? (
                <label className="flex items-center gap-2">
                  <StatusBadge status={row.status} />
                  <select
                    defaultValue={row.status}
                    className="border border-border bg-transparent px-2 py-1 text-xs"
                    onChange={(event) => void adminMutate(`/v1/admin/leads/${row.id}`, "PATCH", { status: event.target.value })}
                  >
                    <option value="NEW">Novo</option>
                    <option value="CONTACTED">Contatado</option>
                    <option value="QUALIFIED">Qualificado</option>
                    <option value="WON">Ganho</option>
                    <option value="LOST">Perdido</option>
                  </select>
                </label>
              ) : (
                <StatusBadge status={row.status} />
              ),
          },
        ]}
        rowActions={(row) => [{ label: "Abrir", href: `/admin/leads/${row.id}` }]}
        selectable={false}
      />
    </div>
  );
}
