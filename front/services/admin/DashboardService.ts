import { DashboardRepository, DashboardStats, RecentOrder } from "../../repositories/admin/DashboardRepository";

export const DashboardService = {
  async getStats(): Promise<DashboardStats> {
    return DashboardRepository.getStats();
  },

  async getRecentOrders(): Promise<RecentOrder[]> {
    return DashboardRepository.getRecentOrders();
  },
};
