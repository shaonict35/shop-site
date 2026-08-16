"use client";

import React, { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import Header from "../../../components/Header";
import PromoBanner from "../../../components/PromoBanner";
import Footer from "../../../components/Footer";
import MobileNavbar from "../../../components/MobileNavbar";
import { useApp } from "../../../context/AppContext";
import { API_BASE } from "../../../utils/api";

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
  description: string;
  brand: { id: string; name: string };
  category: { id: string; name: string };
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

function CategoryPageContent() {
  const params = useParams();
  const slug = (params.slug as string) || "";
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
    const target = subName.toLowerCase();
    return products.filter((p) => (p.category?.name?.toLowerCase() || "") === target).length;
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
      const targetSub = activeSubcategory.toLowerCase();
      filtered = filtered.filter((p) => {
        const catName = p.category?.name?.toLowerCase() || "";
        return catName === targetSub;
      });
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
    const targetSlug = cat.slug;
    window.location.href = `/category/${targetSlug}`;
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

          {/* ═══ LEFT SIDEBAR ═══ */}
          <aside style={{ width: "248px", flexShrink: 0, position: "sticky", top: "150px", maxHeight: "calc(100vh - 170px)", overflowY: "auto", paddingRight: "4px" }}>

            {/* 1. Price Filter */}
            <div style={{ background: "#fff", padding: "16px", border: "1px solid #edf2f7", borderRadius: "12px", boxShadow: "0 1px 6px rgba(0,0,0,0.04)", marginBottom: "16px" }}>
              <h3 style={{ fontSize: "12.5px", fontWeight: "900", color: "#0e1e38", textTransform: "uppercase", letterSpacing: "0.8px", borderBottom: "2px solid #f5f5f5", paddingBottom: "10px", margin: "0 0 14px 0" }}>
                Filter by Price
              </h3>
              <input type="range" min="0" max="19500" value={priceRange} onChange={(e) => setPriceRange(Number(e.target.value))} style={{ width: "100%", accentColor: "#e52860", cursor: "pointer" }} />
              <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "800", fontSize: "12.5px", color: "#2d3748", marginTop: "8px" }}>
                <span>৳ 0</span>
                <span style={{ color: "#e52860" }}>৳ {priceRange.toLocaleString()}</span>
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
                  return (
                    <div key={idx}>
                      <div
                        onClick={() => {
                          if (isCurrentCat) {
                            setActiveSubcategory(null);
                          } else {
                            handleCategoryNav(cat);
                          }
                        }}
                        style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 8px", fontSize: "13px", fontWeight: isCurrentCat ? "800" : "600", color: isCurrentCat ? "#e52860" : "#2d3748", cursor: "pointer", borderRadius: "7px", backgroundColor: isCurrentCat ? "#fff0f4" : "transparent", transition: "all 0.15s" }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <span style={{ fontSize: "13px", color: isCurrentCat ? "#e52860" : "#b0b8c4", display: "inline-block", transform: isCurrentCat ? "rotate(90deg)" : "rotate(0)", transition: "transform 0.2s" }}>›</span>
                          <span>{cat.name}</span>
                        </div>
                        <span style={{
                          backgroundColor: "#e52860",
                          color: "#ffffff",
                          fontSize: "11px",
                          fontWeight: "800",
                          padding: "2px 7px",
                          borderRadius: "12px",
                          minWidth: "22px",
                          textAlign: "center"
                        }}>
                          {catCount}
                        </span>
                      </div>

                      {isCurrentCat && (
                        <div style={{ paddingLeft: "10px", marginLeft: "8px", borderLeft: "2px solid #ffe0ea", marginBottom: "4px" }}>
                          {cat.subs.map((sub, sIdx) => {
                            const isSubActive = activeSubcategory === sub;
                            const subCount = getSubcategoryCount(sub);
                            if (subCount === 0) return null;
                            return (
                              <div
                                key={sIdx}
                                onClick={(e) => { e.stopPropagation(); setActiveSubcategory(isSubActive ? null : sub); }}
                                style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 8px", fontSize: "12.5px", fontWeight: isSubActive ? "800" : "500", color: isSubActive ? "#e52860" : "#4a5568", cursor: "pointer", borderRadius: "6px", backgroundColor: isSubActive ? "#fff0f4" : "transparent", transition: "all 0.13s" }}
                              >
                                <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                                  <span style={{ width: "5px", height: "5px", borderRadius: "50%", backgroundColor: isSubActive ? "#e52860" : "#d1d5db", flexShrink: 0, display: "inline-block" }} />
                                  <span style={{ lineHeight: "1.3" }}>{sub}</span>
                                </div>
                                <span style={{
                                  backgroundColor: isSubActive ? "#e52860" : "#f1f3f5",
                                  color: isSubActive ? "#ffffff" : "#718096",
                                  fontSize: "10px",
                                  fontWeight: "800",
                                  padding: "1px 6px",
                                  borderRadius: "10px",
                                  minWidth: "18px",
                                  textAlign: "center"
                                }}>
                                  {subCount}
                                </span>
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

            {/* 3. Brand Filter */}
            <div style={{ background: "#fff", padding: "16px", border: "1px solid #edf2f7", borderRadius: "12px", boxShadow: "0 1px 6px rgba(0,0,0,0.04)" }}>
              <h3 style={{ fontSize: "12.5px", fontWeight: "900", color: "#0e1e38", textTransform: "uppercase", letterSpacing: "0.8px", borderBottom: "2px solid #f5f5f5", paddingBottom: "10px", margin: "0 0 12px 0" }}>
                Filter by Brand
              </h3>
              <div style={{ position: "relative", marginBottom: "10px" }}>
                <input type="text" placeholder="Search brand..." value={brandSearchQuery} onChange={(e) => setBrandSearchQuery(e.target.value)}
                  style={{ width: "100%", padding: "8px 32px 8px 11px", fontSize: "12px", fontWeight: "600", border: "1.5px solid #edf2f7", borderRadius: "7px", outline: "none" }} />
                <span style={{ position: "absolute", right: "9px", top: "50%", transform: "translateY(-50%)", color: "#a0aec0", fontSize: "12px" }}>🔍</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "1px", maxHeight: "260px", overflowY: "auto" }}>
                {brands.filter((b) => b.name.toLowerCase().includes(brandSearchQuery.toLowerCase())).map((b) => {
                  const isChecked = selectedBrands.includes(b.name);
                  return (
                    <label key={b.id} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "7px 6px", fontSize: "12.5px", fontWeight: "600", color: isChecked ? "#e52860" : "#4a5568", cursor: "pointer", borderRadius: "6px", backgroundColor: isChecked ? "#fff0f4" : "transparent", transition: "all 0.12s", userSelect: "none" }}>
                      <input type="checkbox" checked={isChecked}
                        onChange={() => { if (isChecked) setSelectedBrands(selectedBrands.filter((x) => x !== b.name)); else setSelectedBrands([...selectedBrands, b.name]); }}
                        style={{ width: "13px", height: "13px", accentColor: "#e52860", cursor: "pointer", flexShrink: 0 }} />
                      {b.name}
                    </label>
                  );
                })}
                {brands.length === 0 && <p style={{ fontSize: "12px", color: "#a0aec0", padding: "6px 0" }}>Loading brands...</p>}
              </div>
              {selectedBrands.length > 0 && (
                <button onClick={() => setSelectedBrands([])} style={{ marginTop: "8px", fontSize: "11px", fontWeight: "700", color: "#e52860", background: "none", border: "none", cursor: "pointer", padding: "0" }}>
                  ✕ Clear brands
                </button>
              )}
            </div>
          </aside>

          {/* ═══ PRODUCT GRID ═══ */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "14px", marginBottom: "22px", flexWrap: "wrap" }}>
              <input type="text" placeholder="Search products..." value={searchVal} onChange={(e) => setSearchVal(e.target.value)}
                style={{ flex: 1, minWidth: "160px", padding: "10px 16px", fontSize: "13.5px", fontWeight: "600", border: "1.5px solid #e2e8f0", borderRadius: "8px", outline: "none" }} />
              <select value={sortVal} onChange={(e) => setSortVal(e.target.value)}
                style={{ padding: "10px 16px", fontSize: "13px", fontWeight: "700", border: "1.5px solid #e2e8f0", borderRadius: "8px", outline: "none", backgroundColor: "#fff", cursor: "pointer" }}>
                <option value="">Default sorting</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
              </select>
              <span style={{ fontSize: "12.5px", fontWeight: "700", color: "#718096", whiteSpace: "nowrap" }}>{visibleProducts.length} items</span>
            </div>

            {loading ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "400px", fontSize: "16px", fontWeight: "700", color: "#e52860" }}>Loading category cosmetics...</div>
            ) : visibleProducts.length === 0 ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "400px", fontSize: "15px", fontWeight: "700", color: "#718096" }}>No products found matching your filters.</div>
            ) : (
              <div className="product-grid-shajgoj">
                {visibleProducts.map((p, idx) => {
                  const primaryImage = p.images.find((img) => img.isPrimary)?.url || p.images[0]?.url || "";
                  const v = p.variants[0];
                  if (!v) return null;

                  const isDiscounted = v.discountPrice !== null && v.discountPrice! < v.price;
                  const displayPrice = isDiscounted ? v.discountPrice : v.price;
                  const discountPct = isDiscounted ? Math.round(((v.price - v.discountPrice!) / v.price) * 100) : 0;
                  const starFull = 3 + (idx % 3);
                  const hasHalf = idx % 5 === 0;

                  return (
                    <div className="product-card" key={`${p.id}-${idx}`}>
                      {isDiscounted && <div className="badge-tag">{discountPct}% OFF</div>}
                      <div className={`wishlist-btn ${wishlist.includes(p.id) ? "active" : ""}`} onClick={() => toggleWishlist(p.id)}>
                        <svg fill={wishlist.includes(p.id) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="16" height="16">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                        </svg>
                      </div>

                      <Link href={`/product/${p.id}`} className="card-image">
                        <img src={primaryImage} alt={p.name} />
                      </Link>

                      <div className="card-body">
                        <Link href={`/product/${p.id}`} className="card-title">{p.name}</Link>
                        <span className="card-shipping-badge">Free Shipping</span>

                        <div className="card-price-row">
                          {isDiscounted && <span className="old-price">৳{v.price}</span>}
                          <span className="price">৳{displayPrice}</span>
                        </div>

                        <div className="card-rating">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <span key={i} style={{ color: i < starFull ? "#f59e0b" : i === starFull && hasHalf ? "#f59e0b" : "#d1d5db", opacity: i === starFull && hasHalf ? 0.5 : 1 }}>★</span>
                          ))}
                        </div>
                        <div className="card-variant-label">{v.name}</div>
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
    <Suspense fallback={<div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", fontSize: "16px", fontWeight: "700", color: "#e52860" }}>Loading category...</div>}>
      <CategoryPageContent />
    </Suspense>
  );
}
