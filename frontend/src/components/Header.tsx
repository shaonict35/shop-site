"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useApp } from "../context/AppContext";
import { fetchWithCache } from "../utils/api";

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
  const { cart, wishlist, cartOpen, setCartOpen, updateCartQuantity, removeFromCart, user, logout } = useApp();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPlaceholder, setCurrentPlaceholder] = useState("");
  const [dbProducts, setDbProducts] = useState<any[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

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

  const loadHeaderMenus = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/menus?location=Header", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setDynamicHeaderMenus(data);
        }
      }
    } catch (err) {
      console.warn("Using default header menus");
    }
  };

  useEffect(() => {
    loadHeaderMenus();
    const handleSync = () => loadHeaderMenus();
    window.addEventListener("glowgoodly_data_updated", handleSync);
    return () => window.removeEventListener("glowgoodly_data_updated", handleSync);
  }, []);


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
        const res = await fetch(`http://localhost:5000/api/products?limit=200`);
        const data = await res.json();
        const q = searchQuery.toLowerCase().trim();
        const matched = (data || []).filter((p: any) =>
          p.name?.toLowerCase().includes(q) ||
          p.brand?.name?.toLowerCase().includes(q) ||
          p.category?.name?.toLowerCase().includes(q)
        ).slice(0, 8);
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
            <span>GLOWGOODLY</span>
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

              {/* 1. Makeup */}
              <div className="mobile-menu-item">
                <div className="mobile-menu-row" onClick={() => setExpandedCategory(expandedCategory === 'makeup' ? null : 'makeup')}>
                  <span>💄 Makeup</span>
                  <span>{expandedCategory === 'makeup' ? '▲' : '▼'}</span>
                </div>
                {expandedCategory === 'makeup' && (
                  <div className="mobile-sub-menu">
                    <Link href="/shop?category=makeup" onClick={() => setMobileMenuOpen(false)}>All Makeup</Link>
                    <Link href="/shop?category=makeup&sub=Face+Primer" onClick={() => setMobileMenuOpen(false)}>Face Primer</Link>
                    <Link href="/shop?category=makeup&sub=Foundation" onClick={() => setMobileMenuOpen(false)}>Foundation</Link>
                    <Link href="/shop?category=makeup&sub=Lipstick" onClick={() => setMobileMenuOpen(false)}>Lipstick</Link>
                    <Link href="/shop?category=makeup&sub=Kajal" onClick={() => setMobileMenuOpen(false)}>Kajal & Eyeliner</Link>
                    <Link href="/shop?category=makeup&sub=BB+%26+CC+Cream" onClick={() => setMobileMenuOpen(false)}>BB & CC Cream</Link>
                  </div>
                )}
              </div>

              {/* 2. Skin */}
              <div className="mobile-menu-item">
                <div className="mobile-menu-row" onClick={() => setExpandedCategory(expandedCategory === 'skin' ? null : 'skin')}>
                  <span>✨ Skin Care</span>
                  <span>{expandedCategory === 'skin' ? '▲' : '▼'}</span>
                </div>
                {expandedCategory === 'skin' && (
                  <div className="mobile-sub-menu">
                    <Link href="/shop?category=skincare" onClick={() => setMobileMenuOpen(false)}>All Skincare</Link>
                    <Link href="/shop?category=skincare&sub=Face+Wash" onClick={() => setMobileMenuOpen(false)}>Face Wash</Link>
                    <Link href="/shop?category=skincare&sub=Face+Serum" onClick={() => setMobileMenuOpen(false)}>Serums</Link>
                    <Link href="/shop?category=skincare&sub=Sunscreen" onClick={() => setMobileMenuOpen(false)}>Sunscreen</Link>
                    <Link href="/shop?category=skincare&sub=Day+Cream" onClick={() => setMobileMenuOpen(false)}>Moisturizers</Link>
                  </div>
                )}
              </div>

              {/* 3. Hair */}
              <div className="mobile-menu-item">
                <div className="mobile-menu-row" onClick={() => setExpandedCategory(expandedCategory === 'hair' ? null : 'hair')}>
                  <span>💇‍♀️ Hair Care</span>
                  <span>{expandedCategory === 'hair' ? '▲' : '▼'}</span>
                </div>
                {expandedCategory === 'hair' && (
                  <div className="mobile-sub-menu">
                    <Link href="/shop?category=haircare" onClick={() => setMobileMenuOpen(false)}>All Haircare</Link>
                    <Link href="/shop?category=haircare&sub=Shampoo" onClick={() => setMobileMenuOpen(false)}>Shampoo</Link>
                    <Link href="/shop?category=haircare&sub=Conditioner" onClick={() => setMobileMenuOpen(false)}>Conditioner</Link>
                    <Link href="/shop?category=haircare&sub=Hair+Fall" onClick={() => setMobileMenuOpen(false)}>Anti Hair Fall</Link>
                  </div>
                )}
              </div>

              {/* 4. Personal Care */}
              <Link href="/shop?category=personal-care" className="mobile-menu-row-single" onClick={() => setMobileMenuOpen(false)}>
                <span>🧼 Personal Care</span>
              </Link>

              {/* 5. Mom & Baby */}
              <Link href="/shop?category=mom-baby" className="mobile-menu-row-single" onClick={() => setMobileMenuOpen(false)}>
                <span>🍼 Mom & Baby</span>
              </Link>

              {/* 6. Fragrance */}
              <Link href="/shop?category=fragrance" className="mobile-menu-row-single" onClick={() => setMobileMenuOpen(false)}>
                <span>🌸 Fragrance</span>
              </Link>

              {/* 7. Men */}
              <Link href="/shop?category=men" className="mobile-menu-row-single" onClick={() => setMobileMenuOpen(false)}>
                <span>🧔 Men's Grooming</span>
              </Link>

              {/* 8. Combos & Offers */}
              <Link href="/shop?category=combo" className="mobile-menu-row-single" onClick={() => setMobileMenuOpen(false)}>
                <span>🎁 Combos & Offers</span>
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
                <span>GLOWGOODLY</span>
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
                      <div style={{ flex: 1 }}>
                        <h4 style={{ fontSize: "11px", fontWeight: "900", color: "#e52860", textTransform: "uppercase", letterSpacing: "1px", borderBottom: "1.5px solid #f5f5f5", paddingBottom: "6px", marginBottom: "12px" }}>
                          TOP BRANDS
                        </h4>
                        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "8px", fontSize: "12px", fontWeight: "600", color: "#4a5568" }}>
                          <li style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <Link href="/shop?brand=NICKA+K" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <img src="https://logo.clearbit.com/nicka.com" alt="NICKA K" style={{ width: "22px", height: "22px", objectFit: "contain", backgroundColor: "#ffffff", border: "1px solid #edf2f7", borderRadius: "4px", padding: "1px" }} />
                                <span>NICKA K</span>
                              </div>
                            </Link>
                          </li>
                          <li style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <Link href="/shop?brand=L'Oreal" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <img src="https://logo.clearbit.com/loreal.com" alt="L'Oreal" style={{ width: "22px", height: "22px", objectFit: "contain", backgroundColor: "#ffffff", border: "1px solid #edf2f7", borderRadius: "4px", padding: "1px" }} />
                                <span>L'Oreal</span>
                              </div>
                            </Link>
                          </li>
                          <li style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <Link href="/shop?brand=Flormar" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <img src="https://logo.clearbit.com/flormar.com" alt="Flormar" style={{ width: "22px", height: "22px", objectFit: "contain", backgroundColor: "#ffffff", border: "1px solid #edf2f7", borderRadius: "4px", padding: "1px" }} />
                                <span>Flormar</span>
                              </div>
                            </Link>
                          </li>
                          <li style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <Link href="/shop?brand=Topface" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <img src="https://logo.clearbit.com/topface.com.tr" alt="Topface" style={{ width: "22px", height: "22px", objectFit: "contain", backgroundColor: "#ffffff", border: "1px solid #edf2f7", borderRadius: "4px", padding: "1px" }} />
                                <span>Topface</span>
                              </div>
                            </Link>
                          </li>
                          <li style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <Link href="/shop?brand=The+Body+Shop" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <img src="https://logo.clearbit.com/thebodyshop.com" alt="The Body Shop" style={{ width: "22px", height: "22px", objectFit: "contain", backgroundColor: "#ffffff", border: "1px solid #edf2f7", borderRadius: "4px", padding: "1px" }} />
                                <span>The Body Shop</span>
                              </div>
                            </Link>
                          </li>
                          <li style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <Link href="/shop?brand=Revlon" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <img src="https://logo.clearbit.com/revlon.com" alt="Revlon" style={{ width: "22px", height: "22px", objectFit: "contain", backgroundColor: "#ffffff", border: "1px solid #edf2f7", borderRadius: "4px", padding: "1px" }} />
                                <span>Revlon</span>
                              </div>
                            </Link>
                          </li>
                          <li style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <Link href="/shop?brand=Dove" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <img src="https://logo.clearbit.com/dove.com" alt="Dove" style={{ width: "22px", height: "22px", objectFit: "contain", backgroundColor: "#ffffff", border: "1px solid #edf2f7", borderRadius: "4px", padding: "1px" }} />
                                <span>Dove</span>
                              </div>
                            </Link>
                          </li>
                          <li style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <Link href="/shop?brand=Swiss+Beauty" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <img src="https://logo.clearbit.com/swissbeauty.in" alt="Swiss Beauty" style={{ width: "22px", height: "22px", objectFit: "contain", backgroundColor: "#ffffff", border: "1px solid #edf2f7", borderRadius: "4px", padding: "1px" }} />
                                <span>Swiss Beauty</span>
                              </div>
                            </Link>
                          </li>
                          <li style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <Link href="/shop?brand=Pastel" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <img src="https://logo.clearbit.com/pastel.com.tr" alt="Pastel" style={{ width: "22px", height: "22px", objectFit: "contain", backgroundColor: "#ffffff", border: "1px solid #edf2f7", borderRadius: "4px", padding: "1px" }} />
                                <span>Pastel</span>
                              </div>
                            </Link>
                          </li>
                          <li style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <Link href="/shop?brand=Guerniss" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <img src="https://logo.clearbit.com/guerniss.com" alt="Guerniss" style={{ width: "22px", height: "22px", objectFit: "contain", backgroundColor: "#ffffff", border: "1px solid #edf2f7", borderRadius: "4px", padding: "1px" }} />
                                <span>Guerniss</span>
                              </div>
                            </Link>
                          </li>
                        </ul>

                        <h4 style={{ fontSize: "11px", fontWeight: "900", color: "#e52860", textTransform: "uppercase", letterSpacing: "1px", borderBottom: "1.5px solid #f5f5f5", paddingBottom: "6px", marginTop: "18px", marginBottom: "12px" }}>
                          ALL BRANDS
                        </h4>
                        <div style={{ color: "#e52860", fontWeight: "800", fontSize: "12px", marginBottom: "8px" }}>#</div>
                        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "8px", fontSize: "12px", fontWeight: "600", color: "#4a5568" }}>
                          <li style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><Link href="/shop?brand=SOME+BY+MI" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', justifyContent: 'space-between', width: '100%' }}>[SOME BY MI]</Link></li>
                          <li style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><Link href="/shop?brand=3W+Clinic" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', justifyContent: 'space-between', width: '100%' }}>3W Clinic</Link></li>
                          <li style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><Link href="/shop?brand=5LANC" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', justifyContent: 'space-between', width: '100%' }}>5LANC</Link></li>
                        </ul>
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
                        <span>#</span>
                        {"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map((letter) => (
                          <span key={letter} style={{ cursor: "pointer" }} onMouseEnter={(e) => e.currentTarget.style.color = "#e52860"} onMouseLeave={(e) => e.currentTarget.style.color = "#718096"}>
                            {letter}
                          </span>
                        ))}
                      </div>
 
                    </div>
 
                    {/* Right Column: TOP BRANDS logo grid */}
                    <div style={{ flex: "2", paddingLeft: "24px", display: "flex", flexDirection: "column", alignItems: "center" }}>
                      <h4 style={{ fontSize: "14px", fontWeight: "800", color: "#4a5568", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "25px", alignSelf: "center" }}>
                        TOP BRANDS
                      </h4>
                      <div 
                        style={{ 
                          display: "grid", 
                          gridTemplateColumns: "repeat(4, 1fr)", 
                          gap: "24px", 
                          width: "100%",
                          maxWidth: "800px"
                        }}
                      >
                        <Link href="/shop?brand=M.A.C" style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "70px", border: "1px solid #edf2f7", borderRadius: "6px", backgroundColor: "#ffffff" }}>
                          <img src="https://upload.wikimedia.org/wikipedia/commons/e/e7/M.A.C._Cosmetics_logo.svg" alt="M.A.C" style={{ maxHeight: "40px", maxWidth: "85%", objectFit: "contain" }} />
                        </Link>
                        <Link href="/shop?brand=The+Body+Shop" style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "70px", border: "1px solid #edf2f7", borderRadius: "6px", backgroundColor: "#ffffff" }}>
                          <img src="https://upload.wikimedia.org/wikipedia/commons/e/e4/The_Body_Shop_logo.svg" alt="The Body Shop" style={{ maxHeight: "45px", maxWidth: "85%", objectFit: "contain" }} />
                        </Link>
                        <Link href="/shop?brand=NYX" style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "70px", border: "1px solid #edf2f7", borderRadius: "6px", backgroundColor: "#ffffff" }}>
                          <img src="https://upload.wikimedia.org/wikipedia/commons/0/07/NYX_Professional_Makeup_logo.svg" alt="NYX" style={{ maxHeight: "42px", maxWidth: "85%", objectFit: "contain" }} />
                        </Link>
                        <Link href="/shop?brand=Wardah" style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "70px", border: "1px solid #edf2f7", borderRadius: "6px", backgroundColor: "#ffffff" }}>
                          <img src="https://logo.clearbit.com/wardahbeauty.com" alt="Wardah" style={{ maxHeight: "40px", maxWidth: "85%", objectFit: "contain" }} />
                        </Link>
                        
                        <Link href="/shop?brand=Maybelline" style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "70px", border: "1px solid #edf2f7", borderRadius: "6px", backgroundColor: "#ffffff" }}>
                          <img src="https://upload.wikimedia.org/wikipedia/commons/8/8e/Maybelline-Logo.svg" alt="Maybelline" style={{ maxHeight: "35px", maxWidth: "85%", objectFit: "contain" }} />
                        </Link>
                        <Link href="/shop?brand=Revlon" style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "70px", border: "1px solid #edf2f7", borderRadius: "6px", backgroundColor: "#ffffff" }}>
                          <img src="https://upload.wikimedia.org/wikipedia/commons/b/ba/Revlon_logo.svg" alt="Revlon" style={{ maxHeight: "40px", maxWidth: "85%", objectFit: "contain" }} />
                        </Link>
                        <Link href="/shop?brand=Wet+n+Wild" style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "70px", border: "1px solid #edf2f7", borderRadius: "6px", backgroundColor: "#ffffff" }}>
                          <img src="https://upload.wikimedia.org/wikipedia/commons/4/4b/Wet_n_Wild_logo.svg" alt="Wet n Wild" style={{ maxHeight: "42px", maxWidth: "85%", objectFit: "contain" }} />
                        </Link>
                        <Link href="/shop?brand=Flormar" style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "70px", border: "1px solid #edf2f7", borderRadius: "6px", backgroundColor: "#ffffff" }}>
                          <img src="https://logo.clearbit.com/flormar.com" alt="Flormar" style={{ maxHeight: "40px", maxWidth: "85%", objectFit: "contain" }} />
                        </Link>
 
                        <Link href="/shop?brand=Colourpop" style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "70px", border: "1px solid #edf2f7", borderRadius: "6px", backgroundColor: "#ffffff" }}>
                          <img src="https://logo.clearbit.com/colourpop.com" alt="Colourpop" style={{ maxHeight: "38px", maxWidth: "85%", objectFit: "contain" }} />
                        </Link>
                        <Link href="/shop?brand=Skin+Cafe" style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "70px", border: "1px solid #edf2f7", borderRadius: "6px", backgroundColor: "#ffffff" }}>
                          <img src="https://logo.clearbit.com/skincafebd.com" alt="Skin Cafe" style={{ maxHeight: "42px", maxWidth: "85%", objectFit: "contain" }} />
                        </Link>
                        <Link href="/shop?brand=L.A.+Girl" style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "70px", border: "1px solid #edf2f7", borderRadius: "6px", backgroundColor: "#ffffff" }}>
                          <img src="https://logo.clearbit.com/lagirlusa.com" alt="L.A. Girl" style={{ maxHeight: "36px", maxWidth: "85%", objectFit: "contain" }} />
                        </Link>
                        <Link href="/shop?brand=e.l.f." style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "70px", border: "1px solid #edf2f7", borderRadius: "6px", backgroundColor: "#ffffff" }}>
                          <img src="https://upload.wikimedia.org/wikipedia/commons/a/ab/Elf_Cosmetics_logo.svg" alt="e.l.f." style={{ maxHeight: "40px", maxWidth: "85%", objectFit: "contain" }} />
                        </Link>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            </div>

            {/* Shajgoj Desktop Search Bar - Stretches widely from Brands to Wishlist */}
            <div ref={searchRef} style={{ position: "relative", flex: "4", margin: "0 8px", minWidth: "350px", maxWidth: "950px" }}>
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
                        onClick={() => { setShowSuggestions(false); window.location.href = `/product/${p.id}`; }}
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
            <nav className="category-links-shajgoj" style={{ display: "flex", gap: "clamp(6px, 1.1vw, 18px)", alignItems: "center", justifyContent: "space-between", whiteSpace: "nowrap", flexWrap: "nowrap", width: "100%", overflowX: "auto" }}>


              {/* 1. Makeup */}
              <CategoryMenuItem 
                title="Makeup" 
                href="/shop?category=makeup" 
                columns={[
                  { title: "FACE", items: ["Face Primer", "Concealer", "Foundation", "Compact Powder", "Contour", "Loose Powder", "Blush", "BB & CC Cream", "Highlighter", "Makeup Remover"] },
                  { title: "EYES", items: ["Kajal", "Eyeliner", "Mascara", "Eye Shadow", "Eyebrow Gel", "Eye Primer", "False Eyelashes"] },
                  { title: "LIPS", items: ["Lipstick", "Liquid Lipstick", "Lip Crayon", "Lip Gloss", "Lip Liner", "Lip Plumper", "Lip Balm", "Lip Stain"] },
                  { title: "NAILS", items: ["Nail Polish", "Nail Art", "Nail Polish Sets", "Nail Care", "Nail Polish Remover"] },
                  { title: "TOOLS", items: ["Face Brush", "Blush Brush", "Brush Sets", "Eye Brush", "Eyelash Curler", "Makeup Pouch"] }
                ]} 
                arches={[
                  "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&auto=format&fit=crop&q=80",
                  "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&auto=format&fit=crop&q=80"
                ]}
              />

              {/* 2. Skin */}
              <CategoryMenuItem 
                title="Skin" 
                href="/shop?category=skincare" 
                columns={[
                  { title: "CLEANSERS", items: ["Face Wash", "Cleansing Oil", "Micellar Water", "Face Scrub", "Cleansing Balm"] },
                  { title: "MOISTURIZERS", items: ["Day Cream", "Night Cream", "Face Gel", "Body Lotion", "Body Butter"] },
                  { title: "TREATMENTS", items: ["Face Serum", "Sheet Mask", "Face Toner", "Sunscreen", "Acne Patch"] },
                  { title: "CONCERNS", items: ["Acne Treatment", "Anti Aging", "Dry Skin", "Brightening", "Pore Care"] }
                ]} 
                arches={[
                  "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=400&auto=format&fit=crop&q=80",
                  "https://images.unsplash.com/photo-1608248597279-f99d160bfbc5?w=400&auto=format&fit=crop&q=80"
                ]}
              />

              {/* 3. Hair */}
              <CategoryMenuItem 
                title="Hair" 
                href="/shop?category=haircare" 
                columns={[
                  { title: "CLEANSERS", items: ["Shampoo", "Dry Shampoo", "Clarifying Shampoo", "Co-wash"] },
                  { title: "CONDITIONERS", items: ["Conditioner", "Leave-In Conditioner", "Hair Mask", "Hair Cream"] },
                  { title: "HAIR OILS", items: ["Coconut Oil", "Argan Oil", "Castor Oil", "Onion Hair Oil", "Herbal Oil"] },
                  { title: "CONCERNS", items: ["Hair Fall", "Dandruff", "Dry & Frizzy Hair", "Damaged Hair Recovery"] }
                ]} 
                arches={[
                  "https://images.unsplash.com/photo-1562322140-8baeececf3df?w=400&auto=format&fit=crop&q=80",
                  "https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=400&auto=format&fit=crop&q=80"
                ]}
              />

              {/* 4. Personal care */}
              <CategoryMenuItem 
                title="Personal care" 
                href="/shop?category=personal-care" 
                columns={[
                  { title: "BATH & SHOWER", items: ["Body Wash", "Shower Gel", "Soap Bar", "Body Scrub", "Bath Salts"] },
                  { title: "BODY CARE", items: ["Body Lotion", "Body Cream", "Body Oil", "Foot Care", "Hand Cream"] },
                  { title: "HYGIENE", items: ["Deodorants", "Body Spray", "Oral Care", "Feminine Hygiene", "Hand Sanitizer"] }
                ]} 
                arches={[
                  "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&auto=format&fit=crop&q=80",
                  "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&auto=format&fit=crop&q=80"
                ]}
              />

              {/* 5. Mom & Baby */}
              <CategoryMenuItem 
                title="Mom & Baby" 
                href="/shop?category=mom-baby" 
                columns={[
                  { title: "BABY CARE", items: ["Baby Wash", "Baby Shampoo", "Baby Lotion", "Baby Oil", "Baby Powder"] },
                  { title: "DIAPERING", items: ["Baby Wipes", "Baby Diapers", "Nappy Cream", "Baby Detergent"] },
                  { title: "MOM CARE", items: ["Stretch Mark Cream", "Maternity Pads", "Nursing Care", "Mom Supplements"] }
                ]} 
                arches={[
                  "https://images.unsplash.com/photo-1546015720-b8b30df5aa27?w=400&auto=format&fit=crop&q=80",
                  "https://images.unsplash.com/photo-1519689680058-324335c77eba?w=400&auto=format&fit=crop&q=80"
                ]}
              />

              {/* 6. Fragrance */}
              <CategoryMenuItem 
                title="Fragrance" 
                href="/shop?category=fragrance" 
                columns={[
                  { title: "WOMEN FRAGRANCE", items: ["Eau De Parfum", "Eau De Toilette", "Body Mist", "Gift Sets"] },
                  { title: "MEN FRAGRANCE", items: ["Cologne", "Mens EDP", "Body Spray", "Aftershave"] },
                  { title: "FRAGRANCE NOTE", items: ["Floral notes", "Woody notes", "Citrus notes", "Spicy notes"] }
                ]} 
                arches={[
                  "https://images.unsplash.com/photo-1547887537-6158d64c35b3?w=400&auto=format&fit=crop&q=80",
                  "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=400&auto=format&fit=crop&q=80"
                ]}
              />

              {/* 7. Undergarments */}
              <CategoryMenuItem 
                title="Undergarments" 
                href="/shop?category=undergarments" 
                className="pill-tab pill-blue"
                columns={[
                  { title: "BRAS", items: ["T-Shirt Bra", "Sports Bra", "Lace Bra", "Strapless Bra", "Push Up Bra"] },
                  { title: "PANTIES", items: ["Cotton Panty", "Hipster", "Bikini", "Seamless Panty", "Panty Packs"] },
                  { title: "SHAPEWEAR", items: ["Tummy Shaper", "Thigh Shaper", "Body Shaper Briefs"] }
                ]} 
                arches={[
                  "https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=400&auto=format&fit=crop&q=80"
                ]}
              />

              {/* 8. Combo */}
              <CategoryMenuItem 
                title="Combo" 
                href="/shop?category=combo" 
                className="pill-tab pill-pink"
                columns={[
                  { title: "SKIN COMBOS", items: ["Acne Clearance Combo", "Brightening Kit", "Anti-Aging Regimen"] },
                  { title: "MAKEUP COMBOS", items: ["Everyday Makeup Kit", "Bridal Glow Combo", "Party Glam Kit"] },
                  { title: "HAIR COMBOS", items: ["Hair Fall Defense Trio", "Dandruff Solution Combo", "Smooth & Shine Kit"] }
                ]} 
                arches={[
                  "https://images.unsplash.com/photo-1617897903246-719242758050?w=400&auto=format&fit=crop&q=80",
                  "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&auto=format&fit=crop&q=80"
                ]}
              />

                  {/* 9. BOGO */}
                  <CategoryMenuItem 
                    title="BOGO" 
                    href="/shop?category=bogo" 
                    className="pill-tab pill-purple"
                    columns={[
                      { title: "BOGO CAMPAIGNS", items: ["Buy 1 Get 1 Free", "BOGO Makeup", "BOGO Skincare", "BOGO Haircare", "BOGO Combos"] }
                    ]} 
                    arches={[
                      "https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?w=400&auto=format&fit=crop&q=80",
                      "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=400&auto=format&fit=crop&q=80"
                    ]}
                  />

                  {/* 10. Clearance Sale */}
                  <CategoryMenuItem 
                    title="Clearance Sale" 
                    href="/shop?category=clearance-sale" 
                    className="pill-tab pill-teal"
                    columns={[
                      { title: "MAKEUP DEALS", items: ["Lipsticks under 499", "Palettes at 40% Off", "Face products deals"] },
                      { title: "SKINCORE DEALS", items: ["Serums Flat 30% Off", "Cleansers B1G1", "Sheet masks packs"] },
                      { title: "HAIRCARE DEALS", items: ["Hair Oils Flat 20% Off", "Hair Masques Deals", "Shampoo Combs Packs"] }
                    ]} 
                    arches={[
                      "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=400&auto=format&fit=crop&q=80",
                      "https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?w=400&auto=format&fit=crop&q=80"
                    ]}
                  />

                  {/* 11. Men */}
                  <CategoryMenuItem 
                    title="Men" 
                    href="/shop?category=men" 
                    className="pill-tab pill-green"
                    columns={[
                      { title: "GROOMING", items: ["Mens Face Wash", "Shaving Gel & Foam", "Beard Oil & Cream", "Aftershave Balm"] },
                      { title: "HAIRCARE", items: ["Anti Hair Fall Shampoo", "Anti Dandruff Shampoo", "Hair Styling Wax", "Hair Styling Gel"] },
                      { title: "HYGIENE", items: ["Mens Deodorants", "Mens Body Spray", "Mens Cologne", "Mens Body Wash"] }
                    ]} 
                    arches={[
                      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&auto=format&fit=crop&q=80",
                      "https://images.unsplash.com/photo-1618077360395-f3068be8e001?w=400&auto=format&fit=crop&q=80"
                    ]}
                  />
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
