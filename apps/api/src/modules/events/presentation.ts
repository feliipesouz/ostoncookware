import type { FastifyInstance } from "fastify";
import { publicEventSchema } from "@oston/contracts";
import { prisma } from "@oston/database";
import { sendProblem } from "../../lib/errors.js";
import { clientIp } from "../../lib/http.js";
import { consumeThrottle } from "../../lib/throttle.js";
import { createHash } from "node:crypto";

export async function registerEventRoutes(app: FastifyInstance) {
  app.post("/v1/public/events", async (request, reply) => {
    try {
      const payload = publicEventSchema.parse(request.body);
      const ip = clientIp(request);
      await consumeThrottle("catalog:ip", ip);
      await prisma.businessEvent.create({
        data: {
          type: payload.type,
          ipHash: createHash("sha256").update(ip).digest("hex").slice(0, 32),
        },
      });
      return reply.status(204).send();
    } catch (error) {
      return sendProblem(request, reply, error);
    }
  });
}
