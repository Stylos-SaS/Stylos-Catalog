import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { PrismaClient } from "../generated/prisma/client.js";
import { config } from "../config.js";

const pool = new pg.Pool({ connectionString: config.DATABASE_URL });

export function createPrismaClient() {
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

export type AppPrismaClient = PrismaClient;
