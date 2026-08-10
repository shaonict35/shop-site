"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import MobileNavbar from "../../components/MobileNavbar";

function ThankYouContent() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get("orderNumber") || "GG-ORDER-99214";
  const total = searchParams.get("total") || "0.00";

  React.useEffect(() => {
    if (typeof window !== "undefined" && (window as any).fbq) {
      console.log(`[Meta Pixel Tracking] Purchase Event Fired: Order #${orderNumber}, Value: ${total} BDT`);
      (window as any).fbq("track", "Purchase", {
        value: parseFloat(total) || 0,
        currency: "BDT",
        content_type: "product"
      });
    }
  }, [orderNumber, total]);

  return (
    <main className="container" style={{ padding: "80px 20px", display: "flex", flexDirection: "column", alignItems: "center", minHeight: "70vh", gap: "25px", textAlign: "center" }}>
      
      {/* Success Badge */}
      <div
        style={{
          width: "90px",
          height: "90px",
          borderRadius: "50%",
          backgroundColor: "#fff0f3",
          color: "#e52860",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 6px 15px rgba(229, 40, 96, 0.08)",
          transform: "scale(1)",
          animation: "pulse 2s infinite"
        }}
      >
        <svg fill="none" stroke="currentColor" strokeWidth="2.8" viewBox="0 0 24 24" width="45" height="45">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5"></path>
        </svg>
      </div>

      <div>
        <h1 style={{ fontSize: "32px", fontWeight: "900", color: "#0e1e38" }}>
          Thank You For Your Order!
        </h1>
        <p style={{ fontSize: "15px", color: "#4a5568", fontWeight: "600", marginTop: "8px", maxWidth: "600px" }}>
          Your beauty items are already being processed. A confirmation email and tracking link will be sent to you shortly.
        </p>
      </div>

      {/* Order Info Card */}
      <div
        style={{
          width: "100%",
          maxWidth: "520px",
          backgroundColor: "#ffffff",
          border: "1.5px solid #e2e8f0",
          borderRadius: "16px",
          padding: "25px 30px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.02)",
          display: "flex",
          flexDirection: "column",
          gap: "14px",
          textAlign: "left"
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1.5px solid #edf2f7", paddingBottom: "10px" }}>
          <span style={{ fontSize: "13.5px", fontWeight: "800", color: "#718096" }}>ORDER NUMBER:</span>
          <span style={{ fontSize: "14px", fontWeight: "900", color: "#e52860" }}>{orderNumber}</span>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1.5px solid #edf2f7", paddingBottom: "10px" }}>
          <span style={{ fontSize: "13.5px", fontWeight: "800", color: "#718096" }}>TOTAL AMOUNT:</span>
          <span style={{ fontSize: "15px", fontWeight: "900", color: "#0e1e38" }}>৳ {total}</span>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1.5px solid #edf2f7", paddingBottom: "10px" }}>
          <span style={{ fontSize: "13.5px", fontWeight: "800", color: "#718096" }}>SHIPPING METHOD:</span>
          <span style={{ fontSize: "13.5px", fontWeight: "850", color: "#2d3748" }}>Cash On Delivery (COD)</span>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontSize: "13.5px", fontWeight: "800", color: "#718096" }}>ESTIMATED DELIVERY:</span>
          <span style={{ fontSize: "13.5px", fontWeight: "850", color: "#2d3748" }}>2 - 3 Business Days</span>
        </div>
      </div>

      <div style={{ display: "flex", gap: "15px", marginTop: "15px" }}>
        <Link
          href="/"
          style={{
            backgroundColor: "#e52860",
            color: "#ffffff",
            padding: "14px 35px",
            borderRadius: "30px",
            fontWeight: "800",
            fontSize: "14px",
            textDecoration: "none",
            boxShadow: "0 4px 12px rgba(229, 40, 96, 0.2)",
            transition: "all 0.2s"
          }}
        >
          CONTINUE SHOPPING
        </Link>
      </div>

    </main>
  );
}

export default function ThankYouPage() {
  return (
    <>
      <Header />
      <Suspense fallback={
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "70vh", fontSize: "16px", fontWeight: "700", color: "#e52860" }}>
          Loading order details...
        </div>
      }>
        <ThankYouContent />
      </Suspense>
      <Footer />
      <MobileNavbar />
    </>
  );
}
