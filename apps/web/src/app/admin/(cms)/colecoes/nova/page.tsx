import { CollectionForm } from "@/components/admin/collection-form";
import { PageHeader } from "@/components/admin/ui/page-header";

export default function NewCollectionPage() {
  return (
    <div>
      <PageHeader title="Nova coleção" breadcrumbs={[{ href: "/admin/colecoes", label: "Coleções" }, { label: "Nova" }]} />
      <div className="mt-8">
        <CollectionForm />
      </div>
    </div>
  );
}
