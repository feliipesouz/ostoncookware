import { CollectionForm } from "@/components/admin/collection-form";
import { PageHeader } from "@/components/admin/ui/page-header";
import { adminGet } from "@/lib/admin";

export default async function EditCollectionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data } = await adminGet<{ data: Record<string, unknown> & { name?: string } }>(`/v1/admin/collections/${id}`);
  const name = String(data.name ?? "Coleção");

  return (
    <div>
      <PageHeader
        title={name}
        breadcrumbs={[{ href: "/admin/colecoes", label: "Coleções" }, { label: name }, { label: "Editar" }]}
      />
      <div className="mt-8">
        <CollectionForm id={id} initial={data} />
      </div>
    </div>
  );
}
