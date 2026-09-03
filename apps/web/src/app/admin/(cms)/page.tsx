import Link from "next/link";
import { cookies } from "next/headers";
import { PageHeader } from "@/components/admin/ui/page-header";
import { StatusBadge } from "@/components/admin/ui/status-badge";
import { formatRelativeDay } from "@/lib/admin-format";

async function loadDashboard() {
  const api = process.env.API_URL ?? "http://localhost:4000";
  const response = await fetch(`${api}/v1/admin/dashboard`, {
    headers: { cookie: (await cookies()).toString() },
    cache: "no-store",
  });
  if (!response.ok) {
    return null;
  }
  return response.json() as Promise<{
    data: {
      collections?: number;
      products?: number;
      campaigns?: number;
      leads?: number;
      leadsLast30?: number;
      leadsPrev30?: number;
      delta?: number;
      leadsNew?: number;
      leadsQualified?: number;
      leadsWon?: number;
      bySource?: { source: string; count: number }[];
      byUtmCampaign?: { utmCampaign: string; count: number }[];
      collectionsInterest?: { collectionId: string | null; name: string; count: number }[];
      mediaMissingAlt?: number;
      published?: { products: number; collections: number; campaigns: number };
      draft?: { products: number; collections: number; campaigns: number };
      onboarding?: {
        hasContact: boolean;
        hasLogo: boolean;
        hasCollection: boolean;
        hasPublishedCampaign: boolean;
        hasSeo: boolean;
      };
      recentLeads: { id: string; name: string; status: string; createdAt: string }[];
      recentAudit: {
        id: string;
        action: string;
        entity: string;
        actorEmail: string | null;
        createdAt: string;
        humanMessage?: string;
      }[];
    };
  }>;
}

