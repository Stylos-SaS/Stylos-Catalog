export type CatalogMode = "detal" | "mayor";

function parseCatalogMode(value: string | undefined): CatalogMode {
  return value === "mayor" ? "mayor" : "detal";
}

export const CATALOG_MODE = parseCatalogMode(import.meta.env.VITE_CATALOG_MODE);

export const IS_MAYOR_CATALOG = CATALOG_MODE === "mayor";

export const CATALOG_LABEL = IS_MAYOR_CATALOG ? "Precios al por Mayor" : "Precios al Detal";

export const CATALOG_TITLE = IS_MAYOR_CATALOG ? "Catálogo Mayorista" : "Catálogo";

export const CATALOG_SHORT_LABEL = IS_MAYOR_CATALOG ? "Mayor" : "Detal";

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

export const CART_STORAGE_KEY = `stylos-cart-${CATALOG_MODE}`;

export function productPrice(
  product: { priceRetail: number; priceWholesale: number },
  mode: CatalogMode = CATALOG_MODE,
) {
  return mode === "detal" ? product.priceRetail : product.priceWholesale;
}
