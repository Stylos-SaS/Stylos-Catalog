import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Search, ShoppingBag, Menu, X, Heart } from "lucide-react";
import { useEffect, useState } from "react";
import logo from "@/assets/stylos-logo.jpeg";
import { useCartTotals } from "@/lib/cart";
import { STOREFRONT_BANNER_MESSAGE } from "@/lib/config";
import { cn } from "@/lib/utils";

export function Header() {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { count } = useCartTotals();
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const isCatalogPage = path === "/catalogo";

  const nav = [{ to: "/", label: "Inicio" }];

  useEffect(() => {
    if (isCatalogPage) {
      setOpen(false);
    }
  }, [isCatalogPage]);

  const submitSearch = () => {
    const trimmed = searchQuery.trim();
    navigate({
      to: "/catalogo",
      search: { q: trimmed || undefined },
    });
    setOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:gap-6 sm:px-6">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <img src={logo} alt="Stylos Variedades" className="h-10 w-10 rounded-full object-cover shadow-soft" />
          <div className="hidden sm:block leading-tight">
            <div className="font-display font-semibold text-base">Stylos</div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Variedades</div>
          </div>
        </Link>

        {!isCatalogPage && (
          <nav className="hidden md:flex items-center gap-1">
            {nav.map((n) => {
              const active = path === n.to;
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  className={cn(
                    "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-primary text-primary-foreground shadow-soft"
                      : "text-foreground/70 hover:bg-secondary hover:text-foreground",
                  )}
                >
                  {n.label}
                </Link>
              );
            })}
          </nav>
        )}

        {!isCatalogPage && (
          <div className="hidden md:flex flex-1 max-w-sm">
            <HeaderSearchForm
              value={searchQuery}
              onChange={setSearchQuery}
              onSearch={submitSearch}
              placeholder="Buscar productos..."
            />
          </div>
        )}

        <div className="ml-auto flex items-center gap-2">
          <Link
            to="/carrito"
            className="relative grid h-10 w-10 place-items-center rounded-full bg-secondary hover:bg-accent transition"
            aria-label="Carrito"
          >
            <ShoppingBag className="h-5 w-5" />
            {count > 0 && (
              <span className="absolute -top-1 -right-1 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                {count}
              </span>
            )}
          </Link>

          {!isCatalogPage && (
            <button
              onClick={() => setOpen((v) => !v)}
              className="md:hidden grid h-10 w-10 place-items-center rounded-full bg-secondary"
              aria-label="Menú"
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          )}
        </div>
      </div>

      {!isCatalogPage && open && (
        <div className="md:hidden border-t border-border bg-background px-4 py-4 space-y-3">
          <HeaderSearchForm
            value={searchQuery}
            onChange={setSearchQuery}
            onSearch={submitSearch}
            placeholder="Buscar..."
          />
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              onClick={() => setOpen(false)}
              className="block rounded-xl px-4 py-2 text-sm font-medium hover:bg-secondary"
            >
              {n.label}
            </Link>
          ))}
        </div>
      )}

      <ModeBanner message={STOREFRONT_BANNER_MESSAGE} />
    </header>
  );
}

function HeaderSearchForm({
  value,
  onChange,
  onSearch,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;
  placeholder: string;
}) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSearch();
      }}
      className="flex w-full items-center gap-2 rounded-full border border-border bg-secondary/50 px-4 py-2"
    >
      <button
        type="submit"
        aria-label="Buscar"
        className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
      >
        <Search className="h-4 w-4" />
      </button>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
      />
    </form>
  );
}

function ModeBanner({ message }: { message: string }) {
  const [primary, secondary] = message.split(" · ");

  return (
    <div className="bg-gradient-brand text-primary-foreground">
      <div className="mx-auto flex max-w-7xl items-center justify-center gap-2 px-4 py-1.5 text-xs font-medium">
        <Heart className="h-3 w-3 fill-current" />
        {secondary ? (
          <>
            <span className="font-bold">{primary}</span>
            {" · "}
            {secondary}
          </>
        ) : (
          message
        )}
      </div>
    </div>
  );
}
