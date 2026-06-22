import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Trash2,
  Replace,
  Plus,
  Minus,
  Ban,
  Download,
  CheckCircle2,
  X,
  Search,
  Loader2,
  AlertCircle,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { formatCOP, formatDate } from "@/lib/format";
import { StatusBadge, TypeBadge } from "./admin.index";
import { cn } from "@/lib/utils";
import { useAdminOrder, useUpdateAdminOrder } from "@/lib/admin-order-queries";
import { useAdminProducts } from "@/lib/admin-queries";
import type { AdminOrderLine, OrderType, Product } from "@/lib/types";
import { productPrimaryImage } from "@/lib/product-image";
import { useDebouncedCallback } from "@/lib/hooks/useDebouncedCallback";
import {
  buildAdminOrderDisplayRows,
  groupRowKey,
  type AdminOrderDisplayRow,
} from "@/lib/admin-order-lines";
import { ConfirmDocModal } from "@/components/admin/ConfirmDocModal";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/pedidos/$id")({
  component: OrderDetail,
  head: () => ({ meta: [{ title: "Pedido — Stylos Admin" }] }),
});

const SAVE_DEBOUNCE_MS = 500;

function computeOrderTotal(lines: AdminOrderLine[]) {
  return lines
    .filter((i) => i.available)
    .reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
}

