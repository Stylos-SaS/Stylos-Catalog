import p1 from "@/assets/p1.jpg";
import p2 from "@/assets/p2.jpg";
import p3 from "@/assets/p3.jpg";
import p4 from "@/assets/p4.jpg";
import p5 from "@/assets/p5.jpg";

export type CategorySlug =
  | "hogar"
  | "accesorios"
  | "belleza"
  | "regalos"
  | "papeleria"
  | "decoracion";

export type Product = {
  id: string;
  name: string;
  description: string;
  category: CategorySlug;
  priceRetail: number;
  priceWholesale: number;
  images: string[];
  tag?: "nuevo" | "mas-vendido" | "oferta";
  createdAt: string;
};

export const categories: {
  slug: CategorySlug;
  name: string;
  emoji: string;
  gradient: string;
}[] = [
  { slug: "hogar", name: "Hogar", emoji: "🏠", gradient: "from-rose-soft to-blush" },
  { slug: "accesorios", name: "Accesorios", emoji: "💍", gradient: "from-coral/40 to-rose-soft" },
  { slug: "belleza", name: "Belleza", emoji: "💄", gradient: "from-rose-soft to-coral/40" },
  { slug: "regalos", name: "Regalos", emoji: "🎁", gradient: "from-blush to-coral/30" },
  { slug: "papeleria", name: "Papelería", emoji: "📒", gradient: "from-cream to-rose-soft" },
  { slug: "decoracion", name: "Decoración", emoji: "🕯️", gradient: "from-rose-soft to-cream" },
];

export const products: Product[] = [
  {
    id: "set-mug-vela",
    name: "Set Mug + Vela Aromática",
    description:
      "Combo perfecto para regalar: mug de cerámica pastel y vela aromática de vainilla en empaque dorado.",
    category: "hogar",
    priceRetail: 38900,
    priceWholesale: 28500,
    images: [p1, p5, p6Fallback()],
    tag: "mas-vendido",
    createdAt: "2026-05-21",
  },
  {
    id: "joyero-corazon",
    name: "Joyero Corazón Rosa",
    description:
      "Joyero acolchado en forma de corazón, interior aterciopelado y cierre dorado. Ideal para anillos y cadenas.",
    category: "accesorios",
    priceRetail: 24900,
    priceWholesale: 17900,
    images: [p2, p5, p1],
    tag: "nuevo",
    createdAt: "2026-06-02",
  },
  {
    id: "brochas-makeup",
    name: "Set 6 Brochas de Maquillaje",
    description:
      "Set premium de 6 brochas con cerdas ultra suaves y mango rosa pastel. Incluye estuche de tela.",
    category: "belleza",
    priceRetail: 32500,
    priceWholesale: 23900,
    images: [p3, p2, p1],
    tag: "oferta",
    createdAt: "2026-05-12",
  },
  {
    id: "kit-papeleria",
    name: "Kit Papelería Pastel",
    description:
      "Cuadernos tapa dura, washi tape, lapiceros y notas adhesivas en tonos rosa y coral.",
    category: "papeleria",
    priceRetail: 28900,
    priceWholesale: 20500,
    images: [p4, p1, p5],
    createdAt: "2026-04-30",
  },
  {
    id: "caja-regalo-premium",
    name: "Caja de Regalo Premium",
    description:
      "Caja decorativa con lazo de raso, lista para sorprender en cumpleaños, aniversarios o fechas especiales.",
    category: "regalos",
    priceRetail: 15900,
    priceWholesale: 9900,
    images: [p5, p2, p1],
    tag: "nuevo",
    createdAt: "2026-06-10",
  },
  {
    id: "deco-room",
    name: "Pack Decoración Habitación",
    description:
      "Velas pequeñas, mini florero y luces tipo cadena LED para un ambiente cálido y femenino.",
    category: "decoracion",
    priceRetail: 45900,
    priceWholesale: 34900,
    images: [p1, p4, p5],
    tag: "mas-vendido",
    createdAt: "2026-03-18",
  },
  {
    id: "espejo-bolsillo",
    name: "Espejo de Bolsillo Floral",
    description: "Espejo plegable de bolsillo con estampado floral, ideal para llevar siempre contigo.",
    category: "accesorios",
    priceRetail: 9900,
    priceWholesale: 5500,
    images: [p2, p3, p1],
    createdAt: "2026-05-02",
  },
  {
    id: "labial-mate",
    name: "Set Labiales Mate Pastel",
    description: "Trío de labiales mate de larga duración en tonos rosa palo, coral y rojo suave.",
    category: "belleza",
    priceRetail: 26900,
    priceWholesale: 18500,
    images: [p3, p2, p5],
    tag: "oferta",
    createdAt: "2026-06-05",
  },
];

