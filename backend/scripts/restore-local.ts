import { spawnSync } from "node:child_process";
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(__dirname, "..");

dotenv.config({ path: path.join(backendRoot, ".env") });

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    console.error(`Missing required env var: ${name}`);
    process.exit(1);
  }
  return value;
}

function hasPgRestore(): boolean {
  const result = spawnSync("pg_restore", ["--version"], { encoding: "utf8" });
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

function contentTypeForPath(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  return "application/octet-stream";
}

function parseArgs(argv: string[]): { backupDirArg: string | null; confirmed: boolean } {
  let backupDirArg: string | null = null;
  let confirmed = false;

  for (const arg of argv) {
    if (arg === "--confirm") {
      confirmed = true;
      continue;
    }
    if (arg.startsWith("-")) {
      console.error(`Unknown flag: ${arg}`);
      process.exit(1);
    }
    if (backupDirArg) {
      console.error("Only one backup directory argument is allowed.");
      process.exit(1);
    }
    backupDirArg = arg;
  }

  return { backupDirArg, confirmed };
}

function resolveBackupDir(backupDirArg: string): string {
  const resolved = path.isAbsolute(backupDirArg)
    ? backupDirArg
    : path.resolve(process.cwd(), backupDirArg);
  return resolved;
}

async function collectFiles(rootDir: string): Promise<string[]> {
  const files: string[] = [];

  async function walk(dir: string) {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(fullPath);
      } else if (entry.isFile()) {
        files.push(fullPath);
      }
    }
  }

  await walk(rootDir);
  return files.sort();
}

async function uploadBucket(
  client: ReturnType<typeof createClient>,
  bucket: string,
  storageRoot: string,
): Promise<{ fileCount: number; totalBytes: number }> {
  const localFiles = await collectFiles(storageRoot);
  console.log(`Found ${localFiles.length} local file(s). Uploading to bucket "${bucket}"...`);

  let fileCount = 0;
  let totalBytes = 0;

  for (const localPath of localFiles) {
    const relativePath = path.relative(storageRoot, localPath).split(path.sep).join("/");
    const body = await readFile(localPath);

    const { error } = await client.storage.from(bucket).upload(relativePath, body, {
      upsert: true,
      contentType: contentTypeForPath(localPath),
    });

    if (error) {
      throw new Error(`Failed to upload "${relativePath}": ${error.message}`);
    }

    totalBytes += body.byteLength;
    fileCount += 1;

    if (fileCount % 25 === 0 || fileCount === localFiles.length) {
      console.log(`  uploaded ${fileCount}/${localFiles.length}`);
    }
  }

  return { fileCount, totalBytes };
}

async function restoreDatabase(directUrl: string, dumpFile: string): Promise<void> {
  if (hasPgRestore()) {
    console.log("Restoring database with local pg_restore...");
    const result = spawnSync(
      "pg_restore",
      [
        "--clean",
        "--if-exists",
        "--no-owner",
        "--no-acl",
        `--dbname=${directUrl}`,
        dumpFile,
      ],
      { encoding: "utf8" },
    );
    // pg_restore may return non-zero when some DROP IF EXISTS warnings occur;
    // treat hard failures as stderr containing "error:" without successful completion.
    if (result.status !== 0 && result.status !== null) {
      const output = `${result.stderr ?? ""}\n${result.stdout ?? ""}`;
      const hasFatal = /FATAL|could not|connection refused|no such file/i.test(output);
      if (hasFatal || !output.includes("WARNING")) {
        // Still allow exit code 1 with only non-fatal object errors common on Supabase
        if (result.status > 1 || hasFatal) {
          throw new Error(output.trim() || "pg_restore failed");
        }
        console.warn("pg_restore finished with warnings (exit code 1). Continuing.");
        if (output.trim()) console.warn(output.trim());
      } else {
        console.warn("pg_restore finished with warnings. Continuing.");
      }
    }
    return;
  }

  if (!hasDocker()) {
    throw new Error(
      "Neither pg_restore nor Docker is available. Install PostgreSQL 17+ client tools or Docker Desktop.",
    );
  }

  console.log("Local pg_restore not found; restoring database with Docker (postgres:17)...");
  const volumeHost = toDockerVolumePath(path.dirname(dumpFile));
  const result = spawnSync(
    "docker",
    [
      "run",
      "--rm",
      "-v",
      `${volumeHost}:/backup`,
      "postgres:17",
      "pg_restore",
      "--clean",
      "--if-exists",
      "--no-owner",
      "--no-acl",
      `--dbname=${directUrl}`,
      "/backup/db.dump",
    ],
    { encoding: "utf8" },
  );

  if (result.status !== 0 && result.status !== null) {
    const output = `${result.stderr ?? ""}\n${result.stdout ?? ""}`;
    const hasFatal = /FATAL|could not connect|connection refused|no such file/i.test(output);
    if (result.status > 1 || hasFatal) {
      throw new Error(output.trim() || "docker pg_restore failed");
    }
    console.warn("pg_restore finished with warnings (exit code 1). Continuing.");
    if (output.trim()) console.warn(output.trim());
  }
}

function printUsage(): void {
  console.error(`Usage:
  npx tsx scripts/restore-local.ts <backup-dir> --confirm

Examples:
  npx tsx scripts/restore-local.ts ../../backups/20260804-1938 --confirm
  pnpm db:restore -- ../../backups/20260804-1938 --confirm

WARNING: This overwrites the remote database and upserts files into the Storage bucket.`);
}

async function main() {
  const { backupDirArg, confirmed } = parseArgs(process.argv.slice(2));

  if (!backupDirArg) {
    printUsage();
    process.exit(1);
  }

  if (!confirmed) {
    console.error("Refusing to run without --confirm (this overwrites remote DB + Storage).");
    printUsage();
    process.exit(1);
  }

  const directUrl = requireEnv("DIRECT_DATABASE_URL");
  const supabaseUrl = requireEnv("SUPABASE_URL");
  const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  const bucket = process.env.SUPABASE_STORAGE_BUCKET?.trim() || "product-images";

  const backupDir = resolveBackupDir(backupDirArg);
  const dbFile = path.join(backupDir, "db.dump");
  const storageDir = path.join(backupDir, "storage", bucket);
  const manifestPath = path.join(backupDir, "manifest.json");

  try {
    await stat(dbFile);
  } catch {
    throw new Error(`Missing database dump: ${dbFile}`);
  }

  try {
    await stat(storageDir);
  } catch {
    throw new Error(`Missing storage directory: ${storageDir}`);
  }

  let manifestNote = "(no manifest.json)";
  try {
    const raw = await readFile(manifestPath, "utf8");
    const manifest = JSON.parse(raw) as { createdAt?: string; storage?: { fileCount?: number } };
    manifestNote = `createdAt=${manifest.createdAt ?? "unknown"}, storageFiles=${manifest.storage?.fileCount ?? "?"}`;
  } catch {
    // manifest is optional if db.dump + storage dir exist
  }

  console.log("WARNING: This will overwrite the remote Supabase database and upsert Storage objects.");
  console.log(`Backup directory: ${backupDir}`);
  console.log(`Manifest: ${manifestNote}`);
  console.log(`Bucket: ${bucket}`);
  console.log(`Order: Storage first, then database.`);

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { fileCount, totalBytes } = await uploadBucket(supabase, bucket, storageDir);
  console.log(`Storage restore complete (${fileCount} files, ${totalBytes} bytes).`);

  await restoreDatabase(directUrl, dbFile);
  console.log("Database restore complete.");
  console.log("Restore finished successfully.");
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
