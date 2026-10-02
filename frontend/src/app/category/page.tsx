"use client";

import React, { useState } from "react";
import Link from "next/link";
import Header from "../../components/Header";
import PromoBanner from "../../components/PromoBanner";
import Footer from "../../components/Footer";
import MobileNavbar from "../../components/MobileNavbar";
import { Sparkles, ArrowRight, Search, Heart, ShieldCheck, Truck, CheckCircle2 } from "lucide-react";

interface CategoryMeta {
  name: string;
  slug: string;
  icon: string;
  badge?: string;
  tagline: string;
  accentColor: string;
  subs: string[];
}

const CATEGORIES: CategoryMeta[] = [
  {
    name: "Makeup",
    slug: "makeup",
    icon: "💄",
    badge: "Trending",
    tagline: "Foundation, Lipstick, Kajal, Palettes & Brushes",
    accentColor: "#e52860",
    subs: [
      "Foundation", "Lipstick", "Concealer", "Liquid Lipstick", "Eye Shadow", "Eyeliner", 
      "Face Primer", "Mascara", "Kajal", "Compact Powder", "Highlighter", "Blush", "Brush Sets"
    ]
  },
  {
    name: "Skincare",
    slug: "skincare",
    icon: "✨",
    badge: "Popular",
    tagline: "Face Wash, Serums, Sunscreen, Toners & Moisturizers",
    accentColor: "#0284c7",
    subs: [
      "Face Wash", "Face Serum", "Sunscreen", "Day Cream", "Night Cream", "Face Toner",
      "Sheet Mask", "Acne Treatment", "Cleansing Oil", "Brightening", "Pore Care"
    ]
  },
  {
    name: "Haircare",
    slug: "haircare",
    icon: "💇‍♀️",
    tagline: "Shampoo, Conditioner, Hair Oils & Fall Recovery",
    accentColor: "#059669",
    subs: [
      "Shampoo", "Conditioner", "Hair Mask", "Hair Fall", "Dandruff", 
      "Coconut Oil", "Argan Oil", "Onion Hair Oil", "Dry & Frizzy Hair"
    ]
  },
  {
    name: "Personal Care",
    slug: "personal-care",
    icon: "🧴",
    tagline: "Body Wash, Body Lotions, Deodorants & Hygiene",
    accentColor: "#7c3aed",
    subs: [
      "Body Wash", "Body Lotion", "Body Spray", "Deodorant", "Shower Gel",
      "Soap Bar", "Feminine Hygiene", "Oral Care", "Foot Care"
    ]
  },
  {
    name: "Fragrance",
    slug: "fragrance",
    icon: "🌸",
    badge: "Luxury",
    tagline: "Women's Perfume, Men's Cologne & Body Mists",
    accentColor: "#db2777",
    subs: [
      "Women Fragrance", "Men Fragrance", "Body Mist", "Eau De Parfum", 
      "Eau De Toilette", "Attar", "Gift Sets", "Cologne"
    ]
  },
  {
    name: "Perfect Match COMBO",
    slug: "combo",
    icon: "🎁",
    badge: "Special Value",
    tagline: "Curated Skincare & Makeup Value Combos",
    accentColor: "#ea580c",
    subs: [
      "Skin Combos", "Makeup Combos", "Hair Combos", "Acne Clearance Combo", 
      "Brightening Kit", "Everyday Makeup Kit", "Bridal Glow Combo"
    ]
  },
  {
    name: "Clearance SALE",
    slug: "clearance-sale",
    icon: "🔥",
    badge: "Up to 50% Off",
    tagline: "Exclusive deals, discounted cosmetics & flash sales",
    accentColor: "#dc2626",
    subs: [
      "Makeup Deals", "Skincare Deals", "Haircare Deals", "Lipsticks under 499", 
      "Palettes at 40% Off", "Serums Flat 30% Off", "Cleansers B1G1"
    ]
  },
  {
    name: "Mom & Baby",
    slug: "mom-baby",
    icon: "👶",
    tagline: "Gentle baby care, maternity essentials & diapering",
    accentColor: "#0891b2",
    subs: [
      "Baby Wash", "Baby Lotion", "Baby Shampoo", "Baby Diapers", 
      "Nappy Cream", "Baby Wipes", "Stretch Mark Cream"
    ]
  },
  {
    name: "Men's Care",
    slug: "men",
    icon: "🧔",
    tagline: "Men's face wash, beard grooming & styling",
    accentColor: "#334155",
    subs: [
      "Mens Face Wash", "Beard Oil & Cream", "Shaving Gel & Foam", 
      "Hair Styling Wax", "Anti Dandruff Shampoo", "Mens Cologne"
    ]
  },
  {
    name: "Jewellery",
    slug: "jewellery",
    icon: "💍",
    tagline: "Earrings, Necklaces, Rings, Bracelets & Jhumkas",
    accentColor: "#ca8a04",
    subs: [
      "Earrings", "Necklace", "Jhumkas", "Bracelet", "Ring", 
      "Chokers", "Pendant Necklaces", "Charm Bracelets"
    ]
  },
  {
    name: "Undergarments",
    slug: "undergarments",
    icon: "👙",
    tagline: "Comfortable everyday bras, panties & shapewear",
    accentColor: "#9333ea",
    subs: [
      "T-Shirt Bra", "Sports Bra", "Cotton Panty", "Seamless Panty", 
      "Shapewear", "Panty Packs", "Lace Bra"
    ]
  }
];

