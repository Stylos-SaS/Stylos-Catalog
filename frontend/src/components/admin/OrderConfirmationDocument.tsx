import { forwardRef } from "react";
import type { AdminOrderLine, OrderType } from "@/lib/types";
import { formatCOP, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import logo from "@/assets/stylos-logo.jpeg";

export type OrderConfirmationDocumentProps = {
  number: string;
  date: string;
  type: OrderType;
  customer: string;
  items: AdminOrderLine[];
  total: number;
};

export const OrderConfirmationDocument = forwardRef<
  HTMLDivElement,
  OrderConfirmationDocumentProps
>(function OrderConfirmationDocument(
  { number, date, customer, items, total },
  ref,
) {
  return (
    <div
      ref={ref}
      className="w-[480px] rounded-2xl bg-white p-6 text-gray-900"
      style={{ fontFamily: "system-ui, sans-serif" }}
    >
      <div className="flex items-center justify-between border-b border-gray-200 pb-4">
        <div className="flex items-center gap-3">
          <img src={logo} alt="" className="h-12 w-12 rounded-full object-cover" />
          <div>
            <div className="text-lg font-bold">Stylos Variedades</div>
            <div className="text-xs text-gray-500">Confirmación de pedido</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xl font-bold text-rose-600">{number}</div>
          <div className="text-xs text-gray-500">{formatDate(date)}</div>
        </div>
      </div>

      <div className="mt-3 text-sm text-gray-600">
        Cliente: <span className="font-medium text-gray-900">{customer}</span>
      </div>

      <div className="mt-4 space-y-3">
        {items.map((it) => (
          <div
            key={`${it.consec}-${it.productId}`}
            className={cn(
              "flex items-center gap-3",
              !it.available && "opacity-50 line-through",
            )}
          >
            <img
              src={it.image}
              alt=""
              className="h-12 w-12 shrink-0 rounded-xl object-cover"
              crossOrigin="anonymous"
            />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold">{it.name}</div>
              <div className="text-xs text-gray-500">
                {it.codigo} · x{it.quantity}
                {!it.available && " · No disponible"}
              </div>
            </div>
            <div className="shrink-0 text-sm font-semibold">{formatCOP(it.subtotal)}</div>
          </div>
        ))}
      </div>

      <div className="mt-5 flex items-baseline justify-between border-t border-gray-200 pt-4">
        <span className="text-sm font-semibold">Total a pagar</span>
        <span className="text-2xl font-bold text-rose-600">{formatCOP(total)}</span>
      </div>
    </div>
  );
});
