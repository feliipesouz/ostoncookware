import { prisma } from "@oston/database";
import { randomUUID } from "node:crypto";
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
  const windowMs = WINDOW_MS[kind];
  const max = LIMIT[kind];

  // The unique key locks competing requests inside one PostgreSQL statement.
  // Read/check/increment in a normal transaction still races at Read Committed.
  // The database clock also keeps the window consistent across serverless instances.
  const result = await prisma.$queryRaw<Array<{ count: number }>>`
    INSERT INTO "throttle" ("id", "key", "count", "windowStart", "expiresAt")
    VALUES (
      ${randomUUID()}, ${key}, 1, CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP + (${windowMs} * INTERVAL '1 millisecond')
    )
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE
        WHEN "throttle"."expiresAt" <= CURRENT_TIMESTAMP THEN 1
        ELSE "throttle"."count" + 1
      END,
      "windowStart" = CASE
        WHEN "throttle"."expiresAt" <= CURRENT_TIMESTAMP THEN CURRENT_TIMESTAMP
        ELSE "throttle"."windowStart"
      END,
      "expiresAt" = CASE
        WHEN "throttle"."expiresAt" <= CURRENT_TIMESTAMP
          THEN CURRENT_TIMESTAMP + (${windowMs} * INTERVAL '1 millisecond')
        ELSE "throttle"."expiresAt"
      END
    WHERE "throttle"."expiresAt" <= CURRENT_TIMESTAMP OR "throttle"."count" < ${max}
    RETURNING "count"
  `;

  if (result.length === 0) {
    const blocked = await prisma.throttle.findUnique({
      where: { key },
      select: { expiresAt: true },
    });
    const retryAfterSeconds = Math.max(1, Math.ceil(
      ((blocked?.expiresAt.getTime() ?? Date.now() + windowMs) - Date.now()) / 1000,
    ));
    throw new HttpError(429, "Muitas tentativas. Aguarde alguns minutos.", {
      code: "RATE_LIMITED",
      meta: { retryAfterSeconds },
    });
  }
}
