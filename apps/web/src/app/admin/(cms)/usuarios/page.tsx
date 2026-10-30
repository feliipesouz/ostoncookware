import { UsersTable } from "@/components/admin/users-table";
import { PageHeader } from "@/components/admin/ui/page-header";
import { adminFetch, adminGet } from "@/lib/admin";

async function getRole() {
  const response = await adminFetch("/v1/admin/me");
  if (!response.ok) return null;
  const me = (await response.json()) as { role?: string };
  return me.role ?? null;
}

export default async function UsersPage() {
  const [{ data }, role] = await Promise.all([
    adminGet<{ data: { id: string; name: string; email: string; role: string }[] }>("/v1/admin/users").catch(
      () => ({ data: [] }),
    ),
    getRole(),
  ]);

  return (
    <div>
      <PageHeader
        title="Usuários"
        description="Gerencie as pessoas que acessam o painel e defina as permissões de cada uma."
        breadcrumbs={[{ href: "/admin", label: "CMS" }, { label: "Usuários" }]}
      />
      <UsersTable initial={data} canWrite={role === "OWNER"} />
    </div>
  );
}
