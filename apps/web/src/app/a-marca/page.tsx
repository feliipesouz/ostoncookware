import type { Metadata } from "next";
import Link from "next/link";
import { PublicChrome } from "@/components/site/public-chrome";
import { getInstitutionalPage, getPublicSiteSafe, isDraftEnabled, pageParagraphs } from "@/lib/content";
import { siteMetadata } from "@/lib/seo";

export const revalidate = 60;

const FALLBACK_BODY = [
  "Entre o preparo e a mesa, existe o seu jeito de cozinhar. A OSTON convida você a escolher os conjuntos e as cores que fazem parte desse momento.",
  "Explore as coleções, conheça a composição de cada conjunto e converse com nossa equipe para encontrar a sua próxima escolha.",
];

export async function generateMetadata(): Promise<Metadata> {
  const [site, page, draft] = await Promise.all([
    getPublicSiteSafe(), getInstitutionalPage("a-marca").catch(() => null), isDraftEnabled(),
  ]);
  return siteMetadata(site.settings, {
    title: page?.seoTitle ?? page?.title ?? "A marca",
    description: page?.seoDescription ?? "Conheça a OSTON Cookware e explore nossas coleções de panelas.",
    path: "/a-marca",
    noindex: draft,
  });
}

export default async function BrandPage() {
  const [site, page] = await Promise.all([
    getPublicSiteSafe(), getInstitutionalPage("a-marca").catch(() => null),
  ]);
  const paragraphs = page ? pageParagraphs(page.body) : FALLBACK_BODY;
  return (
    <PublicChrome settings={site.settings} navigation={site.navigation} announcement={site.announcement}>
      <main className="bg-background">
        <div className="site-grid grid gap-10 py-16 md:grid-cols-12 md:py-28">
          <div className="md:col-span-7">
            <p className="eyebrow">{page?.eyebrow ?? "A marca"}</p>
            <h1 className="display-title mt-5">{page?.title ?? "O seu jeito de estar à mesa."}</h1>
            <div className="editorial-rule mt-8" />
          </div>
          <div className="md:col-span-5 md:pt-12">
            {paragraphs.map((paragraph, index) => <p key={index} className="editorial-copy mt-7 first:mt-0">{paragraph}</p>)}
            <Link href="/colecoes" className="button-primary mt-10">Explore as coleções <span aria-hidden="true">↗</span></Link>
            <Link href="/contato" className="button-link mt-6">Converse com a OSTON <span aria-hidden="true">↗</span></Link>
          </div>
        </div>
      </main>
    </PublicChrome>
  );
}
