import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { AuthError, toAdminProfile, verifyAdminCredentials } from "../services/auth.service.js";

const loginSchema = z.object({
  username: z.string().trim().min(1),
  password: z.string().min(1),
});

export async function authRoutes(app: FastifyInstance) {
  app.post("/api/auth/login", async (request, reply) => {
    const parsed = loginSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten().fieldErrors });
    }

    try {
      const admin = await verifyAdminCredentials(
        app.prisma,
        parsed.data.username,
        parsed.data.password,
      );

      const token = await reply.jwtSign({
        sub: admin.id,
        username: admin.username,
        nombre: admin.nombre,
      });

      return reply.send({
        token,
        user: toAdminProfile(admin),
      });
    } catch (error) {
      if (error instanceof AuthError) {
        return reply.status(error.statusCode).send({ error: error.message });
      }
      throw error;
    }
  });

  app.get(
    "/api/auth/me",
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const admin = await app.prisma.usuarioAdmin.findUnique({
        where: { id: request.user.sub },
      });

      if (!admin) {
        return reply.status(401).send({ error: "Unauthorized" });
      }

      return reply.send({ user: toAdminProfile(admin) });
    },
  );
}
