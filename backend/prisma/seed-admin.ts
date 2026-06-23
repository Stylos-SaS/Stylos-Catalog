import "dotenv/config";
import bcrypt from "bcrypt";
import { createPrismaClient } from "../src/lib/db.js";
import { seedStoreSettings } from "../src/services/store-settings.service.js";
import { seedCategories } from "./seed-categories.js";

const prisma = createPrismaClient();

async function seedAdmin() {
  const adminPassword = process.env.ADMIN_SEED_PASSWORD ?? "admin123";
  const passwordHash = await bcrypt.hash(adminPassword, 12);

  await prisma.usuarioAdmin.upsert({
    where: { username: "admin" },
    update: { nombre: "Administrador", passwordHash },
    create: {
      username: "admin",
      nombre: "Administrador",
      passwordHash,
    },
  });
}

async function main() {
  await seedCategories(prisma);
  await seedAdmin();
  await seedStoreSettings(prisma);

  const [categoryCount, adminCount] = await Promise.all([
    prisma.categoria.count(),
    prisma.usuarioAdmin.count(),
  ]);

  console.log(
    [
      "Admin seed completed:",
      `${categoryCount} categories`,
      `${adminCount} admin user (admin / ADMIN_SEED_PASSWORD or admin123)`,
      "store settings initialized from env",
    ].join(" · "),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
