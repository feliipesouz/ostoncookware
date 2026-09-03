import { RedirectsManager } from "@/components/admin/redirects-manager";
import { PageHeader } from "@/components/admin/ui/page-header";
import { adminGet, emptyPage, type AdminPage } from "@/lib/admin";
import { searchParamsRecord, toQueryString } from "@/lib/admin-query";

export default async function RedirectsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = searchParamsRecord(await searchParams);
  const qs = toQueryString({ ...query, pageSize: 20 });
  const result = await adminGet<
    AdminPage<{ id: string; sourcePath: string; destination: string; statusCode: number; active: boolean }>
  >(`/v1/admin/redirects?${qs}`).catch(() =>
    emptyPage<{ id: string; sourcePath: string; destination: string; statusCode: number; active: boolean }>(),
  );

  return (
    <div>
      <PageHeader
        title="Redirects"
        description="Quando um slug muda, o endereço antigo precisa apontar para o novo."
        breadcrumbs={[{ href: "/admin", label: "CMS" }, { label: "Redirects" }]}
      />
      <div className="mt-8">
        <RedirectsManager rows={result.data} meta={result.meta} query={query} />
      </div>
    </div>
  );
}