function p6Fallback() {
  return p1;
}

export type OrderStatus = "pendiente" | "completado" | "cancelado";
export type OrderType = "detal" | "mayor";

export type OrderItem = {
  productId: string;
  name: string;
  image: string;
  unitPrice: number;
  quantity: number;
  available: boolean;
};

export type Order = {
  id: string;
  number: string;
  date: string;
  type: OrderType;
  status: OrderStatus;
  customer: string;
  whatsapp: string;
  items: OrderItem[];
};

export const orders: Order[] = [
  {
    id: "o1",
    number: "SV-1042",
    date: "2026-06-17",
    type: "detal",
    status: "pendiente",
    customer: "María Gómez",
    whatsapp: "+57 301 234 5678",
    items: [
      { productId: "set-mug-vela", name: "Set Mug + Vela", image: p1, unitPrice: 38900, quantity: 2, available: true },
      { productId: "joyero-corazon", name: "Joyero Corazón", image: p2, unitPrice: 24900, quantity: 1, available: true },
    ],
  },
  {
    id: "o2",
    number: "SV-1041",
    date: "2026-06-16",
    type: "mayor",
    status: "completado",
    customer: "Tienda La Esquina",
    whatsapp: "+57 312 987 6543",
    items: [
      { productId: "brochas-makeup", name: "Set Brochas", image: p3, unitPrice: 23900, quantity: 12, available: true },
      { productId: "labial-mate", name: "Labiales Mate", image: p3, unitPrice: 18500, quantity: 8, available: true },
    ],
  },
  {
    id: "o3",
    number: "SV-1040",
    date: "2026-06-15",
    type: "detal",
    status: "completado",
    customer: "Laura Pineda",
    whatsapp: "+57 320 111 2222",
    items: [
      { productId: "caja-regalo-premium", name: "Caja Regalo", image: p5, unitPrice: 15900, quantity: 3, available: true },
    ],
  },
  {
    id: "o4",
    number: "SV-1039",
    date: "2026-06-14",
    type: "mayor",
    status: "cancelado",
    customer: "Boutique Pétalo",
    whatsapp: "+57 305 444 5566",
    items: [
      { productId: "deco-room", name: "Pack Deco", image: p1, unitPrice: 34900, quantity: 6, available: false },
    ],
  },
  {
    id: "o5",
    number: "SV-1038",
    date: "2026-06-13",
    type: "detal",
    status: "pendiente",
    customer: "Andrea Ríos",
    whatsapp: "+57 318 222 3344",
    items: [
      { productId: "kit-papeleria", name: "Kit Papelería", image: p4, unitPrice: 28900, quantity: 1, available: true },
      { productId: "espejo-bolsillo", name: "Espejo Floral", image: p2, unitPrice: 9900, quantity: 2, available: true },
    ],
  },
];

export const WHATSAPP_NUMBER = "573014039265";

export function getProduct(id: string) {
  return products.find((p) => p.id === id);
}

export function getOrder(id: string) {
  return orders.find((o) => o.id === id);
}
