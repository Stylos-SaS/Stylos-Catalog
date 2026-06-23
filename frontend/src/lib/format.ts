import { APP_TIMEZONE, parseAppDate } from "./timezone";

export const formatCOP = (n: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(n);

export const formatDate = (iso: string) =>
  parseAppDate(iso).toLocaleDateString("es-CO", {
    timeZone: APP_TIMEZONE,
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
