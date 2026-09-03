import Link from "next/link";
import { ProductImport } from "@/components/admin/product-import";

export default function ProductImportPage() {
  return (
    <div>
      <p className="text-sm text-foreground-muted">
        <Link href="/admin/produtos" className="underline">
          Produtos
        </Link>{" "}
        / Importar
      </p>
      <h1 className="mt-2 text-3xl">Importar produtos</h1>
      <p className="mt-2 text-sm text-foreground-muted">
        Colunas: sku, slug, name, collectionSlug, shortDescription, description, price, availability, status, featured,
        seoTitle, seoDescription.
      </p>
      <ProductImport />
    </div>
  );
}
