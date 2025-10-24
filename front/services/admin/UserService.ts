import { AdminUserRepository, AdminUser, UserStats } from "../../repositories/admin/UserRepository";

export const AdminUserService = {
  async getAll(): Promise<AdminUser[]> {
    return AdminUserRepository.getAll();
  },

  async getStats(): Promise<UserStats> {
    return AdminUserRepository.getStats();
  },
};
