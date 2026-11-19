"use client";

import React, { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Header from "../../../components/Header";
import PromoBanner from "../../../components/PromoBanner";
import Footer from "../../../components/Footer";
import MobileNavbar from "../../../components/MobileNavbar";
import { useApp } from "../../../context/AppContext";
import { API_BASE, getProductUrl } from "../../../utils/api";
import GlowLoader from "../../../components/GlowLoader";

interface Variant {
  id: string;
  name: string;
  price: number;
  discountPrice: number | null;
  stock: number;
}

interface Product {
  id: string;
  name: string;
  slug?: string;
  description: string;
  brand: { id: string; name: string };
  category: { id: string; name: string; parent?: { name: string } };
  images: { id: string; url: string; isPrimary: boolean }[];
  variants: Variant[];
}

const ALL_CATEGORIES = [
  {
    name: "Makeup",
    slug: "makeup",
    subs: [
      "Face Primer", "Concealer", "Foundation", "Compact Powder", "Contour", "Loose Powder", "Blush", "BB & CC Cream", "Highlighter", "Makeup Remover",
      "Kajal", "Eyeliner", "Mascara", "Eye Shadow", "Eyebrow Gel", "Eye Primer", "False Eyelashes",
      "Lipstick", "Liquid Lipstick", "Lip Crayon", "Lip Gloss", "Lip Liner", "Lip Plumper", "Lip Balm", "Lip Stain",
      "Nail Polish", "Nail Art", "Nail Polish Sets", "Nail Care", "Nail Polish Remover",
      "Face Brush", "Blush Brush", "Brush Sets", "Eye Brush", "Eyelash Curler", "Makeup Pouch"
    ]
  },
  {
    name: "Skin",
    slug: "skincare",
    subs: [
      "Face Wash", "Cleansing Oil", "Micellar Water", "Face Scrub", "Cleansing Balm",
      "Day Cream", "Night Cream", "Face Gel", "Body Lotion", "Body Butter",
      "Face Serum", "Sheet Mask", "Face Toner", "Sunscreen", "Acne Patch",
      "Acne Treatment", "Anti Aging", "Dry Skin", "Brightening", "Pore Care"
    ]
  },
  {
    name: "Hair",
    slug: "haircare",
    subs: [
      "Shampoo", "Dry Shampoo", "Clarifying Shampoo", "Co-wash",
      "Conditioner", "Leave-In Conditioner", "Hair Mask", "Hair Cream",
      "Coconut Oil", "Argan Oil", "Castor Oil", "Onion Hair Oil", "Herbal Oil",
      "Hair Fall", "Dandruff", "Dry & Frizzy Hair", "Damaged Hair Recovery"
    ]
  },
  {
    name: "Personal Care",
    slug: "personal-care",
    subs: [
      "Body Wash", "Shower Gel", "Soap Bar", "Body Scrub", "Bath Salts",
      "Body Lotion", "Body Cream", "Body Oil", "Foot Care", "Hand Cream",
      "Deodorants", "Body Spray", "Oral Care", "Feminine Hygiene", "Hand Sanitizer"
    ]
  },
  {
    name: "Mom & Baby",
    slug: "mom-baby",
    subs: [
      "Baby Skin", "Baby Hair", "Baby Bath", "Mom Care",
      "Baby Wash", "Baby Shampoo", "Baby Lotion", "Baby Oil", "Baby Powder",
      "Baby Wipes", "Baby Diapers", "Nappy Cream", "Baby Detergent",
      "Stretch Mark Cream", "Maternity Pads", "Nursing Care", "Mom Supplements"
    ]
  },
  {
    name: "Fragrance",
    slug: "fragrance",
    subs: [
      "Women Fragrance", "Men Fragrance", "Unisex", "Body Mist",
      "Eau De Parfum", "Eau De Toilette", "Gift Sets",
      "Cologne", "Mens EDP", "Body Spray", "Aftershave",
      "Floral notes", "Woody notes", "Citrus notes", "Spicy notes"
    ]
  },
  {
    name: "Undergarments",
    slug: "undergarments",
    subs: [
      "Bra", "Panty", "Shapewear",
      "T-Shirt Bra", "Sports Bra", "Lace Bra", "Strapless Bra", "Push Up Bra",
      "Cotton Panty", "Hipster", "Bikini", "Seamless Panty", "Panty Packs",
      "Tummy Shaper", "Thigh Shaper", "Body Shaper Briefs"
    ]
  },
  {
    name: "Combo",
    slug: "combo",
    subs: [
      "Skin Combos", "Makeup Combos", "Hair Combos",
      "Acne Clearance Combo", "Brightening Kit", "Anti-Aging Regimen",
      "Everyday Makeup Kit", "Bridal Glow Combo", "Party Glam Kit",
      "Hair Fall Defense Trio", "Dandruff Solution Combo", "Smooth & Shine Kit"
    ]
  },
  {
    name: "Jewellery",
    slug: "jewellery",
    subs: [
      "Earrings", "Necklace", "Bracelet", "Ring",
      "Jhumkas", "Studs", "Hoop Earrings", "Drop Earrings", "Ear Cuffs",
      "Chokers", "Pendant Necklaces", "Pearl Necklaces", "Layered Chains",
      "Bangles", "Charm Bracelets", "Adjustable Rings", "Finger Rings"
    ]
  },
  {
    name: "Clearance Sale",
    slug: "clearance-sale",
    subs: [
      "Makeup Deals", "Skincare Deals", "Haircare Deals",
      "Lipsticks under 499", "Palettes at 40% Off", "Face products deals",
      "Serums Flat 30% Off", "Cleansers B1G1", "Sheet masks packs",
      "Hair Oils Flat 20% Off", "Hair Masques Deals", "Shampoo Combs Packs"
    ]
  },
  {
    name: "Men",
    slug: "men",
    subs: [
      "Grooming", "Hygiene", "Skincare",
      "Mens Face Wash", "Shaving Gel & Foam", "Beard Oil & Cream", "Aftershave Balm",
      "Anti Hair Fall Shampoo", "Anti Dandruff Shampoo", "Hair Styling Wax", "Hair Styling Gel",
      "Mens Deodorants", "Mens Body Spray", "Mens Cologne", "Mens Body Wash"
    ]
  }
];

const productMatchesSubcategory = (p: Product, subName: string) => {
  if (!p) return false;
  const target = (subName || "").toLowerCase().trim();
  const cName = p.category?.name?.toLowerCase() || "";
  const pName = (p.category as any)?.parent?.name?.toLowerCase() || "";

  // 1. Exact or partial match in DB category name
  if (cName === target || (target && cName.includes(target)) || (target && pName.includes(target))) {
    return true;
  }

  // 2. Fallback: match by product name or description
  const prodName = (p.name || "").toLowerCase();
  
  if (target === "face wash") return prodName.includes("face wash") || prodName.includes("facewash") || prodName.includes("cleanser") || prodName.includes("cleansing");
  if (target === "body wash") return prodName.includes("body wash") || prodName.includes("shower gel") || prodName.includes("soap");
  if (target === "shampoo") return prodName.includes("shampoo");
  if (target === "conditioner") return prodName.includes("conditioner");
  if (target === "lipstick") return prodName.includes("lipstick");
  if (target === "foundation") return prodName.includes("foundation");
  if (target === "primer" || target === "face primer") return prodName.includes("primer");
  if (target === "concealer") return prodName.includes("concealer");
  if (target === "lip balm") return prodName.includes("lip balm") || prodName.includes("lipbalm");
  if (target === "sunscreen") return prodName.includes("sunscreen") || prodName.includes("sun block") || prodName.includes("sunblock");
  if (target === "sheet mask") return prodName.includes("sheet mask");
  if (target === "kajal") return prodName.includes("kajal");
  if (target === "eyeliner") return prodName.includes("eyeliner");
  if (target === "mascara") return prodName.includes("mascara");
  if (target === "hair fall") return prodName.includes("fall") || prodName.includes("loss");
  if (target === "dandruff") return prodName.includes("dandruff");
  if (target === "serum" || target === "face serum") return prodName.includes("serum");
  if (target === "moisturizer" || target === "day cream" || target === "night cream") return prodName.includes("cream") || prodName.includes("moistur");
  if (target === "body lotion") return prodName.includes("lotion");
  if (target === "toner" || target === "face toner") return prodName.includes("toner");

  return false;
};

function CategoryPageContent() {
  const router = useRouter();
  const params = useParams();
  const rawSlug = (params?.slug as string) || "";
  const [clientSlug, setClientSlug] = useState<string>("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const match = window.location.pathname.match(/\/category\/([^\/?#]+)/);
      if (match && match[1]) {
        setClientSlug(match[1]);
        return;
      }
    }
    if (rawSlug) setClientSlug(rawSlug);
  }, [rawSlug]);

  const slug = clientSlug || rawSlug || "skincare";
  const { addToCart, wishlist, toggleWishlist } = useApp();

  const [products, setProducts] = useState<Product[]>([]);
  const [visibleProducts, setVisibleProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [brands, setBrands] = useState<any[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [brandSearchQuery, setBrandSearchQuery] = useState("");

  const [priceRange, setPriceRange] = useState(19500);
  const [searchVal, setSearchVal] = useState("");
  const [sortVal, setSortVal] = useState("");
  const [activeCatName, setActiveCatName] = useState("");
  const [activeSubcategory, setActiveSubcategory] = useState<string | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const getCategoryCount = (catName: string) => {
    const target = catName.toLowerCase();
    let matchNames = [target];
    if (target === "skin" || target === "skincare") {
      matchNames = ["skin", "skincare"];
    }
    if (target === "hair" || target === "haircare") {
      matchNames = ["hair", "haircare"];
    }
    return products.filter((p) => {
      const cName = p.category?.name?.toLowerCase() || "";
      const pName = (p.category as any)?.parent?.name?.toLowerCase() || "";
      return matchNames.some((name) => cName.includes(name) || pName.includes(name));
    }).length;
  };

  const getSubcategoryCount = (subName: string) => {
    return products.filter((p) => productMatchesSubcategory(p, subName)).length;
  };

  const searchParams = useSearchParams();
  const subQuery = searchParams ? searchParams.get("sub") : null;

  useEffect(() => {
    if (subQuery) setActiveSubcategory(subQuery);
    else setActiveSubcategory(null);
  }, [subQuery]);

  useEffect(() => {
    if (slug) {
      const formatted = slug.charAt(0).toUpperCase() + slug.slice(1);
      const displayName = formatted === "Skincare" ? "Skin" : formatted === "Haircare" ? "Hair" : formatted;
      setActiveCatName(displayName);
      setExpandedCategory(displayName);
    }
  }, [slug]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        let url = `${API_BASE}/products?`;
        if (slug) {
          let catQuery = slug;
          if (slug.toLowerCase() === "skin") catQuery = "Skincare";
          else if (slug.toLowerCase() === "hair") catQuery = "Haircare";
          url += `categoryName=${encodeURIComponent(catQuery)}&`;
        }
        const [res, brandRes] = await Promise.all([fetch(url), fetch(`${API_BASE}/brands`)]);
        if (res.ok) { const data = await res.json(); setProducts(data); setVisibleProducts(data); }
        if (brandRes.ok) setBrands(await brandRes.json());
      } catch (e) {
        console.error("Error fetching category products", e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [slug]);

  useEffect(() => {
    let filtered = [...products];
    if (activeSubcategory) {
      filtered = filtered.filter((p) => productMatchesSubcategory(p, activeSubcategory));
    }
    if (selectedBrands.length > 0) filtered = filtered.filter((p) => selectedBrands.includes(p.brand.name));
    if (searchVal.trim()) filtered = filtered.filter((p) => p.name.toLowerCase().includes(searchVal.toLowerCase()) || p.brand.name.toLowerCase().includes(searchVal.toLowerCase()));
    filtered = filtered.filter((p) => { const v = p.variants[0]; if (!v) return false; return (v.discountPrice || v.price) <= priceRange; });
    if (sortVal === "price_asc") filtered.sort((a, b) => (a.variants[0]?.discountPrice || a.variants[0]?.price || 0) - (b.variants[0]?.discountPrice || b.variants[0]?.price || 0));
    if (sortVal === "price_desc") filtered.sort((a, b) => (b.variants[0]?.discountPrice || b.variants[0]?.price || 0) - (a.variants[0]?.discountPrice || a.variants[0]?.price || 0));
    setVisibleProducts(filtered);
  }, [searchVal, priceRange, sortVal, products, activeSubcategory, selectedBrands]);

  const handleAddToCart = (product: Product) => {
    const v = product.variants[0];
    if (!v) return;
    const img = product.images.find((i) => i.isPrimary)?.url || product.images[0]?.url || "";
    addToCart({ id: v.id, productId: product.id, name: product.name, variantName: v.name, image: img, price: v.discountPrice || v.price, stock: v.stock });
  };

  const handleCategoryNav = (cat: { name: string; slug: string }) => {
    router.push(`/category/${cat.slug}`);
  };

  const displayName = activeCatName === "Skin" ? "Skincare" : activeCatName === "Hair" ? "Haircare" : activeCatName;

  return (
    <>
      <Header />

      {/* Category Banner */}
      {activeSubcategory ? (
        <div style={{ width: "100%", height: "120px", backgroundColor: "#000", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", position: "relative" }}>
          <span style={{ fontSize: "11px", letterSpacing: "3px", fontWeight: "900", color: "#e52860", textTransform: "uppercase", position: "absolute", left: "60px" }}>GLOWGOODLY</span>
          <span style={{ fontSize: "28px", fontWeight: "900", letterSpacing: "3px", textTransform: "uppercase" }}>{activeSubcategory}</span>
          <span style={{ fontSize: "13px", fontWeight: "700", opacity: 0.75, position: "absolute", right: "60px" }}>Premium Beauty & Skincare</span>
        </div>
      ) : (
        <div style={{ width: "100%", height: "120px", backgroundColor: "#7c8088", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", position: "relative" }}>
          <span style={{ fontSize: "11px", letterSpacing: "3px", fontWeight: "900", color: "#e52860", textTransform: "uppercase", position: "absolute", left: "60px" }}>GLOWGOODLY</span>
          <span style={{ fontSize: "26px", fontWeight: "900", textTransform: "uppercase", letterSpacing: "1px" }}>{displayName}</span>
          <span style={{ fontSize: "13px", fontWeight: "700", opacity: 0.75, position: "absolute", right: "60px" }}>Premium Beauty & Skincare</span>
        </div>
      )}

      <main className="container" style={{ padding: "32px 20px", minHeight: "80vh" }}>
        <div style={{ display: "flex", gap: "28px", alignItems: "flex-start" }}>

          {/* ????? LEFT SIDEBAR ????? */}
          <aside style={{ width: "248px", flexShrink: 0, position: "sticky", top: "150px", maxHeight: "calc(100vh - 170px)", overflowY: "auto", paddingRight: "4px" }}>

            {/* 1. Price Filter */}
            <div style={{ background: "#fff", padding: "16px", border: "1px solid #edf2f7", borderRadius: "12px", boxShadow: "0 1px 6px rgba(0,0,0,0.04)", marginBottom: "16px" }}>
              <h3 style={{ fontSize: "12.5px", fontWeight: "900", color: "#0e1e38", textTransform: "uppercase", letterSpacing: "0.8px", borderBottom: "2px solid #f5f5f5", paddingBottom: "10px", margin: "0 0 14px 0" }}>
                Filter by Price
              </h3>
              <input type="range" min="0" max="19500" value={priceRange} onChange={(e) => setPriceRange(Number(e.target.value))} style={{ width: "100%", accentColor: "#e52860", cursor: "pointer" }} />
              <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "800", fontSize: "12.5px", color: "#2d3748", marginTop: "8px" }}>
                <span>? 0</span>
                <span style={{ color: "#e52860" }}>? {priceRange.toLocaleString()}</span>
              </div>
            </div>

            {/* 2. Product Categories */}
            <div style={{ background: "#fff", padding: "16px", border: "1px solid #edf2f7", borderRadius: "12px", boxShadow: "0 1px 6px rgba(0,0,0,0.04)", marginBottom: "16px" }}>
              <h3 style={{ fontSize: "12.5px", fontWeight: "900", color: "#0e1e38", textTransform: "uppercase", letterSpacing: "0.8px", borderBottom: "2px solid #f5f5f5", paddingBottom: "10px", margin: "0 0 12px 0" }}>
                Product Categories
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
                {ALL_CATEGORIES.map((cat, idx) => {
                  const isCurrentCat = activeCatName.toLowerCase() === cat.name.toLowerCase() || slug === cat.slug;
                  const catCount = getCategoryCount(cat.name);
                  const isExpanded = expandedCategory === cat.name;

                  return (
                    <div key={idx} style={{ borderBottom: "1px solid #f5f5f5" }}>
                      <div
                        onClick={() => {
                          if (isCurrentCat) {
                            setExpandedCategory(isExpanded ? null : cat.name);
                          } else {
                            handleCategoryNav(cat);
                          }
                        }}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "8px 0",
                          cursor: "pointer",
                          color: isCurrentCat ? "#e52860" : "#334155",
                          fontWeight: isCurrentCat ? "800" : "600",
                          fontSize: "13px",
                          userSelect: "none",
                        }}
                      >
                        <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <span style={{ fontSize: "10px", color: isCurrentCat ? "#e52860" : "#94a3b8" }}>{isExpanded ? "?" : "?"}</span>
                          {cat.name}
                        </span>
                        <span style={{ fontSize: "11px", color: isCurrentCat ? "#e52860" : "#94a3b8", fontWeight: "700" }}>({catCount})</span>
                      </div>

                      {/* Subcategories */}
                      {isExpanded && cat.subs && (
                        <div style={{ paddingLeft: "16px", paddingBottom: "8px", display: "flex", flexDirection: "column", gap: "4px" }}>
                          {cat.subs.map((sub, sIdx) => {
                            const isSubActive = activeSubcategory === sub;
                            const subCount = getSubcategoryCount(sub);
                            if (subCount === 0) return null;
                            return (
                              <div
                                key={sIdx}
                                onClick={() => setActiveSubcategory(isSubActive ? null : sub)}
                                style={{
                                  fontSize: "12px",
                                  color: isSubActive ? "#e52860" : "#64748b",
                                  fontWeight: isSubActive ? "700" : "500",
                                  cursor: "pointer",
                                  padding: "3px 0",
                                  display: "flex",
                                  justifyContent: "space-between",
                                }}
                              >
                                <span>- {sub}</span>
                                <span style={{ fontSize: "10.5px", color: isSubActive ? "#e52860" : "#94a3b8" }}>({subCount})</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 3. Brands */}
            <div style={{ background: "#fff", padding: "16px", border: "1px solid #edf2f7", borderRadius: "12px", boxShadow: "0 1px 6px rgba(0,0,0,0.04)" }}>
              <h3 style={{ fontSize: "12.5px", fontWeight: "900", color: "#0e1e38", textTransform: "uppercase", letterSpacing: "0.8px", borderBottom: "2px solid #f5f5f5", paddingBottom: "10px", margin: "0 0 12px 0" }}>
                Filter by Brand
              </h3>
              <input
                type="text"
                placeholder="Search brand..."
                value={brandSearchQuery}
                onChange={(e) => setBrandSearchQuery(e.target.value)}
                style={{ width: "100%", padding: "7px 10px", fontSize: "12px", borderRadius: "6px", border: "1px solid #e2e8f0", marginBottom: "10px", outline: "none" }}
              />
              <div style={{ maxHeight: "200px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "6px" }}>
                {brands
                  .filter((b) => b.name.toLowerCase().includes(brandSearchQuery.toLowerCase()))
                  .map((b) => {
                    const isChecked = selectedBrands.includes(b.name);
                    return (
                      <label key={b.id} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", fontWeight: isChecked ? "700" : "500", color: isChecked ? "#e52860" : "#4a5568", cursor: "pointer" }}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            if (isChecked) setSelectedBrands(selectedBrands.filter((x) => x !== b.name));
                            else setSelectedBrands([...selectedBrands, b.name]);
                          }}
                          style={{ accentColor: "#e52860" }}
                        />
                        {b.name}
                      </label>
                    );
                  })}
              </div>
            </div>

          </aside>

          {/* ????? MAIN PRODUCT GRID ????? */}
          <div style={{ flex: 1 }}>

            {/* Top Toolbar */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", background: "#fff", padding: "12px 18px", borderRadius: "10px", border: "1px solid #edf2f7", flexWrap: "wrap", gap: "10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ fontSize: "13.5px", fontWeight: "700", color: "#4a5568" }}>
                  Showing <strong style={{ color: "#0e1e38" }}>{visibleProducts.length}</strong> items
                </span>
                {activeSubcategory && (
                  <span style={{ background: "#ffeef2", color: "#e52860", fontSize: "12px", fontWeight: "700", padding: "3px 10px", borderRadius: "20px", display: "flex", alignItems: "center", gap: "6px" }}>
                    {activeSubcategory}
                    <span onClick={() => setActiveSubcategory(null)} style={{ cursor: "pointer", fontWeight: "900" }}>?</span>
                  </span>
                )}
                {selectedBrands.length > 0 && (
                  <span onClick={() => setSelectedBrands([])} style={{ fontSize: "12px", color: "#e52860", fontWeight: "700", cursor: "pointer", textDecoration: "underline" }}>
                    Clear Brands
                  </span>
                )}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <input
                  type="text"
                  placeholder="Search in this category..."
                  value={searchVal}
                  onChange={(e) => setSearchVal(e.target.value)}
                  style={{ padding: "6px 12px", fontSize: "12.5px", borderRadius: "6px", border: "1px solid #e2e8f0", outline: "none", width: "180px" }}
                />
                <select
                  value={sortVal}
                  onChange={(e) => setSortVal(e.target.value)}
                  style={{ padding: "6px 10px", fontSize: "12.5px", borderRadius: "6px", border: "1px solid #e2e8f0", background: "#fff", color: "#4a5568", fontWeight: "600", outline: "none", cursor: "pointer" }}
                >
                  <option value="">Default Sorting</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                </select>
              </div>
            </div>

            {loading ? (
              <GlowLoader text="Loading Products..." subtext="Filtering authentic cosmetics & skincare" />
            ) : visibleProducts.length === 0 ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "400px", fontSize: "15px", fontWeight: "700", color: "#718096" }}>No products found matching your filters.</div>
            ) : (
              <div className="product-grid">
                {visibleProducts.map((p) => {
                  const v = p.variants[0];
                  const primaryImage = p.images.find((i) => i.isPrimary)?.url || p.images[0]?.url || "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=500&auto=format&fit=crop&q=60";
                  const isWish = wishlist.includes(p.id);

                  return (
                    <div key={p.id} className="card">
                      <div
                        className="wishlist-btn"
                        onClick={(e) => {
                          e.preventDefault();
                          toggleWishlist(p.id);
                        }}
                      >
                        <svg width="20" height="20" fill={isWish ? "#e52860" : "none"} stroke={isWish ? "#e52860" : "currentColor"} strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                      </div>

                      <Link href={getProductUrl(p)} className="card-image">
                        <img src={primaryImage} alt={p.name} />
                      </Link>

                      <div className="card-body">
                        <Link href={getProductUrl(p)} className="card-title">{p.name}</Link>
                        <span className="card-shipping-badge">Free Shipping</span>

                        <div className="card-price-row">
                          {v?.discountPrice ? (
                            <>
                              <span className="card-discount-price">BDT {v.discountPrice}</span>
                              <span className="card-regular-price">BDT {v.price}</span>
                            </>
                          ) : (
                            <span className="card-discount-price">BDT {v?.price || 0}</span>
                          )}
                        </div>
                      </div>

                      <button className="add-to-cart-btn" onClick={() => handleAddToCart(p)}>Add to Cart</button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </main>

      <Footer />
      <MobileNavbar />
    </>
  );
}

export default function CategoryPage() {
  return (
    <Suspense fallback={<GlowLoader text="Loading Category..." subtext="Preparing cosmetics and skincare" />}>
      <CategoryPageContent />
    </Suspense>
  );
}
