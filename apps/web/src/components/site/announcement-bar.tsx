import Link from "next/link";
import { isSafeCtaUrl } from "@/lib/safe-url";
import type { Announcement } from "@/lib/content";

export function AnnouncementBar({ announcement }: { announcement: Announcement | null }) {
  if (!announcement?.message) {
    return null;
  }

  const href = announcement.ctaUrl && isSafeCtaUrl(announcement.ctaUrl) ? announcement.ctaUrl : null;

  return (
    <div className="border-b border-border bg-surface text-foreground">
      <div className="site-grid flex flex-wrap items-center justify-center gap-x-4 gap-y-2 py-2.5 text-center text-[0.7rem] tracking-[0.18em] uppercase">
        <p>{announcement.message}</p>
        {href && announcement.ctaLabel ? (
          <Link href={href} className="text-brand underline-offset-4 hover:underline">
            {announcement.ctaLabel}
          </Link>
        ) : null}
      </div>
    </div>
  );
}
