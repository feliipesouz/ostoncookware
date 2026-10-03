import { HistoryView } from "@/components/admin/history-view";
import { PageHeader } from "@/components/admin/ui/page-header";
import { adminGet } from "@/lib/admin";

export default async function CollectionHistoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data } = await adminGet<{ data: { name?: string; version: number } }>(`/v1/admin/collections/${id}`);
  const name = String(data.name ?? "Coleção");

  return (
    <div>
      <PageHeader
        title={`Histórico · ${name}`}
        breadcrumbs={[
          { href: "/admin/colecoes", label: "Coleções" },
          { href: `/admin/colecoes/${id}`, label: name },
          { label: "Histórico" },
        ]}
      />
      <HistoryView
        entityLabel="coleção"
        entityName={name}
        versionsPath={`/v1/admin/collections/${id}/revisions`}
        currentVersion={data.version}
      />
    </div>
  );
}
