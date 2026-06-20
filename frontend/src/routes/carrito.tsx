import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Minus, Plus, Trash2, ShoppingBag, MessageCircle, ArrowLeft, Loader2, Phone } from "lucide-react";
import { toast } from "sonner";
import { StoreShell } from "@/components/storefront/StoreShell";
import { useCart, useCartTotals } from "@/lib/cart";
import { API_BASE_URL, CATALOG_MODE, CATALOG_SHORT_LABEL, CART_STORAGE_KEY } from "@/lib/config";
import { formatCOP } from "@/lib/format";
import { createOrder } from "@/lib/api";
import { WHATSAPP_NUMBER } from "@/lib/config";
import { formatPhoneDisplay, isValidWhatsAppPhone, normalizeWhatsAppPhone } from "@/lib/phone";

const LAST_ORDER_KEY = "stylos-last-order";
const PHONE_STORAGE_KEY = `${CART_STORAGE_KEY}-phone`;

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
  const [submitting, setSubmitting] = useState(false);
  const [phone, setPhone] = useState(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem(PHONE_STORAGE_KEY) ?? "";
  });

  const phoneValid = isValidWhatsAppPhone(phone);
  const normalizedPhone = phoneValid ? normalizeWhatsAppPhone(phone)! : null;

  useEffect(() => {
    if (phone.trim()) {
      localStorage.setItem(PHONE_STORAGE_KEY, phone);
    }
  }, [phone]);

  const handleFinish = async () => {
    if (!phoneValid || !normalizedPhone) {
      toast.error("Ingresa un número de WhatsApp válido (10 dígitos, empieza por 3)");
      return;
    }

    setSubmitting(true);
    try {
      if (API_BASE_URL) {
        const order = await createOrder({
          type: CATALOG_MODE,
          contactoCliente: normalizedPhone,
          items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        });

        sessionStorage.setItem(
          LAST_ORDER_KEY,
          JSON.stringify({
            id: order.id,
            total: order.total,
            contactoCliente: normalizedPhone,
            items: order.items.map((i) => ({
              productId: i.productId,
              name: i.name,
              quantity: i.quantity,
              unitPrice: i.unitPrice,
              subtotal: i.subtotal,
              image: items.find((c) => c.productId === i.productId)?.image ?? "",
            })),
          }),
        );

        window.open(order.whatsappUrl, "_blank");
        navigate({ to: "/confirmacion", search: { orderId: order.id } });
        return;
      }

      const lines = items
        .map((i) => `• ${i.name} x${i.quantity} — ${formatCOP(i.price * i.quantity)}`)
        .join("%0A");
      const msg = `¡Hola Stylos! Quiero finalizar este pedido (${CATALOG_SHORT_LABEL}):%0A%0AMi WhatsApp: ${normalizedPhone}%0A%0A${lines}%0A%0ATotal: ${formatCOP(subtotal)}`;
      window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`, "_blank");
      navigate({ to: "/confirmacion" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo crear el pedido");
    } finally {
      setSubmitting(false);
    }
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
                <label className="block space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Tu WhatsApp
                  </span>
                  <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2.5 focus-within:ring-4 focus-within:ring-primary/15">
                    <Phone className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">+57</span>
                    <input
                      type="tel"
                      inputMode="numeric"
                      autoComplete="tel"
                      placeholder="300 123 4567"
                      value={phone}
                      onChange={(e) => setPhone(formatPhoneDisplay(e.target.value))}
                      className="w-full bg-transparent text-sm outline-none"
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Lo usaremos para confirmar tu pedido por WhatsApp.
                  </p>
                  {phone.trim() && !phoneValid && (
                    <p className="text-[11px] text-destructive">
                      Número inválido. Debe tener 10 dígitos y empezar por 3.
                    </p>
                  )}
                </label>
                <div className="flex items-baseline justify-between">
                  <span className="text-sm text-muted-foreground">Total</span>
                  <span className="font-display text-2xl font-bold text-primary">
                    {formatCOP(subtotal)}
                  </span>
                </div>
                <button
                  onClick={() => void handleFinish()}
                  disabled={submitting || !phoneValid}
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-brand px-6 py-4 text-sm font-bold text-primary-foreground shadow-pop transition hover:scale-[1.01] disabled:opacity-70 disabled:hover:scale-100"
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <MessageCircle className="h-4 w-4" />
                  )}
                  {submitting ? "Creando pedido..." : "Finalizar Pedido por WhatsApp"}
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

export { LAST_ORDER_KEY };
