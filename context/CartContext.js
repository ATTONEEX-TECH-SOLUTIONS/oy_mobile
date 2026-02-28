import React, { createContext, useMemo, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]); // { id, name, price, quantity, businessId }
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const savedToken = await AsyncStorage.getItem("authToken");
        const savedUser = await AsyncStorage.getItem("authUser");
        if (savedToken) setToken(savedToken);
        if (savedUser) setUser(JSON.parse(savedUser));
      } finally {
        setAuthLoading(false);
      }
    })();
  }, []);

  const saveAuth = async ({ token: tkn, user: usr }) => {
    setToken(tkn);
    setUser(usr);
    await AsyncStorage.setItem("authToken", tkn);
    await AsyncStorage.setItem("authUser", JSON.stringify(usr));
  };

  const logout = async () => {
    setToken(null);
    setUser(null);
    await AsyncStorage.removeItem("authToken");
    await AsyncStorage.removeItem("authUser");
  };

  const clearCart = () => setCartItems([]);

  // ✅ if user tries to add item from a different restaurant, we reset cart
  const addToCart = (item) => {
    setCartItems((prev) => {
      if (prev.length > 0) {
        const existingBusinessId = prev[0].businessId;
        if (existingBusinessId !== item.businessId) {
          // new restaurant => reset cart
          return [{ ...item, quantity: 1 }];
        }
      }

      const existing = prev.find((x) => x.id === item.id);
      if (existing) {
        return prev.map((x) =>
          x.id === item.id ? { ...x, quantity: x.quantity + 1 } : x
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const decreaseQty = (menuItemId) => {
    setCartItems((prev) =>
      prev
        .map((x) =>
          x.id === menuItemId ? { ...x, quantity: x.quantity - 1 } : x
        )
        .filter((x) => x.quantity > 0)
    );
  };

  const removeFromCart = (menuItemId) => {
    setCartItems((prev) => prev.filter((x) => x.id !== menuItemId));
  };

  const cartTotal = useMemo(
    () => cartItems.reduce((sum, x) => sum + x.price * x.quantity, 0),
    [cartItems]
  );

  const value = useMemo(
    () => ({
      cartItems,
      addToCart,
      decreaseQty,
      removeFromCart,
      clearCart,
      cartTotal,
      user,
      token,
      authLoading,
      saveAuth,
      logout,
    }),
    [cartItems, cartTotal, user, token, authLoading]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}