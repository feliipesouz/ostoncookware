import Link from "next/link";
import { SiteImage } from "./site-image";
import { consultationUrl, DEFAULT_CONSULTATION_MESSAGE } from "@/lib/consultation";
import { consultantMessage, type Settings } from "@/lib/content";
import { isSafeCtaUrl } from "@/lib/safe-url";
import { CatalogDownload } from "./catalog-download";
import { ArrowIcon, ArrowUpRightIcon } from "./icons";

type EditorialProps = {
  eyebrow: string;
  headline: string;
  body: string;
  imageUrl?: string | null;
  imageAlt?: string | null;
};

export function ExperienceBlock({ eyebrow, headline, body, imageUrl, imageAlt }: EditorialProps) {
  return (
    <section className="experience-section">
      <div className="site-grid experience-layout">
        <figure className="editorial-enter">
          <div className="experience-image">
            <SiteImage
              src={imageUrl || "/editorial/culinary-atmosphere.webp"}
              alt={imageAlt || "Ingredientes e texturas sobre uma bancada de cozinha"}
              fill
              sizes="(max-width: 767px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
          <figcaption className="experience-caption">
            <span>O universo OSTON</span>
            <span>Cozinhar. Receber. Viver.</span>
          </figcaption>
        </figure>
        <div className="experience-copy editorial-enter">
          <p className="eyebrow">{eyebrow}</p>
          <h2 className="display-title">{headline}</h2>
          <p className="editorial-copy">{body}</p>
          <Link href="/colecoes" className="button-link">
            Descubra as coleções
            <ArrowIcon />
          </Link>
          <p className="experience-signature">Os melhores encontros começam aqui.</p>
        </div>
      </div>
    </section>
  );
}

export function AmbassadorSlot({ eyebrow, headline, body, imageUrl, imageAlt }: EditorialProps) {
  // A portrait is only published when the CMS contains an actual editorial asset.
  if (!imageUrl || imageUrl.startsWith("/demo/")) return null;
  return (
    <section className="ambassador-section">
      <div className="site-grid ambassador-layout">
        <div className="ambassador-image">
          <SiteImage
            src={imageUrl}
            alt={imageAlt || headline}
            fill
            sizes="(max-width: 767px) 100vw, 50vw"
            className="object-cover"
          />
        </div>
        <div className="ambassador-copy editorial-enter">
          <p className="eyebrow">{eyebrow}</p>
          <h2 className="display-title">{headline}</h2>
          <p className="editorial-copy">{body}</p>
          <Link href="/a-marca" className="button-link">
            Conheça a OSTON
            <ArrowIcon />
          </Link>
        </div>
      </div>
    </section>
  );
}

export function CommercialCta({
  settings,
  eyebrow,
  headline,
  body,
  primaryLabel,
  primaryHref,
  secondaryLabel,
  secondaryHref,
}: {
  settings: Settings;
  eyebrow: string;
  headline: string;
  body: string;
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel: string;
  secondaryHref: string;
}) {
  const consultation = consultationUrl(
    settings.whatsapp,
    consultantMessage(settings, DEFAULT_CONSULTATION_MESSAGE),
  );
  const primary =
    primaryHref === "/contato" || !isSafeCtaUrl(primaryHref) ? consultation : primaryHref;
  const secondary =
    secondaryHref === "/contato" || !isSafeCtaUrl(secondaryHref) ? consultation : secondaryHref;
  const catalog = settings.catalogPdf?.url;
  return (
    <section className="commercial-section">
      <div className="site-grid commercial-layout">
        <div className="commercial-marker">
          <p className="eyebrow">{eyebrow}</p>
          <ArrowUpRightIcon />
        </div>
        <div className="commercial-copy editorial-enter">
          <h2 className="display-title">{headline}</h2>
          <p className="editorial-copy">{body}</p>
          <div className="commercial-actions">
            <Link
              href={primary}
              target={primary.startsWith("https://wa.me/") ? "_blank" : undefined}
              rel={primary.startsWith("https://wa.me/") ? "noopener noreferrer" : undefined}
              className="button-primary"
            >
              {primary === consultation ? "Falar com consultor" : primaryLabel}
              <ArrowUpRightIcon />
            </Link>
            {secondaryLabel && secondary !== primary ? (
              <Link
                href={secondary}
                target={secondary.startsWith("https://wa.me/") ? "_blank" : undefined}
                rel={secondary.startsWith("https://wa.me/") ? "noopener noreferrer" : undefined}
                className="button-secondary"
              >
                {secondaryLabel}
                <ArrowIcon />
              </Link>
            ) : null}
          </div>
          {catalog ? <CatalogDownload href={catalog} className="button-link" /> : null}
        </div>
      </div>
    </section>
  );
}
