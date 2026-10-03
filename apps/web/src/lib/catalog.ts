import type { Collection, Media, Product } from "./content";

// O catálogo público atende o mercado brasileiro. Não há conversão cambial.
export const CATALOG_CURRENCY = "BRL";

export function catalogPrice(value: string | null | undefined) {
  if (!value || !/^\d+(\.\d{1,2})?$/.test(value)) return null;
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
}

export function formatCatalogPrice(value: string | null | undefined) {
  const number = catalogPrice(value);
  return number === null
    ? null
    : new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: CATALOG_CURRENCY,
      }).format(number);
}

export function productImages(product: Pick<Product, "coverImage" | "images">): Media[] {
  const seen = new Set<string>();
  return [product.coverImage, ...product.images].filter((image): image is Media => {
    if (!image || seen.has(image.url)) return false;
    seen.add(image.url);
    return true;
  });
}

export function consultationPath(input: { productSlug?: string; collectionSlug?: string }) {
  const query = new URLSearchParams();
  if (input.productSlug) query.set("produto", input.productSlug);
  if (input.collectionSlug) query.set("colecao", input.collectionSlug);
  return "/contato" + (query.size ? "?" + query.toString() : "");
}

export function availabilityLabel(availability: string) {
  if (availability === "UNAVAILABLE") return "Indisponível no momento";
  if (availability === "COMING_SOON") return "Em breve";
  return "Consulte valores e disponibilidade";
}

export function normalizeCatalogSearch(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

export type ConsultationContext = {
  collectionId?: string;
  collectionName?: string;
  productName?: string;
  message: string;
  source: "contact-form" | "product-consultation" | "collection-consultation";
  path: string;
};

export function consultationContext(product: Product | null, collection: Collection | null): ConsultationContext {
  if (product) {
    return {
      collectionId: product.collectionId,
      collectionName: product.collectionName ?? collection?.name,
      productName: product.name,
      message: "Tenho interesse em " + product.name + ". Gostaria de conhecer as condições e a disponibilidade.",
      source: "product-consultation",
      path: "/produtos/" + product.slug,
    };
  }
  if (collection) {
    return {
      collectionId: collection.id,
      collectionName: collection.name,
      message: "Gostaria de saber mais sobre a coleção " + collection.name + ".",
      source: "collection-consultation",
      path: "/colecoes/" + collection.slug,
    };
  }
  return { message: "", source: "contact-form", path: "/contato" };
}
