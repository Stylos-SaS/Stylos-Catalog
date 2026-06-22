import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ChevronRight, Minus, Plus, ShoppingBag, Zap, Truck, RotateCcw, Heart, Loader2 } from "lucide-react";
import { StoreShell } from "@/components/storefront/StoreShell";
import { ProductCard } from "@/components/storefront/ProductCard";
import { ApiError } from "@/lib/api";
import { useCart } from "@/lib/cart";
import { CATALOG_SHORT_LABEL, IS_MAYOR_CATALOG, productPrice } from "@/lib/config";
import { productImages } from "@/lib/product-image";
import { productQueryOptions, relatedProductsQueryOptions } from "@/lib/queries";
import { formatCOP } from "@/lib/format";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/producto/$id")({
  loader: async ({ params, context }) => {
    try {
      const product = await context.queryClient.ensureQueryData(productQueryOptions(params.id));
      return { product };
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) throw notFound();
      throw error;
    }
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.product.name ?? "Producto"} — Stylos Variedades` },
      { name: "description", content: loaderData?.product.description ?? "" },
    ],
  }),
  notFoundComponent: () => (
    <StoreShell>
      <div className="mx-auto max-w-md p-20 text-center">
        <h1 className="font-display text-2xl font-bold">Producto no encontrado</h1>
        <Link to="/catalogo" className="mt-4 inline-block text-primary underline">
          Volver al catálogo
        </Link>
      </div>
    </StoreShell>
  ),
  component: ProductDetail,
});

function ProductDetail() {
  const { product } = Route.useLoaderData();
  const add = useCart((s) => s.add);
  const [active, setActive] = useState(0);
  const [qty, setQty] = useState(1);
  const price = productPrice(product);
  const compareAt = IS_MAYOR_CATALOG ? product.priceRetail : null;
  const images = productImages(product.images);

  const relatedQuery = useQuery(
    relatedProductsQueryOptions(product.categoryId, product.id),
  );
  const related = relatedQuery.data ?? [];

  return (
    <StoreShell>
      <div className="mx-auto max-w-7xl px-6 py-6">
        <nav className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Link to="/" className="hover:text-foreground">Inicio</Link>
          <ChevronRight className="h-3 w-3" />
          <Link to="/catalogo" className="hover:text-foreground">Catálogo</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground">{product.name}</span>
        </nav>

        <div className="mt-6 grid gap-10 md:grid-cols-2">
          <div className="space-y-3">
            <div className="aspect-square overflow-hidden rounded-3xl bg-secondary shadow-soft">
              <img src={images[active]} alt={product.name} className="h-full w-full object-cover" />
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActive(i)}
                    className={cn(
                      "h-20 w-20 shrink-0 overflow-hidden rounded-2xl border-2 transition",
                      active === i ? "border-primary" : "border-transparent opacity-70 hover:opacity-100",
                    )}
                  >
                    <img src={img} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-5">
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">
                {product.category}
              </div>
              <h1 className="font-display mt-1 text-3xl font-bold sm:text-4xl">{product.name}</h1>
            </div>
            <div className="flex items-baseline gap-3">
              <span className="font-display text-3xl font-bold text-primary">{formatCOP(price)}</span>
              {compareAt && (
                <span className="text-base text-muted-foreground line-through">{formatCOP(compareAt)}</span>
              )}
              {IS_MAYOR_CATALOG && (
                <span className="rounded-full bg-secondary px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                  {CATALOG_SHORT_LABEL}
                </span>
              )}
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">{product.description}</p>

            <div className="flex items-center gap-4 pt-2">
              <div className="flex items-center rounded-full border border-border bg-card p-1">
                <button onClick={() => setQty((v) => Math.max(1, v - 1))} className="grid h-8 w-8 place-items-center rounded-full hover:bg-secondary">
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-10 text-center text-sm font-semibold">{qty}</span>
                <button onClick={() => setQty((v) => v + 1)} className="grid h-8 w-8 place-items-center rounded-full hover:bg-secondary">
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <span className="text-sm text-muted-foreground">Disponible</span>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                onClick={() => {
                  add(product, qty);
                  toast.success(`${product.name} agregado (x${qty})`);
                }}
                className="inline-flex items-center gap-2 rounded-full border border-primary bg-primary/10 px-6 py-3 text-sm font-semibold text-primary hover:bg-primary/15"
              >
                <ShoppingBag className="h-4 w-4" /> Agregar al carrito
              </button>
              <Link
                to="/carrito"
                onClick={() => add(product, qty)}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-pop hover:opacity-90"
              >
                <Zap className="h-4 w-4" /> Comprar ahora
              </Link>
              <button className="grid h-12 w-12 place-items-center rounded-full border border-border bg-card hover:bg-secondary" aria-label="Favoritos">
                <Heart className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-4">
              <Perk icon={<Truck className="h-4 w-4" />} label="Envío 24-48h" />
              <Perk icon={<RotateCcw className="h-4 w-4" />} label="Cambios fáciles" />
            </div>
          </div>
        </div>

        {relatedQuery.isLoading ? (
          <div className="mt-20 flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : related.length > 0 ? (
          <section className="mt-20">
            <h2 className="font-display text-2xl font-bold sm:text-3xl">También te puede gustar</h2>
            <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-4">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </StoreShell>
  );
}

function Perk({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3 text-sm">
      <span className="grid h-8 w-8 place-items-center rounded-full bg-primary/10 text-primary">{icon}</span>
      <span className="font-medium">{label}</span>
    </div>
  );
}
