import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicChrome } from "@/components/site/public-chrome";
import { SiteImage } from "@/components/site/site-image";
import { mediaSrc, whatsappLink } from "@/lib/api";
import { consultantMessage, getProduct, getPublicSiteSafe, isDraftEnabled } from "@/lib/content";
import { jsonLd, siteMetadata } from "@/lib/seo";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const [{ settings }, product] = await Promise.all([
    getPublicSiteSafe(),
    getProduct(slug).catch(() => null),
  ]);
  if (!product) {
    return { title: "Produto" };
  }
  return siteMetadata(settings, {
    title: product.seoTitle ?? product.name,
    description: product.seoDescription ?? product.shortDescription ?? undefined,
    path: `/produtos/${slug}`,
    image: product.coverImage?.url,
  });
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [site, product, draft] = await Promise.all([
    getPublicSiteSafe(),
    getProduct(slug).catch(() => null),
    isDraftEnabled(),
  ]);
  if (!product) {
    notFound();
  }
  const { settings } = site;

  const breadcrumb = jsonLd({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home" },
      { "@type": "ListItem", position: 2, name: "Coleções", item: `${process.env.NEXT_PUBLIC_SITE_URL}/colecoes` },
      {
        "@type": "ListItem",
        position: 3,
        name: product.collectionName,
        item: `${process.env.NEXT_PUBLIC_SITE_URL}/colecoes/${product.collectionSlug}`,
      },
      { "@type": "ListItem", position: 4, name: product.name },
    ],
  });

  return (
    <>
      {!draft ? (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: breadcrumb }} />
      ) : null}
      <PublicChrome settings={settings} navigation={site.navigation} announcement={site.announcement}>
      <main className="site-grid grid gap-12 py-16 md:grid-cols-2 md:py-24">
        <div className="relative aspect-[4/5] overflow-hidden bg-surface">
          {product.coverImage ? (
            <SiteImage
              src={mediaSrc(product.coverImage.url)}
              alt={product.coverImage.alt ?? product.name}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
          ) : null}
        </div>
        <div>
          {product.isDemo ? (
            <p className="text-[0.7rem] tracking-[0.42em] uppercase text-brand">Produto DEMO</p>
          ) : null}
          <p className="mt-3 text-sm text-foreground-muted">{product.collectionName}</p>
          <h1 className="font-display mt-2 text-4xl md:text-6xl">{product.name}</h1>
          <p className="mt-6 text-base leading-8 text-foreground-muted">{product.description}</p>
          {product.features.length > 0 ? (
            <ul className="mt-8 space-y-2 text-sm">
              {product.features.map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>
          ) : null}
          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href={whatsappLink(
                settings.whatsapp,
                consultantMessage(settings, `Olá, gostaria de saber mais sobre ${product.name}.`),
              )}
              className="bg-brand px-6 py-3 text-[0.7rem] tracking-[0.28em] uppercase text-brand-foreground"
            >
              WhatsApp
            </Link>
            <Link href="/contato" className="border border-foreground px-6 py-3 text-[0.7rem] tracking-[0.28em] uppercase">
              Falar com consultor
            </Link>
          </div>
        </div>
      </main>
      </PublicChrome>
    </>
  );
}
