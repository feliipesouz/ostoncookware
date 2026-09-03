import type { MediaSummary } from "@oston/contracts";

export function toMediaSummary(media: {
  id: string;
  url: string;
  pathname: string;
  alt: string | null;
  mimeType: string;
  width: number | null;
  height: number | null;
  type: "IMAGE" | "VIDEO" | "DOCUMENT";
} | null): MediaSummary | null {
  if (!media) {
    return null;
  }

  return {
    id: media.id,
    url: media.url,
    pathname: media.pathname,
    alt: media.alt,
    mimeType: media.mimeType,
    width: media.width,
    height: media.height,
    type: media.type,
  };
}
