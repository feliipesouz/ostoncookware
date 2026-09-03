import { prisma } from "@oston/database";
import {
  defaultHomepageSections,
  homepageSectionsSchema,
  homepageWriteSchema,
  type HomepageSection,
  type HomepageWrite,
} from "@oston/contracts";
import { HttpError } from "../../../lib/errors.js";
import { toMediaSummary } from "../../../lib/media.js";

const HOMEPAGE_ID = "default";

function parseSections(value: unknown): HomepageSection[] {
  const parsed = homepageSectionsSchema.safeParse(value);
  return parsed.success ? parsed.data : defaultHomepageSections;
}

function sectionImageId(section: HomepageSection) {
  if (
    section.type === "EDITORIAL_FEATURE" ||
    section.type === "AMBASSADOR" ||
    section.type === "experience" ||
    section.type === "ambassador"
  ) {
    return "imageId" in section && typeof section.imageId === "string" ? section.imageId : null;
  }
  return null;
}

async function hydrateSections(sections: HomepageSection[]) {
  const imageIds = sections.map(sectionImageId).filter((id): id is string => Boolean(id));
  const media =
    imageIds.length > 0
      ? await prisma.mediaAsset.findMany({ where: { id: { in: imageIds } } })
      : [];
  const byId = new Map(media.map((item) => [item.id, toMediaSummary(item)]));

  return sections.map((section) => {
    const imageId = sectionImageId(section);
    if (!imageId) return section;
    return { ...section, image: byId.get(imageId) ?? null };
  });
}

export async function getHomepage() {
  const existing = await prisma.homepage.findUnique({ where: { id: HOMEPAGE_ID } });
  const row =
    existing ??
    (await prisma.homepage.create({
      data: { id: HOMEPAGE_ID, sections: defaultHomepageSections, version: 1 },
    }));

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
  const current = await prisma.homepage.findUnique({ where: { id: HOMEPAGE_ID } });
  const currentVersion = current?.version ?? 1;

  if (current && payload.expectedVersion !== undefined && currentVersion !== payload.expectedVersion) {
    throw new HttpError(409, "A homepage foi alterada por outra pessoa. Recarregue e tente de novo.", {
      code: "VERSION_CONFLICT",
    });
  }

  const saved = current
    ? await prisma.homepage.update({
        where: { id: HOMEPAGE_ID },
        data: { sections: payload.sections, version: currentVersion + 1 },
      })
    : await prisma.homepage.create({
        data: { id: HOMEPAGE_ID, sections: payload.sections, version: 1 },
      });

  return {
    id: saved.id,
    sections: await hydrateSections(parseSections(saved.sections)),
    version: saved.version,
    updatedAt: saved.updatedAt,
  };
}

export function heroCampaignId(sections: HomepageSection[]) {
  const hero = sections.find(
    (section) => (section.type === "HERO" || section.type === "hero_campaign") && section.enabled,
  );
  return hero && hero.type === "HERO" ? (hero.campaignId ?? null) : null;
}
