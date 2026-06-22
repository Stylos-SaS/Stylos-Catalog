export const APP_TIMEZONE = "America/Bogota";

/** Parse YYYY-MM-DD as noon in Colombia to avoid day shifts across time zones. */
export function parseAppDate(iso: string): Date {
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    return new Date(`${iso}T12:00:00-05:00`);
  }
  return new Date(iso);
}

export function formatAppWeekday(date: Date, length: "short" | "long" = "short"): string {
  return date.toLocaleDateString("es-CO", {
    timeZone: APP_TIMEZONE,
    weekday: length,
  });
}

export function formatAppDayLabel(date: Date): string {
  return date.toLocaleDateString("es-CO", {
    timeZone: APP_TIMEZONE,
    weekday: "long",
    day: "numeric",
    month: "short",
  });
}
