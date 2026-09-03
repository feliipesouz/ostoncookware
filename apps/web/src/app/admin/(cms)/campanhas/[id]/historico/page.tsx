import { HistoryView } from "@/components/admin/history-view";
import { PageHeader } from "@/components/admin/ui/page-header";
import { adminGet } from "@/lib/admin";

export default async function CampaignHistoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data } = await adminGet<{ data: { name?: string } }>(`/v1/admin/campaigns/${id}`);
  const name = String(data.name ?? "Campanha");

  return (
    <div>
      <PageHeader
        title={`Histórico · ${name}`}
        breadcrumbs={[
          { href: "/admin/campanhas", label: "Campanhas" },
          { href: `/admin/campanhas/${id}`, label: name },
          { label: "Histórico" },
        ]}
      />
      <HistoryView
        entityLabel="campanha"
        entityName={name}
        versionsPath={`/v1/admin/campaigns/${id}/revisions`}
        restorePath={(version) => `/v1/admin/campaigns/${id}/revisions/${version.id ?? version.version}/restore`}
      />
    </div>
  );
}
