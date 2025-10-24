import { useContext, useEffect, useReducer, useCallback, useRef } from "react";
import { getCookie, setCookie } from "cookies-next";
import { api } from "../../lib/api";
import { useAuth } from "../AuthContext";
import { getPusher } from "../../lib/pusher";

import wishlistReducer from "./wishlistReducer";
import WishlistContext from "./WishlistContext";
import {
  ADD_TO_WISHLIST,
  DELETE_WISHLIST_ITEM,
  CLEAR_WISHLIST,
  itemType,
  wishlistType,
  SET_WISHLIST,
} from "./wishlist-type";

export const ProvideWishlist = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const value = useProvideWishlist();
  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => useContext(WishlistContext);

const useProvideWishlist = () => {
  const initPersistState: wishlistType = { wishlist: [] };
  const [state, dispatch] = useReducer(wishlistReducer, initPersistState);
  const { user } = useAuth();

  useEffect(() => {
    const initialWishlist = getCookie("wishlist");
    console.log("Loading wishlist from cookie:", initialWishlist);
    if (initialWishlist) {
      try {
        const wishlistItems = JSON.parse(initialWishlist as string);
        dispatch({ type: SET_WISHLIST, payload: wishlistItems });
        console.log("Wishlist loaded successfully:", wishlistItems.length, "items");
      } catch (e) {
        console.error("Failed to parse wishlist cookie:", e);
      }
    }
  }, []);

  useEffect(() => {
    // Save wishlist with longer expiry (30 days)
    setCookie("wishlist", state.wishlist, { 
      path: "/",
      maxAge: 30 * 24 * 60 * 60, // 30 days in seconds
      sameSite: "lax"
    });
    console.log("Wishlist saved to cookie:", state.wishlist.length, "items");
  }, [state.wishlist]);

  useEffect(() => {
    const onBranchChanged = async () => {
      const branchId = (getCookie("branch_id") as string) || undefined;
      if (!branchId || state.wishlist.length === 0) return;
      try {
        const updated = await Promise.all(
          state.wishlist.map(async (it: itemType) => {
            try {
              const res = await api.get(`/api/v1/products/${it.id}`, {
                params: { branch_id: branchId },
              });
              const p = res.data;
              return { ...it, price: Number(p?.price ?? it.price) } as itemType;
            } catch (_e) {
              return it;
            }
          })
        );
        dispatch({ type: SET_WISHLIST, payload: updated });
      } catch (_err) {
        // ignore
      }
    };
    if (typeof window !== "undefined") {
      window.addEventListener("branch-changed", onBranchChanged as EventListener);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("branch-changed", onBranchChanged as EventListener);
      }
    };
  }, [state.wishlist.length]);

  // Sync wishlist to database when user is logged in
  const syncToDatabase = useCallback(async () => {
    if (!user?.id || state.wishlist.length === 0) return;
    
    try {
      const products = state.wishlist.map(item => ({ id: item.id }));
      await api.post('/api/v1/wishlist/sync', {
        user_id: user.id,
        products: products
      });
      console.log('Wishlist synced to database');
    } catch (e) {
      console.error('Failed to sync wishlist:', e);
    }
  }, [user?.id, state.wishlist]);

  // Sync when user logs in or wishlist changes
  useEffect(() => {
    if (user?.id) {
      syncToDatabase();
    }
  }, [user?.id, syncToDatabase]);

  const addToWishlist = async (item: itemType) => {
    dispatch({
      type: ADD_TO_WISHLIST,
      payload: item,
    });
    
    // Also add to database if user is logged in
    if (user?.id) {
      try {
        await api.post('/api/v1/wishlist', {
          user_id: user.id,
          product_id: item.id,
          notify_on_stock: true,
          notify_on_price_drop: true,
        });
        console.log('Added to database wishlist');
      } catch (e) {
        console.error('Failed to add to database:', e);
      }
    }
  };

  const deleteWishlistItem = async (item: itemType) => {
    dispatch({
      type: DELETE_WISHLIST_ITEM,
      payload: item,
    });
    
    // Also remove from database if user is logged in
    if (user?.id) {
      try {
        // Find wishlist item in database by user_id and product_id
        const response = await api.get('/api/v1/wishlist', {
          params: { user_id: user.id }
        });
        const wishlistItem = response.data.find((w: any) => w.product_id === item.id);
        if (wishlistItem) {
          await api.delete(`/api/v1/wishlist/${wishlistItem.id}`);
          console.log('Removed from database wishlist');
        }
      } catch (e) {
        console.error('Failed to remove from database:', e);
      }
    }
  };

  const clearWishlist = () => {
    dispatch({
      type: CLEAR_WISHLIST,
    });
  };

  // Listen for real-time product updates to refresh wishlist
  useEffect(() => {
    const pusher = getPusher();
    if (!pusher || state.wishlist.length === 0) return;

    const channel = pusher.subscribe('products');

    const handleProductUpdated = async (data: any) => {
      const updatedProductId = data.product?.id;
      if (!updatedProductId) return;

      // Check if this product is in wishlist
      const isInWishlist = state.wishlist.some(item => item.id === updatedProductId);
      if (!isInWishlist) return;

      console.log('Product in wishlist updated, refreshing...', updatedProductId);

      // Fetch updated product data
      try {
        const branchId = getCookie('branch_id') as string;
        const res = await api.get(`/api/v1/products/${updatedProductId}`, {
          params: branchId ? { branch_id: branchId } : undefined,
        });
        const product = res.data;
        const images = Array.isArray(product.images) ? product.images : [];

        // Update wishlist item with new data
        const updatedWishlist = state.wishlist.map(item => {
          if (item.id === updatedProductId) {
            return {
              ...item,
              name: product.name || item.name,
              price: Number(product.price ?? item.price),
              img1: images.length > 0 ? images[0] : item.img1,
              img2: images.length > 1 ? images[1] : item.img2,
            };
          }
          return item;
        });

        dispatch({ type: SET_WISHLIST, payload: updatedWishlist });
        console.log('Wishlist updated with new product data');
      } catch (e) {
        console.error('Failed to refresh wishlist item:', e);
      }
    };

    channel.bind('product.updated', handleProductUpdated);

    return () => {
      channel.unbind('product.updated', handleProductUpdated);
      pusher.unsubscribe('products');
    };
  }, [state.wishlist]);

  const value: wishlistType = {
    wishlist: state.wishlist,
    addToWishlist,
    deleteWishlistItem,
    clearWishlist,
  };

  return value;
};
