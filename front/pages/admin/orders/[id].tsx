import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import AdminLayout from "../../../components/Admin/AdminLayout";
import Button from "../../../components/Admin/Button";
import { useAdminAuth } from "../../../context/AdminAuthContext";
import { AdminOrderService } from "../../../services/AdminOrderService";

type OrderItem = {
  id: number;
  productName: string;
  quantity: number;
  price: number;
  total: number;
};

type OrderDetails = {
  id: number;
  orderNumber: string;
  customer: {
    name: string;
    email: string;
    phone: string;
    shippingAddress: string;
  };
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  status: string;
  paymentMethod: string;
  date: string;
};

const OrderDetailsPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const { admin } = useAdminAuth();
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    if (!admin) {
      router.push("/admin/login");
      return;
    }

    if (id) {
      (async () => {
        try {
          const data = await AdminOrderService.getById(id as string);
          setOrder(data);
        } catch (e) {
          console.error(e);
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [id, admin, router]);

  const handleStatusUpdate = async (newStatus: string) => {
    setUpdatingStatus(true);
    try {
      await AdminOrderService.updateStatus(id as string, newStatus);
      if (order) setOrder({ ...order, status: newStatus });
      setUpdatingStatus(false);
    } catch (error) {
      console.error("Error updating status:", error);
      setUpdatingStatus(false);
    }
  };

  if (loading || !order) {
    return (
      <AdminLayout title="Order Details">
        <div className="flex items-center justify-center h-64">
          <p className="text-gray400 text-lg">Loading...</p>
        </div>
      </AdminLayout>
    );
  }

  const statusColors: Record<string, string> = {
    Pending: "bg-blue bg-opacity-20 text-blue",
    Processing: "bg-yellow bg-opacity-20 text-yellow",
    Shipped: "bg-blue bg-opacity-20 text-blue",
    Completed: "bg-green bg-opacity-20 text-green",
    Cancelled: "bg-red bg-opacity-20 text-red",
  };

  return (
    <AdminLayout title={`Order ${order.orderNumber}`}>
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="text-blue hover:underline mb-4 flex items-center"
        >
          ← Back to Orders
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-gray500">
              Order {order.orderNumber}
            </h2>
            <p className="text-gray400 text-sm mt-1">Placed on {order.date}</p>
          </div>
          <span
            className={`px-4 py-2 rounded-full text-sm font-medium ${
              statusColors[order.status]
            }`}
          >
            {order.status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Items */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray500 mb-4">Order Items</h3>
            <div className="space-y-4">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between border-b border-gray200 pb-4 last:border-b-0 last:pb-0"
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray500">{item.productName}</p>
                    <p className="text-sm text-gray400">
                      ${item.price.toFixed(2)} × {item.quantity}
                    </p>
                  </div>
                  <p className="font-semibold text-gray500">
                    ${item.total.toFixed(2)}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-gray200 space-y-2">
              <div className="flex justify-between text-gray400">
                <span>Subtotal</span>
                <span>${order.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray400">
                <span>Shipping</span>
                <span>${order.shipping.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray400">
                <span>Tax</span>
                <span>${order.tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-semibold text-gray500 pt-2 border-t border-gray200">
                <span>Total</span>
                <span>${order.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Update Status */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray500 mb-4">
              Update Order Status
            </h3>
            <div className="flex flex-wrap gap-2">
              {["Pending", "Processing", "Shipped", "Completed", "Cancelled"].map(
                (status) => (
                  <Button
                    key={status}
                    variant={order.status === status ? "primary" : "secondary"}
                    size="sm"
                    onClick={() => handleStatusUpdate(status)}
                    disabled={updatingStatus || order.status === status}
                  >
                    {status}
                  </Button>
                )
              )}
            </div>
          </div>
        </div>

        {/* Customer Info */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray500 mb-4">
              Customer Information
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray400">Name</p>
                <p className="font-medium text-gray500">{order.customer.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray400">Email</p>
                <p className="font-medium text-gray500">{order.customer.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray400">Phone</p>
                <p className="font-medium text-gray500">{order.customer.phone}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray500 mb-4">
              Shipping Address
            </h3>
            <p className="text-gray500">{order.customer.shippingAddress}</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray500 mb-4">
              Payment Method
            </h3>
            <p className="text-gray500">{order.paymentMethod}</p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default OrderDetailsPage;
