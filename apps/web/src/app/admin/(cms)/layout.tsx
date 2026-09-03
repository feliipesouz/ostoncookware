import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AdminShell, type NavGroup } from "@/components/admin/admin-shell";

const navGroups: NavGroup[] = [
  {
    label: "Operação",
    items: [
      { href: "/admin", label: "Dashboard" },
      { href: "/admin/leads", label: "Leads" },
    ],
  },
  {
    label: "Catálogo",
    items: [
      { href: "/admin/campanhas", label: "Campanhas" },
      { href: "/admin/colecoes", label: "Coleções" },
      { href: "/admin/produtos", label: "Produtos" },
      { href: "/admin/midia", label: "Mídia" },
    ],
  },
  {
    label: "Site",
    items: [
      { href: "/admin/homepage", label: "Homepage" },
      { href: "/admin/anuncio", label: "Anúncio" },
      { href: "/admin/paginas", label: "Páginas" },
      { href: "/admin/navegacao", label: "Navegação" },
      { href: "/admin/redirects", label: "Redirects" },
      { href: "/admin/configuracoes", label: "Configurações" },
    ],
  },
  {
    label: "Administração",
    items: [
      { href: "/admin/usuarios", label: "Usuários" },
      { href: "/admin/auditoria", label: "Auditoria" },
      { href: "/admin/lixeira", label: "Lixeira" },
      { href: "/admin/sistema", label: "Sistema", roles: ["OWNER", "ADMIN"] },
    ],
  },
];

async function getMe() {
  const api = process.env.API_URL ?? "http://localhost:4000";
  const response = await fetch(`${api}/v1/admin/me`, {
    headers: { cookie: (await cookies()).toString() },
    cache: "no-store",
  });
  if (!response.ok) {
    return null;
  }
  return response.json() as Promise<{ name: string; email: string; role: string }>;
}

async function logout() {
  "use server";
  await fetch(`${process.env.API_URL ?? "http://localhost:4000"}/api/auth/sign-out`, {
    method: "POST",
    headers: { cookie: (await cookies()).toString() },
  });
  redirect("/admin/login");
}

export default async function CmsLayout({ children }: { children: React.ReactNode }) {
  const user = await getMe();
  if (!user) {
    redirect("/admin/login");
  }

  const vercelEnv = process.env.VERCEL_ENV;
  const isProduction = vercelEnv === "production" && process.env.NODE_ENV === "production";
  const environmentLabel =
    vercelEnv === "preview" ? "Staging" : isProduction ? "Production" : "Local";

  return (
    <AdminShell
      user={user}
      isProduction={isProduction}
      environmentLabel={environmentLabel}
      navGroups={navGroups}
      logoutAction={logout}
    >
      {children}
    </AdminShell>
  );
}
