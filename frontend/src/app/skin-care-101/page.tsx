"use client";

import React, { useEffect, useState } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import MobileNavbar from "../../components/MobileNavbar";
import Link from "next/link";
import { API_BASE } from "../../utils/api";

export default function SkinCare101Page() {
  const [banner, setBanner] = useState<any>(null);

  useEffect(() => {
    fetch(`${API_BASE}/banners`)
      .then(res => res.json())
      .then(data => {
        const found = data.find((b: any) => b.page === "Skin Care 101");
        if (found) setBanner(found);
      })
      .catch(() => {});
  }, []);

  return (
    <>
      <Header />
      
      {/* Page Banner */}
      <div 
        className="shop-banner" 
        style={{ 
          background: banner ? (banner.bgColor || "#1a1a2e") : "linear-gradient(90deg,#132238,#0e1e38)",
          backgroundImage: banner ? `url(${banner.imageUrl})` : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center"
        }}
      >
        <span className="shop-banner-side">GLOWGOODLY</span>
        <span className="shop-banner-title">{banner ? banner.title : "SKIN CARE 101"}</span>
        <span className="shop-banner-subtitle">
          A glowing complexion begins here
        </span>
      </div>

      <div style={{ backgroundColor: "#fdf8fa", minHeight: "80vh", padding: "40px 20px" }}>
        <div className="container" style={{ maxWidth: "800px", margin: "0 auto", backgroundColor: "#ffffff", padding: "50px", borderRadius: "20px", boxShadow: "0 10px 40px rgba(229,40,96,0.08)" }}>
          <div style={{ textAlign: "center", marginBottom: "40px" }}>
            <span style={{ color: "#e52860", fontWeight: "900", letterSpacing: "2px", textTransform: "uppercase", fontSize: "12px", backgroundColor: "#fff0f4", padding: "4px 12px", borderRadius: "20px" }}>GlowGoodly 101</span>
            <h1 style={{ fontSize: "36px", fontWeight: "900", color: "#0e1e38", marginTop: "15px", marginBottom: "15px" }}>SKIN CARE 101</h1>
            <p style={{ color: "#718096", fontSize: "16px", lineHeight: "1.6", maxWidth: "600px", margin: "0 auto" }}>
              A glowing complexion begins with a consistent skincare routine. Learn the fundamental steps to cleanse, nourish, and protect your skin daily.
            </p>
          </div>

          <div style={{ width: "100%", height: "300px", borderRadius: "16px", overflow: "hidden", marginBottom: "40px", position: "relative" }}>
            <img src="https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?w=800&q=80" alt="Skin Care" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            <div style={{ position: "absolute", bottom: "20px", left: "20px", backgroundColor: "rgba(255,255,255,0.9)", padding: "10px 20px", borderRadius: "12px", fontWeight: "800", color: "#e52860" }}>
              The Ultimate Skin Guide
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "30px", color: "#4a5568", lineHeight: "1.8", fontSize: "16px" }}>
            
            <div>
              <h2 style={{ fontSize: "22px", fontWeight: "800", color: "#0e1e38", borderBottom: "2px solid #fff0f4", paddingBottom: "10px", marginBottom: "15px" }}>Step 1: Cleanse (The Foundation)</h2>
              <p>
                Washing your face is the most basic and essential step of any routine. Our skin comes in contact with environmental pollutants, dirt and other factors each day that should be gently removed. Double cleansing (oil cleanser followed by a water-based cleanser) is highly recommended, especially if you wear makeup.
              </p>
            </div>

            <div>
              <h2 style={{ fontSize: "22px", fontWeight: "800", color: "#0e1e38", borderBottom: "2px solid #fff0f4", paddingBottom: "10px", marginBottom: "15px" }}>Step 2: Tone (Balance and Prep)</h2>
              <p>
                Toners essentially act as delivery systems for antioxidants, vitamin B derivatives and even toning acids. They help to balance the skin's pH after cleansing and prepare it to absorb the serums and moisturizers that follow.
              </p>
            </div>

            <div>
              <h2 style={{ fontSize: "22px", fontWeight: "800", color: "#0e1e38", borderBottom: "2px solid #fff0f4", paddingBottom: "10px", marginBottom: "15px" }}>Step 3: Treat (Serums & Essences)</h2>
              <p>
                Serums are powerful skin allies. Filled with concentrated doses of active ingredients, these elixirs can mitigate a number of issues, from dark spots to wrinkles. Even if you don’t have any specific issues, everyone needs a general antioxidant serum in the morning to protect from daily aggressors.
              </p>
            </div>
            
            <div>
              <h2 style={{ fontSize: "22px", fontWeight: "800", color: "#0e1e38", borderBottom: "2px solid #fff0f4", paddingBottom: "10px", marginBottom: "15px" }}>Step 4: Moisturize (Seal it in)</h2>
              <p>
                The most basic function of a moisturizer is to hydrate and soften the skin. Essentially, moisturizers assist in preventing water loss through the outer layers of skin. They can also complement the naturally found protective oils and other building blocks within the skin.
              </p>
            </div>

            <div style={{ backgroundColor: "#fff0f4", padding: "25px", borderRadius: "12px", borderLeft: "5px solid #e52860" }}>
              <h3 style={{ margin: "0 0 10px 0", color: "#d53f8c", fontSize: "18px", fontWeight: "800" }}>The Golden Rule: Sunscreen</h3>
              <p style={{ margin: 0, fontSize: "15px" }}>
                Sunscreen is the absolute most important skincare product. Consistent use of sunscreen helps prevent the development of fine lines and wrinkles, textural imperfections, and changes in the appearance of pores over time. Apply it every morning as the final step!
              </p>
            </div>

          </div>

          <div style={{ textAlign: "center", marginTop: "50px" }}>
            <Link href="/shop?category=skincare" style={{ backgroundColor: "#e52860", color: "#fff", padding: "14px 32px", borderRadius: "30px", fontWeight: "800", fontSize: "14px", textDecoration: "none", display: "inline-block", boxShadow: "0 4px 15px rgba(229,40,96,0.3)", transition: "all 0.2s ease" }}>
              SHOP SKINCARE ESSENTIALS
            </Link>
          </div>
        </div>
      </div>

      <Footer />
      <MobileNavbar />
    </>
  );
}
