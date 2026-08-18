"use client";

import React, { useEffect, useState, Suspense } from "react";
import { fetchWithCache, API_BASE } from "../../utils/api";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Header from "../../components/Header";
import PromoBanner from "../../components/PromoBanner";
import Footer from "../../components/Footer";
import MobileNavbar from "../../components/MobileNavbar";
import { useApp } from "../../context/AppContext";


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
  category: { id: string; name: string; parent?: { name: string } };
  campaignName?: string | null;
  price?: number;
  discountPrice?: number | null;
  imageUrl?: string;
  rating?: number;
  reviewsCount?: number;
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
    name: "Personal care",
    slug: "personal-care",
    subs: [
      "Deodorant", "Roll-on", "Body Spray", "Intimate Wash", "Hand Sanitizer",
      "Body Wash", "Bar Soap", "Shower Gel",
      "Toothpaste", "Toothbrush", "Mouthwash", "Dental Floss",
      "Sanitary Napkin", "Panty Liner", "Menstrual Cup", "Feminine Wash"
    ]
  },
  {
    name: "Mom & Baby",
    slug: "mom-baby",
    subs: [
      "Baby Lotion", "Baby Oil", "Baby Wash", "Diaper Cream",
      "Stretch Mark Cream", "Nursing Pads", "Nipple Cream",
      "Baby Shampoo", "Baby Powder", "Baby Sunscreen", "Wipes",
      "Pregnancy Supplements", "Lactation Support"
    ]
  },
  {
    name: "Fragrance",
    slug: "fragrance",
    subs: [
      "Womens Perfume", "Mens Cologne", "Unisex Fragrance",
      "Attar", "Body Mist", "Perfume Gift Set",
      "Roll-On Perfume", "Solid Perfume", "Hair Mist"
    ]
  },
  {
    name: "Perfect Match COMBO",
    slug: "combo",
    subs: [
      "Skin Combos", "Makeup Combos", "Hair Combos",
      "Acne Clearance Combo", "Brightening Kit", "Anti-Aging Regimen",
      "Everyday Makeup Kit", "Bridal Glow Combo", "Party Glam Kit",
      "Hair Fall Defense Trio", "Dandruff Solution Combo", "Smooth & Shine Kit"
    ]
  },
  {
    name: "Clearance SALE",
    slug: "clearance-sale",
    subs: [
      "Makeup Deals", "Skincare Deals", "Haircare Deals",
      "Lipsticks under 499", "Palettes at 40% Off", "Face products deals",
      "Serums Flat 30% Off", "Cleansers B1G1", "Sheet masks packs",
      "Hair Oils Flat 20% Off", "Hair Masques Deals", "Shampoo Combs Packs"
    ]
  },
  {
    name: "BOGO",
    slug: "bogo",
    subs: [
      "Buy 1 Get 1 Free", "BOGO Cosmetics", "BOGO Skincare", "BOGO Haircare", "BOGO Combos"
    ]
  },
  {
    name: "Exclusive OFFERS",
    slug: "exclusive",
    subs: [
      "VIP Offers", "Luxury Brands Discount", "Limited Collection", "Exclusive Gift Sets"
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
  const target = subName.toLowerCase().trim();
  const cName = p.category?.name?.toLowerCase() || "";
  const pName = (p.category as any)?.parent?.name?.toLowerCase() || "";

  // 1. Exact or partial match in DB category name
  if (cName === target || cName.includes(target)) {
    return true;
  }

  // 2. Fallback: match by product name or description
  const prodName = p.name.toLowerCase();
  
  if (target === "face wash") {
    return prodName.includes("face wash") || prodName.includes("facewash") || prodName.includes("cleanser") || prodName.includes("cleansing");
  }
  if (target === "body wash") {
    return prodName.includes("body wash") || prodName.includes("shower gel") || prodName.includes("soap");
  }
  if (target === "shampoo") {
    return prodName.includes("shampoo");
  }
  if (target === "conditioner") {
    return prodName.includes("conditioner");
  }
  if (target === "lipstick") {
    return prodName.includes("lipstick");
  }
  if (target === "foundation") {
    return prodName.includes("foundation");
  }
  if (target === "primer" || target === "face primer") {
    return prodName.includes("primer");
  }
  if (target === "concealer") {
    return prodName.includes("concealer");
  }
  if (target === "lip balm") {
    return prodName.includes("lip balm") || prodName.includes("lipbalm");
  }
  if (target === "sunscreen") {
    return prodName.includes("sunscreen") || prodName.includes("sun block") || prodName.includes("sunblock");
  }
  if (target === "sheet mask") {
    return prodName.includes("sheet mask");
  }
  if (target === "kajal") {
    return prodName.includes("kajal");
  }
  if (target === "eyeliner") {
    return prodName.includes("eyeliner");
  }
  if (target === "mascara") {
    return prodName.includes("mascara");
  }
  if (target === "hair fall") {
    return prodName.includes("fall") || prodName.includes("loss");
  }
  if (target === "dandruff") {
    return prodName.includes("dandruff");
  }
  
  return prodName.includes(target);
};

function ShopPageContent() {
  const { addToCart, wishlist, toggleWishlist } = useApp();

  const [products, setProducts] = useState<Product[]>([]);
  const [visibleProducts, setVisibleProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [brands, setBrands] = useState<any[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [brandSearchQuery, setBrandSearchQuery] = useState("");
  const [showAllBrands, setShowAllBrands] = useState(false);

  const [priceRange, setPriceRange] = useState(5000);
  const [maxPriceBound, setMaxPriceBound] = useState(5000);
  const [searchVal, setSearchVal] = useState("");
  const [sortVal, setSortVal] = useState("");
  const [activeCategories, setActiveCategories] = useState<string[]>([]);
  const [activeSubcategories, setActiveSubcategories] = useState<string[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

  // Mobile filter drawer
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Pre-calculate counts with useMemo to eliminate render lag
  const categoryCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    ALL_CATEGORIES.forEach((cat) => {
      const target = cat.name.toLowerCase();
      let matchNames = [target];
      if (target === "skin" || target === "skincare") matchNames = ["skin", "skincare"];
      if (target === "hair" || target === "haircare") matchNames = ["hair", "haircare"];
      counts[cat.name] = products.filter((p) => {
        const cName = p.category?.name?.toLowerCase() || "";
        const pName = (p.category as any)?.parent?.name?.toLowerCase() || "";
        return matchNames.some((name) => cName.includes(name) || pName.includes(name));
      }).length;
    });
    return counts;
  }, [products]);

  const subcategoryCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    ALL_CATEGORIES.forEach((cat) => {
      cat.subs.forEach((sub) => {
        counts[sub] = products.filter((p) => productMatchesSubcategory(p, sub)).length;
      });
    });
    return counts;
  }, [products]);

  const getCategoryCount = (catName: string) => categoryCounts[catName] || 0;
  const getSubcategoryCount = (subName: string) => subcategoryCounts[subName] || 0;

  const searchParams = useSearchParams();
  const subQuery = searchParams ? searchParams.get("sub") : null;
  const catQuery = searchParams ? searchParams.get("category") : null;
  const brandQuery = searchParams ? searchParams.get("brand") : null;
  const campaignQuery = searchParams ? searchParams.get("campaign") : null;
  const searchQuery = searchParams ? searchParams.get("search") : null;

  // Initialize searchVal from URL ?search= param
  useEffect(() => {
    if (searchQuery) {
      setSearchVal(searchQuery);
    }
  }, [searchQuery]);

  useEffect(() => {
    // Sync filter states with URL query parameters in real-time on query changes
    if (subQuery) {
      setActiveSubcategories([subQuery]);
    } else {
      setActiveSubcategories([]);
    }

    const targetCatQuery = catQuery || (campaignQuery ? (campaignQuery.toUpperCase() === "CLEARANCE" ? "clearance-sale" : campaignQuery) : null);
    if (targetCatQuery) {
      const found = ALL_CATEGORIES.find(c => 
        c.slug === targetCatQuery.toLowerCase() || 
        c.name.toLowerCase() === targetCatQuery.toLowerCase() ||
        (targetCatQuery.toLowerCase() === "skincare" && c.slug === "skin") ||
        (targetCatQuery.toLowerCase() === "haircare" && c.slug === "hair")
      );
      if (found) {
        setActiveCategories([found.name]);
        setExpandedCategories([found.name]);
      } else {
        const formatted = targetCatQuery.charAt(0).toUpperCase() + targetCatQuery.slice(1);
        setActiveCategories([formatted]);
        setExpandedCategories([formatted]);
      }
    } else {
      setActiveCategories([]);
    }

    if (brandQuery && brands.length > 0) {
      const matchedBrand = brands.find(b => b.id === brandQuery || b.name.toLowerCase() === brandQuery.toLowerCase());
      if (matchedBrand) {
        setSelectedBrands([matchedBrand.name]);
      } else {
        setSelectedBrands([brandQuery]);
      }
    } else if (!brandQuery) {
      setSelectedBrands([]);
    }
  }, [subQuery, catQuery, brandQuery, campaignQuery, brands]);

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      try {
        const [prodData, brandData] = await Promise.all([
          fetchWithCache(`${API_BASE}/products`),
          fetchWithCache(`${API_BASE}/brands`),
        ]);
        const validProds = Array.isArray(prodData) ? prodData : [];
        const validBrands = Array.isArray(brandData) ? brandData : [];

        setProducts(validProds);
        setVisibleProducts(validProds);
        setBrands(validBrands);

        // Dynamically compute the maximum price bound
        if (validProds.length > 0) {
          const maxVal = validProds.reduce((max: number, p: any) => {
            const v = p.variants && p.variants[0];
            const pVal = v ? (v.discountPrice !== null && v.discountPrice !== undefined ? v.discountPrice : v.price) : (p.price || 0);
            return pVal > max ? pVal : max;
          }, 5000);
          const roundedMax = Math.max(50000, Math.ceil(maxVal / 500) * 500);
          setMaxPriceBound(roundedMax);
          setPriceRange(roundedMax);
        }
      } catch (e) {
        console.error("Error loading products/brands", e);
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
    const handleSync = () => fetchInitialData();
    window.addEventListener("glowgoodly_data_updated", handleSync);
    return () => window.removeEventListener("glowgoodly_data_updated", handleSync);
  }, []);




  const [isInitial, setIsInitial] = useState(true);

  useEffect(() => {
    let filtered = [...products];


    // Filter by categories & subcategories (if any are selected)
    if (activeCategories.length > 0 || activeSubcategories.length > 0) {
      filtered = filtered.filter((p) => {
        const cName = p.category?.name?.toLowerCase() || "";
        const pName = (p.category as any)?.parent?.name?.toLowerCase() || "";

        let matchesFilter = false;

        // 1. Check if it matches any active parent category
        if (activeCategories.length > 0) {
          matchesFilter = activeCategories.some((cat) => {
            const targetCat = cat.toLowerCase();
            
            // Is the product in this parent category?
            let inParent = false;
            if (targetCat === "bogo") inParent = (p.campaignName === "BOGO" || p.category?.name?.toLowerCase().includes("bogo") || p.name?.toLowerCase().includes("bogo"));
            else if (targetCat === "exclusive" || targetCat === "exclusive offers") inParent = (p.campaignName === "EXCLUSIVE" || p.category?.name?.toLowerCase().includes("exclusive") || p.name?.toLowerCase().includes("exclusive"));
            else if (targetCat === "combo" || targetCat === "perfect match combo") inParent = (p.campaignName === "COMBO" || p.category?.name?.toLowerCase().includes("combo") || p.name?.toLowerCase().includes("combo"));
            else if (targetCat === "clearance-sale" || targetCat === "clearance sale") inParent = (p.campaignName === "CLEARANCE" || p.category?.name?.toLowerCase().includes("clearance") || p.name?.toLowerCase().includes("clearance"));
            else {
              let matchNames = [targetCat];
            if (targetCat === "skin" || targetCat === "skincare") matchNames = ["skin", "skincare"];
            if (targetCat === "hair" || targetCat === "haircare") matchNames = ["hair", "haircare"];
            if (targetCat === "personal care" || targetCat === "personal-care") matchNames = ["personal care", "personal-care", "hygiene"];
            if (targetCat === "makeup") matchNames = ["makeup"];
            inParent = matchNames.some((name) => cName.includes(name) || pName.includes(name));
            }

            if (!inParent) return false;

            // If the parent matches, does it have active subcategories checked?
            const catObj = ALL_CATEGORIES.find(c => c.name === cat);
            const activeSubsForThisCat = catObj ? catObj.subs.filter(sub => activeSubcategories.includes(sub)) : [];

            if (activeSubsForThisCat.length > 0) {
              // The parent category has checked subcategories. The product must match one of them!
              return activeSubsForThisCat.some(sub => productMatchesSubcategory(p, sub));
            } else {
              // No subcategories checked for this parent category. Show all products in the category!
              return true;
            }
          });
        }

        // 2. If it didn't match via active categories, check if it matches any active subcategory directly
        if (!matchesFilter && activeSubcategories.length > 0) {
          matchesFilter = activeSubcategories.some((sub) => {
            return productMatchesSubcategory(p, sub);
          });
        }

        return matchesFilter;
      });
    }

    if (selectedBrands.length > 0) {
      const lowerSelected = selectedBrands.map(b => b.toLowerCase().trim());
      filtered = filtered.filter((p) => {
        const brandName = p.brand?.name?.toLowerCase().trim();
        return brandName && lowerSelected.includes(brandName);
      });
    }

    if (campaignQuery) {
      filtered = filtered.filter((p) => p.campaignName === campaignQuery);
    }

    if (searchVal.trim()) {
      const q = searchVal.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.brand?.name?.toLowerCase().includes(q) ||
          p.category?.name?.toLowerCase().includes(q)
      );
    }

    filtered = filtered.filter((p) => {
      const v = p.variants && p.variants[0];
      const dp = v ? (v.discountPrice !== null && v.discountPrice !== undefined ? v.discountPrice : v.price) : (p.price || 0);
      return dp <= priceRange;
    });

    if (sortVal === "price_asc") {
      filtered.sort((a, b) => {
        const pa = a.variants[0]?.discountPrice ?? a.variants[0]?.price ?? 0;
        const pb = b.variants[0]?.discountPrice ?? b.variants[0]?.price ?? 0;
        return pa - pb;
      });
    } else if (sortVal === "price_desc") {
      filtered.sort((a, b) => {
        const pa = a.variants[0]?.discountPrice ?? a.variants[0]?.price ?? 0;
        const pb = b.variants[0]?.discountPrice ?? b.variants[0]?.price ?? 0;
        return pb - pa;
      });
    }

    setVisibleProducts(filtered);
  }, [searchVal, priceRange, sortVal, products, activeCategories, activeSubcategories, selectedBrands, campaignQuery]);

  useEffect(() => {
    if (isInitial) {
      setIsInitial(false);
      return;
    }
    const mainContent = document.getElementById("shop-main-section");
    if (mainContent) {
      mainContent.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [activeCategories, activeSubcategories, selectedBrands]);

  const handleAddToCart = (product: Product, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const v = product.variants[0];
    if (!v) return;
    const img = product.images.find((i) => i.isPrimary)?.url || product.images[0]?.url || "";
    const effectivePrice = (v.discountPrice !== null && v.discountPrice !== undefined && v.discountPrice > 0) ? v.discountPrice : v.price;
    addToCart({ id: v.id, productId: product.id, name: product.name, variantName: v.name, image: img, price: effectivePrice, stock: v.stock || 50 });
  };

  const handleBuyNow = (product: Product, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    handleAddToCart(product);
    window.location.href = "/checkout";
  };

  // Sidebar content (shared between desktop sidebar and mobile drawer)
  const SidebarContent = () => (
    <>
      {/* 1. Price Filter */}
      <div style={{ background: "#fff", padding: "16px", border: "1px solid #edf2f7", borderRadius: "12px", boxShadow: "0 1px 6px rgba(0,0,0,0.04)", marginBottom: "16px" }}>
        <h3 style={{ fontSize: "12.5px", fontWeight: "900", color: "#0e1e38", textTransform: "uppercase", letterSpacing: "0.8px", borderBottom: "2px solid #f5f5f5", paddingBottom: "10px", margin: "0 0 14px 0" }}>
          Filter by Price
        </h3>
        <input type="range" min="0" max={maxPriceBound} value={priceRange} onChange={(e) => setPriceRange(Number(e.target.value))} style={{ width: "100%", accentColor: "#e52860", cursor: "pointer" }} />
        <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "800", fontSize: "12.5px", color: "#2d3748", marginTop: "8px" }}>
          <span>৳ 0</span>
          <span style={{ color: "#e52860" }}>৳ {priceRange.toLocaleString()}</span>
        </div>
      </div>

      {/* 2. Product Categories */}
      <div style={{ background: "#fff", padding: "16px", border: "1px solid #edf2f7", borderRadius: "12px", boxShadow: "0 1px 6px rgba(0,0,0,0.04)", marginBottom: "16px" }}>
        <h3 style={{ fontSize: "12.5px", fontWeight: "900", color: "#0e1e38", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.8px", borderBottom: "2px solid #f5f5f5", paddingBottom: "10px", margin: "0 0 12px 0" }}>
          Product Categories
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
          {ALL_CATEGORIES.map((cat, idx) => {
            const isCatActive = activeCategories.includes(cat.name);
            const isExpanded = expandedCategories.includes(cat.name);
            const catCount = getCategoryCount(cat.name);
            return (
              <div key={idx}>
                <div
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 8px", fontSize: "13px", color: "#2d3748", borderRadius: "7px", backgroundColor: isCatActive ? "#fff0f4" : "transparent", transition: "all 0.15s" }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", flex: 1 }}>
                    <input
                      type="checkbox"
                      checked={isCatActive}
                      onChange={() => {
                        if (isCatActive) {
                          setActiveCategories(activeCategories.filter(c => c !== cat.name));
                          setActiveSubcategories(activeSubcategories.filter(sub => !cat.subs.includes(sub)));
                        } else {
                          setActiveCategories([...activeCategories, cat.name]);
                        }
                      }}
                      style={{ width: "13px", height: "13px", accentColor: "#e52860", cursor: "pointer", marginRight: "4px", flexShrink: 0 }}
                    />
                    <div 
                      onClick={() => {
                        if (isExpanded) {
                          setExpandedCategories(expandedCategories.filter(c => c !== cat.name));
                        } else {
                          setExpandedCategories([...expandedCategories, cat.name]);
                        }
                      }}
                      style={{ display: "flex", alignItems: "center", cursor: "pointer", flex: 1, fontWeight: isCatActive ? "800" : "600", userSelect: "none" }}
                    >
                      <span style={{ fontSize: "13px", color: isExpanded ? "#e52860" : "#b0b8c4", marginRight: "4px", display: "inline-block", transform: isExpanded ? "rotate(90deg)" : "rotate(0)", transition: "transform 0.2s" }}>›</span>
                      <span>{cat.name}</span>
                    </div>
                  </div>
                  <span style={{
                    backgroundColor: isCatActive ? "#e52860" : "#f1f3f5",
                    color: isCatActive ? "#ffffff" : "#718096",
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

                {isExpanded && (
                  <div style={{ paddingLeft: "10px", marginLeft: "8px", borderLeft: "2px solid #ffe0ea", marginBottom: "4px" }}>
                    {cat.subs.map((sub, sIdx) => {
                      const isSubActive = activeSubcategories.includes(sub);
                      const subCount = getSubcategoryCount(sub);
                      return (
                        <div
                          key={sIdx}
                          style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 8px", fontSize: "12.5px", color: "#4a5568", borderRadius: "6px", backgroundColor: isSubActive ? "#fff0f4" : "transparent", transition: "all 0.13s" }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "7px", flex: 1 }}>
                            <input
                              type="checkbox"
                              checked={isSubActive}
                              onChange={() => {
                                if (isSubActive) {
                                  setActiveSubcategories(activeSubcategories.filter(s => s !== sub));
                                } else {
                                  setActiveSubcategories([...activeSubcategories, sub]);
                                }
                              }}
                              style={{ width: "12px", height: "12px", accentColor: "#e52860", cursor: "pointer", marginRight: "2px", flexShrink: 0 }}
                            />
                            <span 
                              onClick={() => {
                                if (isSubActive) {
                                  setActiveSubcategories(activeSubcategories.filter(s => s !== sub));
                                } else {
                                  setActiveSubcategories([...activeSubcategories, sub]);
                                }
                              }}
                              style={{ cursor: "pointer", fontWeight: isSubActive ? "800" : "500", lineHeight: "1.3", flex: 1, userSelect: "none" }}
                            >
                              {sub}
                            </span>
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
        <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
          {brands
            .filter((b) => b.name.toLowerCase().includes(brandSearchQuery.toLowerCase()))
            .slice(0, showAllBrands ? undefined : 15)
            .map((b) => {
              const isChecked = selectedBrands.includes(b.name);
              return (
                <label key={b.id} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "7px 6px", fontSize: "12.5px", fontWeight: "600", color: isChecked ? "#e52860" : "#4a5568", cursor: "pointer", borderRadius: "6px", backgroundColor: isChecked ? "#fff0f4" : "transparent", transition: "all 0.12s", userSelect: "none" }}>
                  <input type="checkbox" checked={isChecked}
                    onChange={() => { if (isChecked) setSelectedBrands(selectedBrands.filter((x) => x !== b.name)); else setSelectedBrands([...selectedBrands, b.name]); }}
                    style={{ width: "13px", height: "13px", accentColor: "#e52860", cursor: "pointer", flexShrink: 0 }} />
                  {b.logoUrl && (
                    <img 
                      src={b.logoUrl} 
                      alt={b.name} 
                      style={{ width: "20px", height: "20px", objectFit: "contain", borderRadius: "4px", backgroundColor: "#fff", border: "1px solid #edf2f7", padding: "1px" }} 
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                  )}
                  <span>{b.name}</span>
                </label>
              );
            })}
          {brands.length === 0 && <p style={{ fontSize: "12px", color: "#a0aec0", padding: "6px 0" }}>Loading brands...</p>}
        </div>
        
        {brands.filter((b) => b.name.toLowerCase().includes(brandSearchQuery.toLowerCase())).length > 15 && (
          <button 
            onClick={() => setShowAllBrands(!showAllBrands)} 
            style={{ marginTop: "12px", fontSize: "11.5px", fontWeight: "800", color: "#e52860", background: "none", border: "none", cursor: "pointer", padding: "0", textTransform: "uppercase" }}
          >
            {showAllBrands ? "SHOW LESS" : "SHOW MORE"}
          </button>
        )}

        {selectedBrands.length > 0 && (
          <button onClick={() => setSelectedBrands([])} style={{ marginTop: "8px", display: "block", fontSize: "11px", fontWeight: "700", color: "#e52860", background: "none", border: "none", cursor: "pointer", padding: "0" }}>
            ✕ Clear brands
          </button>
        )}
      </div>
    </>
  );

  // Get banner title
  const bannerTitle = activeSubcategories.length > 0
    ? activeSubcategories.join(", ")
    : activeCategories.length > 0
    ? activeCategories.join(" & ").toUpperCase() + " COLLECTION"
    : "ALL PRODUCTS";

  const bannerBg = activeSubcategories.length > 0
    ? "#000"
    : activeCategories.length > 0
    ? "linear-gradient(90deg,#09090b,#18181b 50%,#27272a)"
    : "linear-gradient(90deg,#132238,#0e1e38)";

  return (
    <>
      <Header />

      {/* Page Banner */}
      <div className="shop-banner" style={{ background: bannerBg }}>
        <span className="shop-banner-side">GLOWGOODLY</span>
        <span className="shop-banner-title">{bannerTitle}</span>
        <span className="shop-banner-subtitle">
          {activeSubcategories.length > 0 ? "Premium Beauty & Skincare" : "#1 Beauty Destination in Bangladesh"}
        </span>
      </div>

      <main className="container" style={{ padding: "32px 20px", minHeight: "80vh" }}>

        {/* Mobile Filter Toggle */}
        <button className="mobile-filter-toggle" onClick={() => setMobileFilterOpen(true)}>
          <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="16" height="16">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          FILTER & SORT
        </button>

        {/* Mobile Filter Drawer */}
        {mobileFilterOpen && (
          <div className="mobile-filter-backdrop" onClick={() => setMobileFilterOpen(false)} />
        )}
        <div className={`mobile-filter-drawer ${mobileFilterOpen ? "open" : ""}`}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h3 style={{ fontSize: "14px", fontWeight: "900", color: "#0e1e38", textTransform: "uppercase" }}>Filters</h3>
            <button onClick={() => setMobileFilterOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "20px", color: "#718096", fontWeight: "bold" }}>✕</button>
          </div>
          <SidebarContent />
        </div>

        <div className="shop-layout">
          {/* ═══ LEFT SIDEBAR (Desktop) ═══ */}
          <aside className="shop-sidebar">
            <SidebarContent />
          </aside>

          {/* ═══ PRODUCT GRID ═══ */}
          <div id="shop-main-section" className="shop-main-content">
            {/* Active Category Filter Tag Badge (Matches Image 4) */}
            {(activeCategories.length > 0 || activeSubcategories.length > 0 || selectedBrands.length > 0) && (
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "16px", alignItems: "center" }}>
                {(activeCategories.length > 0 || activeSubcategories.length > 0) && (
                  <span style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    backgroundColor: "#e2136e",
                    color: "#ffffff",
                    fontSize: "12.5px",
                    fontWeight: "800",
                    padding: "6px 14px",
                    borderRadius: "20px",
                    boxShadow: "0 2px 8px rgba(226,19,110,0.25)"
                  }}>
                    Category: {[...activeCategories, ...activeSubcategories].join(" > ")}
                    <span
                      onClick={() => {
                        setActiveCategories([]);
                        setActiveSubcategories([]);
                        if (typeof window !== "undefined") {
                          window.history.pushState({}, "", "/shop");
                        }
                      }}
                      style={{ cursor: "pointer", fontWeight: "900", fontSize: "14px", marginLeft: "4px", backgroundColor: "rgba(255,255,255,0.2)", width: "18px", height: "18px", borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
                    >✕</span>
                  </span>
                )}
                {selectedBrands.map((bName) => (
                  <span key={bName} style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    backgroundColor: "#0e1e38",
                    color: "#ffffff",
                    fontSize: "11.5px",
                    fontWeight: "800",
                    padding: "6px 12px",
                    borderRadius: "20px",
                    letterSpacing: "0.3px"
                  }}>
                    Brand: {bName}
                    <span
                      onClick={() => setSelectedBrands(selectedBrands.filter((x) => x !== bName))}
                      style={{ cursor: "pointer", fontWeight: "900", fontSize: "13px", marginLeft: "2px", lineHeight: 1 }}
                    >×</span>
                  </span>
                ))}
              </div>
            )}

            {/* Controls */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "14px", marginBottom: "22px", flexWrap: "wrap" }}>
              <input type="text" placeholder="Search here..." value={searchVal} onChange={(e) => setSearchVal(e.target.value)}
                style={{ flex: 1, minWidth: "140px", padding: "10px 16px", fontSize: "13.5px", fontWeight: "600", border: "1.5px solid #e2e8f0", borderRadius: "8px", outline: "none" }} />
              <select value={sortVal} onChange={(e) => setSortVal(e.target.value)}
                style={{ padding: "10px 14px", fontSize: "13.5px", fontWeight: "700", border: "1.5px solid #e2e8f0", borderRadius: "8px", outline: "none", backgroundColor: "#fff", cursor: "pointer", color: "#334155" }}>
                <option value="">Default sorting</option>
                <option value="popularity">Sort by popularity</option>
                <option value="rating">Sort by average rating</option>
                <option value="latest">Sort by latest</option>
                <option value="price_low">Sort by price: low to high</option>
                <option value="price_high">Sort by price: high to low</option>
              </select>
            </div>

            {/* Product Grid */}
            {loading ? (
              <div style={{ textAlign: "center", padding: "60px 0", color: "var(--gray-500)", fontWeight: "600" }}>
                <div className="animate-pulse" style={{ fontSize: "16px", color: "#e63b7a", fontWeight: "800" }}>Loading 100% Authentic Cosmetics...</div>
              </div>
            ) : visibleProducts.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 0", backgroundColor: "#ffffff", borderRadius: "12px", border: "1.5px solid #e2e8f0" }}>
                <h3 style={{ fontSize: "18px", fontWeight: "800", color: "#1e293b", marginBottom: "8px" }}>No products found</h3>
                <p style={{ fontSize: "13.5px", color: "#64748b" }}>Try tweaking your search or price filter slider to see more items.</p>
              </div>
            ) : (
              <div className="product-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: "20px" }}>
                {visibleProducts.map((p) => {
                  const v = p.variants?.[0] || { price: p.price, discountPrice: p.discountPrice, name: "Standard" };
                  const isDiscounted = v.discountPrice !== null && v.discountPrice !== undefined && v.discountPrice > 0;
                  const displayPrice = (isDiscounted ? v.discountPrice : v.price) || 0;
                  const primaryImage = p.images?.[0]?.url || p.imageUrl || "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=500&auto=format&fit=crop&q=60";
                  const starRating = p.rating || 4.5;
                  const starFull = Math.floor(starRating);
                  const hasHalf = starRating % 1 !== 0;
                  const discountPercent = isDiscounted && v.price > displayPrice ? Math.round(((v.price - displayPrice) / v.price) * 100) : 25;

                  return (
                    <div key={p.id} className="product-card" style={{ position: "relative", backgroundColor: "#ffffff", borderRadius: "14px", border: "1px solid #e2e8f0", overflow: "hidden", display: "flex", flexDirection: "column", justifyContent: "space-between", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", transition: "all 0.2s ease" }}>
                      
                      {/* Top Left Discount Badge (Matches Image 1) */}
                      {isDiscounted && (
                        <span style={{ position: "absolute", top: "10px", left: "0", backgroundColor: "#e2136e", color: "#ffffff", padding: "4px 10px", borderRadius: "0 12px 12px 0", fontSize: "11px", fontWeight: "900", zIndex: 5, boxShadow: "0 2px 6px rgba(226,19,110,0.3)" }}>
                          {discountPercent}% OFF
                        </span>
                      )}

                      {/* Wishlist Button */}
                      <div className="card-wishlist-btn" onClick={() => toggleWishlist(p.id)} style={{ position: "absolute", top: "10px", right: "10px", zIndex: 5, cursor: "pointer" }}>
                        <svg fill={wishlist.includes(p.id) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="16" height="16">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                        </svg>
                      </div>

                      <Link href={`/product/${p.id}`} className="card-image" style={{ padding: "16px", display: "flex", justifyContent: "center", alignItems: "center", minHeight: "180px" }}>
                        <img 
                          src={primaryImage} 
                          alt={p.name} 
                          loading="lazy"
                          decoding="async"
                          onError={(e) => { e.currentTarget.src = "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=500&auto=format&fit=crop&q=60"; }}
                          style={{ maxHeight: "160px", objectFit: "contain" }}
                        />
                      </Link>

                      <div className="card-body" style={{ padding: "0 14px 12px 14px", textAlign: "center", flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                        <div>
                          <Link href={`/product/${p.id}`} className="card-title" style={{ fontSize: "14px", fontWeight: "700", color: "#0f172a", textDecoration: "none", display: "block", marginBottom: "6px", lineHeight: "1.3" }}>
                            {p.name}
                          </Link>
                          {isDiscounted && <span style={{ display: "inline-block", backgroundColor: "#ffe4e6", color: "#be185d", padding: "2px 10px", borderRadius: "12px", fontSize: "10.5px", fontWeight: "900", marginBottom: "6px" }}>SALE</span>}
                        </div>

                        <div>
                          <div className="card-price-row" style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                            {isDiscounted && <span style={{ textDecoration: "line-through", color: "#94a3b8", fontSize: "13px" }}>৳{v.price}</span>}
                            <span style={{ fontSize: "16px", fontWeight: "900", color: "#e2136e" }}>৳ {displayPrice}</span>
                          </div>

                          <div className="card-rating" style={{ display: "flex", justifyContent: "center", gap: "2px", fontSize: "12px", marginBottom: "4px" }}>
                            {Array.from({ length: 5 }).map((_, i) => (
                              <span key={i} style={{ color: i < starFull ? "#f59e0b" : i === starFull && hasHalf ? "#f59e0b" : "#d1d5db" }}>★</span>
                            ))}
                          </div>
                          <div style={{ fontSize: "12px", fontWeight: "700", color: "#475569" }}>{v.name || "22ml"}</div>
                        </div>
                      </div>

                      {/* Solid Purple ADD TO CART Button (Matches Image 1) */}
                      <button
                        onClick={(e) => handleAddToCart(p, e)}
                        style={{
                          width: "100%",
                          backgroundColor: "#5e0fa8",
                          color: "#ffffff",
                          border: "none",
                          padding: "13px 0",
                          fontWeight: "900",
                          fontSize: "13px",
                          letterSpacing: "1px",
                          cursor: "pointer",
                          textTransform: "uppercase",
                          borderRadius: "0 0 12px 12px",
                          transition: "background 0.2s ease"
                        }}
                      >
                        ADD TO CART
                      </button>
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

export default function ShopPage() {
  return (
    <Suspense fallback={<div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", fontSize: "16px", fontWeight: "700", color: "#e52860" }}>Loading GlowGoodly Shop...</div>}>
      <ShopPageContent />
    </Suspense>
  );
}
