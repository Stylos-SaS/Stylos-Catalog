import { API_BASE_URL, CATALOG_MODE, DEFAULT_STORE_SETTINGS } from "./config";
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

export type StoreSettings = {
  whatsappNumber: string;
  contactEmail: string;
  contactInstagram: string;
  contactLocation: string;
};

export function fetchPublicStoreSettings(): Promise<StoreSettings> {
  return apiFetch("/api/settings/store");
}

function withStoreSettingsFallback(settings: Partial<StoreSettings>): StoreSettings {
  return {
    whatsappNumber: settings.whatsappNumber || DEFAULT_STORE_SETTINGS.whatsappNumber,
    contactEmail: settings.contactEmail || DEFAULT_STORE_SETTINGS.contactEmail,
    contactInstagram: settings.contactInstagram || DEFAULT_STORE_SETTINGS.contactInstagram,
    contactLocation: settings.contactLocation || DEFAULT_STORE_SETTINGS.contactLocation,
  };
}

/** Reads store settings from API; falls back to VITE_* env when API is unavailable. */
export async function fetchPublicStoreSettingsWithFallback(): Promise<StoreSettings> {
  if (!API_BASE_URL) {
    return { ...DEFAULT_STORE_SETTINGS };
  }

  try {
    const settings = await fetchPublicStoreSettings();
    return withStoreSettingsFallback(settings);
  } catch {
    return { ...DEFAULT_STORE_SETTINGS };
  }
}

export function updateAdminProfile(payload: { nombre: string }): Promise<{ user: AdminUser }> {
  return apiFetchWithAuth(
    "/api/auth/profile",
    { method: "PATCH", body: JSON.stringify(payload) },
    authToken(),
  );
}

export function changeAdminPassword(payload: {
  currentPassword: string;
  newPassword: string;
}): Promise<{ ok: true }> {
  return apiFetchWithAuth(
    "/api/auth/password",
    { method: "PATCH", body: JSON.stringify(payload) },
    authToken(),
  );
}
