import { useEffect, useCallback, useRef } from 'react';
import { getPusher } from '../pusher';

export interface Product {
  id: number;
  name: string;
  slug: string;
  price: number;
  sale_price?: number;
  stock: number;
  images: string[];
  is_active: boolean;
  is_featured: boolean;
  category_id: number;
  created_at?: string;
  updated_at?: string;
}

interface ProductEventData {
  product?: Product;
  product_id?: number;
}

interface UseRealtimeProductsOptions {
  onProductCreated?: (product: Product) => void;
  onProductUpdated?: (product: Product) => void;
  onProductDeleted?: (productId: number) => void;
  onProductStockUpdated?: (product: Product) => void;
  enabled?: boolean;
}

/**
 * Hook to subscribe to real-time product updates
 * Listens to product.created, product.updated, and product.deleted events
 */
export const useRealtimeProducts = (options: UseRealtimeProductsOptions = {}) => {
  const {
    onProductCreated,
    onProductUpdated,
    onProductDeleted,
    onProductStockUpdated,
    enabled = true,
  } = options;

  const channelRef = useRef<any>(null);

  const handleProductCreated = useCallback(
    (data: ProductEventData) => {
      if (data.product && onProductCreated) {
        console.log('Product created:', data.product);
        onProductCreated(data.product);
      }
    },
    [onProductCreated]
  );

  const handleProductUpdated = useCallback(
    (data: ProductEventData) => {
      if (data.product && onProductUpdated) {
        console.log('Product updated:', data.product);
        onProductUpdated(data.product);
      }
    },
    [onProductUpdated]
  );

  const handleProductDeleted = useCallback(
    (data: ProductEventData) => {
      if (data.product_id && onProductDeleted) {
        console.log('Product deleted:', data.product_id);
        onProductDeleted(data.product_id);
      }
    },
    [onProductDeleted]
  );

  const handleProductStockUpdated = useCallback(
    (data: ProductEventData) => {
      if (data.product && onProductStockUpdated) {
        console.log('Product stock updated:', data.product);
        onProductStockUpdated(data.product);
      }
    },
    [onProductStockUpdated]
  );

  useEffect(() => {
    if (!enabled) return;

    const pusher = getPusher();
    if (!pusher) {
      console.warn('Pusher not available, real-time product updates disabled');
      return;
    }

    // Subscribe to products channel
    const channel = pusher.subscribe('products');
    channelRef.current = channel;

    // Bind event handlers with logging
    channel.bind('product.created', (data: any) => {
      console.log('RAW product.created event received:', data);
      handleProductCreated(data);
    });
    channel.bind('product.updated', (data: any) => {
      console.log('RAW product.updated event received:', data);
      handleProductUpdated(data);
    });
    channel.bind('product.deleted', (data: any) => {
      console.log('RAW product.deleted event received:', data);
      handleProductDeleted(data);
    });
    channel.bind('product.stock.updated', (data: any) => {
      console.log('RAW product.stock.updated event received:', data);
      handleProductStockUpdated(data);
    });

    console.log('Subscribed to products channel');

    // Cleanup on unmount
    return () => {
      channel.unbind('product.created', handleProductCreated);
      channel.unbind('product.updated', handleProductUpdated);
      channel.unbind('product.deleted', handleProductDeleted);
      channel.unbind('product.stock.updated', handleProductStockUpdated);
      pusher.unsubscribe('products');
      channelRef.current = null;
      console.log('Unsubscribed from products channel');
    };
  }, [enabled, handleProductCreated, handleProductUpdated, handleProductDeleted, handleProductStockUpdated]);

  return {
    isSubscribed: !!channelRef.current,
  };
};
