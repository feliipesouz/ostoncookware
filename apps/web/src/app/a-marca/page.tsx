import type { Metadata } from "next";
import { PublicChrome } from "@/components/site/public-chrome";
import {
  getInstitutionalPage,
  getPublicSiteSafe,
  pageParagraphs,
} from "@/lib/content";
import { siteMetadata } from "@/lib/seo";

export const revalidate = 60;

const FALLBACK_BODY = [
  "A OSTON nasce como uma marca de cookware contemporâneo: silenciosa na comunicação, precisa no gesto, sofisticada na presença. Esta página conta a intenção da marca — não um dossiê técnico.",
  "O modelo comercial é consultivo. O site apresenta coleções, captura interesse e prepara o terreno para um embaixador oficial, quando o cliente autorizar imagem e nome.",
  "Especificações, origem, materiais e preços entram apenas com o catálogo oficial.",
];

export async function generateMetadata(): Promise<Metadata> {
  const [{ settings }, page] = await Promise.all([
    getPublicSiteSafe(),
    getInstitutionalPage("a-marca").catch(() => null),
  ]);
  return siteMetadata(settings, {
    title: page?.seoTitle ?? page?.title ?? "A marca",
    description: page?.seoDescription ?? "OSTON Cookware. Cozinhando com qualidade e estilo.",
    path: "/a-marca",
  });
}

export default async function BrandPage() {
  const [site, page] = await Promise.all([
    getPublicSiteSafe(),
    getInstitutionalPage("a-marca").catch(() => null),
  ]);
  const paragraphs = page ? pageParagraphs(page.body) : FALLBACK_BODY;

  return (
    <PublicChrome settings={site.settings} navigation={site.navigation} announcement={site.announcement}>
      <main className="bg-background">
        <div className="site-grid max-w-4xl py-20 md:py-28">
          <p className="text-[0.7rem] tracking-[0.42em] uppercase text-brand">
            {page?.eyebrow ?? "A marca"}
          </p>
          <h1 className="font-display mt-4 text-5xl md:text-7xl">
            {page?.title ?? "Cozinhando com qualidade e estilo"}
          </h1>
          <div className="editorial-rule mt-8" />
          {paragraphs.map((paragraph) => (
            <p key={paragraph.slice(0, 24)} className="mt-10 text-lg leading-9 text-foreground-muted first:mt-10">
              {paragraph}
            </p>
          ))}
        </div>
      </main>
    </PublicChrome>
  );
}
