import Link from "next/link";
import { CampaignsTable } from "@/components/admin/content-tables";
import { PageHeader } from "@/components/admin/ui/page-header";
import { adminGet, emptyPage, type AdminPage } from "@/lib/admin";
import { searchParamsRecord, toQueryString } from "@/lib/admin-query";

export default async function CampaignsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = searchParamsRecord(await searchParams);
  const qs = toQueryString({ ...query, pageSize: 20 });
  const result = await adminGet<AdminPage<{ id: string; name: string; title: string; status: string; sortOrder: number }>>(
    `/v1/admin/campaigns?${qs}`,
  ).catch(() => emptyPage<{ id: string; name: string; title: string; status: string; sortOrder: number }>());

  return (
    <div>
      <PageHeader
        title="Campanhas"
        description="O hero da homepage. Agende com início e fim para não depender de alguém publicar à meia-noite."
        breadcrumbs={[{ href: "/admin", label: "CMS" }, { label: "Campanhas" }]}
        actions={
          <Link href="/admin/campanhas/nova" className="bg-foreground px-4 py-2 text-sm text-foreground-inverse">
            Nova campanha
          </Link>
        }
      />
      <CampaignsTable rows={result.data} meta={result.meta} query={query} />
    </div>
  );
}
