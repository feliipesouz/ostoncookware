const LABELS: Record<string, string> = {
  name: "nome",
  slug: "slug",
  title: "título",
  subtitle: "subtítulo",
  eyebrow: "antetítulo",
  description: "descrição",
  shortDescription: "descrição curta",
  status: "status",
  featured: "destaque",
  price: "preço",
  priceFrom: "preço a partir de",
  availability: "disponibilidade",
  collectionId: "coleção",
  imageIds: "imagens",
  galleryIds: "galeria",
  coverImageId: "imagem de capa",
  details: "detalhes",
  variants: "variantes",
  specifications: "especificações",
  features: "características",
  itemsIncluded: "itens inclusos",
  seoTitle: "título SEO",
  seoDescription: "descrição SEO",
  sections: "seções",
  body: "conteúdo",
  startsAt: "início",
  endsAt: "término",
  primaryCtaLabel: "CTA principal",
  primaryCtaUrl: "URL do CTA principal",
  secondaryCtaLabel: "CTA secundário",
  secondaryCtaUrl: "URL do CTA secundário",
};

export function humanChangeSummary(changedKeys: string[]) {
  if (changedKeys.length === 0) {
    return "Nenhuma alteração detectada.";
  }
  const labels = changedKeys.map((key) => LABELS[key] ?? key);
  if (labels.length === 1) {
    return `Alterou ${labels[0]}.`;
  }
  if (labels.length === 2) {
    return `Alterou ${labels[0]} e ${labels[1]}.`;
  }
  return `Alterou ${labels.slice(0, -1).join(", ")} e ${labels[labels.length - 1]}.`;
}
