import type { Metadata } from "next";
import Link from "next/link";
import { PublicChrome } from "@/components/site/public-chrome";
import { consultationUrl, DEFAULT_CONSULTATION_MESSAGE } from "@/lib/consultation";
import { ArrowIcon, ArrowUpRightIcon } from "@/components/site/icons";
import { consultationContext } from "@/lib/catalog";
import {
  consultantMessage,
  getCollections,
  getPublicSiteSafe,
  isDraftEnabled,
  type Product,
} from "@/lib/content";
import { publicGet } from "@/lib/public-api";
import { absoluteUrl, siteMetadata } from "@/lib/seo";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const [site, draft] = await Promise.all([getPublicSiteSafe(), isDraftEnabled()]);
  return siteMetadata(site.settings, {
    title: "Contato e atendimento",
    description:
      "Converse com a equipe OSTON sobre os conjuntos de panelas, cores e condições de atendimento.",
    path: "/contato",
    noindex: draft,
  });
}

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [site, collections, query] = await Promise.all([
    getPublicSiteSafe(),
    getCollections().catch(() => []),
    searchParams,
  ]);
  const productSlug = validSlug(query.produto);
  const product = productSlug
    ? await publicGet<{ data: Product }>("/v1/public/products/" + productSlug, ["products"])
        .then((payload) => payload.data)
        .catch(() => null)
    : null;
  const collection =
    collections.find((item) =>
      product ? item.id === product.collectionId : item.slug === validSlug(query.colecao),
    ) ?? null;
  const context = consultationContext(product, collection);
  const message = context.message
    ? `${context.message} ${absoluteUrl(context.path)}`
    : consultantMessage(site.settings, DEFAULT_CONSULTATION_MESSAGE);
  const whatsapp = consultationUrl(site.settings.whatsapp, message);
  const selectedName = context.productName || context.collectionName;

  return (
    <PublicChrome
      settings={site.settings}
      navigation={site.navigation}
      announcement={site.announcement}
    >
      <main className="site-grid py-[var(--space-section)] grid items-center gap-9 md:grid-cols-[1.2fr_1fr] md:gap-14">
        <div>
          <p className="eyebrow">Atendimento OSTON</p>
          <h1 className="display-title mt-5">
            Uma boa escolha
            <br />
            <span className="italic text-brand">começa na conversa.</span>
          </h1>
          <p className="editorial-copy mt-6 max-w-lg">
            Seu jeito de cozinhar, sua cor preferida, o conjunto que faz sentido para você. Converse
            com um consultor pelo WhatsApp e conheça cada detalhe antes de escolher.
          </p>
          <ol className="mt-8 max-w-lg divide-y divide-border border-y border-border">
            {[
              [
                "Encontre a sua cor",
                "Explore as coleções e escolha o acabamento que combina com a sua cozinha.",
              ],
              [
                "Conheça o conjunto",
                "Tire dúvidas sobre as peças, as medidas e os cuidados no dia a dia.",
              ],
              [
                "Consulte as condições",
                "Confira valores, disponibilidade e entrega diretamente com a equipe.",
              ],
            ].map(([title, description], index) => (
              <li key={title} className="flex gap-4 py-4">
                <span className="editorial-number pt-1" aria-hidden="true">
                  0{index + 1}
                </span>
                <div>
                  <h2 className="text-sm font-medium">{title}</h2>
                  <p className="mt-1 text-sm leading-relaxed text-foreground-muted">
                    {description}
                  </p>
                </div>
              </li>
            ))}
          </ol>
          <Link href="/colecoes" className="button-link mt-6">
            <ArrowIcon className="h-4 w-4 shrink-0 rotate-180" /> Explorar as coleções
          </Link>
        </div>
        <section
          aria-labelledby="consultation-heading"
          className="border border-border bg-surface px-6 py-8 sm:p-9"
        >
          <p className="eyebrow">Conversa pelo WhatsApp</p>
          <h2 id="consultation-heading" className="font-display mt-4 text-3xl leading-tight">
            Vamos encontrar
            <br />o seu conjunto?
          </h2>
          {selectedName ? (
            <div className="mt-6 border-l-2 border-brand pl-4">
              <p className="text-xs uppercase tracking-wider text-foreground-muted">Sua escolha</p>
              <p className="mt-2 text-lg">{selectedName}</p>
              <p className="mt-2 text-sm leading-relaxed text-foreground-muted">
                O nome e o link desta escolha já acompanham a mensagem.
              </p>
            </div>
          ) : (
            <p className="mt-5 text-sm leading-7 text-foreground-muted">
              Você pode começar pelas cores, pelas peças ou por uma dúvida. A conversa acontece
              diretamente com a equipe OSTON.
            </p>
          )}
          <a
            href={whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="button-primary mt-7 w-full justify-center"
          >
            Falar com consultor <ArrowUpRightIcon />
          </a>
          <p className="mt-4 text-xs leading-6 text-foreground-muted">
            Abre o WhatsApp com uma mensagem pronta. Você pode editá-la antes de enviar.
          </p>
          {site.settings.email || site.settings.businessHours ? (
            <div className="mt-6 border-t border-border pt-5">
              {site.settings.email ? (
                <p className="text-sm">
                  <a
                    href={"mailto:" + site.settings.email}
                    className="underline decoration-border-strong underline-offset-4"
                  >
                    {site.settings.email}
                  </a>
                </p>
              ) : null}
              {site.settings.businessHours ? (
                <p className="mt-3 text-xs leading-7 whitespace-pre-line text-foreground-muted">
                  {site.settings.businessHours}
                </p>
              ) : null}
            </div>
          ) : null}
        </section>
      </main>
    </PublicChrome>
  );
}

function validSlug(value: string | string[] | undefined) {
  return typeof value === "string" &&
    value.length <= 120 &&
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)
    ? value
    : undefined;
}
