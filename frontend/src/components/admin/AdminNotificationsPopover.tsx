import { Link } from "@tanstack/react-router";
import { Bell, Loader2 } from "lucide-react";
import { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAdminDashboard } from "@/lib/admin-dashboard-queries";
import { useAdminPendingOrdersPreview } from "@/lib/admin-order-queries";
import { formatCOP } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

export function AdminNotificationsPopover() {
  const isMobile = useIsMobile();
  const { data: dashboard } = useAdminDashboard();
  const { data: pendingData, isLoading } = useAdminPendingOrdersPreview();

  const pendingCount = dashboard?.orderCounts.pendiente ?? 0;
  const pendingOrders = pendingData?.items ?? [];

  return (
    <Popover>
      {isMobile && (
        <PopoverAnchor className="pointer-events-none fixed left-1/2 top-[4.75rem] h-0 w-0 -translate-x-1/2" />
      )}
      <PopoverTrigger asChild>
        <button
          type="button"
          className="relative grid h-10 w-10 place-items-center rounded-full bg-secondary hover:bg-accent shrink-0"
          aria-label={
            pendingCount > 0
              ? `${pendingCount} pedidos pendientes`
              : "Notificaciones de pedidos"
          }
        >
          <Bell className="h-4 w-4" />
          {pendingCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 grid min-h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
              {pendingCount > 99 ? "99+" : pendingCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align={isMobile ? "center" : "end"}
        side="bottom"
        sideOffset={8}
        collisionPadding={16}
        className={cn("p-0", isMobile ? "w-[calc(100vw-2rem)] max-w-sm" : "w-80")}
      >
        <div className="border-b border-border px-4 py-3">
          <h3 className="font-display text-sm font-semibold">Pedidos pendientes</h3>
          <p className="text-xs text-muted-foreground">
            {pendingCount === 0
              ? "No hay pedidos por revisar"
              : `${pendingCount} pedido${pendingCount === 1 ? "" : "s"} por revisar`}
          </p>
        </div>

        <div className="max-h-72 overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          ) : pendingOrders.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              No hay pedidos pendientes.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {pendingOrders.map((order) => (
                <li key={order.id}>
                  <Link
                    to="/admin/pedidos/$id"
                    params={{ id: order.id }}
                    className="flex items-start justify-between gap-3 px-4 py-3 transition hover:bg-secondary/40"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-semibold">{order.number}</div>
                      <div className="truncate text-xs text-muted-foreground">{order.customer}</div>
                    </div>
                    <div className="shrink-0 text-right text-xs font-semibold text-primary">
                      {formatCOP(order.total)}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        {pendingCount > 0 && (
          <div className="border-t border-border p-2">
            <Link
              to="/admin/pedidos"
              search={{ tab: "pendiente" }}
              className={cn(
                "block rounded-lg px-3 py-2 text-center text-xs font-semibold text-primary",
                "hover:bg-primary/10 transition",
              )}
            >
              Ver todos
            </Link>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
