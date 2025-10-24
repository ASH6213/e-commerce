import { useState, useEffect } from 'react';
import { useRealtimeOrders, Order } from '../lib/hooks/useRealtimeOrders';

/**
 * Example component showing how to use real-time order updates
 * Perfect for admin dashboard to monitor new orders in real-time
 */
export const RealtimeOrderList = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [newOrderCount, setNewOrderCount] = useState(0);

  // Subscribe to real-time order updates
  const { isSubscribed } = useRealtimeOrders({
    enabled: true, // Enable real-time updates
    
    onOrderCreated: (order) => {
      // Add new order to the top of the list
      setOrders((prev) => [order, ...prev]);
      
      // Increment new order counter
      setNewOrderCount((prev) => prev + 1);
      
      // Optional: Play notification sound
      console.log('New order received:', order.order_number);
      
      // Optional: Show browser notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('New Order!', {
          body: `Order ${order.order_number} - $${order.total}`,
          icon: '/favicon.ico',
        });
      }
    },
    
    onOrderStatusUpdated: (order) => {
      // Update order status in the list
      setOrders((prev) =>
        prev.map((o) =>
          o.id === order.id ? { ...o, ...order } : o
        )
      );
      
      console.log(
        `Order ${order.order_number} status: ${order.previous_status} -> ${order.status}`
      );
    },
  });

  // Load initial orders from API
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/admin/orders`,
          {
            headers: {
              // Add your auth token here
              Authorization: `Bearer ${localStorage.getItem('admin_token')}`,
            },
          }
        );
        const data = await response.json();
        setOrders(data.data || []);
      } catch (error) {
        console.error('Failed to fetch orders:', error);
      }
    };

    fetchOrders();
  }, []);

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      shipped: 'bg-purple-100 text-purple-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Orders</h2>
        <div className="flex items-center gap-4">
          {newOrderCount > 0 && (
            <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm">
              {newOrderCount} New
            </span>
          )}
          {isSubscribed && (
            <span className="text-sm text-green-600">
              🟢 Live Updates Active
            </span>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {orders.map((order) => (
          <div
            key={order.id}
            className="border rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">{order.order_number}</h3>
                <p className="text-sm text-gray-600">
                  Total: ${order.total.toFixed(2)}
                </p>
              </div>
              <div className="text-right">
                <span
                  className={`inline-block px-3 py-1 text-xs rounded ${getStatusColor(
                    order.status
                  )}`}
                >
                  {order.status}
                </span>
                <p className="text-xs text-gray-500 mt-1">
                  {order.created_at &&
                    new Date(order.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
