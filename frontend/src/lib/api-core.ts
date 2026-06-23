import { API_BASE_URL } from "./config";
import { useAuth } from "./auth";

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

export async function apiFetchWithAuth<T>(
  path: string,
  init?: RequestInit,
  token?: string | null,
): Promise<T> {
  const headers = new Headers(init?.headers);
  const authToken = token ?? useAuth.getState().token;
  if (authToken) {
    headers.set("Authorization", `Bearer ${authToken}`);
  }
  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(`${requireApiBaseUrl()}${path}`, { ...init, headers });

  if (res.status === 204) {
    return undefined as T;
  }

  if (!res.ok) {
    const body = await res.text();
    throw new ApiError(body || `Request failed (${res.status})`, res.status);
  }

  return res.json() as Promise<T>;
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  return apiFetchWithAuth<T>(path, init, null);
}
