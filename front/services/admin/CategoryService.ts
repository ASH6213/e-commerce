import { AdminCategoryRepository } from "../../repositories/admin/CategoryRepository";
import { AdminCategoryDTO, AdminCategoryFormDTO } from "../../dto/admin/CategoryDTO";

export const AdminCategoryService = {
  async list(): Promise<AdminCategoryDTO[]> {
    return AdminCategoryRepository.list();
  },

  async getById(id: number | string): Promise<AdminCategoryDTO> {
    return AdminCategoryRepository.getById(id);
  },

  async create(data: AdminCategoryFormDTO): Promise<AdminCategoryDTO> {
    return AdminCategoryRepository.create(data);
  },

  async update(id: number | string, data: Partial<AdminCategoryFormDTO>): Promise<AdminCategoryDTO> {
    return AdminCategoryRepository.update(id, data);
  },

  async delete(id: number | string): Promise<void> {
    return AdminCategoryRepository.delete(id);
  },
};
