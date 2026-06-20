import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import type { AppPrismaClient } from "../lib/db.js";
import { createPrismaClient } from "../lib/db.js";

declare module "fastify" {
  interface FastifyInstance {
    prisma: AppPrismaClient;
  }
}

async function prismaPlugin(app: FastifyInstance) {
  const prisma = createPrismaClient();
  await prisma.$connect();
  app.decorate("prisma", prisma);

  app.addHook("onClose", async (instance) => {
    await instance.prisma.$disconnect();
  });
}

export default fp(prismaPlugin, { name: "prisma" });
