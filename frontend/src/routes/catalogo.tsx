import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Search, SlidersHorizontal, PackageOpen, Loader2, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { StoreShell } from "@/components/storefront/StoreShell";
import { ProductCard } from "@/components/storefront/ProductCard";
import { enrichCategories } from "@/lib/categories-ui";
import { useDebouncedValue } from "@/lib/hooks/useDebouncedValue";
import {
  CATALOG_LABEL,
  CATALOG_TITLE,
  IS_MAYOR_CATALOG,
} from "@/lib/config";
import { categoriesQueryOptions, productsQueryOptions } from "@/lib/queries";
import { cn } from "@/lib/utils";

type CatalogSearch = {
  cat?: string;
  q?: string;
  sort?: "new" | "price-asc" | "price-desc";
  page?: number;
};

const PAGE_SIZE = 24;

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
  validateSearch: (s: Record<string, unknown>): CatalogSearch => {
    let page: number | undefined;
    if (typeof s.page === "number" && s.page > 0) page = s.page;
    else if (typeof s.page === "string" && s.page) {
      const n = parseInt(s.page, 10);
      if (n > 0) page = n;
    }

    return {
      cat: typeof s.cat === "string" && s.cat ? s.cat : undefined,
      q: typeof s.q === "string" && s.q ? s.q : undefined,
      sort:
        s.sort === "price-asc" || s.sort === "price-desc" || s.sort === "new"
          ? s.sort
          : undefined,
      page,
    };
  },
  component: Catalog,
});

export function Catalog() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const [qInput, setQInput] = useState(search.q ?? "");
  const debouncedQ = useDebouncedValue(qInput, 300);

  const cat = search.cat ?? "all";
  const sort = search.sort ?? "new";
  const page = search.page ?? 1;

  useEffect(() => {
    setQInput(search.q ?? "");
  }, [search.q]);

  useEffect(() => {
    if (debouncedQ === (search.q ?? "")) return;
    navigate({
      search: (prev) => ({ ...prev, q: debouncedQ || undefined, page: 1 }),
      replace: true,
    });
  }, [debouncedQ, navigate, search.q]);

  const categoriesQuery = useQuery(categoriesQueryOptions());
  const productsQuery = useQuery(
    productsQueryOptions({
      category: cat === "all" ? undefined : cat,
      q: search.q,
      sort,
      page,
      limit: PAGE_SIZE,
    }),
  );

  const categories = enrichCategories(categoriesQuery.data ?? []);
  const products = productsQuery.data?.items ?? [];
  const pagination = productsQuery.data?.pagination;
  const total = pagination?.total ?? 0;
  const totalPages = pagination?.totalPages ?? 1;

  const setCat = (value: string) => {
    navigate({
      search: (prev) => ({
        ...prev,
        cat: value === "all" ? undefined : value,
        page: 1,
      }),
    });
  };

  const setSort = (value: "new" | "price-asc" | "price-desc") => {
    navigate({
      search: (prev) => ({ ...prev, sort: value === "new" ? undefined : value, page: 1 }),
    });
  };

  const setPage = (value: number) => {
    navigate({
      search: (prev) => ({ ...prev, page: value === 1 ? undefined : value }),
    });
  };

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
                {productsQuery.isLoading ? "Cargando..." : `${total} producto${total === 1 ? "" : "s"} disponibles`}
              </p>
            </div>
            <div className="flex w-full max-w-md items-center gap-2 rounded-full border border-border bg-background px-4 py-2 shadow-soft">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                value={qInput}
                onChange={(e) => setQInput(e.target.value)}
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
              <Chip key={c.id} active={cat === c.id} onClick={() => setCat(c.id)}>
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

        {productsQuery.isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : productsQuery.error ? (
          <div className="flex flex-col items-center gap-2 rounded-3xl border border-dashed border-border bg-card p-16 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground" />
            <h3 className="font-display text-xl font-semibold">Error al cargar</h3>
            <p className="mt-1 text-sm text-muted-foreground">{productsQuery.error.message}</p>
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-card p-16 text-center">
            <PackageOpen className="h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 font-display text-xl font-semibold">Sin resultados</h3>
            <p className="mt-1 text-sm text-muted-foreground">Intenta otra búsqueda o categoría.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-10 flex items-center justify-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="grid h-9 w-9 place-items-center rounded-full bg-secondary transition hover:bg-accent disabled:opacity-40"
              aria-label="Página anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                onClick={() => setPage(n)}
                className={cn(
                  "h-9 w-9 rounded-full text-sm font-medium transition",
                  n === page ? "bg-primary text-primary-foreground shadow-soft" : "bg-secondary hover:bg-accent",
                )}
              >
                {n}
              </button>
            ))}
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              className="grid h-9 w-9 place-items-center rounded-full bg-secondary transition hover:bg-accent disabled:opacity-40"
              aria-label="Página siguiente"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
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
