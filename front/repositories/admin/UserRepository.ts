import { api } from "../../lib/api";

export type AdminUser = {
  id: number;
  name: string;
  email: string;
  phone: string;
  orders: number;
  totalSpent: number;
  status: string;
  joinedDate: string;
};

export type UserStats = {
  totalUsers: number;
  activeUsers: number;
  totalRevenue: number;
};

export const AdminUserRepository = {
  async getAll(): Promise<AdminUser[]> {
    const res = await api.get<{ data: AdminUser[] }>(`/api/v1/admin/users`);
    return res.data.data;
  },

  async getStats(): Promise<UserStats> {
    const res = await api.get<{ data: UserStats }>(`/api/v1/admin/users/stats`);
    return res.data.data;
  },
};
