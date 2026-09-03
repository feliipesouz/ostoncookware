import { ProductForm } from "@/components/admin/product-form";
import { PageHeader } from "@/components/admin/ui/page-header";

export default function NewProductPage() {
  return (
    <div>
      <PageHeader
        title="Novo produto"
        breadcrumbs={[{ href: "/admin/produtos", label: "Produtos" }, { label: "Novo" }]}
      />
      <div className="mt-8">
        <ProductForm />
      </div>
    </div>
  );
}
