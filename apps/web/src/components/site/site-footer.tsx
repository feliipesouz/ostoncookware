import Link from "next/link";
import type { NavigationItem, Settings } from "@/lib/content";
import { consultantMessage } from "@/lib/content";
import { whatsappLink } from "@/lib/api";
import { isSafeCtaUrl } from "@/lib/safe-url";
import { CatalogDownload } from "./catalog-download";
import { ArrowIcon, ArrowUpRightIcon } from "./icons";

export function SiteFooter({ settings, items }: { settings: Settings; items?: NavigationItem[] }) {
  const year = new Date().getFullYear();
  const nav = (items ?? [])
    .filter((item) => item.enabled && !item.parentId && isSafeCtaUrl(item.href))
    .sort((left, right) => left.sortOrder - right.sortOrder);
  const catalog = settings.catalogPdf?.url;
  return (
    <footer className="site-footer">
      <div className="site-grid">
        <div className="footer-topline">
          <p>À mesa. Na sua história.</p>
          <Link href="/contato" className="button-link">
            Vamos conversar
            <ArrowUpRightIcon />
          </Link>
        </div>
        <div className="footer-details">
          <p className="footer-about">
            {settings.footerText ||
              "Para quem encontra na cozinha um jeito de estar presente. Conheça as coleções e o universo OSTON."}
          </p>
          <div>
            <p className="eyebrow">Explore</p>
            <ul>
              {nav.map((item) => (
                <li key={item.id ?? item.href}>
                  <Link href={item.href}>{item.label}</Link>
                </li>
              ))}
              {catalog ? (
                <li>
                  <CatalogDownload href={catalog} />
                </li>
              ) : null}
            </ul>
          </div>
          <div>
            <p className="eyebrow">Perto de você</p>
            <ul>
              {settings.whatsapp ? (
                <li>
                  <a
                    href={whatsappLink(
                      settings.whatsapp,
                      consultantMessage(settings, "Olá, gostaria de conhecer a OSTON."),
                    )}
                  >
                    WhatsApp
                  </a>
                </li>
              ) : null}
              {settings.email ? (
                <li>
                  <a href={`mailto:${settings.email}`}>{settings.email}</a>
                </li>
              ) : null}
              {settings.instagram && isSafeCtaUrl(settings.instagram) ? (
                <li>
                  <a href={settings.instagram} rel="noreferrer" target="_blank">
                    Instagram ↗
                  </a>
                </li>
              ) : null}
              {settings.businessHours ? <li>{settings.businessHours}</li> : null}
            </ul>
          </div>
        </div>
        <p className="footer-wordmark" aria-hidden="true">
          {settings.brandName.replace(/ Cookware$/i, "")}
        </p>
        <div className="footer-base">
          <p>
            © {year}{" "}
            {settings.copyrightText ?? `${settings.brandName}. Todos os direitos reservados.`}
          </p>
          <div className="footer-base-links">
            {settings.privacyPolicyUrl && isSafeCtaUrl(settings.privacyPolicyUrl) ? (
              <a href={settings.privacyPolicyUrl} rel="noreferrer" target="_blank">
                Privacidade
              </a>
            ) : null}
            {settings.termsUrl && isSafeCtaUrl(settings.termsUrl) ? (
              <a href={settings.termsUrl} rel="noreferrer" target="_blank">
                Termos
              </a>
            ) : null}
            <a href="#top" className="footer-top-link">
              Voltar ao início
              <ArrowIcon />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
