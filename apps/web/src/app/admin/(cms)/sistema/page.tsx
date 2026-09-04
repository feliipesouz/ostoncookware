import { redirect } from "next/navigation";
import { PageHeader } from "@/components/admin/ui/page-header";
import { adminFetch } from "@/lib/admin";

async function getMe() {
  const response = await adminFetch("/v1/admin/me");
  if (!response.ok) return null;
  return response.json() as Promise<{ role?: string }>;
}

export default async function SystemPage() {
  const me = await getMe();
  if (me?.role !== "OWNER") {
    redirect("/admin");
  }

  const response = await adminFetch("/v1/admin/system");
  const data = response.ok
    ? ((await response.json()) as {
        api: string;
        database: string;
        blobConfigured: boolean;
        environment: string;
        vercelEnv: string | null;
      })
    : null;

  return (
    <div>
      <PageHeader
        title="Sistema"
        description="Saúde da operação. Sem segredos — só o que o OWNER precisa ver para saber se o CMS está no ar."
        breadcrumbs={[{ href: "/admin", label: "CMS" }, { label: "Sistema" }]}
      />
      <dl className="mt-8 grid max-w-xl gap-4 border border-border bg-surface p-6 text-sm">
        <div className="flex justify-between">
          <dt>API</dt>
          <dd>{data?.api ?? "indisponível"}</dd>
        </div>
        <div className="flex justify-between">
          <dt>Banco</dt>
          <dd>{data?.database ?? "indisponível"}</dd>
        </div>
        <div className="flex justify-between">
          <dt>Vercel Blob</dt>
          <dd>{data?.blobConfigured ? "configurado" : "ausente"}</dd>
        </div>
        <div className="flex justify-between">
          <dt>Ambiente</dt>
          <dd>{data?.environment ?? process.env.NODE_ENV}</dd>
        </div>
      </dl>
    </div>
  );
}
