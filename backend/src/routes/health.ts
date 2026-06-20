import type { FastifyInstance } from "fastify";

export async function healthRoutes(app: FastifyInstance) {
  app.get("/health", async (_request, reply) => {
    try {
      await app.prisma.$queryRaw`SELECT 1`;
      return reply.send({ ok: true, service: "stylos-api", db: "connected" });
    } catch {
      return reply.status(503).send({ ok: false, service: "stylos-api", db: "disconnected" });
    }
  });
}
