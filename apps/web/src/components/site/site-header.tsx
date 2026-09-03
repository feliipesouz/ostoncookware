import Link from "next/link";
import type { NavigationItem, Settings } from "@/lib/content";
import { CatalogDownload } from "./catalog-download";

function visibleItems(items: NavigationItem[] | undefined) {
  return (items ?? [])
    .filter((item) => item.enabled && !item.parentId)
    .sort((left, right) => left.sortOrder - right.sortOrder);
}

export function SiteHeader({
  settings,
  overlay = false,
  items,
}: {
  settings: Settings;
  overlay?: boolean;
  items?: NavigationItem[];
}) {
  const nav = visibleItems(items);
  const catalog = settings.catalogPdf?.url;

  return (
    <header
      className={
        overlay
          ? "absolute inset-x-0 top-0 z-30 text-foreground-inverse"
          : "relative z-30 border-b border-border bg-background text-foreground"
      }
    >
      <div className="site-grid flex h-[var(--header-height)] items-center justify-between gap-6">
        <Link href="/" className="font-display text-2xl tracking-[0.18em] uppercase">
          {settings.brandName.replace(" Cookware", "")}
          <span className="mt-0.5 block text-[0.65rem] tracking-[0.42em] text-current/70">
            Cookware
          </span>
        </Link>
        <nav className="hidden items-center gap-8 text-[0.7rem] font-medium tracking-[0.28em] uppercase md:flex">
          {nav.map((item) => (
            <Link key={item.id} href={item.href} className="transition-opacity hover:opacity-70">
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          {catalog ? (
            <CatalogDownload
              href={catalog}
              className="hidden text-[0.65rem] tracking-[0.28em] uppercase opacity-80 transition-opacity hover:opacity-100 md:inline"
            />
          ) : null}
          <Link
            href="/contato"
            className={
              overlay
                ? "border border-current/40 px-4 py-2 text-[0.65rem] tracking-[0.28em] uppercase transition-colors hover:bg-foreground-inverse hover:text-foreground"
                : "bg-foreground px-4 py-2 text-[0.65rem] tracking-[0.28em] uppercase text-foreground-inverse transition-colors hover:bg-brand"
            }
          >
            Falar com consultor
          </Link>
        </div>
      </div>
    </header>
  );
}
