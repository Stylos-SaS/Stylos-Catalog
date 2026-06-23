import "dotenv/config";
import { defineConfig } from "prisma/config";

function migrationDatabaseUrl() {
  const url = process.env.DIRECT_DATABASE_URL ?? process.env.DATABASE_URL;
  if (!url) {
    // Placeholder: allows `prisma generate` without a live database.
    // `db:migrate` requires DIRECT_DATABASE_URL or DATABASE_URL in .env
    return "postgresql://postgres:postgres@127.0.0.1:5432/postgres";
  }
  return url;
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: migrationDatabaseUrl(),
  },
});
