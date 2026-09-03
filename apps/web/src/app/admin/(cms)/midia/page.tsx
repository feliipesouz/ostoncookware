import { MediaLibrary } from "@/components/admin/media-library";
import { PageHeader } from "@/components/admin/ui/page-header";
import { adminGet } from "@/lib/admin";

export default async function MediaPage() {
  const { data } = await adminGet<{ data: Parameters<typeof MediaLibrary>[0]["initial"] }>("/v1/admin/media?pageSize=50");
  return (
    <div>
      <PageHeader
        title="Mídia"
        description="Imagens da campanha, coleções e produtos. Preencha o ALT — o painel de SEO avisa quando falta."
        breadcrumbs={[{ href: "/admin", label: "CMS" }, { label: "Mídia" }]}
      />
      <MediaLibrary initial={data} />
    </div>
  );
}
