import Link from "next/link";
import { getImageProps } from "next/image";
import type { CSSProperties } from "react";
import type { Campaign } from "@/lib/content";
import { mediaSrc } from "@/lib/api";
import { isSafeCtaUrl } from "@/lib/safe-url";
import { ArrowIcon, ArrowUpRightIcon } from "./icons";
import { MotionSurface } from "./motion-surface";
import { HeroSlideshow } from "./hero-slideshow";

const atmosphere = "/editorial/culinary-atmosphere.webp";

function rasterDemo(url: string) {
  return url.startsWith("/demo/") && url.endsWith(".svg") ? `${url.slice(0, -4)}.png` : url;
}

export function CampaignHero({ campaign }: { campaign: Campaign }) {
  const configured = campaign.slides?.filter((slide) => slide.desktopImage || slide.mobileImage);
  const slides = configured?.length ? configured : [campaign];
  const pictures = slides.map((slide, index) => {
    const desktopImage = slide.desktopImage ?? slide.mobileImage;
    const desktop = desktopImage ? rasterDemo(mediaSrc(desktopImage.url)) : atmosphere;
    const mobileImage = slide.mobileImage ?? desktopImage;
    const mobile = mobileImage ? rasterDemo(mediaSrc(mobileImage.url)) : desktop;
    const alt = slide.imageAlt || campaign.imageAlt || desktopImage?.alt || "Universo OSTON";
    const { props: desktopProps } = getImageProps({
      src: desktop, alt, width: desktopImage?.width ?? 1536,
      height: desktopImage?.height ?? 1024, sizes: "100vw",
      loading: "eager", fetchPriority: index === 0 ? "high" : "low",
    });
    const { props: mobileProps } = getImageProps({
      src: mobile, alt, width: mobileImage?.width ?? 1200,
      height: mobileImage?.height ?? 1800, sizes: "100vw",
      loading: "eager", fetchPriority: index === 0 ? "high" : "low",
    });
    return (
      <picture key={index}>
        {mobile !== desktop ? <source media="(max-width: 767px)" srcSet={mobileProps.srcSet} sizes="100vw" /> : null}
        <img {...desktopProps} alt={alt} className="hero-image" style={{ objectPosition: (slide.focalPosition ?? campaign.focalPosition ?? "center").replace("-", " ") }} />
      </picture>
    );
  });
  const secondary =
    campaign.secondaryCtaLabel &&
    campaign.secondaryCtaUrl &&
    isSafeCtaUrl(campaign.secondaryCtaUrl);

  return (
    <section
      className={`brand-hero hero-immersive hero-align-${campaign.textAlign}`}
      aria-label="Universo OSTON"
    >
      <MotionSurface className="hero-surface">
        <HeroSlideshow slides={pictures} />
        <div
          className="hero-overlay"
          style={
            {
              "--hero-overlay": Math.min(0.8, Math.max(0, campaign.overlay / 100)),
            } as CSSProperties
          }
        />
        <div className="site-grid hero-layout">
          <div className="hero-topline" aria-hidden="true">
            <span>O prazer de cozinhar.</span>
            <span>O privilégio de estar junto.</span>
          </div>
          <div className="hero-content">
            {campaign.eyebrow ? (
              <p className="eyebrow hero-eyebrow">
                <span />
                {campaign.eyebrow}
              </p>
            ) : null}
            <h1 className="hero-title">{campaign.title.replace(/^(\S{1,2})\s+/, "$1\u00a0")}</h1>
            {campaign.subtitle ? <p className="hero-description">{campaign.subtitle}</p> : null}
            <div className="hero-actions">
              <Link
                href={isSafeCtaUrl(campaign.primaryCtaUrl) ? campaign.primaryCtaUrl : "/colecoes"}
                className="button-primary"
              >
                {campaign.primaryCtaLabel}
                <ArrowUpRightIcon />
              </Link>
              {secondary ? (
                <Link href={campaign.secondaryCtaUrl!} className="button-link">
                  {campaign.secondaryCtaLabel}
                  <ArrowIcon />
                </Link>
              ) : null}
            </div>
          </div>
          <div className="hero-bottomline">
            <p>
              <span>OSTON</span>À mesa. Na sua história.
            </p>
            <a href="#universo-oston" className="hero-discover">
              <span>Continue a experiência</span>
              <ArrowIcon />
            </a>
          </div>
        </div>
      </MotionSurface>
    </section>
  );
}
