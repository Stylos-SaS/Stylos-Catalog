import type { PrismaClient } from "../generated/prisma/client.js";
import { toProductDTO } from "../lib/mappers.js";

const productInclude = {
  categoria: true,
  imagenes: true,
} as const;

export type ProductListParams = {
  category?: string;
  q?: string;
  sort?: "new" | "price-asc" | "price-desc";
  page?: number;
  limit?: number;
  priceField?: "precioDetal" | "precioMayor";
  activeOnly?: boolean;
};

function categoryFilter(category: string) {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(category);
  if (isUuid) {
    return { categoriaId: category };
  }
  return { categoria: { nombre: { equals: category, mode: "insensitive" as const } } };
}

export async function listProducts(prisma: PrismaClient, params: ProductListParams) {
  const page = params.page ?? 1;
  const limit = Math.min(params.limit ?? 24, 100);
  const skip = (page - 1) * limit;

  const where = {
    ...(params.activeOnly ? { activo: true } : {}),
    ...(params.category ? categoryFilter(params.category) : {}),
    ...(params.q
      ? {
          OR: [
            { nombre: { contains: params.q, mode: "insensitive" as const } },
            { descripcion: { contains: params.q, mode: "insensitive" as const } },
            { codigo: { contains: params.q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const priceField = params.priceField ?? "precioDetal";

  const orderBy =
    params.sort === "price-asc"
      ? { [priceField]: "asc" as const }
      : params.sort === "price-desc"
        ? { [priceField]: "desc" as const }
        : { fechaCreacion: "desc" as const };

  const [items, total] = await Promise.all([
    prisma.producto.findMany({
      where,
      include: productInclude,
      orderBy,
      skip,
      take: limit,
    }),
    prisma.producto.count({ where }),
  ]);

  return {
    items: items.map(toProductDTO),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

export async function getProductById(
  prisma: PrismaClient,
  id: string,
  options?: { activeOnly?: boolean },
) {
  const product = await prisma.producto.findUnique({
    where: { id },
    include: productInclude,
  });

  if (!product) return null;
  if (options?.activeOnly && !product.activo) return null;

  return toProductDTO(product);
}
