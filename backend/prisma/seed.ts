import "dotenv/config";
import bcrypt from "bcrypt";
import { createPrismaClient } from "../src/lib/db.js";
import { seedStoreSettings } from "../src/services/store-settings.service.js";
import { SEED_CATEGORIES, seedCategories } from "./seed-categories.js";
import { buildDetalleLines, computeLineSubtotal } from "../src/services/order-totals.js";
import type { EstadoPedido, TipoPedido } from "../src/generated/prisma/client.js";

const prisma = createPrismaClient();

type SeedProduct = {
  codigo: string;
  nombre: string;
  descripcion: string;
  categoryName: (typeof SEED_CATEGORIES)[number];
  precioDetal: number;
  precioMayor: number;
  fechaCreacion: string;
  imageCount?: number;
  activo?: boolean;
};

const sampleProducts: SeedProduct[] = [
  {
    codigo: "SET-001",
    nombre: "Set Mug + Vela Aromática",
    descripcion:
      "Combo perfecto para regalar: mug de cerámica pastel y vela aromática de vainilla en empaque dorado.",
    categoryName: "Hogar",
    precioDetal: 38900,
    precioMayor: 28500,
    fechaCreacion: "2026-05-21",
  },
  {
    codigo: "ACC-001",
    nombre: "Joyero Corazón Rosa",
    descripcion:
      "Joyero acolchado en forma de corazón, interior aterciopelado y cierre dorado. Ideal para anillos y cadenas.",
    categoryName: "Accesorios",
    precioDetal: 24900,
    precioMayor: 17900,
    fechaCreacion: "2026-06-02",
  },
  {
    codigo: "BEL-001",
    nombre: "Set 6 Brochas de Maquillaje",
    descripcion:
      "Set premium de 6 brochas con cerdas ultra suaves y mango rosa pastel. Incluye estuche de tela.",
    categoryName: "Belleza",
    precioDetal: 32500,
    precioMayor: 23900,
    fechaCreacion: "2026-05-12",
  },
  {
    codigo: "PAP-001",
    nombre: "Kit Papelería Pastel",
    descripcion:
      "Cuadernos tapa dura, washi tape, lapiceros y notas adhesivas en tonos rosa y coral.",
    categoryName: "Papelería",
    precioDetal: 28900,
    precioMayor: 20500,
    fechaCreacion: "2026-04-30",
  },
  {
    codigo: "REG-001",
    nombre: "Caja de Regalo Premium",
    descripcion:
      "Caja decorativa con lazo de raso, lista para sorprender en cumpleaños, aniversarios o fechas especiales.",
    categoryName: "Regalos",
    precioDetal: 15900,
    precioMayor: 9900,
    fechaCreacion: "2026-06-10",
  },
  {
    codigo: "DEC-001",
    nombre: "Pack Decoración Habitación",
    descripcion:
      "Velas pequeñas, mini florero y luces tipo cadena LED para un ambiente cálido y femenino.",
    categoryName: "Decoración",
    precioDetal: 45900,
    precioMayor: 34900,
    fechaCreacion: "2026-03-18",
  },
  {
    codigo: "ACC-002",
    nombre: "Espejo de Bolsillo Floral",
    descripcion: "Espejo plegable de bolsillo con estampado floral, ideal para llevar siempre contigo.",
    categoryName: "Accesorios",
    precioDetal: 9900,
    precioMayor: 5500,
    fechaCreacion: "2026-05-02",
  },
  {
    codigo: "BEL-002",
    nombre: "Set Labiales Mate Pastel",
    descripcion: "Trío de labiales mate de larga duración en tonos rosa palo, coral y rojo suave.",
    categoryName: "Belleza",
    precioDetal: 26900,
    precioMayor: 18500,
    fechaCreacion: "2026-06-05",
    activo: false,
  },
];

type SeedOrderLine = {
  codigo: string;
  cantidad: number;
  disponible?: boolean;
};

type SeedOrder = {
  id: string;
  tipoPedido: TipoPedido;
  estado: EstadoPedido;
  contactoCliente: string;
  fechaCreacion: string;
  lines: SeedOrderLine[];
};

const sampleOrders: SeedOrder[] = [
  {
    id: "11111111-1111-4111-8111-111111111101",
    tipoPedido: "detal",
    estado: "pendiente",
    contactoCliente: "573012345678",
    fechaCreacion: "2026-06-17T10:30:00.000Z",
    lines: [
      { codigo: "SET-001", cantidad: 2 },
      { codigo: "ACC-001", cantidad: 1 },
    ],
  },
  {
    id: "11111111-1111-4111-8111-111111111102",
    tipoPedido: "mayor",
    estado: "completado",
    contactoCliente: "573129876543",
    fechaCreacion: "2026-06-16T14:15:00.000Z",
    lines: [
      { codigo: "BEL-001", cantidad: 12 },
      { codigo: "BEL-002", cantidad: 8 },
    ],
  },
  {
    id: "11111111-1111-4111-8111-111111111103",
    tipoPedido: "detal",
    estado: "completado",
    contactoCliente: "573201112222",
    fechaCreacion: "2026-06-15T09:00:00.000Z",
    lines: [{ codigo: "REG-001", cantidad: 3 }],
  },
  {
    id: "11111111-1111-4111-8111-111111111104",
    tipoPedido: "mayor",
    estado: "cancelado",
    contactoCliente: "573054445566",
    fechaCreacion: "2026-06-14T16:45:00.000Z",
    lines: [{ codigo: "DEC-001", cantidad: 6, disponible: false }],
  },
  {
    id: "11111111-1111-4111-8111-111111111105",
    tipoPedido: "detal",
    estado: "pendiente",
    contactoCliente: "573182223344",
    fechaCreacion: "2026-06-13T11:20:00.000Z",
    lines: [
      { codigo: "PAP-001", cantidad: 1 },
      { codigo: "ACC-002", cantidad: 2 },
    ],
  },
];

