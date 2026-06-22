import { useAuth } from "./auth";
import type {
  AdminOrder,
  AdminOrderListResponse,
  AdminProduct,
  Category,
  OrderStatus,
  Product,
  ProductListResponse,
} from "./types";
import { ApiError, apiFetchWithAuth } from "./api-core";

export type ProductImagePayload = {
  url: string;
  path: string;
  esPrincipal?: boolean;
};

export type UpsertAdminProductPayload = {
  codigo: string;
  name: string;
  description: string;
  categoryId: string;
  priceRetail: number;
  priceWholesale: number;
  images?: ProductImagePayload[];
  active?: boolean;
};

function token() {
  return useAuth.getState().token;
}

export function fetchAdminProducts(params?: {
  q?: string;
  category?: string;
  page?: number;
  limit?: number;
}): Promise<ProductListResponse> {
  const search = new URLSearchParams();
  if (params?.q?.trim()) search.set("q", params.q.trim());
  if (params?.category) search.set("category", params.category);
  if (params?.page) search.set("page", String(params.page));
  if (params?.limit) search.set("limit", String(params.limit));
  const qs = search.toString();
  return apiFetchWithAuth(`/api/admin/products${qs ? `?${qs}` : ""}`, undefined, token());
}

export function fetchAdminProduct(id: string): Promise<AdminProduct> {
  return apiFetchWithAuth(`/api/admin/products/${id}`, undefined, token());
}

export function createAdminProduct(payload: UpsertAdminProductPayload): Promise<AdminProduct> {
  return apiFetchWithAuth(
    "/api/admin/products",
    { method: "POST", body: JSON.stringify(payload) },
    token(),
  );
}

export function updateAdminProduct(
  id: string,
  payload: Partial<UpsertAdminProductPayload>,
): Promise<AdminProduct> {
  return apiFetchWithAuth(
    `/api/admin/products/${id}`,
    { method: "PUT", body: JSON.stringify(payload) },
    token(),
  );
}

export async function deleteAdminProduct(id: string): Promise<void> {
  await apiFetchWithAuth(`/api/admin/products/${id}`, { method: "DELETE" }, token());
}

export async function uploadAdminProductImage(
  file: File,
  productId?: string,
): Promise<ProductImagePayload> {
  const form = new FormData();
  form.append("file", file);

  const base = import.meta.env.VITE_API_BASE_URL;
  if (!base) throw new ApiError("VITE_API_BASE_URL is not configured", 0);

  const qs = productId ? `?productId=${encodeURIComponent(productId)}` : "";
  const res = await fetch(`${base}/api/admin/products/upload-image${qs}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token()}` },
    body: form,
  });

  if (!res.ok) {
    const body = await res.text();
    throw new ApiError(body || `Upload failed (${res.status})`, res.status);
  }

  return res.json() as Promise<ProductImagePayload>;
}

export type UpdateAdminOrderLinePayload = {
  productId: string;
  quantity: number;
  available: boolean;
};

export function fetchAdminOrders(params?: {
  q?: string;
  status?: OrderStatus;
  page?: number;
  limit?: number;
}): Promise<AdminOrderListResponse> {
  const search = new URLSearchParams();
  if (params?.q?.trim()) search.set("q", params.q.trim());
  if (params?.status) search.set("status", params.status);
  if (params?.page) search.set("page", String(params.page));
  if (params?.limit) search.set("limit", String(params.limit));
  const qs = search.toString();
  return apiFetchWithAuth(`/api/admin/orders${qs ? `?${qs}` : ""}`, undefined, token());
}

export function fetchAdminOrder(id: string): Promise<AdminOrder> {
  return apiFetchWithAuth(`/api/admin/orders/${id}`, undefined, token());
}

export function updateAdminOrder(
  id: string,
  items: UpdateAdminOrderLinePayload[],
): Promise<AdminOrder> {
  return apiFetchWithAuth(
    `/api/admin/orders/${id}`,
    { method: "PUT", body: JSON.stringify({ items }) },
    token(),
  );
}

export type { Category, Product };
