import type { Metadata } from "next";
import { ContactForm } from "@/components/site/contact-form";
import { PublicChrome } from "@/components/site/public-chrome";
import { whatsappLink } from "@/lib/api";
import { consultantMessage, getCollections, getPublicSiteSafe } from "@/lib/content";
import { siteMetadata } from "@/lib/seo";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const { settings } = await getPublicSiteSafe();
  return siteMetadata(settings, {
    title: "Contato",
    description: "Fale com um consultor OSTON.",
    path: "/contato",
  });
}

export default async function ContactPage() {
  const [site, collections] = await Promise.all([
    getPublicSiteSafe(),
    getCollections().catch(() => []),
  ]);

  return (
    <PublicChrome settings={site.settings} navigation={site.navigation} announcement={site.announcement}>
      <main className="site-grid grid gap-16 py-16 md:grid-cols-2 md:py-24">
        <div>
          <p className="text-[0.7rem] tracking-[0.42em] uppercase text-brand">Contato</p>
          <h1 className="font-display mt-4 text-5xl md:text-6xl">Uma conversa, não um checkout</h1>
          <p className="mt-6 max-w-md text-foreground-muted">
            Conte como você cozinha. Indicamos a coleção e o próximo passo com um consultor.
          </p>
          <a
            href={whatsappLink(
              site.settings.whatsapp,
              consultantMessage(site.settings, "Olá, gostaria de falar com um consultor OSTON."),
            )}
            className="mt-8 inline-block text-[0.7rem] tracking-[0.28em] uppercase text-brand"
          >
            Preferir WhatsApp
          </a>
        </div>
        <ContactForm collections={collections} />
      </main>
    </PublicChrome>
  );
}
