import { randomUUID } from "node:crypto";
import { config } from "../config.js";
import { supabaseAdmin } from "./supabase.js";

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);

function extensionForMime(mime: string): string {
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  return "jpg";
}

export class StorageError extends Error {
  constructor(
    message: string,
    readonly statusCode: number,
  ) {
    super(message);
    this.name = "StorageError";
  }
}

export async function uploadProductImage(
  file: Buffer,
  mimeType: string,
  productId?: string,
) {
  if (!ALLOWED_MIME.has(mimeType)) {
    throw new StorageError("Only JPEG, PNG and WebP images are allowed", 400);
  }

  const folder = productId ? `products/${productId}` : "products/tmp";
  const path = `${folder}/${randomUUID()}.${extensionForMime(mimeType)}`;

  const { error } = await supabaseAdmin.storage
    .from(config.SUPABASE_STORAGE_BUCKET)
    .upload(path, file, { contentType: mimeType, upsert: false });

  if (error) {
    throw new StorageError(error.message, 502);
  }

  const { data } = supabaseAdmin.storage.from(config.SUPABASE_STORAGE_BUCKET).getPublicUrl(path);
  return { url: data.publicUrl, path };
}

export async function deleteStorageFiles(paths: string[]) {
  const storagePaths = paths.filter((p) => p.startsWith("products/"));
  if (storagePaths.length === 0) return;

  const { error } = await supabaseAdmin.storage
    .from(config.SUPABASE_STORAGE_BUCKET)
    .remove(storagePaths);

  if (error) {
    throw new StorageError(error.message, 502);
  }
}
