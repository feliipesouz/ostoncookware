import { AuditTable, type AuditRow } from "@/components/admin/audit-table";
import { PageHeader } from "@/components/admin/ui/page-header";
import { adminGet } from "@/lib/admin";

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string" && value) query.set(key, value);
  }

  const { data } = await adminGet<{ data: AuditRow[] }>(`/v1/admin/audit?${query}`).catch(() => ({ data: [] }));
  const filters = {
    actorId: typeof params.actorId === "string" ? params.actorId : "",
    entity: typeof params.entity === "string" ? params.entity : "",
    action: typeof params.action === "string" ? params.action : "",
    from: typeof params.from === "string" ? params.from : "",
    to: typeof params.to === "string" ? params.to : "",
    q: typeof params.q === "string" ? params.q : "",
  };

  return (
    <div>
      <PageHeader
        title="Auditoria"
        description="Histórico em linguagem humana, com filtros na URL."
        breadcrumbs={[{ href: "/admin", label: "CMS" }, { label: "Auditoria" }]}
      />
      <AuditTable initial={data} filters={filters} />
    </div>
  );
}
