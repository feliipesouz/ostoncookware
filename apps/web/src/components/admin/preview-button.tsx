"use client";

import { previewHref } from "@/lib/preview";

export function PreviewButton({
  type,
  slug,
  id,
  path,
  label = "Visualizar preview",
}: {
  type: "product" | "collection" | "campaign" | "page" | "home";
  slug?: string;
  id?: string;
  path: string;
  label?: string;
}) {
  if (!path) {
    return null;
  }

  return (
    <a
      href={previewHref({ type, slug, id, path })}
      target="_blank"
      rel="noreferrer"
      className="border border-border px-5 py-2 text-sm"
    >
      {label}
    </a>
  );
}
