import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  DollarSign,
  TrendingUp,
  ArrowUpRight,
} from "lucide-react";
import { orders, products } from "@/lib/data";
import { formatCOP, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/")({
  head: () => ({ meta: [{ title: "Dashboard — Stylos Admin" }] }),
  component: Dashboard,
});

function Dashboard() {
  const totalSales = orders
    .filter((o) => o.status === "completado")
    .reduce((a, o) => a + o.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0), 0);
  const pending = orders.filter((o) => o.status === "pendiente").length;
  const completed = orders.filter((o) => o.status === "completado").length;
  const cancelled = orders.filter((o) => o.status === "cancelado").length;

  const stats = [
    { label: "Ventas totales", value: formatCOP(totalSales), icon: DollarSign, accent: "text-primary", trend: "+12%" },
    { label: "Total productos", value: String(products.length), icon: Package, accent: "text-coral", trend: "+3" },
    { label: "Pedidos pendientes", value: String(pending), icon: Clock, accent: "text-warning", trend: "Atención" },
    { label: "Completados", value: String(completed), icon: CheckCircle2, accent: "text-success", trend: "+8%" },
    { label: "Cancelados", value: String(cancelled), icon: XCircle, accent: "text-destructive", trend: "-2%" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold">Hola, Sofía 👋</h1>
        <p className="text-sm text-muted-foreground">Esto es lo que pasa hoy en tu tienda.</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-border bg-card p-5 shadow-soft">
            <div className="flex items-start justify-between">
              <div className={cn("grid h-10 w-10 place-items-center rounded-xl bg-gradient-soft", s.accent)}>
                <s.icon className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {s.trend}
              </span>
            </div>
            <div className="mt-4 font-display text-2xl font-bold">{s.value}</div>
            <div className="text-xs text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Sales chart placeholder + recent */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display text-lg font-semibold">Ventas de la semana</h3>
              <p className="text-xs text-muted-foreground">Comparado con la semana pasada</p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-3 py-1 text-xs font-semibold text-success">
              <TrendingUp className="h-3 w-3" /> +18%
            </span>
          </div>
          <MiniChart />
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <h3 className="font-display text-lg font-semibold">Productos recientes</h3>
          <div className="mt-4 space-y-3">
            {products.slice(0, 4).map((p) => (
              <div key={p.id} className="flex items-center gap-3">
                <img src={p.images[0]} alt="" className="h-11 w-11 rounded-xl object-cover" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">{p.name}</div>
                  <div className="text-xs text-muted-foreground">{formatCOP(p.priceRetail)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent orders */}
      <div className="rounded-2xl border border-border bg-card shadow-soft overflow-hidden">
        <div className="flex items-center justify-between border-b border-border p-5">
          <h3 className="font-display text-lg font-semibold">Últimos pedidos</h3>
          <Link to="/admin/pedidos" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
            Ver todos <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
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
            {orders.slice(0, 5).map((o) => {
              const total = o.items.reduce((a, i) => a + i.unitPrice * i.quantity, 0);
              return (
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
                  <td className="px-5 py-3 hidden md:table-cell text-muted-foreground">{formatDate(o.date)}</td>
                  <td className="px-5 py-3"><StatusBadge status={o.status} /></td>
                  <td className="px-5 py-3 text-right font-display font-bold text-primary">{formatCOP(total)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
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

function MiniChart() {
  const points = [12, 18, 14, 26, 22, 32, 28];
  const max = Math.max(...points);
  return (
    <div className="mt-6 grid grid-cols-7 gap-2 h-40">
      {points.map((v, i) => (
        <div key={i} className="flex h-full flex-col items-center justify-end gap-2">
          <div
            className="w-full rounded-t-xl bg-gradient-brand"
            style={{ height: `${(v / max) * 100}%` }}
          />
          <span className="text-[10px] text-muted-foreground">{["L", "M", "X", "J", "V", "S", "D"][i]}</span>
        </div>
      ))}
    </div>
  );
}
