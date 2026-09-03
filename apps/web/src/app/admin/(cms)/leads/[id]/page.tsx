import { PageHeader } from "@/components/admin/ui/page-header";
import { StatusBadge } from "@/components/admin/ui/status-badge";
import { adminGet } from "@/lib/admin";
import { formatDateTime } from "@/lib/admin-format";

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data } = await adminGet<{
    data: {
      name: string;
      phone: string;
      email: string | null;
      interest: string;
      collectionName: string | null;
      source: string | null;
      status: string;
      message: string | null;
      createdAt: string;
      notes?: { id: string; content: string; authorName?: string | null; createdAt: string }[];
      activities?: { id: string; message: string; createdAt: string }[];
    };
  }>(`/v1/admin/leads/${id}`);

  return (
    <div>
      <PageHeader
        title={data.name}
        breadcrumbs={[{ href: "/admin/leads", label: "Leads" }, { label: data.name }]}
      />
      <div className="mt-8 grid max-w-2xl gap-4 text-sm">
        <p>
          <StatusBadge status={data.status} />
        </p>
        <p>Telefone: {data.phone}</p>
        <p>E-mail: {data.email ?? "—"}</p>
        <p>Interesse: {data.interest}</p>
        <p>Coleção: {data.collectionName ?? "—"}</p>
        <p>Origem: {data.source ?? "—"}</p>
        <p>Chegou em {formatDateTime(data.createdAt)}</p>
        {data.message ? <p className="whitespace-pre-wrap">{data.message}</p> : null}
      </div>
    </div>
  );
}
