import { randomUUID } from "node:crypto";
import {
  ALLOWED_DOCUMENT_MIME_TYPES,
  ALLOWED_IMAGE_MIME_TYPES,
  ALLOWED_VIDEO_MIME_TYPES,
  extensionForMime,
  mediaCompleteSchema,
  mediaListQuerySchema,
  mediaUpdateSchema,
  sanitizeFilename,
  type MediaType,
} from "@oston/contracts";
import { prisma } from "@oston/database";
import { del, head } from "@vercel/blob";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { loadEnv } from "../../../config/env.js";
import { HttpError } from "../../../lib/errors.js";
import { toPage } from "../../../lib/pagination.js";
import { consumeThrottle } from "../../../lib/throttle.js";
import { allowedFor, assertSafeBlobPath, assertUpload, isTrustedBlobUrl } from "./upload-rules.js";

export { assertSafeBlobPath, assertUpload, isTrustedBlobUrl };

export async function listMedia(query: unknown) {
  const parsed = mediaListQuerySchema.parse(query);
  const tags = parsed.tags
    ? parsed.tags
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
    : [];

  const where = {
    ...(parsed.type ? { type: parsed.type } : {}),
    ...(parsed.missingAlt ? { OR: [{ alt: null }, { alt: "" }] } : {}),
    ...(tags.length > 0 ? { tags: { hasSome: tags } } : {}),
    ...(parsed.q
      ? {
          AND: [
            {
              OR: [
                { originalFilename: { contains: parsed.q, mode: "insensitive" as const } },
                { alt: { contains: parsed.q, mode: "insensitive" as const } },
              ],
            },
          ],
        }
      : {}),
  };

  const [rows, total] = await prisma.$transaction([
    prisma.mediaAsset.findMany({
      where: where as never,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: (parsed.page - 1) * parsed.pageSize,
      take: parsed.pageSize,
    }),
    prisma.mediaAsset.count({ where: where as never }),
  ]);

  return toPage(rows, total, parsed.page, parsed.pageSize);
}

export async function getMedia(id: string) {
  const media = await prisma.mediaAsset.findUnique({ where: { id } });
  if (!media) {
    throw new HttpError(404, "Mídia não encontrada.", { code: "NOT_FOUND" });
  }
  return media;
}

export async function updateMedia(id: string, input: unknown) {
  const data = mediaUpdateSchema.parse(input);
  await getMedia(id);
  return prisma.mediaAsset.update({
    where: { id },
    data: {
      ...(data.alt !== undefined ? { alt: data.alt } : {}),
      ...(data.focalX !== undefined ? { focalX: data.focalX } : {}),
      ...(data.focalY !== undefined ? { focalY: data.focalY } : {}),
      ...(data.tags !== undefined ? { tags: data.tags } : {}),
    } as never,
  });
}

type MediaUsageItem = {
  type: "campaign" | "collection" | "product" | "settings";
  id: string;
  name: string;
  href: string;
};

export async function getMediaUsage(id: string): Promise<MediaUsageItem[]> {
  const [campaigns, collections, products, settings] = await Promise.all([
    prisma.campaign.findMany({
      where: { OR: [{ desktopImageId: id }, { mobileImageId: id }, { videoId: id }] },
      select: { id: true, name: true },
    }),
    prisma.collection.findMany({
      where: {
        OR: [{ coverImageId: id }, { ogImageId: id }, { images: { some: { mediaId: id } } }],
      },
      select: { id: true, name: true },
    }),
    prisma.product.findMany({
      where: { OR: [{ ogImageId: id }, { images: { some: { mediaId: id } } }] },
      select: { id: true, name: true },
    }),
    prisma.siteSettings.findMany({
      where: {
        OR: [
          { logoId: id },
          { logoInverseId: id },
          { faviconId: id },
          { defaultOgImageId: id },
          { catalogPdfId: id },
        ],
      },
      select: { id: true, brandName: true },
    }),
  ]);

  return [
    ...campaigns.map((item) => ({
      type: "campaign" as const,
      id: item.id,
      name: item.name,
      href: `/admin/campanhas/${item.id}`,
    })),
    ...collections.map((item) => ({
      type: "collection" as const,
      id: item.id,
      name: item.name,
      href: `/admin/colecoes/${item.id}`,
    })),
    ...products.map((item) => ({
      type: "product" as const,
      id: item.id,
      name: item.name,
      href: `/admin/produtos/${item.id}`,
    })),
    ...settings.map((item) => ({
      type: "settings" as const,
      id: item.id,
      name: item.brandName || "Configurações do site",
      href: "/admin/configuracoes",
    })),
  ];
}

export function mediaInUseMessage(usages: MediaUsageItem[]) {
  if (usages.length === 0) {
    return "";
  }

  const byType = {
    product: usages.filter((item) => item.type === "product"),
    collection: usages.filter((item) => item.type === "collection"),
    campaign: usages.filter((item) => item.type === "campaign"),
    settings: usages.filter((item) => item.type === "settings"),
  };

  const parts: string[] = [];
  if (byType.product.length > 0) {
    const names = byType.product.map((item) => item.name).join(", ");
    parts.push(
      `${byType.product.length} ${byType.product.length === 1 ? "produto" : "produtos"} (${names})`,
    );
  }
  if (byType.collection.length > 0) {
    const names = byType.collection.map((item) => item.name).join(", ");
    parts.push(
      `${byType.collection.length} ${byType.collection.length === 1 ? "coleção" : "coleções"} (${names})`,
    );
  }
  if (byType.campaign.length > 0) {
    const names = byType.campaign.map((item) => item.name).join(", ");
    parts.push(
      `${byType.campaign.length} ${byType.campaign.length === 1 ? "campanha" : "campanhas"} (${names})`,
    );
  }
  if (byType.settings.length > 0) {
    parts.push("configurações do site");
  }

  return `Essa imagem ainda está sendo usada em ${parts.join(" e ")}.`;
}

