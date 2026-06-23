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

export function formatPhoneDisplay(input: string): string {
  const digits = input.replace(/\D/g, "");
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
  if (digits.length <= 10) {
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  }
  return `${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5, 8)} ${digits.slice(8, 12)}`;
}
