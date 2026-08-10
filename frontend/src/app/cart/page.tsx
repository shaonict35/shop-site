"use client";

import React from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import MobileNavbar from "../../components/MobileNavbar";
import { useApp } from "../../context/AppContext";
import Link from "next/link";
import { ShoppingBag, ArrowRight, Trash2, Plus, Minus, ShieldCheck } from "lucide-react";

export default function CartPage() {
  const { cart, removeFromCart, updateCartQuantity, clearCart } = useApp();

  const cartSubtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

  const handleProceedToCheckout = () => {
    window.location.href = "/checkout";
  };

  return (
    <>
      <Header />

      <main className="container" style={{ padding: "40px 20px", maxWidth: "1100px", margin: "0 auto", minHeight: "75vh" }}>
        <h1 style={{ fontSize: "28px", fontWeight: "900", color: "#0f172a", marginBottom: "24px", borderBottom: "2px solid #f1f5f9", paddingBottom: "12px", display: "flex", alignItems: "center", gap: "10px" }}>
          <ShoppingBag size={28} color="#e63b7a" />
          Shopping Cart ({cart.reduce((a, b) => a + b.quantity, 0)} Items)
        </h1>

        {cart.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 20px", backgroundColor: "#ffffff", borderRadius: "16px", border: "1px solid #e2e8f0" }}>
            <div style={{ width: "80px", height: "80px", borderRadius: "50%", backgroundColor: "#fff0f5", color: "#e63b7a", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px auto" }}>
              <ShoppingBag size={40} />
            </div>
            <h2 style={{ fontSize: "20px", fontWeight: "800", color: "#1e293b" }}>Your cart is empty!</h2>
            <p style={{ fontSize: "14px", color: "#64748b", margin: "6px 0 20px 0" }}>Explore thousands of 100% authentic cosmetics and skincare products.</p>
            <Link href="/shop" style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "12px 28px", backgroundColor: "#e63b7a", color: "#ffffff", borderRadius: "8px", fontWeight: "800", textDecoration: "none" }}>
              <span>Shop All Products</span>
              <ArrowRight size={18} />
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "30px" }}>
            {/* Cart Items List */}
            <div style={{ flex: "1 1 600px", display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ backgroundColor: "#ffffff", borderRadius: "14px", border: "1px solid #e2e8f0", padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", borderBottom: "1.5px solid #f1f5f9", paddingBottom: "10px" }}>
                  <span style={{ fontSize: "13px", fontWeight: "800", color: "#64748b", textTransform: "uppercase" }}>Cart Items</span>
                  <button onClick={clearCart} style={{ background: "none", border: "none", color: "#ef4444", fontSize: "12.5px", fontWeight: "700", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
                    <Trash2 size={14} /> Clear Cart
                  </button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {cart.map((item) => (
                    <div key={item.id} style={{ display: "flex", gap: "16px", alignItems: "center", paddingBottom: "16px", borderBottom: "1px solid #f1f5f9" }}>
                      <img src={item.image} alt={item.name} style={{ width: "70px", height: "70px", objectFit: "cover", borderRadius: "10px", border: "1px solid #f1f5f9" }} />
                      
                      <div style={{ flex: 1 }}>
                        <Link href={`/product/${item.productId}`} style={{ fontSize: "14px", fontWeight: "800", color: "#0f172a", textDecoration: "none", display: "block" }}>
                          {item.name}
                        </Link>
                        <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "600" }}>{item.variantName}</span>
                        <div style={{ fontSize: "15px", fontWeight: "900", color: "#e63b7a", marginTop: "4px" }}>
                          BDT {item.price}
                        </div>
                      </div>

                      {/* Quantity Selector */}
                      <div style={{ display: "flex", alignItems: "center", border: "1.5px solid #cbd5e1", borderRadius: "8px", overflow: "hidden" }}>
                        <button
                          onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                          style={{ padding: "6px 10px", border: "none", backgroundColor: "#f8fafc", cursor: "pointer", color: "#334155" }}
                        >
                          <Minus size={14} />
                        </button>
                        <span style={{ padding: "6px 12px", fontSize: "13px", fontWeight: "800", color: "#0f172a" }}>{item.quantity}</span>
                        <button
                          onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                          style={{ padding: "6px 10px", border: "none", backgroundColor: "#f8fafc", cursor: "pointer", color: "#334155" }}
                        >
                          <Plus size={14} />
                        </button>
                      </div>

                      <div style={{ textAlign: "right", minWidth: "90px" }}>
                        <div style={{ fontSize: "15px", fontWeight: "900", color: "#0f172a" }}>
                          BDT {item.price * item.quantity}
                        </div>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", marginTop: "6px" }}
                        >
                          <Trash2 size={16} color="#ef4444" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Cart Summary & Checkout Box */}
            <aside style={{ flex: "1 1 340px", display: "flex", flexDirection: "column", gap: "20px" }}>
              <div style={{ backgroundColor: "#ffffff", borderRadius: "14px", border: "1px solid #e2e8f0", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                <h2 style={{ fontSize: "18px", fontWeight: "800", color: "#0f172a", marginBottom: "16px", borderBottom: "1.5px solid #f1f5f9", paddingBottom: "10px" }}>
                  Order Summary
                </h2>

                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "15px", fontWeight: "700", color: "#475569", marginBottom: "12px" }}>
                  <span>Subtotal</span>
                  <span>BDT {cartSubtotal}</span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#64748b", marginBottom: "16px" }}>
                  <span>Delivery Fee</span>
                  <span>Calculated at Checkout</span>
                </div>

                <hr style={{ border: "none", borderTop: "1.5px solid #f1f5f9", marginBottom: "16px" }} />

                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "20px", fontWeight: "900", color: "#e63b7a", marginBottom: "20px" }}>
                  <span>Total Bill</span>
                  <span>BDT {cartSubtotal}</span>
                </div>

                <button
                  onClick={handleProceedToCheckout}
                  style={{
                    width: "100%",
                    backgroundColor: "#e2136e",
                    color: "#ffffff",
                    border: "none",
                    padding: "16px",
                    borderRadius: "10px",
                    fontWeight: "900",
                    fontSize: "16px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    boxShadow: "0 4px 14px rgba(226,19,110,0.35)",
                    transition: "all 0.2s ease"
                  }}
                >
                  <span>PROCEED TO CHECKOUT</span>
                  <ArrowRight size={20} />
                </button>
              </div>

              <div style={{ backgroundColor: "#fdf2f8", border: "1px solid #fbcfe8", borderRadius: "12px", padding: "16px", display: "flex", alignItems: "center", gap: "12px" }}>
                <ShieldCheck size={26} color="#e2136e" style={{ flexShrink: 0 }} />
                <div style={{ fontSize: "12px", color: "#831843", fontWeight: "600", lineHeight: "1.4" }}>
                  100% Authentic Products & Direct bKash Gateway (01609013011) Payment Guarantee.
                </div>
              </div>
            </aside>
          </div>
        )}
      </main>

      <Footer />
      <MobileNavbar />
    </>
  );
}
