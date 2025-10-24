import { useEffect, useCallback, useRef } from 'react';
import { getPusher } from '../pusher';

export interface Order {
  id: number;
  order_number: string;
  user_id?: number;
  status: string;
  total: number;
  payment_status: string;
  created_at?: string;
  updated_at?: string;
  previous_status?: string;
}

interface OrderEventData {
  order?: Order;
}

interface UseRealtimeOrdersOptions {
  onOrderCreated?: (order: Order) => void;
  onOrderStatusUpdated?: (order: Order) => void;
  enabled?: boolean;
}

/**
 * Hook to subscribe to real-time order updates
 * Listens to order.created and order.status.updated events
 */
export const useRealtimeOrders = (options: UseRealtimeOrdersOptions = {}) => {
  const {
    onOrderCreated,
    onOrderStatusUpdated,
    enabled = true,
  } = options;

  const channelRef = useRef<any>(null);

  const handleOrderCreated = useCallback(
    (data: OrderEventData) => {
      if (data.order && onOrderCreated) {
        console.log('New order created:', data.order);
        onOrderCreated(data.order);
      }
    },
    [onOrderCreated]
  );

  const handleOrderStatusUpdated = useCallback(
    (data: OrderEventData) => {
      if (data.order && onOrderStatusUpdated) {
        console.log('Order status updated:', data.order);
        onOrderStatusUpdated(data.order);
      }
    },
    [onOrderStatusUpdated]
  );

  useEffect(() => {
    if (!enabled) return;

    const pusher = getPusher();
    if (!pusher) {
      console.warn('Pusher not available, real-time order updates disabled');
      return;
    }

    // Subscribe to orders channel
    const channel = pusher.subscribe('orders');
    channelRef.current = channel;

    // Bind event handlers
    channel.bind('order.created', handleOrderCreated);
    channel.bind('order.status.updated', handleOrderStatusUpdated);

    console.log('Subscribed to orders channel');

    // Cleanup on unmount
    return () => {
      channel.unbind('order.created', handleOrderCreated);
      channel.unbind('order.status.updated', handleOrderStatusUpdated);
      pusher.unsubscribe('orders');
      channelRef.current = null;
      console.log('Unsubscribed from orders channel');
    };
  }, [enabled, handleOrderCreated, handleOrderStatusUpdated]);

  return {
    isSubscribed: !!channelRef.current,
  };
};
