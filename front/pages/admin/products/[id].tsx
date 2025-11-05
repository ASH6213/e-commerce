import { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/router";
import AdminLayout from "../../../components/Admin/AdminLayout";
import Button from "../../../components/Admin/Button";
import { useAdminAuth } from "../../../context/AdminAuthContext";
import { api } from "../../../lib/api";
// import { getApiBase } from "../../../lib/api";
import { getCookie } from "cookies-next";
import { resolveImageUrl } from "../../../lib/images";

const EditProductPage = () => {
  const router = useRouter();
  const { id } = router.query;
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
    images: [] as string[],
  });
  const [categories, setCategories] = useState<Array<{ id: number; name: string }>>([]);
  const [newFiles, setNewFiles] = useState<FileList | null>(null);
  const [newPreviews, setNewPreviews] = useState<string[]>([]);
  const [branches, setBranches] = useState<Array<{ id: number; name: string; address?: string | null }>>([]);
  const [branchStocks, setBranchStocks] = useState<Record<number, number>>({});
  const [branchPrices, setBranchPrices] = useState<Record<number, string>>({});
  const [branchPriceTouched, setBranchPriceTouched] = useState<Record<number, boolean>>({});

  // Load categories and branches first
  useEffect(() => {
    const hasAdminCookie = !!getCookie("admin");
    if (!admin && !hasAdminCookie) {
      router.push("/admin/login");
      return;
    }

    const loadStaticData = async () => {
      // Load categories
      try {
        const res = await api.get(`/api/v1/categories`);
        const list = Array.isArray(res.data) ? res.data : [];
        setCategories(list.map((c: any) => ({ id: c.id, name: c.name })));
      } catch (e) {
        console.error("Failed to load categories:", e);
      }

      // Load branches
      try {
        const res = await api.get(`/api/v1/branches`);
        const list = Array.isArray(res.data) ? res.data : [];
        setBranches(list.map((b: any) => ({ id: b.id, name: b.name, address: b.address })));
      } catch (e) {
        console.error("Failed to load branches:", e);
      }
    };
    
    loadStaticData();
  }, [admin, router]);

  // Load product data after categories are loaded
  useEffect(() => {
    if (!id || categories.length === 0) return;

    const loadProductData = async () => {
      try {
        const res = await api.get(`/api/v1/products/${id}`);
        const p = res.data;
        
        console.log("[Edit Product] Loaded product data:", p);
        console.log("[Edit Product] Category ID from API:", p.category_id);
        console.log("[Edit Product] Category object from API:", p.category);
        console.log("[Edit Product] Available categories:", categories);
        
        // Use category_id directly, fallback to category.id if not available
        const categoryIdStr = p.category_id 
          ? String(p.category_id) 
          : (p.category?.id ? String(p.category.id) : "");
        console.log("[Edit Product] Category ID as string:", categoryIdStr);
        
        setFormData({
          name: p.name ?? "",
          description: p.description ?? "",
          category_id: categoryIdStr,
          price: String(p.price ?? ""),
          sale_price: p.sale_price != null ? String(p.sale_price) : "",
          sku: p.sku ?? "",
          is_active: !!p.is_active,
          is_featured: !!p.is_featured,
          images: Array.isArray(p.images) ? p.images : [],
        });
        
        console.log("[Edit Product] FormData set with category_id:", categoryIdStr);

        // Prefill per-branch qty and price_override
        try {
          console.log(`[Edit Product] Fetching branch stocks for product ${id}`);
          const stocksRes = await api.get(`/api/v1/admin/products/${id}/stocks`);
          
          const rows: Array<{ branch_id: number; quantity: number; price_override: number | null }> = stocksRes.data?.data || [];
          
          const qtyMap: Record<number, number> = {};
          const priceMap: Record<number, string> = {};
          
          rows.forEach((r) => {
            const qty = Number(r.quantity || 0);
            qtyMap[r.branch_id] = qty;
            
            if (r.price_override !== null && r.price_override !== undefined) {
              priceMap[r.branch_id] = String(r.price_override);
            }
          });
          
          setBranchStocks(qtyMap);
          setBranchPrices(priceMap);
        } catch (se: any) {
          console.error("Failed to load branch stocks", se);
          console.error("Error details:", se.response?.data || se.message);
        }
      } catch (e) {
        console.error("Failed to load product:", e);
      }
    };

    loadProductData();
  }, [id, categories.length]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const fd = new FormData();
      if (formData.name) fd.append("name", formData.name);
      if (formData.description) fd.append("description", formData.description);
      if (formData.category_id) fd.append("category_id", formData.category_id);
      if (formData.price) fd.append("price", formData.price);
      if (formData.sale_price !== "") fd.append("sale_price", formData.sale_price);
      if (formData.sku) fd.append("sku", formData.sku);
      fd.append("is_active", formData.is_active ? "1" : "0");
      fd.append("is_featured", formData.is_featured ? "1" : "0");
      // stock will be computed on the backend from per-branch quantities
      // append per-branch stocks if provided (same shape as Add Product)
      // Send ALL branches (including qty=0) if they were touched
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
      if (newFiles && newFiles.length > 0) {
        Array.from(newFiles).forEach((f) => fd.append("images[]", f));
      }
      // Laravel handles file uploads with POST best; override method to PUT
      fd.append("_method", "PUT");
      const response = await api.post(`/api/v1/admin/products/${id}`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      console.log('Product updated successfully:', response.data);
      alert('Product updated successfully!');
      router.push("/admin/products");
    } catch (error: any) {
      console.error("Error updating product:", error);
      const errorMsg = error.response?.data?.message || error.message || 'Failed to update product';
      alert('Error: ' + errorMsg);
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

  const handleNewFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewFiles(e.target.files);
    if (e.target.files && e.target.files.length > 0) {
      const urls = Array.from(e.target.files).map((f) => URL.createObjectURL(f));
      setNewPreviews(urls);
    } else {
      setNewPreviews([]);
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

  if (!admin) {
    return null;
  }

  return (
    <AdminLayout title="Edit Product">
      <div className="max-w-3xl">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="text-blue hover:underline mb-4 flex items-center"
          >
            ← Back to Products
          </button>
          <h2 className="text-2xl font-semibold text-gray500">Edit Product</h2>
          <p className="text-gray400 text-sm mt-1">
            Update product details
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
              />
            </div>

            {/* Per-Branch Stock */}
            <div className="mb-6">
              <h4 className="text-md font-semibold text-gray500 mb-3">Per-Branch Stock</h4>
              {branches.length === 0 && (
                <p className="text-sm text-gray400">No branches found. Create branches first.</p>
              )}
              <div className="space-y-3">
                {branches.map((b) => {
                  const qty = branchStocks[b.id] ?? 0;
                  const price = branchPrices[b.id] ?? "";
                  console.log(`[Render] Branch ${b.id} (${b.name}) - qty: ${qty}, price: ${price}`);
                  return (
                    <div key={b.id} className="grid grid-cols-3 gap-3 items-center">
                      <div>
                        <div className="text-sm font-medium text-gray600">{b.name}</div>
                        <div className="text-xs text-gray400">{b.address || ""}</div>
                      </div>
                      <input
                        type="number"
                        min={0}
                        value={qty}
                        onChange={(e) => handleBranchQty(b.id, e.target.value)}
                        placeholder="0"
                        className="px-3 py-2 border border-gray300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue focus:border-transparent"
                      />
                      <input
                        key={`branch-price-${b.id}-${price}`}
                        type="text"
                        value={price}
                        onChange={(e) => handleBranchPrice(b.id, e.target.value)}
                        placeholder="Branch Price (optional)"
                        className="px-3 py-2 border border-gray300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue focus:border-transparent"
                      />
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-gray400 mt-2">Total stock will be calculated from the sum of branch quantities if provided.</p>
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
                  value={formData.category_id || ""}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue focus:border-transparent"
                >
                  <option value="">Select category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={String(c.id)}>
                      {c.name} {String(c.id) === formData.category_id ? '✓' : ''}
                    </option>
                  ))}
                </select>
                {formData.category_id && (
                  <p className="text-xs text-gray400 mt-1">
                    Selected ID: {formData.category_id}
                  </p>
                )}
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
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="sale_price" className="block text-sm font-medium text-gray500 mb-2">Sale Price ($)</label>
                <input
                  type="number"
                  id="sale_price"
                  name="sale_price"
                  value={formData.sale_price}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  className="w-full px-4 py-2 border border-gray300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue focus:border-transparent"
                />
              </div>
              <div>
                <label htmlFor="sku" className="block text-sm font-medium text-gray500 mb-2">SKU</label>
                <input
                  type="text"
                  id="sku"
                  name="sku"
                  value={formData.sku}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue focus:border-transparent"
                />
              </div>
            </div>

            <div className="mb-4">
              <div className="mt-3 flex items-center gap-6">
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

            <div className="mb-6">
              <label
                htmlFor="images"
                className="block text-sm font-medium text-gray500 mb-2"
              >
                Product Images
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {formData.images.map((raw, idx) => {
                  const src = resolveImageUrl(raw);
                  return (
                    <div key={idx} className="border rounded p-2 flex items-center justify-center bg-gray100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt={`Image ${idx + 1}`} className="max-h-36 object-contain" />
                    </div>
                  );
                })}
                {formData.images.length === 0 && (
                  <span className="text-sm text-gray400">No images uploaded for this product.</span>
                )}
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray500 mb-2">Add Images</label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleNewFiles}
                  className="w-full px-4 py-2 border border-gray300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue focus:border-transparent"
                />
                {newPreviews.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-3">
                    {newPreviews.map((src, idx) => (
                      <div key={idx} className="border rounded p-2 flex items-center justify-center bg-gray100">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={src} alt={`New ${idx + 1}`} className="max-h-36 object-contain" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-4">
              <Button type="submit" variant="primary" disabled={loading}>
                {loading ? "Updating..." : "Update Product"}
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

export default EditProductPage;
