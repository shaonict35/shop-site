"use client";

import React, { useEffect, useState } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import MobileNavbar from "../../components/MobileNavbar";
import Link from "next/link";
import { API_BASE } from "../../utils/api";

export default function Makeup101Page() {
  const [banner, setBanner] = useState<any>(null);

  useEffect(() => {
    fetch(`${API_BASE}/banners`)
      .then(res => res.json())
      .then(data => {
        const found = data.find((b: any) => b.page === "Makeup 101");
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
        <span className="shop-banner-title">{banner ? banner.title : "MAKEUP 101"}</span>
        <span className="shop-banner-subtitle">
          Enhance your natural beauty
        </span>
      </div>

      <div style={{ backgroundColor: "#fff5f0", minHeight: "80vh", padding: "40px 20px" }}>
        <div className="container" style={{ maxWidth: "800px", margin: "0 auto", backgroundColor: "#ffffff", padding: "50px", borderRadius: "20px", boxShadow: "0 10px 40px rgba(221,107,32,0.08)" }}>
          <div style={{ textAlign: "center", marginBottom: "40px" }}>
            <span style={{ color: "#dd6b20", fontWeight: "900", letterSpacing: "2px", textTransform: "uppercase", fontSize: "12px", backgroundColor: "#feebc8", padding: "4px 12px", borderRadius: "20px" }}>GlowGoodly 101</span>
            <h1 style={{ fontSize: "36px", fontWeight: "900", color: "#0e1e38", marginTop: "15px", marginBottom: "15px" }}>MAKEUP 101</h1>
            <p style={{ color: "#718096", fontSize: "16px", lineHeight: "1.6", maxWidth: "600px", margin: "0 auto" }}>
              Whether you are a beginner or a pro, mastering the basics of makeup is key to a flawless look. Discover the essential steps to enhance your natural beauty.
            </p>
          </div>

          <div style={{ width: "100%", height: "300px", borderRadius: "16px", overflow: "hidden", marginBottom: "40px", position: "relative" }}>
            <img src="https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&q=80" alt="Makeup" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            <div style={{ position: "absolute", bottom: "20px", left: "20px", backgroundColor: "rgba(255,255,255,0.9)", padding: "10px 20px", borderRadius: "12px", fontWeight: "800", color: "#dd6b20" }}>
              The Ultimate Makeup Guide
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "30px", color: "#4a5568", lineHeight: "1.8", fontSize: "16px" }}>
            
            <div>
              <h2 style={{ fontSize: "22px", fontWeight: "800", color: "#0e1e38", borderBottom: "2px solid #feebc8", paddingBottom: "10px", marginBottom: "15px" }}>Step 1: Prep & Prime</h2>
              <p>
                Flawless makeup starts with a good canvas. Cleanse and moisturize your face first. Then, apply a primer suited for your skin type (matte for oily skin, hydrating for dry skin). Primer minimizes pores and helps your makeup last all day without creasing.
              </p>
            </div>

            <div>
              <h2 style={{ fontSize: "22px", fontWeight: "800", color: "#0e1e38", borderBottom: "2px solid #feebc8", paddingBottom: "10px", marginBottom: "15px" }}>Step 2: Base (Foundation & Concealer)</h2>
              <p>
                Apply foundation starting from the center of your face and blending outward using a damp sponge or a brush. Follow up with a concealer under the eyes and on any blemishes. The key to a natural look is to blend thoroughly until it looks like a second skin.
              </p>
            </div>

            <div>
              <h2 style={{ fontSize: "22px", fontWeight: "800", color: "#0e1e38", borderBottom: "2px solid #feebc8", paddingBottom: "10px", marginBottom: "15px" }}>Step 3: Add Dimension (Contour & Blush)</h2>
              <p>
                Bring life back to your face by adding dimension. Use a bronzer or contour powder along the hollows of your cheeks, jawline, and forehead. Smile and apply blush to the apples of your cheeks. Blend upwards for a lifted, youthful appearance.
              </p>
            </div>
            
            <div>
              <h2 style={{ fontSize: "22px", fontWeight: "800", color: "#0e1e38", borderBottom: "2px solid #feebc8", paddingBottom: "10px", marginBottom: "15px" }}>Step 4: Eyes & Lips</h2>
              <p>
                Define your brows, swipe on some eyeshadow, and apply mascara to make your eyes pop. Finish your look with a lip color of your choice. Don't forget to use a lip liner if you want your lipstick to stay put longer!
              </p>
            </div>

            <div style={{ backgroundColor: "#feebc8", padding: "25px", borderRadius: "12px", borderLeft: "5px solid #dd6b20" }}>
              <h3 style={{ margin: "0 0 10px 0", color: "#c05621", fontSize: "18px", fontWeight: "800" }}>Pro Tip: Setting Spray</h3>
              <p style={{ margin: 0, fontSize: "15px" }}>
                Once your masterpiece is complete, don't let it melt away! Lock everything in place with a few spritzes of setting spray. This removes any powdery finish and ensures your makeup stays flawless through sweat and humidity.
              </p>
            </div>

          </div>

          <div style={{ textAlign: "center", marginTop: "50px" }}>
            <Link href="/shop?category=makeup" style={{ backgroundColor: "#dd6b20", color: "#fff", padding: "14px 32px", borderRadius: "30px", fontWeight: "800", fontSize: "14px", textDecoration: "none", display: "inline-block", boxShadow: "0 4px 15px rgba(221,107,32,0.3)", transition: "all 0.2s ease" }}>
              SHOP MAKEUP ESSENTIALS
            </Link>
          </div>
        </div>
      </div>

      <Footer />
      <MobileNavbar />
    </>
  );
}
