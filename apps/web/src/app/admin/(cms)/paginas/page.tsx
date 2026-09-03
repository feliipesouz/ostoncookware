import Link from "next/link";
import { adminGet } from "@/lib/admin";

type PageRow = { id: string; title: string; slug: string; status: string };

export default async function PagesAdminPage() {
  let data: PageRow[] = [];
  try {
    const payload = await adminGet<{ data: PageRow[] }>("/v1/admin/pages");
    data = payload.data ?? [];
  } catch {
    data = [];
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl">Páginas</h1>
          <p className="mt-2 text-sm text-foreground-muted">Páginas institucionais, começando por A marca.</p>
        </div>
        <Link href="/admin/paginas/nova" className="bg-foreground px-4 py-2 text-sm text-foreground-inverse">
          Nova página
        </Link>
      </div>
      <table className="mt-8 w-full text-left text-sm">
        <thead className="text-foreground-muted">
          <tr>
            <th className="py-3">Título</th>
            <th>Slug</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {data.map((page) => (
            <tr key={page.id} className="border-t border-border">
              <td className="py-3">
                <Link href={`/admin/paginas/${page.id}`} className="underline">
                  {page.title}
                </Link>
              </td>
              <td>/{page.slug}</td>
              <td>{page.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
