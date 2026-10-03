import type { Metadata } from "next";
import { Suspense } from "react";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import localFont from "next/font/local";
import { PreviewBanner } from "@/components/site/preview-banner";
import { LeadAttribution } from "@/components/site/lead-attribution";
import { getPublicSiteSafe, isDraftEnabled } from "@/lib/content";
import { siteMetadata, siteUrl } from "@/lib/seo";
import "./globals.css";

const display = localFont({
  src: "../../public/fonts/cormorant-garamond-latin.woff2",
  weight: "400 700",
  style: "normal",
  variable: "--font-cormorant",
  display: "swap",
  adjustFontFallback: "Times New Roman",
});

const body = localFont({
  src: "../../public/fonts/manrope-latin.woff2",
  weight: "200 800",
  style: "normal",
  variable: "--font-manrope",
  display: "swap",
  adjustFontFallback: "Arial",
});

export async function generateMetadata(): Promise<Metadata> {
  const [site, draft] = await Promise.all([getPublicSiteSafe(), isDraftEnabled()]);
  return {
    metadataBase: new URL(siteUrl()),
    ...siteMetadata(site.settings, { noindex: draft }),
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${display.variable} ${body.variable}`}>
      <body
        style={{
          ["--font-display" as string]: "var(--font-cormorant)",
          ["--font-body" as string]: "var(--font-manrope)",
        }}
      >
        <PreviewBanner />
        <Suspense fallback={null}><LeadAttribution /></Suspense>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
