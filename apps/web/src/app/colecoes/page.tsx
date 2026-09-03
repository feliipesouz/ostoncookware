import type { Metadata } from "next";
import Link from "next/link";
import { PublicChrome } from "@/components/site/public-chrome";
import { SiteImage } from "@/components/site/site-image";
import { mediaSrc } from "@/lib/api";
import { getCollections, getPublicSiteSafe, isDraftEnabled } from "@/lib/content";
import { jsonLd, siteMetadata } from "@/lib/seo";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const { settings } = await getPublicSiteSafe();
  return siteMetadata(settings, {
    title: "Coleções",
    description: "Coleções OSTON. Conteúdo demonstrativo até o catálogo oficial.",
    path: "/colecoes",
  });
}

export default async function CollectionsPage() {
  const [site, collections] = await Promise.all([
    getPublicSiteSafe(),
    getCollections().catch(() => []),
  ]);
  const draft = await isDraftEnabled();
  const listLd = jsonLd({
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: collections.map((collection, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: collection.name,
      url: `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/colecoes/${collection.slug}`,
    })),
  });

  return (
    <>
      {!draft ? (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: listLd }} />
      ) : null}
      <PublicChrome settings={site.settings} navigation={site.navigation} announcement={site.announcement}>
        <main className="bg-background pb-24">
          <div className="site-grid py-16 md:py-24">
            <p className="text-[0.7rem] tracking-[0.42em] uppercase text-brand">Catálogo</p>
            <h1 className="font-display mt-4 text-5xl md:text-7xl">Coleções</h1>
            <p className="mt-6 max-w-xl text-foreground-muted">
              Linhas demonstrativas para validar o espaço editorial. O catálogo oficial substitui estes
              dados no CMS.
            </p>
          </div>
          <div className="site-grid grid gap-10 md:grid-cols-2">
            {collections.map((collection) => (
              <Link key={collection.id} href={`/colecoes/${collection.slug}`} className="group">
                <div className="relative aspect-[4/5] overflow-hidden bg-graphite">
                  {collection.coverImage ? (
                    <SiteImage
                      src={mediaSrc(collection.coverImage.url)}
                      alt={collection.coverImage.alt ?? collection.name}
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                    />
                  ) : null}
                </div>
                <h2 className="font-display mt-5 text-3xl">{collection.name}</h2>
                <p className="mt-2 text-sm text-foreground-muted">{collection.shortDescription}</p>
              </Link>
            ))}
          </div>
        </main>
      </PublicChrome>
    </>
  );
}
