import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { getProductById, listProducts } from "../services/product.service.js";

const listQuerySchema = z.object({
  category: z.string().optional(),
  q: z.string().optional(),
  sort: z.enum(["new", "price-asc", "price-desc"]).optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
  mode: z.enum(["detal", "mayor"]).optional(),
});

export async function productRoutes(app: FastifyInstance) {
  app.get("/api/products", async (request, reply) => {
    const parsed = listQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten().fieldErrors });
    }

    const query = parsed.data;
    const priceField = query.mode === "mayor" ? "precioMayor" : "precioDetal";

    const result = await listProducts(app.prisma, {
      category: query.category,
      q: query.q,
      sort: query.sort ?? "new",
      page: query.page,
      limit: query.limit,
      priceField,
    });

    return reply.send(result);
  });

  app.get("/api/products/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const product = await getProductById(app.prisma, id);

    if (!product) {
      return reply.status(404).send({ error: "Product not found" });
    }

    return reply.send(product);
  });
}
