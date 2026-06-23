export type Category = {
  id: string;
  name: string;
  emoji?: string;
};

export type AdminCategory = Category & {
  productCount: number;
  isDefault?: boolean;
};

export type Product = {
  id: string;
  codigo: string;
  name: string;
  description: string;
  category: string;
  categoryId: string;
  priceRetail: number;
  priceWholesale: number;
  images: string[];
  createdAt: string;
  active: boolean;
};

export type ProductImageAsset = {
  url: string;
  path: string;
  esPrincipal: boolean;
};

export type AdminProduct = Product & {
  imageAssets: ProductImageAsset[];
};

export type ProductListResponse = {
  items: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type ProductsQueryParams = {
  category?: string;
  q?: string;
  sort?: "new" | "price-asc" | "price-desc";
  page?: number;
  limit?: number;
};

export type OrderStatus = "pendiente" | "completado" | "cancelado";
export type OrderType = "detal" | "mayor";

export type AdminOrderLine = {
  consec: number;
  productId: string;
  codigo: string;
  name: string;
  image: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
  available: boolean;
};

export type AdminOrder = {
  id: string;
  number: string;
  date: string;
  type: OrderType;
  status: OrderStatus;
  contactoCliente: string | null;
  customer: string;
  itemCount: number;
  total: number;
  items: AdminOrderLine[];
};

export type AdminOrderListItem = Omit<AdminOrder, "items">;

export type AdminOrderListResponse = {
  items: AdminOrderListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type AdminDashboardWeeklySale = {
  date: string;
  total: number;
};

export type AdminDashboard = {
  totalSales: number;
  orderCounts: Record<OrderStatus, number>;
  totalProducts: number;
  recentOrders: AdminOrderListItem[];
  recentProducts: Product[];
  weeklySales: AdminDashboardWeeklySale[];
};
