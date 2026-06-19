import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, SlidersHorizontal, PackageOpen } from "lucide-react";
import { StoreShell } from "@/components/storefront/StoreShell";
import { ProductCard } from "@/components/storefront/ProductCard";
import { categories, products, type CategorySlug } from "@/lib/data";
import {
  CATALOG_LABEL,
  CATALOG_TITLE,
  IS_MAYOR_CATALOG,
  productPrice,
} from "@/lib/config";
import { cn } from "@/lib/utils";

type Search = { cat?: CategorySlug };

export const Route = createFileRoute("/catalogo")({
  head: () => ({
    meta: [
      {
        title: IS_MAYOR_CATALOG
          ? "Catálogo Mayorista — Stylos Variedades"
          : "Catálogo Detal — Stylos Variedades",
      },
      {
        name: "description",
        content: IS_MAYOR_CATALOG
          ? "Precios especiales al por mayor para tu negocio."
          : "Catálogo completo con precios al detal.",
      },
    ],
  }),
  validateSearch: (s: Record<string, unknown>): Search => ({
    cat: (s.cat as CategorySlug) || undefined,
  }),
  component: Catalog,
});

export function Catalog() {
  const [cat, setCat] = useState<CategorySlug | "all">("all");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"new" | "price-asc" | "price-desc">("new");

  const filtered = useMemo(() => {
    let arr = [...products];
    if (cat !== "all") arr = arr.filter((p) => p.category === cat);
    if (q.trim()) arr = arr.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()));
    if (sort === "price-asc")
      arr.sort((a, b) => productPrice(a) - productPrice(b));
    if (sort === "price-desc")
      arr.sort((a, b) => productPrice(b) - productPrice(a));
    if (sort === "new") arr.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    return arr;
  }, [cat, q, sort]);

  return (
    <StoreShell>
      <section className="bg-gradient-soft border-b border-border/60">
        <div className="mx-auto max-w-7xl px-6 py-10">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-background/80 px-3 py-1 text-xs font-medium text-primary shadow-soft">
                {CATALOG_LABEL}
              </div>
              <h1 className="font-display mt-3 text-3xl font-bold sm:text-4xl">{CATALOG_TITLE}</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {filtered.length} producto{filtered.length === 1 ? "" : "s"} disponibles
              </p>
            </div>
            <div className="flex w-full max-w-md items-center gap-2 rounded-full border border-border bg-background px-4 py-2 shadow-soft">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar en el catálogo..."
                className="w-full bg-transparent text-sm outline-none"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:flex-wrap md:items-center">
          <div className="flex w-full gap-2 overflow-x-auto pb-2 md:w-auto md:flex-wrap md:overflow-visible">
            <Chip active={cat === "all"} onClick={() => setCat("all")}>
              Todas
            </Chip>
            {categories.map((c) => (
              <Chip key={c.slug} active={cat === c.slug} onClick={() => setCat(c.slug)}>
                <span className="mr-1">{c.emoji}</span> {c.name}
              </Chip>
            ))}
          </div>
          <div className="flex shrink-0 items-center gap-2 text-sm">
            <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as "new" | "price-asc" | "price-desc")}
              className="rounded-full border border-border bg-background px-3 py-1.5 text-sm outline-none"
            >
              <option value="new">Más nuevos</option>
              <option value="price-asc">Precio: menor a mayor</option>
              <option value="price-desc">Precio: mayor a menor</option>
            </select>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-card p-16 text-center">
            <PackageOpen className="h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 font-display text-xl font-semibold">Sin resultados</h3>
            <p className="mt-1 text-sm text-muted-foreground">Intenta otra búsqueda o categoría.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
            {filtered.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}

        <div className="mt-10 flex justify-center gap-1">
          {[1, 2, 3].map((n) => (
            <button
              key={n}
              className={cn(
                "h-9 w-9 rounded-full text-sm font-medium transition",
                n === 1 ? "bg-primary text-primary-foreground shadow-soft" : "bg-secondary hover:bg-accent",
              )}
            >
              {n}
            </button>
          ))}
        </div>
      </section>
    </StoreShell>
  );
}

function Chip({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "shrink-0 snap-start rounded-full border px-3.5 py-1.5 text-xs font-medium transition",
        active
          ? "border-transparent bg-primary text-primary-foreground shadow-soft"
          : "border-border bg-card text-foreground/70 hover:bg-secondary",
      )}
    >
      {children}
    </button>
  );
}
