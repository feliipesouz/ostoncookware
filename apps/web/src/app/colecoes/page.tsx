import type { Metadata } from "next";
import Link from "next/link";
import { CollectionExplorer } from "@/components/site/catalogue-browser";
import { CatalogDownload } from "@/components/site/catalog-download";
import { PublicChrome } from "@/components/site/public-chrome";
import { mediaSrc } from "@/lib/api";
import { getCollections, getPublicSiteSafe, isDraftEnabled } from "@/lib/content";
import { absoluteUrl, jsonLd, siteMetadata } from "@/lib/seo";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const [site, collections, draft] = await Promise.all([
    getPublicSiteSafe(), getCollections().catch(() => null), isDraftEnabled(),
  ]);
  return siteMetadata(site.settings, {
    title: "Coleções de panelas",
    description: "Explore as coleções de panelas OSTON, conheça os conjuntos e encontre a cor que combina com a sua cozinha. Consulte nossa equipe.",
    path: "/colecoes",
    noindex: draft || !collections?.length || collections.every((collection) => collection.isDemo),
  });
}

export default async function CollectionsPage() {
  const [site, result, draft] = await Promise.all([
    getPublicSiteSafe(), getCollections().catch(() => null), isDraftEnabled(),
  ]);
  const collections = result ?? [];
  const published = collections.filter((collection) => !collection.isDemo);
  const listLd = jsonLd({
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Coleções de panelas " + site.settings.brandName,
    itemListElement: published.map((collection, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: collection.name,
      url: absoluteUrl("/colecoes/" + collection.slug),
    })),
  });

  return (
    <>
      {!draft && published.length > 0 ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: listLd }} /> : null}
      <PublicChrome settings={site.settings} navigation={site.navigation} announcement={site.announcement}>
        <main className="bg-background pb-24 md:pb-32">
          <div className="site-grid grid gap-8 pt-12 pb-14 md:grid-cols-12 md:pt-20 md:pb-20">
            <div className="md:col-span-8">
              <p className="eyebrow">O universo OSTON</p>
              <h1 className="display-title mt-5">Encontre a sua<br /><span className="italic text-brand">assinatura.</span></h1>
            </div>
            <div className="md:col-span-4 md:self-end">
              <p className="editorial-copy max-w-md">Uma escolha que começa pelo olhar. Explore as cores, conheça os conjuntos e imagine a OSTON na sua cozinha.</p>
              {site.settings.catalogPdf ? (
                <CatalogDownload href={mediaSrc(site.settings.catalogPdf.url)} className="button-link mt-6">Consultar catálogo completo <span aria-hidden="true">↗</span></CatalogDownload>
              ) : <Link href="/contato" className="button-link mt-6">Conte com nossa equipe <span aria-hidden="true">↗</span></Link>}
            </div>
          </div>
          <div className="site-grid">
            {collections.length ? <CollectionExplorer collections={collections} /> : (
              <div className="border-y border-border py-16">
                <h2 className="font-display text-3xl">{result === null ? "O catálogo está temporariamente indisponível." : "As próximas escolhas começam aqui."}</h2>
                <p className="mt-4 max-w-lg text-sm leading-7 text-foreground-muted">{result === null ? "Você pode tentar novamente em instantes ou falar com nossa equipe." : "Converse com nossa equipe para conhecer os conjuntos OSTON."}</p>
                <Link href="/contato" className="button-primary mt-6">Falar com a OSTON <span aria-hidden="true">↗</span></Link>
              </div>
            )}
          </div>
          <div className="site-grid mt-20 flex flex-col gap-6 border-t border-border pt-10 md:flex-row md:items-center md:justify-between">
            <div><p className="eyebrow">Uma escolha com atenção</p><h2 className="font-display mt-3 text-3xl md:text-4xl">Vamos encontrar a sua OSTON?</h2></div>
            <Link href="/contato" className="button-secondary">Falar com um consultor <span aria-hidden="true">↗</span></Link>
          </div>
        </main>
      </PublicChrome>
    </>
  );
}
