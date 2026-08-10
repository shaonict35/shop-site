"use client";

import React, { useEffect, useState } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import MobileNavbar from "../../components/MobileNavbar";
import Link from "next/link";

export default function HairCare101Page() {
  const [banner, setBanner] = useState<any>(null);

  useEffect(() => {
    fetch("http://localhost:5000/api/banners")
      .then(res => res.json())
      .then(data => {
        const found = data.find((b: any) => b.page === "Hair Care 101");
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
        <span className="shop-banner-title">{banner ? banner.title : "HAIR CARE 101"}</span>
        <span className="shop-banner-subtitle">
          Unlock the secrets to luscious, healthy hair
        </span>
      </div>

      <div style={{ backgroundColor: "#f0f4ff", minHeight: "80vh", padding: "40px 20px" }}>
        <div className="container" style={{ maxWidth: "800px", margin: "0 auto", backgroundColor: "#ffffff", padding: "50px", borderRadius: "20px", boxShadow: "0 10px 40px rgba(49,130,206,0.08)" }}>
          <div style={{ textAlign: "center", marginBottom: "40px" }}>
            <span style={{ color: "#3182ce", fontWeight: "900", letterSpacing: "2px", textTransform: "uppercase", fontSize: "12px", backgroundColor: "#ebf8ff", padding: "4px 12px", borderRadius: "20px" }}>GlowGoodly 101</span>
            <h1 style={{ fontSize: "36px", fontWeight: "900", color: "#0e1e38", marginTop: "15px", marginBottom: "15px" }}>HAIR CARE 101</h1>
            <p style={{ color: "#718096", fontSize: "16px", lineHeight: "1.6", maxWidth: "600px", margin: "0 auto" }}>
              Unlock the secrets to luscious, healthy, and strong hair. Whether you're dealing with hair fall, dandruff, or dryness, the right routine can transform your locks.
            </p>
          </div>

          <div style={{ width: "100%", height: "300px", borderRadius: "16px", overflow: "hidden", marginBottom: "40px", position: "relative" }}>
            <img src="https://images.unsplash.com/photo-1562322140-8baeececf3df?w=800&q=80" alt="Hair Care" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            <div style={{ position: "absolute", bottom: "20px", left: "20px", backgroundColor: "rgba(255,255,255,0.9)", padding: "10px 20px", borderRadius: "12px", fontWeight: "800", color: "#3182ce" }}>
              The Ultimate Hair Guide
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "30px", color: "#4a5568", lineHeight: "1.8", fontSize: "16px" }}>
            
            <div>
              <h2 style={{ fontSize: "22px", fontWeight: "800", color: "#0e1e38", borderBottom: "2px solid #ebf8ff", paddingBottom: "10px", marginBottom: "15px" }}>Step 1: Oiling & Pre-wash</h2>
              <p>
                Oiling your hair before a wash is a traditional secret that still works wonders. Oils like Coconut, Argan, or Almond oil penetrate the hair shaft, providing deep nourishment and reducing hygral fatigue (swelling of hair during wash). Massage it into your scalp to stimulate blood flow and promote hair growth.
              </p>
            </div>

            <div>
              <h2 style={{ fontSize: "22px", fontWeight: "800", color: "#0e1e38", borderBottom: "2px solid #ebf8ff", paddingBottom: "10px", marginBottom: "15px" }}>Step 2: Cleanse the Right Way</h2>
              <p>
                Choose a shampoo that addresses your primary concern—be it dandruff, hair fall, or oily scalp. Remember, shampoo is for the scalp, not the ends of your hair. Gently massage your scalp with the lather and let it rinse through the lengths. Avoid washing your hair with very hot water, as it strips natural oils.
              </p>
            </div>

            <div>
              <h2 style={{ fontSize: "22px", fontWeight: "800", color: "#0e1e38", borderBottom: "2px solid #ebf8ff", paddingBottom: "10px", marginBottom: "15px" }}>Step 3: Condition & Moisturize</h2>
              <p>
                Conditioner is non-negotiable. It smooths the hair cuticle, adding shine and reducing frizz. Apply conditioner only to the mid-lengths and ends of your hair. Leave it on for 2-3 minutes before rinsing with cool water to seal the cuticles.
              </p>
            </div>

            <div style={{ backgroundColor: "#ebf8ff", padding: "25px", borderRadius: "12px", borderLeft: "5px solid #3182ce" }}>
              <h3 style={{ margin: "0 0 10px 0", color: "#2b6cb0", fontSize: "18px", fontWeight: "800" }}>Pro Tip: Heat Protection</h3>
              <p style={{ margin: 0, fontSize: "15px" }}>
                Before you reach for that blow dryer or straightener, always apply a heat protectant spray or serum. This creates a barrier between your hair and the heat, preventing irreversible damage and split ends.
              </p>
            </div>

          </div>

          <div style={{ textAlign: "center", marginTop: "50px" }}>
            <Link href="/shop?category=hair-care" style={{ backgroundColor: "#3182ce", color: "#fff", padding: "14px 32px", borderRadius: "30px", fontWeight: "800", fontSize: "14px", textDecoration: "none", display: "inline-block", boxShadow: "0 4px 15px rgba(49,130,206,0.3)", transition: "all 0.2s ease" }}>
              SHOP HAIR CARE ESSENTIALS
            </Link>
          </div>
        </div>
      </div>

      <Footer />
      <MobileNavbar />
    </>
  );
}
