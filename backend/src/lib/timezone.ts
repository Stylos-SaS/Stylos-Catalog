export const COLOMBIA_TIMEZONE = "America/Bogota";

/** Colombia has no DST; local midnight is always 05:00 UTC. */
const BOGOTA_UTC_OFFSET_HOURS = 5;

export function formatColombiaDateKey(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: COLOMBIA_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function colombiaDayStartUtc(dateKey: string): Date {
  return new Date(`${dateKey}T0${BOGOTA_UTC_OFFSET_HOURS}:00:00.000Z`);
}

export function buildLastSevenColombiaDays(): string[] {
  const todayKey = formatColombiaDateKey(new Date());
  const anchor = colombiaDayStartUtc(todayKey);
  const days: string[] = [];

  for (let offset = 6; offset >= 0; offset -= 1) {
    const instant = new Date(anchor.getTime() - offset * 24 * 60 * 60 * 1000);
    days.push(formatColombiaDateKey(instant));
  }

  return days;
}
