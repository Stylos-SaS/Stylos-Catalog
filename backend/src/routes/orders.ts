import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { config } from "../config.js";
import { normalizeWhatsAppPhone } from "../lib/phone.js";
import {
  buildWhatsAppMessage,
  buildWhatsAppUrl,
  createOrder,
  OrderError,
} from "../services/order.service.js";
import { formatPedidoNumero } from "../lib/pedido-number.js";

const createOrderSchema = z.object({
  type: z.enum(["detal", "mayor"]),
  contactoCliente: z
    .string()
    .trim()
    .min(1, "WhatsApp number is required")
    .transform((value, ctx) => {
      const normalized = normalizeWhatsAppPhone(value);
      if (!normalized) {
        ctx.addIssue({
          code: "custom",
          message: "Invalid WhatsApp number. Use a Colombian mobile number (10 digits starting with 3).",
        });
        return z.NEVER;
      }
      return normalized;
    }),
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        quantity: z.coerce.number().int().positive(),
      }),
    )
    .min(1),
});

const catalogLabels: Record<"detal" | "mayor", string> = {
  detal: "Detal",
  mayor: "Mayor",
};

export async function orderRoutes(app: FastifyInstance) {
  app.post("/api/orders", async (request, reply) => {
    const parsed = createOrderSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten().fieldErrors });
    }

    try {
      const order = await createOrder(app.prisma, parsed.data);
      const whatsappNumber = config.WHATSAPP_NUMBER;
      const whatsappMessage = buildWhatsAppMessage(order, catalogLabels[parsed.data.type]);
      const whatsappUrl = buildWhatsAppUrl(whatsappNumber, whatsappMessage);

      return reply.status(201).send({
        id: order.id,
        number: formatPedidoNumero(order.numeroPedido),
        type: order.tipoPedido,
        status: order.estado,
        total: order.total,
        itemCount: order.cantidadProductos,
        createdAt: order.fechaCreacion.toISOString(),
        whatsappMessage,
        whatsappUrl,
        items: order.detalles.map((d) => ({
          productId: d.productoId,
          name: d.producto.nombre,
          quantity: d.cantidad,
          unitPrice: d.precioUnitario,
          subtotal: d.subtotal,
        })),
      });
    } catch (error) {
      if (error instanceof OrderError) {
        return reply.status(error.statusCode).send({ error: error.message });
      }
      throw error;
    }
  });
}
