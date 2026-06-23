export const DEFAULT_CATEGORY_EMOJI = "✨";

export const CATEGORY_EMOJI_OPTIONS = [
  "✨",
  "📦",
  "🏠",
  "💍",
  "💄",
  "🎁",
  "📒",
  "🕯️",
  "👗",
  "👜",
  "🧸",
  "🌸",
  "☕",
  "🍫",
  "🎀",
  "💐",
] as const;

const LEGACY_EMOJI_BY_NAME: Record<string, string> = {
  "Sin Categoria": "📦",
  Hogar: "🏠",
  Accesorios: "💍",
  Belleza: "💄",
  Regalos: "🎁",
  Papelería: "📒",
  Decoración: "🕯️",
};

export function resolveCategoryEmoji(category: { name: string; emoji?: string }): string {
  if (category.emoji?.trim()) return category.emoji.trim();
  return LEGACY_EMOJI_BY_NAME[category.name] ?? DEFAULT_CATEGORY_EMOJI;
}
