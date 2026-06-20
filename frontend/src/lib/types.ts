export type Category = {
  id: string;
  name: string;
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
