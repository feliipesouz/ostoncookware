import Link from "next/link";
import type { Campaign } from "@/lib/content";
import { mediaSrc } from "@/lib/api";
import { isSafeCtaUrl } from "@/lib/safe-url";
import { ArrowUpRightIcon } from "./icons";
import { SiteImage } from "./site-image";

/** The commercial moment has its own space, independent of the brand hero. */
export function SeasonalCampaign({ campaign }: { campaign: Campaign | null }) {
  if (!campaign || campaign.id === "fallback") return null;
  const desktopImage = campaign.desktopImage ?? campaign.mobileImage;
  const mobileImage = campaign.mobileImage;
  const hasMobileVariant = Boolean(mobileImage && mobileImage.url !== desktopImage?.url);
  return (
    <section className="seasonal-section" aria-label="Campanha em destaque">
      <div className={`site-grid seasonal-campaign ${desktopImage ? "seasonal-with-image" : ""}`}>
        <div className="seasonal-content editorial-enter">
          <p className="eyebrow">{campaign.eyebrow || "Em destaque"}</p>
          <h2 className="display-title">{campaign.title}</h2>
          {campaign.subtitle ? <p className="editorial-copy">{campaign.subtitle}</p> : null}
          <div className="seasonal-actions">
            <Link
              className="button-primary"
              href={isSafeCtaUrl(campaign.primaryCtaUrl) ? campaign.primaryCtaUrl : "/colecoes"}
            >
              {campaign.primaryCtaLabel}
              <ArrowUpRightIcon />
            </Link>
            {campaign.secondaryCtaLabel &&
            campaign.secondaryCtaUrl &&
            isSafeCtaUrl(campaign.secondaryCtaUrl) ? (
              <Link className="button-link" href={campaign.secondaryCtaUrl}>
                {campaign.secondaryCtaLabel}
              </Link>
            ) : null}
          </div>
        </div>
        {desktopImage ? (
          <div className="seasonal-image">
            {hasMobileVariant && mobileImage ? (
              <SiteImage
                src={mediaSrc(mobileImage.url)}
                alt={campaign.imageAlt || campaign.title}
                fill
                sizes="100vw"
                className={`object-cover md:hidden hero-focal-${campaign.focalPosition}`}
              />
            ) : null}
            <SiteImage
              src={mediaSrc(desktopImage.url)}
              alt={campaign.imageAlt || campaign.title}
              fill
              sizes="(max-width: 767px) 100vw, 45vw"
              className={`object-cover ${hasMobileVariant ? "hidden md:block" : ""} hero-focal-${campaign.focalPosition}`}
            />
          </div>
        ) : null}
      </div>
    </section>
  );
}
