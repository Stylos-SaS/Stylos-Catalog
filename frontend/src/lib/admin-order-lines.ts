import type { AdminOrderLine } from "./types";

export type AdminOrderDisplayRow =
  | { kind: "single"; line: AdminOrderLine }
  | {
      kind: "group";
      codigo: string;
      name: string;
      image: string;
      unitPrice: number;
      quantity: number;
      subtotal: number;
      lines: AdminOrderLine[];
    };

function lineGroupKey(line: AdminOrderLine): string {
  const codigo = line.codigo?.trim();
  return codigo ? codigo : `__line-${line.consec}-${line.productId}`;
}

function canGroupLines(lines: AdminOrderLine[]): boolean {
  if (lines.length < 2) return false;
  if (!lines.every((l) => l.available)) return false;
  const prices = new Set(lines.map((l) => l.unitPrice));
  return prices.size === 1;
}

export function buildAdminOrderDisplayRows(items: AdminOrderLine[]): AdminOrderDisplayRow[] {
  const byCodigo = new Map<string, AdminOrderLine[]>();

  for (const line of items) {
    const key = lineGroupKey(line);
    const bucket = byCodigo.get(key) ?? [];
    bucket.push(line);
    byCodigo.set(key, bucket);
  }

  const rows: AdminOrderDisplayRow[] = [];
  const seenKeys = new Set<string>();

  for (const line of items) {
    const key = lineGroupKey(line);
    if (seenKeys.has(key)) continue;

    const group = byCodigo.get(key)!;
    seenKeys.add(key);

    if (canGroupLines(group)) {
      rows.push({
        kind: "group",
        codigo: line.codigo.trim() || group[0]!.codigo,
        name: group[0]!.name,
        image: group[0]!.image,
        unitPrice: group[0]!.unitPrice,
        quantity: group.reduce((sum, l) => sum + l.quantity, 0),
        subtotal: group.reduce((sum, l) => sum + l.subtotal, 0),
        lines: group,
      });
    } else {
      for (const member of group) {
        rows.push({ kind: "single", line: member });
      }
    }
  }

  return rows;
}

export function groupRowKey(row: AdminOrderDisplayRow): string {
  if (row.kind === "single") return `single-${row.line.consec}-${row.line.productId}`;
  return `group-${row.codigo}`;
}
