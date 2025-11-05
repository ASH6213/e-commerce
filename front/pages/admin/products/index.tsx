import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/router";
import AdminLayout from "../../../components/Admin/AdminLayout";
import DataTable from "../../../components/Admin/DataTable";
import Button from "../../../components/Admin/Button";
import { useAdminAuth } from "../../../context/AdminAuthContext";
import { api, getApiBase } from "../../../lib/api";
import { getCookie } from "cookies-next";
import { resolveImageUrl } from "../../../lib/images";
import { useRealtimeProducts } from "../../../lib/hooks/useRealtimeProducts";

type Product = {
  id: number;
  image?: string | null;
  name: string;
  category?: string;
  price: number;
  stock: number;
  status: string;
};

type Branch = { id: number; name: string };

const ProductsPage = () => {
  const router = useRouter();
  const { admin } = useAdminAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchId, setBranchId] = useState<string>("");
  const [categoriesMap, setCategoriesMap] = useState<Record<number, string>>({});

  // Real-time updates - memoized callbacks
  const handleProductCreated = useCallback((product: any) => {
    console.log('New product created:', product.name);
    const rawCreatedCatId: any = product.category_id ?? product.category?.id;
    const catId: number | undefined = rawCreatedCatId != null && !isNaN(Number(rawCreatedCatId)) ? Number(rawCreatedCatId) : undefined;
    const catName = product?.category?.name || product?.category_name || (catId != null ? categoriesMap[catId] : undefined);
    const mapped: Product = {
      id: product.id,
      image: Array.isArray(product.images) && product.images.length ? product.images[0] : null,
      name: product.name,
      category: catName,
      price: Number(product.sale_price ?? product.price ?? 0),
      stock: Number(product.stock ?? 0),
      status: product.is_active ? "Active" : "Inactive",
    };
    setProducts(prev => [mapped, ...prev]);
  }, [categoriesMap]);

  const handleProductUpdated = useCallback((product: any) => {
    console.log('Product updated:', product.name);
    const rawUpdatedCatId: any = product.category_id ?? product.category?.id;
    const catId: number | undefined = rawUpdatedCatId != null && !isNaN(Number(rawUpdatedCatId)) ? Number(rawUpdatedCatId) : undefined;
    const catName = product?.category?.name || product?.category_name || (catId != null ? categoriesMap[catId] : undefined);
    const mapped: Product = {
      id: product.id,
      image: Array.isArray(product.images) && product.images.length ? product.images[0] : null,
      name: product.name,
      category: catName,
      price: Number(product.sale_price ?? product.price ?? 0),
      stock: Number(product.stock ?? 0),
      status: product.is_active ? "Active" : "Inactive",
    };
    setProducts(prev => prev.map(p => p.id === product.id ? mapped : p));
  }, [categoriesMap]);

  const handleProductDeleted = useCallback((productId: number) => {
    console.log('Product deleted:', productId);
    setProducts(prev => prev.filter(p => p.id !== productId));
  }, []);

  const handleProductStockUpdated = useCallback((product: any) => {
    console.log('Product stock updated:', product.name);
    const rawStockCatId: any = product.category_id ?? product.category?.id;
    const catId: number | undefined = rawStockCatId != null && !isNaN(Number(rawStockCatId)) ? Number(rawStockCatId) : undefined;
    const catName = product?.category?.name || product?.category_name || (catId != null ? categoriesMap[catId] : undefined);
    const mapped: Product = {
      id: product.id,
      image: Array.isArray(product.images) && product.images.length ? product.images[0] : null,
      name: product.name,
      category: catName,
      price: Number(product.sale_price ?? product.price ?? 0),
      stock: Number(product.stock ?? 0),
      status: product.is_active ? "Active" : "Inactive",
    };
    setProducts(prev => prev.map(p => p.id === product.id ? mapped : p));
  }, [categoriesMap]);

  const { isSubscribed } = useRealtimeProducts({
    enabled: true,
    onProductCreated: handleProductCreated,
    onProductUpdated: handleProductUpdated,
    onProductDeleted: handleProductDeleted,
    onProductStockUpdated: handleProductStockUpdated,
  });

  // Load branches for optional filtering
  useEffect(() => {
    const hasAdminCookie = !!getCookie("admin");
    if (!admin && !hasAdminCookie) {
      router.push("/admin/login");
      return;
    }
  }, [admin, router]);

  // Load branches for optional filtering
  useEffect(() => {
    const loadBranches = async () => {
      try {
        const { data } = await api.get(`/api/v1/branches`);
        setBranches(data);
      } catch (e) {
        console.error(e);
      }
    };
    loadBranches();
  }, []);

  // Load categories map once for reliable category display
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const { data } = await api.get(`/api/v1/categories`);
        const list: any[] = Array.isArray(data) ? data : data?.data || [];
        const map: Record<number, string> = {};
        list.forEach((c: any) => {
          if (c && typeof c.id === 'number') map[c.id] = c.name;
        });
        setCategoriesMap(map);
      } catch (e) {
        console.error("Failed to load categories:", e);
      }
    };
    loadCategories();
  }, []);

  // Load products dynamically (optionally by branch for price override)
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`/api/v1/admin/products`, {
          params: branchId ? { branch_id: branchId } : undefined,
        });
        const list: any[] = Array.isArray(data) ? data : data?.data || [];
        const mapped: Product[] = list.map((p: any) => {
          const rawCatId: any = p.category_id ?? p.category?.id;
          const catId: number | undefined = rawCatId != null && !isNaN(Number(rawCatId)) ? Number(rawCatId) : undefined;
          const catName = p?.category?.name || p?.category_name || (catId != null ? categoriesMap[catId] : undefined);
          return {
            id: p.id,
            image: Array.isArray(p.images) && p.images.length ? p.images[0] : null,
            name: p.name,
            category: catName,
            price: Number((p as any).effective_price ?? p.price ?? 0),
            stock: Number(p.stock ?? 0),
            status: p.is_active ? "Active" : "Inactive",
          } as Product;
        });
        setProducts(mapped);
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [branchId, categoriesMap]);

  // Refresh list when tab regains focus or after in-app navigation
  useEffect(() => {
    const refetch = async () => {
      try {
        const { data } = await api.get(`/api/v1/admin/products`, {
          params: branchId ? { branch_id: branchId } : undefined,
        });
        const list: any[] = Array.isArray(data) ? data : data?.data || [];
        const mapped: Product[] = list.map((p: any) => {
          const rawCatId: any = p.category_id ?? p.category?.id;
          const catId: number | undefined = rawCatId != null && !isNaN(Number(rawCatId)) ? Number(rawCatId) : undefined;
          const catName = p?.category?.name || p?.category_name || (catId != null ? categoriesMap[catId] : undefined);
          return {
            id: p.id,
            image: Array.isArray(p.images) && p.images.length ? p.images[0] : null,
            name: p.name,
            category: catName,
            price: Number((p as any).effective_price ?? p.price ?? 0),
            stock: Number(p.stock ?? 0),
            status: p.is_active ? "Active" : "Inactive",
          } as Product;
        });
        setProducts(mapped);
      } catch (_) {}
    };
    const onFocus = () => { refetch(); };
    window.addEventListener('focus', onFocus);
    // Polling fallback every 8s (in case realtime isn't configured)
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') refetch();
    }, 8000);
    return () => {
      window.removeEventListener('focus', onFocus);
      clearInterval(id);
    };
  }, [branchId, categoriesMap]);

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/api/v1/admin/products/${id}`);
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (e) {
      console.error(e);
      alert("Failed to delete product");
    }
  };

  const productColumns = [
    {
      header: "Image",
      accessor: (row: Product) => {
        if (!row.image) return <span className="text-gray400 text-xs">—</span>;
        const raw = row.image;
        const isAbsolute = /^https?:\/\//i.test(raw);
        let src: string;
        if (isAbsolute) {
          const m = raw.match(/\/storage\/.*$/);
          src = m ? `${getApiBase()}${m[0]}` : raw; // normalize absolute storage URL to current backend base
        } else {
          src = `${getApiBase()}${raw.startsWith('/') ? '' : '/'}${raw}`;
        }
        return (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={row.name} className="h-10 w-10 object-cover rounded border bg-gray100" />
        );
      },
      width: "70px",
    },
    { header: "ID", accessor: "id" as keyof Product, width: "80px" },
    { header: "Product Name", accessor: "name" as keyof Product },
    { header: "Category", accessor: "category" as keyof Product },
    {
      header: "Price",
      accessor: (row: Product) => `$${row.price.toFixed(2)}`,
    },
    { header: "Stock", accessor: "stock" as keyof Product },
    {
      header: "Status",
      accessor: (row: Product) => (
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium ${
            row.status === "Active"
              ? "bg-green bg-opacity-20 text-green"
              : "bg-red bg-opacity-20 text-red"
          }`}
        >
          {row.status}
        </span>
      ),
    },
    {
      header: "Actions",
      accessor: (row: Product) => (
        <div className="flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/admin/products/${row.id}`);
            }}
            className="text-blue hover:underline text-sm"
          >
            Edit
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (confirm("Are you sure you want to delete this product?")) {
                handleDelete(row.id);
              }
            }}
            className="text-red hover:underline text-sm"
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  // Fixed columns config with robust image URL resolution
  const productColumnsFixed = [
    {
      header: "Image",
      accessor: (row: Product) => {
        if (!row.image) return <span className="text-gray400 text-xs">-</span>;
        const src = resolveImageUrl(row.image);
        // eslint-disable-next-line @next/next/no-img-element
        return <img src={src} alt={row.name} className="h-10 w-10 object-cover rounded border bg-gray100" />;
      },
      width: "70px",
    },
    { header: "ID", accessor: "id" as keyof Product, width: "80px" },
    { header: "Product Name", accessor: "name" as keyof Product },
    { header: "Category", accessor: "category" as keyof Product },
    {
      header: "Price",
      accessor: (row: Product) => `$${row.price.toFixed(2)}`,
    },
    { header: "Stock", accessor: "stock" as keyof Product },
    {
      header: "Status",
      accessor: (row: Product) => (
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium ${
            row.status === "Active"
              ? "bg-green bg-opacity-20 text-green"
              : "bg-red bg-opacity-20 text-red"
          }`}
        >
          {row.status}
        </span>
      ),
    },
    {
      header: "Actions",
      accessor: (row: Product) => (
        <div className="flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/admin/products/${row.id}`);
            }}
            className="text-blue hover:underline text-sm"
          >
            Edit
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (confirm("Are you sure you want to delete this product?")) {
                handleDelete(row.id);
              }
            }}
            className="text-red hover:underline text-sm"
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <AdminLayout title="Products">
        <div className="flex items-center justify-center h-64">
          <p className="text-gray400 text-lg">Loading...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Products">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div className="mb-4 md:mb-0">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-semibold text-gray500">All Products</h2>
            {isSubscribed && (
              <span className="text-xs px-2 py-1 bg-green bg-opacity-20 text-green rounded-full">
                Live
              </span>
            )}
          </div>
          <p className="text-gray400 text-sm mt-1">
            Manage your product inventory {isSubscribed && '(Real-time updates active)'}
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => router.push("/admin/products/new")}
        >
          + Add New Product
        </Button>
      </div>

      {/* Search */}
      <div className="mb-6 flex flex-col md:flex-row gap-4 md:items-center">
        <input
          type="text"
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full md:w-96 px-4 py-2 border border-gray300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue focus:border-transparent"
        />
        <select
          className="w-full md:w-64 px-3 py-2 border border-gray300 rounded-md"
          value={branchId}
          onChange={(e) => setBranchId(e.target.value)}
        >
          <option value="">All branches (base price)</option>
          {branches.map((b) => (
            <option key={b.id} value={b.id.toString()}>
              {b.name} (branch price)
            </option>
          ))}
        </select>
      </div>

      {/* Products Table */}
      <DataTable
        columns={productColumnsFixed}
        data={filteredProducts}
        onRowClick={(product) => router.push(`/admin/products/${product.id}`)}
      />
    </AdminLayout>
  );
};

export default ProductsPage;



