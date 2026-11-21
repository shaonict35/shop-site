"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useApp } from "../context/AppContext";
import { fetchWithCache, API_BASE, getProductUrl, subscribeToDataSync } from "../utils/api";

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
      loading="lazy"
      fetchPriority="low"
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
                    loading="lazy"
                    fetchPriority="low"
                    suppressHydrationWarning
                    onError={(e) => {
                      e.currentTarget.src = "/placeholder-product.svg";
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

const DEFAULT_MOBILE_CATEGORIES = [
  {
    id: "cat-makeup",
    name: "Makeup",
    emoji: "💄",
    slug: "makeup",
    subCategories: [
      { id: "sub-mu-1", name: "Face Primer" },
      { id: "sub-mu-2", name: "Foundation" },
      { id: "sub-mu-3", name: "Concealer" },
      { id: "sub-mu-4", name: "Compact Powder" },
      { id: "sub-mu-5", name: "Loose Powder & Contour" },
      { id: "sub-mu-6", name: "Blush & Highlighter" },
      { id: "sub-mu-7", name: "Lipstick" },
      { id: "sub-mu-8", name: "Liquid Lipstick" },
      { id: "sub-mu-9", name: "Lip Balm & Gloss" },
      { id: "sub-mu-10", name: "Kajal & Eyeliner" },
      { id: "sub-mu-11", name: "Mascara" },
      { id: "sub-mu-12", name: "Eye Shadow" },
      { id: "sub-mu-13", name: "Setting Spray & Fixer" },
      { id: "sub-mu-14", name: "Nail Polish" },
      { id: "sub-mu-15", name: "Makeup Remover" }
    ]
  },
  {
    id: "cat-kbeauty",
    name: "K-Beauty (Korean Beauty)",
    emoji: "🌸",
    slug: "k-beauty",
    subCategories: [
      { id: "sub-kb-1", name: "Korean Cleansers & Foams" },
      { id: "sub-kb-2", name: "Korean Toners & Mists" },
      { id: "sub-kb-3", name: "Essence & Ampoules" },
      { id: "sub-kb-4", name: "Snail Mucin Care" },
      { id: "sub-kb-5", name: "Ginseng & Centella Care" },
      { id: "sub-kb-6", name: "Korean Sheet Masks" },
      { id: "sub-kb-7", name: "Glass Skin Serums" },
      { id: "sub-kb-8", name: "Korean Sunscreens (Sun Gel)" },
      { id: "sub-kb-9", name: "Korean Lip Tints" }
    ]
  },
  {
    id: "cat-skin",
    name: "Skin Care",
    emoji: "✨",
    slug: "skincare",
    subCategories: [
      { id: "sub-sk-1", name: "Face Wash" },
      { id: "sub-sk-2", name: "Face Serum" },
      { id: "sub-sk-3", name: "Face Toner" },
      { id: "sub-sk-4", name: "Sunscreen" },
      { id: "sub-sk-5", name: "Day Cream" },
      { id: "sub-sk-6", name: "Night Cream" },
      { id: "sub-sk-7", name: "Body Lotion" },
      { id: "sub-sk-8", name: "Sheet Mask" },
      { id: "sub-sk-9", name: "Acne Treatment" },
      { id: "sub-sk-10", name: "Eye Cream & Patches" },
      { id: "sub-sk-11", name: "Moisturizer & Gel" },
      { id: "sub-sk-12", name: "Facial Scrub & Exfoliator" },
      { id: "sub-sk-13", name: "Lip Care & Sleeping Mask" }
    ]
  },
  {
    id: "cat-hair",
    name: "Hair Care",
    emoji: "💇",
    slug: "haircare",
    subCategories: [
      { id: "sub-hr-1", name: "Shampoo" },
      { id: "sub-hr-2", name: "Conditioner" },
      { id: "sub-hr-3", name: "Hair Oil" },
      { id: "sub-hr-4", name: "Hair Serum" },
      { id: "sub-hr-5", name: "Hair Mask & Spa" },
      { id: "sub-hr-6", name: "Hair Fall Defense" },
      { id: "sub-hr-7", name: "Dandruff Solution" },
      { id: "sub-hr-8", name: "Hair Color & Dye" }
    ]
  },
  {
    id: "cat-mom-baby",
    name: "Mom & Baby",
    emoji: "👶",
    slug: "mom-baby",
    subCategories: [
      { id: "sub-mb-1", name: "Baby Lotion & Cream" },
      { id: "sub-mb-2", name: "Baby Wash & Shampoo" },
      { id: "sub-mb-3", name: "Baby Oil" },
      { id: "sub-mb-4", name: "Baby Powder" },
      { id: "sub-mb-5", name: "Diapers & Wet Wipes" },
      { id: "sub-mb-6", name: "Stretch Mark Cream" },
      { id: "sub-mb-7", name: "Baby Rash Care" }
    ]
  },
  {
    id: "cat-fragrance",
    name: "Fragrance",
    emoji: "🌺",
    slug: "fragrance",
    subCategories: [
      { id: "sub-fr-1", name: "Womens Perfume (EDP/EDT)" },
      { id: "sub-fr-2", name: "Mens Cologne" },
      { id: "sub-fr-3", name: "Body Mist & Splash" },
      { id: "sub-fr-4", name: "Attar & Oud" },
      { id: "sub-fr-5", name: "Perfume Gift Sets" },
      { id: "sub-fr-6", name: "Pocket Perfume" }
    ]
  },
  {
    id: "cat-undergarments",
    name: "Undergarments",
    emoji: "👗",
    slug: "undergarments",
    subCategories: [
      { id: "sub-ug-1", name: "Bras" },
      { id: "sub-ug-2", name: "Panties" },
      { id: "sub-ug-3", name: "Shapewear" },
      { id: "sub-ug-4", name: "Nightwear & Loungewear" },
      { id: "sub-ug-5", name: "Sports Bras" },
      { id: "sub-ug-6", name: "Lingerie Sets" }
    ]
  },
  {
    id: "cat-accessories",
    name: "Accessories & Tools",
    emoji: "🎀",
    slug: "accessories",
    subCategories: [
      { id: "sub-ac-1", name: "Makeup Brushes & Kits" },
      { id: "sub-ac-2", name: "Beauty Blenders & Sponges" },
      { id: "sub-ac-3", name: "Eyelash Curlers & Tweezers" },
      { id: "sub-ac-4", name: "Hair Styling Tools & Combs" },
      { id: "sub-ac-5", name: "Trimmers & Epilators" },
      { id: "sub-ac-6", name: "Cosmetic Bags & Organizers" },
      { id: "sub-ac-7", name: "Mirrors & Vanity Lights" }
    ]
  },
  {
    id: "cat-personal",
    name: "Personal Care",
    emoji: "🧴",
    slug: "personal-care",
    subCategories: [
      { id: "sub-pc-1", name: "Body Wash" },
      { id: "sub-pc-2", name: "Shower Gel" },
      { id: "sub-pc-3", name: "Deodorant & Roll-on" },
      { id: "sub-pc-4", name: "Body Scrub" },
      { id: "sub-pc-5", name: "Hand & Foot Cream" },
      { id: "sub-pc-6", name: "Feminine Hygiene & Pads" },
      { id: "sub-pc-7", name: "Oral Care & Toothpaste" },
      { id: "sub-pc-8", name: "Hair Removal & Razors" }
    ]
  },
  {
    id: "cat-combo",
    name: "Combo Deals",
    emoji: "📦",
    slug: "combo",
    subCategories: [
      { id: "sub-cb-1", name: "Skin Combos" },
      { id: "sub-cb-2", name: "Makeup Combos" },
      { id: "sub-cb-3", name: "Hair Combos" },
      { id: "sub-cb-4", name: "Acne Clearance Combo" },
      { id: "sub-cb-5", name: "Brightening Kit" },
      { id: "sub-cb-6", name: "Winter Care Combos" }
    ]
  },
  {
    id: "cat-bogo",
    name: "Buy 1 Get 1 (BOGO)",
    emoji: "🎁",
    slug: "bogo",
    subCategories: [
      { id: "sub-bg-1", name: "BOGO Cosmetics" },
      { id: "sub-bg-2", name: "BOGO Skincare" },
      { id: "sub-bg-3", name: "BOGO Haircare" }
    ]
  },
  {
    id: "cat-clearance",
    name: "Clearance Sale",
    emoji: "🏷️",
    slug: "clearance-sale",
    subCategories: [
      { id: "sub-cs-1", name: "Makeup Deals" },
      { id: "sub-cs-2", name: "Skincare Deals" },
      { id: "sub-cs-3", name: "Haircare Deals" },
      { id: "sub-cs-4", name: "Hot Clearance Deals" }
    ]
  },
  {
    id: "cat-men",
    name: "Men's Care",
    emoji: "🧔",
    slug: "men",
    subCategories: [
      { id: "sub-mn-1", name: "Mens Face Wash" },
      { id: "sub-mn-2", name: "Beard Oil & Shaving Cream" },
      { id: "sub-mn-3", name: "Mens Hair Care" },
      { id: "sub-mn-4", name: "Mens Deodorants & Cologne" }
    ]
  },
  {
    id: "cat-concern",
    name: "Shop By Concern",
    emoji: "🩺",
    slug: "concern",
    subCategories: [
      { id: "sub-cn-1", name: "Acne Treatment" },
      { id: "sub-cn-2", name: "Anti Aging" },
      { id: "sub-cn-3", name: "Dandruff Solution" },
      { id: "sub-cn-4", name: "Dry Skin Care" },
      { id: "sub-cn-5", name: "Hair Fall Defense" },
      { id: "sub-cn-6", name: "Oil Control" },
      { id: "sub-cn-7", name: "Pore Care" },
      { id: "sub-cn-8", name: "Spot Treatment" },
      { id: "sub-cn-9", name: "Hair Thinning" },
      { id: "sub-cn-10", name: "Sun Burn Recovery" }
    ]
  }
];

function mergeCategoriesWithMaster(dbList: any[] = []): any[] {
  const map = new Map<string, any>();
  DEFAULT_MOBILE_CATEGORIES.forEach((cat) => {
    const key = (cat.slug || cat.name).toLowerCase().trim();
    map.set(key, { ...cat });
  });
  if (Array.isArray(dbList) && dbList.length > 0) {
    dbList.forEach((dbCat: any) => {
      if (!dbCat || !dbCat.name) return;
      const key = (dbCat.slug || dbCat.name).toLowerCase().trim();
      if (map.has(key)) {
        const existing = map.get(key);
        map.set(key, {
          ...existing,
          ...dbCat,
          emoji: existing.emoji || dbCat.emoji || "🛍️",
          subCategories: (Array.isArray(dbCat.subCategories) && dbCat.subCategories.length > 0)
            ? dbCat.subCategories
            : existing.subCategories
        });
      } else {
        map.set(key, {
          ...dbCat,
          emoji: dbCat.emoji || "🛍️",
          subCategories: dbCat.subCategories || dbCat.subs || []
        });
      }
    });
  }
  return Array.from(map.values());
}

export default function Header() {
  const { cart, wishlist, cartOpen, setCartOpen, updateCartQuantity, removeFromCart, user, logout, trackingSettings } = useApp();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPlaceholder, setCurrentPlaceholder] = useState("");
  const [dbProducts, setDbProducts] = useState<any[]>([]);
  const [dbCategories, setDbCategories] = useState<any[]>(DEFAULT_MOBILE_CATEGORIES);
  const [dbBrands, setDbBrands] = useState<any[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [expandedBrands, setExpandedBrands] = useState(false);
  const [mobileCategorySearch, setMobileCategorySearch] = useState("");

  useEffect(() => {
    const handleOpenMobileCategories = () => {
      setMobileMenuOpen(true);
    };
    window.addEventListener("open_mobile_categories", handleOpenMobileCategories);
    return () => {
      window.removeEventListener("open_mobile_categories", handleOpenMobileCategories);
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    const loadData = (bypass = false) => {
      fetchWithCache(`${API_BASE}/brands`, bypass).then((res) => {
        if (!mounted) return;
        const list = Array.isArray(res)
          ? res
          : (Array.isArray(res?.data) ? res.data : (Array.isArray(res?.brands) ? res.brands : []));
        if (list && list.length > 0) {
          setDbBrands(list);
        }
      }).catch(() => {});

      fetchWithCache(`${API_BASE}/categories`, bypass).then((res) => {
        if (!mounted) return;
        const list = Array.isArray(res)
          ? res
          : (Array.isArray(res?.categories)
              ? res.categories
              : (Array.isArray(res?.data) ? res.data : null));
        setDbCategories(mergeCategoriesWithMaster(list || []));
      }).catch(() => {
        if (mounted) setDbCategories(mergeCategoriesWithMaster([]));
      });
    };

    loadData(false);
    const unsubscribe = subscribeToDataSync(() => loadData(true));

    return () => {
      mounted = false;
      unsubscribe();
    };
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
          <Link href="/" className="mobile-logo-text">
            GLOWGOODLY
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
              {/* Category Search & Counter Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                <div className="mobile-menu-section-title" style={{ margin: 0 }}>ALL CATEGORIES</div>
                <span style={{ fontSize: "11px", backgroundColor: "#fdf2f8", color: "#be185d", fontWeight: "800", padding: "2px 8px", borderRadius: "12px", border: "1px solid #fbcfe8" }}>
                  {dbCategories.length} Categories
                </span>
              </div>

              {/* Quick Category Search Filter */}
              <div style={{ marginBottom: "14px" }}>
                <input
                  type="text"
                  placeholder="🔍 Quick search categories..."
                  value={mobileCategorySearch}
                  onChange={(e) => setMobileCategorySearch(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: "8px",
                    border: "1px solid #e2e8f0",
                    fontSize: "12.5px",
                    backgroundColor: "#f8fafc",
                    outline: "none",
                    boxShadow: "inset 0 1px 2px rgba(0,0,0,0.03)"
                  }}
                />
              </div>

              {/* Dynamic Categories from Master List & Database */}
              {(() => {
                const q = mobileCategorySearch.toLowerCase().trim();
                const filtered = dbCategories.filter((cat: any) => {
                  if (!q) return true;
                  const nameMatch = (cat.name || "").toLowerCase().includes(q);
                  const subs = (Array.isArray(cat.subCategories) ? cat.subCategories : (Array.isArray(cat.subs) ? cat.subs : []));
                  const subMatch = subs.some((s: any) => (typeof s === "string" ? s : (s.name || "")).toLowerCase().includes(q));
                  return nameMatch || subMatch;
                });

                if (filtered.length === 0) {
                  return (
                    <div style={{ padding: "16px", textAlign: "center", color: "#94a3b8", fontSize: "12px" }}>
                      No categories found for "{mobileCategorySearch}"
                    </div>
                  );
                }

                return filtered.map((cat: any) => {
                  const catSlug = cat.slug || cat.name.toLowerCase().replace(/\s+/g, '-');
                  const catKey = cat.id || catSlug || cat.name;
                  const subs = (Array.isArray(cat.subCategories) && cat.subCategories.length > 0)
                    ? cat.subCategories
                    : (Array.isArray(cat.subs) ? cat.subs : []);
                  const catEmoji = cat.emoji || (
                    cat.slug?.includes("makeup") ? "💄" :
                    cat.slug?.includes("k-beauty") ? "🌸" :
                    cat.slug?.includes("skin") ? "✨" :
                    cat.slug?.includes("hair") ? "💇" :
                    cat.slug?.includes("mom") ? "👶" :
                    cat.slug?.includes("fragrance") ? "🌺" :
                    cat.slug?.includes("undergarment") ? "👗" :
                    cat.slug?.includes("access") ? "🎀" :
                    cat.slug?.includes("personal") ? "🧴" :
                    cat.slug?.includes("combo") ? "📦" :
                    cat.slug?.includes("bogo") ? "🎁" :
                    cat.slug?.includes("clearance") ? "🏷️" :
                    cat.slug?.includes("men") ? "🧔" :
                    cat.slug?.includes("concern") ? "🩺" : "🛍️"
                  );

                  if (subs.length > 0) {
                    const isExp = expandedCategory === catKey || q.length > 0;
                    return (
                      <div className="mobile-menu-item" key={catKey}>
                        <div 
                          className="mobile-menu-row" 
                          onClick={() => setExpandedCategory(isExp && !q ? null : catKey)}
                          style={{ cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px" }}
                        >
                          <span style={{ fontWeight: "700", display: "flex", alignItems: "center", gap: "8px", fontSize: "13.5px" }}>
                            <span>{catEmoji}</span>
                            <span>{cat.name}</span>
                          </span>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <span style={{ fontSize: "10px", color: "#94a3b8", fontWeight: "700", backgroundColor: "#f1f5f9", padding: "1px 6px", borderRadius: "10px" }}>
                              {subs.length}
                            </span>
                            <span style={{ fontSize: "11px", color: "#64748b" }}>{isExp ? "▲" : "▼"}</span>
                          </div>
                        </div>
                        {isExp && (
                          <div className="mobile-sub-menu" style={{ backgroundColor: "#fdf8fb", borderLeft: "3px solid #e63b7a" }}>
                            <Link 
                              href={catSlug === "combo" ? "/combos" : catSlug === "bogo" ? "/shop?deal=bogo" : `/shop?category=${encodeURIComponent(catSlug)}`} 
                              onClick={() => setMobileMenuOpen(false)}
                              style={{ fontWeight: "800", color: "#e63b7a", display: "flex", alignItems: "center", gap: "4px" }}
                            >
                              <span>All {cat.name}</span>
                              <span>➔</span>
                            </Link>
                            {subs.map((sub: any) => {
                              const subName = typeof sub === "string" ? sub : (sub.name || "");
                              const subId = typeof sub === "string" ? sub : (sub.id || sub.name);
                              const subLink = catSlug === "concern"
                                ? `/shop?category=skincare&sub=${encodeURIComponent(subName)}`
                                : `/shop?category=${encodeURIComponent(catSlug)}&sub=${encodeURIComponent(subName)}`;
                              return (
                                <Link 
                                  key={subId} 
                                  href={subLink} 
                                  onClick={() => setMobileMenuOpen(false)}
                                >
                                  {subName}
                                </Link>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  }
                  return (
                    <Link 
                      key={catKey} 
                      href={`/shop?category=${encodeURIComponent(catSlug)}`} 
                      className="mobile-menu-row-single" 
                      onClick={() => setMobileMenuOpen(false)}
                      style={{ display: "flex", alignItems: "center", gap: "8px" }}
                    >
                      <span>{catEmoji}</span>
                      <span>{cat.name}</span>
                    </Link>
                  );
                });
              })()}

              {/* Expandable Brands Section in Mobile Drawer */}
              <div className="mobile-menu-item">
                <div 
                  className="mobile-menu-row" 
                  onClick={() => setExpandedBrands(!expandedBrands)}
                  style={{ cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px" }}
                >
                  <span style={{ fontWeight: "700", display: "flex", alignItems: "center", gap: "8px", fontSize: "13.5px" }}>
                    <span>🏷️</span>
                    <span>Top Authentic Brands</span>
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ fontSize: "10px", color: "#94a3b8", fontWeight: "700", backgroundColor: "#f1f5f9", padding: "1px 6px", borderRadius: "10px" }}>
                      {dbBrands.length > 0 ? dbBrands.length : "30+"}
                    </span>
                    <span style={{ fontSize: "11px", color: "#64748b" }}>{expandedBrands ? "▲" : "▼"}</span>
                  </div>
                </div>

                {expandedBrands && (
                  <div className="mobile-sub-menu" style={{ backgroundColor: "#fdf8fb", borderLeft: "3px solid #e63b7a", padding: "10px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px", paddingBottom: "6px", borderBottom: "1px solid #fce7f3" }}>
                      <span style={{ fontSize: "11px", fontWeight: "800", color: "#9d174d", textTransform: "uppercase" }}>Featured Brands</span>
                      <Link 
                        href="/brands" 
                        onClick={() => setMobileMenuOpen(false)}
                        style={{ fontSize: "11px", fontWeight: "800", color: "#e63b7a", textDecoration: "none" }}
                      >
                        View All Brands ({dbBrands.length}) ➔
                      </Link>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
                      {dbBrands.map((b: any) => (
                        <Link
                          key={b.id || b.name}
                          href={`/shop?brand=${encodeURIComponent(b.name)}`}
                          onClick={() => setMobileMenuOpen(false)}
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: "8px 4px",
                            backgroundColor: "#ffffff",
                            border: "1px solid #f1f5f9",
                            borderRadius: "8px",
                            textDecoration: "none",
                            color: "#1e293b",
                            textAlign: "center"
                          }}
                        >
                          {b.logoUrl && (
                            <img
                              src={b.logoUrl}
                              alt={b.name}
                              style={{ width: "32px", height: "32px", objectFit: "contain", marginBottom: "4px" }}
                              onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                            />
                          )}
                          <span style={{ fontSize: "10.5px", fontWeight: "700", lineHeight: "1.2", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "100%" }}>
                            {b.name}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Beauty Magazine */}
              <Link href="/magazine" className="mobile-menu-row-single" onClick={() => setMobileMenuOpen(false)} style={{ background: "linear-gradient(135deg, #fff0f6, #fce7f3)", borderLeft: "3px solid #e63b7a", fontWeight: "800", color: "#e63b7a", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span>📖</span>
                  <span>Beauty Magazine (৫০ পাতা)</span>
                </span>
                <span style={{ fontSize: "9px", background: "#e63b7a", color: "#fff", padding: "2px 7px", borderRadius: "10px", fontWeight: "900" }}>NEW</span>
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
              }}>
                GLOWGOODLY
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
                  id="header-search-input"
                  name="search"
                  type="search"
                  aria-label="Search products"
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
                        <img src={img || "/placeholder-product.svg"} alt={p.name} style={{ width: "38px", height: "38px", objectFit: "cover", borderRadius: "6px", border: "1px solid #f1f5f9", flexShrink: 0 }} onError={(e) => { e.currentTarget.src = "/placeholder-product.svg"; }} />
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
        <div className="category-navbar-shajgoj" style={{ overflowX: "auto", overflowY: "visible" }}>
          <div className="container" style={{ display: "flex", justifyContent: "center" }}>
            <nav className="category-links-shajgoj" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", flexWrap: "nowrap", whiteSpace: "nowrap", minWidth: "max-content", padding: "2px 0" }}>
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
                arches={[]}
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
                arches={[]}
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
                arches={[]}
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
                arches={[]}
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
                arches={[]}
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
                arches={[]}
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
                arches={[]}
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
                arches={[]}
              />

              {/* 9. Jewellery */}
              <CategoryMenuItem 
                title="Jewellery" 
                href="/shop?category=jewellery" 
                className="pill-tab pill-purple"
                columns={[
                  { title: "EARRINGS", items: ["Jhumkas", "Studs", "Hoop Earrings", "Drop Earrings", "Ear Cuffs"] },
                  { title: "NECKLACES", items: ["Chokers", "Pendant Necklaces", "Pearl Necklaces", "Layered Chains"] },
                  { title: "BRACELETS", items: ["Bangles", "Charm Bracelets", "Adjustable Rings", "Finger Rings"] }
                ]} 
                arches={[]}
              />

              {/* 10. Clearance Sale */}
              <CategoryMenuItem 
                title="Clearance Sale" 
                href="/shop?category=clearance-sale" 
                className="pill-tab pill-teal"
                columns={[
                  { title: "MAKEUP DEALS", items: ["Lipsticks under 499", "Palettes at 40% Off", "Face products deals"] },
                  { title: "SKINCARE DEALS", items: ["Serums Flat 30% Off", "Cleansers B1G1", "Sheet masks packs"] },
                  { title: "HAIRCARE DEALS", items: ["Hair Oils Flat 20% Off", "Hair Masques Deals", "Shampoo Combs Packs"] }
                ]} 
                arches={[]}
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
                arches={[]}
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
