import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import AdminLayout from "../../../components/Admin/AdminLayout";
import DataTable from "../../../components/Admin/DataTable";
import Button from "../../../components/Admin/Button";
import { useAdminAuth } from "../../../context/AdminAuthContext";
import { api } from "../../../lib/api";

type Category = {
  id: number;
  name: string;
  slug: string;
  products: number;
  status: string;
};

const CategoriesPage = () => {
  const router = useRouter();
  const { admin } = useAdminAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: "", slug: "" });

  useEffect(() => {
    if (!admin) {
      router.push("/admin/login");
      return;
    }

    const fetchCategories = async () => {
      try {
        const res = await api.get(`/api/v1/admin/categories`);
        const list = Array.isArray(res.data) ? res.data : [];
        const mapped = list.map((c: any) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          products: Number(c.products_count ?? c.products ?? 0),
          status: c.is_active ? "Active" : "Inactive",
        }));
        setCategories(mapped);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching categories:", error);
        setLoading(false);
      }
    };

    fetchCategories();
  }, [admin, router]);

  const handleAddCategory = async () => {
    if (!newCategory.name || !newCategory.slug) return;
    try {
      await api.post(`/api/v1/admin/categories`, {
        name: newCategory.name,
        slug: newCategory.slug,
        is_active: true,
      });
      // Refresh list
      const res = await api.get(`/api/v1/admin/categories`);
      const list = Array.isArray(res.data) ? res.data : [];
      const mapped = list.map((c: any) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        products: Number(c.products_count ?? c.products ?? 0),
        status: c.is_active ? "Active" : "Inactive",
      }));
      setCategories(mapped);
      setNewCategory({ name: "", slug: "" });
      setShowAddModal(false);
    } catch (e) {
      console.error("Create category failed", e);
    }
  };

  const categoryColumns = [
    { header: "ID", accessor: "id" as keyof Category, width: "80px" },
    { header: "Name", accessor: "name" as keyof Category },
    { header: "Slug", accessor: "slug" as keyof Category },
    { header: "Products", accessor: "products" as keyof Category },
    {
      header: "Status",
      accessor: (row: Category) => (
        <span className="px-3 py-1 rounded-full text-xs font-medium bg-green bg-opacity-20 text-green">
          {row.status}
        </span>
      ),
    },
    {
      header: "Actions",
      accessor: (row: Category) => (
        <div className="flex gap-2">
          <button className="text-blue hover:underline text-sm">Edit</button>
          <button className="text-red hover:underline text-sm">Delete</button>
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <AdminLayout title="Categories">
        <div className="flex items-center justify-center h-64">
          <p className="text-gray400 text-lg">Loading...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Categories">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-gray500">Categories</h2>
          <p className="text-gray400 text-sm mt-1">Manage product categories</p>
        </div>
        <Button variant="primary" onClick={() => setShowAddModal(true)}>
          + Add Category
        </Button>
      </div>

      <DataTable columns={categoryColumns} data={categories} />

      {/* Add Category Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray500 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold text-gray500 mb-4">Add New Category</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray500 mb-2">
                Category Name
              </label>
              <input
                type="text"
                value={newCategory.name}
                onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue"
                placeholder="e.g., Electronics"
              />
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray500 mb-2">
                Slug
              </label>
              <input
                type="text"
                value={newCategory.slug}
                onChange={(e) => setNewCategory({ ...newCategory, slug: e.target.value })}
                className="w-full px-4 py-2 border border-gray300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue"
                placeholder="e.g., electronics"
              />
            </div>
            <div className="flex gap-4">
              <Button variant="primary" onClick={handleAddCategory}>
                Add Category
              </Button>
              <Button variant="secondary" onClick={() => setShowAddModal(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default CategoriesPage;
