import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowLeft,
  Trash2,
  Replace,
  Plus,
  Ban,
  Download,
  CheckCircle2,
  X,
  Search,
} from "lucide-react";
import { getOrder, products, type OrderItem } from "@/lib/data";
import { formatCOP, formatDate } from "@/lib/format";
import { StatusBadge, TypeBadge } from "./admin.index";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/pedidos/$id")({
  loader: ({ params }) => {
    const order = getOrder(params.id);
    if (!order) throw notFound();
    return { order };
  },
  head: ({ loaderData }) => ({
    meta: [{ title: `Pedido ${loaderData?.order.number} — Stylos Admin` }],
  }),
  notFoundComponent: () => (
    <div className="p-10 text-center">Pedido no encontrado · <Link to="/admin/pedidos" className="text-primary">Volver</Link></div>
  ),
  component: OrderDetail,
});

function OrderDetail() {
  const { order } = Route.useLoaderData();
  const [items, setItems] = useState<OrderItem[]>(order.items);
  const [replaceFor, setReplaceFor] = useState<string | null>(null);
  const [confirmView, setConfirmView] = useState(false);

  const total = items.filter((i) => i.available).reduce((a, i) => a + i.unitPrice * i.quantity, 0);

  const toggleAvail = (id: string) =>
    setItems(items.map((i) => (i.productId === id ? { ...i, available: !i.available } : i)));
  const removeItem = (id: string) => setItems(items.filter((i) => i.productId !== id));

  return (
    <div className="space-y-6">
      <Link to="/admin/pedidos" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3 w-3" /> Volver a pedidos
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-3xl font-bold">{order.number}</h1>
            <StatusBadge status={order.status} />
            <TypeBadge type={order.type} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {formatDate(order.date)} · {order.customer} · {order.whatsapp}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setConfirmView(true)}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold hover:bg-secondary"
          >
            <Download className="h-4 w-4" /> Ver confirmación
          </button>
          <button className="inline-flex items-center gap-2 rounded-full bg-success/15 text-success px-4 py-2 text-sm font-semibold hover:bg-success/25">
            <CheckCircle2 className="h-4 w-4" /> Marcar completado
          </button>
          <button className="inline-flex items-center gap-2 rounded-full bg-destructive/10 text-destructive px-4 py-2 text-sm font-semibold hover:bg-destructive/20">
            <Trash2 className="h-4 w-4" /> Eliminar
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="rounded-2xl border border-border bg-card shadow-soft overflow-hidden">
          <div className="border-b border-border p-5 flex items-center justify-between">
            <h3 className="font-display text-lg font-semibold">Productos del pedido</h3>
            <button className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-3 py-1.5 text-xs font-semibold hover:bg-primary/15">
              <Plus className="h-3.5 w-3.5" /> Agregar producto
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-5 py-3">Producto</th>
                  <th className="px-5 py-3 text-right">Precio</th>
                  <th className="px-5 py-3 text-center">Cant.</th>
                  <th className="px-5 py-3 text-right">Subtotal</th>
                  <th className="px-5 py-3">Disponibilidad</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {items.map((it) => (
                  <tr
                    key={it.productId}
                    className={cn("border-t border-border", !it.available && "opacity-50")}
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <img src={it.image} alt="" className="h-11 w-11 rounded-xl object-cover" />
                        <span className="font-semibold">{it.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-right">{formatCOP(it.unitPrice)}</td>
                    <td className="px-5 py-3 text-center">{it.quantity}</td>
                    <td className="px-5 py-3 text-right font-semibold text-primary">{formatCOP(it.unitPrice * it.quantity)}</td>
                    <td className="px-5 py-3">
                      <button
                        onClick={() => toggleAvail(it.productId)}
                        className={cn(
                          "rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
                          it.available ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive",
                        )}
                      >
                        {it.available ? "Disponible" : "No disponible"}
                      </button>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => toggleAvail(it.productId)} title="Marcar no disponible" className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:bg-warning/15 hover:text-foreground">
                          <Ban className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => setReplaceFor(it.productId)} title="Reemplazar" className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground">
                          <Replace className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => removeItem(it.productId)} title="Eliminar" className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
            <h3 className="font-display text-lg font-semibold">Resumen</h3>
            <div className="mt-4 space-y-2 text-sm">
              <Row label="Productos" value={String(items.length)} />
              <Row label="Disponibles" value={String(items.filter((i) => i.available).length)} />
              <Row label="No disponibles" value={String(items.filter((i) => !i.available).length)} />
            </div>
            <div className="my-4 border-t border-border" />
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-muted-foreground">Total</span>
              <span className="font-display text-2xl font-bold text-primary">{formatCOP(total)}</span>
            </div>
          </div>
          <div className="rounded-2xl bg-gradient-soft p-4 text-xs text-muted-foreground">
            Los precios mostrados son <strong className="text-foreground">
              al {order.type === "detal" ? "detal" : "por mayor"}
            </strong>. Al reemplazar productos solo se mostrarán precios de este tipo.
          </div>
        </aside>
      </div>

      {replaceFor && (
        <ReplaceModal
          type={order.type}
          onClose={() => setReplaceFor(null)}
          onPick={(p) => {
            setItems(
              items.map((i) =>
                i.productId === replaceFor
                  ? { ...i, productId: p.id, name: p.name, image: p.images[0], unitPrice: order.type === "detal" ? p.priceRetail : p.priceWholesale }
                  : i,
              ),
            );
            setReplaceFor(null);
          }}
        />
      )}

      {confirmView && <ConfirmDocModal order={{ ...order, items }} total={total} onClose={() => setConfirmView(false)} />}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function ReplaceModal({
  type,
  onClose,
  onPick,
}: {
  type: "detal" | "mayor";
  onClose: () => void;
  onPick: (p: (typeof products)[number]) => void;
}) {
  const [q, setQ] = useState("");
  const list = products.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/30 backdrop-blur-sm p-4">
      <div className="w-full max-w-xl rounded-3xl bg-background shadow-pop overflow-hidden">
        <div className="flex items-center justify-between border-b border-border p-5">
          <div>
            <h2 className="font-display text-xl font-bold">Reemplazar producto</h2>
            <p className="text-xs text-muted-foreground">
              Mostrando precios al {type === "detal" ? "detal" : "por mayor"} únicamente.
            </p>
          </div>
          <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full hover:bg-secondary">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2 rounded-full border border-border bg-secondary/40 px-4 py-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar producto..." className="w-full bg-transparent text-sm outline-none" />
          </div>
        </div>
        <div className="max-h-[50vh] overflow-y-auto p-3 space-y-1">
          {list.map((p) => (
            <button
              key={p.id}
              onClick={() => onPick(p)}
              className="w-full flex items-center gap-3 rounded-2xl p-3 text-left hover:bg-secondary transition"
            >
              <img src={p.images[0]} alt="" className="h-12 w-12 rounded-xl object-cover" />
              <div className="flex-1 min-w-0">
                <div className="font-semibold truncate">{p.name}</div>
                <div className="text-xs text-muted-foreground capitalize">{p.category}</div>
              </div>
              <div className="font-display font-bold text-primary">
                {formatCOP(type === "detal" ? p.priceRetail : p.priceWholesale)}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

import logo from "@/assets/stylos-logo.jpeg";

function ConfirmDocModal({
  order,
  total,
  onClose,
}: {
  order: { number: string; date: string; type: "detal" | "mayor"; customer: string; items: OrderItem[] };
  total: number;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/30 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl rounded-3xl bg-background shadow-pop overflow-hidden">
        <div className="flex items-center justify-between border-b border-border p-5">
          <h2 className="font-display text-xl font-bold">Confirmación del pedido</h2>
          <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full hover:bg-secondary">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto">
          <div className="m-6 rounded-2xl bg-gradient-soft p-6">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-3">
                <img src={logo} alt="" className="h-12 w-12 rounded-full" />
                <div>
                  <div className="font-display text-lg font-bold">Stylos Variedades</div>
                  <div className="text-xs text-muted-foreground">Pedido {order.type === "detal" ? "Detal" : "Mayor"}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-display text-xl font-bold text-primary">{order.number}</div>
                <div className="text-xs text-muted-foreground">{formatDate(order.date)}</div>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              {order.items.map((it) => (
                <div key={it.productId} className={cn("flex items-center gap-3", !it.available && "opacity-50 line-through")}>
                  <img src={it.image} alt="" className="h-12 w-12 rounded-xl object-cover" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold">{it.name}</div>
                    <div className="text-xs text-muted-foreground">x{it.quantity} {!it.available && "· No disponible"}</div>
                  </div>
                  <div className="font-semibold text-sm">{formatCOP(it.unitPrice * it.quantity)}</div>
                </div>
              ))}
            </div>
            <div className="mt-5 flex items-baseline justify-between border-t border-border pt-4">
              <span className="font-display text-sm font-semibold">Total a pagar</span>
              <span className="font-display text-2xl font-bold text-primary">{formatCOP(total)}</span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap justify-end gap-2 border-t border-border bg-secondary/30 p-4">
          <button className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold hover:bg-secondary">
            <Download className="h-4 w-4" /> Descargar PDF
          </button>
          <button className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold hover:bg-secondary">
            <Download className="h-4 w-4" /> Descargar imagen
          </button>
          <button className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-pop hover:opacity-90">
            <CheckCircle2 className="h-4 w-4" /> Marcar completado
          </button>
        </div>
      </div>
    </div>
  );
}
