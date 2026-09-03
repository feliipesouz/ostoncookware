import Link from "next/link";
import { ProductsTable } from "@/components/admin/content-tables";
import { PageHeader } from "@/components/admin/ui/page-header";
import { adminGet, emptyPage, type AdminPage } from "@/lib/admin";
import { searchParamsRecord, toQueryString } from "@/lib/admin-query";

export default async function ProductsAdminPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = searchParamsRecord(await searchParams);
  const qs = toQueryString({ ...query, pageSize: 20 });
  const result = await adminGet<AdminPage<{ id: string; name: string; slug: string; status: string; collectionName?: string; featured?: boolean }>>(
    `/v1/admin/products?${qs}`,
  ).catch(() => emptyPage<{ id: string; name: string; slug: string; status: string; collectionName?: string; featured?: boolean }>());

  return (
    <div>
      <PageHeader
        title="Produtos"
        description="Ficha, mídia e publicação. Rascunho não aparece no site."
        breadcrumbs={[{ href: "/admin", label: "CMS" }, { label: "Produtos" }]}
        actions={
          <>
            <Link href="/admin/produtos/importar" className="border border-border px-4 py-2 text-sm">
              Importar CSV
            </Link>
            <a href="/v1/admin/products/export.csv" className="border border-border px-4 py-2 text-sm">
              Exportar CSV
            </a>
            <Link href="/admin/produtos/novo" className="bg-foreground px-4 py-2 text-sm text-foreground-inverse">
              Novo produto
            </Link>
          </>
        }
      />
      <ProductsTable rows={result.data} meta={result.meta} query={query} />
    </div>
  );
}
