import { NavigationForm } from "@/components/admin/navigation-form";
import { PageHeader } from "@/components/admin/ui/page-header";
import { adminGetOptional } from "@/lib/admin";

export default async function NavigationPage() {
  const [header, footer] = await Promise.all([
    adminGetOptional<{ data: { items?: unknown } }>("/v1/admin/navigation/header"),
    adminGetOptional<{ data: { items?: unknown } }>("/v1/admin/navigation/footer"),
  ]);

  return (
    <div>
      <PageHeader
        title="Navegação"
        description="Links do header e do rodapé. URLs internas começam com barra."
        breadcrumbs={[{ href: "/admin", label: "CMS" }, { label: "Navegação" }]}
      />
      <div className="mt-8">
        <NavigationForm headerItems={header?.data.items} footerItems={footer?.data.items} />
      </div>
    </div>
  );
}
