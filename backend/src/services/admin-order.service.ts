import type { PrismaClient, TipoPedido } from "../generated/prisma/client.js";
import { formatPedidoNumero } from "../lib/pedido-number.js";
import { toAdminOrderDTO, toAdminOrderListItemDTO } from "../lib/mappers.js";
import { computeLineSubtotal, summarizePedidoDetalles } from "./order-totals.js";

export class OrderAdminError extends Error {
  constructor(
    message: string,
    readonly statusCode: number,
  ) {
    super(message);
    this.name = "OrderAdminError";
  }
}

export type UpdateOrderLineInput = {
  productId: string;
  quantity: number;
  available: boolean;
};

const orderInclude = {
  detalles: {
    include: {
      producto: { include: { imagenes: true } },
    },
    orderBy: { consec: "asc" as const },
  },
} as const;

function mergeLineItems(items: UpdateOrderLineInput[]) {
  const merged = new Map<string, { quantity: number; available: boolean }>();

  for (const item of items) {
    if (item.quantity < 1) {
      throw new OrderAdminError("Quantity must be at least 1", 400);
    }

    const existing = merged.get(item.productId);
    if (existing) {
      merged.set(item.productId, {
        quantity: existing.quantity + item.quantity,
        available: existing.available && item.available,
      });
    } else {
      merged.set(item.productId, {
        quantity: item.quantity,
        available: item.available,
      });
    }
  }

  return merged;
}

function unitPriceForProduct(
  product: { precioDetal: number; precioMayor: number },
  tipo: TipoPedido,
) {
  return tipo === "detal" ? product.precioDetal : product.precioMayor;
}

function buildOrderSearchFilter(q: string) {
  const trimmed = q.trim();
  if (!trimmed) return {};

  const numberMatch = /^SV-(\d+)$/i.exec(trimmed);
  if (numberMatch) {
    return { numeroPedido: Number.parseInt(numberMatch[1]!, 10) };
  }

  const digits = trimmed.replace(/\D/g, "");
  const or: Record<string, unknown>[] = [];

  if (digits.length >= 3) {
    or.push({ contactoCliente: { contains: digits } });
  }

  const parsedNumber = Number.parseInt(trimmed.replace(/\D/g, ""), 10);
  if (Number.isFinite(parsedNumber) && parsedNumber > 0) {
    or.push({ numeroPedido: parsedNumber });
  }

  if (or.length === 0) {
    return { contactoCliente: { contains: trimmed } };
  }

  return { OR: or };
}

export type ListAdminOrdersParams = {
  q?: string;
  status?: "pendiente" | "completado" | "cancelado";
  page?: number;
  limit?: number;
};

export async function listAdminOrders(prisma: PrismaClient, params: ListAdminOrdersParams) {
  const page = params.page ?? 1;
  const limit = Math.min(params.limit ?? 50, 100);
  const skip = (page - 1) * limit;

  const where = {
    ...(params.status ? { estado: params.status } : {}),
    ...(params.q ? buildOrderSearchFilter(params.q) : {}),
  };

  const [orders, total] = await Promise.all([
    prisma.pedido.findMany({
      where,
      include: orderInclude,
      orderBy: { fechaCreacion: "desc" },
      skip,
      take: limit,
    }),
    prisma.pedido.count({ where }),
  ]);

  return {
    items: orders.map(toAdminOrderListItemDTO),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

export async function getAdminOrderById(prisma: PrismaClient, id: string) {
  const order = await prisma.pedido.findUnique({
    where: { id },
    include: orderInclude,
  });

  if (!order) {
    throw new OrderAdminError("Order not found", 404);
  }

  return toAdminOrderDTO(order);
}

export async function updateAdminOrder(
  prisma: PrismaClient,
  id: string,
  items: UpdateOrderLineInput[],
) {
  if (items.length === 0) {
    throw new OrderAdminError("Order must include at least one item", 400);
  }

  const merged = mergeLineItems(items);
  const productIds = [...merged.keys()];

  return prisma.$transaction(async (tx) => {
    const order = await tx.pedido.findUnique({
      where: { id },
      include: orderInclude,
    });

    if (!order) {
      throw new OrderAdminError("Order not found", 404);
    }

    const products = await tx.producto.findMany({
      where: { id: { in: productIds } },
    });

    if (products.length !== productIds.length) {
      throw new OrderAdminError("One or more products were not found", 404);
    }

    const productMap = new Map(products.map((p) => [p.id, p]));
    const existingByProductId = new Map(
      order.detalles.map((d) => [d.productoId, d.precioUnitario]),
    );

    const lineInputs: {
      productoId: string;
      cantidad: number;
      precioUnitario: number;
      disponible: boolean;
    }[] = [];

    for (const [productId, line] of merged) {
      const product = productMap.get(productId)!;
      const isNew = !existingByProductId.has(productId);

      if (isNew && !product.activo) {
        throw new OrderAdminError("One or more products are not available", 400);
      }

      const precioUnitario = isNew
        ? unitPriceForProduct(product, order.tipoPedido)
        : existingByProductId.get(productId)!;

      lineInputs.push({
        productoId: productId,
        cantidad: line.quantity,
        precioUnitario,
        disponible: line.available,
      });
    }

    const detalles = lineInputs.map((line) => ({
      cantidad: line.cantidad,
      precioUnitario: line.precioUnitario,
      subtotal: computeLineSubtotal(line.cantidad, line.precioUnitario),
      disponible: line.disponible,
    }));

    const { cantidadProductos, total } = summarizePedidoDetalles(detalles, { onlyAvailable: true });

    await tx.detallePedido.deleteMany({ where: { pedidoId: id } });

    if (detalles.length > 0) {
      await tx.detallePedido.createMany({
        data: detalles.map((line, index) => ({
          pedidoId: id,
          consec: index + 1,
          productoId: lineInputs[index]!.productoId,
          cantidad: line.cantidad,
          precioUnitario: line.precioUnitario,
          subtotal: computeLineSubtotal(line.cantidad, line.precioUnitario),
          disponible: line.disponible,
        })),
      });
    }

    const updated = await tx.pedido.update({
      where: { id },
      data: { cantidadProductos, total },
      include: orderInclude,
    });

    return toAdminOrderDTO(updated);
  });
}

export { formatPedidoNumero };
