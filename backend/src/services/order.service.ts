import type { PrismaClient, TipoPedido } from "../generated/prisma/client.js";
import { buildDetalleLines, computeLineSubtotal } from "./order-totals.js";

export class OrderError extends Error {
  constructor(
    message: string,
    readonly statusCode: number,
  ) {
    super(message);
    this.name = "OrderError";
  }
}

export type CreateOrderItem = {
  productId: string;
  quantity: number;
};

export type CreateOrderInput = {
  type: TipoPedido;
  contactoCliente?: string;
  items: CreateOrderItem[];
};

function mergeItems(items: CreateOrderItem[]) {
  const merged = new Map<string, number>();
  for (const item of items) {
    if (item.quantity < 1) {
      throw new OrderError("Quantity must be at least 1", 400);
    }
    merged.set(item.productId, (merged.get(item.productId) ?? 0) + item.quantity);
  }
  return merged;
}

export async function createOrder(prisma: PrismaClient, input: CreateOrderInput) {
  if (input.items.length === 0) {
    throw new OrderError("Order must include at least one item", 400);
  }

  const merged = mergeItems(input.items);
  const productIds = [...merged.keys()];

  return prisma.$transaction(async (tx) => {
    const products = await tx.producto.findMany({
      where: { id: { in: productIds } },
    });

    if (products.length !== productIds.length) {
      throw new OrderError("One or more products were not found", 404);
    }

    const productMap = new Map(products.map((p) => [p.id, p]));

    const lineInputs: { productoId: string; cantidad: number; precioUnitario: number }[] = [];

    for (const [productId, quantity] of merged) {
      const product = productMap.get(productId)!;
      const precioUnitario =
        input.type === "detal" ? product.precioDetal : product.precioMayor;

      lineInputs.push({ productoId: productId, cantidad: quantity, precioUnitario });
    }

    const { cantidadProductos, total } = buildDetalleLines(lineInputs);

    const detalles = lineInputs.map((line, index) => ({
      consec: index + 1,
      productoId: line.productoId,
      cantidad: line.cantidad,
      precioUnitario: line.precioUnitario,
      subtotal: computeLineSubtotal(line.cantidad, line.precioUnitario),
    }));

    return tx.pedido.create({
      data: {
        tipoPedido: input.type,
        cantidadProductos,
        total,
        contactoCliente: input.contactoCliente,
        detalles: { create: detalles },
      },
      include: {
        detalles: {
          include: { producto: true },
          orderBy: { consec: "asc" },
        },
      },
    });
  });
}

export function formatCop(amount: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function buildWhatsAppMessage(
  order: Awaited<ReturnType<typeof createOrder>>,
  catalogLabel: string,
) {
  const lines = order.detalles.map(
    (d) => `• ${d.producto.nombre} x${d.cantidad} — ${formatCop(d.subtotal)}`,
  );

  return [
    `¡Hola Stylos! Quiero finalizar este pedido (${catalogLabel}):`,
    "",
    `Pedido ID: ${order.id}`,
    order.contactoCliente ? `Mi WhatsApp: ${order.contactoCliente}` : "",
    "",
    ...lines,
    "",
    `Total: ${formatCop(order.total)}`,
  ]
    .filter(Boolean)
    .join("\n");
}

export function buildWhatsAppUrl(phone: string, message: string) {
  const normalized = phone.replace(/\D/g, "");
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}
