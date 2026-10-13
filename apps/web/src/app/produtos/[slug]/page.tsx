import { ArrowUpRightIcon } from "@/components/site/icons";
import { ProductPrice } from "@/components/site/product-price";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicChrome } from "@/components/site/public-chrome";
import { ProductGallery } from "@/components/site/product-gallery";
import { RelatedCollections } from "@/components/site/related-collections";
import { consultationUrl } from "@/lib/consultation";
import { ApiError } from "@/lib/api";
import { availabilityLabel, productImages } from "@/lib/catalog";
import {
  getCollections,
  getProduct,
  getPublicSiteSafe,
  isDraftEnabled,
  type Product,
} from "@/lib/content";
import {
  absoluteUrl,
  breadcrumbData,
  canonicalPath,
  jsonLd,
  productData,
  siteMetadata,
} from "@/lib/seo";

export const revalidate = 60;

async function loadProduct(slug: string) {
  try {
    return await getProduct(slug);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const [site, product, draft] = await Promise.all([
    getPublicSiteSafe(),
    loadProduct(slug),
    isDraftEnabled(),
  ]);
  if (!product) return { title: "Produto não encontrado", robots: { index: false, follow: false } };
  return siteMetadata(site.settings, {
    title: product.seoTitle ?? product.name,
    description: product.seoDescription ?? product.shortDescription ?? undefined,
    path: canonicalPath(product.canonicalPath, "/produtos/" + slug),
    image: product.ogImage?.url ?? product.coverImage?.url,
    noindex: draft || product.isDemo,
  });
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [site, product, collections, draft] = await Promise.all([
    getPublicSiteSafe(),
    loadProduct(slug),
    getCollections().catch(() => []),
    isDraftEnabled(),
  ]);
  if (!product) notFound();
  const { settings } = site;
  const whatsapp = consultationUrl(
    settings.whatsapp,
    "Olá! Vim pelo site da OSTON e tenho interesse em " +
      product.name +
      ". Gostaria de conhecer as condições e a disponibilidade. " +
      absoluteUrl("/produtos/" + product.slug),
  );
  const specs = productSpecifications(product);
  const details = product.details;
  const otherCollections = collections
    .filter((collection) => collection.id !== product.collectionId)
    .slice(0, 5);
  const breadcrumbItems = [
    { name: "Início", path: "/" },
    { name: "Coleções", path: "/colecoes" },
    { name: product.name, path: "/produtos/" + product.slug },
  ];
  const offer = productData(product, settings);

  return (
    <>
      {!draft && !product.isDemo ? (
        <>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbData(breadcrumbItems)) }}
          />
          {offer ? (
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{ __html: jsonLd(offer) }}
            />
          ) : null}
        </>
      ) : null}
      <PublicChrome
        settings={settings}
        navigation={site.navigation}
        announcement={site.announcement}
      >
        <main className="pb-24 md:pb-32">
          <nav
            aria-label="Caminho de navegação"
            className="site-grid py-7 text-xs text-foreground-muted"
          >
            <ol className="flex flex-wrap items-center gap-x-3 gap-y-2">
              {breadcrumbItems.map((item, index) => (
                <li key={item.path} className="flex items-center gap-3">
                  {index > 0 ? <span aria-hidden="true">/</span> : null}
                  {index === breadcrumbItems.length - 1 ? (
                    <span aria-current="page" className="text-foreground">
                      {item.name}
                    </span>
                  ) : (
                    <Link href={item.path}>{item.name}</Link>
                  )}
                </li>
              ))}
            </ol>
          </nav>
          <div className="site-grid grid items-start gap-10 md:grid-cols-[1.08fr_1fr] md:gap-14 xl:gap-20">
            <ProductGallery
              images={productImages(product)}
              name={product.name}
              demo={product.isDemo}
            />
            <div className="md:sticky md:top-[calc(var(--header-height)+1.5rem)]">
              <p className="eyebrow">
                {product.isDemo
                  ? "Produto demonstrativo"
                  : (product.collectionName ?? "OSTON Cookware")}
              </p>
              <h1 className="font-display mt-4 text-4xl leading-[1.04] md:text-5xl xl:text-6xl" data-editorial-reveal>
                {product.name}
              </h1>
              {product.shortDescription ? (
                <p className="editorial-copy mt-5">{product.shortDescription}</p>
              ) : null}
              {details?.materials.length ? (
                <p className="mt-5 text-sm text-foreground-muted">
                  {details.materials.join(" · ")}
                </p>
              ) : null}
              <div className="mt-8 border-y border-border py-6">
                <ProductPrice product={product} />
                <p className="mt-2 text-xs leading-6 text-foreground-muted">
                  {product.isDemo
                    ? "Apresentação demonstrativa. Consulte o catálogo oficial."
                    : availabilityLabel(product.availability)}
                </p>
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <a
                    href={whatsapp}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="button-primary"
                  >
                    Falar com consultor <ArrowUpRightIcon className="h-4 w-4 shrink-0" />
                  </a>
                  <Link href="/colecoes" className="button-secondary">
                    Comparar as cores
                  </Link>
                </div>
                <p className="mt-4 text-xs leading-6 text-foreground-muted">
                  Nossa equipe ajuda você a conhecer o conjunto e os próximos passos da sua escolha.
                </p>
              </div>
              {details?.compatibilities.length ? (
                <div className="mt-6">
                  <p className="text-xs font-semibold">Compatibilidade</p>
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {details.compatibilities.map((item) => (
                      <li key={item} className="border border-border px-3 py-2 text-xs">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {product.features.length ? (
                <ul className="mt-6 space-y-3">
                  {product.features.map((feature, index) => (
                    <li key={index} className="flex gap-3 text-sm leading-7">
                      <span aria-hidden="true" className="text-brand">
                        —
                      </span>
                      {feature}
                    </li>
                  ))}
                </ul>
              ) : null}
              {product.sku ? (
                <p className="mt-7 text-[0.65rem] tracking-[0.14em] uppercase text-foreground-muted">
                  Referência {product.sku}
                </p>
              ) : null}
            </div>
          </div>
          <section
            className="site-grid mt-16 grid gap-10 border-t border-border pt-12 md:mt-24 md:grid-cols-[0.8fr_1.2fr] md:gap-20"
            aria-labelledby="product-details-heading"
          >
            <div>
              <p className="eyebrow">Conheça de perto</p>
              <h2 id="product-details-heading" className="font-display mt-4 text-4xl md:text-5xl" data-editorial-reveal>
                Cada detalhe
                <br />
                <span className="italic">da sua escolha.</span>
              </h2>
              {product.description ? (
                <p className="mt-6 text-sm leading-8 whitespace-pre-line text-foreground-muted">
                  {product.description}
                </p>
              ) : null}
              <a
                href={whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="button-link mt-7"
              >
                Tire suas dúvidas com a OSTON <ArrowUpRightIcon className="h-4 w-4 shrink-0" />
              </a>
            </div>
            <div>
              {product.itemsIncluded.length ? (
                <DetailPanel title="O que acompanha o conjunto" open>
                  <ul className="grid gap-3 sm:grid-cols-2">
                    {product.itemsIncluded.map((item, index) => (
                      <li key={index} className="flex gap-3 text-sm leading-7">
                        <span aria-hidden="true" className="text-brand">
                          —
                        </span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </DetailPanel>
              ) : null}
              {specs.length ? (
                <DetailPanel title="Especificações" open>
                  <dl>
                    {specs.map((spec, index) => (
                      <div
                        key={index}
                        className="grid grid-cols-2 gap-6 border-b border-border py-3 text-sm last:border-0"
                      >
                        <dt className="text-foreground-muted">{spec.label}</dt>
                        <dd>{spec.value}</dd>
                      </div>
                    ))}
                  </dl>
                </DetailPanel>
              ) : null}
              {details?.care.length ? (
                <DetailPanel title="Cuidados com o seu conjunto">
                  <ul className="space-y-3">
                    {details.care.map((item, index) => (
                      <li key={index} className="text-sm leading-7">
                        {item}
                      </li>
                    ))}
                  </ul>
                </DetailPanel>
              ) : null}
            </div>
          </section>
          <RelatedCollections collections={otherCollections} />
        </main>
      </PublicChrome>
    </>
  );
}

function DetailPanel({
  title,
  children,
  open = false,
}: {
  title: string;
  children: React.ReactNode;
  open?: boolean;
}) {
  return (
    <details open={open} className="group border-b border-border">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-5 py-6 text-sm font-semibold [&::-webkit-details-marker]:hidden">
        {title}
        <span
          aria-hidden="true"
          className="text-lg font-normal transition-transform group-open:rotate-45"
        >
          +
        </span>
      </summary>
      <div className="pb-7">{children}</div>
    </details>
  );
}

function productSpecifications(product: Product) {
  const specifications = [...product.specifications];
  const dimensions = product.details?.dimensions;
  if (!dimensions) return specifications;
  const labels: [keyof typeof dimensions, string, string][] = [
    ["diameterCm", "Diâmetro", "cm"],
    ["heightCm", "Altura", "cm"],
    ["widthCm", "Largura", "cm"],
    ["lengthCm", "Comprimento", "cm"],
    ["capacityL", "Capacidade", "L"],
    ["weightKg", "Peso", "kg"],
  ];
  for (const [key, label, unit] of labels) {
    const value = dimensions[key];
    if (value !== undefined)
      specifications.push({ label, value: value.toLocaleString("pt-BR") + " " + unit });
  }
  return specifications;
}
