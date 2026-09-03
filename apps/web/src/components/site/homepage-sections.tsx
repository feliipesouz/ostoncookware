import type { Campaign, Collection, PublicHomepageSection, Settings } from "@/lib/content";
import { fallbackCampaign } from "@/lib/content";
import { mediaSrc } from "@/lib/api";
import { CampaignHero } from "./campaign-hero";
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
  const hero = campaign ?? fallbackCampaign();

  return (
    <>
      {sections
        .filter((section) => section.enabled)
        .map((section) => {
          switch (section.type) {
            case "HERO":
            case "hero_campaign":
              return <CampaignHero key={section.id} campaign={hero} />;
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
                  imageUrl={section.image ? mediaSrc(section.image.url) : mediaSrc(section.imagePath ?? "")}
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
                  imageUrl={section.image ? mediaSrc(section.image.url) : mediaSrc(section.imagePath ?? "")}
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
