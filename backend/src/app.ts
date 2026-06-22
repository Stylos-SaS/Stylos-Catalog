import Fastify from "fastify";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import { config } from "./config.js";
import prismaPlugin from "./plugins/prisma.js";
import authPlugin from "./plugins/auth.js";
import { healthRoutes } from "./routes/health.js";
import { categoryRoutes } from "./routes/categories.js";
import { productRoutes } from "./routes/products.js";
import { orderRoutes } from "./routes/orders.js";
import { authRoutes } from "./routes/auth.js";
import { adminProductRoutes } from "./routes/admin-products.js";
import { adminOrderRoutes } from "./routes/admin-orders.js";
import { adminDashboardRoutes } from "./routes/admin-dashboard.js";

export async function buildApp() {
  const app = Fastify({
    logger: config.NODE_ENV === "development",
  });

  await app.register(cors, {
    origin: config.corsOrigins,
    credentials: true,
    methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  });

  await app.register(multipart, {
    limits: { fileSize: 5 * 1024 * 1024, files: 1 },
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
  await app.register(authPlugin);
  await app.register(healthRoutes);
  await app.register(categoryRoutes);
  await app.register(productRoutes);
  await app.register(orderRoutes);
  await app.register(authRoutes);
  await app.register(adminProductRoutes);
  await app.register(adminOrderRoutes);
  await app.register(adminDashboardRoutes);

  return app;
}
