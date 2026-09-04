import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import { headers } from "next/headers";
import { PreviewBanner } from "@/components/site/preview-banner";
import { getPublicSiteSafe, isDraftEnabled } from "@/lib/content";
import { jsonLd, siteMetadata } from "@/lib/seo";
import "./globals.css";

async function isAdminRequest() {
  const pathname = (await headers()).get("x-pathname") ?? "";
  return pathname.startsWith("/admin");
}

const display = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-cormorant",
  display: "swap",
});

const body = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  if (await isAdminRequest()) {
    return {
      title: "OSTON CMS",
      robots: { index: false, follow: false, nocache: true },
    };
  }

  try {
    const { settings } = await getPublicSiteSafe();
    return {
      metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
      ...siteMetadata(settings),
      title: {
        default: settings.defaultSeoTitle,
        template: `%s · ${settings.brandName}`,
      },
    };
  } catch {
    return {
      title: "OSTON Cookware",
      description: "Cozinhando com qualidade e estilo.",
    };
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const draft = await isDraftEnabled();
  const admin = await isAdminRequest();
  let json = "";
  if (!draft && !admin) {
    try {
      const { settings } = await getPublicSiteSafe();
      json = jsonLd({
        "@context": "https://schema.org",
        "@type": "Organization",
        name: settings.brandName,
        url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
        email: settings.email,
      });
    } catch {
      json = "";
    }
  }

  return (
    <html lang="pt-BR" className={`${display.variable} ${body.variable}`}>
      <body
        style={{
          ["--font-display" as string]: "var(--font-cormorant)",
          ["--font-body" as string]: "var(--font-manrope)",
        }}
      >
        {json ? (
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />
        ) : null}
        <PreviewBanner />
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
