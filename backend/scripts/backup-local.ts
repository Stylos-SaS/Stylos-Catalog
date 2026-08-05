import { spawnSync } from "node:child_process";
import { createWriteStream } from "node:fs";
import { mkdir, writeFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(__dirname, "..");
const repoRoot = path.resolve(backendRoot, "..");

dotenv.config({ path: path.join(backendRoot, ".env") });

const LIST_PAGE_SIZE = 100;

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    console.error(`Missing required env var: ${name}`);
    process.exit(1);
  }
  return value;
}

function timestampFolder(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}` +
    `-${pad(now.getHours())}${pad(now.getMinutes())}`
  );
}

function hasPgDump(): boolean {
  const result = spawnSync("pg_dump", ["--version"], { encoding: "utf8" });
  return result.status === 0;
}

function hasDocker(): boolean {
  const result = spawnSync("docker", ["--version"], { encoding: "utf8" });
  return result.status === 0;
}

function toDockerVolumePath(windowsOrPosixPath: string): string {
  const resolved = path.resolve(windowsOrPosixPath);
  if (/^[A-Za-z]:[\\/]/.test(resolved)) {
    const drive = resolved[0].toLowerCase();
    const rest = resolved.slice(2).replace(/\\/g, "/");
    return `${drive}:${rest}`;
  }
  return resolved.replace(/\\/g, "/");
}

async function dumpDatabase(directUrl: string, outFile: string): Promise<void> {
  await mkdir(path.dirname(outFile), { recursive: true });

  if (hasPgDump()) {
    console.log("Dumping database with local pg_dump...");
    const result = spawnSync(
      "pg_dump",
      [directUrl, "--format=custom", "--no-owner", "--no-acl", `--file=${outFile}`],
      { encoding: "utf8" },
    );
    if (result.status !== 0) {
      throw new Error(result.stderr || result.stdout || "pg_dump failed");
    }
    return;
  }

  if (!hasDocker()) {
    throw new Error(
      "Neither pg_dump nor Docker is available. Install PostgreSQL 17+ client tools or Docker Desktop.",
    );
  }

  console.log("Local pg_dump not found; dumping database with Docker (postgres:17)...");
  const volumeHost = toDockerVolumePath(path.dirname(outFile));
  const result = spawnSync(
    "docker",
    [
      "run",
      "--rm",
      "-v",
      `${volumeHost}:/backup`,
      "postgres:17",
      "pg_dump",
      directUrl,
      "--format=custom",
      "--no-owner",
      "--no-acl",
      "--file=/backup/db.dump",
    ],
    { encoding: "utf8" },
  );
  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || "docker pg_dump failed");
  }
}

type StorageItem = {
  name: string;
  id: string | null;
};

async function listFolder(
  client: ReturnType<typeof createClient>,
  bucket: string,
  folder: string,
): Promise<StorageItem[]> {
  const items: StorageItem[] = [];
  let offset = 0;

  while (true) {
    const { data, error } = await client.storage.from(bucket).list(folder, {
      limit: LIST_PAGE_SIZE,
      offset,
      sortBy: { column: "name", order: "asc" },
    });

    if (error) {
      throw new Error(`Failed to list storage folder "${folder || "/"}": ${error.message}`);
    }
    if (!data || data.length === 0) break;

    for (const entry of data) {
      items.push({ name: entry.name, id: entry.id });
    }

    if (data.length < LIST_PAGE_SIZE) break;
    offset += LIST_PAGE_SIZE;
  }

  return items;
}

async function listAllObjectPaths(
  client: ReturnType<typeof createClient>,
  bucket: string,
  folder = "",
): Promise<string[]> {
  const paths: string[] = [];
  const items = await listFolder(client, bucket, folder);

  for (const item of items) {
    const objectPath = folder ? `${folder}/${item.name}` : item.name;
    // Folders have null id in Supabase Storage listing
    if (item.id === null) {
      paths.push(...(await listAllObjectPaths(client, bucket, objectPath)));
    } else {
      paths.push(objectPath);
    }
  }

  return paths;
}

async function downloadBucket(
  client: ReturnType<typeof createClient>,
  bucket: string,
  destRoot: string,
): Promise<{ fileCount: number; totalBytes: number }> {
  console.log(`Listing objects in bucket "${bucket}"...`);
  const objectPaths = await listAllObjectPaths(client, bucket);
  console.log(`Found ${objectPaths.length} object(s). Downloading...`);

  let totalBytes = 0;
  let fileCount = 0;

  for (const objectPath of objectPaths) {
    const { data, error } = await client.storage.from(bucket).download(objectPath);
    if (error || !data) {
      throw new Error(`Failed to download "${objectPath}": ${error?.message ?? "no data"}`);
    }

    const localPath = path.join(destRoot, objectPath);
    await mkdir(path.dirname(localPath), { recursive: true });

    const nodeStream = Readable.fromWeb(data.stream() as import("node:stream/web").ReadableStream);
    await pipeline(nodeStream, createWriteStream(localPath));

    const fileStat = await stat(localPath);
    totalBytes += fileStat.size;
    fileCount += 1;

    if (fileCount % 25 === 0 || fileCount === objectPaths.length) {
      console.log(`  downloaded ${fileCount}/${objectPaths.length}`);
    }
  }

  return { fileCount, totalBytes };
}

async function main() {
  const directUrl = requireEnv("DIRECT_DATABASE_URL");
  const supabaseUrl = requireEnv("SUPABASE_URL");
  const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  const bucket = process.env.SUPABASE_STORAGE_BUCKET?.trim() || "product-images";

  const stamp = timestampFolder();
  const backupDir = path.join(repoRoot, "backups", stamp);
  const dbFile = path.join(backupDir, "db.dump");
  const storageDir = path.join(backupDir, "storage", bucket);

  await mkdir(storageDir, { recursive: true });

  console.log(`Backup directory: ${backupDir}`);
  await dumpDatabase(directUrl, dbFile);

  const dbStat = await stat(dbFile);
  console.log(`Database dump written (${dbStat.size} bytes)`);

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { fileCount, totalBytes } = await downloadBucket(supabase, bucket, storageDir);

  const manifest = {
    createdAt: new Date().toISOString(),
    backupDir: path.relative(repoRoot, backupDir).replace(/\\/g, "/"),
    database: {
      file: "db.dump",
      bytes: dbStat.size,
    },
    storage: {
      bucket,
      fileCount,
      totalBytes,
      relativeRoot: `storage/${bucket}`,
    },
  };

  await writeFile(path.join(backupDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);

  console.log("Backup complete.");
  console.log(JSON.stringify(manifest, null, 2));
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
