import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import cartService from '../services/cartService';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartCount, setCartCount] = useState(0);
  const { isAuthenticated, user } = useAuth();

  // Fetch the real cart count from the backend
  const refreshCartCount = useCallback(async () => {
    if (!isAuthenticated) {
      setCartCount(0);
      return;
    }
    try {
      const data = await cartService.getCart();
      // data.items or data.cart_items — count unique line items
      const items = data?.items || data?.cart_items || data?.data?.items || [];
      const total = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
      setCartCount(total);
    } catch {
      setCartCount(0);
    }
  }, [isAuthenticated]);

  // Reload count when user logs in/out or changes
  useEffect(() => {
    refreshCartCount();
  }, [user?.id, isAuthenticated, refreshCartCount]);

  // Optimistic increment — call this right after addItem succeeds
  const incrementCart = (qty = 1) => {
    setCartCount((prev) => prev + qty);
  };

  // Optimistic decrement
  const decrementCart = (qty = 1) => {
    setCartCount((prev) => Math.max(0, prev - qty));
  };

  // Reset to zero (e.g. after checkout / clear cart)
  const resetCart = () => setCartCount(0);

  return (
    <CartContext.Provider value={{ cartCount, refreshCartCount, incrementCart, decrementCart, resetCart }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within a CartProvider');
  return ctx;
};

export default CartContext;
