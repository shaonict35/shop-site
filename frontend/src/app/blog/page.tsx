"use client";

import React, { useState } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import MobileNavbar from "../../components/MobileNavbar";
import Link from "next/link";

export default function BlogMagazinePage() {
  const [activeCategory, setActiveCategory] = useState("ALL");

  const categories = ["ALL", "SKINCARE", "MAKEUP", "HAIRCARE", "WELLNESS", "TIPS & TRICKS"];

  const featuredArticle = {
    id: "f-1",
    title: "গরমের দিনে ত্বকের যত্ন ও সঠিক সানস্ক্রিন নির্বাচন করার ১০০% কার্যকরী উপায়",
    excerpt: "তীব্র রোদে ত্বকের পোড়া ভাব দূর করতে এবং হাইপারপিগমেন্টেশন রোদে প্রতিরোধে কীভাবে সঠিক SPF বেছে নেবেন জেনে নিন বিস্তারিত...",
    category: "SKINCARE",
    date: "22 Aug 2026",
    author: "GlowGoodly Beauty Team",
    image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=1200&auto=format&fit=crop&q=80",
    readTime: "5 min read"
  };

  const articles = [
    {
      id: "1",
      title: "কেন ডাবল ক্লিনজিং আপনার ত্বকের ব্রন দূর করার গোপন চাবিকাঠি?",
      excerpt: "মেকআপ এবং সারাদিনের জমানো ময়লা দূর করতে অয়েল ক্লিনজার ও ফোমিং ওয়াশ ব্যবহারের সঠিক নিয়ম...",
      category: "SKINCARE",
      date: "20 Aug 2026",
      image: "https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?w=600&auto=format&fit=crop&q=80",
      author: "Shahnaz Begum"
    },
    {
      id: "2",
      title: "বাংলাদেশি ট্রেন্ডি মেকআপ লুক: নো-মেকআপ লুক তৈরির সহজ ধাপ",
      excerpt: "ন্যাচারাল গ্লো এবং হালকা কাভারেজ দিয়ে কীভাবে সারাদিন ফ্রেশ থাকবেন তার গাইডলাইন...",
      category: "MAKEUP",
      date: "18 Aug 2026",
      image: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=600&auto=format&fit=crop&q=80",
      author: "Tania Afroze"
    },
    {
      id: "3",
      title: "বর্ষাকালে চুলের শুষ্কতা ও চুল পড়া বন্ধ করার সেরা কেরাডিন ট্রিটমেন্ট",
      excerpt: "অতিরিক্ত আর্দ্রতায় চুলের জট ও স্প্লিট এন্ডস থেকে রক্ষা পাওয়ার ঘরোয়া টিপস...",
      category: "HAIRCARE",
      date: "15 Aug 2026",
      image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&auto=format&fit=crop&q=80",
      author: "Dr. Farhana"
    },
    {
      id: "4",
      title: "লিপস্টিক দীর্ঘস্থায়ী করার ৫টি দুর্দান্ত হ্যাকস যা জানা জরুরি",
      excerpt: "খাবার বা পানি খাওয়ার পরেও ঠোঁটের মেকআপ ঠিক রাখার আসল কৌশলসমূহ দেখে নিন...",
      category: "MAKEUP",
      date: "12 Aug 2026",
      image: "https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=600&auto=format&fit=crop&q=80",
      author: "GlowGoodly Style Desk"
    },
    {
      id: "5",
      title: "ভিটামিন সি সিরাম ব্যবহারের সঠিক সময় ও সেরা পদ্ধতি",
      excerpt: "ত্বক উজ্জ্বল করতে এবং বয়সের ছাপ দূর করতে ভিটামিন সি কখন ও কীভাবে লাগাবেন...",
      category: "SKINCARE",
      date: "10 Aug 2026",
      image: "https://images.unsplash.com/photo-1608248597279-f99d160bfbc5?w=600&auto=format&fit=crop&q=80",
      author: "Beauty Editorial"
    },
    {
      id: "6",
      title: "নাইট টাইম স্কিনকেয়ার রুটিন: ঘুমানোর আগে কেন নাইট ক্রিম জরুরি?",
      excerpt: "রাতে ত্বক পুনর্গঠন প্রক্রিয়ায় সহায়তা করতে রেটিনল ও হাইয়ালুরোনিক অ্যাসিডের কার্যকারিতা...",
      category: "TIPS & TRICKS",
      date: "08 Aug 2026",
      image: "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=600&auto=format&fit=crop&q=80",
      author: "GlowGoodly Team"
    }
  ];

  const filtered = activeCategory === "ALL" 
    ? articles 
    : articles.filter(a => a.category === activeCategory);

  return (
    <>
      <Header />
      
      {/* Blog Top Header Section (Shajgoj Inspired) */}
      <div style={{ backgroundColor: "#fff0f5", borderBottom: "1px solid #fce7f0", padding: "30px 20px 25px 20px" }}>
        <div className="container" style={{ maxWidth: "1200px", margin: "0 auto", textAlign: "center" }}>
          <span style={{ fontSize: "12px", fontWeight: "800", color: "#e52860", letterSpacing: "2px", textTransform: "uppercase" }}>
            GLOWGOODLY BEAUTY MAGAZINE & ADVICE
          </span>
          <h1 style={{ fontSize: "32px", fontWeight: "900", color: "#0f172a", marginTop: "6px", fontFamily: "Montserrat, sans-serif" }}>
            স্মার্ট সৌন্দর্য্য ও স্কিনকেয়ার গাইড 🌸
          </h1>
          <p style={{ fontSize: "14px", color: "#64748b", maxWidth: "650px", margin: "8px auto 0 auto", fontWeight: "500" }}>
            বাংলাদেশি মেকআপ, স্কিনকেয়ার ও লাইফস্টাইলের সেরা বিউটি সিক্রেটস এবং বিশেষজ্ঞ পরামর্শ।
          </p>

          {/* Category Navigation Pills */}
          <div style={{ display: "flex", justifyContent: "center", gap: "10px", flexWrap: "wrap", marginTop: "24px" }}>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                style={{
                  padding: "8px 18px",
                  borderRadius: "25px",
                  border: activeCategory === cat ? "none" : "1.5px solid #cbd5e1",
                  backgroundColor: activeCategory === cat ? "#e52860" : "#ffffff",
                  color: activeCategory === cat ? "#ffffff" : "#475569",
                  fontWeight: "700",
                  fontSize: "12.5px",
                  cursor: "pointer",
                  boxShadow: activeCategory === cat ? "0 4px 12px rgba(229, 40, 96, 0.25)" : "none",
                  transition: "all 0.2s ease"
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="container" style={{ maxWidth: "1200px", margin: "30px auto 60px auto", padding: "0 16px" }}>
        
        {/* Top Hero Featured Article */}
        <div style={{ backgroundColor: "#ffffff", borderRadius: "16px", overflow: "hidden", border: "1px solid #e2e8f0", boxShadow: "0 4px 20px rgba(0,0,0,0.04)", marginBottom: "40px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))" }}>
          <div style={{ position: "relative", minHeight: "300px" }}>
            <img src={featuredArticle.image} alt={featuredArticle.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            <span style={{ position: "absolute", top: "16px", left: "16px", backgroundColor: "#e52860", color: "#ffffff", fontSize: "11px", fontWeight: "800", textTransform: "uppercase", padding: "5px 12px", borderRadius: "20px" }}>
              {featuredArticle.category}
            </span>
          </div>
          <div style={{ padding: "35px 30px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <div style={{ display: "flex", gap: "12px", fontSize: "12px", color: "#94a3b8", fontWeight: "600", marginBottom: "10px" }}>
              <span>📅 {featuredArticle.date}</span>
              <span>•</span>
              <span>⏱️ {featuredArticle.readTime}</span>
            </div>
            <h2 style={{ fontSize: "24px", fontWeight: "900", color: "#0f172a", lineHeight: "1.4", marginBottom: "14px" }}>
              {featuredArticle.title}
            </h2>
            <p style={{ fontSize: "14px", color: "#475569", lineHeight: "1.7", marginBottom: "22px" }}>
              {featuredArticle.excerpt}
            </p>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "12px", fontWeight: "700", color: "#e52860" }}>✍️ {featuredArticle.author}</span>
              <button style={{ backgroundColor: "#e52860", color: "#ffffff", border: "none", padding: "10px 22px", borderRadius: "8px", fontWeight: "700", fontSize: "13px", cursor: "pointer" }}>
                পড়ুন ➔
              </button>
            </div>
          </div>
        </div>

        {/* AdSense Banner Placement Slot 1 (Tk Earn Space) */}
        <div style={{ backgroundColor: "#f8fafc", border: "1.5px dashed #cbd5e1", borderRadius: "12px", padding: "20px", textAlign: "center", marginBottom: "40px" }}>
          <span style={{ fontSize: "10px", fontWeight: "800", color: "#94a3b8", letterSpacing: "1px", textTransform: "uppercase", display: "block", marginBottom: "6px" }}>
            SPONSORED / GOOGLE ADSENSE SPACE
          </span>
          <div style={{ minHeight: "90px", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#ffffff", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
            <p style={{ fontSize: "13px", color: "#64748b", fontWeight: "600" }}>
              📢 Google AdSense / Affiliate Banner Ad Container (Auto-monetized for glowgoodly.com)
            </p>
          </div>
        </div>

        {/* Main Grid: Articles + Sidebar Layout */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "35px" }}>
          
          {/* Left Grid Articles */}
          <div>
            <h3 style={{ fontSize: "18px", fontWeight: "900", color: "#0f172a", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ width: "4px", height: "18px", backgroundColor: "#e52860", display: "inline-block", borderRadius: "2px" }}></span>
              সর্বশেষ প্রকাশিত আর্টিকেলসমূহ
            </h3>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "24px" }}>
              {filtered.map((art) => (
                <div 
                  key={art.id}
                  style={{
                    backgroundColor: "#ffffff",
                    borderRadius: "14px",
                    overflow: "hidden",
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 4px 15px rgba(0,0,0,0.03)",
                    display: "flex",
                    flexDirection: "column",
                    transition: "transform 0.2s ease"
                  }}
                >
                  <div style={{ height: "170px", position: "relative", overflow: "hidden" }}>
                    <img src={art.image} alt={art.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    <span style={{ position: "absolute", top: "10px", left: "10px", backgroundColor: "rgba(15, 23, 42, 0.8)", color: "#ffffff", fontSize: "10px", fontWeight: "800", padding: "4px 9px", borderRadius: "12px", backdropFilter: "blur(4px)" }}>
                      {art.category}
                    </span>
                  </div>
                  <div style={{ padding: "18px", display: "flex", flexDirection: "column", flex: 1 }}>
                    <span style={{ fontSize: "11px", fontWeight: "700", color: "#94a3b8", marginBottom: "6px" }}>{art.date}</span>
                    <h4 style={{ fontSize: "15px", fontWeight: "800", color: "#0f172a", lineHeight: "1.4", marginBottom: "8px", height: "42px", overflow: "hidden" }}>
                      {art.title}
                    </h4>
                    <p style={{ fontSize: "12.5px", color: "#64748b", lineHeight: "1.5", marginBottom: "16px", flex: 1 }}>
                      {art.excerpt}
                    </p>
                    <button style={{ backgroundColor: "#fff0f5", color: "#e52860", border: "1px solid #fce7f0", padding: "8px 14px", borderRadius: "6px", fontWeight: "800", fontSize: "12px", cursor: "pointer", alignSelf: "flex-start" }}>
                      পড়ুন ➔
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Sidebar (Shajgoj Style Trending Widgets & Monetization) */}
          <div style={{ display: "flex", flexDirection: "column", gap: "25px" }}>
            
            {/* Widget 1: Trending Posts */}
            <div style={{ backgroundColor: "#ffffff", padding: "22px", borderRadius: "14px", border: "1px solid #e2e8f0" }}>
              <h4 style={{ fontSize: "16px", fontWeight: "900", color: "#0f172a", marginBottom: "16px", borderBottom: "2px solid #fce7f0", paddingBottom: "10px" }}>
                🔥 জনপ্রিয় ব্লগ পোস্ট
              </h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {articles.slice(0, 4).map((art, idx) => (
                  <div key={art.id} style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                    <span style={{ fontSize: "18px", fontWeight: "900", color: "#cbd5e1", width: "22px" }}>0{idx + 1}</span>
                    <div>
                      <h5 style={{ fontSize: "13px", fontWeight: "800", color: "#1e293b", lineHeight: "1.3", margin: 0 }}>
                        {art.title}
                      </h5>
                      <span style={{ fontSize: "11px", color: "#e52860", fontWeight: "700" }}>{art.category}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Widget 2: Monetized Affiliate Products Widget */}
            <div style={{ backgroundColor: "#fff0f5", padding: "22px", borderRadius: "14px", border: "1px solid #fce7f0", textAlign: "center" }}>
              <span style={{ fontSize: "11px", fontWeight: "800", color: "#e52860", textTransform: "uppercase" }}>
                RECOMMENDED PRODUCTS
              </span>
              <h4 style={{ fontSize: "16px", fontWeight: "900", color: "#0f172a", marginTop: "4px" }}>
                ত্বকের যত্নে সেরা অফার 🛍️
              </h4>
              <p style={{ fontSize: "12px", color: "#64748b", margin: "8px 0 16px 0" }}>
                অরিজিনাল অফার প্রডাক্ট সরাসরি GlowGoodly শপ থেকে অর্ডার করুন।
              </p>
              <Link href="/shop" style={{ display: "block", backgroundColor: "#e52860", color: "#ffffff", padding: "10px 16px", borderRadius: "8px", fontWeight: "800", fontSize: "13px", textDecoration: "none" }}>
                শপ ব্রাউজ করুন ➔
              </Link>
            </div>

            {/* Widget 3: Newsletter Box */}
            <div style={{ backgroundColor: "#0f172a", padding: "22px", borderRadius: "14px", color: "#ffffff" }}>
              <h4 style={{ fontSize: "16px", fontWeight: "900", marginBottom: "6px" }}>
                বিউটি টিপস ইমেইলে পান 📩
              </h4>
              <p style={{ fontSize: "12px", color: "#94a3b8", lineHeight: "1.5", marginBottom: "14px" }}>
                সাবস্ক্রাইব করে রাখুন নতুন বিউটি ট্রেন্ড ও স্পেশাল ছাড়ের খবর সবার আগে পাওয়ার জন্য।
              </p>
              <input type="email" placeholder="আপনার ইমেইল ঠিকানা" style={{ width: "100%", padding: "10px 12px", borderRadius: "6px", border: "none", fontSize: "12.5px", marginBottom: "10px", outline: "none" }} />
              <button style={{ width: "100%", backgroundColor: "#e52860", color: "#ffffff", padding: "10px", borderRadius: "6px", border: "none", fontWeight: "800", fontSize: "13px", cursor: "pointer" }}>
                সাবস্ক্রাইব করুন
              </button>
            </div>

          </div>

        </div>

      </main>

      <Footer />
      <MobileNavbar />
    </>
  );
}

