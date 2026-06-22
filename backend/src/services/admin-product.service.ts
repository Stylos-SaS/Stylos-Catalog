import { Prisma } from "../generated/prisma/client.js";
import type { PrismaClient } from "../generated/prisma/client.js";
import { toAdminProductDTO, toProductDTO } from "../lib/mappers.js";
import { deleteStorageFiles } from "../lib/storage.js";

const productInclude = {
  categoria: true,
  imagenes: true,
} as const;

export class ProductAdminError extends Error {
  constructor(
    message: string,
    readonly statusCode: number,
  ) {
    super(message);
    this.name = "ProductAdminError";
  }
}

export type ProductImageInput = {
  url: string;
  path: string;
  esPrincipal?: boolean;
};

export type UpsertAdminProductInput = {
  codigo: string;
  name: string;
  description: string;
  categoryId: string;
  priceRetail: number;
  priceWholesale: number;
  images?: ProductImageInput[];
  active?: boolean;
};

function mapImages(images: ProductImageInput[]) {
  return images.map((img, index) => ({
    url: img.url,
    path: img.path,
    esPrincipal: img.esPrincipal ?? index === 0,
  }));
}

async function assertCategory(prisma: PrismaClient, categoryId: string) {
  const categoria = await prisma.categoria.findUnique({ where: { id: categoryId } });
  if (!categoria) {
    throw new ProductAdminError("Category not found", 404);
  }
}

export async function createAdminProduct(prisma: PrismaClient, input: UpsertAdminProductInput) {
  await assertCategory(prisma, input.categoryId);

  const product = await prisma.producto.create({
    data: {
      codigo: input.codigo,
      nombre: input.name,
      descripcion: input.description,
      precioDetal: input.priceRetail,
      precioMayor: input.priceWholesale,
      categoriaId: input.categoryId,
      activo: input.active ?? true,
      imagenes: input.images?.length ? { create: mapImages(input.images) } : undefined,
    },
    include: productInclude,
  });

  return toAdminProductDTO(product);
}

export async function updateAdminProduct(
  prisma: PrismaClient,
  id: string,
  input: Partial<UpsertAdminProductInput>,
) {
  const existing = await prisma.producto.findUnique({
    where: { id },
    include: { imagenes: true },
  });

  if (!existing) {
    throw new ProductAdminError("Product not found", 404);
  }

  if (input.categoryId) {
    await assertCategory(prisma, input.categoryId);
  }

  const removedPaths: string[] = [];

  const product = await prisma.$transaction(async (tx) => {
    if (input.images !== undefined) {
      const nextPaths = new Set(input.images.map((img) => img.path));
      for (const img of existing.imagenes) {
        if (!nextPaths.has(img.path)) {
          removedPaths.push(img.path);
        }
      }

      await tx.productoImagen.deleteMany({ where: { productoId: id } });
      if (input.images.length > 0) {
        await tx.productoImagen.createMany({
          data: mapImages(input.images).map((img) => ({
            ...img,
            productoId: id,
          })),
        });
      }
    }

    return tx.producto.update({
      where: { id },
      data: {
        ...(input.codigo !== undefined ? { codigo: input.codigo } : {}),
        ...(input.name !== undefined ? { nombre: input.name } : {}),
        ...(input.description !== undefined ? { descripcion: input.description } : {}),
        ...(input.priceRetail !== undefined ? { precioDetal: input.priceRetail } : {}),
        ...(input.priceWholesale !== undefined ? { precioMayor: input.priceWholesale } : {}),
        ...(input.categoryId !== undefined ? { categoriaId: input.categoryId } : {}),
        ...(input.active !== undefined ? { activo: input.active } : {}),
      },
      include: productInclude,
    });
  });

  if (removedPaths.length > 0) {
    await deleteStorageFiles(removedPaths);
  }

  return toAdminProductDTO(product);
}

export async function deleteAdminProduct(prisma: PrismaClient, id: string) {
  const existing = await prisma.producto.findUnique({
    where: { id },
    include: { imagenes: true },
  });

  if (!existing) {
    throw new ProductAdminError("Product not found", 404);
  }

  try {
    await prisma.producto.delete({ where: { id } });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2003"
    ) {
      throw new ProductAdminError(
        "Cannot delete a product that is referenced by existing orders",
        409,
      );
    }
    throw error;
  }

  const paths = existing.imagenes.map((img) => img.path);
  if (paths.length > 0) {
    await deleteStorageFiles(paths);
  }
}
