import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import { PreviewBanner } from "@/components/site/preview-banner";
import "./globals.css";

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

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "OSTON Cookware",
    template: "%s · OSTON Cookware",
  },
  description: "Cozinhando com qualidade e estilo.",
};

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
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
