import type { Producto, ProductoImagen, Categoria } from "../generated/prisma/client.js";

export type ProductDTO = {
  id: string;
  codigo: string;
  name: string;
  description: string;
  category: string;
  categoryId: string;
  priceRetail: number;
  priceWholesale: number;
  images: string[];
  createdAt: string;
  active: boolean;
};

export type CategoryDTO = {
  id: string;
  name: string;
};

export type ProductImageAssetDTO = {
  url: string;
  path: string;
  esPrincipal: boolean;
};

export type AdminProductDTO = ProductDTO & {
  imageAssets: ProductImageAssetDTO[];
};

type ProductWithRelations = Producto & {
  categoria: Categoria;
  imagenes: ProductoImagen[];
};

export function toProductDTO(product: ProductWithRelations): ProductDTO {
  const images = [...product.imagenes]
    .sort((a, b) => Number(b.esPrincipal) - Number(a.esPrincipal))
    .map((img) => img.url);

  return {
    id: product.id,
    codigo: product.codigo,
    name: product.nombre,
    description: product.descripcion,
    category: product.categoria.nombre,
    categoryId: product.categoria.id,
    priceRetail: product.precioDetal,
    priceWholesale: product.precioMayor,
    images,
    createdAt: product.fechaCreacion.toISOString().slice(0, 10),
    active: product.activo,
  };
}

export function toCategoryDTO(category: Categoria): CategoryDTO {
  return {
    id: category.id,
    name: category.nombre,
  };
}

export function toAdminProductDTO(product: ProductWithRelations): AdminProductDTO {
  const imageAssets = [...product.imagenes]
    .sort((a, b) => Number(b.esPrincipal) - Number(a.esPrincipal))
    .map((img) => ({
      url: img.url,
      path: img.path,
      esPrincipal: img.esPrincipal,
    }));

  return {
    ...toProductDTO(product),
    imageAssets,
  };
}
