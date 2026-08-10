"use client";

import React from "react";
import Header from "../../components/Header";
import PageBanner from "../../components/PageBanner";
import Footer from "../../components/Footer";
import MobileNavbar from "../../components/MobileNavbar";

export default function MagazinePage() {
  const articles = [
    {
      id: 1,
      title: "The Ultimate Summer Skincare Routine for Glowing Skin",
      excerpt: "Summer is here, and it's time to swap heavy creams for hydrating gel moisturizers and high SPF sunscreens. Read our guide to stay fresh and protected all day.",
      category: "Skincare",
      date: "July 12, 2026",
      image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&auto=format&fit=crop&q=60"
    },
    {
      id: 2,
      title: "5 Makeup Trends Sizzling in Bangladesh Right Now",
      excerpt: "From dew-kissed clean girl aesthetics to bold glossy lips, discover what cosmetic looks are trending in Dhaka and beyond this beauty season.",
      category: "Makeup",
      date: "June 30, 2026",
      image: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=600&auto=format&fit=crop&q=60"
    },
    {
      id: 3,
      title: "Haircare 101: How to Prevent Frizz and Humidity Damage",
      excerpt: "Monsoon humidity can ruin your hairstyles. Learn how keratin serums and sulfate-free hair masks protect and smooth your cuticles from weather damage.",
      category: "Haircare",
      date: "June 25, 2026",
      image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&auto=format&fit=crop&q=60"
    },
    {
      id: 4,
      title: "Why Double Cleansing is the Secret to Flawless Skin",
      excerpt: "Cleansing oil followed by a foaming wash can melt away waterproof makeup, excess sebum, and environmental dust. Here is why skincare professionals recommend it.",
      category: "Routine",
      date: "June 18, 2026",
      image: "https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?w=600&auto=format&fit=crop&q=60"
    }
  ];

  return (
    <>
      <Header />
      <PageBanner title="GLOWGOODLY MAGAZINE" />
      <main className="container" style={{ padding: "40px 20px 60px 20px" }}>
        <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
          
          <h2 style={{ fontSize: "13px", fontWeight: "900", color: "#e52860", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: "25px", textAlign: "center" }}>
            LATEST BEAUTY CORNER
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "30px" }}>
            {articles.map((art) => (
              <div 
                key={art.id} 
                style={{ 
                  backgroundColor: "#ffffff", 
                  borderRadius: "12px", 
                  overflow: "hidden", 
                  boxShadow: "0 4px 15px rgba(0,0,0,0.04)", 
                  border: "1px solid #edf2f7",
                  display: "flex",
                  flexDirection: "column"
                }}
              >
                <div style={{ height: "180px", overflow: "hidden", position: "relative" }}>
                  <img 
                    src={art.image} 
                    alt={art.title} 
                    style={{ width: "100%", height: "100%", objectFit: "cover" }} 
                  />
                  <span style={{ position: "absolute", top: "12px", left: "12px", backgroundColor: "#e52860", color: "#ffffff", fontSize: "10px", fontWeight: "800", textTransform: "uppercase", padding: "4px 10px", borderRadius: "20px" }}>
                    {art.category}
                  </span>
                </div>
                <div style={{ padding: "20px", display: "flex", flexDirection: "column", flex: 1 }}>
                  <span style={{ fontSize: "11px", fontWeight: "700", color: "#a0aec0", marginBottom: "8px" }}>{art.date}</span>
                  <h3 style={{ fontSize: "16px", fontWeight: "800", color: "#0e1e38", lineHeight: "1.4", marginBottom: "10px", height: "45px", overflow: "hidden" }}>
                    {art.title}
                  </h3>
                  <p style={{ fontSize: "13px", color: "#4a5568", lineHeight: "1.6", marginBottom: "20px", flex: 1 }}>
                    {art.excerpt}
                  </p>
                  <button style={{ alignSelf: "flex-start", backgroundColor: "transparent", border: "none", color: "#e52860", fontSize: "12px", fontWeight: "900", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", padding: 0 }}>
                    READ ARTICLE ➔
                  </button>
                </div>
              </div>
            ))}
          </div>

        </div>
      </main>
      <Footer />
      <MobileNavbar />
    </>
  );
}
