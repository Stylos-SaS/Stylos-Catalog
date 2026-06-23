export type CatalogMode = "detal" | "mayor";

function parseCatalogMode(value: string | undefined): CatalogMode {
  return value === "mayor" ? "mayor" : "detal";
}

export const CATALOG_MODE = parseCatalogMode(import.meta.env.VITE_CATALOG_MODE);

export const IS_MAYOR_CATALOG = CATALOG_MODE === "mayor";

/** When false, storefront must not expose detal/mayor catalog distinction to clients. */
export const SHOW_CATALOG_MODE_UI = IS_MAYOR_CATALOG;

export const STOREFRONT_BANNER_LABEL = IS_MAYOR_CATALOG
  ? "Precios al por Mayor"
  : "Pedidos por WhatsApp";

export const CATALOG_LABEL = IS_MAYOR_CATALOG ? "Precios al por Mayor" : "Precios al Detal";

export const CATALOG_TITLE = IS_MAYOR_CATALOG ? "Catálogo Mayorista" : "Catálogo";

export const CATALOG_SHORT_LABEL = IS_MAYOR_CATALOG ? "Mayor" : "Detal";

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

export const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER ?? "573001234567";

export const STORE_CONTACT_EMAIL =
  import.meta.env.VITE_STORE_CONTACT_EMAIL ?? "hola@stylos.co";

export const STORE_CONTACT_INSTAGRAM =
  import.meta.env.VITE_STORE_CONTACT_INSTAGRAM ?? "stylos.variedades";

export const DEFAULT_STORE_SETTINGS = {
  whatsappNumber: WHATSAPP_NUMBER,
  contactEmail: STORE_CONTACT_EMAIL,
  contactInstagram: STORE_CONTACT_INSTAGRAM,
} as const;

export const CART_STORAGE_KEY = `stylos-cart-${CATALOG_MODE}`;

export function productPrice(
  product: { priceRetail: number; priceWholesale: number },
  mode: CatalogMode = CATALOG_MODE,
) {
  return mode === "detal" ? product.priceRetail : product.priceWholesale;
}
