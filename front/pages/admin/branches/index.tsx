import { useEffect, useState, FormEvent } from "react";
import axios from "axios";
import { useRouter } from "next/router";
import AdminLayout from "../../../components/Admin/AdminLayout";
import Button from "../../../components/Admin/Button";
import { useAdminAuth } from "../../../context/AdminAuthContext";

type Branch = {
  id: number;
  name: string;
  address?: string | null;
  is_active: boolean;
};

export default function AdminBranchesPage() {
  const router = useRouter();
  const { admin } = useAdminAuth();
  const [loading, setLoading] = useState(false);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [form, setForm] = useState({ name: "", address: "", is_active: true });

  useEffect(() => {
    if (!admin) {
      router.push("/admin/login");
      return;
    }
  }, [admin, router]);

  const loadBranches = async () => {
    try {
      const { data } = await axios.get(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/branches`
      );
      setBranches(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadBranches();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type, checked } = e.target as HTMLInputElement;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!admin) return;
    setLoading(true);
    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/admin/branches`,
        {
          name: form.name,
          address: form.address || undefined,
          is_active: form.is_active,
        },
        {
          headers: admin?.token
            ? { Authorization: `Bearer ${admin.token}` }
            : undefined,
        }
      );
      setForm({ name: "", address: "", is_active: true });
      await loadBranches();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout title="Branches">
      <div className="max-w-4xl">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-gray500">Branches</h2>
          <p className="text-gray400 text-sm mt-1">
            Create and manage store branches
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Create Branch */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Create Branch</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm mb-1" htmlFor="name">
                  Name *
                </label>
                <input
                  id="name"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border rounded"
                  placeholder="e.g. Main Branch"
                />
              </div>
              <div>
                <label className="block text-sm mb-1" htmlFor="address">
                  Address
                </label>
                <input
                  id="address"
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded"
                  placeholder="Optional address"
                />
              </div>
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={form.is_active}
                  onChange={handleChange}
                />
                <span>Active</span>
              </label>
              <div>
                <Button type="submit" variant="primary" disabled={loading}>
                  {loading ? "Saving..." : "Save Branch"}
                </Button>
              </div>
            </form>
          </div>

          {/* Branches list */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Existing Branches</h3>
            <div className="space-y-3 max-h-[420px] overflow-auto pr-2">
              {branches.length === 0 && (
                <p className="text-sm text-gray400">No branches yet.</p>
              )}
              {branches.map((b) => (
                <div key={b.id} className="border rounded p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{b.name}</div>
                      <div className="text-xs text-gray400">{b.address || "-"}</div>
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        b.is_active ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-600"
                      }`}
                    >
                      {b.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
