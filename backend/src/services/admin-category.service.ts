import { Prisma } from "../generated/prisma/client.js";
import type { PrismaClient } from "../generated/prisma/client.js";
import {
  DEFAULT_CATEGORY_EMOJI,
  emojiForCategoryName,
  normalizeCategoryEmoji,
  SIN_CATEGORIA_EMOJI,
} from "../lib/category-emoji.js";
import { DEFAULT_CATEGORY_NAME } from "../lib/default-category.js";
import { toAdminCategoryDTO } from "../lib/mappers.js";

export class CategoryAdminError extends Error {
  constructor(
    message: string,
    readonly statusCode: number,
  ) {
    super(message);
    this.name = "CategoryAdminError";
  }
}

function normalizeName(raw: string): string {
  return raw.trim();
}

function assertValidName(name: string) {
  if (!name || name.length > 80) {
    throw new CategoryAdminError("Category name must be between 1 and 80 characters.", 400);
  }
}

function parseEmoji(raw: string | undefined, fallback = DEFAULT_CATEGORY_EMOJI): string {
  if (raw === undefined) return fallback;
  try {
    return normalizeCategoryEmoji(raw);
  } catch {
    throw new CategoryAdminError("Invalid emoji.", 400);
  }
}

function mapPrismaError(error: unknown): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    throw new CategoryAdminError("A category with this name already exists.", 409);
  }
  throw error;
}

export async function listAdminCategories(prisma: PrismaClient) {
  const categories = await prisma.categoria.findMany({
    orderBy: { nombre: "asc" },
    include: { _count: { select: { productos: true } } },
  });

  return categories.map(toAdminCategoryDTO);
}

export async function createCategory(
  prisma: PrismaClient,
  input: { name: string; emoji?: string },
) {
  const name = normalizeName(input.name);
  assertValidName(name);

  if (name === DEFAULT_CATEGORY_NAME) {
    throw new CategoryAdminError("A category with this name already exists.", 409);
  }

  const emoji = parseEmoji(input.emoji);

  try {
    const category = await prisma.categoria.create({
      data: { nombre: name, emoji },
      include: { _count: { select: { productos: true } } },
    });
    return toAdminCategoryDTO(category);
  } catch (error) {
    mapPrismaError(error);
  }
}

export async function updateCategory(
  prisma: PrismaClient,
  id: string,
  input: { name?: string; emoji?: string },
) {
  const existing = await prisma.categoria.findUnique({ where: { id } });
  if (!existing) {
    throw new CategoryAdminError("Category not found", 404);
  }

  const isDefault = existing.nombre === DEFAULT_CATEGORY_NAME;
  const data: { nombre?: string; emoji?: string } = {};

  if (input.name !== undefined) {
    if (isDefault) {
      throw new CategoryAdminError("The default category name cannot be changed.", 409);
    }

    const name = normalizeName(input.name);
    assertValidName(name);

    if (name === DEFAULT_CATEGORY_NAME) {
      throw new CategoryAdminError("A category with this name already exists.", 409);
    }

    data.nombre = name;
  }

  if (input.emoji !== undefined) {
    data.emoji = parseEmoji(input.emoji, existing.emoji);
  }

  if (Object.keys(data).length === 0) {
    throw new CategoryAdminError("No fields to update.", 400);
  }

  try {
    const category = await prisma.categoria.update({
      where: { id },
      data,
      include: { _count: { select: { productos: true } } },
    });
    return toAdminCategoryDTO(category);
  } catch (error) {
    mapPrismaError(error);
  }
}

export async function deleteCategory(prisma: PrismaClient, id: string) {
  const existing = await prisma.categoria.findUnique({
    where: { id },
    include: { _count: { select: { productos: true } } },
  });

  if (!existing) {
    throw new CategoryAdminError("Category not found", 404);
  }

  if (existing.nombre === DEFAULT_CATEGORY_NAME) {
    throw new CategoryAdminError("The default category cannot be modified or deleted.", 409);
  }

  if (existing._count.productos > 0) {
    throw new CategoryAdminError(
      "Cannot delete category with assigned products. Reassign or delete products first.",
      409,
    );
  }

  await prisma.categoria.delete({ where: { id } });
}

export async function ensureDefaultCategory(prisma: PrismaClient) {
  await prisma.categoria.upsert({
    where: { nombre: DEFAULT_CATEGORY_NAME },
    update: {},
    create: { nombre: DEFAULT_CATEGORY_NAME, emoji: SIN_CATEGORIA_EMOJI },
  });
}
