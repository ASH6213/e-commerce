import { api } from "../../lib/api";
import { UserOrderDTO, UserOrderResponseDTO } from "../../dto/user/OrderDTO";

export const UserOrderRepository = {
  async create(order: UserOrderDTO): Promise<UserOrderResponseDTO> {
    const res = await api.post<UserOrderResponseDTO>(`/api/v1/orders`, order);
    return res.data;
  },

  async listMine(userId: number): Promise<any[]> {
    const res = await api.get(`/api/v1/orders/mine`, { params: { user_id: userId } });
    const data = res.data?.data || [];
    const list = Array.isArray(data) ? data : [];
    // Ensure latest orders first on the client as a safeguard
    return list.sort((a: any, b: any) => {
      const da = new Date(a?.createdAt ?? a?.created_at ?? 0).getTime();
      const db = new Date(b?.createdAt ?? b?.created_at ?? 0).getTime();
      return db - da;
    });
  },
};
