import type { PrismaClient, EstadoPedido } from "../generated/prisma/client.js";
import { toAdminOrderListItemDTO, toProductDTO } from "../lib/mappers.js";
import {
  buildLastSevenColombiaDays,
  colombiaDayStartUtc,
  formatColombiaDateKey,
} from "../lib/timezone.js";

const orderInclude = {
  detalles: {
    include: {
      producto: { include: { imagenes: true } },
    },
    orderBy: { consec: "asc" as const },
  },
} as const;

const productInclude = {
  categoria: true,
  imagenes: true,
} as const;

export type AdminDashboardWeeklySale = {
  date: string;
  total: number;
};

export type AdminDashboardDTO = {
  totalSales: number;
  orderCounts: Record<EstadoPedido, number>;
  totalProducts: number;
  recentOrders: ReturnType<typeof toAdminOrderListItemDTO>[];
  recentProducts: ReturnType<typeof toProductDTO>[];
  weeklySales: AdminDashboardWeeklySale[];
};

export async function getAdminDashboard(prisma: PrismaClient): Promise<AdminDashboardDTO> {
  const weekDays = buildLastSevenColombiaDays();
  const weekStart = colombiaDayStartUtc(weekDays[0]!);

  const [
    salesAggregate,
    orderGroups,
    totalProducts,
    recentOrders,
    recentProducts,
    completedWeekOrders,
  ] = await Promise.all([
    prisma.pedido.aggregate({
      where: { estado: "completado" },
      _sum: { total: true },
    }),
    prisma.pedido.groupBy({
      by: ["estado"],
      _count: { _all: true },
    }),
    prisma.producto.count(),
    prisma.pedido.findMany({
      include: orderInclude,
      orderBy: { fechaCreacion: "desc" },
      take: 5,
    }),
    prisma.producto.findMany({
      include: productInclude,
      orderBy: { fechaCreacion: "desc" },
      take: 4,
    }),
    prisma.pedido.findMany({
      where: {
        estado: "completado",
        fechaCreacion: { gte: weekStart },
      },
      select: { fechaCreacion: true, total: true },
    }),
  ]);

  const orderCounts: Record<EstadoPedido, number> = {
    pendiente: 0,
    completado: 0,
    cancelado: 0,
  };

  for (const group of orderGroups) {
    orderCounts[group.estado] = group._count._all;
  }

  const totalsByDay = new Map<string, number>();
  for (const date of weekDays) {
    totalsByDay.set(date, 0);
  }

  for (const order of completedWeekOrders) {
    const key = formatColombiaDateKey(order.fechaCreacion);
    if (totalsByDay.has(key)) {
      totalsByDay.set(key, (totalsByDay.get(key) ?? 0) + order.total);
    }
  }

  return {
    totalSales: salesAggregate._sum.total ?? 0,
    orderCounts,
    totalProducts,
    recentOrders: recentOrders.map(toAdminOrderListItemDTO),
    recentProducts: recentProducts.map(toProductDTO),
    weeklySales: weekDays.map((date) => ({
      date,
      total: totalsByDay.get(date) ?? 0,
    })),
  };
}
