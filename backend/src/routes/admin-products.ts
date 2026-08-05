import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { StorageError, uploadProductImage } from "../lib/storage.js";
import { listProducts } from "../services/product.service.js";
import {
  ProductAdminError,
  createAdminProduct,
  deleteAdminProduct,
  updateAdminProduct,
} from "../services/admin-product.service.js";
import { toAdminProductDTO } from "../lib/mappers.js";

const imageSchema = z.object({
  url: z.string().url(),
  path: z.string().min(1),
  urlThumb: z.string().url().nullable().optional(),
  pathThumb: z.string().min(1).nullable().optional(),
  esPrincipal: z.boolean().optional(),
});

const upsertProductSchema = z.object({
  codigo: z.string().trim().min(1),
  name: z.string().trim().min(1),
  description: z.string().trim().min(1),
  categoryId: z.string().uuid(),
  priceRetail: z.coerce.number().int().positive(),
  priceWholesale: z.coerce.number().int().positive(),
  images: z.array(imageSchema).optional(),
  active: z.boolean().optional(),
});

const updateProductSchema = upsertProductSchema.partial();

const listQuerySchema = z.object({
  category: z.string().optional(),
  q: z.string().optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
});

function handleAdminProductError(error: unknown, reply: import("fastify").FastifyReply) {
  if (error instanceof ProductAdminError || error instanceof StorageError) {
    return reply.status(error.statusCode).send({ error: error.message });
  }
  throw error;
}

export async function adminProductRoutes(app: FastifyInstance) {
  const auth = { preHandler: [app.authenticate] };

  app.get("/api/admin/products", auth, async (request, reply) => {
    const parsed = listQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten().fieldErrors });
    }

    const result = await listProducts(app.prisma, {
      category: parsed.data.category,
      q: parsed.data.q,
      sort: "new",
      page: parsed.data.page ?? 1,
      limit: parsed.data.limit ?? 100,
    });

    return reply.send(result);
  });

  app.get("/api/admin/products/:id", auth, async (request, reply) => {
    const { id } = request.params as { id: string };
    const product = await app.prisma.producto.findUnique({
      where: { id },
      include: { categoria: true, imagenes: true },
    });

    if (!product) {
      return reply.status(404).send({ error: "Product not found" });
    }

    return reply.send(toAdminProductDTO(product));
  });

  app.post("/api/admin/products", auth, async (request, reply) => {
    const parsed = upsertProductSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten().fieldErrors });
    }

    try {
      const product = await createAdminProduct(app.prisma, parsed.data);
      return reply.status(201).send(product);
    } catch (error) {
      return handleAdminProductError(error, reply);
    }
  });

  app.put("/api/admin/products/:id", auth, async (request, reply) => {
    const { id } = request.params as { id: string };
    const parsed = updateProductSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten().fieldErrors });
    }

    try {
      const product = await updateAdminProduct(app.prisma, id, parsed.data);
      return reply.send(product);
    } catch (error) {
      return handleAdminProductError(error, reply);
    }
  });

  app.delete("/api/admin/products/:id", auth, async (request, reply) => {
    const { id } = request.params as { id: string };

    try {
      await deleteAdminProduct(app.prisma, id);
      return reply.status(204).send();
    } catch (error) {
      return handleAdminProductError(error, reply);
    }
  });

  app.post("/api/admin/products/upload-image", auth, async (request, reply) => {
    const productId = (request.query as { productId?: string }).productId;

    try {
      const file = await request.file();
      if (!file) {
        return reply.status(400).send({ error: "Image file is required" });
      }

      const buffer = await file.toBuffer();
      const result = await uploadProductImage(buffer, file.mimetype, productId);
      return reply.send(result);
    } catch (error) {
      return handleAdminProductError(error, reply);
    }
  });
}
