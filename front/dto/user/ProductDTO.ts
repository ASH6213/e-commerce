export type UserProductDTO = {
  id: number;
  name: string;
  slug: string;
  description?: string;
  price: number;
  salePrice?: number;
  images?: string[];
  category?: {
    id: number;
    name: string;
    slug: string;
  };
};

export type UserProductListDTO = {
  data: UserProductDTO[];
};
