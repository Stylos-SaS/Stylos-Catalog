import { queryOptions, useQuery } from "@tanstack/react-query";
import {
  fetchCategories,
  fetchProduct,
  fetchProducts,
  fetchPublicStoreSettingsWithFallback,
  type StoreSettings,
} from "./api";
import { CATALOG_MODE, DEFAULT_STORE_SETTINGS, WHATSAPP_NUMBER } from "./config";
import type { ProductsQueryParams } from "./types";

export const storeSettingsKeys = {
  all: ["store-settings"] as const,
};

export function storeSettingsQueryOptions() {
  return queryOptions({
    queryKey: storeSettingsKeys.all,
    queryFn: fetchPublicStoreSettingsWithFallback,
    staleTime: 5 * 60 * 1000,
    placeholderData: DEFAULT_STORE_SETTINGS,
  });
}

export function useStoreSettings(): StoreSettings {
  const { data } = useQuery(storeSettingsQueryOptions());
  return data ?? DEFAULT_STORE_SETTINGS;
}

export function useStoreWhatsAppNumber(): string {
  return useStoreSettings().whatsappNumber || WHATSAPP_NUMBER;
}

export const categoryKeys = {
  all: ["categories"] as const,
};

export const productKeys = {
  all: ["products"] as const,
  lists: () => [...productKeys.all, "list"] as const,
  list: (params: ProductsQueryParams) => [...productKeys.lists(), CATALOG_MODE, params] as const,
  details: () => [...productKeys.all, "detail"] as const,
  detail: (id: string) => [...productKeys.details(), id] as const,
};

export function categoriesQueryOptions() {
  return queryOptions({
    queryKey: categoryKeys.all,
    queryFn: fetchCategories,
    staleTime: 5 * 60 * 1000,
  });
}

export function productsQueryOptions(params: ProductsQueryParams = {}) {
  return queryOptions({
    queryKey: productKeys.list(params),
    queryFn: () => fetchProducts(params),
  });
}

export function productQueryOptions(id: string) {
  return queryOptions({
    queryKey: productKeys.detail(id),
    queryFn: () => fetchProduct(id),
  });
}

export function featuredProductsQueryOptions(limit = 8) {
  return productsQueryOptions({ sort: "new", page: 1, limit });
}

export function relatedProductsQueryOptions(categoryId: string, excludeId: string, limit = 4) {
  return queryOptions({
    ...productsQueryOptions({ category: categoryId, page: 1, limit: limit + 1 }),
    select: (data) => data.items.filter((p) => p.id !== excludeId).slice(0, limit),
  });
}
