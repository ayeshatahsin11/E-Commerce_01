"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { SITE } from "@/lib/site";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";

const CartContext = createContext(null);

const EMPTY_CART = {
  items: [],
  itemCount: 0,
  subtotal: 0,
  freeDeliveryAbove: SITE.freeDeliveryAbove,
  canCheckout: false,
};

export function CartProvider({ children }) {
  const { user } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const pathname = usePathname();

  const [cartData, setCartData] = useState({ ownerId: null, cart: EMPTY_CART });
  const [busy, setBusy] = useState(false);

  // Only customers (role "user") have a cart
  const ownerId = user?.role === "user" ? user.id : null;

  useEffect(() => {
    if (!ownerId) return;
    let cancelled = false;

    api
      .get("/cart")
      .then((data) => {
        if (!cancelled) setCartData({ ownerId, cart: data.cart });
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [ownerId]);

  // A cart that belongs to a previous user is never shown
  const cart = ownerId && cartData.ownerId === ownerId ? cartData.cart : EMPTY_CART;
  const loading = Boolean(ownerId) && cartData.ownerId !== ownerId;

  // Runs a cart request, stores the new cart, and shows a toast
  const run = useCallback(
    async (request, successMessage) => {
      if (!ownerId) {
        if (user) {
          toast.error("Please use a customer account to shop");
        } else {
          toast.info("Please log in to use your cart");
          router.push(`/login?next=${encodeURIComponent(pathname)}`);
        }
        return false;
      }

      setBusy(true);
      try {
        const data = await request();
        setCartData({ ownerId, cart: data.cart });
        if (successMessage) toast.success(successMessage);
        return true;
      } catch (error) {
        toast.error(error.message);
        return false;
      } finally {
        setBusy(false);
      }
    },
    [ownerId, user, toast, router, pathname]
  );

  const addItem = useCallback(
    (productId, quantity) =>
      run(() => api.post("/cart/items", { productId, quantity }), "Added to cart"),
    [run]
  );

  const updateItem = useCallback(
    (productId, quantity) => run(() => api.patch(`/cart/items/${productId}`, { quantity })),
    [run]
  );

  const removeItem = useCallback(
    (productId) => run(() => api.delete(`/cart/items/${productId}`), "Removed from cart"),
    [run]
  );

  const clearCart = useCallback(() => run(() => api.delete("/cart")), [run]);

  // Use after placing an order (the server empties the cart)
  const reloadCart = useCallback(() => run(() => api.get("/cart")), [run]);

  const value = useMemo(
    () => ({ cart, loading, busy, addItem, updateItem, removeItem, clearCart, reloadCart }),
    [cart, loading, busy, addItem, updateItem, removeItem, clearCart, reloadCart]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => useContext(CartContext);