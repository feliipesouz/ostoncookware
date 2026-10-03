import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicChrome } from "@/components/site/public-chrome";
import { ProductExplorer } from "@/components/site/catalogue-browser";
import { SiteImage } from "@/components/site/site-image";
import { ApiError, mediaSrc } from "@/lib/api";
import { consultationPath } from "@/lib/catalog";
import { getCollectionPage, getCollections, getPublicSiteSafe, isDraftEnabled } from "@/lib/content";
import { breadcrumbData, canonicalPath, jsonLd, siteMetadata } from "@/lib/seo";

export const revalidate = 60;

async function loadCollection(slug: string) {
  try {
    return await getCollectionPage(slug);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

export async function generateStaticParams() {
  const collections = await getCollections().catch(() => []);
  return collections.map((collection) => ({ slug: collection.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const [site, page, draft] = await Promise.all([getPublicSiteSafe(), loadCollection(slug), isDraftEnabled()]);
  if (!page) return { title: "Coleção não encontrada", robots: { index: false, follow: false } };
  return siteMetadata(site.settings, {
    title: page.collection.seoTitle ?? page.collection.name,
    description: page.collection.seoDescription ?? page.collection.shortDescription ?? undefined,
    path: canonicalPath(page.collection.canonicalPath, "/colecoes/" + slug),
    image: page.collection.ogImage?.url ?? page.collection.coverImage?.url,
    noindex: draft || page.collection.isDemo,
  });
}

export default async function CollectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [site, page, collections, draft] = await Promise.all([
    getPublicSiteSafe(), loadCollection(slug), getCollections().catch(() => []), isDraftEnabled(),
  ]);
  if (!page) notFound();
  const { collection, products } = page;
  const contact = consultationPath({ collectionSlug: collection.slug });
  const otherCollections = collections.filter((item) => item.id !== collection.id).slice(0, 5);
  const breadcrumb = jsonLd(breadcrumbData([
    { name: "Início", path: "/" },
    { name: "Coleções", path: "/colecoes" },
    { name: collection.name, path: "/colecoes/" + slug },
  ]));

  return (
    <>
      {!draft && !collection.isDemo ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: breadcrumb }} /> : null}
      <PublicChrome settings={site.settings} navigation={site.navigation} announcement={site.announcement}>
        <main className="bg-background pb-24 md:pb-32">
          <nav aria-label="Caminho de navegação" className="site-grid py-7 text-xs text-foreground-muted">
            <ol className="flex flex-wrap gap-3"><li><Link href="/">Início</Link></li><li aria-hidden="true">/</li><li><Link href="/colecoes">Coleções</Link></li><li aria-hidden="true">/</li><li aria-current="page" className="text-foreground">{collection.name}</li></ol>
          </nav>
          <section className="site-grid grid items-center gap-10 pb-16 md:grid-cols-2 md:gap-16 md:pb-24">
            <div className="order-2 md:order-1">
              <p className="eyebrow">{collection.isDemo ? "Coleção demonstrativa" : "Coleção OSTON"}</p>
              <h1 className="display-title mt-5">{collection.name}</h1>
              {collection.shortDescription ? <p className="editorial-copy mt-6 max-w-lg">{collection.shortDescription}</p> : null}
              <div className="mt-9 flex flex-wrap gap-3">
                <a href="#produtos" className="button-primary">Explorar o conjunto <span aria-hidden="true">↓</span></a>
                <Link href={contact} className="button-secondary">Consultar coleção <span aria-hidden="true">↗</span></Link>
              </div>
              {collection.description ? <p className="mt-9 max-w-xl border-t border-border pt-7 text-sm leading-8 whitespace-pre-line text-foreground-muted">{collection.description}</p> : null}
            </div>
            <div className="relative order-1 aspect-square overflow-hidden bg-surface md:order-2">
              {collection.coverImage ? (
                <SiteImage src={mediaSrc(collection.coverImage.url)} alt={collection.coverImage.alt || collection.name} fill preload sizes="(max-width: 767px) 100vw, 50vw" className="object-contain" />
              ) : <div className="flex h-full items-center justify-center text-sm text-foreground-muted">Imagem em preparação</div>}
            </div>
          </section>
          <div className="site-grid">
            {products.length ? <ProductExplorer products={products} /> : (
              <section id="produtos" className="border-y border-border py-12">
                <h2 className="font-display text-3xl">Conheça esta coleção com a nossa equipe.</h2>
                <p className="mt-3 text-sm text-foreground-muted">Consulte os produtos e as condições de atendimento.</p>
                <Link href={contact} className="button-link mt-6">Solicitar informações <span aria-hidden="true">↗</span></Link>
              </section>
            )}
            {otherCollections.length ? (
              <section className="mt-20 border-t border-border pt-10" aria-labelledby="other-collections">
                <p className="eyebrow">Continue explorando</p>
                <h2 id="other-collections" className="font-display mt-3 text-3xl">Outras cores, outras possibilidades.</h2>
                <div className="mt-7 flex flex-wrap gap-3">
                  {otherCollections.map((item) => <Link key={item.id} href={"/colecoes/" + item.slug} className="button-secondary">{item.name} <span aria-hidden="true">↗</span></Link>)}
                </div>
              </section>
            ) : null}
          </div>
        </main>
      </PublicChrome>
    </>
  );
}
