import { TrashView } from "@/components/admin/trash-view";
import { PageHeader } from "@/components/admin/ui/page-header";
import { adminGetOptional } from "@/lib/admin";

export default async function TrashPage() {
  const payload = await adminGetOptional<{
    data: { id: string; kind: "collection" | "product" | "campaign"; name: string; slug?: string | null; deletedAt?: string | null }[];
  }>("/v1/admin/trash");

  return (
    <div>
      <PageHeader
        title="Lixeira"
        description="Itens removidos do catálogo. Restaurar devolve como rascunho, sem republicar."
        breadcrumbs={[{ href: "/admin", label: "CMS" }, { label: "Lixeira" }]}
      />
      <TrashView items={payload?.data ?? []} />
    </div>
  );
}
