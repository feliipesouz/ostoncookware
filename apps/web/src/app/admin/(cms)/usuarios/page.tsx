import { UsersTable } from "@/components/admin/users-table";
import { PageHeader } from "@/components/admin/ui/page-header";
import { adminGet } from "@/lib/admin";
import { cookies } from "next/headers";

async function getRole() {
  const api = process.env.API_URL ?? "http://localhost:4000";
  const response = await fetch(`${api}/v1/admin/me`, {
    headers: { cookie: (await cookies()).toString() },
    cache: "no-store",
  });
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
        description="Não há cadastro público. O primeiro OWNER é criado com pnpm admin:create. A API não promove ninguém a OWNER."
        breadcrumbs={[{ href: "/admin", label: "CMS" }, { label: "Usuários" }]}
      />
      <UsersTable initial={data} canWrite={role === "OWNER"} />
    </div>
  );
}
