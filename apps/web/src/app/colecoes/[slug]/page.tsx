import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicChrome } from "@/components/site/public-chrome";
import { SiteImage } from "@/components/site/site-image";
import { mediaSrc, whatsappLink } from "@/lib/api";
import { consultantMessage, getCollectionPage, getCollections, getPublicSiteSafe, isDraftEnabled } from "@/lib/content";
import { jsonLd, siteMetadata } from "@/lib/seo";

export const revalidate = 60;

export async function generateStaticParams() {
  try {
    const collections = await getCollections();
    return collections.map((collection) => ({ slug: collection.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const [{ settings }, page] = await Promise.all([getPublicSiteSafe(), getCollectionPage(slug).catch(() => null)]);
  if (!page) {
    return { title: "Coleção" };
  }
  return siteMetadata(settings, {
    title: page.collection.seoTitle ?? page.collection.name,
    description: page.collection.seoDescription ?? page.collection.shortDescription ?? undefined,
    path: `/colecoes/${slug}`,
    image: page.collection.coverImage?.url,
  });
}

export default async function CollectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [site, page, draft] = await Promise.all([
    getPublicSiteSafe(),
    getCollectionPage(slug).catch(() => null),
    isDraftEnabled(),
  ]);
  if (!page) {
    notFound();
  }
  const { settings } = site;

  const { collection, products } = page;
  const breadcrumb = jsonLd({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: process.env.NEXT_PUBLIC_SITE_URL },
      { "@type": "ListItem", position: 2, name: "Coleções", item: `${process.env.NEXT_PUBLIC_SITE_URL}/colecoes` },
      { "@type": "ListItem", position: 3, name: collection.name },
    ],
  });

  return (
    <>
      {!draft ? (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: breadcrumb }} />
      ) : null}
      <PublicChrome settings={settings} navigation={site.navigation} announcement={site.announcement}>
      <main className="bg-background pb-24">
        <div className="relative min-h-[60vh] bg-graphite">
          {collection.coverImage ? (
            <SiteImage
              src={mediaSrc(collection.coverImage.url)}
              alt={collection.coverImage.alt ?? collection.name}
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
          ) : null}
          <div className="absolute inset-0 bg-[var(--overlay)]" />
          <div className="site-grid relative flex min-h-[60vh] items-end pb-16 text-foreground-inverse">
            <div>
              {collection.isDemo ? (
                <p className="text-[0.7rem] tracking-[0.42em] uppercase text-accent">DEMO</p>
              ) : null}
              <h1 className="font-display mt-3 text-5xl md:text-7xl">{collection.name}</h1>
            </div>
          </div>
        </div>
        <div className="site-grid grid gap-12 py-16 md:grid-cols-12">
          <p className="max-w-2xl text-lg leading-8 text-foreground-muted md:col-span-8">
            {collection.description}
          </p>
          <div className="md:col-span-4">
            <Link
              href={whatsappLink(
                settings.whatsapp,
                consultantMessage(settings, `Olá, gostaria de saber mais sobre a coleção ${collection.name}.`),
              )}
              className="inline-block bg-foreground px-6 py-3 text-[0.7rem] tracking-[0.28em] uppercase text-foreground-inverse"
            >
              Falar sobre esta coleção
            </Link>
          </div>
        </div>
        {products.length > 0 ? (
          <div className="site-grid grid gap-8 md:grid-cols-2">
            {products.map((product) => (
              <Link key={product.id} href={`/produtos/${product.slug}`} className="group">
                <div className="relative aspect-[4/5] overflow-hidden bg-surface">
                  {product.coverImage ? (
                    <SiteImage
                      src={mediaSrc(product.coverImage.url)}
                      alt={product.coverImage.alt ?? product.name}
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-cover"
                    />
                  ) : null}
                </div>
                <h2 className="font-display mt-4 text-2xl">{product.name}</h2>
                <p className="mt-2 text-sm text-foreground-muted">{product.shortDescription}</p>
              </Link>
            ))}
          </div>
        ) : null}
      </main>
      </PublicChrome>
    </>
  );
}
