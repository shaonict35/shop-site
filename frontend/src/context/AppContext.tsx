"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { trackAddToCart } from "../utils/pixel";

export interface CartItem {
  id: string; // variantId
  productId: string;
  name: string; // product name
  variantName: string; // shade / size name
  image: string;
  price: number;
  quantity: number;
  stock: number;
}

interface AppContextType {
  user: any | null;
  token: string | null;
  login: (userData: any, token: string) => void;
  updateUser: (updatedUser: any) => void;
  logout: () => void;

  cart: CartItem[];
  addToCart: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  removeFromCart: (variantId: string) => void;
  updateCartQuantity: (variantId: string, quantity: number) => void;
  clearCart: () => void;
  wishlist: string[]; // array of productIds
  toggleWishlist: (productId: string) => void;
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  checkoutAddress: string;
  setCheckoutAddress: (addr: string) => void;
  checkoutPhone: string;
  setCheckoutPhone: (phone: string) => void;
  checkoutName: string;
  setCheckoutName: (name: string) => void;
  trackingSettings: {
    META_PIXEL_ID?: string;
    META_CAPI_TOKEN?: string;
    GA4_MEASUREMENT_ID?: string;
    GTM_CONTAINER_ID?: string;
    ROUTINE_LINK?: string;
    HAIR_CARE_101_LINK?: string;
    SKIN_CARE_101_LINK?: string;
    MAKEUP_101_LINK?: string;
  };
  siteSettings: Record<string, any>;
  refreshTracking: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutAddress, setCheckoutAddress] = useState("");
  const [checkoutPhone, setCheckoutPhone] = useState("");
  const [checkoutName, setCheckoutName] = useState("");
  const [trackingSettings, setTrackingSettings] = useState<Record<string, any>>({});
  const siteSettings = trackingSettings;

  // Fetch dynamic integration settings for tracking scripts & navigation links
  const refreshTracking = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/settings/public");
      if (res.ok) {
        const data = await res.json();
        setTrackingSettings(data);
      }
    } catch (e) {
      console.log("Could not load dynamic analytics integrations, using defaults.", e);
    }
  };

  // Load state from local storage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem("gg_token");
    const savedUser = localStorage.getItem("gg_user");
    const savedCart = localStorage.getItem("gg_cart");
    const savedWishlist = localStorage.getItem("gg_wishlist");

    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
    if (savedWishlist) {
      setWishlist(JSON.parse(savedWishlist));
    }

    refreshTracking();
  }, []);

  // Save cart to local storage whenever it changes
  useEffect(() => {
    localStorage.setItem("gg_cart", JSON.stringify(cart));
  }, [cart]);

  // Save wishlist to local storage
  useEffect(() => {
    localStorage.setItem("gg_wishlist", JSON.stringify(wishlist));
  }, [wishlist]);

  const login = (userData: any, userToken: string) => {
    setUser(userData);
    setToken(userToken);
    setCheckoutName(userData.name);
    setCheckoutPhone(userData.phone || "");
    localStorage.setItem("gg_token", userToken);
    localStorage.setItem("gg_user", JSON.stringify(userData));
  };

  const updateUser = (updatedUser: any) => {
    setUser(updatedUser);
    localStorage.setItem("gg_user", JSON.stringify(updatedUser));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("gg_token");
    localStorage.removeItem("gg_user");
  };


  const addToCart = (item: Omit<CartItem, "quantity">, quantity = 1) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      const stockLimit = (item.stock && item.stock > 0) ? item.stock : 99;
      if (existing) {
        const newQty = Math.min(existing.quantity + quantity, stockLimit);
        return prev.map((i) => (i.id === item.id ? { ...i, quantity: newQty } : i));
      }
      return [...prev, { ...item, quantity }];
    });
    setCartOpen(true);
    trackAddToCart(item, quantity);
  };

  const removeFromCart = (variantId: string) => {
    setCart((prev) => prev.filter((i) => i.id !== variantId));
  };

  const updateCartQuantity = (variantId: string, quantity: number) => {
    setCart((prev) =>
      prev.map((i) => (i.id === variantId ? { ...i, quantity: Math.max(1, quantity) } : i))
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const toggleWishlist = (productId: string) => {
    setWishlist((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  return (
    <AppContext.Provider
      value={{
        user,
        token,
        login,
        updateUser,
        logout,

        cart,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        wishlist,
        toggleWishlist,
        cartOpen,
        setCartOpen,
        checkoutAddress,
        setCheckoutAddress,
        checkoutPhone,
        setCheckoutPhone,
        checkoutName,
        setCheckoutName,
        trackingSettings,
        siteSettings,
        refreshTracking,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
