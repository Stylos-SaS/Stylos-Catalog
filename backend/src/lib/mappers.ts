import type {
  Producto,
  ProductoImagen,
  Categoria,
  Pedido,
  DetallePedido,
  EstadoPedido,
  TipoPedido,
} from "../generated/prisma/client.js";
import { formatPedidoNumero } from "./pedido-number.js";
import { formatColombiaDateKey } from "./timezone.js";
import { DEFAULT_CATEGORY_NAME } from "./default-category.js";

export type ProductDTO = {
  id: string;
  codigo: string;
  name: string;
  description: string;
  category: string;
  categoryId: string;
  priceRetail: number;
  priceWholesale: number;
  /** Thumbnail URLs for cards/lists (falls back to full if thumb missing). */
  images: string[];
  /** Full-size URLs for product detail. */
  imagesFull: string[];
  createdAt: string;
  active: boolean;
};

export type CategoryDTO = {
  id: string;
  name: string;
  emoji: string;
};

export type AdminCategoryDTO = CategoryDTO & {
  productCount: number;
  isDefault: boolean;
};

export type ProductImageAssetDTO = {
  url: string;
  path: string;
  urlThumb: string | null;
  pathThumb: string | null;
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
  const sorted = [...product.imagenes].sort(
    (a, b) => Number(b.esPrincipal) - Number(a.esPrincipal),
  );

  return {
    id: product.id,
    codigo: product.codigo,
    name: product.nombre,
    description: product.descripcion,
    category: product.categoria.nombre,
    categoryId: product.categoria.id,
    priceRetail: product.precioDetal,
    priceWholesale: product.precioMayor,
    images: sorted.map((img) => img.urlThumb ?? img.url),
    imagesFull: sorted.map((img) => img.url),
    createdAt: formatColombiaDateKey(product.fechaCreacion),
    active: product.activo,
  };
}

export function toCategoryDTO(category: Categoria): CategoryDTO {
  return {
    id: category.id,
    name: category.nombre,
    emoji: category.emoji,
  };
}

export function toAdminCategoryDTO(
  category: Categoria & { _count: { productos: number } },
): AdminCategoryDTO {
  return {
    id: category.id,
    name: category.nombre,
    emoji: category.emoji,
    productCount: category._count.productos,
    isDefault: category.nombre === DEFAULT_CATEGORY_NAME,
  };
}

export function toAdminProductDTO(product: ProductWithRelations): AdminProductDTO {
  const imageAssets = [...product.imagenes]
    .sort((a, b) => Number(b.esPrincipal) - Number(a.esPrincipal))
    .map((img) => ({
      url: img.url,
      path: img.path,
      urlThumb: img.urlThumb,
      pathThumb: img.pathThumb,
      esPrincipal: img.esPrincipal,
    }));

  return {
    ...toProductDTO(product),
    imageAssets,
  };
}

export type AdminOrderLineDTO = {
  consec: number;
  productId: string;
  codigo: string;
  name: string;
  image: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
  available: boolean;
};

export type AdminOrderDTO = {
  id: string;
  number: string;
  date: string;
  type: TipoPedido;
  status: EstadoPedido;
  contactoCliente: string | null;
  customer: string;
  itemCount: number;
  total: number;
  items: AdminOrderLineDTO[];
};

export type AdminOrderListItemDTO = Omit<AdminOrderDTO, "items">;

type ProductWithImages = Producto & { imagenes: ProductoImagen[] };

type DetalleWithProduct = DetallePedido & { producto: ProductWithImages };

type PedidoWithDetails = Pedido & { detalles: DetalleWithProduct[] };

function primaryImageUrl(imagenes: ProductoImagen[]): string {
  const sorted = [...imagenes].sort((a, b) => Number(b.esPrincipal) - Number(a.esPrincipal));
  const primary = sorted[0];
  return primary?.urlThumb ?? primary?.url ?? "";
}

export function formatContactoCliente(phone: string | null): string {
  if (!phone) return "Sin contacto";
  if (phone.length === 12 && phone.startsWith("57")) {
    const local = phone.slice(2);
    return `+57 ${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6)}`;
  }
  return phone;
}

function toAdminOrderLineDTO(detail: DetalleWithProduct): AdminOrderLineDTO {
  return {
    consec: detail.consec,
    productId: detail.productoId,
    codigo: detail.producto.codigo,
    name: detail.producto.nombre,
    image: primaryImageUrl(detail.producto.imagenes),
    unitPrice: detail.precioUnitario,
    quantity: detail.cantidad,
    subtotal: detail.subtotal,
    available: detail.disponible,
  };
}

export function toAdminOrderDTO(order: PedidoWithDetails): AdminOrderDTO {
  const items = order.detalles.map(toAdminOrderLineDTO);

  return {
    id: order.id,
    number: formatPedidoNumero(order.numeroPedido),
    date: formatColombiaDateKey(order.fechaCreacion),
    type: order.tipoPedido,
    status: order.estado,
    contactoCliente: order.contactoCliente,
    customer: formatContactoCliente(order.contactoCliente),
    itemCount: order.cantidadProductos,
    total: order.total,
    items,
  };
}

export function toAdminOrderListItemDTO(order: PedidoWithDetails): AdminOrderListItemDTO {
  const { items: _items, ...summary } = toAdminOrderDTO(order);
  return summary;
}
