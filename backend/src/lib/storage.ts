import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { config } from "../config.js";
import { supabaseAdmin } from "./supabase.js";

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);

export const FULL_MAX_EDGE = 1600;
export const THUMB_MAX_EDGE = 400;
export const WEBP_QUALITY = 80;

export class StorageError extends Error {
  constructor(
    message: string,
    readonly statusCode: number,
  ) {
    super(message);
    this.name = "StorageError";
  }
}

export type UploadedProductImage = {
  url: string;
  path: string;
  urlThumb: string;
  pathThumb: string;
};

export async function optimizeProductImages(input: Buffer): Promise<{ full: Buffer; thumb: Buffer }> {
  const base = sharp(input).rotate();

  const [full, thumb] = await Promise.all([
    base
      .clone()
      .resize({
        width: FULL_MAX_EDGE,
        height: FULL_MAX_EDGE,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: WEBP_QUALITY })
      .toBuffer(),
    base
      .clone()
      .resize({
        width: THUMB_MAX_EDGE,
        height: THUMB_MAX_EDGE,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: WEBP_QUALITY })
      .toBuffer(),
  ]);

  return { full, thumb };
}

async function uploadBuffer(path: string, file: Buffer, contentType: string) {
  const { error } = await supabaseAdmin.storage
    .from(config.SUPABASE_STORAGE_BUCKET)
    .upload(path, file, { contentType, upsert: false });

  if (error) {
    throw new StorageError(error.message, 502);
  }

  const { data } = supabaseAdmin.storage.from(config.SUPABASE_STORAGE_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function uploadProductImage(
  file: Buffer,
  mimeType: string,
  productId?: string,
): Promise<UploadedProductImage> {
  if (!ALLOWED_MIME.has(mimeType)) {
    throw new StorageError("Only JPEG, PNG and WebP images are allowed", 400);
  }

  let full: Buffer;
  let thumb: Buffer;
  try {
    ({ full, thumb } = await optimizeProductImages(file));
  } catch {
    throw new StorageError("Could not process image. Use a valid JPEG, PNG or WebP file.", 400);
  }

  const folder = productId ? `products/${productId}` : "products/tmp";
  const id = randomUUID();
  const path = `${folder}/${id}-full.webp`;
  const pathThumb = `${folder}/${id}-thumb.webp`;

  const url = await uploadBuffer(path, full, "image/webp");
  try {
    const urlThumb = await uploadBuffer(pathThumb, thumb, "image/webp");
    return { url, path, urlThumb, pathThumb };
  } catch (error) {
    await deleteStorageFiles([path]);
    throw error;
  }
}

export async function deleteStorageFiles(paths: string[]) {
  const storagePaths = [...new Set(paths.filter((p) => p.startsWith("products/")))];
  if (storagePaths.length === 0) return;

  const { error } = await supabaseAdmin.storage
    .from(config.SUPABASE_STORAGE_BUCKET)
    .remove(storagePaths);

  if (error) {
    throw new StorageError(error.message, 502);
  }
}

const TMP_PREFIX = "products/tmp/";

export type RelocatableProductImage = {
  url: string;
  path: string;
  urlThumb?: string | null;
  pathThumb?: string | null;
  esPrincipal?: boolean;
};

function publicUrlFor(path: string) {
  return supabaseAdmin.storage.from(config.SUPABASE_STORAGE_BUCKET).getPublicUrl(path).data
    .publicUrl;
}

function filenameOf(objectPath: string) {
  const parts = objectPath.split("/");
  return parts[parts.length - 1] ?? objectPath;
}

async function moveStorageObject(from: string, to: string) {
  if (from === to) return;
  const { error } = await supabaseAdmin.storage
    .from(config.SUPABASE_STORAGE_BUCKET)
    .move(from, to);
  if (error) {
    throw new StorageError(error.message, 502);
  }
}

/**
 * Moves any `products/tmp/...` objects into `products/{productId}/...`
 * and returns image metadata with updated paths/URLs.
 */
export async function relocateTmpProductImages<T extends RelocatableProductImage>(
  productId: string,
  images: T[],
): Promise<T[]> {
  if (images.length === 0) return images;

  const targetFolder = `products/${productId}`;
  const result: T[] = [];

  for (const image of images) {
    let path = image.path;
    let url = image.url;
    let pathThumb = image.pathThumb ?? null;
    let urlThumb = image.urlThumb ?? null;

    if (path.startsWith(TMP_PREFIX)) {
      const dest = `${targetFolder}/${filenameOf(path)}`;
      await moveStorageObject(path, dest);
      path = dest;
      url = publicUrlFor(dest);
    }

    if (pathThumb?.startsWith(TMP_PREFIX)) {
      const destThumb = `${targetFolder}/${filenameOf(pathThumb)}`;
      await moveStorageObject(pathThumb, destThumb);
      pathThumb = destThumb;
      urlThumb = publicUrlFor(destThumb);
    }

    result.push({
      ...image,
      path,
      url,
      pathThumb,
      urlThumb,
    });
  }

  return result;
}
