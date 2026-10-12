import type { Product } from "@/lib/content";
import { formatCatalogPrice, productPricing } from "@/lib/catalog";

export function ProductPrice({ product, compact = false }: {
  product: Pick<Product, "price" | "salePrice" | "isDemo">;
  compact?: boolean;
}) {
  const pricing = productPricing(product);
  if (!pricing) {
    return <p className={compact ? "text-sm" : "font-display text-3xl"}>{product.isDemo ? "Conteúdo demonstrativo" : "Sob consulta"}</p>;
  }
  return (
    <div className="grid gap-2" aria-label="Preço do produto">
      {pricing.promotional ? (
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-sm text-foreground-muted"><span className="sr-only">Preço normal: </span><s>{formatCatalogPrice(pricing.regular)}</s></p>
          {pricing.discountPercent > 0 ? <span className="bg-brand/10 px-2 py-1 text-xs font-semibold text-brand">{pricing.discountPercent}% de desconto</span> : null}
        </div>
      ) : null}
      <p className={compact ? "text-xl font-semibold" : "font-display text-4xl"}>
        <span className="sr-only">{pricing.promotional ? "Preço promocional: " : "Preço: "}</span>
        {formatCatalogPrice(pricing.current)}
      </p>
      {pricing.promotional ? <p className="text-xs text-foreground-muted">Economize {formatCatalogPrice(pricing.savings)}</p> : null}
    </div>
  );
}
