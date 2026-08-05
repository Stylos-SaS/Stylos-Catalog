import "dotenv/config";
import { createPrismaClient } from "../src/lib/db.js";
import { config } from "../src/config.js";
import { supabaseAdmin } from "../src/lib/supabase.js";
import {
  deleteStorageFiles,
  optimizeProductImages,
  StorageError,
} from "../src/lib/storage.js";

function parseArgs(argv: string[]) {
  return {
    force: argv.includes("--force"),
  };
}

async function downloadStorageObject(objectPath: string): Promise<Buffer> {
  const { data, error } = await supabaseAdmin.storage
    .from(config.SUPABASE_STORAGE_BUCKET)
    .download(objectPath);

  if (error || !data) {
    throw new Error(error?.message ?? `Download failed for ${objectPath}`);
  }

  return Buffer.from(await data.arrayBuffer());
}

async function uploadWebp(objectPath: string, file: Buffer): Promise<string> {
  const { error } = await supabaseAdmin.storage
    .from(config.SUPABASE_STORAGE_BUCKET)
    .upload(objectPath, file, { contentType: "image/webp", upsert: false });

  if (error) {
    throw new StorageError(error.message, 502);
  }

  const { data } = supabaseAdmin.storage
    .from(config.SUPABASE_STORAGE_BUCKET)
    .getPublicUrl(objectPath);
  return data.publicUrl;
}

async function main() {
  const { force } = parseArgs(process.argv.slice(2));
  const prisma = createPrismaClient();

  const images = await prisma.productoImagen.findMany({
    orderBy: { id: "asc" },
  });

  console.log(
    `Reprocessing ${images.length} product images` +
      (force ? " (--force)" : " (skip rows with pathThumb)"),
  );

  let ok = 0;
  let skipped = 0;
  let failed = 0;

  for (const [index, image] of images.entries()) {
    const label = `[${index + 1}/${images.length}] ${image.id}`;

    if (!force && image.pathThumb) {
      skipped += 1;
      console.log(`${label} skip (already has thumb)`);
      continue;
    }

    const oldPaths = [image.path, image.pathThumb].filter(
      (p): p is string => Boolean(p),
    );

    try {
      const original = await downloadStorageObject(image.path);
      const { full, thumb } = await optimizeProductImages(original);

      const id = crypto.randomUUID();
      const folder = `products/${image.productoId}`;
      const pathFull = `${folder}/${id}-full.webp`;
      const pathThumb = `${folder}/${id}-thumb.webp`;

      const url = await uploadWebp(pathFull, full);
      let urlThumb: string;
      try {
        urlThumb = await uploadWebp(pathThumb, thumb);
      } catch (error) {
        await deleteStorageFiles([pathFull]);
        throw error;
      }

      await prisma.productoImagen.update({
        where: { id: image.id },
        data: {
          url,
          path: pathFull,
          urlThumb,
          pathThumb,
        },
      });

      const stale = oldPaths.filter((p) => p !== pathFull && p !== pathThumb);
      if (stale.length > 0) {
        try {
          await deleteStorageFiles(stale);
        } catch (error) {
          console.warn(
            `${label} updated DB but failed to delete old files:`,
            error instanceof Error ? error.message : error,
          );
        }
      }

      ok += 1;
      console.log(`${label} ok → ${pathFull}`);
    } catch (error) {
      failed += 1;
      console.error(
        `${label} FAILED:`,
        error instanceof Error ? error.message : error,
      );
    }
  }

  await prisma.$disconnect();
  console.log(`Done. ok=${ok} skipped=${skipped} failed=${failed}`);
  if (failed > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
