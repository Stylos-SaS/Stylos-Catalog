/** Normaliza a E.164 sin + para Colombia (573XXXXXXXXX). */
export function normalizeWhatsAppPhone(input: string): string | null {
  const digits = input.replace(/\D/g, "");
  if (digits.length === 10 && digits.startsWith("3")) {
    return `57${digits}`;
  }
  if (digits.length === 12 && digits.startsWith("57")) {
    return digits;
  }
  return null;
}

export function isValidWhatsAppPhone(input: string): boolean {
  return normalizeWhatsAppPhone(input) !== null;
}
