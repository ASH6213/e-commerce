import { useState, useEffect } from 'react';
import { useRealtimeProducts, Product } from '../lib/hooks/useRealtimeProducts';

/**
 * Example component showing how to use real-time product updates
 * This component maintains a local list of products and updates it in real-time
 */
export const RealtimeProductList = () => {
  const [products, setProducts] = useState<Product[]>([]);

  // Subscribe to real-time product updates
  const { isSubscribed } = useRealtimeProducts({
    enabled: true, // Enable real-time updates
    
    onProductCreated: (product) => {
      // Add new product to the list
      setProducts((prev) => [product, ...prev]);
      
      // Optional: Show notification
      console.log('New product added:', product.name);
    },
    
    onProductUpdated: (product) => {
      // Update existing product in the list
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? product : p))
      );
      
      // Optional: Show notification
      console.log('Product updated:', product.name);
    },
    
    onProductDeleted: (productId) => {
      // Remove deleted product from the list
      setProducts((prev) => prev.filter((p) => p.id !== productId));
      
      // Optional: Show notification
      console.log('Product deleted:', productId);
    },
  });

  // Load initial products from API
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/products`
        );
        const data = await response.json();
        setProducts(data.data || []);
      } catch (error) {
        console.error('Failed to fetch products:', error);
      }
    };

    fetchProducts();
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Products</h2>
        {isSubscribed && (
          <span className="text-sm text-green-600">
            🟢 Live Updates Active
          </span>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {products.map((product) => (
          <div
            key={product.id}
            className="border rounded-lg p-4 hover:shadow-lg transition-shadow"
          >
            <h3 className="font-semibold">{product.name}</h3>
            <p className="text-gray-600">
              Price: ${product.sale_price || product.price}
            </p>
            <p className="text-sm text-gray-500">Stock: {product.stock}</p>
            <span
              className={`inline-block px-2 py-1 text-xs rounded ${
                product.is_active
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {product.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
