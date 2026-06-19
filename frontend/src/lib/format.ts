export const formatCOP = (n: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(n);

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" });
