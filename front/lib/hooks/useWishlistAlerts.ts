import { useEffect, useCallback, useRef } from 'react';
import { getPusher } from '../pusher';

export interface WishlistAlert {
  type: 'price_drop' | 'back_in_stock';
  wishlist_id: number;
  product: {
    id: number;
    name: string;
    slug: string;
    price?: number;
    old_price?: number;
    new_price?: number;
    discount_percentage?: number;
    stock?: number;
    images?: string[];
  };
  message: string;
}

interface UseWishlistAlertsOptions {
  userId?: number;
  onPriceDropped?: (alert: WishlistAlert) => void;
  onBackInStock?: (alert: WishlistAlert) => void;
  enabled?: boolean;
}

/**
 * Hook to subscribe to real-time wishlist alerts
 * Listens to wishlist.price.dropped and wishlist.back.in.stock events
 */
export const useWishlistAlerts = (options: UseWishlistAlertsOptions = {}) => {
  const {
    userId,
    onPriceDropped,
    onBackInStock,
    enabled = true,
  } = options;

  const channelRef = useRef<any>(null);

  const handlePriceDropped = useCallback(
    (data: any) => {
      // Filter by user_id since it's a public channel
      if (data.user_id !== userId) {
        console.log('Ignoring alert for different user:', data.user_id);
        return;
      }
      
      if (onPriceDropped) {
        const alert: WishlistAlert = {
          type: 'price_drop',
          ...data,
        };
        console.log('Price dropped on wishlist item:', alert);
        onPriceDropped(alert);
      }
    },
    [onPriceDropped, userId]
  );

  const handleBackInStock = useCallback(
    (data: any) => {
      // Filter by user_id since it's a public channel
      if (data.user_id !== userId) {
        console.log('🚫 Ignoring alert for different user:', data.user_id);
        return;
      }
      
      if (onBackInStock) {
        const alert: WishlistAlert = {
          type: 'back_in_stock',
          ...data,
        };
        console.log('Wishlist item back in stock:', alert);
        onBackInStock(alert);
      }
    },
    [onBackInStock, userId]
  );

  useEffect(() => {
    if (!enabled || !userId) return;

    const pusher = getPusher();
    if (!pusher) {
      console.warn('Pusher not available, wishlist alerts disabled');
      return;
    }

    // Subscribe to public wishlist channel
    const channelName = 'wishlist';
    const channel = pusher.subscribe(channelName);
    channelRef.current = channel;

    // Bind event handlers
    channel.bind('wishlist.price.dropped', handlePriceDropped);
    channel.bind('wishlist.back.in.stock', handleBackInStock);

    console.log(`Subscribed to wishlist alerts for user ${userId}`);

    // Cleanup on unmount
    return () => {
      channel.unbind('wishlist.price.dropped', handlePriceDropped);
      channel.unbind('wishlist.back.in.stock', handleBackInStock);
      pusher.unsubscribe(channelName);
      channelRef.current = null;
      console.log(`Unsubscribed from wishlist alerts`);
    };
  }, [enabled, userId, handlePriceDropped, handleBackInStock]);

  return {
    isSubscribed: !!channelRef.current,
  };
};
