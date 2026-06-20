import { Link } from "@tanstack/react-router";
import { ShoppingBag, Eye } from "lucide-react";
import type { Product } from "@/lib/types";
import { formatCOP } from "@/lib/format";
import { useCart } from "@/lib/cart";
import { IS_MAYOR_CATALOG, productPrice } from "@/lib/config";
import { productPrimaryImage } from "@/lib/product-image";
import { toast } from "sonner";

export function ProductCard({ product }: { product: Product }) {
  const add = useCart((s) => s.add);
  const price = productPrice(product);
  const compareAt = IS_MAYOR_CATALOG ? product.priceRetail : null;
  const image = productPrimaryImage(product.images);

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-3xl border border-border/60 bg-card shadow-soft transition hover:shadow-pop hover:-translate-y-0.5">
      <Link
        to="/producto/$id"
        params={{ id: product.id }}
        className="relative block aspect-square overflow-hidden bg-secondary"
      >
        <img
          src={image}
          alt={product.name}
          loading="lazy"
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-x-3 bottom-3 flex translate-y-2 gap-2 opacity-0 transition group-hover:translate-y-0 group-hover:opacity-100">
          <button
            onClick={(e) => {
              e.preventDefault();
              add(product);
              toast.success(`${product.name} agregado al carrito`);
            }}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground shadow-pop hover:opacity-90"
          >
            <ShoppingBag className="h-3.5 w-3.5" /> Agregar
          </button>
          <span className="grid h-9 w-9 place-items-center rounded-full bg-background/95 text-foreground shadow-pop">
            <Eye className="h-4 w-4" />
          </span>
        </div>
      </Link>
      <div className="flex flex-1 flex-col gap-1 p-4">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
          {product.category}
        </div>
        <Link
          to="/producto/$id"
          params={{ id: product.id }}
          className="line-clamp-2 text-sm font-semibold leading-snug hover:text-primary"
        >
          {product.name}
        </Link>
        <div className="mt-auto flex items-baseline gap-2 pt-2">
          <span className="font-display text-lg font-semibold text-primary">{formatCOP(price)}</span>
          {compareAt && (
            <span className="text-xs text-muted-foreground line-through">{formatCOP(compareAt)}</span>
          )}
        </div>
      </div>
    </div>
  );
}
