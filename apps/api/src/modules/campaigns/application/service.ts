import { prisma } from "@oston/database";
import { campaignWriteSchema, paginationQuerySchema, type CampaignWrite } from "@oston/contracts";
import { humanChangeSummary } from "../../../lib/change-summary.js";
import { HttpError } from "../../../lib/errors.js";
import { focalToApi, focalToDb } from "../../../lib/mappers.js";
import { toMediaSummary } from "../../../lib/media.js";
import { requireExpectedVersion, throwIfVersionConflict, type ContentActor, updateWhereVersion } from "../../../lib/occ.js";
import { toPage } from "../../../lib/pagination.js";
import { createRevision, diffSummary } from "../../../lib/revisions.js";
import { assertInTrash, trashWhere } from "../../../lib/soft-delete.js";
import { resolveActiveCampaign } from "../domain/resolve-active-campaign.js";

const include = {
  desktopImage: true,
  mobileImage: true,
  video: true,
  updatedBy: { select: { id: true, name: true } },
} as const;

type CampaignRow = Awaited<ReturnType<typeof prisma.campaign.findFirstOrThrow>>;

async function load(id: string) {
  const campaign = await prisma.campaign.findUnique({ where: { id }, include });
  if (!campaign) {
    throw new HttpError(404, "Campanha não encontrada.", { code: "NOT_FOUND" });
  }
  return campaign;
}

function mapCampaign(campaign: Awaited<ReturnType<typeof load>>) {
  return {
    id: campaign.id,
    name: campaign.name,
    eyebrow: campaign.eyebrow,
    title: campaign.title,
    subtitle: campaign.subtitle,
    desktopImage: toMediaSummary(campaign.desktopImage),
    mobileImage: toMediaSummary(campaign.mobileImage),
    video: toMediaSummary(campaign.video),
    imageAlt: campaign.imageAlt,
    primaryCtaLabel: campaign.primaryCtaLabel,
    primaryCtaUrl: campaign.primaryCtaUrl,
    secondaryCtaLabel: campaign.secondaryCtaLabel,
    secondaryCtaUrl: campaign.secondaryCtaUrl,
    textAlign: campaign.textAlign,
    focalPosition: focalToApi(campaign.focalPosition),
    overlay: campaign.overlay,
    startsAt: campaign.startsAt,
    endsAt: campaign.endsAt,
    status: campaign.status,
    sortOrder: campaign.sortOrder,
    collectionId: campaign.collectionId,
    version: campaign.version,
    deletedAt: campaign.deletedAt,
    createdAt: campaign.createdAt,
    updatedAt: campaign.updatedAt,
  };
}

function toDbData(input: CampaignWrite, actor?: ContentActor) {
  const data = campaignWriteSchema.parse(input);
  return {
    name: data.name,
    eyebrow: data.eyebrow ?? null,
    title: data.title,
    subtitle: data.subtitle ?? null,
    desktopImageId: data.desktopImageId,
    mobileImageId: data.mobileImageId,
    videoId: data.videoId ?? null,
    imageAlt: data.imageAlt,
    primaryCtaLabel: data.primaryCtaLabel,
    primaryCtaUrl: data.primaryCtaUrl,
    secondaryCtaLabel: data.secondaryCtaLabel ?? null,
    secondaryCtaUrl: data.secondaryCtaUrl ?? null,
    textAlign: data.textAlign,
    focalPosition: focalToDb(data.focalPosition),
    overlay: data.overlay,
    startsAt: data.startsAt ?? null,
    endsAt: data.endsAt ?? null,
    status: data.status,
    sortOrder: data.sortOrder,
    collectionId: data.collectionId ?? null,
    updatedById: actor?.id ?? null,
  };
}

function toSnapshot(input: CampaignWrite) {
  const data = campaignWriteSchema.parse(input);
  return { ...data, expectedVersion: undefined };
}

export async function listCampaigns(query: unknown = {}) {
  const pagination = paginationQuerySchema.parse(query);
  const where = trashWhere(query);
  const [rows, total] = await prisma.$transaction([
    prisma.campaign.findMany({
      where,
      include,
      orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }, { id: "desc" }],
      skip: (pagination.page - 1) * pagination.pageSize,
      take: pagination.pageSize,
    }),
    prisma.campaign.count({ where }),
  ]);
  return toPage(rows.map(mapCampaign), total, pagination.page, pagination.pageSize);
}

