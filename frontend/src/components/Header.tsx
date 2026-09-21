"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useApp } from "../context/AppContext";
import { fetchWithCache, API_BASE, getProductUrl } from "../utils/api";

function BrandLogo({ src, alt, fallbackText }: { src: string; alt: string; fallbackText: string }) {
  const [error, setError] = useState(false);
  return error ? (
    <span style={{ fontSize: "11px", fontWeight: "800", color: "#4a5568", textTransform: "uppercase", letterSpacing: "0.2px" }}>
      {fallbackText}
    </span>
  ) : (
    <img
      src={src}
      alt={alt}
      onError={() => setError(true)}
      style={{ maxHeight: "35px", maxWidth: "90%", objectFit: "contain" }}
    />
  );
}

interface CategoryMenuProps {
  title: string;
  href: string;
  className?: string;
  columns: { title: string; items: string[] }[];
  arches: string[];
}

function CategoryMenuItem({ title, href, className, columns, arches }: CategoryMenuProps) {
  return (
    <div className="nav-item-with-menu">
      <Link href={href} className={className}>
        {title}
      </Link>
      <div className="category-megamenu-panel">
        <div className="megamenu-content-container">
          <div className="megamenu-columns-row">
            {columns.map((col, idx) => (
              <div className="megamenu-column" key={idx}>
                <span className="megamenu-column-title">{col.title}</span>
                <ul className="megamenu-column-list">
                  {col.items.map((item, i) => (
                    <li key={i}>
                      <Link 
                        href={href.includes("?") 
                          ? `${href}&sub=${encodeURIComponent(item)}` 
                          : `${href}?sub=${encodeURIComponent(item)}`
                        } 
                        style={{ color: "inherit", textDecoration: "none", display: "block", width: "100%" }}
                      >
                        {item}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          {arches.length > 0 && (
            <div className="megamenu-arches-container">
              {arches.map((img, idx) => (
                <div className="arch-card" key={idx}>
                  <img 
                    src={img} 
                    alt="Beauty Model" 
                    suppressHydrationWarning
                    onError={(e) => {
                      e.currentTarget.src = "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&auto=format&fit=crop&q=80";
                    }}
                  />
                  {idx === 0 && (
                    <div className="arch-card-overlay">
                      <span style={{ fontSize: "8px", fontWeight: "950", display: "block", marginBottom: "4px", color: "#ffffff" }}>BEAUTY SOLUTIONS</span>
                      <span style={{ fontSize: "7px", backgroundColor: "#e52860", padding: "2px 6px", borderRadius: "10px", fontWeight: "900", color: "#ffffff", display: "inline-block" }}>ONE CLICK</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Header() {
  const { cart, wishlist, cartOpen, setCartOpen, updateCartQuantity, removeFromCart, user, logout, trackingSettings } = useApp();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPlaceholder, setCurrentPlaceholder] = useState("");
  const [dbProducts, setDbProducts] = useState<any[]>([]);
  const [dbCategories, setDbCategories] = useState<any[]>([]);
  const [dbBrands, setDbBrands] = useState<any[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    fetchWithCache(`${API_BASE}/brands`).then((data) => {
      if (mounted && Array.isArray(data)) {
        setDbBrands(data);
      }
    }).catch(() => {});

    fetchWithCache(`${API_BASE}/categories`).then((data) => {
      if (mounted && Array.isArray(data)) {
        setDbCategories(data);
      }
    }).catch(() => {});

    return () => { mounted = false; };
  }, []);

  // Optimized Header: Removed heavy full product catalog fetching on header mount
  const getBrandCount = (brandName: string) => {
    return null;
  };

  useEffect(() => {
    const trendingSearches = [
      "AXIS-Y Dark Spot Correcting Glow Serum",
      "The Ordinary Niacinamide 10% + Zinc 1%",
      "CeraVe Moisturizing Cream",
      "L'Oreal Paris Color Riche Lipstick",
      "Cosrx Advanced Snail 96 Mucin Power Essence",
      "La Roche-Posay Effaclar Duo+",
      "Beauty of Joseon Relief Sun Rice + Probiotics"
    ];

    let searchIdx = 0;
    let charIdx = 0;
    let isDeleting = false;
    let timer: NodeJS.Timeout;

    const handleType = () => {
      const currentWord = trendingSearches[searchIdx];

      if (!isDeleting) {
        setCurrentPlaceholder(currentWord.substring(0, charIdx + 1));
        charIdx++;

        if (charIdx === currentWord.length) {
          isDeleting = true;
          timer = setTimeout(handleType, 2000); // Hold full word for 2 seconds
        } else {
          timer = setTimeout(handleType, 80); // Speed of typing letters (80ms)
        }
      } else {
        setCurrentPlaceholder(currentWord.substring(0, charIdx - 1));
        charIdx--;

        if (charIdx === 0) {
          isDeleting = false;
          searchIdx = (searchIdx + 1) % trendingSearches.length;
          timer = setTimeout(handleType, 500); // Pause briefly before typing the next word
        } else {
          timer = setTimeout(handleType, 40); // Speed of deleting letters (40ms)
        }
      }
    };

    handleType();

    return () => clearTimeout(timer);
  }, []);

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const cartSubtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

  const [searchSuggestions, setSearchSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = React.useRef<HTMLDivElement>(null);
  const [dynamicHeaderMenus, setDynamicHeaderMenus] = useState<any[]>([]);

  // Purely static header navigation menus



  // Close suggestions on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Debounced live search
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSearchSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const q = searchQuery.toLowerCase().trim();
        const res = await fetch(`${API_BASE}/products?search=${encodeURIComponent(q)}`);
        const data = await res.json();
        const matched = (data || []).slice(0, 8);
        setSearchSuggestions(matched);
        setShowSuggestions(matched.length > 0);
      } catch {}
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setShowSuggestions(false);
      window.location.href = `/shop?search=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  return (
    <>
      {/* Mobile Top Header Bar (< 768px) */}
      <div className="mobile-header-bar">
        {/* Left: Hamburger (opens category/menu drawer) */}
        <button
          className="mobile-hamburger-btn"
          onClick={() => setMobileMenuOpen(true)}
          aria-label="Open menu"
          style={{ flexShrink: 0 }}
        >
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Center: Brand Logo (flex-1 trick to center) */}
        <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
          <Link href="/" className="mobile-logo-text" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            {trackingSettings?.SITE_LOGO ? (
              <img src={trackingSettings.SITE_LOGO} alt="Brand Logo" style={{ maxHeight: "28px", objectFit: "contain" }} />
            ) : (
              <span>GLOWGOODLY</span>
            )}
          </Link>
        </div>

        {/* Right placeholder to keep header logo perfectly centered */}
        <div style={{ width: "24px", flexShrink: 0 }} />
      </div>

      {/* Mobile Sliding Hamburger Menu Drawer */}
      {mobileMenuOpen && (
        <div className="mobile-drawer-overlay" onClick={() => setMobileMenuOpen(false)}>
          <div className="mobile-drawer-content" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-drawer-header">
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ backgroundColor: "#e52860", color: "#fff", width: "40px", height: "40px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "900", fontSize: "16px" }}>
                  {user ? user.name.charAt(0).toUpperCase() : "G"}
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: "14px", fontWeight: "800", color: "#1a202c" }}>
                    {user ? `Hello, ${user.name}` : "Welcome to GlowGoodly"}
                  </h4>
                  <span style={{ fontSize: "11px", color: "#718096", fontWeight: "600" }}>
                    {user ? user.phone || user.email : "Authentic Cosmetics BD"}
                  </span>
                </div>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} style={{ background: "none", border: "none", fontSize: "24px", color: "#a0aec0", cursor: "pointer" }}>×</button>
            </div>

            <div className="mobile-drawer-body">
              <div className="mobile-menu-section-title">ALL CATEGORIES</div>

              {/* Dynamic Categories from Database */}
              {dbCategories.map((cat: any) => {
                const catSlug = cat.slug || cat.name.toLowerCase().replace(/\s+/g, '-');
                const subs = cat.subCategories || [];
                if (subs.length > 0) {
                  const isExp = expandedCategory === cat.id;
                  return (
                    <div className="mobile-menu-item" key={cat.id}>
                      <div className="mobile-menu-row" onClick={() => setExpandedCategory(isExp ? null : cat.id)}>
                        <span>{cat.name}</span>
                        <span>{isExp ? '▲' : '▼'}</span>
                      </div>
                      {isExp && (
                        <div className="mobile-sub-menu">
                          <Link href={`/shop?category=${encodeURIComponent(catSlug)}`} onClick={() => setMobileMenuOpen(false)}>All {cat.name}</Link>
                          {subs.map((sub: any) => (
                            <Link key={sub.id || sub.name} href={`/shop?category=${encodeURIComponent(catSlug)}&sub=${encodeURIComponent(sub.name)}`} onClick={() => setMobileMenuOpen(false)}>
                              {sub.name}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                }
                return (
                  <Link key={cat.id} href={`/shop?category=${encodeURIComponent(catSlug)}`} className="mobile-menu-row-single" onClick={() => setMobileMenuOpen(false)}>
                    <span>{cat.name}</span>
                  </Link>
                );
              })}

              {/* 9. Brands */}
              <Link href="/brands" className="mobile-menu-row-single" onClick={() => setMobileMenuOpen(false)}>
                <span>🏷️ Authentic Brands ({dbBrands.length})</span>
              </Link>

              <div className="mobile-menu-section-title" style={{ marginTop: "20px" }}>ACCOUNT & HELP</div>
              <Link href={user ? "/account" : "/login"} className="mobile-menu-row-single" onClick={() => setMobileMenuOpen(false)}>
                <span>👤 {user ? "My Account & Orders" : "Login / Signup"}</span>
              </Link>
              <Link href="/contact" className="mobile-menu-row-single" onClick={() => setMobileMenuOpen(false)}>
                <span>📞 Contact & Support</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      <header
        style={{
          background: "#ffffff",
          borderBottom: "1px solid #e9ecef",
          position: "sticky",
          top: 0,
          zIndex: 1000,
          boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
        }}
      >


        <div className="container">
          <div className="header-main-shajgoj">
            {/* Logo Section */}
            <div className="logo-section">
              <Link href="/" className="logo-text" onClick={(e) => {
                if (window.location.pathname === "/") {
                  e.preventDefault();
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }
              }} style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                {trackingSettings?.SITE_LOGO ? (
                  <img src={trackingSettings.SITE_LOGO} alt="Brand Logo" style={{ maxHeight: "36px", objectFit: "contain" }} />
                ) : (
                  <span>GLOWGOODLY</span>
                )}
              </Link>
              <div className="nav-item-with-menu" style={{ position: "relative", paddingBottom: "25px", marginBottom: "-25px" }}>
                <Link href="/brands" className="brands-link">
                  BRANDS
                </Link>

                {/* Mega Menu Dropdown */}
                <div className="category-megamenu-panel" style={{ backgroundColor: "#ffffff", color: "#000000", width: "1000px", left: "-250px", marginTop: "2px", top: "100%" }}>
                  <div className="megamenu-content-container" style={{ alignItems: "stretch", padding: "0 20px", paddingTop: "15px" }}>
                    
                    {/* Left Column: Top Brands List & Alphabet Index */}
                    <div 
                      style={{ 
                        flex: "0.8", 
                        borderRight: "1px solid #edf2f7", 
                        paddingRight: "24px", 
                        display: "flex", 
                        gap: "20px" 
                      }}
                    >
                      {/* Sub-column 1: TOP BRANDS list */}
                      <div style={{ flex: 1, maxHeight: "420px", overflowY: "auto", paddingRight: "8px" }}>
                        <h4 style={{ fontSize: "11px", fontWeight: "900", color: "#e52860", textTransform: "uppercase", letterSpacing: "1px", borderBottom: "1.5px solid #f5f5f5", paddingBottom: "6px", marginBottom: "12px" }}>
                          AUTHENTIC BRANDS
                        </h4>
                        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "8px", fontSize: "12px", fontWeight: "600", color: "#4a5568" }}>
                          {dbBrands.map((b) => (
                            <li key={b.id || b.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <Link href={`/shop?brand=${encodeURIComponent(b.name)}`} style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '2px 0' }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                  {b.logoUrl && (
                                    <img src={b.logoUrl} alt={b.name} style={{ width: "22px", height: "22px", objectFit: "contain", backgroundColor: "#ffffff", border: "1px solid #edf2f7", borderRadius: "4px", padding: "1px" }} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                                  )}
                                  <span>{b.name}</span>
                                </div>
                              </Link>
                            </li>
                          ))}
                        </ul>

                        <div style={{ marginTop: "16px", paddingTop: "10px", borderTop: "1.5px solid #edf2f7" }}>
                          <Link href="/brands" style={{ fontSize: "11px", fontWeight: "800", color: "#e52860", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                            ALL BRANDS DIRECTORY →
                          </Link>
                        </div>
                      </div>
 
                      {/* Sub-column 2: Alphabetical Index */}
                      <div 
                        style={{ 
                          display: "flex", 
                          flexDirection: "column", 
                          alignItems: "center", 
                          justifyContent: "flex-start", 
                          gap: "3px", 
                          fontSize: "10px", 
                          fontWeight: "800", 
                          color: "#718096",
                          borderLeft: "1px solid #edf2f7",
                          paddingLeft: "15px",
                          lineHeight: "1.1"
                        }}
                      >
                        <Link href="/brands" style={{ textDecoration: 'none', color: 'inherit' }}>
                          <span>#</span>
                        </Link>
                        {"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map((letter) => (
                          <Link key={letter} href={`/brands#brand-group-${letter}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                            <span style={{ cursor: "pointer" }} onMouseEnter={(e) => e.currentTarget.style.color = "#e52860"} onMouseLeave={(e) => e.currentTarget.style.color = "#718096"}>
                              {letter}
                            </span>
                          </Link>
                        ))}
                      </div>
 
                    </div>
 
                    {/* Right Column: TOP BRANDS logo grid */}
                    <div style={{ flex: "2", paddingLeft: "24px", display: "flex", flexDirection: "column", alignItems: "center" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", maxWidth: "800px", marginBottom: "20px" }}>
                        <h4 style={{ fontSize: "14px", fontWeight: "800", color: "#4a5568", textTransform: "uppercase", letterSpacing: "1px", margin: 0 }}>
                          TOP BRANDS
                        </h4>
                        <Link href="/brands" style={{ fontSize: "12px", fontWeight: "700", color: "#e52860", textDecoration: "none" }}>
                          View All ({dbBrands.length}) →
                        </Link>
                      </div>
                      <div 
                        style={{ 
                          display: "grid", 
                          gridTemplateColumns: "repeat(4, 1fr)", 
                          gap: "20px", 
                          width: "100%",
                          maxWidth: "800px"
                        }}
                      >
                        {dbBrands.slice(0, 12).map((b) => (
                          <Link 
                            key={b.id || b.name}
                            href={`/shop?brand=${encodeURIComponent(b.name)}`} 
                            style={{ 
                              display: "flex", 
                              flexDirection: "column",
                              alignItems: "center", 
                              justifyContent: "center", 
                              height: "76px", 
                              border: "1px solid #edf2f7", 
                              borderRadius: "8px", 
                              backgroundColor: "#ffffff",
                              padding: "8px 12px",
                              textDecoration: "none",
                              transition: "all 0.2s ease"
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.borderColor = "#e52860";
                              e.currentTarget.style.boxShadow = "0 4px 12px rgba(229,40,96,0.08)";
                              e.currentTarget.style.transform = "translateY(-2px)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.borderColor = "#edf2f7";
                              e.currentTarget.style.boxShadow = "none";
                              e.currentTarget.style.transform = "translateY(0)";
                            }}
                          >
                            {b.logoUrl ? (
                              <img 
                                src={b.logoUrl} 
                                alt={b.name} 
                                style={{ maxHeight: "38px", maxWidth: "88%", objectFit: "contain" }} 
                                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                              />
                            ) : null}
                            <span style={{ fontSize: "11px", fontWeight: "700", color: "#4a5568", textAlign: "center", marginTop: "4px" }}>
                              {b.name}
                            </span>
                          </Link>
                        ))}
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            </div>

            {/* Shajgoj Desktop Search Bar - Stretches widely from Brands to Wishlist */}
            <div ref={searchRef} className="search-container-wrapper" style={{ position: "relative", flex: "1 1 auto", margin: "0 8px", minWidth: "0", maxWidth: "950px" }}>
              <form onSubmit={handleSearch} className="search-bar-shajgoj" style={{ height: "38px", width: "100%", display: "flex", alignItems: "center" }}>
                <button type="submit">
                  <svg
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    viewBox="0 0 24 24"
                    width="16"
                    height="16"
                    style={{ marginRight: "6px" }}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    ></path>
                  </svg>
                </button>
                <input
                  type="text"
                  placeholder={currentPlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => { if (searchSuggestions.length > 0) setShowSuggestions(true); }}
                  autoComplete="off"
                  style={{ height: "38px" }}
                />
              </form>

              {/* Live Search Suggestions Dropdown */}
              {showSuggestions && searchSuggestions.length > 0 && (
                <div style={{
                  position: "absolute",
                  top: "calc(100% + 4px)",
                  left: 0,
                  right: 0,
                  backgroundColor: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "10px",
                  boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
                  zIndex: 9999,
                  overflow: "hidden",
                  maxHeight: "360px",
                  overflowY: "auto"
                }}>
                  <div style={{ padding: "8px 12px", backgroundColor: "#fdf2f6", borderBottom: "1px solid #fce4ef", fontSize: "10px", fontWeight: "800", color: "#e52860", letterSpacing: "0.5px" }}>
                    SEARCH RESULTS FOR "{searchQuery}"
                  </div>
                  {searchSuggestions.map((p: any) => {
                    const price = p.variants?.[0]?.discountPrice || p.variants?.[0]?.price;
                    const img = p.images?.[0]?.url;
                    return (
                      <div
                        key={p.id}
                        onClick={() => { setShowSuggestions(false); window.location.href = getProductUrl(p); }}
                        style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px", cursor: "pointer", borderBottom: "1px solid #f8fafc", transition: "background 0.15s" }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#fdf2f6")}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                      >
                        <img src={img || "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=80&q=80"} alt={p.name} style={{ width: "38px", height: "38px", objectFit: "cover", borderRadius: "6px", border: "1px solid #f1f5f9", flexShrink: 0 }} onError={(e) => { e.currentTarget.src = "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=80&q=80"; }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: "12.5px", fontWeight: "700", color: "#1e293b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</div>
                          <div style={{ fontSize: "11px", color: "#64748b", fontWeight: "600" }}>{p.brand?.name} · {p.category?.name}</div>
                        </div>
                        {price && <div style={{ fontSize: "13px", fontWeight: "800", color: "#e52860", flexShrink: 0 }}>৳{price}</div>}
                      </div>
                    );
                  })}
                  <div
                    onClick={() => { setShowSuggestions(false); window.location.href = `/shop?search=${encodeURIComponent(searchQuery)}`; }}
                    style={{ padding: "10px 14px", textAlign: "center", fontSize: "12px", fontWeight: "800", color: "#e52860", cursor: "pointer", backgroundColor: "#fff8fb" }}
                  >
                    View all results for "{searchQuery}" →
                  </div>
                </div>
              )}
            </div>

            {/* Actions Section */}
            <div className="header-actions-shajgoj">
              <Link href="/wishlist">
                <button className="btn-wishlist">
                  WISHLIST {wishlist.length > 0 && `(${wishlist.length})`}
                </button>
              </Link>

              <Link href={user ? "/account" : "/login"}>
                <button className="btn-login">
                  {user ? "MY ACCOUNT" : "LOGIN"}
                </button>
              </Link>

              <button className="btn-bag" onClick={() => setCartOpen(true)}>
                <span>BAG</span>
                <span className="bag-count">{cartCount}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Shajgoj Sub-header Navigation (Category navbar row) */}
        <div className="category-navbar-shajgoj">
          <div className="container">
            <nav className="category-links-shajgoj" style={{ display: "flex", gap: "4px", alignItems: "center", justifyContent: "space-between", whiteSpace: "nowrap", flexWrap: "wrap", width: "100%", overflowX: "visible" }}>
              {/* Dynamic Megamenu Categories from Database */}
              {dbCategories.map((cat: any, idx: number) => {
                const catSlug = cat.slug || cat.name.toLowerCase().replace(/\s+/g, '-');
                const subs = cat.subCategories || [];
                
                const columns: { title: string; items: string[] }[] = [];
                if (subs.length > 0) {
                  const chunkSize = 6;
                  for (let i = 0; i < subs.length; i += chunkSize) {
                    const chunk = subs.slice(i, i + chunkSize);
                    columns.push({
                      title: i === 0 ? "POPULAR" : `MORE ${cat.name.toUpperCase()}`,
                      items: chunk.map((s: any) => s.name)
                    });
                  }
                } else {
                  columns.push({
                    title: cat.name.toUpperCase(),
                    items: [cat.name]
                  });
                }

                const arches = [cat.popupImage1, cat.popupImage2].filter(Boolean);
                
                let pillClass = "";
                const lower = cat.name.toLowerCase();
                if (lower.includes("combo")) pillClass = "pill-tab pill-pink";
                else if (lower.includes("bogo")) pillClass = "pill-tab pill-purple";
                else if (lower.includes("clearance")) pillClass = "pill-tab pill-teal";
                else if (lower.includes("men")) pillClass = "pill-tab pill-green";
                else if (lower.includes("undergarment")) pillClass = "pill-tab pill-blue";

                return (
                  <CategoryMenuItem
                    key={cat.id || idx}
                    title={cat.name}
                    href={`/shop?category=${encodeURIComponent(catSlug)}`}
                    className={pillClass}
                    columns={columns}
                    arches={arches}
                  />
                );
              })}
            </nav>



          </div>
        </div>
      </header>

      {/* Side Cart Drawer */}
      {cartOpen && <div className="drawer-backdrop" onClick={() => setCartOpen(false)} />}
      <div className={`drawer ${cartOpen ? "open" : ""}`}>
        <div className="drawer-header">
          <div className="drawer-title">
            <svg
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
              width="24"
              height="24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
              ></path>
            </svg>
            My Shopping Bag ({cartCount})
          </div>
          <div className="close-btn" onClick={() => setCartOpen(false)}>
            ✕
          </div>
        </div>

        <div className="drawer-content">
          {cart.length === 0 ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                color: "var(--gray-500)",
                gap: "10px",
              }}
            >
              <svg
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                viewBox="0 0 24 24"
                width="64"
                height="64"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"
                ></path>
              </svg>
              <p style={{ fontWeight: "600" }}>Your shopping bag is empty.</p>
              <button
                onClick={() => setCartOpen(false)}
                style={{
                  color: "var(--primary)",
                  fontWeight: "700",
                  textDecoration: "underline",
                  cursor: "pointer",
                }}
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            cart.map((item) => (
              <div className="cart-item" key={item.id}>
                <div className="cart-item-image">
                  <img src={item.image} alt={item.name} />
                </div>
                <div className="cart-item-details">
                  <div className="cart-item-title">{item.name}</div>
                  <div className="cart-item-variant">{item.variantName}</div>
                  <div className="cart-item-price">BDT {item.price}</div>
                  <div className="cart-item-actions">
                    <div className="quantity-controller">
                      <div
                        className="quantity-btn"
                        onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                      >
                        -
                      </div>
                      <div className="quantity-value">{item.quantity}</div>
                      <div
                        className="quantity-btn"
                        onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                      >
                        +
                      </div>
                    </div>
                    <div className="delete-cart-item" onClick={() => removeFromCart(item.id)}>
                      <svg
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                        width="18"
                        height="18"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        ></path>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {cart.length > 0 && (
          <div className="drawer-footer">
            <div className="drawer-subtotal">
              <span>Subtotal:</span>
              <span className="total-price">BDT {cartSubtotal}</span>
            </div>
            <button
              onClick={() => {
                setCartOpen(false);
                window.location.href = "/checkout";
              }}
              className="checkout-btn"
              style={{ width: "100%", border: "none", cursor: "pointer" }}
            >
              PROCEED TO CHECKOUT ➔
            </button>
          </div>
        )}
      </div>

      {/* Floating Side Cart Tab Popup (Shajgoj Style - Compact & Desktop Only) */}
      <div
        onClick={() => setCartOpen(true)}
        style={{
          position: "fixed",
          right: "0",
          top: "60%",
          transform: "translateY(-50%)",
          width: "52px",
          backgroundColor: "#111827",
          color: "#ffffff",
          borderRadius: "8px 0 0 8px",
          boxShadow: "0 4px 15px rgba(0,0,0,0.25)",
          cursor: "pointer",
          zIndex: 99,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          overflow: "hidden",
          border: "1.5px solid #1f2937",
          borderRight: "none",
        }}
        className="promo-card-hover desktop-only-floating-cart"
      >
        <div style={{ padding: "6px 2px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
          <svg fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" width="15" height="15" style={{ color: "#ffffff" }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path>
          </svg>
          <span style={{ fontSize: "8px", fontWeight: "900", letterSpacing: "0.1px" }}>{cartCount} ITEMS</span>
        </div>
        <div style={{ backgroundColor: "#e52860", width: "100%", padding: "4px 2px", textAlign: "center", fontSize: "10.5px", fontWeight: "800", color: "#ffffff" }}>
          ৳{cartSubtotal}
        </div>
      </div>
    </>
  );
}
