import Link from "next/link";
import { CollectionsTable } from "@/components/admin/content-tables";
import { PageHeader } from "@/components/admin/ui/page-header";
import { adminGet, emptyPage, type AdminPage } from "@/lib/admin";
import { searchParamsRecord, toQueryString } from "@/lib/admin-query";

export default async function CollectionsAdminPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = searchParamsRecord(await searchParams);
  const qs = toQueryString({ ...query, pageSize: 20 });
  const result = await adminGet<AdminPage<{ id: string; name: string; slug: string; status: string; featured: boolean }>>(
    `/v1/admin/collections?${qs}`,
  ).catch(() => emptyPage<{ id: string; name: string; slug: string; status: string; featured: boolean }>());

  return (
    <div>
      <PageHeader
        title="Coleções"
        description="A coleção é o eixo do catálogo e da homepage."
        breadcrumbs={[{ href: "/admin", label: "CMS" }, { label: "Coleções" }]}
        actions={
          <Link href="/admin/colecoes/nova" className="bg-foreground px-4 py-2 text-sm text-foreground-inverse">
            Nova coleção
          </Link>
        }
      />
      <CollectionsTable rows={result.data} meta={result.meta} query={query} />
    </div>
  );
}
