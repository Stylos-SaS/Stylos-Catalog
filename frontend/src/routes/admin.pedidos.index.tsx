import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Search, Eye } from "lucide-react";
import { orders } from "@/lib/data";
import { formatCOP, formatDate } from "@/lib/format";
import { StatusBadge, TypeBadge } from "./admin.index";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/pedidos/")({
  head: () => ({ meta: [{ title: "Pedidos — Stylos Admin" }] }),
  component: OrdersAdmin,
});

const tabs = ["Todos", "Pendientes", "Completados", "Cancelados"] as const;

function OrdersAdmin() {
  const [tab, setTab] = useState<(typeof tabs)[number]>("Todos");
  const [q, setQ] = useState("");

  const filtered = orders.filter((o) => {
    if (tab === "Pendientes" && o.status !== "pendiente") return false;
    if (tab === "Completados" && o.status !== "completado") return false;
    if (tab === "Cancelados" && o.status !== "cancelado") return false;
    if (q && !o.number.toLowerCase().includes(q.toLowerCase()) && !o.customer.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Pedidos</h1>
        <p className="text-sm text-muted-foreground">Administra los pedidos del catálogo detal y mayorista.</p>
      </div>

      <div className="rounded-2xl border border-border bg-card shadow-soft overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
          <div className="flex gap-1 rounded-full bg-secondary p-1">
            {tabs.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  "rounded-full px-4 py-1.5 text-xs font-semibold transition",
                  tab === t ? "bg-background shadow-soft text-primary" : "text-muted-foreground",
                )}
              >
                {t}
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
              {filtered.map((o) => {
                const total = o.items.reduce((a, i) => a + i.unitPrice * i.quantity, 0);
                const qty = o.items.reduce((a, i) => a + i.quantity, 0);
                return (
                  <tr key={o.id} className="border-t border-border hover:bg-secondary/20">
                    <td className="px-5 py-3 font-semibold">{o.number}</td>
                    <td className="px-5 py-3 hidden md:table-cell">{o.customer}</td>
                    <td className="px-5 py-3 hidden sm:table-cell text-muted-foreground">{formatDate(o.date)}</td>
                    <td className="px-5 py-3"><TypeBadge type={o.type} /></td>
                    <td className="px-5 py-3"><StatusBadge status={o.status} /></td>
                    <td className="px-5 py-3 hidden sm:table-cell">{qty}</td>
                    <td className="px-5 py-3 text-right font-display font-bold text-primary">{formatCOP(total)}</td>
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
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
