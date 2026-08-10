"use client";

import React from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import MobileNavbar from "../../components/MobileNavbar";
import Link from "next/link";
import { useApp } from "../../context/AppContext";

export default function RoutinePage() {
  const { siteSettings } = useApp();
  return (
    <>
      <Header />
      
      {/* Page Banner */}
      <div className="shop-banner" style={{ background: "linear-gradient(90deg,#132238,#0e1e38)" }}>
        <span className="shop-banner-side">GLOWGOODLY</span>
        <span className="shop-banner-title">KNOW YOUR ROUTINE</span>
        <span className="shop-banner-subtitle">
          Build your perfect beauty regimen
        </span>
      </div>

      <div className="container" style={{ padding: "40px 20px 80px 20px", minHeight: "60vh" }}>
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          
          <div style={{ textAlign: "center", marginBottom: "40px" }}>
            <span style={{ color: "#e52860", fontWeight: "900", letterSpacing: "2px", textTransform: "uppercase", fontSize: "12px", backgroundColor: "#fff0f4", padding: "4px 12px", borderRadius: "20px" }}>GlowGoodly Beauty Guide</span>
            <h1 style={{ fontSize: "32px", fontWeight: "900", color: "#0e1e38", marginTop: "10px", marginBottom: "15px" }}>KNOW YOUR ROUTINE</h1>
            <p style={{ color: "#718096", fontSize: "16px", lineHeight: "1.6" }}>
              Building the perfect beauty routine takes time, but we're here to make it easy. Discover the essential steps to healthy skin, gorgeous hair, and flawless makeup.
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
            
            {/* Skin Care Routine */}
            <div style={{ padding: "30px", backgroundColor: "#fff5f7", borderRadius: "16px", display: "flex", flexDirection: "column", gap: "15px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                <div style={{ width: "50px", height: "50px", borderRadius: "50%", backgroundColor: "#e52860", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", fontWeight: "bold" }}>1</div>
                <h2 style={{ fontSize: "22px", fontWeight: "800", color: "#0e1e38", margin: 0 }}>Daily Skin Care Routine</h2>
              </div>
              <p style={{ color: "#4a5568", fontSize: "15px", lineHeight: "1.6", margin: 0 }}>
                A solid skincare routine starts with three simple steps: <strong>Cleanse, Tone, and Moisturize</strong>. Always remember to apply sunscreen during the day to protect your skin from harmful UV rays.
              </p>
              <Link href={siteSettings?.SKIN_CARE_101_LINK || "/skin-care-101"} style={{ color: "#e52860", fontWeight: "800", fontSize: "14px", textDecoration: "none", display: "inline-block", marginTop: "10px" }}>Read Skin Care 101 →</Link>
            </div>

            {/* Hair Care Routine */}
            <div style={{ padding: "30px", backgroundColor: "#f0f4ff", borderRadius: "16px", display: "flex", flexDirection: "column", gap: "15px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                <div style={{ width: "50px", height: "50px", borderRadius: "50%", backgroundColor: "#3182ce", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", fontWeight: "bold" }}>2</div>
                <h2 style={{ fontSize: "22px", fontWeight: "800", color: "#0e1e38", margin: 0 }}>Hair Care Essentials</h2>
              </div>
              <p style={{ color: "#4a5568", fontSize: "15px", lineHeight: "1.6", margin: 0 }}>
                Healthy hair needs regular nourishment. Use a gentle shampoo, never skip conditioner, and treat your hair to a deep conditioning mask once a week. Don't forget heat protectant before styling!
              </p>
              <Link href={siteSettings?.HAIR_CARE_101_LINK || "/hair-care-101"} style={{ color: "#3182ce", fontWeight: "800", fontSize: "14px", textDecoration: "none", display: "inline-block", marginTop: "10px" }}>Read Hair Care 101 →</Link>
            </div>

            {/* Makeup Routine */}
            <div style={{ padding: "30px", backgroundColor: "#fff5f0", borderRadius: "16px", display: "flex", flexDirection: "column", gap: "15px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                <div style={{ width: "50px", height: "50px", borderRadius: "50%", backgroundColor: "#dd6b20", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", fontWeight: "bold" }}>3</div>
                <h2 style={{ fontSize: "22px", fontWeight: "800", color: "#0e1e38", margin: 0 }}>Flawless Makeup</h2>
              </div>
              <p style={{ color: "#4a5568", fontSize: "15px", lineHeight: "1.6", margin: 0 }}>
                Preparation is key. Always start with a primed, moisturized face. Build your base with foundation and concealer, add color with blush and bronzer, and lock it all in with a setting spray.
              </p>
              <Link href={siteSettings?.MAKEUP_101_LINK || "/makeup-101"} style={{ color: "#dd6b20", fontWeight: "800", fontSize: "14px", textDecoration: "none", display: "inline-block", marginTop: "10px" }}>Read Makeup 101 →</Link>
            </div>
          </div>

          <div style={{ textAlign: "center", marginTop: "50px" }}>
            <Link href="/shop" style={{ backgroundColor: "#e52860", color: "#fff", padding: "14px 32px", borderRadius: "30px", fontWeight: "800", fontSize: "14px", textDecoration: "none", display: "inline-block", boxShadow: "0 4px 15px rgba(229,40,96,0.3)", transition: "all 0.2s ease" }}>
              SHOP ALL PRODUCTS
            </Link>
          </div>
        </div>
      </div>

      <Footer />
      <MobileNavbar />
    </>
  );
}
