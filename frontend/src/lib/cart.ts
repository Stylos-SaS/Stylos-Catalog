import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Product } from "./types";
import { CART_STORAGE_KEY, CATALOG_MODE, productPrice } from "./config";
import { productPrimaryImage } from "./product-image";

export type PriceMode = "detal" | "mayor";

export type CartItem = {
  productId: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
};

type CartState = {
  items: CartItem[];
  add: (p: Product, qty?: number) => void;
  remove: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  clear: () => void;
};

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      add: (p, qty = 1) => {
        const price = productPrice(p);
        const existing = get().items.find((i) => i.productId === p.id);
        if (existing) {
          set({
            items: get().items.map((i) =>
              i.productId === p.id ? { ...i, quantity: i.quantity + qty, price } : i,
            ),
          });
        } else {
          set({
            items: [
              ...get().items,
              { productId: p.id, name: p.name, image: productPrimaryImage(p.images), price, quantity: qty },
            ],
          });
        }
      },
      remove: (id) => set({ items: get().items.filter((i) => i.productId !== id) }),
      setQty: (id, qty) =>
        set({
          items: get()
            .items.map((i) => (i.productId === id ? { ...i, quantity: Math.max(1, qty) } : i)),
        }),
      clear: () => set({ items: [] }),
    }),
    { name: CART_STORAGE_KEY },
  ),
);

export const useCartTotals = () => {
  const items = useCart((s) => s.items);
  const subtotal = items.reduce((acc, i) => acc + i.price * i.quantity, 0);
  const count = items.reduce((acc, i) => acc + i.quantity, 0);
  return { subtotal, count };
};

/** Fixed catalog mode for this deployment (from VITE_CATALOG_MODE). */
export function useCatalogMode(): PriceMode {
  return CATALOG_MODE;
}
