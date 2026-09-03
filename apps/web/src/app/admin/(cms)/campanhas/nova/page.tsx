import { CampaignForm } from "@/components/admin/campaign-form";
import { PageHeader } from "@/components/admin/ui/page-header";

export default function NewCampaignPage() {
  return (
    <div>
      <PageHeader title="Nova campanha" breadcrumbs={[{ href: "/admin/campanhas", label: "Campanhas" }, { label: "Nova" }]} />
      <div className="mt-8">
        <CampaignForm />
      </div>
    </div>
  );
}
