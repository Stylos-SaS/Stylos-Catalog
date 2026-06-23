import type { PrismaClient } from "../src/generated/prisma/client.js";
import { ensureDefaultCategory } from "../src/services/admin-category.service.js";
import { emojiForCategoryName } from "../src/lib/category-emoji.js";

export const SEED_CATEGORIES = [
  "Hogar",
  "Accesorios",
  "Belleza",
  "Regalos",
  "Papelería",
  "Decoración",
] as const;

export async function seedCategories(prisma: PrismaClient) {
  await ensureDefaultCategory(prisma);

  for (const nombre of SEED_CATEGORIES) {
    await prisma.categoria.upsert({
      where: { nombre },
      update: {},
      create: { nombre, emoji: emojiForCategoryName(nombre) },
    });
  }
}
