import { LeadsTable } from "@/components/admin/leads-table";
import { PageHeader } from "@/components/admin/ui/page-header";
import { adminGet, emptyPage, type AdminPage } from "@/lib/admin";
import { searchParamsRecord, toQueryString } from "@/lib/admin-query";

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = searchParamsRecord(await searchParams);
  const qs = toQueryString({ ...query, pageSize: 20 });
  const result = await adminGet<AdminPage<Parameters<typeof LeadsTable>[0]["initial"][number]>>(`/v1/admin/leads?${qs}`).catch(
    () => emptyPage<Parameters<typeof LeadsTable>[0]["initial"][number]>(),
  );

  return (
    <div>
      <PageHeader
        title="Leads"
        description="Fila comercial. Filtre, abra o pedido e registre o primeiro contato."
        breadcrumbs={[{ href: "/admin", label: "CMS" }, { label: "Leads" }]}
        actions={
          <a href={`/v1/admin/leads/export?${qs}`} className="border border-border px-4 py-2 text-sm">
            Exportar CSV
          </a>
        }
      />
      <LeadsTable initial={result.data} meta={result.meta} query={query} />
    </div>
  );
}