export async function getCampaign(id: string) {
  return mapCampaign(await load(id));
}

export async function getActiveCampaign(now = new Date()) {
  const rows = await prisma.campaign.findMany({
    where: {
      deletedAt: null,
      status: { in: ["PUBLISHED", "SCHEDULED"] },
      AND: [
        { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
        { OR: [{ endsAt: null }, { endsAt: { gt: now } }] },
      ],
    },
    include,
  });
  const active = resolveActiveCampaign(rows, now);
  return active ? mapCampaign(active) : null;
}

export async function createCampaign(input: CampaignWrite, actor?: ContentActor) {
  const snapshot = toSnapshot(input);
  const created = await prisma.$transaction(async (tx) => {
    const row = await tx.campaign.create({
      data: { ...toDbData(input, actor), version: 1 },
      include,
    });
    await createRevision(tx, {
      entityType: "campaign",
      entityId: row.id,
      version: 1,
      snapshot,
      changedById: actor?.id,
      changeSummary: "Criação inicial.",
    });
    return row;
  });
  return mapCampaign(created);
}

export async function updateCampaign(id: string, input: CampaignWrite, actor?: ContentActor) {
  const current = await load(id);
  if (current.deletedAt) {
    throw new HttpError(404, "Campanha não encontrada.", { code: "NOT_FOUND" });
  }
  const data = campaignWriteSchema.parse(input);
  const expectedVersion = requireExpectedVersion(data.expectedVersion);
  const snapshot = toSnapshot(input);
  const previous = toSnapshot({
    ...data,
    name: current.name,
    eyebrow: current.eyebrow,
    title: current.title,
    subtitle: current.subtitle,
    desktopImageId: current.desktopImageId,
    mobileImageId: current.mobileImageId,
    videoId: current.videoId,
    imageAlt: current.imageAlt,
    primaryCtaLabel: current.primaryCtaLabel,
    primaryCtaUrl: current.primaryCtaUrl,
    secondaryCtaLabel: current.secondaryCtaLabel,
    secondaryCtaUrl: current.secondaryCtaUrl,
    textAlign: current.textAlign,
    focalPosition: focalToApi(current.focalPosition),
    overlay: current.overlay,
    startsAt: current.startsAt,
    endsAt: current.endsAt,
    status: current.status,
    sortOrder: current.sortOrder,
    collectionId: current.collectionId,
  });

  await prisma.$transaction(async (tx) => {
    const updated = await tx.campaign.updateMany({
      where: updateWhereVersion(id, expectedVersion),
      data: { ...toDbData(input, actor), version: { increment: 1 } },
    });
    if (updated.count === 0) {
      const latest = await tx.campaign.findUnique({
        where: { id },
        include: { updatedBy: { select: { name: true } } },
      });
      throwIfVersionConflict(latest, updated.count);
    }
    await createRevision(tx, {
      entityType: "campaign",
      entityId: id,
      version: expectedVersion + 1,
      snapshot,
      changedById: actor?.id,
      changeSummary: humanChangeSummary(diffSummary(previous, snapshot)),
    });
  });

  return getCampaign(id);
}

export async function archiveCampaign(id: string) {
  await load(id);
  const updated = await prisma.campaign.update({
    where: { id },
    data: { status: "ARCHIVED", version: { increment: 1 } },
    include,
  });
  return mapCampaign(updated);
}

export async function softDeleteCampaign(id: string, actor?: ContentActor) {
  await load(id);
  const updated = await prisma.campaign.update({
    where: { id },
    data: { deletedAt: new Date(), status: "ARCHIVED", version: { increment: 1 }, updatedById: actor?.id ?? null },
    include,
  });
  return mapCampaign(updated);
}

export async function restoreCampaign(id: string, actor?: ContentActor) {
  await load(id);
  const updated = await prisma.campaign.update({
    where: { id },
    data: { deletedAt: null, version: { increment: 1 }, updatedById: actor?.id ?? null },
    include,
  });
  return mapCampaign(updated);
}

export async function hardDeleteCampaign(id: string) {
  const row = await load(id);
  assertInTrash(row);
  await prisma.campaign.delete({ where: { id } });
}

export type { CampaignRow };