export default function CategoryDirectoryPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredCategories = CATEGORIES.filter((cat) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const matchesName = cat.name.toLowerCase().includes(term);
    const matchesTagline = cat.tagline.toLowerCase().includes(term);
    const matchesSub = cat.subs.some(sub => sub.toLowerCase().includes(term));
    return matchesName || matchesTagline || matchesSub;
  });

  return (
    <div style={{ background: "#f8fafc", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Header />
      <PromoBanner />

      <main style={{ flex: 1, paddingBottom: "60px" }}>
        
        {/* Hero Section */}
        <section 
          style={{ 
            background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #311025 100%)", 
            color: "#ffffff", 
            padding: "50px 20px 60px 20px", 
            textAlign: "center",
            position: "relative",
            overflow: "hidden"
          }}
        >
          <div style={{ position: "absolute", top: "-50px", left: "10%", width: "200px", height: "200px", background: "rgba(229, 40, 96, 0.15)", filter: "blur(60px)", borderRadius: "50%" }} />
          <div style={{ position: "absolute", bottom: "-30px", right: "15%", width: "220px", height: "220px", background: "rgba(147, 51, 234, 0.15)", filter: "blur(70px)", borderRadius: "50%" }} />

          <div style={{ maxWidth: "800px", margin: "0 auto", position: "relative", zIndex: 2 }}>
            
            <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(255,255,255,0.1)", backdropFilter: "blur(10px)", padding: "6px 16px", borderRadius: "30px", fontSize: "13px", fontWeight: "700", color: "#f472b6", marginBottom: "16px", border: "1px solid rgba(255,255,255,0.15)" }}>
              <Sparkles size={15} />
              <span>GlowGoodly Beauty Directory</span>
            </div>

            <h1 style={{ fontSize: "36px", fontWeight: "900", letterSpacing: "-0.5px", marginBottom: "14px", lineHeight: "1.2" }}>
              Explore All Categories
            </h1>

            <p style={{ fontSize: "16px", color: "#cbd5e1", maxWidth: "600px", margin: "0 auto 28px auto", lineHeight: "1.6" }}>
              Discover 100% authentic cosmetics, skincare, haircare & fragrances from top international brands with fast cash-on-delivery in Bangladesh.
            </p>

            {/* Quick Search */}
            <div style={{ maxWidth: "520px", margin: "0 auto", position: "relative" }}>
              <Search size={20} color="#94a3b8" style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)" }} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search categories, subcategories (e.g. Face Wash, Lipstick)..."
                style={{
                  width: "100%",
                  padding: "14px 16px 14px 48px",
                  borderRadius: "14px",
                  border: "2px solid rgba(255,255,255,0.2)",
                  background: "rgba(255,255,255,0.95)",
                  color: "#0f172a",
                  fontSize: "15px",
                  fontWeight: "600",
                  outline: "none",
                  boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
                  boxSizing: "border-box"
                }}
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  style={{
                    position: "absolute",
                    right: "14px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "transparent",
                    border: "none",
                    color: "#64748b",
                    fontSize: "16px",
                    fontWeight: "800",
                    cursor: "pointer"
                  }}
                >
                  ✕
                </button>
              )}
            </div>

            {/* Trust Badges */}
            <div style={{ display: "flex", justifyContent: "center", gap: "24px", marginTop: "24px", flexWrap: "wrap", fontSize: "13px", color: "#e2e8f0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <ShieldCheck size={16} color="#34d399" />
                <span>100% Authentic Guarantee</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <Truck size={16} color="#38bdf8" />
                <span>Fast Nationwide Delivery</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <CheckCircle2 size={16} color="#fbbf24" />
                <span>Cash on Delivery</span>
              </div>
            </div>

          </div>
        </section>

        {/* Categories Grid Container */}
        <section style={{ maxWidth: "1280px", margin: "-30px auto 0 auto", padding: "0 20px", position: "relative", zIndex: 10 }}>
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: "24px" }}>
            {filteredCategories.map((cat, idx) => (
              <div
                key={idx}
                style={{
                  background: "#ffffff",
                  borderRadius: "18px",
                  border: "1px solid #e2e8f0",
                  padding: "24px",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
                  display: "flex",
                  flexDirection: "column",
                  transition: "transform 0.2s ease, box-shadow 0.2s ease",
                }}
              >
                {/* Card Top Row */}
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "14px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div 
                      style={{ 
                        width: "52px", 
                        height: "52px", 
                        borderRadius: "14px", 
                        background: `${cat.accentColor}15`, 
                        display: "flex", 
                        alignItems: "center", 
                        justifyContent: "center",
                        fontSize: "26px",
                        border: `1.5px solid ${cat.accentColor}30`
                      }}
                    >
                      {cat.icon}
                    </div>
                    <div>
                      <Link 
                        href={`/category/${cat.slug}`}
                        style={{ textDecoration: "none", color: "#0f172a" }}
                      >
                        <h2 style={{ fontSize: "20px", fontWeight: "800", margin: 0, letterSpacing: "-0.3px" }}>
                          {cat.name}
                        </h2>
                      </Link>
                      <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "600" }}>
                        {cat.subs.length}+ Subcategories
                      </span>
                    </div>
                  </div>

                  {cat.badge && (
                    <span 
                      style={{ 
                        background: cat.accentColor, 
                        color: "#ffffff", 
                        fontSize: "11px", 
                        fontWeight: "800", 
                        padding: "3px 10px", 
                        borderRadius: "20px",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px"
                      }}
                    >
                      {cat.badge}
                    </span>
                  )}
                </div>

                {/* Tagline */}
                <p style={{ fontSize: "13.5px", color: "#475569", margin: "0 0 16px 0", lineHeight: "1.5" }}>
                  {cat.tagline}
                </p>

                {/* Popular Subcategories Pills */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "20px", flex: 1 }}>
                  {cat.subs.slice(0, 7).map((sub, sIdx) => (
                    <Link
                      key={sIdx}
                      href={`/category/${cat.slug}?sub=${encodeURIComponent(sub)}`}
                      style={{
                        background: "#f1f5f9",
                        color: "#334155",
                        fontSize: "12px",
                        fontWeight: "600",
                        padding: "4px 10px",
                        borderRadius: "8px",
                        textDecoration: "none",
                        transition: "background 0.15s ease",
                      }}
                    >
                      {sub}
                    </Link>
                  ))}
                  {cat.subs.length > 7 && (
                    <Link
                      href={`/category/${cat.slug}`}
                      style={{
                        background: "#fff0f5",
                        color: "#e52860",
                        fontSize: "11.5px",
                        fontWeight: "700",
                        padding: "4px 8px",
                        borderRadius: "8px",
                        textDecoration: "none"
                      }}
                    >
                      +{cat.subs.length - 7} more
                    </Link>
                  )}
                </div>

                {/* Browse CTA Button */}
                <Link
                  href={`/category/${cat.slug}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    width: "100%",
                    padding: "11px",
                    borderRadius: "10px",
                    background: cat.accentColor,
                    color: "#ffffff",
                    fontWeight: "800",
                    fontSize: "14px",
                    textDecoration: "none",
                    textAlign: "center",
                    boxShadow: `0 4px 12px ${cat.accentColor}33`,
                    boxSizing: "border-box"
                  }}
                >
                  <span>Explore {cat.name}</span>
                  <ArrowRight size={16} />
                </Link>

              </div>
            ))}
          </div>

          {filteredCategories.length === 0 && (
            <div style={{ textAlign: "center", padding: "60px 20px", background: "#ffffff", borderRadius: "16px", marginTop: "20px" }}>
              <p style={{ fontSize: "16px", color: "#64748b", fontWeight: "600" }}>
                No category found matching &ldquo;{searchTerm}&rdquo;
              </p>
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                style={{
                  background: "#e52860",
                  color: "#ffffff",
                  border: "none",
                  padding: "10px 20px",
                  borderRadius: "8px",
                  fontWeight: "700",
                  cursor: "pointer",
                  marginTop: "10px"
                }}
              >
                View All Categories
              </button>
            </div>
          )}

        </section>

      </main>

      <Footer />
      <MobileNavbar />
    </div>
  );
}