export async function findMediaReferences(id: string) {
  const usages = await getMediaUsage(id);
  return usages.map((item) => item.type);
}

export async function completeMedia(input: unknown, createdById: string) {
  const data = mediaCompleteSchema.parse(input);
  assertUpload({ mimeType: data.mimeType, size: data.size, type: data.type });
  assertSafeBlobPath(data.pathname);

  const env = loadEnv();
  if (!env.BLOB_READ_WRITE_TOKEN) {
    throw new HttpError(503, "Upload de mídia não configurado neste ambiente.", {
      code: "BLOB_NOT_CONFIGURED",
    });
  }

  if (!isTrustedBlobUrl(data.url)) {
    throw new HttpError(400, "URL de mídia não reconhecida.", { code: "INVALID_BLOB" });
  }

  const meta = await head(data.url, { token: env.BLOB_READ_WRITE_TOKEN });
  if (!meta) {
    throw new HttpError(400, "Arquivo não encontrado no armazenamento.", { code: "BLOB_MISSING" });
  }

  const pathname = meta.pathname.replace(/^\//, "");
  const incoming = data.pathname.replace(/^\//, "");
  if (pathname !== incoming) {
    throw new HttpError(400, "O arquivo não corresponde ao caminho autorizado.", { code: "PATH_MISMATCH" });
  }

  const mimeType = meta.contentType?.split(";")[0]?.trim() || data.mimeType;
  assertUpload({ mimeType, size: meta.size, type: data.type });

  const existing = await prisma.mediaAsset.findUnique({ where: { pathname: data.pathname } });
  if (existing) {
    return existing;
  }

  return prisma.mediaAsset.create({
    data: {
      url: meta.url,
      pathname: data.pathname,
      originalFilename: sanitizeFilename(data.originalFilename),
      alt: data.alt ?? null,
      mimeType,
      size: meta.size,
      width: data.width ?? null,
      height: data.height ?? null,
      type: data.type,
      createdById,
    },
  });
}

export async function deleteMedia(id: string) {
  const media = await getMedia(id);
  const usages = await getMediaUsage(id);
  if (usages.length > 0) {
    throw new HttpError(409, mediaInUseMessage(usages), { code: "MEDIA_IN_USE" });
  }

  await prisma.mediaAsset.delete({ where: { id } });

  const env = loadEnv();
  if (env.BLOB_READ_WRITE_TOKEN && isTrustedBlobUrl(media.url)) {
    try {
      await del(media.url, { token: env.BLOB_READ_WRITE_TOKEN });
    } catch (error) {
      console.error("Falha ao remover blob após exclusão do registro", media.id, error);
    }
  }
}

export async function createUploadToken(
  body: HandleUploadBody,
  createdById: string,
  request: Request,
) {
  const env = loadEnv();
  if (!env.BLOB_READ_WRITE_TOKEN) {
    throw new HttpError(503, "Upload de mídia não configurado neste ambiente.", {
      code: "BLOB_NOT_CONFIGURED",
    });
  }

  await consumeThrottle("upload:user", createdById);

  return handleUpload({
    request,
    body,
    onBeforeGenerateToken: async (pathname, clientPayload) => {
      const payload = clientPayload
        ? (JSON.parse(clientPayload) as {
            mimeType?: string;
            size?: number;
            type?: MediaType;
          })
        : {};
      const mimeType = payload.mimeType ?? "application/octet-stream";
      const type = payload.type ?? "IMAGE";
      assertUpload({
        mimeType,
        size: payload.size ?? 0,
        type,
      });
      assertSafeBlobPath(pathname);
      const expectedExt = extensionForMime(mimeType);
      if (!pathname.toLowerCase().endsWith(`.${expectedExt}`) && !(mimeType === "image/jpeg" && pathname.toLowerCase().endsWith(".jpeg"))) {
        throw new HttpError(400, "Extensão não corresponde ao tipo do arquivo.", { code: "INVALID_PATH" });
      }
      return {
        allowedContentTypes: [
          ...ALLOWED_IMAGE_MIME_TYPES,
          ...ALLOWED_VIDEO_MIME_TYPES,
          ...ALLOWED_DOCUMENT_MIME_TYPES,
        ],
        maximumSizeInBytes: allowedFor(type).max,
        addRandomSuffix: true,
        tokenPayload: JSON.stringify({ createdById, pathname }),
        allowOverwrite: false,
      };
    },
    onUploadCompleted: async () => {
      // Localhost e alguns ambientes serverless não disparam o webhook.
      // A persistência oficial ocorre em POST /v1/admin/media/complete.
    },
    token: env.BLOB_READ_WRITE_TOKEN,
  });
}

export function suggestedBlobPath(mimeType: string) {
  return `oston/media/${randomUUID()}.${extensionForMime(mimeType)}`;
}
