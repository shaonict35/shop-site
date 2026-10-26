"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  ShoppingCart,
  Search,
  Plus,
  Minus,
  Trash2,
  Printer,
  RefreshCw,
  CheckCircle,
  CreditCard,
  DollarSign,
  User,
  Phone,
  Calendar,
  Tag,
  Sparkles,
  X,
  FileText,
  Clock,
  ArrowRight,
  Receipt,
  Store,
  Layers,
  ChevronRight
} from "lucide-react";

export interface PosCartItem {
  productId: string;
  variantId: string;
  productName: string;
  variantName: string;
  price: number;
  costPrice?: number;
  quantity: number;
  stock: number;
  imageUrl: string;
}

interface OfflineSaleModuleProps {
  adminProducts: any[];
  adminCategories: any[];
  orders: any[];
  fetchAdminProducts: (bypass?: boolean) => Promise<any>;
  fetchAdminOrders: (bypass?: boolean) => Promise<any>;
  getAuthHeader: () => Record<string, string>;
  API_BASE: string;
}

export default function OfflineSaleModule({
  adminProducts = [],
  adminCategories = [],
  orders = [],
  fetchAdminProducts,
  fetchAdminOrders,
  getAuthHeader,
  API_BASE
}: OfflineSaleModuleProps) {
  // Navigation sub-tabs
  const [subTab, setSubTab] = useState<"pos" | "history">("pos");

  // Catalog Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedVariantMap, setSelectedVariantMap] = useState<Record<string, string>>({});

  // Active Billing Cart
  const [cart, setCart] = useState<PosCartItem[]>([]);

  // Customer Information
  const [isWalkIn, setIsWalkIn] = useState(true);
  const [customerName, setCustomerName] = useState("Walk-in Customer");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("Showroom Counter");
  const [orderNotes, setOrderNotes] = useState("");

  // Financial Calculations
  const [discountType, setDiscountType] = useState<"flat" | "percent">("flat");
  const [discountValue, setDiscountValue] = useState<string>("0");
  const [deliveryCharge, setDeliveryCharge] = useState<string>("0");
  const [paymentMethod, setPaymentMethod] = useState<string>("Cash");
  const [cashReceived, setCashReceived] = useState<string>("");

  // Submission & Receipt State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeReceipt, setActiveReceipt] = useState<any | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  // Offline Orders History
  const [offlineOrders, setOfflineOrders] = useState<any[]>([]);
  const [historySearch, setHistorySearch] = useState("");
  const [historyDateFilter, setHistoryDateFilter] = useState<"all" | "today" | "week" | "month">("all");
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const receiptPrintRef = useRef<HTMLDivElement>(null);

  // Sync offline orders from orders prop or fetch
  useEffect(() => {
    fetchOfflineOrdersList();
  }, [orders]);

  const fetchOfflineOrdersList = async () => {
    setIsLoadingHistory(true);
    try {
      const res = await fetch(`${API_BASE}/orders/offline`, {
        headers: getAuthHeader()
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setOfflineOrders(data);
          setIsLoadingHistory(false);
          return;
        }
      }
    } catch (_) {}

    // Fallback: filter offline orders from global orders list
    const filtered = (orders || []).filter((o: any) =>
      o.isOffline === true ||
      (o.orderSource && (o.orderSource.toLowerCase().includes("offline") || o.orderSource.toLowerCase().includes("pos") || o.orderSource.toLowerCase().includes("showroom")))
    );
    setOfflineOrders(filtered);
    setIsLoadingHistory(false);
  };

  // Filter Catalog Products
  const filteredProducts = useMemo(() => {
    return (adminProducts || []).filter((p: any) => {
      const matchSearch =
        !searchQuery ||
        (p.name && p.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.brand && p.brand.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.category && p.category.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchCategory =
        selectedCategory === "all" ||
        (p.category && p.category.toLowerCase() === selectedCategory.toLowerCase()) ||
        (p.categoryId && p.categoryId === selectedCategory);

      return matchSearch && matchCategory;
    });
  }, [adminProducts, searchQuery, selectedCategory]);

  // Cart Subtotal Calculation
  const subTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [cart]);

  // Calculated Discount
  const calculatedDiscount = useMemo(() => {
    const val = parseFloat(discountValue) || 0;
    if (val <= 0) return 0;
    if (discountType === "percent") {
      return Math.round((subTotal * val) / 100);
    }
    return Math.min(val, subTotal);
  }, [subTotal, discountValue, discountType]);

  // Calculated Final Total
  const grandTotal = useMemo(() => {
    const del = parseFloat(deliveryCharge) || 0;
    return Math.max(0, subTotal + del - calculatedDiscount);
  }, [subTotal, deliveryCharge, calculatedDiscount]);

  // Calculated Change Due
  const changeDue = useMemo(() => {
    if (paymentMethod !== "Cash") return 0;
    const received = parseFloat(cashReceived) || 0;
    return received > grandTotal ? received - grandTotal : 0;
  }, [paymentMethod, cashReceived, grandTotal]);

  // Add Item to Cart
  const handleAddToCart = (product: any) => {
    const variants = Array.isArray(product.variants) && product.variants.length > 0 ? product.variants : null;
    let selectedVariant = variants ? variants[0] : null;

    const chosenVariantId = selectedVariantMap[product.id];
    if (chosenVariantId && variants) {
      const found = variants.find((v: any) => v.id === chosenVariantId);
      if (found) selectedVariant = found;
    }

    const variantId = selectedVariant?.id || `reg-${product.id}`;
    const variantName = selectedVariant?.name || selectedVariant?.title || "Regular";
    const itemPrice = Number(selectedVariant?.discountPrice || selectedVariant?.price || product.discountPrice || product.price || 0);
    const itemStock = Number(selectedVariant?.stock ?? selectedVariant?.inventoryQuantity ?? product.stock ?? 50);
    const itemImage = selectedVariant?.imageUrl || product.imageUrl || "/images/placeholder-product.png";

    setCart(prev => {
      const existingIdx = prev.findIndex(item => item.productId === product.id && item.variantId === variantId);
      if (existingIdx > -1) {
        const updated = [...prev];
        updated[existingIdx].quantity += 1;
        return updated;
      } else {
        return [
          ...prev,
          {
            productId: product.id,
            variantId: variantId,
            productName: product.name,
            variantName: variantName,
            price: itemPrice,
            costPrice: Number(product.costPrice || 0),
            quantity: 1,
            stock: itemStock,
            imageUrl: itemImage
          }
        ];
      }
    });
  };

  // Stepper for Cart Quantity
  const handleUpdateQuantity = (index: number, delta: number) => {
    setCart(prev => {
      const updated = [...prev];
      const newQty = updated[index].quantity + delta;
      if (newQty <= 0) {
        return updated.filter((_, i) => i !== index);
      }
      updated[index].quantity = newQty;
      return updated;
    });
  };

  // Remove Item
  const handleRemoveItem = (index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  // Edit Item Unit Price
  const handleUpdatePrice = (index: number, newPriceStr: string) => {
    const p = parseFloat(newPriceStr) || 0;
    setCart(prev => {
      const updated = [...prev];
      updated[index].price = Math.max(0, p);
      return updated;
    });
  };

  // Preset Cash Amount Helper
  const handleSetExactCash = () => {
    setCashReceived(grandTotal.toString());
  };

  const handleAddCashPreset = (amount: number) => {
    const cur = parseFloat(cashReceived) || grandTotal;
    setCashReceived((cur + amount).toString());
  };

  // Complete POS Sale
  const handleCompleteSale = async () => {
    if (cart.length === 0) {
      alert("Please add at least one product to the sale cart.");
      return;
    }

    if (!isWalkIn && !customerPhone.trim()) {
      alert("Please enter customer phone number or select Walk-in Customer.");
      return;
    }

    setIsSubmitting(true);
    try {
      const salePayload = {
        customerName: isWalkIn ? "Walk-in Customer" : customerName.trim(),
        customerPhone: isWalkIn ? "Showroom Walk-in" : customerPhone.trim(),
        address: customerAddress || "Showroom Counter Pickup",
        items: cart.map(item => ({
          productId: item.productId,
          variantId: item.variantId,
          productName: item.productName,
          variantName: item.variantName,
          quantity: item.quantity,
          price: item.price,
          imageUrl: item.imageUrl
        })),
        subTotal,
        discount: calculatedDiscount,
        deliveryCharge: parseFloat(deliveryCharge) || 0,
        total: grandTotal,
        paymentMethod,
        cashReceived: paymentMethod === "Cash" ? (parseFloat(cashReceived) || grandTotal) : grandTotal,
        changeDue: paymentMethod === "Cash" ? changeDue : 0,
        notes: orderNotes || `POS Showroom sale (${paymentMethod})`,
        staffName: "GlowGoodly Counter Cashier"
      };

      const res = await fetch(`${API_BASE}/orders/offline`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader()
        },
        body: JSON.stringify(salePayload)
      });

      const data = await res.json();
      if (res.ok && data.success) {
        // Successful checkout!
        const createdOrder = data.order;
        setActiveReceipt(createdOrder);
        setShowReceiptModal(true);

        // Reset cart & form for next customer
        setCart([]);
        setIsWalkIn(true);
        setCustomerName("Walk-in Customer");
        setCustomerPhone("");
        setCustomerAddress("Showroom Counter");
        setOrderNotes("");
        setDiscountValue("0");
        setDeliveryCharge("0");
        setCashReceived("");

        // Refresh global state
        fetchOfflineOrdersList();
        if (fetchAdminProducts) fetchAdminProducts(true);
        if (fetchAdminOrders) fetchAdminOrders(true);
      } else {
        alert("Failed to complete sale: " + (data.error || "Unknown server error"));
      }
    } catch (err: any) {
      alert("Sale error: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Instant Thermal / Browser Print
  const handlePrintReceipt = () => {
    window.print();
  };

  // Filter History Orders
  const filteredHistory = useMemo(() => {
    return offlineOrders.filter(o => {
      const matchSearch =
        !historySearch ||
        (o.orderNumber && o.orderNumber.toLowerCase().includes(historySearch.toLowerCase())) ||
        (o.customerName && o.customerName.toLowerCase().includes(historySearch.toLowerCase())) ||
        (o.customerPhone && o.customerPhone.includes(historySearch));

      if (!matchSearch) return false;

      if (historyDateFilter === "today") {
        const orderDate = new Date(o.createdAt).toDateString();
        const today = new Date().toDateString();
        return orderDate === today;
      }

      if (historyDateFilter === "week") {
        const orderTime = new Date(o.createdAt).getTime();
        const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        return orderTime >= oneWeekAgo;
      }

      if (historyDateFilter === "month") {
        const orderTime = new Date(o.createdAt).getTime();
        const oneMonthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
        return orderTime >= oneMonthAgo;
      }

      return true;
    });
  }, [offlineOrders, historySearch, historyDateFilter]);

  // History KPIs
  const historyStats = useMemo(() => {
    const today = new Date().toDateString();
    let todaySales = 0;
    let totalSales = 0;
    let totalItems = 0;

    offlineOrders.forEach(o => {
      const amt = Number(o.total) || 0;
      totalSales += amt;
      if (new Date(o.createdAt).toDateString() === today) {
        todaySales += amt;
      }
      if (Array.isArray(o.orderItems)) {
        o.orderItems.forEach((i: any) => {
          totalItems += Number(i.quantity) || 1;
        });
      }
    });

    return {
      todaySales,
      totalSales,
      totalInvoices: offlineOrders.length,
      totalItems
    };
  }, [offlineOrders]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Print Isolated CSS Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #pos-print-area, #pos-print-area * {
            visibility: visible !important;
          }
          #pos-print-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 80mm !important;
            max-width: 100% !important;
            margin: 0 auto !important;
            padding: 10px !important;
            font-family: 'Courier New', Courier, monospace !important;
            color: #000 !important;
            background: #fff !important;
            box-shadow: none !important;
            border: none !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Header Banner & Sub-tab Switcher */}
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "12px",
          border: "1px solid #e2e8f0",
          padding: "20px 24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px",
          boxShadow: "0 2px 4px rgba(0,0,0,0.03)"
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span
              style={{
                backgroundColor: "#fdf2f8",
                color: "#e63b7a",
                padding: "8px",
                borderRadius: "10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <Store size={24} />
            </span>
            <div>
              <h1 style={{ fontSize: "20px", fontWeight: "900", color: "#0f172a", margin: 0 }}>
                🛍️ Offline Sales / POS Counter (শোরুম ও কাউন্টার সেল)
              </h1>
              <p style={{ fontSize: "13px", color: "#64748b", margin: "2px 0 0 0" }}>
                Make in-person counter sales, manage instant cash/digital payments, auto-deduct stock, and print POS cash memos.
              </p>
            </div>
          </div>
        </div>

        {/* Tab switchers */}
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <button
            onClick={() => setSubTab("pos")}
            style={{
              padding: "10px 18px",
              borderRadius: "8px",
              border: subTab === "pos" ? "2px solid #e63b7a" : "1px solid #cbd5e1",
              backgroundColor: subTab === "pos" ? "#e63b7a" : "#ffffff",
              color: subTab === "pos" ? "#ffffff" : "#475569",
              fontWeight: "800",
              fontSize: "13.5px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              boxShadow: subTab === "pos" ? "0 4px 10px rgba(230,59,122,0.25)" : "none",
              transition: "all 0.2s"
            }}
          >
            <ShoppingCart size={16} />
            <span>🛒 Billing Counter (নতুন সেল)</span>
          </button>

          <button
            onClick={() => {
              setSubTab("history");
              fetchOfflineOrdersList();
            }}
            style={{
              padding: "10px 18px",
              borderRadius: "8px",
              border: subTab === "history" ? "2px solid #0284c7" : "1px solid #cbd5e1",
              backgroundColor: subTab === "history" ? "#0284c7" : "#ffffff",
              color: subTab === "history" ? "#ffffff" : "#475569",
              fontWeight: "800",
              fontSize: "13.5px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              boxShadow: subTab === "history" ? "0 4px 10px rgba(2,132,199,0.25)" : "none",
              transition: "all 0.2s"
            }}
          >
            <Receipt size={16} />
            <span>📜 Sales History ({offlineOrders.length})</span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* SUB-TAB 1: POS BILLING COUNTER */}
      {/* ========================================================= */}
      {subTab === "pos" && (
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "20px", alignItems: "start" }}>
          {/* LEFT COLUMN: Catalog & Search */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* Search and Category Filter Bar */}
            <div
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "12px",
                border: "1px solid #e2e8f0",
                padding: "16px",
                display: "flex",
                flexDirection: "column",
                gap: "12px"
              }}
            >
              <div style={{ position: "relative" }}>
                <Search
                  size={18}
                  style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }}
                />
                <input
                  type="text"
                  placeholder="🔍 Search product name, brand, SKU or barcode..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px 14px 12px 42px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "14px",
                    outline: "none",
                    boxSizing: "border-box"
                  }}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    style={{
                      position: "absolute",
                      right: "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      border: "none",
                      background: "transparent",
                      color: "#94a3b8",
                      cursor: "pointer"
                    }}
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              {/* Category Pills */}
              <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "4px" }}>
                <button
                  onClick={() => setSelectedCategory("all")}
                  style={{
                    padding: "6px 14px",
                    borderRadius: "20px",
                    fontSize: "12px",
                    fontWeight: "700",
                    border: selectedCategory === "all" ? "1px solid #e63b7a" : "1px solid #e2e8f0",
                    backgroundColor: selectedCategory === "all" ? "#fdf2f8" : "#f8fafc",
                    color: selectedCategory === "all" ? "#be185d" : "#64748b",
                    cursor: "pointer",
                    whiteSpace: "nowrap"
                  }}
                >
                  All Items ({adminProducts.length})
                </button>
                {adminCategories.slice(0, 10).map((cat: any) => (
                  <button
                    key={cat.id || cat.name}
                    onClick={() => setSelectedCategory(cat.name)}
                    style={{
                      padding: "6px 14px",
                      borderRadius: "20px",
                      fontSize: "12px",
                      fontWeight: "700",
                      border: selectedCategory === cat.name ? "1px solid #e63b7a" : "1px solid #e2e8f0",
                      backgroundColor: selectedCategory === cat.name ? "#fdf2f8" : "#f8fafc",
                      color: selectedCategory === cat.name ? "#be185d" : "#64748b",
                      cursor: "pointer",
                      whiteSpace: "nowrap"
                    }}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Product Grid / Catalog */}
            <div
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "12px",
                border: "1px solid #e2e8f0",
                padding: "16px",
                maxHeight: "720px",
                overflowY: "auto"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                <span style={{ fontSize: "13px", fontWeight: "800", color: "#475569" }}>
                  📦 Available Products Catalog ({filteredProducts.length})
                </span>
                <button
                  onClick={() => fetchAdminProducts(true)}
                  style={{
                    border: "none",
                    background: "transparent",
                    color: "#0284c7",
                    fontSize: "12px",
                    fontWeight: "700",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    cursor: "pointer"
                  }}
                >
                  <RefreshCw size={13} /> Sync Catalog
                </button>
              </div>

              {filteredProducts.length === 0 ? (
                <div style={{ textAlign: "center", padding: "50px 20px", color: "#94a3b8" }}>
                  <Store size={40} style={{ margin: "0 auto 10px auto", opacity: 0.5 }} />
                  <p style={{ fontWeight: "700", fontSize: "15px" }}>No products matched your search</p>
                  <p style={{ fontSize: "12.5px" }}>Try typing a different name or clear the filter.</p>
                </div>
              ) : (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))",
                    gap: "14px"
                  }}
                >
                  {filteredProducts.map((p: any) => {
                    const variants = Array.isArray(p.variants) && p.variants.length > 0 ? p.variants : null;
                    const chosenVariantId = selectedVariantMap[p.id] || (variants ? variants[0]?.id : null);
                    const activeVariant = variants ? variants.find((v: any) => v.id === chosenVariantId) || variants[0] : null;

                    const price = Number(activeVariant?.discountPrice || activeVariant?.price || p.discountPrice || p.price || 0);
                    const originalPrice = Number(activeVariant?.price || p.price || 0);
                    const stock = Number(activeVariant?.stock ?? activeVariant?.inventoryQuantity ?? p.stock ?? 50);
                    const isOutOfStock = stock <= 0;
                    const imgUrl = activeVariant?.imageUrl || p.imageUrl || "/images/placeholder-product.png";

                    return (
                      <div
                        key={p.id}
                        style={{
                          borderRadius: "10px",
                          border: "1px solid #e2e8f0",
                          backgroundColor: "#f8fafc",
                          overflow: "hidden",
                          display: "flex",
                          flexDirection: "column",
                          transition: "transform 0.15s, box-shadow 0.15s",
                          position: "relative"
                        }}
                      >
                        {/* Thumbnail */}
                        <div
                          style={{
                            height: "130px",
                            backgroundColor: "#fff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            position: "relative",
                            borderBottom: "1px solid #f1f5f9"
                          }}
                        >
                          <img
                            src={imgUrl}
                            alt={p.name}
                            style={{
                              maxHeight: "100%",
                              maxWidth: "100%",
                              objectFit: "contain",
                              padding: "6px"
                            }}
                            onError={(e: any) => {
                              e.target.src = "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=200&q=80";
                            }}
                          />
                          {/* Stock badge */}
                          <span
                            style={{
                              position: "absolute",
                              top: "6px",
                              right: "6px",
                              backgroundColor: isOutOfStock ? "#fee2e2" : stock < 10 ? "#fef3c7" : "#dcfce7",
                              color: isOutOfStock ? "#b91c1c" : stock < 10 ? "#b45309" : "#15803d",
                              fontSize: "10.5px",
                              fontWeight: "800",
                              padding: "2px 6px",
                              borderRadius: "4px"
                            }}
                          >
                            {isOutOfStock ? "Out of Stock" : `Stock: ${stock}`}
                          </span>
                        </div>

                        {/* Info & Variants */}
                        <div style={{ padding: "10px", display: "flex", flexDirection: "column", flex: 1, gap: "6px" }}>
                          <div
                            style={{
                              fontSize: "12.5px",
                              fontWeight: "700",
                              color: "#1e293b",
                              lineHeight: "1.3",
                              minHeight: "34px",
                              overflow: "hidden",
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical"
                            }}
                            title={p.name}
                          >
                            {p.name}
                          </div>

                          {/* Variant dropdown if multiple exist */}
                          {variants && variants.length > 1 && (
                            <select
                              value={chosenVariantId || ""}
                              onChange={e =>
                                setSelectedVariantMap(prev => ({
                                  ...prev,
                                  [p.id]: e.target.value
                                }))
                              }
                              style={{
                                width: "100%",
                                padding: "4px 6px",
                                borderRadius: "4px",
                                border: "1px solid #cbd5e1",
                                fontSize: "11px",
                                backgroundColor: "#ffffff",
                                color: "#334155"
                              }}
                            >
                              {variants.map((v: any) => (
                                <option key={v.id} value={v.id}>
                                  {v.name || v.title || "Shade"} (৳{v.discountPrice || v.price})
                                </option>
                              ))}
                            </select>
                          )}

                          {/* Price Tag */}
                          <div style={{ display: "flex", alignItems: "baseline", gap: "6px", marginTop: "auto" }}>
                            <span style={{ fontSize: "15px", fontWeight: "900", color: "#e63b7a" }}>
                              ৳{price}
                            </span>
                            {originalPrice > price && (
                              <span style={{ fontSize: "11px", color: "#94a3b8", textDecoration: "line-through" }}>
                                ৳{originalPrice}
                              </span>
                            )}
                          </div>

                          {/* Add to Cart button */}
                          <button
                            disabled={isOutOfStock}
                            onClick={() => handleAddToCart(p)}
                            style={{
                              width: "100%",
                              padding: "8px",
                              borderRadius: "6px",
                              border: "none",
                              backgroundColor: isOutOfStock ? "#cbd5e1" : "#10b981",
                              color: "#ffffff",
                              fontSize: "12px",
                              fontWeight: "800",
                              cursor: isOutOfStock ? "not-allowed" : "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "4px",
                              transition: "background 0.2s"
                            }}
                          >
                            <Plus size={14} /> Add to Bill
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Active POS Register & Checkout */}
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "12px",
              border: "1px solid #e2e8f0",
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              gap: "18px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
              position: "sticky",
              top: "20px"
            }}
          >
            {/* Customer Info Box */}
            <div
              style={{
                backgroundColor: "#f8fafc",
                borderRadius: "8px",
                border: "1px solid #e2e8f0",
                padding: "12px"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <span style={{ fontSize: "13px", fontWeight: "800", color: "#1e293b", display: "flex", alignItems: "center", gap: "6px" }}>
                  <User size={15} style={{ color: "#e63b7a" }} /> Customer Details
                </span>
                <label style={{ fontSize: "12px", fontWeight: "700", color: "#475569", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
                  <input
                    type="checkbox"
                    checked={isWalkIn}
                    onChange={e => {
                      setIsWalkIn(e.target.checked);
                      if (e.target.checked) {
                        setCustomerName("Walk-in Customer");
                        setCustomerPhone("");
                      }
                    }}
                  />
                  Walk-in Customer
                </label>
              </div>

              {!isWalkIn && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  <div>
                    <label style={{ fontSize: "11px", fontWeight: "700", color: "#64748b" }}>Name *</label>
                    <input
                      type="text"
                      placeholder="Customer Name"
                      value={customerName}
                      onChange={e => setCustomerName(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "7px 10px",
                        borderRadius: "6px",
                        border: "1px solid #cbd5e1",
                        fontSize: "12px",
                        boxSizing: "border-box"
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: "11px", fontWeight: "700", color: "#64748b" }}>Phone *</label>
                    <input
                      type="tel"
                      placeholder="017xxxxxxxx"
                      value={customerPhone}
                      onChange={e => setCustomerPhone(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "7px 10px",
                        borderRadius: "6px",
                        border: "1px solid #cbd5e1",
                        fontSize: "12px",
                        boxSizing: "border-box"
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Cart Items List */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <span style={{ fontSize: "13px", fontWeight: "800", color: "#1e293b" }}>
                  🛒 Current Bill Items ({cart.reduce((a, b) => a + b.quantity, 0)})
                </span>
                {cart.length > 0 && (
                  <button
                    onClick={() => setCart([])}
                    style={{
                      border: "none",
                      background: "transparent",
                      color: "#ef4444",
                      fontSize: "11px",
                      fontWeight: "700",
                      cursor: "pointer"
                    }}
                  >
                    Clear Bill
                  </button>
                )}
              </div>

              <div
                style={{
                  maxHeight: "260px",
                  overflowY: "auto",
                  border: "1px solid #f1f5f9",
                  borderRadius: "8px",
                  backgroundColor: "#fafafa"
                }}
              >
                {cart.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "30px 10px", color: "#94a3b8" }}>
                    <ShoppingCart size={32} style={{ margin: "0 auto 6px auto", opacity: 0.4 }} />
                    <p style={{ fontSize: "13px", fontWeight: "700" }}>Bill is currently empty</p>
                    <p style={{ fontSize: "11px" }}>Select products from the catalog on the left to add items.</p>
                  </div>
                ) : (
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                    <thead>
                      <tr style={{ backgroundColor: "#f1f5f9", color: "#475569", textAlign: "left", fontSize: "11px" }}>
                        <th style={{ padding: "8px 10px" }}>Item</th>
                        <th style={{ padding: "8px 4px", textAlign: "center" }}>Qty</th>
                        <th style={{ padding: "8px 10px", textAlign: "right" }}>Total</th>
                        <th style={{ padding: "8px 6px", textAlign: "center" }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {cart.map((item, idx) => (
                        <tr key={`${item.productId}-${item.variantId}`} style={{ borderBottom: "1px solid #e2e8f0" }}>
                          <td style={{ padding: "8px 10px" }}>
                            <div style={{ fontWeight: "700", color: "#1e293b", lineHeight: "1.2" }}>{item.productName}</div>
                            {item.variantName && item.variantName !== "Regular" && (
                              <div style={{ fontSize: "10.5px", color: "#e63b7a", fontWeight: "700" }}>{item.variantName}</div>
                            )}
                            <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>৳{item.price} each</div>
                          </td>
                          <td style={{ padding: "8px 4px", textAlign: "center" }}>
                            <div style={{ display: "inline-flex", alignItems: "center", border: "1px solid #cbd5e1", borderRadius: "4px" }}>
                              <button
                                onClick={() => handleUpdateQuantity(idx, -1)}
                                style={{ border: "none", background: "#f8fafc", padding: "4px 6px", cursor: "pointer" }}
                              >
                                <Minus size={11} />
                              </button>
                              <span style={{ padding: "0 8px", fontWeight: "800", fontSize: "12px" }}>{item.quantity}</span>
                              <button
                                onClick={() => handleUpdateQuantity(idx, 1)}
                                style={{ border: "none", background: "#f8fafc", padding: "4px 6px", cursor: "pointer" }}
                              >
                                <Plus size={11} />
                              </button>
                            </div>
                          </td>
                          <td style={{ padding: "8px 10px", textAlign: "right", fontWeight: "800", color: "#0f172a" }}>
                            ৳{item.price * item.quantity}
                          </td>
                          <td style={{ padding: "8px 6px", textAlign: "center" }}>
                            <button
                              onClick={() => handleRemoveItem(idx)}
                              style={{ border: "none", background: "transparent", color: "#ef4444", cursor: "pointer", padding: "2px" }}
                            >
                              <Trash2 size={13} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* Calculations & Discount Box */}
            <div
              style={{
                backgroundColor: "#f8fafc",
                borderRadius: "8px",
                border: "1px solid #e2e8f0",
                padding: "12px",
                display: "flex",
                flexDirection: "column",
                gap: "8px"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px", color: "#475569" }}>
                <span>Subtotal:</span>
                <span style={{ fontWeight: "700", color: "#0f172a" }}>৳{subTotal}</span>
              </div>

              {/* Discount Row */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "12.5px", color: "#475569" }}>Discount:</span>
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <select
                    value={discountType}
                    onChange={(e: any) => setDiscountType(e.target.value)}
                    style={{ padding: "4px", borderRadius: "4px", border: "1px solid #cbd5e1", fontSize: "11px" }}
                  >
                    <option value="flat">৳ Flat</option>
                    <option value="percent">% Off</option>
                  </select>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={discountValue}
                    onChange={e => setDiscountValue(e.target.value)}
                    style={{
                      width: "70px",
                      padding: "4px 8px",
                      borderRadius: "4px",
                      border: "1px solid #cbd5e1",
                      fontSize: "12px",
                      textAlign: "right"
                    }}
                  />
                  {calculatedDiscount > 0 && (
                    <span style={{ fontSize: "12px", fontWeight: "700", color: "#ef4444" }}>
                      (-৳{calculatedDiscount})
                    </span>
                  )}
                </div>
              </div>

              {/* Grand Total */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  borderTop: "1px dashed #cbd5e1",
                  paddingTop: "8px",
                  marginTop: "4px"
                }}
              >
                <span style={{ fontSize: "15px", fontWeight: "900", color: "#0f172a" }}>Grand Total:</span>
                <span style={{ fontSize: "20px", fontWeight: "900", color: "#e63b7a" }}>৳{grandTotal}</span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div>
              <label style={{ fontSize: "12px", fontWeight: "800", color: "#334155", display: "block", marginBottom: "6px" }}>
                Payment Method
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "6px" }}>
                {[
                  { id: "Cash", label: "💵 Cash" },
                  { id: "bKash", label: "📱 bKash" },
                  { id: "Nagad", label: "🟠 Nagad" },
                  { id: "Card", label: "💳 Card" }
                ].map(m => (
                  <button
                    key={m.id}
                    onClick={() => setPaymentMethod(m.id)}
                    style={{
                      padding: "8px 4px",
                      borderRadius: "6px",
                      border: paymentMethod === m.id ? "2px solid #e63b7a" : "1px solid #cbd5e1",
                      backgroundColor: paymentMethod === m.id ? "#fdf2f8" : "#ffffff",
                      color: paymentMethod === m.id ? "#be185d" : "#475569",
                      fontWeight: "800",
                      fontSize: "12px",
                      cursor: "pointer"
                    }}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Cash Tender & Change Due Section (when Cash is selected) */}
            {paymentMethod === "Cash" && (
              <div
                style={{
                  backgroundColor: "#f0fdf4",
                  borderRadius: "8px",
                  border: "1px solid #bbf7d0",
                  padding: "12px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <label style={{ fontSize: "12px", fontWeight: "800", color: "#166534" }}>
                    Cash Received (৳):
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder={grandTotal.toString()}
                    value={cashReceived}
                    onChange={e => setCashReceived(e.target.value)}
                    style={{
                      width: "110px",
                      padding: "6px 8px",
                      borderRadius: "6px",
                      border: "1px solid #86efac",
                      fontSize: "14px",
                      fontWeight: "800",
                      textAlign: "right",
                      backgroundColor: "#ffffff"
                    }}
                  />
                </div>

                {/* Quick Presets */}
                <div style={{ display: "flex", gap: "6px" }}>
                  <button
                    onClick={handleSetExactCash}
                    style={{
                      flex: 1,
                      padding: "4px",
                      borderRadius: "4px",
                      border: "1px solid #86efac",
                      background: "#ffffff",
                      fontSize: "11px",
                      fontWeight: "700",
                      color: "#166534",
                      cursor: "pointer"
                    }}
                  >
                    Exact (৳{grandTotal})
                  </button>
                  {[100, 500, 1000].map(add => (
                    <button
                      key={add}
                      onClick={() => handleAddCashPreset(add)}
                      style={{
                        padding: "4px 8px",
                        borderRadius: "4px",
                        border: "1px solid #86efac",
                        background: "#ffffff",
                        fontSize: "11px",
                        fontWeight: "700",
                        color: "#166534",
                        cursor: "pointer"
                      }}
                    >
                      +{add}
                    </button>
                  ))}
                </div>

                {/* Change Due Box */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    backgroundColor: "#dcfce7",
                    padding: "8px 10px",
                    borderRadius: "6px",
                    marginTop: "2px"
                  }}
                >
                  <span style={{ fontSize: "13px", fontWeight: "800", color: "#166534" }}>
                    Change Return (ফেরত দিন):
                  </span>
                  <span style={{ fontSize: "16px", fontWeight: "900", color: "#15803d" }}>
                    ৳{changeDue}
                  </span>
                </div>
              </div>
            )}

            {/* Complete Sale Action Button */}
            <button
              disabled={isSubmitting || cart.length === 0}
              onClick={handleCompleteSale}
              style={{
                width: "100%",
                padding: "14px",
                borderRadius: "8px",
                border: "none",
                backgroundColor: cart.length === 0 ? "#cbd5e1" : "#e63b7a",
                color: "#ffffff",
                fontSize: "15px",
                fontWeight: "900",
                cursor: cart.length === 0 ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                boxShadow: cart.length > 0 ? "0 4px 14px rgba(230,59,122,0.35)" : "none",
                transition: "background 0.2s"
              }}
            >
              {isSubmitting ? (
                <>
                  <RefreshCw size={18} className="spin" /> Processing Sale...
                </>
              ) : (
                <>
                  <Printer size={18} /> Complete Sale & Print Receipt ⚡
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SUB-TAB 2: OFFLINE SALES HISTORY */}
      {/* ========================================================= */}
      {subTab === "history" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* KPI Summary Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "14px" }}>
            <div
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "10px",
                border: "1px solid #e2e8f0",
                padding: "16px 20px",
                display: "flex",
                alignItems: "center",
                gap: "14px"
              }}
            >
              <span
                style={{
                  backgroundColor: "#fdf2f8",
                  color: "#e63b7a",
                  padding: "12px",
                  borderRadius: "10px"
                }}
              >
                <DollarSign size={24} />
              </span>
              <div>
                <div style={{ fontSize: "12px", color: "#64748b", fontWeight: "700" }}>Today's Offline Revenue</div>
                <div style={{ fontSize: "22px", fontWeight: "900", color: "#0f172a" }}>৳{historyStats.todaySales}</div>
              </div>
            </div>

            <div
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "10px",
                border: "1px solid #e2e8f0",
                padding: "16px 20px",
                display: "flex",
                alignItems: "center",
                gap: "14px"
              }}
            >
              <span
                style={{
                  backgroundColor: "#eff6ff",
                  color: "#2563eb",
                  padding: "12px",
                  borderRadius: "10px"
                }}
              >
                <Receipt size={24} />
              </span>
              <div>
                <div style={{ fontSize: "12px", color: "#64748b", fontWeight: "700" }}>Total Offline Invoices</div>
                <div style={{ fontSize: "22px", fontWeight: "900", color: "#0f172a" }}>{historyStats.totalInvoices}</div>
              </div>
            </div>

            <div
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "10px",
                border: "1px solid #e2e8f0",
                padding: "16px 20px",
                display: "flex",
                alignItems: "center",
                gap: "14px"
              }}
            >
              <span
                style={{
                  backgroundColor: "#f0fdf4",
                  color: "#16a34a",
                  padding: "12px",
                  borderRadius: "10px"
                }}
              >
                <ShoppingCart size={24} />
              </span>
              <div>
                <div style={{ fontSize: "12px", color: "#64748b", fontWeight: "700" }}>Total Lifetime Offline Sales</div>
                <div style={{ fontSize: "22px", fontWeight: "900", color: "#0f172a" }}>৳{historyStats.totalSales}</div>
              </div>
            </div>

            <div
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "10px",
                border: "1px solid #e2e8f0",
                padding: "16px 20px",
                display: "flex",
                alignItems: "center",
                gap: "14px"
              }}
            >
              <span
                style={{
                  backgroundColor: "#faf5ff",
                  color: "#9333ea",
                  padding: "12px",
                  borderRadius: "10px"
                }}
              >
                <Store size={24} />
              </span>
              <div>
                <div style={{ fontSize: "12px", color: "#64748b", fontWeight: "700" }}>Items Sold Offline</div>
                <div style={{ fontSize: "22px", fontWeight: "900", color: "#0f172a" }}>{historyStats.totalItems}</div>
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "12px",
              border: "1px solid #e2e8f0",
              padding: "20px"
            }}
          >
            {/* Filter Bar */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "12px",
                marginBottom: "16px"
              }}
            >
              <div style={{ display: "flex", gap: "10px", alignItems: "center", flex: 1, minWidth: "260px" }}>
                <div style={{ position: "relative", width: "100%", maxWidth: "340px" }}>
                  <Search
                    size={16}
                    style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }}
                  />
                  <input
                    type="text"
                    placeholder="Search by invoice #, customer name, phone..."
                    value={historySearch}
                    onChange={e => setHistorySearch(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 12px 8px 36px",
                      borderRadius: "6px",
                      border: "1px solid #cbd5e1",
                      fontSize: "13px",
                      boxSizing: "border-box"
                    }}
                  />
                </div>

                {/* Date Filter Buttons */}
                <div style={{ display: "flex", gap: "4px" }}>
                  {(["all", "today", "week", "month"] as const).map(f => (
                    <button
                      key={f}
                      onClick={() => setHistoryDateFilter(f)}
                      style={{
                        padding: "6px 12px",
                        borderRadius: "6px",
                        border: historyDateFilter === f ? "1px solid #0284c7" : "1px solid #e2e8f0",
                        backgroundColor: historyDateFilter === f ? "#e0f2fe" : "#f8fafc",
                        color: historyDateFilter === f ? "#0369a1" : "#64748b",
                        fontSize: "12px",
                        fontWeight: "700",
                        cursor: "pointer",
                        textTransform: "capitalize"
                      }}
                    >
                      {f === "all" ? "All Time" : f}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={fetchOfflineOrdersList}
                style={{
                  padding: "8px 14px",
                  borderRadius: "6px",
                  border: "1px solid #cbd5e1",
                  background: "#ffffff",
                  color: "#475569",
                  fontSize: "12px",
                  fontWeight: "700",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px"
                }}
              >
                <RefreshCw size={13} /> Refresh List
              </button>
            </div>

            {/* Sales Table */}
            {filteredHistory.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 20px", color: "#94a3b8" }}>
                <Receipt size={40} style={{ margin: "0 auto 10px auto", opacity: 0.4 }} />
                <p style={{ fontWeight: "800", fontSize: "16px", color: "#475569" }}>No offline sales records found</p>
                <p style={{ fontSize: "13px" }}>Switch to the Billing Counter to make your first in-store showroom sale.</p>
                <button
                  onClick={() => setSubTab("pos")}
                  style={{
                    backgroundColor: "#e63b7a",
                    color: "#ffffff",
                    border: "none",
                    padding: "10px 18px",
                    borderRadius: "6px",
                    fontWeight: "800",
                    fontSize: "13px",
                    cursor: "pointer",
                    marginTop: "10px"
                  }}
                >
                  🛒 Open POS Billing Counter
                </button>
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                  <thead>
                    <tr style={{ backgroundColor: "#f8fafc", color: "#475569", textAlign: "left", borderBottom: "1px solid #e2e8f0" }}>
                      <th style={{ padding: "12px 14px", fontWeight: "800" }}>Invoice No</th>
                      <th style={{ padding: "12px 14px", fontWeight: "800" }}>Date & Time</th>
                      <th style={{ padding: "12px 14px", fontWeight: "800" }}>Customer</th>
                      <th style={{ padding: "12px 14px", fontWeight: "800" }}>Items Sold</th>
                      <th style={{ padding: "12px 14px", fontWeight: "800" }}>Payment</th>
                      <th style={{ padding: "12px 14px", fontWeight: "800", textAlign: "right" }}>Total (৳)</th>
                      <th style={{ padding: "12px 14px", fontWeight: "800", textAlign: "center" }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredHistory.map(o => (
                      <tr key={o.id || o.orderNumber} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "12px 14px", fontWeight: "800", color: "#0f172a" }}>
                          <span style={{ backgroundColor: "#f1f5f9", padding: "4px 8px", borderRadius: "4px", fontSize: "12px" }}>
                            {o.orderNumber}
                          </span>
                        </td>
                        <td style={{ padding: "12px 14px", color: "#64748b", fontSize: "12px" }}>
                          {new Date(o.createdAt).toLocaleString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </td>
                        <td style={{ padding: "12px 14px" }}>
                          <div style={{ fontWeight: "700", color: "#1e293b" }}>{o.customerName || "Walk-in Customer"}</div>
                          {o.customerPhone && o.customerPhone !== "Showroom Walk-in" && (
                            <div style={{ fontSize: "11px", color: "#64748b" }}>{o.customerPhone}</div>
                          )}
                        </td>
                        <td style={{ padding: "12px 14px" }}>
                          <div style={{ maxWidth: "260px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontSize: "12px", color: "#334155" }}>
                            {Array.isArray(o.orderItems)
                              ? o.orderItems.map((i: any) => `${i.productName} (x${i.quantity})`).join(", ")
                              : "Items"}
                          </div>
                          <span style={{ fontSize: "11px", color: "#94a3b8" }}>
                            {o.orderItems?.length || 0} items
                          </span>
                        </td>
                        <td style={{ padding: "12px 14px" }}>
                          <span
                            style={{
                              backgroundColor: o.paymentMethod === "Cash" ? "#dcfce7" : "#e0f2fe",
                              color: o.paymentMethod === "Cash" ? "#166534" : "#0369a1",
                              padding: "3px 8px",
                              borderRadius: "4px",
                              fontSize: "11px",
                              fontWeight: "800"
                            }}
                          >
                            {o.paymentMethod || "Cash"}
                          </span>
                        </td>
                        <td style={{ padding: "12px 14px", textAlign: "right", fontWeight: "900", color: "#e63b7a", fontSize: "14px" }}>
                          ৳{o.total}
                        </td>
                        <td style={{ padding: "12px 14px", textAlign: "center" }}>
                          <button
                            onClick={() => {
                              setActiveReceipt(o);
                              setShowReceiptModal(true);
                            }}
                            style={{
                              padding: "6px 12px",
                              borderRadius: "6px",
                              border: "1px solid #cbd5e1",
                              backgroundColor: "#ffffff",
                              color: "#0f172a",
                              fontWeight: "700",
                              fontSize: "11.5px",
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px"
                            }}
                          >
                            <Printer size={13} /> Reprint
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* THERMAL 80MM / A4 POS CASH MEMO MODAL */}
      {/* ========================================================= */}
      {showReceiptModal && activeReceipt && (
        <div
          className="no-print"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(15,23,42,0.6)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px"
          }}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "12px",
              maxWidth: "420px",
              width: "100%",
              maxHeight: "92vh",
              overflowY: "auto",
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
              display: "flex",
              flexDirection: "column"
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: "16px 20px",
                borderBottom: "1px solid #e2e8f0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <CheckCircle size={20} style={{ color: "#10b981" }} />
                <span style={{ fontSize: "15px", fontWeight: "900", color: "#0f172a" }}>
                  Sale Completed Successfully!
                </span>
              </div>
              <button
                onClick={() => setShowReceiptModal(false)}
                style={{ border: "none", background: "transparent", color: "#94a3b8", cursor: "pointer" }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Receipt Preview Area (Target of window.print via id="pos-print-area") */}
            <div
              id="pos-print-area"
              ref={receiptPrintRef}
              style={{
                padding: "24px",
                fontFamily: "'Courier New', Courier, monospace",
                fontSize: "12px",
                lineHeight: "1.4",
                color: "#000000",
                backgroundColor: "#ffffff"
              }}
            >
              {/* Receipt Header */}
              <div style={{ textAlign: "center", marginBottom: "14px", borderBottom: "1px dashed #000", paddingBottom: "10px" }}>
                <div style={{ fontSize: "18px", fontWeight: "bold", letterSpacing: "1px" }}>GLOWGOODLY</div>
                <div style={{ fontSize: "11px" }}>AUTHENTIC BEAUTY & COSMETICS</div>
                <div style={{ fontSize: "10px", marginTop: "2px" }}>Showroom & Online Retail Counter</div>
                <div style={{ fontSize: "10px" }}>Hotline: 01332-965888 | 01898-842240</div>
                <div style={{ fontSize: "10px" }}>Web: shop.glowgoodly.com</div>
              </div>

              {/* Receipt Metadata */}
              <div style={{ marginBottom: "10px", fontSize: "11px" }}>
                <div><strong>Invoice :</strong> {activeReceipt.orderNumber}</div>
                <div><strong>Date    :</strong> {new Date(activeReceipt.createdAt).toLocaleString()}</div>
                <div><strong>Cashier :</strong> {activeReceipt.staffName || "Counter Staff"}</div>
                <div><strong>Customer:</strong> {activeReceipt.customerName || "Walk-in"}</div>
                {activeReceipt.customerPhone && activeReceipt.customerPhone !== "Showroom Walk-in" && (
                  <div><strong>Phone   :</strong> {activeReceipt.customerPhone}</div>
                )}
              </div>

              {/* Table of Items */}
              <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "10px", fontSize: "11px" }}>
                <thead>
                  <tr style={{ borderTop: "1px dashed #000", borderBottom: "1px dashed #000" }}>
                    <th style={{ textAlign: "left", padding: "4px 0" }}>ITEM</th>
                    <th style={{ textAlign: "center", padding: "4px 0" }}>QTY</th>
                    <th style={{ textAlign: "right", padding: "4px 0" }}>PRICE</th>
                    <th style={{ textAlign: "right", padding: "4px 0" }}>TOTAL</th>
                  </tr>
                </thead>
                <tbody>
                  {(activeReceipt.orderItems || []).map((it: any, i: number) => (
                    <tr key={i} style={{ borderBottom: "1px dotted #ccc" }}>
                      <td style={{ padding: "4px 0" }}>
                        <div>{it.productName}</div>
                        {it.variantName && it.variantName !== "Regular" && (
                          <div style={{ fontSize: "9px" }}>({it.variantName})</div>
                        )}
                      </td>
                      <td style={{ textAlign: "center", padding: "4px 0" }}>{it.quantity}</td>
                      <td style={{ textAlign: "right", padding: "4px 0" }}>৳{it.price}</td>
                      <td style={{ textAlign: "right", padding: "4px 0" }}>৳{it.price * it.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals */}
              <div style={{ borderTop: "1px dashed #000", paddingTop: "6px", fontSize: "11px" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Subtotal:</span>
                  <span>৳{activeReceipt.subTotal}</span>
                </div>
                {Number(activeReceipt.discount) > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Discount:</span>
                    <span>-৳{activeReceipt.discount}</span>
                  </div>
                )}
                {Number(activeReceipt.deliveryCharge) > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Delivery/Bag:</span>
                    <span>৳{activeReceipt.deliveryCharge}</span>
                  </div>
                )}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "14px",
                    fontWeight: "bold",
                    borderTop: "1px solid #000",
                    borderBottom: "1px solid #000",
                    padding: "4px 0",
                    margin: "4px 0"
                  }}
                >
                  <span>GRAND TOTAL:</span>
                  <span>৳{activeReceipt.total}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Payment Method:</span>
                  <span>{activeReceipt.paymentMethod || "Cash"}</span>
                </div>
                {activeReceipt.paymentMethod === "Cash" && (
                  <>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>Cash Paid:</span>
                      <span>৳{activeReceipt.cashReceived || activeReceipt.total}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>Change Returned:</span>
                      <span>৳{activeReceipt.changeDue || 0}</span>
                    </div>
                  </>
                )}
              </div>

              {/* Receipt Footer */}
              <div style={{ textAlign: "center", marginTop: "16px", borderTop: "1px dashed #000", paddingTop: "10px", fontSize: "10px" }}>
                <div style={{ fontWeight: "bold" }}>THANK YOU FOR SHOPPING!</div>
                <div>100% Authentic Cosmetics Guaranteed</div>
                <div style={{ marginTop: "4px" }}>Exchange allowed within 3 days with this memo in intact condition.</div>
                <div style={{ marginTop: "8px", letterSpacing: "4px", fontSize: "12px", fontWeight: "bold" }}>
                  * * * * * * * *
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div
              style={{
                padding: "16px 20px",
                borderTop: "1px solid #e2e8f0",
                display: "flex",
                gap: "10px"
              }}
            >
              <button
                onClick={handlePrintReceipt}
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: "8px",
                  border: "none",
                  backgroundColor: "#e63b7a",
                  color: "#ffffff",
                  fontSize: "14px",
                  fontWeight: "900",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px"
                }}
              >
                <Printer size={16} /> Print Cash Memo (প্রিন্ট করুন)
              </button>
              <button
                onClick={() => setShowReceiptModal(false)}
                style={{
                  padding: "12px 18px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  backgroundColor: "#ffffff",
                  color: "#475569",
                  fontSize: "14px",
                  fontWeight: "700",
                  cursor: "pointer"
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
