import type { FastifyInstance } from "fastify";
import { z } from "zod";
import {
  getAdminOrderById,
  listAdminOrders,
  OrderAdminError,
  updateAdminOrder,
  updateAdminOrderStatus,
} from "../services/admin-order.service.js";

const listQuerySchema = z.object({
  q: z.string().optional(),
  status: z.enum(["pendiente", "completado", "cancelado"]).optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
});

const lineSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.coerce.number().int().positive(),
  available: z.boolean(),
});

const updateOrderSchema = z.object({
  items: z.array(lineSchema).min(1),
});

const updateOrderStatusSchema = z.object({
  status: z.enum(["completado", "cancelado"]),
});

function handleAdminOrderError(error: unknown, reply: import("fastify").FastifyReply) {
  if (error instanceof OrderAdminError) {
    return reply.status(error.statusCode).send({ error: error.message });
  }
  throw error;
}

export async function adminOrderRoutes(app: FastifyInstance) {
  const auth = { preHandler: [app.authenticate] };

  app.get("/api/admin/orders", auth, async (request, reply) => {
    const parsed = listQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten().fieldErrors });
    }

    const result = await listAdminOrders(app.prisma, parsed.data);
    return reply.send(result);
  });

  app.get("/api/admin/orders/:id", auth, async (request, reply) => {
    const { id } = request.params as { id: string };

    try {
      const order = await getAdminOrderById(app.prisma, id);
      return reply.send(order);
    } catch (error) {
      return handleAdminOrderError(error, reply);
    }
  });

  app.put("/api/admin/orders/:id", auth, async (request, reply) => {
    const { id } = request.params as { id: string };
    const parsed = updateOrderSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten().fieldErrors });
    }

    try {
      const order = await updateAdminOrder(app.prisma, id, parsed.data.items);
      return reply.send(order);
    } catch (error) {
      return handleAdminOrderError(error, reply);
    }
  });

  app.patch("/api/admin/orders/:id/status", auth, async (request, reply) => {
    const { id } = request.params as { id: string };
    const parsed = updateOrderStatusSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten().fieldErrors });
    }

    try {
      const order = await updateAdminOrderStatus(app.prisma, id, parsed.data.status);
      return reply.send(order);
    } catch (error) {
      return handleAdminOrderError(error, reply);
    }
  });
}
