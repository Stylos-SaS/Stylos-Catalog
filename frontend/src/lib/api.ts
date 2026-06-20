import { API_BASE_URL, CATALOG_MODE } from "./config";
import type { Category, Product, ProductListResponse, ProductsQueryParams } from "./types";

export type CreateOrderPayload = {
  type: typeof CATALOG_MODE;
  contactoCliente: string;
  items: { productId: string; quantity: number }[];
};

export type CreateOrderResponse = {
  id: string;
  type: "detal" | "mayor";
  status: string;
  total: number;
  itemCount: number;
  createdAt: string;
  whatsappMessage: string;
  whatsappUrl: string;
  items: {
    productId: string;
    name: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }[];
};

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function requireApiBaseUrl(): string {
  if (!API_BASE_URL) {
    throw new ApiError("VITE_API_BASE_URL is not configured", 0);
  }
  return API_BASE_URL;
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${requireApiBaseUrl()}${path}`, init);

  if (!res.ok) {
    const body = await res.text();
    throw new ApiError(body || `Request failed (${res.status})`, res.status);
  }

  return res.json() as Promise<T>;
}

function buildProductsQuery(params: ProductsQueryParams = {}): string {
  const search = new URLSearchParams();
  search.set("mode", CATALOG_MODE);
  if (params.category) search.set("category", params.category);
  if (params.q?.trim()) search.set("q", params.q.trim());
  if (params.sort) search.set("sort", params.sort);
  if (params.page) search.set("page", String(params.page));
  if (params.limit) search.set("limit", String(params.limit));
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export function fetchCategories(): Promise<Category[]> {
  return apiFetch("/api/categories");
}

export function fetchProducts(params?: ProductsQueryParams): Promise<ProductListResponse> {
  return apiFetch(`/api/products${buildProductsQuery(params)}`);
}

export function fetchProduct(id: string): Promise<Product> {
  return apiFetch(`/api/products/${id}`);
}

export async function createOrder(payload: CreateOrderPayload): Promise<CreateOrderResponse> {
  return apiFetch("/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}
