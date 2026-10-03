import type { Announcement, NavigationItem, Settings } from "@/lib/content";
import { AnnouncementBar } from "./announcement-bar";
import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";

export function PublicChrome({
  settings,
  navigation,
  announcement,
  overlay,
  children,
}: {
  settings: Settings;
  navigation?: { header: NavigationItem[]; footer: NavigationItem[] };
  announcement?: Announcement | null;
  overlay?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="public-site" id="top">
      <a className="skip-link" href="#main-content">
        Ir para o conteúdo
      </a>
      <AnnouncementBar announcement={announcement ?? null} />
      <div className="public-frame">
        <SiteHeader settings={settings} items={navigation?.header} overlay={overlay} />
        <div id="main-content" tabIndex={-1} className="public-content">
          {children}
        </div>
      </div>
      <SiteFooter settings={settings} items={navigation?.footer} />
    </div>
  );
}
