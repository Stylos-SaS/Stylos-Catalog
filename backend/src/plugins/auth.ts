import jwt from "@fastify/jwt";
import fp from "fastify-plugin";
import type { FastifyReply, FastifyRequest } from "fastify";
import { config } from "../config.js";

async function authPlugin(app: import("fastify").FastifyInstance) {
  await app.register(jwt, {
    secret: config.JWT_SECRET!,
    sign: { expiresIn: "7d" },
  });

  app.decorate("authenticate", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify();
    } catch {
      return reply.status(401).send({ error: "Unauthorized" });
    }
  });
}

export default fp(authPlugin, { name: "auth-plugin" });
