"use client";

import React, { useState } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import MobileNavbar from "../../components/MobileNavbar";
import Link from "next/link";
import { API_BASE } from "../../utils/api";

export default function BlogMagazinePage() {
  const [activeCategory, setActiveCategory] = useState("ALL");
  const [subscribed, setSubscribed] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [selectedArticle, setSelectedArticle] = useState<any | null>(null);

  const [allBlogs, setAllBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    let mounted = true;
    fetch(`${API_BASE}/blogs`)
      .then((res) => res.json())
      .then((data) => {
        if (mounted && Array.isArray(data)) {
          setAllBlogs(data);
        }
      })
      .catch((err) => console.error("Error loading blogs", err))
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, []);

  const featuredArticle = allBlogs.find((b) => b.isFeatured) || allBlogs[0] || null;
  const articles = featuredArticle ? allBlogs.filter((b) => b.id !== featuredArticle.id) : allBlogs;

  const categories = React.useMemo(() => {
    const cats = new Set<string>(["ALL"]);
    allBlogs.forEach((b) => {
      if (b.category) cats.add(b.category.toUpperCase());
    });
    return Array.from(cats);
  }, [allBlogs]);

  const filtered = activeCategory === "ALL" 
    ? articles 
    : articles.filter(a => (a.category || "").toUpperCase() === activeCategory);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) return;
    setSubscribed(true);
    setEmailInput("");
  };

  return (
    <>
      <Header />
      
      {/* Blog Top Header Section with Animated Gradient & Badges */}
      <div
        style={{
          background: "linear-gradient(135deg, #fff0f5 0%, #fff1f2 50%, #fdf2f8 100%)",
          borderBottom: "1px solid #fce7f0",
          padding: "45px 20px 35px 20px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Floating background decorative orbs */}
        <div
          style={{
            position: "absolute",
            top: "-50px",
            right: "5%",
            width: "200px",
            height: "200px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(229,40,96,0.15) 0%, rgba(229,40,96,0) 70%)",
            animation: "pulseGlow 4s infinite ease-in-out",
            pointerEvents: "none",
          }}
        />

        <div className="container" style={{ maxWidth: "1200px", margin: "0 auto", textAlign: "center", position: "relative", zIndex: 1 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "5px 16px",
              backgroundColor: "#ffffff",
              borderRadius: "30px",
              boxShadow: "0 4px 14px rgba(229,40,96,0.15)",
              marginBottom: "12px",
              animation: "badgePulse 2.5s infinite ease-in-out",
            }}
          >
            <span>🌸</span>
            <span style={{ fontSize: "11.5px", fontWeight: "800", color: "#e52860", letterSpacing: "1.5px", textTransform: "uppercase" }}>
              GlowGoodly Beauty & Skincare Magazine
            </span>
          </div>

          <h1
            style={{
              fontSize: "34px",
              fontWeight: "900",
              color: "#0f172a",
              marginTop: "4px",
              fontFamily: "'Montserrat', sans-serif",
              letterSpacing: "-0.5px",
            }}
          >
            স্মার্ট সৌন্দর্য্য ও আন্তর্জাতিক স্কিনকেয়ার গাইড 💄
          </h1>
          <p style={{ fontSize: "14.5px", color: "#64748b", maxWidth: "680px", margin: "10px auto 0 auto", fontWeight: "500", lineHeight: "1.7" }}>
            বাংলাদেশি মেকআপ, কোরিয়ান স্কিনকেয়ার ও বিশেষজ্ঞ ডার্মাটোলজি পরামর্শ — আপনার প্রতিদিনের রূপচর্চার নির্ভরযোগ্য সঙ্গী।
          </p>

          {/* Animated Category Navigation Pills */}
          <div style={{ display: "flex", justifyContent: "center", gap: "10px", flexWrap: "wrap", marginTop: "26px" }}>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className="glow-interactive-button"
                style={{
                  padding: "9px 20px",
                  borderRadius: "25px",
                  border: activeCategory === cat ? "none" : "1.5px solid #cbd5e1",
                  backgroundColor: activeCategory === cat ? "#e52860" : "#ffffff",
                  color: activeCategory === cat ? "#ffffff" : "#475569",
                  fontWeight: "800",
                  fontSize: "12px",
                  cursor: "pointer",
                  boxShadow: activeCategory === cat ? "0 6px 18px rgba(229, 40, 96, 0.3)" : "0 2px 5px rgba(0,0,0,0.02)",
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="container" style={{ maxWidth: "1200px", margin: "35px auto 70px auto", padding: "0 16px" }}>
        
        {/* Top Hero Featured Article with Interactive Hover */}
        {featuredArticle && (
        <div
          className="glow-card-interactive"
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "20px",
            overflow: "hidden",
            border: "1px solid #e2e8f0",
            boxShadow: "0 6px 25px rgba(0,0,0,0.05)",
            marginBottom: "40px",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          }}
        >
          <div style={{ position: "relative", minHeight: "320px", overflow: "hidden" }}>
            <img
              src={featuredArticle.image}
              alt={featuredArticle.title}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                transition: "transform 0.5s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.04)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
            />
            <span
              style={{
                position: "absolute",
                top: "16px",
                left: "16px",
                backgroundColor: "#e52860",
                color: "#ffffff",
                fontSize: "11px",
                fontWeight: "900",
                textTransform: "uppercase",
                padding: "6px 14px",
                borderRadius: "20px",
                boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
                animation: "badgePulse 3s infinite ease-in-out",
              }}
            >
              FEATURED STORY
            </span>
          </div>
          
          <div style={{ padding: "35px 32px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <div style={{ display: "flex", gap: "12px", fontSize: "12px", color: "#94a3b8", fontWeight: "700", marginBottom: "12px" }}>
              <span>📅 {featuredArticle.date}</span>
              <span>•</span>
              <span>⏱️ {featuredArticle.readTime}</span>
              <span>•</span>
              <span style={{ color: "#e52860" }}>🏷️ {featuredArticle.category}</span>
            </div>
            
            <h2 style={{ fontSize: "23px", fontWeight: "900", color: "#0f172a", lineHeight: "1.4", marginBottom: "14px" }}>
              {featuredArticle.title}
            </h2>
            
            <p style={{ fontSize: "14px", color: "#475569", lineHeight: "1.75", marginBottom: "24px" }}>
              {featuredArticle.excerpt}
            </p>
            
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
              <span style={{ fontSize: "13px", fontWeight: "800", color: "#e52860" }}>
                ✍️ {featuredArticle.author}
              </span>
              <button
                onClick={() => setSelectedArticle(featuredArticle)}
                className="glow-interactive-button"
                style={{
                  backgroundColor: "#e52860",
                  color: "#ffffff",
                  border: "none",
                  padding: "11px 24px",
                  borderRadius: "25px",
                  fontWeight: "800",
                  fontSize: "13px",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  boxShadow: "0 4px 14px rgba(229,40,96,0.35)",
                }}
              >
                <span>সম্পূর্ণ পড়ুন</span>
                <span>➔</span>
              </button>
            </div>
          </div>
        </div>
        )}

        {loading && (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <p style={{ fontSize: "14px", fontWeight: "700", color: "#64748b" }}>Loading articles from database...</p>
          </div>
        )}

        {/* Quick Beauty Highlights Carousel Banner */}
        <div
          style={{
            background: "linear-gradient(135deg, #0e1e38 0%, #1e293b 100%)",
            borderRadius: "16px",
            padding: "20px 24px",
            color: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "16px",
            marginBottom: "35px",
            boxShadow: "0 6px 20px rgba(14,30,56,0.12)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={{ fontSize: "30px", animation: "floatSoft 2s ease-in-out infinite" }}>💡</div>
            <div>
              <div style={{ fontSize: "11px", color: "#f43f5e", fontWeight: "800", letterSpacing: "1px", textTransform: "uppercase" }}>
                DAILY BEAUTY TIP
              </div>
              <div style={{ fontSize: "14px", fontWeight: "700", color: "#f8fafc" }}>
                সানস্ক্রিন শুধু রোদে নয়, ক্লাউডি দিনেও এবং ল্যাপটপ/মোবাইলের ব্লু-লাইট থেকেও ত্বককে রক্ষা করে।
              </div>
            </div>
          </div>
          <Link
            href="/shop?category=sunscreen"
            className="glow-interactive-button"
            style={{
              backgroundColor: "#e52860",
              color: "#ffffff",
              padding: "8px 18px",
              borderRadius: "20px",
              fontSize: "12px",
              fontWeight: "800",
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            সানস্ক্রিন কালেকশন →
          </Link>
        </div>

        {/* Main Grid: Articles + Sidebar Layout */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "35px" }}>
          
          {/* Left Grid Articles */}
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "22px" }}>
              <h3 style={{ fontSize: "19px", fontWeight: "900", color: "#0f172a", margin: 0, display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ width: "4px", height: "20px", backgroundColor: "#e52860", display: "inline-block", borderRadius: "2px" }} />
                সর্বশেষ প্রকাশিত আর্টিকেলসমূহ ({filtered.length})
              </h3>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "24px" }}>
              {filtered.map((art, idx) => (
                <div 
                  key={art.id}
                  className="glow-card-interactive"
                  style={{
                    backgroundColor: "#ffffff",
                    borderRadius: "16px",
                    overflow: "hidden",
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 4px 15px rgba(0,0,0,0.03)",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <div style={{ height: "180px", position: "relative", overflow: "hidden" }}>
                    <img
                      src={art.image}
                      alt={art.title}
                      style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.4s ease" }}
                      onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.08)")}
                      onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                    />
                    <span
                      style={{
                        position: "absolute",
                        top: "12px",
                        left: "12px",
                        backgroundColor: "rgba(15, 23, 42, 0.85)",
                        color: "#ffffff",
                        fontSize: "10px",
                        fontWeight: "900",
                        padding: "4px 10px",
                        borderRadius: "12px",
                        backdropFilter: "blur(4px)",
                      }}
                    >
                      {art.category}
                    </span>
                  </div>
                  
                  <div style={{ padding: "20px", display: "flex", flexDirection: "column", flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11px", fontWeight: "700", color: "#94a3b8", marginBottom: "8px" }}>
                      <span>📅 {art.date}</span>
                      <span>⏱️ {art.readTime}</span>
                    </div>
                    
                    <h4 style={{ fontSize: "15px", fontWeight: "800", color: "#0f172a", lineHeight: "1.45", marginBottom: "10px", minHeight: "44px" }}>
                      {art.title}
                    </h4>
                    
                    <p style={{ fontSize: "12.5px", color: "#64748b", lineHeight: "1.6", marginBottom: "18px", flex: 1 }}>
                      {art.excerpt}
                    </p>
                    
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "12px", borderTop: "1px solid #f1f5f9" }}>
                      <span style={{ fontSize: "11.5px", fontWeight: "700", color: "#64748b" }}>
                        ✍️ {art.author}
                      </span>
                      <button
                        onClick={() => setSelectedArticle(art)}
                        className="glow-interactive-button"
                        style={{
                          backgroundColor: "#fff0f5",
                          color: "#e52860",
                          border: "1px solid #fce7f0",
                          padding: "7px 14px",
                          borderRadius: "8px",
                          fontWeight: "800",
                          fontSize: "11.5px",
                          cursor: "pointer",
                        }}
                      >
                        পড়ুন ➔
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Sidebar */}
          <div style={{ display: "flex", flexDirection: "column", gap: "25px" }}>
            
            {/* Widget 1: Trending Posts with Interactive Hover */}
            <div style={{ backgroundColor: "#ffffff", padding: "24px", borderRadius: "16px", border: "1px solid #e2e8f0", boxShadow: "0 4px 15px rgba(0,0,0,0.03)" }}>
              <h4 style={{ fontSize: "16px", fontWeight: "900", color: "#0f172a", marginBottom: "16px", borderBottom: "2px solid #fce7f0", paddingBottom: "10px" }}>
                🔥 জনপ্রিয় ব্লগ পোস্ট
              </h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {articles.slice(0, 4).map((art, idx) => (
                  <div
                    key={art.id}
                    onClick={() => setSelectedArticle(art)}
                    style={{ display: "flex", gap: "12px", alignItems: "flex-start", cursor: "pointer", transition: "transform 0.2s" }}
                    onMouseEnter={(e) => (e.currentTarget.style.transform = "translateX(4px)")}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = "translateX(0px)")}
                  >
                    <span style={{ fontSize: "18px", fontWeight: "900", color: idx === 0 ? "#e52860" : "#cbd5e1", minWidth: "24px" }}>
                      0{idx + 1}
                    </span>
                    <div>
                      <h5 style={{ fontSize: "13px", fontWeight: "800", color: "#1e293b", lineHeight: "1.4", margin: "0 0 4px 0" }}>
                        {art.title}
                      </h5>
                      <span style={{ fontSize: "11px", color: "#e52860", fontWeight: "700" }}>{art.category}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Widget 2: Recommended Products Box */}
            <div
              className="glow-card-interactive"
              style={{
                background: "linear-gradient(135deg, #fff0f5 0%, #fff7ed 100%)",
                padding: "24px",
                borderRadius: "16px",
                border: "1.5px solid #fce7f0",
                textAlign: "center",
              }}
            >
              <span style={{ fontSize: "10.5px", fontWeight: "900", color: "#e52860", textTransform: "uppercase", letterSpacing: "1px" }}>
                RECOMMENDED COLLECTION
              </span>
              <h4 style={{ fontSize: "17px", fontWeight: "900", color: "#0f172a", marginTop: "6px" }}>
                অরিজিনাল বিউটি প্রোডাক্টস 🛍️
              </h4>
              <p style={{ fontSize: "12.5px", color: "#64748b", margin: "8px 0 18px 0", lineHeight: "1.6" }}>
                ১০০% জেনুইন ব্র্যান্ডের সিরাম, ময়েশ্চারাইজার ও মেকআপ সংগ্রহ করুন সরাসরি GlowGoodly শপ থেকে।
              </p>
              <Link
                href="/shop"
                className="glow-interactive-button"
                style={{
                  display: "block",
                  backgroundColor: "#e52860",
                  color: "#ffffff",
                  padding: "11px 20px",
                  borderRadius: "25px",
                  fontWeight: "800",
                  fontSize: "13px",
                  textDecoration: "none",
                  boxShadow: "0 4px 14px rgba(229,40,96,0.3)",
                }}
              >
                শপ ব্রাউজ করুন ➔
              </Link>
            </div>

            {/* Widget 3: Newsletter Box with Feedback */}
            <div style={{ backgroundColor: "#0f172a", padding: "24px", borderRadius: "16px", color: "#ffffff", boxShadow: "0 6px 20px rgba(15,23,42,0.15)" }}>
              <h4 style={{ fontSize: "16px", fontWeight: "900", marginBottom: "6px" }}>
                বিউটি সিক্রেটস ইমেইলে পান 📩
              </h4>
              <p style={{ fontSize: "12.5px", color: "#94a3b8", lineHeight: "1.6", marginBottom: "16px" }}>
                সাবস্ক্রাইব করে রাখুন নতুন বিউটি ট্রেন্ড, স্কিনকেয়ার হ্যাকস ও সিক্রেট ভাউচার কোড পাওয়ার জন্য।
              </p>
              
              {subscribed ? (
                <div style={{ backgroundColor: "rgba(16, 185, 129, 0.15)", border: "1px solid #10b981", borderRadius: "10px", padding: "14px", textAlign: "center", color: "#34d399", fontSize: "13px", fontWeight: "700" }}>
                  🎉 ধন্যবাদ! আপনি সফলভাবে সাবস্ক্রাইব করেছেন।
                </div>
              ) : (
                <form onSubmit={handleSubscribe}>
                  <input
                    type="email"
                    required
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="আপনার ইমেইল ঠিকানা দিন"
                    style={{ width: "100%", padding: "11px 14px", borderRadius: "8px", border: "1px solid #334155", backgroundColor: "#1e293b", color: "#ffffff", fontSize: "13px", marginBottom: "12px", outline: "none", boxSizing: "border-box" }}
                  />
                  <button
                    type="submit"
                    className="glow-interactive-button"
                    style={{ width: "100%", backgroundColor: "#e52860", color: "#ffffff", padding: "11px", borderRadius: "8px", border: "none", fontWeight: "800", fontSize: "13px", cursor: "pointer", boxShadow: "0 4px 12px rgba(229,40,96,0.35)" }}
                  >
                    সাবস্ক্রাইব করুন ✨
                  </button>
                </form>
              )}
            </div>

          </div>

        </div>

        {/* Modal / Popup for reading full article */}
        {selectedArticle && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(15, 23, 42, 0.65)",
              backdropFilter: "blur(6px)",
              zIndex: 9999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "20px",
            }}
            onClick={() => setSelectedArticle(null)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "20px",
                maxWidth: "650px",
                width: "100%",
                maxHeight: "85vh",
                overflowY: "auto",
                boxShadow: "0 20px 50px rgba(0,0,0,0.25)",
                position: "relative",
                animation: "fadeInScale 0.3s ease",
              }}
            >
              <div style={{ height: "240px", position: "relative" }}>
                <img src={selectedArticle.image} alt={selectedArticle.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                <button
                  onClick={() => setSelectedArticle(null)}
                  style={{
                    position: "absolute",
                    top: "14px",
                    right: "14px",
                    width: "34px",
                    height: "34px",
                    borderRadius: "50%",
                    backgroundColor: "rgba(0,0,0,0.6)",
                    color: "#ffffff",
                    border: "none",
                    fontSize: "16px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  ✕
                </button>
              </div>

              <div style={{ padding: "26px" }}>
                <div style={{ display: "flex", gap: "10px", fontSize: "11px", fontWeight: "700", color: "#e52860", marginBottom: "8px" }}>
                  <span>{selectedArticle.category}</span>
                  <span>•</span>
                  <span>{selectedArticle.date}</span>
                </div>
                
                <h3 style={{ fontSize: "20px", fontWeight: "900", color: "#0e1e38", lineHeight: "1.4", marginBottom: "14px" }}>
                  {selectedArticle.title}
                </h3>
                
                <p style={{ fontSize: "14px", color: "#475569", lineHeight: "1.8", marginBottom: "20px" }}>
                  {selectedArticle.content || selectedArticle.excerpt}
                </p>

                <div style={{ backgroundColor: "#fff0f5", padding: "16px", borderRadius: "12px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                  <span style={{ fontSize: "12.5px", fontWeight: "700", color: "#e52860" }}>
                    প্রয়োজনীয় অরিজিনাল প্রোডাক্ট কিনুন GlowGoodly থেকে
                  </span>
                  <Link
                    href="/shop"
                    onClick={() => setSelectedArticle(null)}
                    style={{ backgroundColor: "#e52860", color: "#ffffff", padding: "8px 16px", borderRadius: "20px", fontSize: "12px", fontWeight: "800", textDecoration: "none" }}
                  >
                    শপ ভিজিট করুন →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>

      <Footer />
      <MobileNavbar />
    </>
  );
}
