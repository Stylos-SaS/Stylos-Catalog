import type { FastifyInstance } from "fastify";
import { z } from "zod";
import {
  getStoreSettings,
  StoreSettingsError,
  updateStoreSettings,
} from "../services/store-settings.service.js";

const updateStoreSettingsSchema = z
  .object({
    whatsappNumber: z.string().trim().min(1).optional(),
    contactEmail: z.string().trim().email().optional(),
    contactInstagram: z.string().trim().min(1).max(80).optional(),
  })
  .refine(
    (data) =>
      data.whatsappNumber !== undefined ||
      data.contactEmail !== undefined ||
      data.contactInstagram !== undefined,
    { message: "At least one field is required" },
  );

function handleStoreSettingsError(error: unknown, reply: import("fastify").FastifyReply) {
  if (error instanceof StoreSettingsError) {
    return reply.status(error.statusCode).send({ error: error.message });
  }
  throw error;
}

export async function storeSettingsRoutes(app: FastifyInstance) {
  app.get("/api/settings/store", async (_request, reply) => {
    const settings = await getStoreSettings(app.prisma);
    return reply.send(settings);
  });
}

export async function adminStoreSettingsRoutes(app: FastifyInstance) {
  const auth = { preHandler: [app.authenticate] };

  app.get("/api/admin/store-settings", auth, async (_request, reply) => {
    const settings = await getStoreSettings(app.prisma);
    return reply.send(settings);
  });

  app.patch("/api/admin/store-settings", auth, async (request, reply) => {
    const parsed = updateStoreSettingsSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten().fieldErrors });
    }

    try {
      const settings = await updateStoreSettings(app.prisma, parsed.data);
      return reply.send(settings);
    } catch (error) {
      return handleStoreSettingsError(error, reply);
    }
  });
}
