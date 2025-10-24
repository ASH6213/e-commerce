import { useEffect, useState, useCallback } from "react";
import { GetStaticProps } from "next";
import Image from "next/image";

import Header from "../components/Header/Header";
import Footer from "../components/Footer/Footer";
import Button from "../components/Buttons/Button";
import { useAuth } from "../context/AuthContext";
import { UserOrderService } from "../services/user/OrderService";
import { api } from "../lib/api";
import { getCookie } from "cookies-next";
import { resolveImageUrl } from "../lib/images";
import { useRealtimeOrders, Order as RealtimeOrder } from "../lib/hooks/useRealtimeOrders";

type OrderItem = {
  product_id: number;
  product_name: string;
  quantity: number;
  price: number;
  total: number;
  images?: string[];
};

type OrderRow = {
  id: number;
  orderNumber: string;
  status: string;
  total: number;
  createdAt: string;
  items: OrderItem[];
};

const MyOrdersPage = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [selectedOrder, setSelectedOrder] = useState<OrderRow | null>(null);

  useEffect(() => {
    const loadOrders = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const list = await UserOrderService.listMine(user.id);
        
        // Prefer images provided by the API; fallback to fetching product only when missing
        const ordersWithImages = await Promise.all(
          list.map(async (order: OrderRow) => {
            const itemsWithImages = await Promise.all(
              order.items.map(async (item) => {
                const hasImages = Array.isArray((item as any).images) && ((item as any).images as any[]).length > 0;
                if (hasImages) return item as any;
                try {
                  const branchId = (getCookie('branch_id') as string) || undefined;
                  const res = await api.get(`/api/v1/products/${item.product_id}` , {
                    params: branchId ? { branch_id: branchId } : undefined,
                  });
                  const product = res.data;
                  const images = Array.isArray(product.images) ? product.images : [];
                  return { ...item, images } as any;
                } catch (err) {
                  console.error(`Failed to fetch product ${item.product_id}:`, err);
                  return { ...item, images: [] } as any;
                }
              })
            );
            return { ...order, items: itemsWithImages } as OrderRow;
          })
        );
        
        setOrders(ordersWithImages as OrderRow[]);
      } catch (e: any) {
        setError("Failed to load orders");
      } finally {
        setLoading(false);
      }
    };
    loadOrders();
  }, [user?.id]);

  // Real-time order status updates
  const handleOrderStatusUpdated = useCallback((order: RealtimeOrder) => {
    console.log('Order status updated in real-time:', order);
    
    // Update the order in the list if it belongs to current user
    if (user?.id && order.user_id === user.id) {
      setOrders(prev => prev.map(o => 
        o.id === order.id 
          ? { ...o, status: order.status }
          : o
      ));
      
      // Also update selectedOrder if it's the one being viewed
      if (selectedOrder?.id === order.id) {
        setSelectedOrder(prev => prev ? { ...prev, status: order.status } : null);
      }
      
      // Show notification to user
      console.log(`Your order #${order.order_number} status updated to: ${order.status}`);
      
      // You could add a toast notification here
      // toast.success(`Order #${order.order_number} is now ${order.status}`);
    }
  }, [user?.id, selectedOrder?.id]);

  useRealtimeOrders({
    enabled: !!user?.id,
    onOrderStatusUpdated: handleOrderStatusUpdated,
  });

  const handleViewOrder = (orderId: number) => {
    const order = orders.find(o => o.id === orderId);
    if (order) {
      setSelectedOrder(order);
    }
  };

  const handleCloseDetails = () => {
    setSelectedOrder(null);
  };

  if (!user) {
    return (
      <>
        <Header title={`My Orders`} />
        <main
          id="main-content"
          className="app-max-width app-x-padding my-16 flex flex-col items-center justify-center min-h-screen-50"
        >
          <h1 className="text-3xl mb-6 text-center">My Orders</h1>
          <p className="text-gray400 text-center">
            Please login to view your orders.
          </p>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header title={`My Orders - ${user.fullname}`} />
      <main
        id="main-content"
        className="app-max-width app-x-padding my-16 min-h-screen-50"
      >
        <div className="mb-8">
          <h1 className="text-3xl mb-2">My Orders</h1>
          <p className="text-gray400">View your past orders and order details</p>
        </div>

        {loading && (
          <div className="text-center py-10">
            <p className="text-gray400">Loading your orders...</p>
          </div>
        )}

        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded p-4 mb-6">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {!loading && !error && orders.length === 0 && (
          <div className="bg-gray100 border border-gray200 rounded p-8 text-center">
            <p className="text-gray400 text-lg">
              You haven&apos;t placed any orders yet.
            </p>
          </div>
        )}

        {!loading && !error && orders.length > 0 && (
          <div className="bg-white border border-gray200 rounded-lg overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray200">
                <thead className="bg-gray100">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray500">
                      Order #
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray500">
                      Date
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray500">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray500">
                      Items
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray500">
                      Total
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray500">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray200">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray50">
                      <td className="px-6 py-4 text-sm font-medium text-gray500">
                        {order.orderNumber}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray400">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className="capitalize inline-block px-3 py-1 rounded-full text-xs font-medium bg-gray100 text-gray500">
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray400">
                        {order.items?.length || 0}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray500">
                        ${order.total.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <Button
                          value="View Details"
                          onClick={() => handleViewOrder(order.id)}
                          size="sm"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Order Details Modal */}
        {selectedOrder && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray200 px-6 py-4 flex justify-between items-center">
                <h2 className="text-2xl font-semibold text-gray500">
                  Order Details - {selectedOrder.orderNumber}
                </h2>
                <button
                  onClick={handleCloseDetails}
                  className="text-gray400 hover:text-gray500 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="px-6 py-6">
                {/* Order Info */}
                <div className="mb-6 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray400">Order Date</p>
                    <p className="font-medium">
                      {new Date(selectedOrder.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray400">Status</p>
                    <span className="capitalize inline-block px-3 py-1 rounded-full text-xs font-medium bg-gray100 text-gray500">
                      {selectedOrder.status}
                    </span>
                  </div>
                </div>

                {/* Order Items */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-4">Order Items</h3>
                  <div className="space-y-4">
                    {selectedOrder.items.map((item, index) => {
                      const images = item.images || [];
                      const imageUrl = resolveImageUrl(images[0]);
                      return (
                        <div
                          key={index}
                          className="border border-gray200 rounded-lg p-4 flex items-center gap-4 hover:bg-gray50"
                        >
                          {/* Product Image */}
                          <div className="flex-shrink-0">
                            {imageUrl ? (
                              <Image
                                src={imageUrl}
                                alt={item.product_name}
                                width={80}
                                height={80}
                                className="rounded object-cover"
                                unoptimized
                                onError={(e) => {
                                  const t = e.target as HTMLImageElement;
                                  t.src = "/og.png";
                                }}
                              />
                            ) : (
                              <div className="w-20 h-20 bg-gray200 rounded flex items-center justify-center">
                                <span className="text-gray400 text-xs">No Image</span>
                              </div>
                            )}
                          </div>

                          {/* Product Details */}
                          <div className="flex-grow">
                            <h4 className="font-medium text-gray500 mb-1">
                              {item.product_name}
                            </h4>
                            <div className="flex items-center gap-4 text-sm text-gray400">
                              <span>Price: ${item.price.toFixed(2)}</span>
                              <span>×</span>
                              <span>Qty: {item.quantity}</span>
                            </div>
                          </div>

                          {/* Total */}
                          <div className="flex-shrink-0 text-right">
                            <p className="text-lg font-semibold text-gray500">
                              ${item.total.toFixed(2)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Order Total */}
                <div className="border-t border-gray200 pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray500">
                      Order Total
                    </span>
                    <span className="text-2xl font-bold text-gray500">
                      ${selectedOrder.total.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Close Button */}
                <div className="mt-6 flex justify-end">
                  <Button
                    value="Close"
                    onClick={handleCloseDetails}
                    size="lg"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
};

export const getStaticProps: GetStaticProps = async ({ locale }) => {
  return {
    props: {
      messages: (await import(`../messages/common/${locale}.json`)).default,
    },
  };
};

export default MyOrdersPage;
