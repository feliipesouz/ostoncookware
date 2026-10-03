/**
 * Bundled editorial and catalogue assets may be stored as absolute CMS URLs.
 * Resolve only our own asset directories locally so Next Image does not fetch
 * the application through its remote-image optimizer. External media stays remote.
 */
export function imageSource(source: string, siteUrl = process.env.NEXT_PUBLIC_SITE_URL): string {
  if (!siteUrl || !/^https?:\/\//i.test(source)) return source;

  try {
    const image = new URL(source);
    const site = new URL(siteUrl);
    const isBundledAsset =
      image.pathname.startsWith("/catalogo/") || image.pathname.startsWith("/editorial/");
    if (image.origin === site.origin && isBundledAsset) {
      return `${image.pathname}${image.search}${image.hash}`;
    }
  } catch {
    // Let the existing media validation/image boundary handle malformed input.
  }
  return source;
}
