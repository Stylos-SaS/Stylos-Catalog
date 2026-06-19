import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Minus, Plus, Trash2, ShoppingBag, MessageCircle, ArrowLeft } from "lucide-react";
import { StoreShell } from "@/components/storefront/StoreShell";
import { useCart, useCartTotals } from "@/lib/cart";
import { CATALOG_SHORT_LABEL } from "@/lib/config";
import { formatCOP } from "@/lib/format";
import { WHATSAPP_NUMBER } from "@/lib/data";

export const Route = createFileRoute("/carrito")({
  head: () => ({ meta: [{ title: "Carrito — Stylos Variedades" }] }),
  component: Cart,
});

function Cart() {
  const items = useCart((s) => s.items);
  const setQty = useCart((s) => s.setQty);
  const remove = useCart((s) => s.remove);
  const clear = useCart((s) => s.clear);
  const { subtotal, count } = useCartTotals();
  const navigate = useNavigate();

  const handleFinish = () => {
    const lines = items
      .map((i) => `• ${i.name} x${i.quantity} — ${formatCOP(i.price * i.quantity)}`)
      .join("%0A");
    const msg = `¡Hola Stylos! Quiero finalizar este pedido (${CATALOG_SHORT_LABEL}):%0A%0A${lines}%0A%0ATotal: ${formatCOP(subtotal)}`;
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`, "_blank");
    navigate({ to: "/confirmacion" });
  };

  return (
    <StoreShell>
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <Link to="/catalogo" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-3 w-3" /> Seguir comprando
            </Link>
            <h1 className="font-display mt-2 text-3xl font-bold sm:text-4xl">Tu carrito</h1>
            <p className="text-sm text-muted-foreground">{count} producto{count === 1 ? "" : "s"}</p>
          </div>
          {items.length > 0 && (
            <button onClick={clear} className="text-xs text-muted-foreground hover:text-destructive">
              Vaciar carrito
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-card p-16 text-center">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-secondary">
              <ShoppingBag className="h-7 w-7 text-muted-foreground" />
            </div>
            <h3 className="mt-4 font-display text-xl font-semibold">Tu carrito está vacío</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Encuentra algo bonito en nuestro catálogo.
            </p>
            <Link
              to="/catalogo"
              className="mt-6 inline-flex rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-pop"
            >
              Ir al catálogo
            </Link>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
            <div className="space-y-3">
              {items.map((it) => (
                <div
                  key={it.productId}
                  className="grid grid-cols-[80px_minmax(0,1fr)_auto] gap-4 rounded-3xl border border-border bg-card p-3 shadow-soft sm:grid-cols-[100px_minmax(0,1fr)_auto_auto]"
                >
                  <img src={it.image} alt={it.name} className="h-20 w-20 sm:h-24 sm:w-24 rounded-2xl object-cover" />
                  <div className="min-w-0 self-center">
                    <Link
                      to="/producto/$id"
                      params={{ id: it.productId }}
                      className="line-clamp-2 font-semibold leading-snug hover:text-primary"
                    >
                      {it.name}
                    </Link>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {formatCOP(it.price)} c/u
                    </div>
                    <div className="mt-3 inline-flex items-center rounded-full border border-border bg-background p-1">
                      <button onClick={() => setQty(it.productId, it.quantity - 1)} className="grid h-7 w-7 place-items-center rounded-full hover:bg-secondary">
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-8 text-center text-sm font-semibold">{it.quantity}</span>
                      <button onClick={() => setQty(it.productId, it.quantity + 1)} className="grid h-7 w-7 place-items-center rounded-full hover:bg-secondary">
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="self-center text-right font-display font-bold text-primary sm:col-start-3">
                    {formatCOP(it.price * it.quantity)}
                  </div>
                  <button
                    onClick={() => remove(it.productId)}
                    className="self-center grid h-9 w-9 place-items-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    aria-label="Eliminar"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            <aside className="space-y-4">
              <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
                <h3 className="font-display text-lg font-semibold">Resumen del pedido</h3>
                <div className="mt-4 space-y-2 text-sm">
                  <Row label="Productos" value={String(count)} />
                  <Row label="Subtotal" value={formatCOP(subtotal)} />
                  <Row label="Envío" value="Se coordina por WhatsApp" muted />
                </div>
                <div className="my-4 border-t border-border" />
                <div className="flex items-baseline justify-between">
                  <span className="text-sm text-muted-foreground">Total</span>
                  <span className="font-display text-2xl font-bold text-primary">
                    {formatCOP(subtotal)}
                  </span>
                </div>
                <button
                  onClick={handleFinish}
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-brand px-6 py-4 text-sm font-bold text-primary-foreground shadow-pop transition hover:scale-[1.01]"
                >
                  <MessageCircle className="h-4 w-4" /> Finalizar Pedido por WhatsApp
                </button>
                <p className="mt-3 text-center text-[11px] text-muted-foreground">
                  Te conectaremos directamente con nuestra asesora.
                </p>
              </div>
              <div className="rounded-3xl bg-gradient-soft p-4 text-xs text-muted-foreground">
                Tipo de precio:{" "}
                <span className="font-semibold text-foreground">{CATALOG_SHORT_LABEL}</span>
              </div>
            </aside>
          </div>
        )}
      </div>
    </StoreShell>
  );
}

function Row({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={muted ? "text-muted-foreground" : "font-medium"}>{value}</span>
    </div>
  );
}
