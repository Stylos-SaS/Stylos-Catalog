import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Check, MessageCircle, Home } from "lucide-react";
import { StoreShell } from "@/components/storefront/StoreShell";
import { useCart, useCartTotals } from "@/lib/cart";
import { formatCOP } from "@/lib/format";
import { WHATSAPP_NUMBER } from "@/lib/config";
import { LAST_ORDER_KEY } from "./carrito";

type StoredOrder = {
  id: string;
  total: number;
  items: {
    productId: string;
    name: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
    image: string;
  }[];
};

type Search = { orderId?: string };

export const Route = createFileRoute("/confirmacion")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    orderId: typeof search.orderId === "string" ? search.orderId : undefined,
  }),
  head: () => ({ meta: [{ title: "Pedido confirmado — Stylos Variedades" }] }),
  component: Confirm,
});

function Confirm() {
  const { orderId } = Route.useSearch();
  const items = useCart((s) => s.items);
  const { subtotal, count } = useCartTotals();
  const clear = useCart((s) => s.clear);

  const storedOrder = useMemo(() => {
    if (!orderId) return null;
    try {
      const raw = sessionStorage.getItem(LAST_ORDER_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as StoredOrder;
      return parsed.id === orderId ? parsed : null;
    } catch {
      return null;
    }
  }, [orderId]);

  const [fallbackId] = useState(() => `local-${crypto.randomUUID().slice(0, 8)}`);
  const displayId = orderId ?? fallbackId;
  const snapshot = storedOrder?.items ?? items;
  const total =
    storedOrder?.total ?? subtotal ?? snapshot.reduce((a, i) => a + i.unitPrice * i.quantity, 0);

  useEffect(() => {
    const t = setTimeout(() => clear(), 100);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const whatsappHref = orderId
    ? `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`Hola Stylos, mi pedido ${orderId}`)}`
    : `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`Hola Stylos, mi pedido ${displayId}`)}`;

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
              <div className="text-xs uppercase tracking-wider text-muted-foreground">ID del pedido</div>
              <div className="font-display mt-1 break-all text-sm font-bold text-primary sm:text-base">
                {displayId}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Productos</div>
              <div className="font-display text-2xl font-bold">{snapshot.length || count}</div>
            </div>
          </div>
          <div className="mt-4 space-y-3">
            {snapshot.map((it) => (
              <div key={it.productId} className="flex items-center gap-3">
                {"image" in it && it.image ? (
                  <img src={it.image} alt="" className="h-12 w-12 rounded-xl object-cover" />
                ) : (
                  <div className="h-12 w-12 rounded-xl bg-secondary" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{it.name}</div>
                  <div className="text-xs text-muted-foreground">x{it.quantity}</div>
                </div>
                <div className="font-semibold text-sm">
                  {formatCOP(
                    "subtotal" in it && typeof it.subtotal === "number"
                      ? it.subtotal
                      : "price" in it
                        ? it.price * it.quantity
                        : it.unitPrice * it.quantity,
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-baseline justify-between border-t border-border pt-4">
            <span className="text-sm text-muted-foreground">Total</span>
            <span className="font-display text-2xl font-bold text-primary">{formatCOP(total)}</span>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <a
            href={whatsappHref}
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
