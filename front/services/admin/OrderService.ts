import { AdminOrderRepository } from "../../repositories/admin/OrderRepository";
import { AdminOrderSummaryDTO, AdminOrderDetailDTO } from "../../dto/admin/OrderDTO";

export const AdminOrderService = {
  async list(): Promise<AdminOrderSummaryDTO[]> {
    return AdminOrderRepository.list();
  },

  async getById(id: number | string): Promise<AdminOrderDetailDTO> {
    return AdminOrderRepository.getById(id);
  },

  async updateStatus(id: number | string, status: string): Promise<void> {
    return AdminOrderRepository.updateStatus(id, status);
  },
};
