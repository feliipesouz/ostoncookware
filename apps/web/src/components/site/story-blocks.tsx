import Link from "next/link";
import { SiteImage } from "./site-image";
import { whatsappLink } from "@/lib/api";
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
  const primary =
    primaryHref === "/contato" && settings.whatsapp
      ? whatsappLink(
          settings.whatsapp,
          consultantMessage(settings, "Olá, gostaria de conhecer as coleções OSTON."),
        )
      : primaryHref;
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
            <Link href={isSafeCtaUrl(primary) ? primary : "/contato"} className="button-primary">
              {primary === "/contato" && /whatsapp/i.test(primaryLabel) ? "Falar com a OSTON" : primaryLabel}
              <ArrowUpRightIcon />
            </Link>
            {secondaryLabel && secondaryHref !== primaryHref ? (
              <Link
                href={isSafeCtaUrl(secondaryHref) ? secondaryHref : "/contato"}
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
