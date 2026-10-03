import Link from "next/link";
import type { NavigationItem, Settings } from "@/lib/content";
import { isSafeCtaUrl } from "@/lib/safe-url";
import { CatalogDownload } from "./catalog-download";
import { ArrowUpRightIcon } from "./icons";
import { DesktopNavigation, SiteMenu } from "./site-menu";

export function SiteHeader({
  settings,
  overlay = false,
  items,
}: {
  settings: Settings;
  overlay?: boolean;
  items?: NavigationItem[];
}) {
  const nav = (items ?? [])
    .filter((item) => item.enabled && !item.parentId && isSafeCtaUrl(item.href))
    .sort((left, right) => left.sortOrder - right.sortOrder);
  const catalog = settings.catalogPdf?.url;

  return (
    <header className={`site-header ${overlay ? "site-header-overlay" : "site-header-solid"}`}>
      <div className="site-grid header-inner">
        <Link href="/" className="site-wordmark" aria-label={`${settings.brandName} — início`}>
          <span>{settings.brandName.replace(/ Cookware$/i, "")}</span>
          <small>Cookware</small>
        </Link>
        <DesktopNavigation items={nav} />
        <div className="header-actions">
          {catalog ? <CatalogDownload href={catalog} className="header-catalog" /> : null}
          <Link href="/contato" className="header-consultant">
            Falar com a OSTON <ArrowUpRightIcon />
          </Link>
          <SiteMenu items={nav} catalog={catalog} brandName={settings.brandName} />
        </div>
      </div>
    </header>
  );
}
