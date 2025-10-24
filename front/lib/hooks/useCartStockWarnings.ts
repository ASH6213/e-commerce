import { useEffect, useCallback, useRef } from 'react';
import { getPusher } from '../pusher';

export interface CartStockWarning {
  product: {
    id: number;
    name: string;
    slug: string;
    available_stock: number;
    price: number;
    images?: string[];
  };
  warning_type: 'low_stock' | 'out_of_stock';
  message: string;
}

interface UseCartStockWarningsOptions {
  cartItems: Array<{ id: number; qty?: number }>;
  onLowStock?: (warning: CartStockWarning) => void;
  onOutOfStock?: (warning: CartStockWarning) => void;
  enabled?: boolean;
}

/**
 * Hook to subscribe to real-time cart stock warnings
 * Listens to cart.stock.warning events
 */
export const useCartStockWarnings = (options: UseCartStockWarningsOptions = { cartItems: [] }) => {
  const {
    cartItems,
    onLowStock,
    onOutOfStock,
    enabled = true,
  } = options;

  const channelRef = useRef<any>(null);

  const handleStockWarning = useCallback(
    (data: CartStockWarning) => {
      // Check if this product is in the user's cart
      const cartItem = cartItems.find(item => item.id === data.product.id);
      if (!cartItem) {
        console.log('Ignoring warning for product not in cart:', data.product.id);
        return;
      }

      console.log('Stock warning for cart item:', data);

      if (data.warning_type === 'out_of_stock' && onOutOfStock) {
        onOutOfStock(data);
      } else if (data.warning_type === 'low_stock' && onLowStock) {
        // Only warn if requested qty > available
        if (cartItem.qty && cartItem.qty > data.product.available_stock) {
          onLowStock(data);
        }
      }
    },
    [cartItems, onLowStock, onOutOfStock]
  );

  useEffect(() => {
    if (!enabled || cartItems.length === 0) return;

    const pusher = getPusher();
    if (!pusher) {
      console.warn('Pusher not available, cart stock warnings disabled');
      return;
    }

    // Subscribe to cart channel
    const channelName = 'cart';
    const channel = pusher.subscribe(channelName);
    channelRef.current = channel;

    // Bind event handler
    channel.bind('cart.stock.warning', handleStockWarning);

    console.log(`Subscribed to cart stock warnings for ${cartItems.length} items`);

    // Cleanup on unmount
    return () => {
      channel.unbind('cart.stock.warning', handleStockWarning);
      pusher.unsubscribe(channelName);
      channelRef.current = null;
      console.log(`Unsubscribed from cart stock warnings`);
    };
  }, [enabled, cartItems.length, handleStockWarning]);

  return {
    isSubscribed: !!channelRef.current,
  };
};
