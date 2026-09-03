import { prisma } from "@oston/database";
import { announcementWriteSchema, paginationQuerySchema, type AnnouncementWrite } from "@oston/contracts";
import { HttpError } from "../../../lib/errors.js";
import { toPage } from "../../../lib/pagination.js";

function mapAnnouncement(row: {
  id: string;
  message: string;
  ctaLabel: string | null;
  ctaUrl: string | null;
  active: boolean;
  startsAt: Date | null;
  endsAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: row.id,
    message: row.message,
    ctaLabel: row.ctaLabel,
    ctaUrl: row.ctaUrl,
    active: row.active,
    startsAt: row.startsAt,
    endsAt: row.endsAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function isLive(row: ReturnType<typeof mapAnnouncement>, now = new Date()) {
  if (!row.active) return false;
  if (row.startsAt && row.startsAt > now) return false;
  if (row.endsAt && row.endsAt < now) return false;
  return true;
}

export async function listAnnouncements(query: unknown = {}) {
  const pagination = paginationQuerySchema.parse(query);
  const [rows, total] = await prisma.$transaction([
    prisma.announcement.findMany({
      orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
      skip: (pagination.page - 1) * pagination.pageSize,
      take: pagination.pageSize,
    }),
    prisma.announcement.count(),
  ]);
  return toPage(rows.map(mapAnnouncement), total, pagination.page, pagination.pageSize);
}

export async function getAnnouncement(id: string) {
  const row = await prisma.announcement.findUnique({ where: { id } });
  if (!row) {
    throw new HttpError(404, "Anúncio não encontrado.", { code: "NOT_FOUND" });
  }
  return mapAnnouncement(row);
}

export async function getActiveAnnouncement() {
  const rows = await prisma.announcement.findMany({
    where: { active: true },
    orderBy: [{ updatedAt: "desc" }],
    take: 20,
  });
  return rows.map(mapAnnouncement).find((row) => isLive(row)) ?? null;
}

export async function createAnnouncement(input: AnnouncementWrite) {
  const data = announcementWriteSchema.parse(input);
  const created = await prisma.announcement.create({
    data: {
      message: data.message,
      ctaLabel: data.ctaLabel ?? null,
      ctaUrl: data.ctaUrl ?? null,
      active: data.active,
      startsAt: data.startsAt ?? null,
      endsAt: data.endsAt ?? null,
    },
  });
  return mapAnnouncement(created);
}

export async function updateAnnouncement(id: string, input: AnnouncementWrite) {
  await getAnnouncement(id);
  const data = announcementWriteSchema.parse(input);
  const updated = await prisma.announcement.update({
    where: { id },
    data: {
      message: data.message,
      ctaLabel: data.ctaLabel ?? null,
      ctaUrl: data.ctaUrl ?? null,
      active: data.active,
      startsAt: data.startsAt ?? null,
      endsAt: data.endsAt ?? null,
    },
  });
  return mapAnnouncement(updated);
}

export async function deactivateAnnouncement(id: string) {
  await getAnnouncement(id);
  const updated = await prisma.announcement.update({
    where: { id },
    data: { active: false },
  });
  return mapAnnouncement(updated);
}
