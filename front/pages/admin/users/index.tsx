import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import AdminLayout from "../../../components/Admin/AdminLayout";
import DataTable from "../../../components/Admin/DataTable";
import { useAdminAuth } from "../../../context/AdminAuthContext";
import { AdminUserService } from "../../../services/admin/UserService";
import { AdminUser, UserStats } from "../../../repositories/admin/UserRepository";

type User = AdminUser;

const UsersPage = () => {
  const router = useRouter();
  const { admin } = useAdminAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!admin) {
      router.push("/admin/login");
      return;
    }

    // Fetch users from API
    const fetchUsers = async () => {
      try {
        const usersData = await AdminUserService.getAll();
        setUsers(usersData);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching users:", error);
        setLoading(false);
      }
    };

    fetchUsers();
  }, [admin, router]);

  const filteredUsers = users.filter(
    (user) =>
      (user.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (user.email?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  const userColumns = [
    { header: "ID", accessor: "id" as keyof User, width: "80px" },
    { header: "Name", accessor: "name" as keyof User },
    { header: "Email", accessor: "email" as keyof User },
    { header: "Phone", accessor: "phone" as keyof User },
    { header: "Orders", accessor: "orders" as keyof User },
    {
      header: "Total Spent",
      accessor: (row: User) => `$${row.totalSpent.toFixed(2)}`,
    },
    {
      header: "Status",
      accessor: (row: User) => (
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium ${
            row.status === "Active"
              ? "bg-green bg-opacity-20 text-green"
              : "bg-gray300 text-gray500"
          }`}
        >
          {row.status}
        </span>
      ),
    },
    { header: "Joined", accessor: "joinedDate" as keyof User },
  ];

  if (loading) {
    return (
      <AdminLayout title="Users">
        <div className="flex items-center justify-center h-64">
          <p className="text-gray400 text-lg">Loading...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Users">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray500">All Users</h2>
        <p className="text-gray400 text-sm mt-1">
          Manage customer accounts and information
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-md p-4">
          <p className="text-gray400 text-sm">Total Users</p>
          <p className="text-2xl font-bold text-gray500">{users.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <p className="text-gray400 text-sm">Active Users</p>
          <p className="text-2xl font-bold text-green">
            {users.filter((u) => u.status === "Active").length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <p className="text-gray400 text-sm">Total Revenue</p>
          <p className="text-2xl font-bold text-blue">
            ${users.reduce((sum, u) => sum + u.totalSpent, 0).toFixed(2)}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search users by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full md:w-96 px-4 py-2 border border-gray300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue focus:border-transparent"
        />
      </div>

      {/* Users Table */}
      <DataTable columns={userColumns} data={filteredUsers} />
    </AdminLayout>
  );
};

export default UsersPage;
