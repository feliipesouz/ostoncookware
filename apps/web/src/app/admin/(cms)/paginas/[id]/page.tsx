import { PageForm } from "@/components/admin/page-form";
import { adminGet } from "@/lib/admin";

export default async function EditPageAdmin({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data } = await adminGet<{
    data: {
      slug: string;
      title: string;
      eyebrow: string | null;
      body: string;
      status: string;
      seoTitle: string | null;
      seoDescription: string | null;
    };
  }>(`/v1/admin/pages/${id}`);

  return (
    <div>
      <h1 className="mb-8 text-3xl">Editar página</h1>
      <PageForm id={id} initial={data} />
    </div>
  );
}
