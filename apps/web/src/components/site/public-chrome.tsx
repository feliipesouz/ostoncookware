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
    <>
      <AnnouncementBar announcement={announcement ?? null} />
      <SiteHeader settings={settings} items={navigation?.header} overlay={overlay} />
      {children}
      <SiteFooter settings={settings} items={navigation?.footer} />
    </>
  );
}
