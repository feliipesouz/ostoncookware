import { HomepageEditor } from "@/components/admin/homepage-editor";
import { adminGet } from "@/lib/admin";
import type { HomepageSection } from "@oston/contracts";
import { defaultHomepageSections } from "@/lib/cms-defaults";

export default async function HomepageAdminPage() {
  let data = { sections: defaultHomepageSections, version: 1 };
  try {
    const payload = await adminGet<{ data: { sections: HomepageSection[]; version: number } }>(
      "/v1/admin/homepage",
    );
    data = payload.data;
  } catch {
    // schema ainda pendente — editor abre com o default
  }

  return (
    <div>
      <h1 className="text-3xl">Homepage</h1>
      <p className="mt-2 text-sm text-foreground-muted">
        Conteúdo estruturado da vitrine. Não é um construtor de páginas.
      </p>
      <div className="mt-8">
        <HomepageEditor initial={data} />
      </div>
    </div>
  );
}
