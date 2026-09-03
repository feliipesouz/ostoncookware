import { draftMode, headers } from "next/headers";
import Link from "next/link";

export async function PreviewBanner() {
  const draft = await draftMode();
  if (!draft.isEnabled) {
    return null;
  }
  const pathname = (await headers()).get("x-pathname") ?? "";
  if (pathname.startsWith("/admin") || pathname.startsWith("/api")) {
    return null;
  }

  return (
    <div className="relative z-[60] border-b border-accent/30 bg-surface-inverse text-foreground-inverse">
      <div className="site-grid flex items-center justify-between gap-4 py-2 text-[0.65rem] tracking-[0.22em] uppercase">
        <p>Modo de preview — Este conteúdo ainda não está publicado.</p>
        <Link href="/api/preview/disable" className="text-accent underline-offset-4 hover:underline">
          Sair do preview
        </Link>
      </div>
    </div>
  );
}
