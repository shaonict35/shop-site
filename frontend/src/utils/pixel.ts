import { API_BASE } from "./api";

// Meta (Facebook) Pixel Utility Functions for Standard E-commerce Tracking

export const trackPixelEvent = (eventName: string, params?: Record<string, any>) => {
  if (typeof window !== "undefined") {
    // 1. Browser Meta Pixel
    const fbq = (window as any).fbq;
    if (typeof fbq === "function") {
      if (params) {
        console.log(`[Meta Pixel Browser] Event: ${eventName}`, params);
        fbq("track", eventName, params);
      } else {
        console.log(`[Meta Pixel Browser] Event: ${eventName}`);
        fbq("track", eventName);
      }
    }

    // 2. Meta Conversions API (CAPI - Server Side)
    fetch(`${API_BASE}/marketing/capi`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventName,
        customData: params || {},
      }),
    }).catch(() => {});
  }
};

export const trackPageView = () => {
  trackPixelEvent("PageView");
};

export const trackViewContent = (product: { id?: string; name: string; price?: number; category?: string }) => {
  trackPixelEvent("ViewContent", {
    content_name: product.name,
    content_ids: product.id ? [product.id] : [],
    content_type: "product",
    content_category: product.category || "Beauty & Cosmetics",
    value: product.price || 0,
    currency: "BDT",
  });
};

export const trackAddToCart = (item: { id: string; name: string; price: number }, quantity = 1) => {
  trackPixelEvent("AddToCart", {
    content_name: item.name,
    content_ids: [item.id],
    content_type: "product",
    value: (item.price || 0) * quantity,
    currency: "BDT",
  });
};

export const trackInitiateCheckout = (cartItems: any[], totalValue: number) => {
  trackPixelEvent("InitiateCheckout", {
    content_type: "product",
    num_items: cartItems.length,
    content_ids: cartItems.map(i => i.id || i.productId),
    value: totalValue || 0,
    currency: "BDT",
  });
};

export const trackPurchase = (orderNumber: string, totalValue: number) => {
  trackPixelEvent("Purchase", {
    content_type: "product",
    value: totalValue || 0,
    currency: "BDT",
    order_id: orderNumber,
  });
};

export const trackSearch = (searchQuery: string) => {
  if (searchQuery && searchQuery.trim().length > 1) {
    trackPixelEvent("Search", {
      search_string: searchQuery.trim(),
    });
  }
};
