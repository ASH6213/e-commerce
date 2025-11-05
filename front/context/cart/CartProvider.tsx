import React, { useContext, useEffect, useReducer, useRef } from "react";
import cartReducer from "./cartReducer";
import CartContext from "./CartContext";
import { getCookie, setCookie } from "cookies-next";
import {
  ADD_ITEM,
  ADD_ONE,
  REMOVE_ITEM,
  DELETE_ITEM,
  itemType,
  cartType,
  CLEAR_CART,
  SET_CART,
} from "./cart-types";
import { api } from "../../lib/api";

export const ProvideCart = ({ children }: { children: React.ReactNode }) => {
  const value = useProvideCart();
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => useContext(CartContext);

const useProvideCart = () => {
  const initPersistState: cartType = { cart: [] };
  const [state, dispatch] = useReducer(cartReducer, initPersistState);

  const fetchUpdatedCart = async (branchId: string) => {
    const updated: itemType[] = await Promise.all(
      state.cart.map(async (it: itemType) => {
        try {
          const res = await api.get(`/api/v1/products/${it.id}`, {
            params: { branch_id: branchId },
          });
          const p = res.data;
          // Update price, name, and images from API
          const images = Array.isArray(p?.images) ? p.images : [];
          return {
            ...it,
            name: p?.name || it.name,
            price: Number(p?.price ?? it.price),
            img1: images.length > 0 ? images[0] : it.img1,
            img2: images.length > 1 ? images[1] : it.img2,
            // Keep branch-aware stock for UI and add-to-cart capping
            ...(typeof p?.branch_stock === 'number' ? { branch_stock: p.branch_stock } : {}),
            ...(typeof p?.stock === 'number' ? { stock: p.stock } : {}),
          } as itemType;
        } catch (_e) {
          return it;
        }
      })
    );
    return updated;
  };

  useEffect(() => {
    const initialCart = getCookie("cart");
    console.log("Loading cart from cookie:", initialCart);
    if (initialCart) {
      try {
        const cartItems = JSON.parse(initialCart as string);
        dispatch({ type: SET_CART, payload: cartItems });
        console.log("Cart loaded successfully:", cartItems.length, "items");
        
        // Update cart with current branch prices and images on load
        const branchId = getCookie("branch_id") as string;
        
        if (branchId && cartItems.length > 0) {
        const updateCart = async () => {
          try {
            const updated: itemType[] = await Promise.all(
              cartItems.map(async (it: itemType) => {
                try {
                  const res = await api.get(`/api/v1/products/${it.id}`, {
                    params: { branch_id: branchId },
                  });
                  const p = res.data;
                  const images = Array.isArray(p?.images) ? p.images : [];
                  return {
                    ...it,
                    name: p?.name || it.name,
                    price: Number(p?.price ?? it.price),
                    img1: images.length > 0 ? images[0] : it.img1,
                    img2: images.length > 1 ? images[1] : it.img2,
                    ...(typeof p?.branch_stock === 'number' ? { branch_stock: p.branch_stock } : {}),
                    ...(typeof p?.stock === 'number' ? { stock: p.stock } : {}),
                  } as itemType;
                } catch (_e) {
                  return it;
                }
              })
            );
            dispatch({ type: SET_CART, payload: updated });
          } catch (_err) {
            // Keep original cart if update fails
          }
        };
        updateCart();
        }
      } catch (e) {
        console.error("Failed to parse cart cookie:", e);
      }
    }
  }, []);

  useEffect(() => {
    // Save cart with longer expiry (30 days)
    setCookie("cart", state.cart, { 
      path: "/",
      maxAge: 30 * 24 * 60 * 60, // 30 days in seconds
      sameSite: "lax"
    });
    console.log("Cart saved to cookie:", state.cart.length, "items");
  }, [state.cart]);

  // Recalculate prices when branch_id changes
  const lastBranchRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    const currentBranch = (getCookie("branch_id") as string) || undefined;
    if (lastBranchRef.current === currentBranch) return;
    lastBranchRef.current = currentBranch;

    if (!currentBranch || state.cart.length === 0) return;

    const refreshPrices = async () => {
      try {
        const updated = await fetchUpdatedCart(currentBranch);
        dispatch({ type: SET_CART, payload: updated });
      } catch (_err) {
      }
    };
    refreshPrices();
  }, [state.cart.length]);

  useEffect(() => {
    const onBranchChanged = async (e: any) => {
      const currentBranch = e?.detail?.branch_id || (getCookie("branch_id") as string) || undefined;
      if (!currentBranch || state.cart.length === 0) return;
      lastBranchRef.current = currentBranch;
      try {
        const updated = await fetchUpdatedCart(currentBranch);
        dispatch({ type: SET_CART, payload: updated });
      } catch (_err) {
      }
    };
    window.addEventListener("branch-changed", onBranchChanged as EventListener);
    return () => window.removeEventListener("branch-changed", onBranchChanged as EventListener);
  }, [state.cart.length]);

  const addItem = (item: itemType) => {
    dispatch({
      type: ADD_ITEM,
      payload: item,
    });
  };

  const addOne = (item: itemType) => {
    dispatch({
      type: ADD_ONE,
      payload: item,
    });
  };

  const removeItem = (item: itemType) => {
    dispatch({
      type: REMOVE_ITEM,
      payload: item,
    });
  };

  const deleteItem = (item: itemType) => {
    dispatch({
      type: DELETE_ITEM,
      payload: item,
    });
  };

  const clearCart = () => {
    dispatch({
      type: CLEAR_CART,
    });
  };

  const value: cartType = {
    cart: state.cart,
    addItem,
    addOne,
    removeItem,
    deleteItem,
    clearCart,
  };

  return value;
};
