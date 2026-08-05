import { Prisma } from "../generated/prisma/client.js";
import type { PrismaClient } from "../generated/prisma/client.js";
import { toAdminProductDTO } from "../lib/mappers.js";
import { deleteStorageFiles, relocateTmpProductImages } from "../lib/storage.js";

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
  urlThumb?: string | null;
  pathThumb?: string | null;
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
    urlThumb: img.urlThumb ?? null,
    pathThumb: img.pathThumb ?? null,
    esPrincipal: img.esPrincipal ?? index === 0,
  }));
}

function collectImagePaths(
  images: { path: string; pathThumb?: string | null }[],
): string[] {
  const paths: string[] = [];
  for (const img of images) {
    paths.push(img.path);
    if (img.pathThumb) paths.push(img.pathThumb);
  }
  return paths;
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
    },
    include: productInclude,
  });

  const finalImages = await relocateTmpProductImages(product.id, input.images ?? []);

  if (finalImages.length > 0) {
    await prisma.productoImagen.createMany({
      data: mapImages(finalImages).map((img) => ({
        ...img,
        productoId: product.id,
      })),
    });
  }

  const withImages = await prisma.producto.findUniqueOrThrow({
    where: { id: product.id },
    include: productInclude,
  });

  return toAdminProductDTO(withImages);
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
  const imagesToPersist =
    input.images !== undefined
      ? await relocateTmpProductImages(id, input.images)
      : undefined;

  const product = await prisma.$transaction(async (tx) => {
    if (imagesToPersist !== undefined) {
      const nextPaths = new Set(imagesToPersist.map((img) => img.path));
      for (const img of existing.imagenes) {
        if (!nextPaths.has(img.path)) {
          removedPaths.push(...collectImagePaths([img]));
        }
      }

      await tx.productoImagen.deleteMany({ where: { productoId: id } });
      if (imagesToPersist.length > 0) {
        await tx.productoImagen.createMany({
          data: mapImages(imagesToPersist).map((img) => ({
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

  const paths = collectImagePaths(existing.imagenes);
  if (paths.length > 0) {
    await deleteStorageFiles(paths);
  }
}
