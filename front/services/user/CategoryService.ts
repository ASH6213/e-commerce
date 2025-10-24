import { UserCategoryRepository, UserCategoryDTO } from "../../repositories/user/CategoryRepository";

export const UserCategoryService = {
  async list(): Promise<UserCategoryDTO[]> {
    return UserCategoryRepository.list();
  },
};
