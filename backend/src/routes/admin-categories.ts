import type { FastifyInstance } from "fastify";
import { z } from "zod";
import {
  CategoryAdminError,
  createCategory,
  deleteCategory,
  listAdminCategories,
  updateCategory,
} from "../services/admin-category.service.js";

const emojiSchema = z.string().trim().min(1).max(16);

const createCategorySchema = z.object({
  name: z.string().trim().min(1).max(80),
  emoji: emojiSchema.optional(),
});

const updateCategorySchema = z
  .object({
    name: z.string().trim().min(1).max(80).optional(),
    emoji: emojiSchema.optional(),
  })
  .refine((data) => data.name !== undefined || data.emoji !== undefined, {
    message: "At least one field is required",
  });

function handleCategoryError(error: unknown, reply: import("fastify").FastifyReply) {
  if (error instanceof CategoryAdminError) {
    return reply.status(error.statusCode).send({ error: error.message });
  }
  throw error;
}

export async function adminCategoryRoutes(app: FastifyInstance) {
  const auth = { preHandler: [app.authenticate] };

  app.get("/api/admin/categories", auth, async (_request, reply) => {
    const categories = await listAdminCategories(app.prisma);
    return reply.send(categories);
  });

  app.post("/api/admin/categories", auth, async (request, reply) => {
    const parsed = createCategorySchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten().fieldErrors });
    }

    try {
      const category = await createCategory(app.prisma, parsed.data);
      return reply.status(201).send(category);
    } catch (error) {
      return handleCategoryError(error, reply);
    }
  });

  app.put("/api/admin/categories/:id", auth, async (request, reply) => {
    const { id } = request.params as { id: string };
    const parsed = updateCategorySchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten().fieldErrors });
    }

    try {
      const category = await updateCategory(app.prisma, id, parsed.data);
      return reply.send(category);
    } catch (error) {
      return handleCategoryError(error, reply);
    }
  });

  app.delete("/api/admin/categories/:id", auth, async (request, reply) => {
    const { id } = request.params as { id: string };

    try {
      await deleteCategory(app.prisma, id);
      return reply.status(204).send();
    } catch (error) {
      return handleCategoryError(error, reply);
    }
  });
}
