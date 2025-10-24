import { api } from "../../lib/api";
import { AdminOrderSummaryDTO, AdminOrderDetailDTO } from "../../dto/admin/OrderDTO";

export const AdminOrderRepository = {
  async list(): Promise<AdminOrderSummaryDTO[]> {
    const res = await api.get(`/api/v1/admin/orders`, { params: { per_page: 100 } });
    const payload = res.data;
    const list: any[] = Array.isArray(payload) ? payload : payload?.data || [];
    return list.map((o: any) => ({
      id: Number(o.id),
      orderNumber: String(o.order_number),
      customer: o?.user?.name,
      email: o?.user?.email,
      total: Number(o.total ?? 0),
      status: String(o.status ?? "pending").replace(/^[a-z]/, (c: string) => c.toUpperCase()),
      date: new Date(o.created_at).toISOString().slice(0, 10),
      items: Array.isArray(o.items) ? o.items.length : (Number(o.items_count) || 0),
    }));
  },

  async getById(id: number | string): Promise<AdminOrderDetailDTO> {
    const res = await api.get(`/api/v1/admin/orders/${id}`);
    const o = res.data;
    return {
      id: Number(o.id),
      orderNumber: String(o.order_number),
      customer: {
        name: o?.user?.name,
        email: o?.user?.email,
        phone: o?.user?.phone ?? null,
        shippingAddress: o?.shipping_address,
      },
      items: (o.items || []).map((it: any) => ({
        id: Number(it.id),
        productName: it.product_name ?? it?.product?.name ?? "",
        quantity: Number(it.quantity ?? 0),
        price: Number(it.price ?? 0),
        total: Number(it.total ?? 0),
      })),
      subtotal: Number(o.subtotal ?? 0),
      shipping: Number(o.shipping ?? 0),
      tax: Number(o.tax ?? 0),
      total: Number(o.total ?? 0),
      status: String(o.status ?? "pending").replace(/^[a-z]/, (c: string) => c.toUpperCase()),
      paymentMethod: String(o.payment_method ?? ""),
      date: new Date(o.created_at).toISOString().slice(0, 10),
    };
  },

  async updateStatus(id: number | string, status: string): Promise<void> {
    await api.put(`/api/v1/admin/orders/${id}/status`, { status: status.toLowerCase() });
  },
};
