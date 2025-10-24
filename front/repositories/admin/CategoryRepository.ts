import { api } from "../../lib/api";
import { AdminCategoryDTO, AdminCategoryFormDTO } from "../../dto/admin/CategoryDTO";

export const AdminCategoryRepository = {
  async list(): Promise<AdminCategoryDTO[]> {
    const res = await api.get(`/api/v1/admin/categories`);
    const data = res.data?.data || res.data || [];
    return Array.isArray(data) ? data : [];
  },

  async getById(id: number | string): Promise<AdminCategoryDTO> {
    const res = await api.get(`/api/v1/admin/categories/${id}`);
    return res.data;
  },

  async create(data: AdminCategoryFormDTO): Promise<AdminCategoryDTO> {
    const res = await api.post(`/api/v1/admin/categories`, data);
    return res.data;
  },

  async update(id: number | string, data: Partial<AdminCategoryFormDTO>): Promise<AdminCategoryDTO> {
    const res = await api.put(`/api/v1/admin/categories/${id}`, data);
    return res.data;
  },

  async delete(id: number | string): Promise<void> {
    await api.delete(`/api/v1/admin/categories/${id}`);
  },
};
