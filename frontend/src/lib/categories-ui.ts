import type { Category } from "./types";
import { resolveCategoryEmoji } from "./category-emojis";

export type CategoryWithUi = Category & { emoji: string };

export function enrichCategory(category: Category): CategoryWithUi {
  return {
    ...category,
    emoji: resolveCategoryEmoji(category),
  };
}

export function enrichCategories(categories: Category[]): CategoryWithUi[] {
  return categories.map(enrichCategory);
}
