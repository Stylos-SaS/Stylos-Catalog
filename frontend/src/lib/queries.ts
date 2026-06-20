import { queryOptions } from "@tanstack/react-query";
import { fetchCategories, fetchProduct, fetchProducts } from "./api";
import { CATALOG_MODE } from "./config";
import type { ProductsQueryParams } from "./types";

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
