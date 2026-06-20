import type { Category } from "./types";

const UI_BY_NAME: Record<string, { emoji: string }> = {
  Hogar: { emoji: "🏠" },
  Accesorios: { emoji: "💍" },
  Belleza: { emoji: "💄" },
  Regalos: { emoji: "🎁" },
  Papelería: { emoji: "📒" },
  Decoración: { emoji: "🕯️" },
};

const DEFAULT_EMOJI = "✨";

export type CategoryWithUi = Category & { emoji: string };

export function enrichCategory(category: Category): CategoryWithUi {
  return {
    ...category,
    emoji: UI_BY_NAME[category.name]?.emoji ?? DEFAULT_EMOJI,
  };
}

export function enrichCategories(categories: Category[]): CategoryWithUi[] {
  return categories.map(enrichCategory);
}
