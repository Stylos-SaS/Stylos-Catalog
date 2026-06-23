import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  DollarSign,
  ArrowUpRight,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { formatCOP, formatDate } from "@/lib/format";
import { formatAppDayLabel, formatAppWeekday, parseAppDate } from "@/lib/timezone";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { useAdminDashboard } from "@/lib/admin-dashboard-queries";
import { productPrimaryImage } from "@/lib/product-image";
import type { AdminDashboardWeeklySale } from "@/lib/types";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export const Route = createFileRoute("/admin/")({
  head: () => ({ meta: [{ title: "Dashboard — Stylos Admin" }] }),
  component: Dashboard,
});

function Dashboard() {
  const user = useAuth((s) => s.user);
  const { data, isLoading, error } = useAdminDashboard();
  const displayName = user?.nombre?.split(" ")[0] ?? "Administrador";

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-4 p-10 text-center">
        <AlertCircle className="mx-auto h-10 w-10 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          {error?.message ?? "No se pudo cargar el dashboard"}
        </p>
      </div>
    );
  }

  const stats = [
    {
      label: "Ventas totales",
      value: formatCOP(data.totalSales),
      icon: DollarSign,
      accent: "text-primary",
      hint: "Pedidos completados",
    },
    {
      label: "Total productos",
      value: String(data.totalProducts),
      icon: Package,
      accent: "text-coral",
      hint: "En catálogo",
    },
    {
      label: "Pedidos pendientes",
      value: String(data.orderCounts.pendiente),
      icon: Clock,
      accent: "text-warning",
      hint: data.orderCounts.pendiente > 0 ? "Revisar" : "Al día",
    },
    {
      label: "Completados",
      value: String(data.orderCounts.completado),
      icon: CheckCircle2,
      accent: "text-success",
      hint: "Confirmados",
    },
    {
      label: "Cancelados",
      value: String(data.orderCounts.cancelado),
      icon: XCircle,
      accent: "text-destructive",
      hint: "No procesados",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold">Hola, {displayName}</h1>
        <p className="text-sm text-muted-foreground">Esto es lo que pasa hoy en tu tienda.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-border bg-card p-5 shadow-soft">
            <div className="flex items-start justify-between">
              <div className={cn("grid h-10 w-10 place-items-center rounded-xl bg-gradient-soft", s.accent)}>
                <s.icon className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {s.hint}
              </span>
            </div>
            <div className="mt-4 font-display text-2xl font-bold">{s.value}</div>
            <div className="text-xs text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft lg:col-span-2">
          <div>
            <h3 className="font-display text-lg font-semibold">Ventas de la semana</h3>
            <p className="text-xs text-muted-foreground">Total de pedidos completados por día</p>
          </div>
          <WeeklyChart sales={data.weeklySales} />
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <h3 className="font-display text-lg font-semibold">Productos recientes</h3>
          <div className="mt-4 space-y-3">
            {data.recentProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay productos aún.</p>
            ) : (
              data.recentProducts.map((p) => (
                <div key={p.id} className="flex items-center gap-3">
                  <img
                    src={productPrimaryImage(p.images)}
                    alt=""
                    className="h-11 w-11 rounded-xl object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">{p.name}</div>
                    <div className="text-xs text-muted-foreground">{formatCOP(p.priceRetail)}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card shadow-soft overflow-hidden">
        <div className="flex items-center justify-between border-b border-border p-5">
          <h3 className="font-display text-lg font-semibold">Últimos pedidos</h3>
          <Link to="/admin/pedidos" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
            Ver todos <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        {data.recentOrders.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">No hay pedidos aún.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-5 py-3">Pedido</th>
                  <th className="px-5 py-3">Cliente</th>
                  <th className="px-5 py-3 hidden sm:table-cell">Tipo</th>
                  <th className="px-5 py-3 hidden md:table-cell">Fecha</th>
                  <th className="px-5 py-3">Estado</th>
                  <th className="px-5 py-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {data.recentOrders.map((o) => (
                  <tr key={o.id} className="border-t border-border hover:bg-secondary/30">
                    <td className="px-5 py-3 font-semibold">
                      <Link to="/admin/pedidos/$id" params={{ id: o.id }} className="hover:text-primary">
                        {o.number}
                      </Link>
                    </td>
                    <td className="px-5 py-3">{o.customer}</td>
                    <td className="px-5 py-3 hidden sm:table-cell">
                      <TypeBadge type={o.type} />
                    </td>
                    <td className="px-5 py-3 hidden md:table-cell text-muted-foreground">
                      {formatDate(o.date)}
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={o.status} />
                    </td>
                    <td className="px-5 py-3 text-right font-display font-bold text-primary">
                      {formatCOP(o.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export function StatusBadge({ status }: { status: "pendiente" | "completado" | "cancelado" }) {
  const map = {
    pendiente: "bg-warning/20 text-foreground",
    completado: "bg-success/15 text-success",
    cancelado: "bg-destructive/15 text-destructive",
  };
  const label = { pendiente: "Pendiente", completado: "Completado", cancelado: "Cancelado" };
  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize", map[status])}>
      {label[status]}
    </span>
  );
}

export function TypeBadge({ type }: { type: "detal" | "mayor" }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
        type === "detal" ? "bg-primary/10 text-primary" : "bg-coral/20 text-foreground",
      )}
    >
      {type === "detal" ? "Detal" : "Mayor"}
    </span>
  );
}

function WeeklyChart({ sales }: { sales: AdminDashboardWeeklySale[] }) {
  const max = Math.max(...sales.map((s) => s.total), 1);

  return (
    <TooltipProvider delayDuration={150}>
      <div className="mt-6 grid grid-cols-7 gap-2 h-40">
        {sales.map((entry) => {
          const day = parseAppDate(entry.date);
          const label = formatAppWeekday(day, "short");
          const tooltipDay = formatAppDayLabel(day);
          const height = entry.total > 0 ? (entry.total / max) * 100 : 4;

          return (
            <Tooltip key={entry.date}>
              <TooltipTrigger asChild>
                <div className="flex h-full cursor-default flex-col items-center justify-end gap-2">
                  <div
                    className="w-full min-h-1 rounded-t-xl bg-gradient-brand transition-opacity hover:opacity-90"
                    style={{ height: `${height}%` }}
                  />
                  <span className="text-[10px] capitalize text-muted-foreground">{label}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-center">
                <p className="capitalize">{tooltipDay}</p>
                <p className="font-semibold">{formatCOP(entry.total)}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
