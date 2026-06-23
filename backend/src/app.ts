import Fastify from "fastify";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import rateLimit from "@fastify/rate-limit";
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
import { adminCategoryRoutes } from "./routes/admin-categories.js";
import { storeSettingsRoutes, adminStoreSettingsRoutes } from "./routes/store-settings.js";

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

  await app.register(rateLimit, {
    global: true,
    max: 200,
    timeWindow: "1 minute",
    errorResponseBuilder: (_request, context) => ({
      error: "Too many requests. Please try again later.",
      retryAfter: context.after,
    }),
  });

  app.setErrorHandler((error, _request, reply) => {
    if (
      error !== null &&
      typeof error === "object" &&
      "error" in error &&
      typeof (error as { error: unknown }).error === "string" &&
      (error as { error: string }).error.toLowerCase().includes("too many requests")
    ) {
      const body = error as { error: string; retryAfter?: unknown };
      return reply.status(429).send({ error: body.error, retryAfter: body.retryAfter });
    }

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
  await app.register(adminCategoryRoutes);
  await app.register(storeSettingsRoutes);
  await app.register(adminStoreSettingsRoutes);

  return app;
}
