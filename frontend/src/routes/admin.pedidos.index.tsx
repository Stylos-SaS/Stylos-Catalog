import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Search, Eye, Loader2, AlertCircle, PackageOpen } from "lucide-react";
import { formatCOP, formatDate } from "@/lib/format";
import { StatusBadge, TypeBadge } from "./admin.index";
import { cn } from "@/lib/utils";
import { useAdminOrders } from "@/lib/admin-order-queries";

export const Route = createFileRoute("/admin/pedidos/")({
  head: () => ({ meta: [{ title: "Pedidos — Stylos Admin" }] }),
  component: OrdersAdmin,
});

const tabs = [
  { label: "Todos", status: undefined },
  { label: "Pendientes", status: "pendiente" as const },
  { label: "Completados", status: "completado" as const },
  { label: "Cancelados", status: "cancelado" as const },
];

function OrdersAdmin() {
  const [tabIndex, setTabIndex] = useState(0);
  const [q, setQ] = useState("");

  const status = tabs[tabIndex]?.status;
  const { data, isLoading, error } = useAdminOrders({ q, status });
  const orders = data?.items ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Pedidos</h1>
        <p className="text-sm text-muted-foreground">Administra los pedidos del catálogo detal y mayorista.</p>
      </div>

      <div className="rounded-2xl border border-border bg-card shadow-soft overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
          <div className="flex gap-1 rounded-full bg-secondary p-1">
            {tabs.map((t, i) => (
              <button
                key={t.label}
                onClick={() => setTabIndex(i)}
                className={cn(
                  "rounded-full px-4 py-1.5 text-xs font-semibold transition",
                  tabIndex === i ? "bg-background shadow-soft text-primary" : "text-muted-foreground",
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 rounded-full border border-border bg-secondary/40 px-4 py-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar pedido o cliente..."
              className="w-56 bg-transparent text-sm outline-none"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-2 p-16 text-center">
            <AlertCircle className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{error.message}</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center gap-2 p-16 text-center">
            <PackageOpen className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No hay pedidos que coincidan.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-5 py-3">Nº Pedido</th>
                  <th className="px-5 py-3 hidden md:table-cell">Cliente</th>
                  <th className="px-5 py-3 hidden sm:table-cell">Fecha</th>
                  <th className="px-5 py-3">Tipo</th>
                  <th className="px-5 py-3">Estado</th>
                  <th className="px-5 py-3 hidden sm:table-cell">Productos</th>
                  <th className="px-5 py-3 text-right">Total</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="border-t border-border hover:bg-secondary/20">
                    <td className="px-5 py-3 font-semibold">{o.number}</td>
                    <td className="px-5 py-3 hidden md:table-cell">{o.customer}</td>
                    <td className="px-5 py-3 hidden sm:table-cell text-muted-foreground">{formatDate(o.date)}</td>
                    <td className="px-5 py-3">
                      <TypeBadge type={o.type} />
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={o.status} />
                    </td>
                    <td className="px-5 py-3 hidden sm:table-cell">{o.itemCount}</td>
                    <td className="px-5 py-3 text-right font-display font-bold text-primary">
                      {formatCOP(o.total)}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Link
                        to="/admin/pedidos/$id"
                        params={{ id: o.id }}
                        className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1.5 text-xs font-semibold hover:bg-accent"
                      >
                        <Eye className="h-3.5 w-3.5" /> Ver
                      </Link>
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
