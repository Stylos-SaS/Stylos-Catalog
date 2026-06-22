import { useRef, useState } from "react";
import { Download, Loader2, X } from "lucide-react";
import type { AdminOrderLine, OrderType } from "@/lib/types";
import { OrderConfirmationDocument } from "@/components/admin/OrderConfirmationDocument";
import {
  exportConfirmationAsPdf,
  exportConfirmationAsPng,
} from "@/lib/order-confirmation-export";
import { toast } from "sonner";

type ConfirmDocModalProps = {
  order: {
    number: string;
    date: string;
    type: OrderType;
    customer: string;
    items: AdminOrderLine[];
  };
  total: number;
  onClose: () => void;
};

export function ConfirmDocModal({ order, total, onClose }: ConfirmDocModalProps) {
  const docRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState<"pdf" | "png" | null>(null);

  const baseFilename = `${order.number.replace(/\s/g, "")}-confirmacion`;

  const handleExport = async (format: "pdf" | "png") => {
    const node = docRef.current;
    if (!node) return;

    setExporting(format);
    try {
      if (format === "png") {
        await exportConfirmationAsPng(node, `${baseFilename}.png`);
      } else {
        await exportConfirmationAsPdf(node, `${baseFilename}.pdf`);
      }
      toast.success(format === "pdf" ? "PDF descargado" : "Imagen descargada");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo exportar el documento");
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/30 backdrop-blur-sm p-4">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-background shadow-pop">
        <div className="flex shrink-0 items-center justify-between border-b border-border p-5">
          <h2 className="font-display text-xl font-bold">Confirmación del pedido</h2>
          <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full hover:bg-secondary">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto bg-secondary/20 p-6">
          <div className="flex justify-center">
            <OrderConfirmationDocument
              ref={docRef}
              number={order.number}
              date={order.date}
              type={order.type}
              customer={order.customer}
              items={order.items}
              total={total}
            />
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap justify-end gap-2 border-t border-border bg-secondary/30 p-4">
          <button
            type="button"
            disabled={exporting !== null}
            onClick={() => void handleExport("pdf")}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold hover:bg-secondary disabled:opacity-60"
          >
            {exporting === "pdf" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Descargar PDF
          </button>
          <button
            type="button"
            disabled={exporting !== null}
            onClick={() => void handleExport("png")}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold hover:bg-secondary disabled:opacity-60"
          >
            {exporting === "png" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Descargar imagen
          </button>
        </div>
      </div>
    </div>
  );
}
