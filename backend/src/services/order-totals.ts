export type PedidoDetalleLine = {
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  disponible?: boolean;
};

export function computeLineSubtotal(cantidad: number, precioUnitario: number): number {
  return cantidad * precioUnitario;
}

/** Suma cantidades y subtotales de las líneas del pedido. */
export function summarizePedidoDetalles(
  detalles: PedidoDetalleLine[],
  options?: { onlyAvailable?: boolean },
) {
  const lines = options?.onlyAvailable
    ? detalles.filter((d) => d.disponible !== false)
    : detalles;

  return {
    cantidadProductos: lines.reduce((sum, d) => sum + d.cantidad, 0),
    total: lines.reduce((sum, d) => sum + d.subtotal, 0),
  };
}

/** Recalcula subtotal por línea y totales del pedido (para creación y edición admin). */
export function buildDetalleLines(
  lines: { cantidad: number; precioUnitario: number; disponible?: boolean }[],
) {
  const detalles = lines.map((line) => ({
    cantidad: line.cantidad,
    precioUnitario: line.precioUnitario,
    subtotal: computeLineSubtotal(line.cantidad, line.precioUnitario),
    disponible: line.disponible ?? true,
  }));

  return {
    detalles,
    ...summarizePedidoDetalles(detalles),
  };
}

/** Total a pagar: solo líneas disponibles (RF-10). */
export function computePedidoTotal(detalles: PedidoDetalleLine[]): number {
  return summarizePedidoDetalles(detalles, { onlyAvailable: true }).total;
}
