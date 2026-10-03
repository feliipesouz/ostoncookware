import type { Metadata } from "next";
import Link from "next/link";
import { ContactForm } from "@/components/site/contact-form";
import { PublicChrome } from "@/components/site/public-chrome";
import { whatsappLink } from "@/lib/api";
import { consultationContext } from "@/lib/catalog";
import { consultantMessage, getCollections, getPublicSiteSafe, isDraftEnabled, type Product } from "@/lib/content";
import { publicGet } from "@/lib/public-api";
import { isSafeCtaUrl } from "@/lib/safe-url";
import { siteMetadata } from "@/lib/seo";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const [site, draft] = await Promise.all([getPublicSiteSafe(), isDraftEnabled()]);
  return siteMetadata(site.settings, {
    title: "Contato e atendimento",
    description: "Converse com a equipe OSTON sobre os conjuntos de panelas, cores e condições de atendimento.",
    path: "/contato",
    noindex: draft,
  });
}

export default async function ContactPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const [site, collections, query] = await Promise.all([
    getPublicSiteSafe(), getCollections().catch(() => []), searchParams,
  ]);
  const productSlug = validSlug(query.produto);
  const product = productSlug
    ? await publicGet<{ data: Product }>("/v1/public/products/" + productSlug, ["products"]).then((payload) => payload.data).catch(() => null)
    : null;
  const collection = collections.find((item) => product ? item.id === product.collectionId : item.slug === validSlug(query.colecao)) ?? null;
  const context = consultationContext(product, collection);
  const whatsapp = whatsappLink(site.settings.whatsapp, context.message || consultantMessage(site.settings, "Olá, gostaria de conhecer os conjuntos OSTON."));
  const privacyUrl = site.settings.privacyPolicyUrl && isSafeCtaUrl(site.settings.privacyPolicyUrl) ? site.settings.privacyPolicyUrl : null;

  return (
    <PublicChrome settings={site.settings} navigation={site.navigation} announcement={site.announcement}>
      <main className="site-grid grid items-start gap-12 pt-12 pb-24 md:grid-cols-2 md:gap-16 md:pt-20 md:pb-32">
        <div className="md:sticky md:top-[calc(var(--header-height)+2rem)]">
          <p className="eyebrow">Atendimento OSTON</p>
          <h1 className="display-title mt-5">A sua próxima<br /><span className="italic text-brand">boa escolha.</span></h1>
          <p className="editorial-copy mt-7 max-w-md">Conte como você imagina a sua cozinha. Nossa equipe ajuda você a conhecer as cores, a composição dos conjuntos e as condições de atendimento.</p>
          <div className="mt-9 max-w-md border-t border-border pt-7">
            <p className="text-xs tracking-[0.14em] uppercase text-foreground-muted">Prefere conversar diretamente?</p>
            {whatsapp.startsWith("https://wa.me/") ? <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="button-secondary mt-5">Conversar no WhatsApp <span aria-hidden="true">↗</span></a> : null}
            {site.settings.email ? <p className="mt-5 text-sm"><a href={"mailto:" + site.settings.email} className="underline decoration-border-strong underline-offset-4">{site.settings.email}</a></p> : null}
            {site.settings.businessHours ? <p className="mt-4 text-xs leading-7 whitespace-pre-line text-foreground-muted">{site.settings.businessHours}</p> : null}
          </div>
          <Link href="/colecoes" className="button-link mt-8"><span aria-hidden="true">←</span> Continuar explorando</Link>
        </div>
        <ContactForm key={context.path} collections={collections} context={context} privacyUrl={privacyUrl} />
      </main>
    </PublicChrome>
  );
}

function validSlug(value: string | string[] | undefined) {
  return typeof value === "string" && value.length <= 120 && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value) ? value : undefined;
}
