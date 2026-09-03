import { ProductForm } from "@/components/admin/product-form";
import { PageHeader } from "@/components/admin/ui/page-header";
import { adminGet } from "@/lib/admin";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data } = await adminGet<{ data: Record<string, unknown> & { name?: string } }>(`/v1/admin/products/${id}`);
  const name = String(data.name ?? "Produto");

  return (
    <div>
      <PageHeader
        title={name}
        description="Edite, salve rascunho e publique sem sair desta tela."
        breadcrumbs={[{ href: "/admin/produtos", label: "Produtos" }, { label: name }, { label: "Editar" }]}
      />
      <div className="mt-8">
        <ProductForm id={id} initial={data} />
      </div>
    </div>
  );
}
