export const DEFAULT_CATEGORY_EMOJI = "✨";

/** Emoji for the protected default category "Sin Categoria". */
export const SIN_CATEGORIA_EMOJI = "📦";

export const LEGACY_EMOJI_BY_NAME: Record<string, string> = {
  "Sin Categoria": SIN_CATEGORIA_EMOJI,
  Hogar: "🏠",
  Accesorios: "💍",
  Belleza: "💄",
  Regalos: "🎁",
  Papelería: "📒",
  Decoración: "🕯️",
};

export function emojiForCategoryName(name: string): string {
  return LEGACY_EMOJI_BY_NAME[name] ?? DEFAULT_CATEGORY_EMOJI;
}

export function normalizeCategoryEmoji(raw: string): string {
  const emoji = raw.trim();
  if (!emoji || emoji.length > 16) {
    throw new Error("Invalid emoji");
  }
  return emoji;
}
