"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import MobileNavbar from "../../components/MobileNavbar";
import { useApp } from "../../context/AppContext";
import { API_BASE } from "../../utils/api";

export default function CustomerAccountPage() {
  const { user, logout, wishlist, toggleWishlist, updateUser } = useApp();
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"wishlist" | "profile" | "address" | "orders">("wishlist");

  // Customer Address Management State
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressInput, setAddressInput] = useState(user?.address || "");
  const [cityInput, setCityInput] = useState(user?.city || "Dhaka");
  const [areaInput, setAreaInput] = useState(user?.area || "");
  const [savingAddress, setSavingAddress] = useState(false);

  useEffect(() => {
    if (user) {
      setAddressInput(user.address || "");
      setCityInput(user.city || "Dhaka");
      setAreaInput(user.area || "");
    }
  }, [user]);

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("glowgoodly_token") || localStorage.getItem("gg_token");
    if (!token) return;
    setSavingAddress(true);
    try {
      const res = await fetch(`${API_BASE}/auth/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          address: addressInput,
          city: cityInput,
          area: areaInput
        })
      });
      const data = await res.json();
      if (res.ok) {
        updateUser(data.user);
        setShowAddressForm(false);
        alert("Shipping address updated successfully!");
      } else {
        alert(data.error || "Failed to update address");
      }
    } catch (e: any) {
      alert("Error updating address: " + e.message);
    } finally {
      setSavingAddress(false);
    }
  };

  // 1-Hour Order Edit States & Live Timer Tick
  const [nowMs, setNowMs] = useState(Date.now());
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ customerName: "", customerPhone: "", address: "" });

  useEffect(() => {
    const timer = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);


  useEffect(() => {
    const fetchAccountData = async () => {
      const token = localStorage.getItem("glowgoodly_token") || localStorage.getItem("gg_token");
      try {
        const prodRes = await fetch(`${API_BASE}/products`);
        if (prodRes.ok) setProducts(await prodRes.json());

        if (token) {
          const res = await fetch(`${API_BASE}/orders/my-orders`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            setOrders(data);
          }
        }
      } catch (e) {
        console.error("Error fetching account data", e);
      } finally {
        setLoading(false);
      }
    };

    fetchAccountData();
  }, [user]);

  if (!user && !loading) {
    return (
      <>
        <Header />
        <main className="container" style={{ padding: "80px 20px", textAlign: "center", minHeight: "65vh" }}>
          <div style={{ backgroundColor: "#ffffff", padding: "40px", borderRadius: "12px", border: "1px solid #edf2f7", maxWidth: "480px", margin: "0 auto", boxShadow: "0 4px 15px rgba(0,0,0,0.03)" }}>
            <h2 style={{ fontSize: "22px", fontWeight: "900", color: "#0e1e38", marginBottom: "12px" }}>Access Required</h2>
            <p style={{ fontSize: "14px", color: "#718096", fontWeight: "600", marginBottom: "25px" }}>
              Please login to view your order history and track live parcel deliveries.
            </p>
            <Link 
              href="/login" 
              style={{ display: "inline-block", backgroundColor: "#e52860", color: "#ffffff", padding: "12px 30px", borderRadius: "30px", fontWeight: "800", fontSize: "14px", textDecoration: "none" }}
            >
              LOGIN OR SIGN UP
            </Link>
          </div>
        </main>
        <Footer />
        <MobileNavbar />
      </>
    );
  }

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case "Delivered":
        return { backgroundColor: "#e6f4ea", color: "#137333", border: "1px solid #ceead6" };
      case "Shipped":
      case "Send to Delivery":
        return { backgroundColor: "#e8f0fe", color: "#1a73e8", border: "1px solid #d2e3fc" };
      case "Processing":
        return { backgroundColor: "#fef7e0", color: "#b06000", border: "1px solid #feefc3" };
      case "Cancelled":
        return { backgroundColor: "#fce8e6", color: "#c5221f", border: "1px solid #fad2cf" };
      default:
        return { backgroundColor: "#f1f3f4", color: "#5f6368", border: "1px solid #dadce0" };
    }
  };

  const wishlistProducts = products.filter(p => wishlist.includes(p.id));


  return (
    <>
      <Header />

      <main className="container" style={{ padding: "40px 20px 80px 20px", minHeight: "80vh" }}>
        {/* Customer Account Main Grid (Matching User Screenshot Layout) */}
        <div style={{ display: "flex", gap: "24px", alignItems: "flex-start", flexWrap: "wrap" }}>
          
          {/* Left Sidebar Profile Box (Matching Screenshot) */}
          <div style={{ width: "240px", backgroundColor: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0", overflow: "hidden", flexShrink: 0 }}>
            {/* User Info Header */}
            <div style={{ padding: "24px 16px", textAlign: "center", backgroundColor: "#ffffff", borderBottom: "1px solid #f1f5f9" }}>
              <div style={{ width: "80px", height: "80px", borderRadius: "50%", backgroundColor: "#e2e8f0", margin: "0 auto 12px auto", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <img 
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || "Rinku Verma")}&background=cbd5e1&color=334155&size=120`} 
                  alt={user?.name || "User Avatar"} 
                  style={{ width: "100%", height: "100%", objectFit: "cover" }} 
                />
              </div>
              <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#1e293b", margin: "0 0 4px 0" }}>
                {user?.name || "Rinku Verma"}
              </h3>
              <p style={{ fontSize: "12px", color: "#64748b", margin: 0, wordBreak: "break-all" }}>
                {user?.email || user?.phone || "advanceduitechniques@gmail.com"}
              </p>
            </div>

            {/* Menu Items */}
            <div style={{ padding: "10px 0", backgroundColor: "#f8fafc" }}>
              <div
                onClick={() => setActiveTab("profile")}
                style={{
                  padding: "10px 20px",
                  fontSize: "13.5px",
                  fontWeight: activeTab === "profile" ? "700" : "500",
                  color: activeTab === "profile" ? "#1e293b" : "#475569",
                  borderLeft: activeTab === "profile" ? "3px solid #ef4444" : "3px solid transparent",
                  backgroundColor: activeTab === "profile" ? "#ffffff" : "transparent",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px"
                }}
              >
                👤 My Profile
              </div>

              <div
                onClick={() => setActiveTab("address")}
                style={{
                  padding: "10px 20px",
                  fontSize: "13.5px",
                  fontWeight: activeTab === "address" ? "700" : "500",
                  color: activeTab === "address" ? "#1e293b" : "#475569",
                  borderLeft: activeTab === "address" ? "3px solid #ef4444" : "3px solid transparent",
                  backgroundColor: activeTab === "address" ? "#ffffff" : "transparent",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px"
                }}
              >
                📍 Address
              </div>

              <div
                onClick={() => setActiveTab("wishlist")}
                style={{
                  padding: "10px 20px",
                  fontSize: "13.5px",
                  fontWeight: activeTab === "wishlist" ? "700" : "500",
                  color: activeTab === "wishlist" ? "#1e293b" : "#475569",
                  borderLeft: activeTab === "wishlist" ? "3px solid #ef4444" : "3px solid transparent",
                  backgroundColor: activeTab === "wishlist" ? "#ffffff" : "transparent",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px"
                }}
              >
                💖 My List
              </div>

              <div
                onClick={() => setActiveTab("orders")}
                style={{
                  padding: "10px 20px",
                  fontSize: "13.5px",
                  fontWeight: activeTab === "orders" ? "700" : "500",
                  color: activeTab === "orders" ? "#1e293b" : "#475569",
                  borderLeft: activeTab === "orders" ? "3px solid #ef4444" : "3px solid transparent",
                  backgroundColor: activeTab === "orders" ? "#ffffff" : "transparent",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px"
                }}
              >
                🛍️ My Orders
              </div>

              <div
                onClick={() => { logout(); window.location.href = "/login"; }}
                style={{
                  padding: "10px 20px",
                  fontSize: "13.5px",
                  fontWeight: "500",
                  color: "#64748b",
                  borderLeft: "3px solid transparent",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  marginTop: "10px"
                }}
              >
                🚪 Logout
              </div>
            </div>
          </div>

          {/* Right Main Content Card */}
          <div style={{ flex: 1, minWidth: "300px", backgroundColor: "#ffffff", borderRadius: "8px", border: "1px solid #e2e8f0", padding: "24px", minHeight: "450px" }}>
            
            {/* TAB: MY LIST (WISHLIST) - EXACT MATCH TO SCREENSHOT */}
            {activeTab === "wishlist" && (
              <div>
                <h2 style={{ fontSize: "18px", fontWeight: "800", color: "#1e293b", margin: "0 0 4px 0" }}>My List</h2>
                <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 20px 0" }}>
                  There are <strong style={{ color: "#ef4444" }}>{wishlistProducts.length}</strong> products in your My List
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {wishlistProducts.map((p) => {
                    const price = Number(p.price) || 4999;
                    const discPrice = Number(p.discountPrice) || 3999;
                    const discountPercent = p.discountPrice ? Math.round(((price - discPrice) / price) * 100) : 14;
                    const imageUrl = p.imageUrl || p.images?.[0]?.url || "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400&q=80";

                    return (
                      <div 
                        key={p.id}
                        style={{
                          display: "flex",
                          gap: "16px",
                          border: "1px solid #f1f5f9",
                          borderRadius: "8px",
                          padding: "16px",
                          position: "relative",
                          backgroundColor: "#ffffff",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.02)"
                        }}
                      >
                        {/* Remove Cross Button */}
                        <button
                          onClick={() => toggleWishlist(p.id)}
                          style={{
                            position: "absolute",
                            right: "14px",
                            top: "14px",
                            backgroundColor: "transparent",
                            border: "none",
                            fontSize: "16px",
                            fontWeight: "700",
                            color: "#94a3b8",
                            cursor: "pointer"
                          }}
                          title="Remove item"
                        >
                          ✕
                        </button>

                        <img 
                          src={imageUrl} 
                          alt={p.name} 
                          style={{ width: "110px", height: "110px", objectFit: "cover", borderRadius: "6px", border: "1px solid #e2e8f0" }} 
                        />

                        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: "4px", paddingRight: "30px" }}>
                          <span style={{ fontSize: "11px", fontWeight: "800", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                            {p.brandName || "EYEBOGLER"}
                          </span>
                          <Link href={`/product/${p.id}`} style={{ textDecoration: "none" }}>
                            <h4 style={{ fontSize: "14px", fontWeight: "700", color: "#1e293b", margin: 0, lineHeight: "1.3" }}>
                              {p.name}
                            </h4>
                          </Link>
                          <div style={{ color: "#eab308", fontSize: "12px", margin: "2px 0" }}>
                            ★★★★☆
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "14px" }}>
                            <span style={{ textDecoration: "line-through", color: "#94a3b8", fontWeight: "600" }}>
                              ৳{price}
                            </span>
                            <span style={{ fontWeight: "800", color: "#1e293b" }}>
                              ৳{discPrice}
                            </span>
                            <span style={{ color: "#ef4444", fontWeight: "800", fontSize: "12px" }}>
                              {discountPercent}% OFF
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {wishlistProducts.length === 0 && (
                    <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
                      <p style={{ fontSize: "14px", fontWeight: "600", marginBottom: "15px" }}>Your My List is empty.</p>
                      <Link href="/shop" style={{ display: "inline-block", backgroundColor: "#ef4444", color: "#ffffff", padding: "10px 20px", borderRadius: "20px", fontWeight: "700", fontSize: "13px", textDecoration: "none" }}>
                        Browse Shop
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            )}
            {/* TAB: ORDERS */}
            {activeTab === "orders" && (
              <div>
                <h2 style={{ fontSize: "18px", fontWeight: "800", color: "#1e293b", margin: "0 0 20px 0" }}>
                  Order History & Live Courier Tracking
                </h2>

                {loading ? (
                  <div style={{ padding: "40px", textAlign: "center", color: "#e52860", fontWeight: "800" }}>
                    Loading order history...
                  </div>
                ) : orders.length === 0 ? (
                  <div style={{ backgroundColor: "#ffffff", padding: "40px", borderRadius: "12px", border: "1px solid #edf2f7", textAlign: "center" }}>
                    <p style={{ fontSize: "15px", color: "#718096", fontWeight: "600", marginBottom: "15px" }}>You haven't placed any orders yet.</p>
                    <Link href="/shop" style={{ display: "inline-block", backgroundColor: "#e52860", color: "#ffffff", padding: "10px 24px", borderRadius: "20px", fontWeight: "800", fontSize: "13px", textDecoration: "none" }}>
                      START SHOPPING NOW
                    </Link>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                    {orders.map((ord) => {
                      const isShipped = ord.orderStatus === "Shipped" || ord.orderStatus === "Send to Delivery" || Boolean(ord.trackingLink);
                      return (
                        <div 
                          key={ord.id}
                          style={{
                            backgroundColor: "#ffffff",
                            borderRadius: "12px",
                            border: "1px solid #e2e8f0",
                            padding: "24px",
                            boxShadow: "0 4px 15px rgba(0,0,0,0.02)",
                            display: "flex",
                            flexDirection: "column",
                            gap: "16px"
                          }}
                        >
                          {/* Order Top Bar */}
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px", borderBottom: "1px solid #edf2f7", paddingBottom: "14px" }}>
                            <div>
                              <span style={{ fontSize: "16px", fontWeight: "900", color: "#0e1e38" }}>
                                Order #{ord.orderNumber}
                              </span>
                              <span style={{ fontSize: "12.5px", color: "#718096", display: "block", marginTop: "2px", fontWeight: "600" }}>
                                Placed on: {new Date(ord.createdAt).toLocaleString()}
                              </span>
                            </div>

                            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                              <span style={{ fontSize: "12px", fontWeight: "800", padding: "4px 12px", borderRadius: "20px", ...getStatusBadgeStyle(ord.orderStatus) }}>
                                {ord.orderStatus}
                              </span>
                            </div>
                          </div>

                          {/* Items Summary */}
                          <div>
                            <h4 style={{ fontSize: "13px", fontWeight: "800", color: "#4a5568", marginBottom: "10px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Ordered Items</h4>
                            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                              {ord.orderItems?.map((item: any, idx: number) => (
                                <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontSize: "13.5px", color: "#2d3748" }}>
                                  <span><strong style={{ color: "#e52860" }}>{item.quantity}x</strong> {item.productName} ({item.variantName})</span>
                                  <span style={{ fontWeight: "700" }}>BDT {item.total}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Address & Delivery Info */}
                          <div style={{ backgroundColor: "#f8fafc", padding: "12px 16px", borderRadius: "8px", fontSize: "13px", color: "#4a5568" }}>
                            <strong style={{ color: "#2d3748" }}>Customer Name:</strong> {ord.customerName} | <strong style={{ color: "#2d3748" }}>Phone:</strong> {ord.customerPhone} <br />
                            <strong style={{ color: "#2d3748" }}>Delivery Address:</strong> {ord.address} ({ord.zone})
                          </div>

                          {/* 1-HOUR EDIT COUNTDOWN TIMER & EDIT BUTTON */}
                          {(() => {
                            const createdAtMs = new Date(ord.createdAt).getTime();
                            const elapsedSeconds = Math.floor((nowMs - createdAtMs) / 1000);
                            const remainingSeconds = Math.max(0, 3600 - elapsedSeconds);
                            const canEdit = remainingSeconds > 0 && (ord.orderStatus === "Pending" || ord.orderStatus === "Processing");
                            const minutesLeft = Math.floor(remainingSeconds / 60);
                            const secondsLeft = remainingSeconds % 60;

                            return (
                              <div style={{ marginTop: "4px" }}>
                                {canEdit ? (
                                  <div style={{ backgroundColor: "#eff6ff", border: "1.5px solid #3b82f6", padding: "12px 16px", borderRadius: "8px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                                    <div style={{ fontSize: "13px", fontWeight: "700", color: "#1d4ed8" }}>
                                      ⏳ 1-Hour Order Edit Window: <strong>{minutesLeft}m {secondsLeft.toString().padStart(2, "0")}s remaining</strong>
                                    </div>
                                    <button 
                                      onClick={() => { 
                                        setEditingOrderId(ord.id); 
                                        setEditForm({ customerName: ord.customerName, customerPhone: ord.customerPhone, address: ord.address }); 
                                      }}
                                      style={{ backgroundColor: "#2563eb", color: "#ffffff", border: "none", padding: "8px 16px", borderRadius: "6px", fontSize: "12.5px", fontWeight: "800", cursor: "pointer" }}
                                    >
                                      ✏️ EDIT ORDER
                                    </button>
                                  </div>
                                ) : (
                                  <div style={{ fontSize: "12px", color: "#94a3b8", fontWeight: "600", fontStyle: "italic" }}>
                                    🔒 Order edit window expired (Locked for delivery)
                                  </div>
                                )}
                              </div>
                            );
                          })()}

                          {/* INLINE EDIT ORDER FORM */}
                          {editingOrderId === ord.id && (
                            <div style={{ backgroundColor: "#f0fdf4", border: "1.5px solid #16a34a", padding: "16px", borderRadius: "8px", marginTop: "8px", display: "flex", flexDirection: "column", gap: "12px" }}>
                              <h4 style={{ fontSize: "14px", fontWeight: "800", color: "#15803d", margin: 0 }}>Edit Order Shipping Details</h4>
                              <div>
                                <label style={{ fontSize: "11px", fontWeight: "700", color: "#166534", display: "block" }}>CUSTOMER NAME</label>
                                <input type="text" value={editForm.customerName} onChange={(e) => setEditForm({ ...editForm, customerName: e.target.value })} style={{ width: "100%", padding: "8px", border: "1px solid #bbf7d0", borderRadius: "4px", fontSize: "13px" }} />
                              </div>
                              <div>
                                <label style={{ fontSize: "11px", fontWeight: "700", color: "#166534", display: "block" }}>CUSTOMER PHONE</label>
                                <input type="text" value={editForm.customerPhone} onChange={(e) => setEditForm({ ...editForm, customerPhone: e.target.value })} style={{ width: "100%", padding: "8px", border: "1px solid #bbf7d0", borderRadius: "4px", fontSize: "13px" }} />
                              </div>
                              <div>
                                <label style={{ fontSize: "11px", fontWeight: "700", color: "#166534", display: "block" }}>DELIVERY ADDRESS</label>
                                <textarea rows={2} value={editForm.address} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} style={{ width: "100%", padding: "8px", border: "1px solid #bbf7d0", borderRadius: "4px", fontSize: "13px" }} />
                              </div>
                              <div style={{ display: "flex", gap: "10px" }}>
                                <button 
                                  onClick={async () => {
                                    const token = localStorage.getItem("glowgoodly_token") || localStorage.getItem("gg_token");
                                    try {
                                      const res = await fetch(`${API_BASE}/orders/${ord.id}/customer-edit`, {
                                        method: "PUT",
                                        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                                        body: JSON.stringify(editForm)
                                      });
                                      const data = await res.json();
                                      if (res.ok) {
                                        setOrders(prev => prev.map(o => o.id === ord.id ? { ...o, ...editForm } : o));
                                        setEditingOrderId(null);
                                        alert("Order details updated successfully!");
                                      } else {
                                        alert(data.error || "Failed to update order");
                                      }
                                    } catch (e) { alert("Error updating order"); }
                                  }}
                                  style={{ backgroundColor: "#16a34a", color: "#ffffff", border: "none", padding: "8px 16px", borderRadius: "4px", fontWeight: "800", cursor: "pointer", fontSize: "12px" }}
                                >
                                  SAVE CHANGES
                                </button>
                                <button onClick={() => setEditingOrderId(null)} style={{ backgroundColor: "#e2e8f0", color: "#475569", border: "none", padding: "8px 14px", borderRadius: "4px", fontWeight: "700", cursor: "pointer", fontSize: "12px" }}>
                                  Cancel
                                </button>
                              </div>
                            </div>
                          )}

                          {/* LIVE COURIER DELIVERY TRACKING LINK SECTION */}
                          {isShipped && (
                            <div 
                              style={{
                                backgroundColor: "#f0f7ff",
                                border: "1.5px solid #bee3f8",
                                borderRadius: "10px",
                                padding: "16px",
                                display: "flex",
                                flexDirection: "column",
                                gap: "10px"
                              }}
                            >
                              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <span style={{ fontSize: "20px" }}>🚚</span>
                                <h4 style={{ margin: 0, fontSize: "14px", fontWeight: "900", color: "#2b6cb0" }}>
                                  Parcel Handed Over To Delivery Courier
                                </h4>
                              </div>
                              <p style={{ margin: 0, fontSize: "12.5px", color: "#4a5568", fontWeight: "600" }}>
                                Your package is in transit with our logistics partner. Click the button below to view live courier status.
                              </p>
                              {ord.trackingLink ? (
                                <a 
                                  href={ord.trackingLink} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  style={{
                                    display: "inline-block",
                                    backgroundColor: "#2b6cb0",
                                    color: "#ffffff",
                                    fontWeight: "800",
                                    padding: "10px 18px",
                                    borderRadius: "6px",
                                    fontSize: "13px",
                                    textDecoration: "none",
                                    alignSelf: "flex-start",
                                    marginTop: "4px"
                                  }}
                                >
                                  🔗 TRACK LIVE ON DELIVERY COMPANY WEBSITE →
                                </a>
                              ) : (
                                <div style={{ fontSize: "12px", color: "#718096", fontStyle: "italic" }}>
                                  Tracking link is being synced with courier API...
                                </div>
                              )}
                            </div>
                          )}

                          {/* Total Row */}
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "10px", borderTop: "1px solid #edf2f7" }}>
                            <span style={{ fontSize: "13px", color: "#718096", fontWeight: "700" }}>Payment: {ord.paymentMethod} ({ord.paymentStatus})</span>
                            <span style={{ fontSize: "18px", fontWeight: "900", color: "#e52860" }}>Total: BDT {ord.total}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB: PROFILE */}
            {activeTab === "profile" && (
              <div style={{ backgroundColor: "#ffffff", padding: "30px", borderRadius: "12px", border: "1px solid #edf2f7", boxShadow: "0 2px 10px rgba(0,0,0,0.02)" }}>
                <h2 style={{ fontSize: "20px", fontWeight: "800", color: "#1a202c", marginBottom: "20px" }}>Customer Profile Information</h2>
                <div style={{ display: "flex", flexDirection: "column", gap: "16px", fontSize: "14px" }}>
                  <div>
                    <label style={{ fontSize: "12px", color: "#718096", fontWeight: "700", display: "block" }}>FULL NAME</label>
                    <span style={{ fontSize: "16px", fontWeight: "800", color: "#2d3748" }}>{user?.name}</span>
                  </div>
                  <div>
                    <label style={{ fontSize: "12px", color: "#718096", fontWeight: "700", display: "block" }}>EMAIL ADDRESS</label>
                    <span style={{ fontWeight: "700", color: "#2d3748" }}>{user?.email}</span>
                  </div>
                  <div>
                    <label style={{ fontSize: "12px", color: "#718096", fontWeight: "700", display: "block" }}>PHONE NUMBER</label>
                    <span style={{ fontWeight: "700", color: "#2d3748" }}>{user?.phone || "Not provided"}</span>
                  </div>
                  <div>
                    <label style={{ fontSize: "12px", color: "#718096", fontWeight: "700", display: "block" }}>ACCOUNT TYPE</label>
                    <span style={{ fontWeight: "700", color: "#e52860" }}>{user?.role || "Customer"}</span>
                  </div>
                </div>
              </div>
            )}
            {activeTab === "address" && (
              <div style={{ backgroundColor: "#ffffff", padding: "24px", borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 2px 10px rgba(0,0,0,0.02)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                  <h2 style={{ fontSize: "18px", fontWeight: "800", color: "#1e293b", margin: 0 }}>Saved Shipping Address</h2>
                  {user?.address && !showAddressForm && (
                    <button
                      onClick={() => setShowAddressForm(true)}
                      style={{ backgroundColor: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe", padding: "8px 16px", borderRadius: "6px", fontSize: "12.5px", fontWeight: "800", cursor: "pointer" }}
                    >
                      ✏️ Edit Address
                    </button>
                  )}
                </div>

                {showAddressForm ? (
                  <form onSubmit={handleSaveAddress} style={{ backgroundColor: "#f8fafc", padding: "20px", borderRadius: "10px", border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", gap: "14px" }}>
                    <h4 style={{ fontSize: "14px", fontWeight: "800", color: "#0f172a", margin: 0 }}>Add / Edit Shipping Address</h4>
                    <div>
                      <label style={{ fontSize: "12px", fontWeight: "700", color: "#475569", display: "block", marginBottom: "4px" }}>FULL DELIVERY ADDRESS *</label>
                      <textarea
                        rows={3}
                        required
                        placeholder="House no, Road no, Area, Landmark..."
                        value={addressInput}
                        onChange={(e) => setAddressInput(e.target.value)}
                        style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                      />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                      <div>
                        <label style={{ fontSize: "12px", fontWeight: "700", color: "#475569", display: "block", marginBottom: "4px" }}>CITY / DISTRICT</label>
                        <input
                          type="text"
                          value={cityInput}
                          onChange={(e) => setCityInput(e.target.value)}
                          style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: "12px", fontWeight: "700", color: "#475569", display: "block", marginBottom: "4px" }}>AREA / THANA</label>
                        <input
                          type="text"
                          placeholder="e.g. Dhanmondi, Gulshan, Uttara"
                          value={areaInput}
                          onChange={(e) => setAreaInput(e.target.value)}
                          style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                        />
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "10px", marginTop: "6px" }}>
                      <button
                        type="submit"
                        disabled={savingAddress}
                        style={{ backgroundColor: "#e63b7a", color: "#ffffff", border: "none", padding: "10px 22px", borderRadius: "6px", fontWeight: "800", fontSize: "13px", cursor: "pointer", boxShadow: "0 4px 12px rgba(230,59,122,0.3)" }}
                      >
                        {savingAddress ? "Saving..." : "Save Address 💾"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowAddressForm(false)}
                        style={{ backgroundColor: "#f1f5f9", color: "#64748b", border: "none", padding: "10px 18px", borderRadius: "6px", fontWeight: "700", fontSize: "13px", cursor: "pointer" }}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : user?.address && user.address.trim() !== "" ? (
                  <div style={{ border: "1.5px solid #e2e8f0", borderRadius: "10px", padding: "20px", backgroundColor: "#f8fafc" }}>
                    <span style={{ backgroundColor: "#e2e8f0", color: "#334155", padding: "3px 10px", borderRadius: "12px", fontSize: "11px", fontWeight: "800", textTransform: "uppercase" }}>Primary Delivery Address</span>
                    <h4 style={{ fontSize: "15px", fontWeight: "800", color: "#0f172a", margin: "10px 0 6px 0" }}>{user.name}</h4>
                    <p style={{ fontSize: "13.5px", color: "#334155", margin: 0, lineHeight: "1.5" }}>
                      📍 {user.address}{user.area ? `, ${user.area}` : ""}{user.city ? `, ${user.city}` : ""}
                    </p>
                    <p style={{ fontSize: "13px", color: "#64748b", margin: "8px 0 0 0", fontWeight: "600" }}>
                      📞 Phone: {user.phone || "Not provided"}
                    </p>
                  </div>
                ) : (
                  <div style={{ padding: "45px 20px", textAlign: "center", backgroundColor: "#f8fafc", borderRadius: "10px", border: "1px dashed #cbd5e1" }}>
                    <div style={{ fontSize: "36px", marginBottom: "10px" }}>📍</div>
                    <h3 style={{ fontSize: "16px", fontWeight: "800", color: "#1e293b", margin: "0 0 6px 0" }}>No Saved Delivery Address</h3>
                    <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 20px 0", fontWeight: "500" }}>
                      You haven't saved a shipping address yet. Add your address for faster, seamless checkout.
                    </p>
                    <button
                      onClick={() => setShowAddressForm(true)}
                      style={{ backgroundColor: "#e63b7a", color: "#ffffff", border: "none", padding: "12px 28px", borderRadius: "30px", fontWeight: "800", fontSize: "13.5px", cursor: "pointer", boxShadow: "0 4px 14px rgba(230,59,122,0.3)" }}
                    >
                      + Add New Shipping Address
                    </button>
                  </div>
                )}
              </div>
            )}


          </div>
        </div>

      </main>

      <Footer />
      <MobileNavbar />
    </>
  );
}
