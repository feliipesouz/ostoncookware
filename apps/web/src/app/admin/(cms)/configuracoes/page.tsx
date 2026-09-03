import { SettingsForm } from "@/components/admin/settings-form";
import { PageHeader } from "@/components/admin/ui/page-header";
import { adminGet } from "@/lib/admin";

export default async function SettingsPage() {
  const { data } = await adminGet<{ data: Record<string, unknown> }>("/v1/admin/settings");
  return (
    <div>
      <PageHeader
        title="Configurações"
        description="Marca, contatos, SEO padrão, analytics e jurídico. Isso vale para o site inteiro."
        breadcrumbs={[{ href: "/admin", label: "CMS" }, { label: "Configurações" }]}
      />
      <SettingsForm initial={data} />
    </div>
  );
}
