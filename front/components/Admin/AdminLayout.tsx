import { ReactNode, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useAdminAuth } from "../../context/AdminAuthContext";

type Props = {
  children: ReactNode;
  title?: string;
};

const AdminLayout: React.FC<Props> = ({ children, title = "Admin Panel" }) => {
  const router = useRouter();
  const { admin, logout } = useAdminAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => {
    if (logout) {
      logout();
      router.push("/admin/login");
    }
  };

  const menuItems = [
    { name: "Dashboard", path: "/admin", icon: "📊" },
    { name: "Products", path: "/admin/products", icon: "📦" },
    { name: "Orders", path: "/admin/orders", icon: "🛒" },
    { name: "Users", path: "/admin/users", icon: "👥" },
    { name: "Categories", path: "/admin/categories", icon: "📁" },
    { name: "Branches", path: "/admin/branches", icon: "🏬" },
    { name: "Settings", path: "/admin/settings", icon: "⚙️" },
  ];

  return (
    <div className="min-h-screen bg-gray100">
      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full bg-gray500 text-white transition-all duration-300 z-40 ${
          sidebarOpen ? "w-64" : "w-20"
        }`}
      >
        {/* Logo */}
        <div className="h-20 flex items-center justify-center border-b border-gray400">
          <Link href="/admin">
            <a className="text-2xl font-bold">
              {sidebarOpen ? "Admin Panel" : "AP"}
            </a>
          </Link>
        </div>

        {/* Menu Items */}
        <nav className="mt-8">
          {menuItems.map((item) => (
            <Link key={item.path} href={item.path}>
              <a
                className={`flex items-center px-6 py-4 hover:bg-gray400 transition-colors ${
                  router.pathname === item.path ? "bg-gray400 border-l-4 border-blue" : ""
                }`}
              >
                <span className="text-2xl">{item.icon}</span>
                {sidebarOpen && <span className="ml-4">{item.name}</span>}
              </a>
            </Link>
          ))}
        </nav>

        {/* Toggle Button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-gray400 hover:bg-gray300 text-white px-4 py-2 rounded-md transition-colors"
        >
          {sidebarOpen ? "◀" : "▶"}
        </button>
      </aside>

      {/* Main Content */}
      <div
        className={`transition-all duration-300 ${
          sidebarOpen ? "ml-64" : "ml-20"
        }`}
      >
        {/* Top Bar */}
        <header className="h-20 bg-white shadow-md flex items-center justify-between px-8">
          <h1 className="text-2xl font-semibold text-gray500">{title}</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray400">
              Welcome, <span className="font-semibold text-gray500">{admin?.name || "Admin"}</span>
            </span>
            <button
              onClick={handleLogout}
              className="bg-red hover:bg-opacity-90 text-white px-4 py-2 rounded-md transition-colors"
            >
              Logout
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-8">{children}</main>
      </div>
    </div>
  );
};

export default AdminLayout;
