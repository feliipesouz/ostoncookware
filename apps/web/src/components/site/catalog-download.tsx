"use client";

export function CatalogDownload({
  href,
  className,
  children = "Baixar catálogo",
}: {
  href: string;
  className?: string;
  children?: React.ReactNode;
}) {
  async function onClick() {
    try {
      await fetch("/v1/public/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "catalog_download" }),
      });
    } catch {
      // tracking is optional
    }
  }

  return (
    <a href={href} target="_blank" rel="noreferrer" className={className} onClick={onClick}>
      {children}
    </a>
  );
}
