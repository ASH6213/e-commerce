import { UserProductRepository } from "../../repositories/user/ProductRepository";
import { UserProductDTO } from "../../dto/user/ProductDTO";

export const UserProductService = {
  async list(params?: {
    branch_id?: number;
    category?: string;
    order_by?: string;
    offset?: number;
    limit?: number;
  }): Promise<UserProductDTO[]> {
    return UserProductRepository.list(params);
  },

  async getById(id: number | string, branchId?: number): Promise<UserProductDTO> {
    return UserProductRepository.getById(id, branchId);
  },

  async getFeatured(): Promise<UserProductDTO[]> {
    return UserProductRepository.getFeatured();
  },

  async search(query: string): Promise<UserProductDTO[]> {
    return UserProductRepository.search(query);
  },

  async count(filters?: { category?: string; is_active?: boolean }): Promise<number> {
    return UserProductRepository.count(filters);
  },
};
