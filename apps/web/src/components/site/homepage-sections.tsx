import type { Campaign, Collection, PublicHomepageSection, Settings } from "@/lib/content";
import { fallbackCampaign } from "@/lib/content";
import { mediaSrc } from "@/lib/api";
import { withInstitutionalHero } from "@oston/contracts";
import { Fragment } from "react";
import { CampaignHero } from "./campaign-hero";
import { SeasonalCampaign } from "./seasonal-campaign";
import { FeaturedCollections } from "./featured-collections";
import { Differentials, Manifesto } from "./manifesto";
import { AmbassadorSlot, CommercialCta, ExperienceBlock } from "./story-blocks";

function text(value: string | null | undefined, fallback = "") {
  return value?.trim() || fallback;
}

export function HomepageSections({
  sections,
  campaign,
  collections,
  settings,
}: {
  sections: PublicHomepageSection[];
  campaign: Campaign | null;
  collections: Collection[];
  settings: Settings;
}) {
  const fallbackHero = fallbackCampaign();
  const normalizedSections: PublicHomepageSection[] = withInstitutionalHero(sections);
  const visibleSections = normalizedSections.filter((section) => section.enabled);
  const seasonalSlot = visibleSections.find((section) =>
    ["SEASONAL_CAMPAIGN", "HERO", "hero_campaign"].includes(section.type),
  );

  return (
    <>
      {visibleSections.map((section) => {
        switch (section.type) {
          case "BRAND_HERO":
            return (
              <Fragment key={section.id}>
                <CampaignHero
                  campaign={{
                    ...fallbackHero,
                    id: section.id,
                    eyebrow: section.eyebrow,
                    title: section.title,
                    subtitle: section.subtitle,
                    desktopImage:
                      section.desktopImage ?? section.mobileImage ?? fallbackHero.desktopImage,
                    mobileImage:
                      section.mobileImage ?? section.desktopImage ?? fallbackHero.mobileImage,
                    imageAlt:
                      section.desktopImage || section.mobileImage
                        ? section.imageAlt
                        : fallbackHero.imageAlt,
                    primaryCtaLabel: section.primaryCtaLabel,
                    primaryCtaUrl: section.primaryCtaUrl,
                    secondaryCtaLabel: section.secondaryCtaLabel ?? null,
                    secondaryCtaUrl: section.secondaryCtaUrl ?? null,
                    textAlign: section.textAlign,
                    focalPosition: section.focalPosition,
                    overlay: section.overlay,
                  }}
                />
                <div id="universo-oston" className="hero-scroll-target" />
              </Fragment>
            );
          case "SEASONAL_CAMPAIGN":
          case "HERO":
          case "hero_campaign":
            return section.id === seasonalSlot?.id ? (
              <SeasonalCampaign key={section.id} campaign={campaign} />
            ) : null;
          case "BRAND_MANIFESTO":
            return (
              <Manifesto
                key={section.id}
                eyebrow={section.eyebrow}
                headline={section.headline}
                body={section.body}
              />
            );
          case "manifesto":
            return (
              <Manifesto
                key={section.id}
                eyebrow={section.eyebrow}
                headline={section.quote}
                body={section.body}
              />
            );
          case "FEATURED_COLLECTIONS":
            return (
              <FeaturedCollections
                key={section.id}
                collections={collections}
                title={section.title}
                subtitle={section.subtitle}
              />
            );
          case "featured_collections":
            return (
              <FeaturedCollections
                key={section.id}
                collections={collections}
                title={section.title}
                subtitle={section.eyebrow}
              />
            );
          case "FEATURE_HIGHLIGHTS":
            return <Differentials key={section.id} title={section.title} items={section.items} />;
          case "differentials":
            return <Differentials key={section.id} title={section.title} items={section.items} />;
          case "EDITORIAL_FEATURE":
            return (
              <ExperienceBlock
                key={section.id}
                eyebrow={text(section.eyebrow)}
                headline={text(section.title)}
                body={text(section.body)}
                imageUrl={
                  section.image ? mediaSrc(section.image.url) : mediaSrc(section.imagePath ?? "")
                }
                imageAlt={section.image?.alt ?? section.imageAlt}
              />
            );
          case "experience":
            return (
              <ExperienceBlock
                key={section.id}
                eyebrow={section.eyebrow}
                headline={section.title}
                body={section.body}
                imageUrl={mediaSrc(section.imagePath ?? "")}
                imageAlt={section.imageAlt}
              />
            );
          case "AMBASSADOR":
            return (
              <AmbassadorSlot
                key={section.id}
                eyebrow={text(section.eyebrow)}
                headline={text(section.headline ?? section.title)}
                body={text(section.body)}
                imageUrl={
                  section.image ? mediaSrc(section.image.url) : mediaSrc(section.imagePath ?? "")
                }
                imageAlt={section.image?.alt ?? section.imageAlt}
              />
            );
          case "ambassador":
            return (
              <AmbassadorSlot
                key={section.id}
                eyebrow={section.eyebrow}
                headline={section.title}
                body={section.body}
                imageUrl={mediaSrc(section.imagePath ?? "")}
                imageAlt={section.imageAlt}
              />
            );
          case "COMMERCIAL_CTA":
            return (
              <CommercialCta
                key={section.id}
                settings={settings}
                eyebrow={section.eyebrow}
                headline={section.headline}
                body={section.body}
                primaryLabel={section.primaryLabel}
                primaryHref={section.primaryHref}
                secondaryLabel={section.secondaryLabel}
                secondaryHref={section.secondaryHref}
              />
            );
          case "commercial_cta":
            return (
              <CommercialCta
                key={section.id}
                settings={settings}
                eyebrow={section.eyebrow}
                headline={section.title}
                body={section.body}
                primaryLabel={section.primaryLabel}
                primaryHref={section.primaryHref}
                secondaryLabel={section.secondaryLabel ?? "Falar com consultor"}
                secondaryHref={section.secondaryHref ?? "/contato"}
              />
            );
          default:
            return null;
        }
      })}
    </>
  );
}
