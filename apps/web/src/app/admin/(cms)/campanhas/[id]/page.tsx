import { CampaignForm } from "@/components/admin/campaign-form";
import { PageHeader } from "@/components/admin/ui/page-header";
import { adminGet } from "@/lib/admin";

export default async function EditCampaignPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data } = await adminGet<{ data: Record<string, unknown> & { name?: string } }>(`/v1/admin/campaigns/${id}`);
  const name = String(data.name ?? "Campanha");

  return (
    <div>
      <PageHeader
        title={name}
        breadcrumbs={[{ href: "/admin/campanhas", label: "Campanhas" }, { label: name }, { label: "Editar" }]}
      />
      <div className="mt-8">
        <CampaignForm id={id} initial={data} />
      </div>
    </div>
  );
}
