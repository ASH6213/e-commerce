import { api } from "../../lib/api";

export type DashboardStats = {
  totalProducts: number;
  totalOrders: number;
  totalUsers: number;
  totalRevenue: number;
  pendingOrders: number;
  processingOrders: number;
  completedOrders: number;
};

export type RecentOrder = {
  id: number;
  orderNumber: string;
  customer: string;
  total: number;
  status: string;
  date: string;
};

export const DashboardRepository = {
  async getStats(): Promise<DashboardStats> {
    const res = await api.get<{ data: DashboardStats }>(`/api/v1/admin/dashboard/stats`);
    return res.data.data;
  },

  async getRecentOrders(): Promise<RecentOrder[]> {
    const res = await api.get<{ data: RecentOrder[] }>(`/api/v1/admin/dashboard/recent-orders`);
    return res.data.data;
  },
};
