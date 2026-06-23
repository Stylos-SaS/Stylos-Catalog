import type { FastifyInstance } from "fastify";
import { getAdminDashboard } from "../services/admin-dashboard.service.js";

export async function adminDashboardRoutes(app: FastifyInstance) {
  const auth = { preHandler: [app.authenticate] };

  app.get("/api/admin/dashboard", auth, async (_request, reply) => {
    const dashboard = await getAdminDashboard(app.prisma);
    return reply.send(dashboard);
  });
}
