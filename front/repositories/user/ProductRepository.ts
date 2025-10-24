import { api } from "../../lib/api";
import { UserProductDTO, UserProductListDTO } from "../../dto/user/ProductDTO";

export const UserProductRepository = {
  async list(params?: {
    branch_id?: number;
    category?: string;
    order_by?: string;
    offset?: number;
    limit?: number;
  }): Promise<UserProductDTO[]> {
    const res = await api.get<UserProductListDTO>(`/api/v1/products`, { params });
    const data = res.data?.data || res.data || [];
    return Array.isArray(data) ? data : [];
  },

  async getById(id: number | string, branchId?: number): Promise<UserProductDTO> {
    const params = branchId ? { branch_id: branchId } : undefined;
    const res = await api.get(`/api/v1/products/${id}`, { params });
    return res.data;
  },

  async getFeatured(): Promise<UserProductDTO[]> {
    const res = await api.get(`/api/v1/products/featured`);
    return Array.isArray(res.data) ? res.data : [];
  },

  async search(query: string): Promise<UserProductDTO[]> {
    const res = await api.get(`/api/v1/products/search`, { params: { q: query } });
    return Array.isArray(res.data) ? res.data : [];
  },

  async count(filters?: { category?: string; is_active?: boolean }): Promise<number> {
    const res = await api.get(`/api/v1/products/count`, { params: filters });
    return res.data?.count || 0;
  },
};
