import { prisma } from "@oston/database";
import {
  defaultHomepageSections,
  homepageMediaIds,
  homepageSectionsSchema,
  homepageWriteSchema,
  withInstitutionalHero,
  type HomepageSection,
  type HomepageWrite,
} from "@oston/contracts";
import { HttpError } from "../../../lib/errors.js";
import { toMediaSummary } from "../../../lib/media.js";
import { versionConflictError } from "../../../lib/occ.js";

const HOMEPAGE_ID = "default";

function parseSections(value: unknown): HomepageSection[] {
  const parsed = homepageSectionsSchema.safeParse(value);
  return withInstitutionalHero(parsed.success ? parsed.data : defaultHomepageSections);
}

async function hydrateSections(sections: HomepageSection[]) {
  const imageIds = homepageMediaIds(sections);
  const media =
    imageIds.length > 0
      ? await prisma.mediaAsset.findMany({ where: { id: { in: imageIds } } })
      : [];
  const byId = new Map(media.map((item) => [item.id, toMediaSummary(item)]));

  return sections.map((section) => {
    if (section.type === "BRAND_HERO") {
      return {
        ...section,
        desktopImage: section.desktopImageId ? byId.get(section.desktopImageId) ?? null : null,
        mobileImage: section.mobileImageId ? byId.get(section.mobileImageId) ?? null : null,
      };
    }
    if ("imageId" in section && section.imageId) return { ...section, image: byId.get(section.imageId) ?? null };
    return section;
  });
}

export async function getHomepage() {
  const existing = await prisma.homepage.findUnique({ where: { id: HOMEPAGE_ID } });
  // Reads must not create rows or race on first access to a new environment.
  const row = existing ?? { id: HOMEPAGE_ID, sections: defaultHomepageSections, version: 1, updatedAt: new Date(0) };

  const sections = parseSections(row.sections);
  return {
    id: row.id,
    sections: await hydrateSections(sections),
    version: row.version,
    updatedAt: row.updatedAt,
  };
}

export async function updateHomepage(input: HomepageWrite) {
  const payload = homepageWriteSchema.parse(input);
  const imageIds = homepageMediaIds(payload.sections);
  if (imageIds.length) {
    const images = await prisma.mediaAsset.findMany({ where: { id: { in: imageIds }, type: "IMAGE" }, select: { id: true } });
    if (images.length !== imageIds.length) {
      throw new HttpError(400, "Selecione imagens existentes na biblioteca de mídia.", { code: "VALIDATION_ERROR" });
    }
  }

  const saved = await prisma.$transaction(async (tx) => {
    // A no-op upsert can be emulated as read/create by Prisma and race on first save.
    // Let PostgreSQL serialize competing inserts before applying the version check.
    await tx.homepage.createMany({
      data: [{ id: HOMEPAGE_ID, sections: defaultHomepageSections, version: 1 }],
      skipDuplicates: true,
    });
    const updated = await tx.homepage.updateMany({
      where: { id: HOMEPAGE_ID, version: payload.expectedVersion },
      data: { sections: payload.sections, version: { increment: 1 } },
    });
    const current = await tx.homepage.findUniqueOrThrow({ where: { id: HOMEPAGE_ID } });
    if (updated.count !== 1) throw versionConflictError(current);
    return current;
  });

  return {
    id: saved.id,
    sections: await hydrateSections(parseSections(saved.sections)),
    version: saved.version,
    updatedAt: saved.updatedAt,
  };
}

export function seasonalCampaignSlot(sections: HomepageSection[]) {
  const slot = sections.find(
    (section) => (section.type === "SEASONAL_CAMPAIGN" || section.type === "HERO" || section.type === "hero_campaign") && section.enabled,
  );
  return { enabled: Boolean(slot), campaignId: slot && "campaignId" in slot ? slot.campaignId ?? null : null };
}

/** A campaign preview is visible even when its homepage slot is currently disabled. */
export function withCampaignPreviewSlot<T extends HomepageSection>(sections: T[]): HomepageSection[] {
  const isSeasonal = (section: HomepageSection) => ["SEASONAL_CAMPAIGN", "HERO", "hero_campaign"].includes(section.type);
  const index = sections.findIndex(isSeasonal);
  if (index !== -1) {
    return sections.map((section, sectionIndex) => isSeasonal(section) ? { ...section, enabled: sectionIndex === index } : section);
  }
  const ids = new Set(sections.map((section) => section.id));
  let id = "campaign-preview";
  for (let suffix = 2; ids.has(id); suffix += 1) id = `campaign-preview-${suffix}`;
  const result: HomepageSection[] = [...sections];
  const heroIndex = sections.findIndex((section) => section.type === "BRAND_HERO");
  result.splice(heroIndex + 1, 0, { id, type: "SEASONAL_CAMPAIGN", enabled: true });
  return result;
}
