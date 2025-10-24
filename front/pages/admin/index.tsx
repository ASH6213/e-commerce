import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import AdminLayout from "../../components/Admin/AdminLayout";
import StatsCard from "../../components/Admin/StatsCard";
import DataTable from "../../components/Admin/DataTable";
import { useAdminAuth } from "../../context/AdminAuthContext";
import { DashboardService } from "../../services/admin/DashboardService";
import { getPusher } from "../../lib/realtime";
import { DashboardStats, RecentOrder } from "../../repositories/admin/DashboardRepository";

const AdminDashboard = () => {
  const router = useRouter();
  const { admin } = useAdminAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    totalOrders: 0,
    totalUsers: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    processingOrders: 0,
    completedOrders: 0,
  });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!admin) {
      router.push("/admin/login");
      return;
    }

    // Fetch dashboard data
    const fetchDashboardData = async () => {
      try {
        console.log("[Dashboard] Fetching stats...");
        // Fetch real stats from API
        const statsData = await DashboardService.getStats();
        console.log("[Dashboard] Stats received:", statsData);
        setStats(statsData);

        console.log("[Dashboard] Fetching recent orders...");
        // Fetch recent orders from API
        const ordersData = await DashboardService.getRecentOrders();
        console.log("[Dashboard] Orders received:", ordersData);
        setRecentOrders(ordersData);

        setLoading(false);
      } catch (error: any) {
        console.error("Error fetching dashboard data:", error);
        console.error("Error response:", error.response?.data);
        console.error("Error status:", error.response?.status);
        setLoading(false);
      }
    };

    fetchDashboardData();
    // Real-time (polling) refresh every 10s
    const id = setInterval(fetchDashboardData, 10000);
    return () => clearInterval(id);
  }, [admin, router]);

  // Live updates via Pusher (order.created)
  useEffect(() => {
    if (!admin) return;
    let subscribed = true;
    let channel: any = null;
    let pusher: any = null;
    (async () => {
      try {
        pusher = await getPusher();
        if (!pusher) return;
        channel = pusher.subscribe('orders');
        const handler = async () => {
          if (!subscribed) return;
          try {
            const statsData = await DashboardService.getStats();
            const ordersData = await DashboardService.getRecentOrders();
            if (!subscribed) return;
            setStats(statsData);
            setRecentOrders(ordersData);
          } catch (_) {}
        };
        channel.bind('order.created', handler);
      } catch (_) {}
    })();
    return () => {
      subscribed = false;
      try { if (channel) channel.unbind_all(); } catch (_) {}
      try { if (pusher) pusher.disconnect(); } catch (_) {}
    };
  }, [admin]);

  const orderColumns = [
    { header: "Order #", accessor: "orderNumber" as keyof RecentOrder },
    { header: "Customer", accessor: "customer" as keyof RecentOrder },
    {
      header: "Total",
      accessor: (row: RecentOrder) => `$${row.total.toFixed(2)}`,
    },
    {
      header: "Status",
      accessor: (row: RecentOrder) => (
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium ${
            row.status === "Completed"
              ? "bg-green bg-opacity-20 text-green"
              : row.status === "Processing"
              ? "bg-yellow bg-opacity-20 text-yellow"
              : "bg-red bg-opacity-20 text-red"
          }`}
        >
          {row.status}
        </span>
      ),
    },
    { header: "Date", accessor: "date" as keyof RecentOrder },
  ];

  if (loading) {
    return (
      <AdminLayout title="Dashboard">
        <div className="flex items-center justify-center h-64">
          <p className="text-gray400 text-lg">Loading...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Dashboard">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Total Products"
          value={stats.totalProducts}
          icon="📦"
          color="blue"
          trend={{ value: 12, isPositive: true }}
        />
        <StatsCard
          title="Total Orders"
          value={stats.totalOrders}
          icon="🛒"
          color="green"
          trend={{ value: 8, isPositive: true }}
        />
        <StatsCard
          title="Total Users"
          value={stats.totalUsers}
          icon="👥"
          color="yellow"
          trend={{ value: 15, isPositive: true }}
        />
        <StatsCard
          title="Total Revenue"
          value={`$${stats.totalRevenue.toLocaleString()}`}
          icon="💰"
          color="green"
          trend={{ value: 23, isPositive: true }}
        />
      </div>

      {/* Recent Orders */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray500">Recent Orders</h2>
          <button
            onClick={() => router.push("/admin/orders")}
            className="text-blue hover:underline text-sm"
          >
            View All →
          </button>
        </div>
        <DataTable
          columns={orderColumns}
          data={recentOrders}
          onRowClick={(order) => router.push(`/admin/orders/${order.id}`)}
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div
          onClick={() => router.push("/admin/products/new")}
          className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
        >
          <div className="flex items-center">
            <span className="text-4xl mr-4">➕</span>
            <div>
              <h3 className="text-lg font-semibold text-gray500">Add Product</h3>
              <p className="text-sm text-gray400">Create a new product</p>
            </div>
          </div>
        </div>

        <div
          onClick={() => router.push("/admin/orders")}
          className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
        >
          <div className="flex items-center">
            <span className="text-4xl mr-4">📋</span>
            <div>
              <h3 className="text-lg font-semibold text-gray500">Manage Orders</h3>
              <p className="text-sm text-gray400">View and process orders</p>
            </div>
          </div>
        </div>

        <div
          onClick={() => router.push("/admin/users")}
          className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
        >
          <div className="flex items-center">
            <span className="text-4xl mr-4">👤</span>
            <div>
              <h3 className="text-lg font-semibold text-gray500">Manage Users</h3>
              <p className="text-sm text-gray400">View and manage users</p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
