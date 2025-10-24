import { api } from "../../lib/api";
import { AdminProductDTO, AdminProductFormDTO } from "../../dto/admin/ProductDTO";

export const AdminProductRepository = {
  async list(params?: { per_page?: number; page?: number }): Promise<AdminProductDTO[]> {
    const res = await api.get(`/api/v1/admin/products`, { params });
    const data = res.data?.data || res.data || [];
    return Array.isArray(data) ? data : [];
  },

  async getById(id: number | string): Promise<AdminProductDTO> {
    const res = await api.get(`/api/v1/products/${id}`);
    return res.data;
  },

  async create(data: AdminProductFormDTO): Promise<AdminProductDTO> {
    const res = await api.post(`/api/v1/admin/products`, data);
    return res.data;
  },

  async update(id: number | string, data: Partial<AdminProductFormDTO>): Promise<AdminProductDTO> {
    const res = await api.put(`/api/v1/admin/products/${id}`, data);
    return res.data;
  },

  async delete(id: number | string): Promise<void> {
    await api.delete(`/api/v1/admin/products/${id}`);
  },

  async getBranchStocks(id: number | string): Promise<any[]> {
    const res = await api.get(`/api/v1/admin/products/${id}/stocks`);
    return res.data?.data || [];
  },
};
