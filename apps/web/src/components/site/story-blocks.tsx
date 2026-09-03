import Link from "next/link";
import { SiteImage } from "./site-image";
import { whatsappLink } from "@/lib/api";
import { consultantMessage, type Settings } from "@/lib/content";
import { isSafeCtaUrl } from "@/lib/safe-url";
import { CatalogDownload } from "./catalog-download";

export function ExperienceBlock({
  eyebrow,
  headline,
  body,
  imageUrl,
  imageAlt,
}: {
  eyebrow: string;
  headline: string;
  body: string;
  imageUrl?: string | null;
  imageAlt?: string | null;
}) {
  return (
    <section className="bg-background py-24 md:py-32">
      <div className="site-grid grid items-center gap-12 md:grid-cols-2">
        <div className="relative aspect-[4/5] overflow-hidden bg-graphite">
          <SiteImage
            src={imageUrl || "/demo/experience.png"}
            alt={imageAlt || headline}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
          />
        </div>
        <div className="max-w-lg md:pl-8">
          <p className="text-[0.7rem] tracking-[0.42em] uppercase text-brand">{eyebrow}</p>
          <h2 className="font-display mt-4 text-4xl md:text-6xl">{headline}</h2>
          <p className="mt-6 text-base leading-8 text-foreground-muted">{body}</p>
        </div>
      </div>
    </section>
  );
}

export function AmbassadorSlot({
  eyebrow,
  headline,
  body,
  imageUrl,
  imageAlt,
}: {
  eyebrow: string;
  headline: string;
  body: string;
  imageUrl?: string | null;
  imageAlt?: string | null;
}) {
  return (
    <section className="bg-surface-inverse text-foreground-inverse">
      <div className="site-grid grid md:grid-cols-2">
        <div className="relative min-h-[28rem] overflow-hidden">
          <SiteImage
            src={imageUrl || "/demo/ambassador.png"}
            alt={imageAlt || headline}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
          />
        </div>
        <div className="flex flex-col justify-center px-0 py-16 md:px-16">
          <p className="text-[0.7rem] tracking-[0.42em] uppercase text-accent">{eyebrow}</p>
          <h2 className="font-display mt-4 text-4xl md:text-6xl">{headline}</h2>
          <p className="mt-6 max-w-md text-base leading-8 text-foreground-inverse/75">{body}</p>
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
      ? whatsappLink(settings.whatsapp, consultantMessage(settings, "Olá, gostaria de conhecer as coleções OSTON."))
      : primaryHref;
  const catalog = settings.catalogPdf?.url;

  return (
    <section className="bg-background py-24 md:py-32">
      <div className="site-grid max-w-4xl">
        <p className="text-[0.7rem] tracking-[0.42em] uppercase text-brand">{eyebrow}</p>
        <h2 className="font-display mt-4 text-4xl md:text-6xl">{headline}</h2>
        <p className="mt-6 max-w-2xl text-base leading-8 text-foreground-muted">{body}</p>
        <div className="mt-10 flex flex-wrap gap-4">
          <Link
            href={isSafeCtaUrl(primary) ? primary : "/contato"}
            className="bg-brand px-6 py-3 text-[0.7rem] tracking-[0.28em] uppercase text-brand-foreground hover:bg-brand-hover"
          >
            {primaryLabel}
          </Link>
          <Link
            href={isSafeCtaUrl(secondaryHref) ? secondaryHref : "/contato"}
            className="border border-foreground px-6 py-3 text-[0.7rem] tracking-[0.28em] uppercase hover:bg-foreground hover:text-foreground-inverse"
          >
            {secondaryLabel}
          </Link>
          {catalog ? (
            <CatalogDownload
              href={catalog}
              className="border border-border px-6 py-3 text-[0.7rem] tracking-[0.28em] uppercase hover:bg-surface"
            />
          ) : null}
        </div>
      </div>
    </section>
  );
}
