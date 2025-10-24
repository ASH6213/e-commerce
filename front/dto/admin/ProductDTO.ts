export type AdminProductDTO = {
  id: number;
  name: string;
  slug: string;
  description?: string;
  price: number;
  salePrice?: number;
  stock: number;
  sku?: string;
  images?: string[];
  isActive: boolean;
  isFeatured: boolean;
  categoryId: number;
  category?: {
    id: number;
    name: string;
    slug: string;
  };
  createdAt?: string;
  updatedAt?: string;
};

export type AdminProductFormDTO = {
  category_id: number;
  name: string;
  slug: string;
  description?: string;
  price: number;
  sale_price?: number;
  stock: number;
  sku?: string;
  images?: File[];
  is_active: boolean;
  is_featured: boolean;
};
