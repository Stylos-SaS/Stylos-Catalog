import type { FastifyInstance } from "fastify";
import { toCategoryDTO } from "../lib/mappers.js";

export async function categoryRoutes(app: FastifyInstance) {
  app.get("/api/categories", async (_request, reply) => {
    const categories = await app.prisma.categoria.findMany({
      orderBy: { nombre: "asc" },
    });

    return reply.send(categories.map(toCategoryDTO));
  });
}
