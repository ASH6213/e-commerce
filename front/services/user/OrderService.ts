import { UserOrderRepository } from "../../repositories/user/OrderRepository";
import { UserOrderDTO, UserOrderResponseDTO } from "../../dto/user/OrderDTO";

export const UserOrderService = {
  async create(order: UserOrderDTO): Promise<UserOrderResponseDTO> {
    return UserOrderRepository.create(order);
  },

  async listMine(userId: number): Promise<any[]> {
    return UserOrderRepository.listMine(userId);
  },
};
