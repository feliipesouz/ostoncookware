import { validateRedirect } from "./redirect-validate.js";

type RedirectDb = {
  redirect: {
    findMany: (args: { where?: { active?: boolean } }) => Promise<
      { sourcePath: string; destination: string; active: boolean }[]
    >;
    upsert: (args: {
      where: { sourcePath: string };
      create: {
        sourcePath: string;
        destination: string;
        statusCode: number;
        active: boolean;
        createdById?: string | null;
      };
      update: { destination: string; statusCode: number; active: boolean };
    }) => Promise<unknown>;
  };
};

export function publicCollectionPath(slug: string) {
  return `/colecoes/${slug}`;
}

export function publicProductPath(slug: string) {
  return `/produtos/${slug}`;
}

export async function createSlugRedirect(
  db: RedirectDb,
  input: {
    kind: "collection" | "product";
    oldSlug: string;
    newSlug: string;
    createdById?: string | null;
  },
) {
  if (!input.oldSlug || !input.newSlug || input.oldSlug === input.newSlug) {
    return null;
  }

  const toPath = input.kind === "collection" ? publicCollectionPath : publicProductPath;
  const existing = await db.redirect.findMany({ where: { active: true } });
  const parsed = validateRedirect({
    sourcePath: toPath(input.oldSlug),
    destination: toPath(input.newSlug),
    existing,
  });

  return db.redirect.upsert({
    where: { sourcePath: parsed.sourcePath },
    create: {
      sourcePath: parsed.sourcePath,
      destination: parsed.destination,
      statusCode: 301,
      active: true,
      createdById: input.createdById ?? null,
    },
    update: {
      destination: parsed.destination,
      statusCode: 301,
      active: true,
    },
  });
}
