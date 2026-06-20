import "dotenv/config";
import bcrypt from "bcrypt";
import { createPrismaClient } from "../src/lib/db.js";

const prisma = createPrismaClient();

const categories = ["Hogar", "Accesorios", "Belleza", "Regalos", "Papelería", "Decoración"] as const;

const sampleProducts = [
  {
    codigo: "SET-001",
    nombre: "Set Mug + Vela Aromática",
    descripcion:
      "Combo perfecto para regalar: mug de cerámica pastel y vela aromática de vainilla en empaque dorado.",
    categoryName: "Hogar" as const,
    precioDetal: 38900,
    precioMayor: 28500,
  },
  {
    codigo: "ACC-001",
    nombre: "Joyero Corazón Rosa",
    descripcion:
      "Joyero acolchado en forma de corazón, interior aterciopelado y cierre dorado. Ideal para anillos y cadenas.",
    categoryName: "Accesorios" as const,
    precioDetal: 24900,
    precioMayor: 17900,
  },
  {
    codigo: "BEL-001",
    nombre: "Set 6 Brochas de Maquillaje",
    descripcion:
      "Set premium de 6 brochas con cerdas ultra suaves y mango rosa pastel. Incluye estuche de tela.",
    categoryName: "Belleza" as const,
    precioDetal: 32500,
    precioMayor: 23900,
  },
];

async function main() {
  for (const nombre of categories) {
    await prisma.categoria.upsert({
      where: { nombre },
      update: {},
      create: { nombre },
    });
  }

  for (const product of sampleProducts) {
    const categoria = await prisma.categoria.findUniqueOrThrow({
      where: { nombre: product.categoryName },
    });

    const existing = await prisma.producto.findFirst({
      where: { nombre: product.nombre, categoriaId: categoria.id },
    });

    if (existing) {
      await prisma.producto.update({
        where: { id: existing.id },
        data: {
          codigo: product.codigo,
          descripcion: product.descripcion,
          precioDetal: product.precioDetal,
          precioMayor: product.precioMayor,
        },
      });
    } else {
      await prisma.producto.create({
        data: {
          codigo: product.codigo,
          nombre: product.nombre,
          descripcion: product.descripcion,
          precioDetal: product.precioDetal,
          precioMayor: product.precioMayor,
          categoriaId: categoria.id,
        },
      });
    }
  }

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

  console.log("Seed completed: categories, sample products, admin user (admin / ADMIN_SEED_PASSWORD or admin123)");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
