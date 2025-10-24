import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/router";
import AdminLayout from "../../../../components/Admin/AdminLayout";
import Button from "../../../../components/Admin/Button";
import { useAdminAuth } from "../../../../context/AdminAuthContext";
import { api } from "../../../../lib/api";

type Branch = {
  id: number;
  name: string;
  address?: string | null;
  is_active: boolean;
};

type StockRow = { branch_id: number; quantity: number };

export default function ProductStockPage() {
  const router = useRouter();
  const { id } = router.query; // product id
  const { admin } = useAdminAuth();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [stocks, setStocks] = useState<Record<number, number>>({});
  const [prices, setPrices] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!admin) {
      router.push("/admin/login");
      return;
    }
  }, [admin, router]);

  const loadBranches = async () => {
    try {
      const { data } = await api.get('/api/v1/branches');
      setBranches(data);
      // initialize with zeros
      const initQty: Record<number, number> = {};
      const initPrice: Record<number, string> = {};
      (data as Branch[]).forEach((b) => { initQty[b.id] = 0; initPrice[b.id] = ""; });
      setStocks(initQty);
      setPrices(initPrice);
    } catch (e) {
      console.error('Error loading branches:', e);
    }
  };

  const loadCurrentStocks = async () => {
    if (!admin || !id) return;
    try {
      const response = await api.get(`/api/v1/admin/products/${id}/stocks`);
      
      const currentStocks: Record<number, number> = {};
      const currentPrices: Record<number, string> = {};
      
      if (response.data && Array.isArray(response.data)) {
        response.data.forEach((stock: any) => {
          currentStocks[stock.branch_id] = stock.quantity || 0;
          if (stock.price_override) {
            currentPrices[stock.branch_id] = String(stock.price_override);
          }
        });
        
        setStocks(prev => ({ ...prev, ...currentStocks }));
        setPrices(prev => ({ ...prev, ...currentPrices }));
        
        console.log('Loaded current stocks:', currentStocks);
      }
    } catch (e) {
      console.error('Error loading current stocks:', e);
    }
  };

  useEffect(() => {
    loadBranches();
  }, []);

  useEffect(() => {
    if (branches.length > 0 && admin && id) {
      loadCurrentStocks();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branches.length, admin, id]);

  const handleQtyChange = (branchId: number, value: string) => {
    const qty = Math.max(0, Number(value || 0));
    setStocks((prev) => ({ ...prev, [branchId]: qty }));
  };

  const handlePriceChange = (branchId: number, value: string) => {
    // allow empty or numeric input
    const cleaned = value.replace(/[^0-9.]/g, "");
    setPrices((prev) => ({ ...prev, [branchId]: cleaned }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!admin || !id) return;
    setLoading(true);
    try {
      const payload: { stocks: (StockRow & { price_override?: number })[] } = {
        stocks: Object.entries(stocks).map(([branchId, quantity]) => {
          const priceStr = prices[Number(branchId)] ?? "";
          const row: any = {
            branch_id: Number(branchId),
            quantity: Number(quantity),
          };
          if (priceStr !== "" && priceStr !== "0") {
            row.price_override = parseFloat(priceStr);
          }
          return row;
        }),
      };

      console.log('Sending stock update:', payload);

      const response = await api.post(
        `/api/v1/admin/products/${id}/stock`,
        payload
      );

      console.log('Stock update response:', response.data);

      if (response.data.success) {
        alert('Stock updated successfully!');
        router.push(`/admin/products`);
      } else {
        alert('Failed to update stock: ' + (response.data.message || 'Unknown error'));
        setLoading(false);
      }
    } catch (e: any) {
      console.error('Stock update error:', e);
      const errorMsg = e.response?.data?.message || e.message || 'Failed to update stock';
      alert('Error: ' + errorMsg);
      setLoading(false);
    }
  };

  return (
    <AdminLayout title={`Set Stock for Product #${id}`}>
      <div className="max-w-3xl">
        <button
          onClick={() => router.back()}
          className="text-blue hover:underline mb-4 flex items-center"
        >
          ← Back
        </button>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Per-Branch Stock</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-3">
              {branches.length === 0 && (
                <p className="text-sm text-gray400">No branches found.</p>
              )}
              {branches.map((b) => (
                <div key={b.id} className="flex items-center gap-4">
                  <div className="w-56">
                    <div className="font-medium">{b.name}</div>
                    <div className="text-xs text-gray400">{b.address || "-"}</div>
                  </div>
                  <input
                    type="number"
                    min={0}
                    value={stocks[b.id] ?? 0}
                    onChange={(e) => handleQtyChange(b.id, e.target.value)}
                    className="w-32 px-3 py-2 border rounded"
                    placeholder="Qty"
                  />
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    value={prices[b.id] ?? ""}
                    onChange={(e) => handlePriceChange(b.id, e.target.value)}
                    className="w-36 px-3 py-2 border rounded"
                    placeholder="Branch Price (opt)"
                  />
                </div>
              ))}
            </div>

            <div className="pt-4">
              <Button type="submit" variant="primary" disabled={loading}>
                {loading ? "Saving..." : "Save Stock"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
}
