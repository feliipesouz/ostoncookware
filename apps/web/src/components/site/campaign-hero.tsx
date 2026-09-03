import Link from "next/link";
import type { Campaign } from "@/lib/content";
import { mediaSrc } from "@/lib/api";
import { isSafeCtaUrl } from "@/lib/safe-url";
import { SiteImage } from "./site-image";

const alignClass = {
  left: "items-start text-left",
  center: "items-center text-center",
  right: "items-end text-right",
} as const;

export function CampaignHero({ campaign }: { campaign: Campaign }) {
  const desktop = campaign.desktopImage ? mediaSrc(campaign.desktopImage.url) : "/demo/hero-desktop.png";
  const mobile = campaign.mobileImage ? mediaSrc(campaign.mobileImage.url) : "/demo/hero-mobile.png";
  const focal = `hero-focal-${campaign.focalPosition}`;

  return (
    <section className="relative isolate min-h-[100svh] overflow-hidden bg-surface-inverse text-foreground-inverse">
      <div className="absolute inset-0">
        <SiteImage
          src={mobile}
          alt={campaign.imageAlt}
          fill
          priority
          sizes="100vw"
          className={`object-cover md:hidden ${focal}`}
        />
        <SiteImage
          src={desktop}
          alt={campaign.imageAlt}
          fill
          priority
          sizes="100vw"
          className={`hidden object-cover md:block ${focal}`}
        />
      </div>
      <div
        className="absolute inset-0"
        style={{ background: `rgb(23 22 20 / ${campaign.overlay / 100})` }}
      />
      <div className={`site-grid relative flex min-h-[100svh] flex-col justify-end pb-20 pt-32 md:justify-center md:pb-0 ${alignClass[campaign.textAlign]}`}>
        <div className="max-w-3xl">
          {campaign.eyebrow ? (
            <p className="text-[0.7rem] tracking-[0.42em] uppercase text-accent">{campaign.eyebrow}</p>
          ) : null}
          <h1 className="font-display mt-5 text-5xl leading-[0.95] tracking-tight sm:text-6xl lg:text-8xl">
            {campaign.title}
          </h1>
          {campaign.subtitle ? (
            <p className="mt-6 max-w-xl text-base leading-8 text-foreground-inverse/80 sm:text-lg">
              {campaign.subtitle}
            </p>
          ) : null}
          <div className={`mt-10 flex flex-wrap gap-4 ${campaign.textAlign === "center" ? "justify-center" : ""}`}>
            <Link
              href={isSafeCtaUrl(campaign.primaryCtaUrl) ? campaign.primaryCtaUrl : "/"}
              className="bg-brand px-6 py-3 text-[0.7rem] tracking-[0.28em] uppercase text-brand-foreground transition-colors hover:bg-brand-hover"
            >
              {campaign.primaryCtaLabel}
            </Link>
            {campaign.secondaryCtaLabel && campaign.secondaryCtaUrl && isSafeCtaUrl(campaign.secondaryCtaUrl) ? (
              <Link
                href={campaign.secondaryCtaUrl}
                className="border border-foreground-inverse/40 px-6 py-3 text-[0.7rem] tracking-[0.28em] uppercase transition-colors hover:bg-foreground-inverse hover:text-foreground"
              >
                {campaign.secondaryCtaLabel}
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
