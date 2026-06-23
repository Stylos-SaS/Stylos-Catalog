import type { FastifyInstance } from "fastify";
import { z } from "zod";
import {
  AuthError,
  changeAdminPassword,
  toAdminProfile,
  updateAdminProfile,
  verifyAdminCredentials,
} from "../services/auth.service.js";

const loginSchema = z.object({
  username: z.string().trim().min(1),
  password: z.string().min(1),
});

const updateProfileSchema = z.object({
  nombre: z.string().trim().min(1).max(80),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6),
});

function handleAuthError(error: unknown, reply: import("fastify").FastifyReply) {
  if (error instanceof AuthError) {
    return reply.status(error.statusCode).send({ error: error.message });
  }
  throw error;
}

export async function authRoutes(app: FastifyInstance) {
  app.post(
    "/api/auth/login",
    {
      config: {
        rateLimit: {
          max: 10,
          timeWindow: "15 minutes",
        },
      },
    },
    async (request, reply) => {
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
  },
  );

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

  app.patch(
    "/api/auth/profile",
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const parsed = updateProfileSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: parsed.error.flatten().fieldErrors });
      }

      try {
        const user = await updateAdminProfile(app.prisma, request.user.sub, parsed.data);
        return reply.send({ user });
      } catch (error) {
        return handleAuthError(error, reply);
      }
    },
  );

  app.patch(
    "/api/auth/password",
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const parsed = changePasswordSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: parsed.error.flatten().fieldErrors });
      }

      try {
        await changeAdminPassword(
          app.prisma,
          request.user.sub,
          parsed.data.currentPassword,
          parsed.data.newPassword,
        );
        return reply.send({ ok: true });
      } catch (error) {
        return handleAuthError(error, reply);
      }
    },
  );
}