function productImageUrl(codigo: string, index: number) {
  return `https://picsum.photos/seed/stylos-${codigo}-${index}/800/800`;
}

function productImagePath(codigo: string, index: number) {
  return `seed/${codigo.toLowerCase()}/${index}.jpg`;
}

async function upsertProduct(product: SeedProduct) {
  const categoria = await prisma.categoria.findUniqueOrThrow({
    where: { nombre: product.categoryName },
  });

  const imageCount = product.imageCount ?? 3;
  const imagenes = Array.from({ length: imageCount }, (_, i) => ({
    url: productImageUrl(product.codigo, i + 1),
    path: productImagePath(product.codigo, i + 1),
    esPrincipal: i === 0,
  }));

  const existing = await prisma.producto.findFirst({
    where: { codigo: product.codigo },
  });

  if (existing) {
    await prisma.productoImagen.deleteMany({ where: { productoId: existing.id } });
    return prisma.producto.update({
      where: { id: existing.id },
      data: {
        nombre: product.nombre,
        descripcion: product.descripcion,
        precioDetal: product.precioDetal,
        precioMayor: product.precioMayor,
        categoriaId: categoria.id,
        activo: product.activo ?? true,
        fechaCreacion: new Date(product.fechaCreacion),
        imagenes: { create: imagenes },
      },
    });
  }

  return prisma.producto.create({
    data: {
      codigo: product.codigo,
      nombre: product.nombre,
      descripcion: product.descripcion,
      precioDetal: product.precioDetal,
      precioMayor: product.precioMayor,
      categoriaId: categoria.id,
      activo: product.activo ?? true,
      fechaCreacion: new Date(product.fechaCreacion),
      imagenes: { create: imagenes },
    },
  });
}

async function seedProducts() {
  for (const product of sampleProducts) {
    await upsertProduct(product);
  }
}

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

async function upsertSeedOrder(order: SeedOrder) {
  const products = await prisma.producto.findMany({
    where: { codigo: { in: order.lines.map((l) => l.codigo) } },
  });
  const productByCodigo = new Map(products.map((p) => [p.codigo, p]));

  for (const line of order.lines) {
    if (!productByCodigo.has(line.codigo)) {
      throw new Error(`Seed order references unknown product codigo: ${line.codigo}`);
    }
  }

  const lineInputs = order.lines.map((line) => {
    const product = productByCodigo.get(line.codigo)!;
    const precioUnitario =
      order.tipoPedido === "detal" ? product.precioDetal : product.precioMayor;
    return {
      cantidad: line.cantidad,
      precioUnitario,
      disponible: line.disponible ?? true,
    };
  });

  const { cantidadProductos, total, detalles } = buildDetalleLines(lineInputs);

  const detalleRows = detalles.map((line, index) => ({
    consec: index + 1,
    productoId: productByCodigo.get(order.lines[index].codigo)!.id,
    cantidad: line.cantidad,
    precioUnitario: line.precioUnitario,
    subtotal: computeLineSubtotal(line.cantidad, line.precioUnitario),
    disponible: line.disponible,
  }));

  await prisma.detallePedido.deleteMany({ where: { pedidoId: order.id } });

  await prisma.pedido.upsert({
    where: { id: order.id },
    create: {
      id: order.id,
      tipoPedido: order.tipoPedido,
      estado: order.estado,
      cantidadProductos,
      total,
      contactoCliente: order.contactoCliente,
      fechaCreacion: new Date(order.fechaCreacion),
      detalles: { create: detalleRows },
    },
    update: {
      tipoPedido: order.tipoPedido,
      estado: order.estado,
      cantidadProductos,
      total,
      contactoCliente: order.contactoCliente,
      fechaCreacion: new Date(order.fechaCreacion),
      detalles: { create: detalleRows },
    },
  });
}

async function seedOrders() {
  for (const order of sampleOrders) {
    await upsertSeedOrder(order);
  }
}

async function main() {
  await seedCategories(prisma);
  await seedProducts();
  await seedAdmin();
  await seedStoreSettings(prisma);
  await seedOrders();

  const [categoryCount, productCount, imageCount, orderCount, adminCount] = await Promise.all([
    prisma.categoria.count(),
    prisma.producto.count(),
    prisma.productoImagen.count(),
    prisma.pedido.count(),
    prisma.usuarioAdmin.count(),
  ]);

  console.log(
    [
      "Seed completed:",
      `${categoryCount} categories`,
      `${productCount} products`,
      `${imageCount} product images`,
      `${orderCount} orders (with detalle_pedido lines)`,
      `${adminCount} admin user (admin / ADMIN_SEED_PASSWORD or admin123)`,
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
