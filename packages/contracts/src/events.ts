import { z } from "zod";

export const publicEventSchema = z
  .object({
    type: z.literal("catalog_download"),
  })
  .strict();

export type PublicEvent = z.infer<typeof publicEventSchema>;
