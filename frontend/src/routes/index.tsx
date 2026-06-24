import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Sparkles, Truck, ShieldCheck, Heart, Loader2, AlertCircle } from "lucide-react";
import { StoreShell } from "@/components/storefront/StoreShell";
import { ProductCard } from "@/components/storefront/ProductCard";
import { enrichCategories } from "@/lib/categories-ui";
import { IS_MAYOR_CATALOG } from "@/lib/config";
import { categoriesQueryOptions, featuredProductsQueryOptions } from "@/lib/queries";
import heroImg from "@/assets/stylos-logo.jpeg";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      {
        title: IS_MAYOR_CATALOG
          ? "Stylos Variedades — Catálogo Mayorista"
          : "Stylos Variedades — Tu tienda de detalles bonitos",
      },
      {
        name: "description",
        content: IS_MAYOR_CATALOG
          ? "Precios al por mayor para tu negocio. Hogar, accesorios, belleza, regalos y papelería. Pide por WhatsApp."
          : "Descubre hogar, accesorios, belleza, regalos y papelería. Pide por WhatsApp.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const categoriesQuery = useQuery(categoriesQueryOptions());
  const featuredQuery = useQuery(featuredProductsQueryOptions());

  const categories = enrichCategories(categoriesQuery.data ?? []);
  const featured = featuredQuery.data?.items ?? [];
  const loading = categoriesQuery.isLoading || featuredQuery.isLoading;
  const error = categoriesQuery.error ?? featuredQuery.error;

  return (
    <StoreShell>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-hero">
        <div className="mx-auto grid max-w-7xl items-center gap-8 px-6 py-12 md:grid-cols-2 md:py-20">
          <div className="space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full bg-background/80 px-3 py-1 text-xs font-medium text-primary shadow-soft">
              <Sparkles className="h-3.5 w-3.5" /> Selección especial · Con amor
            </span>
            <h1 className="font-display text-4xl font-bold leading-[1.05] sm:text-5xl md:text-6xl">
              Detalles que <span className="text-primary">enamoran</span>,<br />
              precios que sorprenden.
            </h1>
            <p className="max-w-md text-base text-muted-foreground sm:text-lg">
              {IS_MAYOR_CATALOG
                ? "Precios especiales al por mayor para revender. Hogar, regalos, accesorios y mucho más."
                : "Hogar, regalos, accesorios y mucho más. Precios que sorprenden."}
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/catalogo"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-pop transition hover:opacity-90"
              >
                Ver {IS_MAYOR_CATALOG ? "Catálogo Mayorista" : "Catálogo"} <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-2 pt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><Truck className="h-4 w-4 text-primary" /> Envíos a todo Colombia</span>
              <span className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-primary" /> Compra segura</span>
              <span className="flex items-center gap-1.5"><Heart className="h-4 w-4 text-primary fill-current" /> +5 mil clientes felices</span>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-6 rounded-[2.5rem] bg-gradient-brand opacity-30 blur-2xl" />
            <div className="relative overflow-hidden rounded-[2rem] shadow-pop border border-white/40">
              <img src={heroImg} alt="Stylos Variedades" className="aspect-[4/3] w-full object-contain bg-gradient-soft" />
            </div>
            <div className="absolute -bottom-4 -left-4 hidden rounded-2xl bg-background/95 backdrop-blur px-4 py-3 shadow-pop sm:flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-full bg-primary/15 text-primary">
                <Heart className="h-5 w-5 fill-current" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Envíos</div>
                <div className="text-sm font-semibold">Coordinados con cariño</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categorías */}
      <section className="mx-auto max-w-7xl px-6 py-14">
        <SectionHeading title="Compra por categoría" subtitle="Encuentra justo lo que buscas" />
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <ApiErrorMessage error={error} />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6">
            {categories.map((c) => (
              <Link
                key={c.id}
                to="/catalogo"
                search={{ cat: c.id }}
                className={cn(
                  "group relative flex flex-col items-center gap-2 rounded-2xl border border-border/60 bg-card p-5 text-center shadow-soft transition hover:-translate-y-0.5 hover:shadow-pop",
                )}
              >
                <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-soft text-2xl transition group-hover:scale-110">
                  {c.emoji}
                </div>
                <div className="text-sm font-semibold">{c.name}</div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Productos destacados */}
      <section className="mx-auto max-w-7xl px-6 pb-20">
        <div className="flex items-end justify-between gap-4">
          <SectionHeading title="Lo más amado" subtitle="Los favoritos de nuestros clientes" inline />
          <Link to="/catalogo" className="hidden sm:inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
            Ver todo <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        {loading ? (
          <div className="mt-6 flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="mt-6">
            <ApiErrorMessage error={error} />
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>
    </StoreShell>
  );
}

function ApiErrorMessage({ error }: { error: Error }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border bg-card p-8 text-center">
      <AlertCircle className="h-8 w-8 text-muted-foreground" />
      <p className="text-sm text-muted-foreground">
        No pudimos cargar el catálogo. Verifica que el backend esté activo y que{" "}
        <code className="text-xs">VITE_API_BASE_URL</code> esté configurado.
      </p>
      <p className="text-xs text-muted-foreground">{error.message}</p>
    </div>
  );
}

function SectionHeading({
  title,
  subtitle,
  inline,
}: {
  title: string;
  subtitle?: string;
  inline?: boolean;
}) {
  return (
    <div className={inline ? "" : "mb-8 text-center"}>
      <h2 className="font-display text-3xl font-bold sm:text-4xl">{title}</h2>
      {subtitle && <p className="mt-2 text-sm text-muted-foreground sm:text-base">{subtitle}</p>}
    </div>
  );
}
