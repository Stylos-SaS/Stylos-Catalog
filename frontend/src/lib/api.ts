import { API_BASE_URL, CATALOG_MODE } from "./config";
import type { Category, Product, ProductListResponse, ProductsQueryParams } from "./types";
import type { AdminUser } from "./auth-storage";
import { ApiError, apiFetch, apiFetchWithAuth } from "./api-core";
import { useAuth } from "./auth";

export { ApiError } from "./api-core";

export type CreateOrderPayload = {
  type: typeof CATALOG_MODE;
  contactoCliente: string;
  items: { productId: string; quantity: number }[];
};

export type CreateOrderResponse = {
  id: string;
  number: string;
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

function authToken(): string | null {
  return useAuth.getState().token;
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
    body: JSON.stringify(payload),
  });
}

export type LoginPayload = {
  username: string;
  password: string;
};

export type LoginResponse = {
  token: string;
  user: AdminUser;
};

export function loginAdmin(payload: LoginPayload): Promise<LoginResponse> {
  return apiFetch("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function fetchAdminProfile(): Promise<{ user: AdminUser }> {
  return apiFetchWithAuth("/api/auth/me", undefined, authToken());
}
