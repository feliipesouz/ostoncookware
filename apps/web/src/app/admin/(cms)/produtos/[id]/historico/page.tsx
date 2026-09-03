import { HistoryView } from "@/components/admin/history-view";
import { PageHeader } from "@/components/admin/ui/page-header";
import { adminGet } from "@/lib/admin";

export default async function ProductHistoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data } = await adminGet<{ data: { name?: string } }>(`/v1/admin/products/${id}`);
  const name = String(data.name ?? "Produto");

  return (
    <div>
      <PageHeader
        title={`Histórico · ${name}`}
        description="Cada restauração cria uma versão nova. Nada é apagado."
        breadcrumbs={[
          { href: "/admin/produtos", label: "Produtos" },
          { href: `/admin/produtos/${id}`, label: name },
          { label: "Histórico" },
        ]}
      />
      <HistoryView
        entityLabel="produto"
        entityName={name}
        versionsPath={`/v1/admin/products/${id}/revisions`}
        restorePath={(version) => `/v1/admin/products/${id}/revisions/${version.id ?? version.version}/restore`}
      />
    </div>
  );
}