function OrderDetail() {
  const { id } = Route.useParams();
  const { data: order, isLoading, error } = useAdminOrder(id);
  const updateOrder = useUpdateAdminOrder();
  const [items, setItems] = useState<AdminOrderLine[]>([]);
  const [replaceFor, setReplaceFor] = useState<string | null>(null);
  const [addingProduct, setAddingProduct] = useState(false);
  const [confirmView, setConfirmView] = useState(false);
  const [hasPendingSave, setHasPendingSave] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const orderSyncedRef = useRef<string | null>(null);

  const displayRows = useMemo(() => buildAdminOrderDisplayRows(items), [items]);

  useEffect(() => {
    orderSyncedRef.current = null;
  }, [id]);

  useEffect(() => {
    if (order && orderSyncedRef.current !== order.id) {
      setItems(order.items);
      orderSyncedRef.current = order.id;
      setHasPendingSave(false);
      setExpandedGroups(new Set());
    }
  }, [order]);

  const saveToServer = useCallback(
    async (nextItems: AdminOrderLine[]) => {
      if (!order) return;

      try {
        const updated = await updateOrder.mutateAsync({
          id: order.id,
          items: nextItems.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            available: i.available,
          })),
        });
        setItems(updated.items);
        setHasPendingSave(false);
        toast.success("Pedido actualizado");
      } catch (err) {
        setHasPendingSave(false);
        toast.error(err instanceof Error ? err.message : "No se pudo actualizar el pedido");
      }
    },
    [order, updateOrder],
  );

  const debouncedSave = useDebouncedCallback(saveToServer, SAVE_DEBOUNCE_MS);

  const applyChange = (nextItems: AdminOrderLine[]) => {
    setItems(nextItems);
    setHasPendingSave(true);
    debouncedSave(nextItems);
  };

  const toggleGroupExpand = (key: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleAvail = (productId: string) => {
    const next = items.map((i) =>
      i.productId === productId ? { ...i, available: !i.available } : i,
    );
    applyChange(next);
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity < 1) return;
    const next = items.map((i) =>
      i.productId === productId
        ? { ...i, quantity, subtotal: i.unitPrice * quantity }
        : i,
    );
    applyChange(next);
  };

  const removeItem = (productId: string) => {
    if (items.length <= 1) {
      toast.error("El pedido debe tener al menos un producto");
      return;
    }
    const next = items.filter((i) => i.productId !== productId);
    applyChange(next);
  };

  const replaceItem = (oldProductId: string, product: Product) => {
    const unitPrice = order!.type === "detal" ? product.priceRetail : product.priceWholesale;
    const next = items.map((i) =>
      i.productId === oldProductId
        ? {
            ...i,
            productId: product.id,
            codigo: product.codigo,
            name: product.name,
            image: productPrimaryImage(product.images),
            unitPrice,
            subtotal: unitPrice * i.quantity,
          }
        : i,
    );
    applyChange(next);
  };

  const addItem = (product: Product) => {
    if (items.some((i) => i.productId === product.id)) {
      toast.error("Este producto ya está en el pedido");
      return;
    }
    const unitPrice = order!.type === "detal" ? product.priceRetail : product.priceWholesale;
    const next = [
      ...items,
      {
        consec: items.length + 1,
        productId: product.id,
        codigo: product.codigo,
        name: product.name,
        image: productPrimaryImage(product.images),
        unitPrice,
        quantity: 1,
        subtotal: unitPrice,
        available: true,
      },
    ];
    applyChange(next);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="space-y-4 p-10 text-center">
        <AlertCircle className="mx-auto h-10 w-10 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          {error?.message ?? "Pedido no encontrado"}
        </p>
        <Link to="/admin/pedidos" className="text-primary text-sm font-semibold">
          Volver a pedidos
        </Link>
      </div>
    );
  }

  const displayTotal = computeOrderTotal(items);
  const saving = updateOrder.isPending;
  const syncStatus = saving ? "saving" : hasPendingSave ? "pending" : "idle";

  const lineActions = {
    saving,
    onToggleAvail: toggleAvail,
    onUpdateQuantity: updateQuantity,
    onReplace: setReplaceFor,
    onRemove: removeItem,
  };

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
            {formatDate(order.date)} · {order.customer}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setConfirmView(true)}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold hover:bg-secondary"
          >
            <Download className="h-4 w-4" /> Ver confirmación
          </button>
          <button
            disabled
            title="Próximamente"
            className="inline-flex items-center gap-2 rounded-full bg-success/15 text-success px-4 py-2 text-sm font-semibold opacity-60 cursor-not-allowed"
          >
            <CheckCircle2 className="h-4 w-4" /> Marcar completado
          </button>
          <button
            disabled
            title="Próximamente"
            className="inline-flex items-center gap-2 rounded-full bg-destructive/10 text-destructive px-4 py-2 text-sm font-semibold opacity-60 cursor-not-allowed"
          >
            <Trash2 className="h-4 w-4" /> Eliminar
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="rounded-2xl border border-border bg-card shadow-soft overflow-hidden">
          <div className="border-b border-border p-5 flex items-center justify-between">
            <h3 className="font-display text-lg font-semibold">Productos del pedido</h3>
            <button
              onClick={() => setAddingProduct(true)}
              disabled={saving}
              className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-3 py-1.5 text-xs font-semibold hover:bg-primary/15 disabled:opacity-60"
            >
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
                {displayRows.map((row) => (
                  <OrderDisplayRows
                    key={groupRowKey(row)}
                    row={row}
                    expanded={expandedGroups.has(groupRowKey(row))}
                    onToggleExpand={() => toggleGroupExpand(groupRowKey(row))}
                    {...lineActions}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
            <h3 className="font-display text-lg font-semibold">Resumen</h3>
            <div className="mt-4 space-y-2 text-sm">
              <Row label="Líneas" value={String(items.length)} />
              <Row label="Disponibles" value={String(items.filter((i) => i.available).length)} />
              <Row label="No disponibles" value={String(items.filter((i) => !i.available).length)} />
            </div>
            <div className="my-4 border-t border-border" />
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-muted-foreground">Total</span>
              <span className="font-display text-2xl font-bold text-primary">{formatCOP(displayTotal)}</span>
            </div>
            {syncStatus === "pending" && (
              <p className="mt-2 text-xs text-muted-foreground">Cambios pendientes...</p>
            )}
            {syncStatus === "saving" && (
              <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" /> Guardando...
              </p>
            )}
          </div>
          <div className="rounded-2xl bg-gradient-soft p-4 text-xs text-muted-foreground">
            Los precios mostrados son{" "}
            <strong className="text-foreground">
              al {order.type === "detal" ? "detal" : "por mayor"}
            </strong>
            . Al reemplazar productos solo se mostrarán precios de este tipo.
          </div>
        </aside>
      </div>

      {replaceFor && (
        <ProductPickerModal
          type={order.type}
          title="Reemplazar producto"
          onClose={() => setReplaceFor(null)}
          onPick={(p) => {
            replaceItem(replaceFor, p);
            setReplaceFor(null);
          }}
        />
      )}

      {addingProduct && (
        <ProductPickerModal
          type={order.type}
          title="Agregar producto"
          excludeIds={items.map((i) => i.productId)}
          onClose={() => setAddingProduct(false)}
          onPick={(p) => {
            addItem(p);
            setAddingProduct(false);
          }}
        />
      )}

      {confirmView && (
        <ConfirmDocModal
          order={{ ...order, items }}
          total={displayTotal}
          onClose={() => setConfirmView(false)}
        />
      )}
    </div>
  );
}

type LineActions = {
  saving: boolean;
  onToggleAvail: (productId: string) => void;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onReplace: (productId: string) => void;
  onRemove: (productId: string) => void;
};

function OrderDisplayRows({
  row,
  expanded,
  onToggleExpand,
  ...actions
}: {
  row: AdminOrderDisplayRow;
  expanded: boolean;
  onToggleExpand: () => void;
} & LineActions) {
  if (row.kind === "single") {
    return (
      <OrderLineRow
        line={row.line}
        {...actions}
      />
    );
  }

  return (
    <>
      <tr className="border-t border-border bg-secondary/10">
        <td className="px-5 py-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onToggleExpand}
              className="grid h-7 w-7 shrink-0 place-items-center rounded-full hover:bg-secondary"
              title={expanded ? "Ocultar líneas" : "Ver líneas individuales"}
            >
              {expanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
            <img src={row.image} alt="" className="h-11 w-11 rounded-xl object-cover" />
            <div>
              <span className="font-semibold">{row.name}</span>
              <div className="text-xs text-muted-foreground">
                Código {row.codigo} · {row.lines.length} líneas
              </div>
            </div>
          </div>
        </td>
        <td className="px-5 py-3 text-right">{formatCOP(row.unitPrice)}</td>
        <td className="px-5 py-3 text-center font-semibold tabular-nums">{row.quantity}</td>
        <td className="px-5 py-3 text-right font-semibold text-primary">
          {formatCOP(row.subtotal)}
        </td>
        <td className="px-5 py-3">
          <span className="rounded-full bg-success/15 px-2.5 py-0.5 text-[11px] font-semibold text-success">
            Agrupado
          </span>
        </td>
        <td className="px-5 py-3" />
      </tr>
      {expanded &&
        row.lines.map((line) => (
          <OrderLineRow key={`${line.consec}-${line.productId}`} line={line} nested {...actions} />
        ))}
    </>
  );
}

function OrderLineRow({
  line,
  nested = false,
  saving,
  onToggleAvail,
  onUpdateQuantity,
  onReplace,
  onRemove,
}: {
  line: AdminOrderLine;
  nested?: boolean;
} & LineActions) {
  return (
    <tr
      className={cn(
        "border-t border-border",
        !line.available && "opacity-50",
        nested && "bg-secondary/5",
      )}
    >
      <td className={cn("px-5 py-3", nested && "pl-14")}>
        <div className="flex items-center gap-3">
          <img src={line.image} alt="" className="h-11 w-11 rounded-xl object-cover" />
          <div>
            <span className="font-semibold">{line.name}</span>
            {line.codigo && (
              <div className="text-xs text-muted-foreground">{line.codigo}</div>
            )}
          </div>
        </div>
      </td>
      <td className="px-5 py-3 text-right">{formatCOP(line.unitPrice)}</td>
      <td className="px-5 py-3">
        <div className="flex items-center justify-center gap-1">
          <button
            type="button"
            onClick={() => onUpdateQuantity(line.productId, line.quantity - 1)}
            disabled={saving || line.quantity <= 1}
            className="grid h-7 w-7 place-items-center rounded-full hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed"
            title="Disminuir cantidad"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
          <span className="w-8 text-center text-sm font-semibold tabular-nums">
            {line.quantity}
          </span>
          <button
            type="button"
            onClick={() => onUpdateQuantity(line.productId, line.quantity + 1)}
            disabled={saving}
            className="grid h-7 w-7 place-items-center rounded-full hover:bg-secondary disabled:opacity-40"
            title="Aumentar cantidad"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
      </td>
      <td className="px-5 py-3 text-right font-semibold text-primary">
        {formatCOP(line.subtotal)}
      </td>
      <td className="px-5 py-3">
        <button
          onClick={() => onToggleAvail(line.productId)}
          disabled={saving}
          className={cn(
            "rounded-full px-2.5 py-0.5 text-[11px] font-semibold disabled:opacity-60",
            line.available ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive",
          )}
        >
          {line.available ? "Disponible" : "No disponible"}
        </button>
      </td>
      <td className="px-5 py-3">
        <div className="flex justify-end gap-1">
          <button
            onClick={() => onToggleAvail(line.productId)}
            disabled={saving}
            title="Marcar no disponible"
            className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:bg-warning/15 hover:text-foreground disabled:opacity-40"
          >
            <Ban className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onReplace(line.productId)}
            disabled={saving}
            title="Reemplazar"
            className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-40"
          >
            <Replace className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onRemove(line.productId)}
            disabled={saving}
            title="Eliminar"
            className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-40"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </td>
    </tr>
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

function ProductPickerModal({
  type,
  title,
  excludeIds = [],
  onClose,
  onPick,
}: {
  type: OrderType;
  title: string;
  excludeIds?: string[];
  onClose: () => void;
  onPick: (p: Product) => void;
}) {
  const [q, setQ] = useState("");
  const { data, isLoading } = useAdminProducts({ q });
  const list = (data?.items ?? []).filter((p) => !excludeIds.includes(p.id));

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/30 backdrop-blur-sm p-4">
      <div className="w-full max-w-xl rounded-3xl bg-background shadow-pop overflow-hidden">
        <div className="flex items-center justify-between border-b border-border p-5">
          <div>
            <h2 className="font-display text-xl font-bold">{title}</h2>
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
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar producto..."
              className="w-full bg-transparent text-sm outline-none"
            />
          </div>
        </div>
        <div className="max-h-[50vh] overflow-y-auto p-3 space-y-1">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : list.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No hay productos.</p>
          ) : (
            list.map((p) => (
              <button
                key={p.id}
                onClick={() => onPick(p)}
                className="w-full flex items-center gap-3 rounded-2xl p-3 text-left hover:bg-secondary transition"
              >
                <img
                  src={productPrimaryImage(p.images)}
                  alt=""
                  className="h-12 w-12 rounded-xl object-cover"
                />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">{p.name}</div>
                  <div className="text-xs text-muted-foreground">{p.category}</div>
                </div>
                <div className="font-display font-bold text-primary">
                  {formatCOP(type === "detal" ? p.priceRetail : p.priceWholesale)}
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