export default async function DashboardPage() {
  const payload = await loadDashboard();
  const data = payload?.data;
  const drafts = (data?.draft?.products ?? 0) + (data?.draft?.collections ?? 0) + (data?.draft?.campaigns ?? 0);
  const onboarding = data?.onboarding;
  const pendingOnboarding = onboarding
    ? [
        !onboarding.hasContact ? "Informar WhatsApp, telefone ou e-mail" : null,
        !onboarding.hasLogo ? "Enviar o logo da marca" : null,
        !onboarding.hasCollection ? "Criar a primeira coleção" : null,
        !onboarding.hasPublishedCampaign ? "Publicar uma campanha para o hero" : null,
        !onboarding.hasSeo ? "Completar SEO padrão" : null,
      ].filter((item): item is string => Boolean(item))
    : [];

  return (
    <div>
      <PageHeader
        title="Hoje na OSTON"
        description="O que precisa de atenção editorial e comercial — não um painel de vaidade."
        actions={
          <>
            <Link href="/admin/produtos/novo" className="border border-border px-4 py-2 text-sm">
              Novo produto
            </Link>
            <Link href="/admin/campanhas/nova" className="bg-foreground px-4 py-2 text-sm text-foreground-inverse">
              Nova campanha
            </Link>
          </>
        }
      />

      {pendingOnboarding.length > 0 ? (
        <section className="mt-8 border border-border bg-surface p-5">
          <h2 className="text-lg">Para o site ficar no ar de verdade</h2>
          <ul className="mt-3 grid gap-2 text-sm">
            {pendingOnboarding.map((item) => (
              <li key={item}>· {item}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card label="Rascunhos na fila" value={drafts} href="/admin/produtos?status=DRAFT" hint="Produtos, coleções e campanhas" />
        <Card label="Leads novos" value={data?.leadsNew ?? 0} href="/admin/leads?status=NEW" hint="Aguardando o primeiro contato" />
        <Card label="Imagens sem ALT" value={data?.mediaMissingAlt ?? 0} href="/admin/midia" hint="Acessibilidade e compartilhamento" />
        <Card
          label="Leads em 30 dias"
          value={data?.leadsLast30 ?? data?.leads ?? 0}
          href="/admin/leads"
          hint={deltaHint(data?.delta ?? 0)}
        />
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card label="Qualificados" value={data?.leadsQualified ?? 0} href="/admin/leads?status=QUALIFIED" />
        <Card label="Ganhos" value={data?.leadsWon ?? 0} href="/admin/leads?status=WON" />
        <Card label="Publicados" value={(data?.published?.products ?? 0) + (data?.published?.collections ?? 0) + (data?.published?.campaigns ?? 0)} href="/admin/produtos" hint={`${data?.published?.products ?? 0} produtos · ${data?.published?.collections ?? 0} coleções`} />
        <Card label="Rascunhos" value={data?.draft?.products ?? 0} href="/admin/produtos?status=DRAFT" hint="Produtos em draft" />
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-3">
        <Breakdown title="Origem" rows={(data?.bySource ?? []).map((row) => ({ label: row.source, count: row.count }))} />
        <Breakdown title="Campanhas UTM" rows={(data?.byUtmCampaign ?? []).map((row) => ({ label: row.utmCampaign, count: row.count }))} />
        <Breakdown title="Interesse por coleção" rows={(data?.collectionsInterest ?? []).map((row) => ({ label: row.name, count: row.count }))} />
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <section>
          <div className="flex items-center justify-between">
            <h2 className="text-lg">Leads recentes</h2>
            <Link href="/admin/leads" className="text-xs underline">
              Abrir fila
            </Link>
          </div>
          <ul className="mt-4 divide-y divide-border">
            {(data?.recentLeads ?? []).length === 0 ? (
              <li className="py-6 text-sm text-foreground-muted">Nenhum lead ainda. O formulário de contato alimenta esta fila.</li>
            ) : (
              data?.recentLeads.map((lead) => (
                <li key={lead.id} className="flex items-center justify-between py-3 text-sm">
                  <Link href={`/admin/leads/${lead.id}`} className="underline">
                    {lead.name}
                  </Link>
                  <StatusBadge status={lead.status} />
                </li>
              ))
            )}
          </ul>
        </section>
        <section>
          <div className="flex items-center justify-between">
            <h2 className="text-lg">Últimas alterações</h2>
            <Link href="/admin/auditoria" className="text-xs underline">
              Auditoria
            </Link>
          </div>
          <ul className="mt-4 divide-y divide-border">
            {(data?.recentAudit ?? []).length === 0 ? (
              <li className="py-6 text-sm text-foreground-muted">Nenhuma alteração registrada hoje.</li>
            ) : (
              data?.recentAudit.map((item) => (
                <li key={item.id} className="py-3 text-sm">
                  {item.humanMessage ?? `${item.action} · ${item.entity}`}
                  <span className="block text-xs text-foreground-muted">{formatRelativeDay(item.createdAt)}</span>
                </li>
              ))
            )}
          </ul>
        </section>
      </div>
    </div>
  );
}

function deltaHint(delta: number) {
  if (delta === 0) return "igual aos 30 dias anteriores";
  return delta > 0 ? `+${delta} vs período anterior` : `${delta} vs período anterior`;
}

function Breakdown({ title, rows }: { title: string; rows: { label: string; count: number }[] }) {
  return (
    <section>
      <h2 className="text-lg">{title}</h2>
      <ul className="mt-4 divide-y divide-border text-sm">
        {rows.length === 0 ? (
          <li className="py-6 text-foreground-muted">Sem dados no período.</li>
        ) : (
          rows.map((row) => (
            <li key={row.label} className="flex justify-between py-3">
              <span>{row.label || "—"}</span>
              <span>{row.count}</span>
            </li>
          ))
        )}
      </ul>
    </section>
  );
}

function Card({ label, value, href, hint }: { label: string; value: number; href: string; hint?: string }) {
  return (
    <Link href={href} className="border border-border bg-surface p-5">
      <p className="text-xs tracking-[0.2em] uppercase text-foreground-muted">{label}</p>
      <p className="mt-3 text-4xl">{value}</p>
      {hint ? <p className="mt-2 text-xs text-foreground-muted">{hint}</p> : null}
    </Link>
  );
}
