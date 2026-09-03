import { AnnouncementForm } from "@/components/admin/announcement-form";
import { adminGet } from "@/lib/admin";

export default async function AnnouncementAdminPage() {
  let items: {
    id: string;
    message: string;
    ctaLabel: string | null;
    ctaUrl: string | null;
    active: boolean;
    startsAt: string | null;
    endsAt: string | null;
  }[] = [];
  try {
    const payload = await adminGet<{ data: typeof items }>("/v1/admin/announcements");
    items = payload.data ?? [];
  } catch {
    items = [];
  }

  return (
    <div>
      <h1 className="text-3xl">Anúncio</h1>
      <p className="mt-2 text-sm text-foreground-muted">
        Barra discreta no topo do site público. Só aparece se estiver ativa e dentro do intervalo.
      </p>
      <AnnouncementForm items={items} />
    </div>
  );
}
