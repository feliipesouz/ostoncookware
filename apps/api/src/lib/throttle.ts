import { prisma } from "@oston/database";
import { HttpError } from "./errors.js";

const WINDOW_MS = {
  "lead:ip": 10 * 60 * 1000,
  "upload:user": 60 * 1000,
  "catalog:ip": 10 * 60 * 1000,
  "redirect:lookup": 60 * 1000,
} as const;

const LIMIT = {
  "lead:ip": 6,
  "upload:user": 20,
  "catalog:ip": 8,
  "redirect:lookup": 60,
} as const;

export async function consumeThrottle(kind: keyof typeof LIMIT, identity: string) {
  const key = `${kind}:${identity.slice(0, 200)}`;
  const now = new Date();
  const windowMs = WINDOW_MS[kind];
  const max = LIMIT[kind];
  const expiresAt = new Date(now.getTime() + windowMs);

  const result = await prisma.$transaction(async (tx) => {
    const existing = await tx.throttle.findUnique({ where: { key } });

    if (!existing || existing.expiresAt <= now) {
      return tx.throttle.upsert({
        where: { key },
        create: { key, count: 1, windowStart: now, expiresAt },
        update: { count: 1, windowStart: now, expiresAt },
      });
    }

    if (existing.count >= max) {
      return { blocked: true as const, retryAt: existing.expiresAt };
    }

    const updated = await tx.throttle.update({
      where: { key },
      data: { count: { increment: 1 } },
    });
    return updated;
  });

  if ("blocked" in result && result.blocked) {
    throw new HttpError(429, "Muitas tentativas. Aguarde alguns minutos.", {
      code: "RATE_LIMITED",
    });
  }
}
