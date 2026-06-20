import Fastify from "fastify";
import cors from "@fastify/cors";
import { config } from "./config.js";
import { prismaPlugin } from "./plugins/prisma.js";
import { healthRoutes } from "./routes/health.js";
import { categoryRoutes } from "./routes/categories.js";
import { productRoutes } from "./routes/products.js";

export async function buildApp() {
  const app = Fastify({
    logger: config.NODE_ENV === "development",
  });

  await app.register(cors, {
    origin: config.corsOrigins,
    credentials: true,
  });

  app.setErrorHandler((error, _request, reply) => {
    app.log.error(error);
    const statusCode =
      error && typeof error === "object" && "statusCode" in error && typeof error.statusCode === "number"
        ? error.statusCode
        : 500;
    const message =
      error && typeof error === "object" && "message" in error && typeof error.message === "string"
        ? error.message
        : "Internal Server Error";
    reply.status(statusCode).send({ error: message });
  });

  await app.register(prismaPlugin);
  await app.register(healthRoutes);
  await app.register(categoryRoutes);
  await app.register(productRoutes);

  return app;
}
