import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check, MessageCircle, Home } from "lucide-react";
import { StoreShell } from "@/components/storefront/StoreShell";
import { useCart, useCartTotals } from "@/lib/cart";
import { formatCOP } from "@/lib/format";
import { WHATSAPP_NUMBER } from "@/lib/data";

export const Route = createFileRoute("/confirmacion")({
  head: () => ({ meta: [{ title: "Pedido confirmado — Stylos Variedades" }] }),
  component: Confirm,
});

function Confirm() {
  const items = useCart((s) => s.items);
  const { subtotal, count } = useCartTotals();
  const clear = useCart((s) => s.clear);
  const [orderNumber] = useState(`SV-${Math.floor(1000 + Math.random() * 9000)}`);
  const [snapshot] = useState(items);

  useEffect(() => {
    // Clear cart shortly after rendering snapshot
    const t = setTimeout(() => clear(), 100);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <StoreShell>
      <div className="mx-auto max-w-2xl px-6 py-16 text-center">
        <div className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-gradient-brand shadow-pop animate-in zoom-in-50 duration-500">
          <Check className="h-12 w-12 text-primary-foreground" strokeWidth={3} />
        </div>
        <h1 className="mt-6 font-display text-3xl font-bold sm:text-4xl">
          ¡Tu pedido fue creado! 💕
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Te abrimos WhatsApp para confirmar tu pedido con una asesora.
        </p>

        <div className="mt-8 rounded-3xl border border-border bg-card p-6 text-left shadow-soft">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Nº de pedido</div>
              <div className="font-display text-2xl font-bold text-primary">{orderNumber}</div>
            </div>
            <div className="text-right">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Productos</div>
              <div className="font-display text-2xl font-bold">{snapshot.length || count}</div>
            </div>
          </div>
          <div className="mt-4 space-y-3">
            {(snapshot.length ? snapshot : items).map((it) => (
              <div key={it.productId} className="flex items-center gap-3">
                <img src={it.image} alt="" className="h-12 w-12 rounded-xl object-cover" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{it.name}</div>
                  <div className="text-xs text-muted-foreground">x{it.quantity}</div>
                </div>
                <div className="font-semibold text-sm">{formatCOP(it.price * it.quantity)}</div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-baseline justify-between border-t border-border pt-4">
            <span className="text-sm text-muted-foreground">Total</span>
            <span className="font-display text-2xl font-bold text-primary">{formatCOP(subtotal || snapshot.reduce((a, i) => a + i.price * i.quantity, 0))}</span>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}?text=Hola%20Stylos%2C%20mi%20pedido%20${orderNumber}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-[oklch(0.7_0.15_155)] px-6 py-3 text-sm font-semibold text-white shadow-pop hover:opacity-90"
          >
            <MessageCircle className="h-4 w-4" /> Ir a WhatsApp
          </a>
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-sm font-semibold hover:bg-secondary"
          >
            <Home className="h-4 w-4" /> Volver al inicio
          </Link>
        </div>
      </div>
    </StoreShell>
  );
}
