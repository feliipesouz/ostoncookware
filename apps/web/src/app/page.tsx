import { HomepageSections } from "@/components/site/homepage-sections";
import { PublicChrome } from "@/components/site/public-chrome";
import { getPublicSiteSafe, isDraftEnabled } from "@/lib/content";
import { jsonLd } from "@/lib/seo";

export const revalidate = 60;

export default async function HomePage() {
  const site = await getPublicSiteSafe();
  const draft = await isDraftEnabled();

  const websiteLd = jsonLd({
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: site.settings.brandName,
    url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  });

  return (
    <>
      {!draft ? (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: websiteLd }} />
      ) : null}
      <PublicChrome
        settings={site.settings}
        navigation={site.navigation}
        announcement={site.announcement}
        overlay
      >
        <main>
          <HomepageSections
            sections={site.homepage.sections}
            campaign={site.campaign}
            collections={site.collections}
            settings={site.settings}
          />
        </main>
      </PublicChrome>
    </>
  );
}
