import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import AdminLayout from "../../../components/Admin/AdminLayout";
import DataTable from "../../../components/Admin/DataTable";
import { useAdminAuth } from "../../../context/AdminAuthContext";
import { AdminOrderService } from "../../../services/AdminOrderService";
import { useRealtimeOrders } from "../../../lib/hooks/useRealtimeOrders";

type Order = {
  id: number;
  orderNumber: string;
  customer: string;
  email: string;
  total: number;
  status: string;
  date: string;
  items: number;
};

const OrdersPage = () => {
  const router = useRouter();
  const { admin } = useAdminAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [newOrderCount, setNewOrderCount] = useState(0);

  // Real-time updates
  const { isSubscribed } = useRealtimeOrders({
    enabled: true,
    onOrderCreated: (order: any) => {
      console.log('New order created:', order.order_number);
      setNewOrderCount(prev => prev + 1);
      
      // Play notification sound (optional)
      try {
        const audio = new Audio('/notification.mp3');
        audio.play().catch(() => {});
      } catch (e) {}
      
      // Show browser notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('New Order!', {
          body: `Order ${order.order_number} - $${order.total}`,
          icon: '/favicon.ico',
        });
      }
      
      // Add to list
      const mapped: Order = {
        id: order.id,
        orderNumber: order.order_number,
        customer: 'User #' + (order.user_id || 'Guest'),
        email: '-',
        total: Number(order.total ?? 0),
        status: order.status.charAt(0).toUpperCase() + order.status.slice(1),
        date: new Date(order.created_at).toLocaleDateString(),
        items: 0,
      };
      setOrders(prev => [mapped, ...prev]);
    },
    onOrderStatusUpdated: (order: any) => {
      console.log('Order status updated:', order.order_number, order.previous_status, '->', order.status);
      setOrders(prev => prev.map(o => {
        if (o.id === order.id) {
          return {
            ...o,
            status: order.status.charAt(0).toUpperCase() + order.status.slice(1),
          };
        }
        return o;
      }));
    }
  });

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (!admin) {
      router.push("/admin/login");
      return;
    }
    const fetchOrders = async () => {
      try {
        setLoading(true);
        console.log('[Orders] Fetching orders list...');
        const list = await AdminOrderService.list();
        console.log('[Orders] Received orders:', list);
        const mapped = list.map(o => ({
          ...o,
          customer: o.customer || 'Guest',
          email: o.email || '-'
        }));
        setOrders(mapped);
        console.log('[Orders] Mapped orders:', mapped);
      } catch (error: any) {
        console.error("Error fetching orders:", error);
        console.error("Error response:", error.response?.data);
        console.error("Error status:", error.response?.status);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [admin, router]);

  const filteredOrders =
    filterStatus === "all"
      ? orders
      : orders.filter((order) => order.status.toLowerCase() === filterStatus);

  const orderColumns = [
    { header: "Order #", accessor: "orderNumber" as keyof Order },
    { header: "Customer", accessor: "customer" as keyof Order },
    { header: "Email", accessor: "email" as keyof Order },
    { header: "Items", accessor: "items" as keyof Order },
    {
      header: "Total",
      accessor: (row: Order) => `$${row.total.toFixed(2)}`,
    },
    {
      header: "Status",
      accessor: (row: Order) => {
        const statusColors: Record<string, string> = {
          Completed: "bg-green bg-opacity-20 text-green",
          Processing: "bg-yellow bg-opacity-20 text-yellow",
          Pending: "bg-blue bg-opacity-20 text-blue",
          Shipped: "bg-blue bg-opacity-20 text-blue",
          Cancelled: "bg-red bg-opacity-20 text-red",
        };
        return (
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium ${
              statusColors[row.status] || "bg-gray200 text-gray500"
            }`}
          >
            {row.status}
          </span>
        );
      },
    },
    { header: "Date", accessor: "date" as keyof Order },
    {
      header: "Actions",
      accessor: (row: Order) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/admin/orders/${row.id}`);
          }}
          className="text-blue hover:underline text-sm"
        >
          View Details
        </button>
      ),
    },
  ];

  if (loading) {
    return (
      <AdminLayout title="Orders">
        <div className="flex items-center justify-center h-64">
          <p className="text-gray400 text-lg">Loading...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Orders">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-semibold text-gray500">All Orders</h2>
          {isSubscribed && (
            <span className="text-xs px-2 py-1 bg-green bg-opacity-20 text-green rounded-full">
              🟢 Live
            </span>
          )}
          {newOrderCount > 0 && (
            <span className="text-xs px-3 py-1 bg-red text-white rounded-full font-semibold">
              {newOrderCount} New!
            </span>
          )}
        </div>
        <p className="text-gray400 text-sm mt-1">
          Manage and track customer orders {isSubscribed && '(Real-time updates active)'}
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex gap-2">
        {["all", "pending", "processing", "shipped", "completed", "cancelled"].map(
          (status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filterStatus === status
                  ? "bg-blue text-white"
                  : "bg-white text-gray500 hover:bg-gray100"
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          )
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-md p-4">
          <p className="text-gray400 text-sm">Total Orders</p>
          <p className="text-2xl font-bold text-gray500">{orders.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <p className="text-gray400 text-sm">Pending</p>
          <p className="text-2xl font-bold text-blue">
            {orders.filter((o) => o.status === "Pending").length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <p className="text-gray400 text-sm">Processing</p>
          <p className="text-2xl font-bold text-yellow">
            {orders.filter((o) => o.status === "Processing").length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <p className="text-gray400 text-sm">Completed</p>
          <p className="text-2xl font-bold text-green">
            {orders.filter((o) => o.status === "Completed").length}
          </p>
        </div>
      </div>

      {/* Orders Table */}
      <DataTable
        columns={orderColumns}
        data={filteredOrders}
        onRowClick={(order) => router.push(`/admin/orders/${order.id}`)}
      />
    </AdminLayout>
  );
};

export default OrdersPage;
