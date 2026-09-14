import "@oston/design-system/admin.css";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      data-theme="admin"
      className="min-h-screen bg-background text-foreground"
      style={{
        fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        letterSpacing: 0,
        wordSpacing: 0,
      }}
    >
      {children}
    </div>
  );
}
