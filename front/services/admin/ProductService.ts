import { AdminProductRepository } from "../../repositories/admin/ProductRepository";
import { AdminProductDTO, AdminProductFormDTO } from "../../dto/admin/ProductDTO";

export const AdminProductService = {
  async list(params?: { per_page?: number; page?: number }): Promise<AdminProductDTO[]> {
    return AdminProductRepository.list(params);
  },

  async getById(id: number | string): Promise<AdminProductDTO> {
    return AdminProductRepository.getById(id);
  },

  async create(data: AdminProductFormDTO): Promise<AdminProductDTO> {
    return AdminProductRepository.create(data);
  },

  async update(id: number | string, data: Partial<AdminProductFormDTO>): Promise<AdminProductDTO> {
    return AdminProductRepository.update(id, data);
  },

  async delete(id: number | string): Promise<void> {
    return AdminProductRepository.delete(id);
  },

  async getBranchStocks(id: number | string): Promise<any[]> {
    return AdminProductRepository.getBranchStocks(id);
  },
};
