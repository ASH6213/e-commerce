import { useEffect, useState, FormEvent } from "react";
import axios from "axios";
import { api } from "../../../lib/api";
import { useRouter } from "next/router";
import AdminLayout from "../../../components/Admin/AdminLayout";
import Button from "../../../components/Admin/Button";
import { useAdminAuth } from "../../../context/AdminAuthContext";
import { getCookie } from "cookies-next";

const NewProductPage = () => {
  const router = useRouter();
  const { admin } = useAdminAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category_id: "",
    price: "",
    sale_price: "",
    sku: "",
    is_active: true,
    is_featured: false,
  });
  const [files, setFiles] = useState<FileList | null>(null);
  const [previews, setPreviews] = useState<string[]>([]);
  const [branches, setBranches] = useState<Array<{ id: number; name: string; address?: string | null }>>([]);
  const [branchStocks, setBranchStocks] = useState<Record<number, number>>({});
  const [branchPrices, setBranchPrices] = useState<Record<number, string>>({});
  const [branchPriceTouched, setBranchPriceTouched] = useState<Record<number, boolean>>({});
  const [categories, setCategories] = useState<Array<{ id: number; name: string }>>([]);

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted) return;
    const hasAdminCookie = !!getCookie("admin");
    if (!admin && !hasAdminCookie) {
      router.replace("/admin/login");
    }
  }, [mounted, admin, router]);

  useEffect(() => {
    const loadBranches = async () => {
      try {
        const { data } = await axios.get(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/branches`
        );
        setBranches(data);
        const initQty: Record<number, number> = {};
        const initPrice: Record<number, string> = {};
        (data as Array<{ id: number }>).forEach((b) => { initQty[b.id] = 0; initPrice[b.id] = formData.price || ""; });
        setBranchStocks(initQty);
        setBranchPrices(initPrice);
        const initTouched: Record<number, boolean> = {};
        (data as Array<{ id: number }>).forEach((b) => { initTouched[b.id] = false; });
        setBranchPriceTouched(initTouched);
      } catch (e) {
        console.error(e);
      }
    };
    const loadCategories = async () => {
      try {
        const { data } = await axios.get(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/categories`
        );
        const list = Array.isArray(data) ? data : [];
        setCategories(list.map((c: any) => ({ id: c.id, name: c.name })));
      } catch (e) {
        console.error(e);
      }
    };
    loadBranches();
    loadCategories();
  }, []);

  // When base price changes, pre-fill any empty branch price with the base price
  useEffect(() => {
    if (!branches.length) return;
    setBranchPrices((prev) => {
      const next = { ...prev } as Record<number, string>;
      branches.forEach((b) => {
        if (!branchPriceTouched[b.id]) {
          next[b.id] = formData.price || "";
        }
      });
      return next;
    });
  }, [formData.price, branches, branchPriceTouched]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const fd = new FormData();
      fd.append("name", formData.name);
      if (formData.description) fd.append("description", formData.description);
      fd.append("category_id", formData.category_id);
      fd.append("price", formData.price);
      if (formData.sale_price) fd.append("sale_price", formData.sale_price);
      // stock will be computed on the backend from per-branch quantities
      if (formData.sku) fd.append("sku", formData.sku);
      fd.append("is_active", formData.is_active ? "1" : "0");
      fd.append("is_featured", formData.is_featured ? "1" : "0");

      if (files && files.length > 0) {
        Array.from(files).forEach((file) => fd.append("images[]", file));
      }

      // append per-branch stock rows (including qty=0)
      const stocksArray = Object.entries(branchStocks)
        .map(([branchId, qty]) => ({
          branch_id: Number(branchId),
          quantity: Number(qty),
          price_override: branchPrices[Number(branchId)]
            ? Number(branchPrices[Number(branchId)])
            : undefined,
        }));

      console.log('Sending stocks array:', stocksArray);
      stocksArray.forEach((row, i) => {
        fd.append(`stocks[${i}][branch_id]`, String(row.branch_id));
        fd.append(`stocks[${i}][quantity]`, String(row.quantity));
        if (row.price_override !== undefined && !Number.isNaN(row.price_override)) {
          fd.append(`stocks[${i}][price_override]`, String(row.price_override));
        }
      });

      await api.post(`/api/v1/admin/products`, fd);

      router.push("/admin/products");
    } catch (error: any) {
      console.error("Error creating product:", error);
      const resp = error?.response;
      const msg = resp?.data?.error?.message
        || resp?.data?.message
        || error?.message
        || 'Failed to create product';
      if (resp?.status === 422 && resp?.data?.errors) {
        // Flatten Laravel validation errors
        const details = Object.values(resp.data.errors as Record<string, string[]>)
          .flat()
          .join('\n');
        alert(`${msg}\n\n${details}`);
      } else {
        alert(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFiles(e.target.files);
    if (e.target.files && e.target.files.length > 0) {
      const urls = Array.from(e.target.files).map((f) => URL.createObjectURL(f));
      setPreviews(urls);
    } else {
      setPreviews([]);
    }
  };

  const handleBranchQty = (id: number, value: string) => {
    const qty = Math.max(0, Number(value || 0));
    setBranchStocks((prev) => ({ ...prev, [id]: qty }));
  };

  const handleBranchPrice = (id: number, value: string) => {
    const cleaned = value.replace(/[^0-9.]/g, "");
    setBranchPrices((prev) => ({ ...prev, [id]: cleaned }));
    setBranchPriceTouched((prev) => ({ ...prev, [id]: true }));
  };

  return (
    <AdminLayout title="Add New Product">
      <div className="max-w-3xl">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="text-blue hover:underline mb-4 flex items-center"
          >
            ← Back to Products
          </button>
          <h2 className="text-2xl font-semibold text-gray500">Add New Product</h2>
          <p className="text-gray400 text-sm mt-1">
            Fill in the details to create a new product
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray500 mb-2"
              >
                Product Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue focus:border-transparent"
                placeholder="Enter product name"
              />
            </div>

            <div className="mb-4">
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray500 mb-2"
              >
                Description *
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows={4}
                className="w-full px-4 py-2 border border-gray300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue focus:border-transparent"
                placeholder="Enter product description"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label
                  htmlFor="category_id"
                  className="block text-sm font-medium text-gray500 mb-2"
                >
                  Category *
                </label>
                <select
                  id="category_id"
                  name="category_id"
                  value={formData.category_id}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue focus:border-transparent"
                >
                  <option value="">Select category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={String(c.id)}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="price"
                  className="block text-sm font-medium text-gray500 mb-2"
                >
                  Price ($) *
                </label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  required
                  step="0.01"
                  min="0"
                  className="w-full px-4 py-2 border border-gray300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue focus:border-transparent"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label
                  htmlFor="sale_price"
                  className="block text-sm font-medium text-gray500 mb-2"
                >
                  Sale Price ($)
                </label>
                <input
                  type="number"
                  id="sale_price"
                  name="sale_price"
                  value={formData.sale_price}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  className="w-full px-4 py-2 border border-gray300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue focus:border-transparent"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="mb-4">
              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="sku" className="block text-sm font-medium text-gray500 mb-2">SKU</label>
                  <input
                    type="text"
                    id="sku"
                    name="sku"
                    value={formData.sku}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue focus:border-transparent"
                    placeholder="Optional SKU"
                  />
                </div>
                <div className="flex items-center gap-6 mt-6">
                  <label className="flex items-center gap-2 text-sm text-gray600">
                    <input type="checkbox" name="is_active" checked={formData.is_active} onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })} />
                    Active
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray600">
                    <input type="checkbox" name="is_featured" checked={formData.is_featured} onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })} />
                    Featured
                  </label>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <label
                htmlFor="images"
                className="block text-sm font-medium text-gray500 mb-2"
              >
                Product Images
              </label>
              <input
                type="file"
                id="images"
                name="images"
                accept="image/*"
                multiple
                onChange={handleFiles}
                className="w-full px-4 py-2 border border-gray300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue focus:border-transparent"
              />
              <p className="text-xs text-gray400 mt-1">You can upload multiple images.</p>
              {previews.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-3">
                  {previews.map((src, idx) => (
                    <div key={idx} className="border rounded p-2 flex items-center justify-center bg-gray100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt={`Preview ${idx + 1}`} className="max-h-36 object-contain" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Per-Branch Stock */}
            <div className="mb-6">
              <h4 className="text-md font-semibold text-gray500 mb-3">Per-Branch Stock</h4>
              {branches.length === 0 && (
                <p className="text-sm text-gray400">No branches found. Create branches first.</p>
              )}
              <div className="space-y-3">
                {branches.map((b) => (
                  <div key={b.id} className="flex items-center gap-4">
                    <div className="w-56">
                      <div className="font-medium">{b.name}</div>
                      <div className="text-xs text-gray400">{b.address || "-"}</div>
                    </div>
                    <input
                      type="number"
                      min={0}
                      value={branchStocks[b.id] ?? 0}
                      onChange={(e) => handleBranchQty(b.id, e.target.value)}
                      className="w-32 px-3 py-2 border rounded"
                    />
                    <input
                      type="number"
                      step="0.01"
                      min={0}
                      value={branchPrices[b.id] ?? ""}
                      onChange={(e) => handleBranchPrice(b.id, e.target.value)}
                      className="w-36 px-3 py-2 border rounded"
                      placeholder="Branch Price (opt)"
                    />
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray400 mt-2">Total stock will be calculated from the sum of branch quantities.</p>
            </div>

            <div className="flex gap-4">
              <Button type="submit" variant="primary" disabled={loading}>
                {loading ? "Creating..." : "Create Product"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
};

export default NewProductPage;
