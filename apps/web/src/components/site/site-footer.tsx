import Link from "next/link";
import type { NavigationItem, Settings } from "@/lib/content";
import { consultantMessage } from "@/lib/content";
import { whatsappLink } from "@/lib/api";
import { CatalogDownload } from "./catalog-download";

function visibleItems(items: NavigationItem[] | undefined) {
  return (items ?? [])
    .filter((item) => item.enabled && !item.parentId)
    .sort((left, right) => left.sortOrder - right.sortOrder);
}

export function SiteFooter({
  settings,
  items,
}: {
  settings: Settings;
  items?: NavigationItem[];
}) {
  const year = new Date().getFullYear();
  const nav = visibleItems(items);
  const catalog = settings.catalogPdf?.url;

  return (
    <footer className="border-t border-border bg-surface-inverse text-foreground-inverse">
      <div className="site-grid grid gap-12 py-16 md:grid-cols-12">
        <div className="md:col-span-5">
          <p className="font-display text-4xl tracking-[0.12em]">OSTON</p>
          <p className="mt-4 max-w-sm text-sm leading-7 text-foreground-inverse/70">
            {settings.footerText ??
              "Cookware contemporâneo, atendimento consultivo e uma presença digital pensada para durar."}
          </p>
        </div>
        <div className="md:col-span-3">
          <p className="text-[0.65rem] tracking-[0.32em] uppercase text-foreground-inverse/50">
            Navegar
          </p>
          <ul className="mt-4 space-y-3 text-sm">
            {nav.map((item) => (
              <li key={item.id}>
                <Link href={item.href} className="hover:text-accent">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="md:col-span-4">
          <p className="text-[0.65rem] tracking-[0.32em] uppercase text-foreground-inverse/50">
            Atendimento
          </p>
          <ul className="mt-4 space-y-3 text-sm text-foreground-inverse/80">
            {settings.email ? (
              <li>
                <a href={`mailto:${settings.email}`}>{settings.email}</a>
              </li>
            ) : null}
            {settings.whatsapp ? (
              <li>
                <a href={whatsappLink(settings.whatsapp, consultantMessage(settings, "Olá, gostaria de conhecer a OSTON."))}>
                  WhatsApp
                </a>
              </li>
            ) : null}
            {settings.businessHours ? <li>{settings.businessHours}</li> : null}
            {settings.instagram ? (
              <li>
                <a href={settings.instagram} rel="noreferrer" target="_blank">
                  Instagram
                </a>
              </li>
            ) : null}
            {catalog ? (
              <li>
                <CatalogDownload href={catalog} className="hover:text-accent" />
              </li>
            ) : null}
          </ul>
        </div>
      </div>
      <div className="site-grid flex flex-col gap-2 border-t border-white/10 py-6 text-xs text-foreground-inverse/45 md:flex-row md:justify-between">
        <p>
          © {year} {settings.copyrightText ?? "OSTON Cookware. Todos os direitos reservados."}
        </p>
        <div className="flex flex-wrap gap-4">
          {settings.privacyPolicyUrl ? (
            <a href={settings.privacyPolicyUrl} rel="noreferrer" target="_blank" className="hover:text-accent">
              Privacidade
            </a>
          ) : null}
          {settings.termsUrl ? (
            <a href={settings.termsUrl} rel="noreferrer" target="_blank" className="hover:text-accent">
              Termos
            </a>
          ) : null}
        </div>
      </div>
    </footer>
  );
}
