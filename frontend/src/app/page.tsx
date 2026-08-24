"use client";

import React, { useEffect, useState } from "react";
import { fetchWithCache, API_BASE } from "../utils/api";
import { registerFcmToken } from "../utils/fcm";

import Header from "../components/Header";
import PromoBanner from "../components/PromoBanner";
import MobileNavbar from "../components/MobileNavbar";
import Footer from "../components/Footer";
import { useApp } from "../context/AppContext";
import Link from "next/link";

interface Product {
  id: string;
  name: string;
  description: string;
  brand: { name: string };
  category: { name: string };
  campaignName?: string | null;
  images: { url: string; isPrimary: boolean }[];
  variants: { id: string; name: string; price: number; discountPrice: number | null; stock: number; shadeColor: string | null; size?: string | null }[];
}

const initialHeroSlides: any[] = [
  {
    title: "Self Care Week - Mega Discount",
    desc: "Up to 50% OFF on Top International Skincare & Makeup Brands",
    bg: "linear-gradient(135deg, #e63b7a 0%, #ff758c 100%)",
    img: "https://bk.shajgoj.com/storage/2026/07/prime-banner-web.png",
    mobileImg: "https://bk.shajgoj.com/storage/2026/07/prime-banner-web.png",
    tabletImg: "https://bk.shajgoj.com/storage/2026/07/prime-banner-web.png",
    link: "/shop?category=skincare"
  },
  {
    title: "Beauty Bonanza Clearance Sale",
    desc: "Unbeatable Prices on Beauty & Personal Care",
    bg: "linear-gradient(135deg, #821f9b 0%, #d946ef 100%)",
    img: "https://bk.shajgoj.com/storage/2025/05/clearance-sale.png",
    mobileImg: "https://bk.shajgoj.com/storage/2025/05/clearance-sale.png",
    tabletImg: "https://bk.shajgoj.com/storage/2025/05/clearance-sale.png",
    link: "/shop?category=clearance-sale"
  },
  {
    title: "BOGO Special Beauty Offer",
    desc: "Buy 1 Get 1 Free on Selected Top Brands",
    bg: "linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)",
    img: "https://bk.shajgoj.com/storage/2025/05/bogo-9lad.png",
    mobileImg: "https://bk.shajgoj.com/storage/2025/05/bogo-9lad.png",
    tabletImg: "https://bk.shajgoj.com/storage/2025/05/bogo-9lad.png",
    link: "/shop?category=bogo"
  },
  {
    title: "Skincare Steals & Combos",
    desc: "Exclusive Glow & Care Bundles",
    bg: "linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)",
    img: "https://bk.shajgoj.com/storage/2025/05/combo.png",
    mobileImg: "https://bk.shajgoj.com/storage/2025/05/combo.png",
    tabletImg: "https://bk.shajgoj.com/storage/2025/05/combo.png",
    link: "/shop?category=combo"
  }
];

const DEFAULT_BEAUTY_CATEGORIES = [
  { id: "cat-makeup", name: "Makeup", slug: "makeup", image: "https://bk.shajgoj.com/storage/2026/04/makeup.png" },
  { id: "cat-skincare", name: "Skin Care", slug: "skincare", image: "https://bk.shajgoj.com/storage/2026/04/skin-care.png" },
  { id: "cat-haircare", name: "Hair Care", slug: "haircare", image: "https://bk.shajgoj.com/storage/2026/04/hair-care.png" },
  { id: "cat-personal-care", name: "Personal Care", slug: "personal-care", image: "https://bk.shajgoj.com/storage/2026/04/accessories.png" },
  { id: "cat-mom-baby", name: "Mom & Baby", slug: "mom-baby", image: "https://bk.shajgoj.com/storage/2026/04/mom-baby.png" },
  { id: "cat-fragrance", name: "Fragrance", slug: "fragrance", image: "https://bk.shajgoj.com/storage/2026/04/fragrance.png" },
  { id: "cat-undergarments", name: "Undergarments", slug: "undergarments", image: "https://bk.shajgoj.com/storage/2026/04/undergarments.png" },
  { id: "cat-kbeauty", name: "K-Beauty", slug: "k-beauty", image: "https://bk.shajgoj.com/storage/2026/04/k-beauty.png" }
];

export default function Home() {
  const { addToCart, wishlist, toggleWishlist } = useApp();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>(DEFAULT_BEAUTY_CATEGORIES);
  const [brands, setBrands] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [dynamicSlides, setDynamicSlides] = useState<any[]>(initialHeroSlides);
  const [homepageBanners, setHomepageBanners] = useState<any[]>([]);

  const getBannerForPage = (identifier: string, fallbackImg: string, fallbackTitle: string, fallbackLink: string = "#") => {
    const term = (identifier || "").toLowerCase();
    const found = homepageBanners.find((b: any) => 
      (b.title && b.title.toLowerCase().includes(term)) ||
      (b.page && b.page.toLowerCase().includes(term)) ||
      (b.id && b.id.toLowerCase().includes(term))
    );
    const rawImg = found ? found.imageUrl : "";
    const isValidImg = rawImg && rawImg.startsWith("http");
    return {
      img: isValidImg ? rawImg : fallbackImg,
      title: (found && found.title) ? found.title : fallbackTitle,
      link: (found && found.linkUrl) ? found.linkUrl : fallbackLink
    };
  };

  const getCategorySlug = (catName: string) => {
    const name = catName.toLowerCase().trim();
    if (name === "skin") return "skincare";
    if (name === "hair") return "haircare";
    if (name === "personal care") return "personal-care";
    if (name === "mom & baby") return "mom-baby";
    if (name === "undergarments") return "undergarments";
    if (name === "undergarment") return "undergarments";
    return name;
  };

  const getCategoryImage = (catName: string) => {
    const name = (catName || "").toLowerCase().trim();
    if (name.includes("makeup")) return "https://bk.shajgoj.com/storage/2026/04/makeup.png";
    if (name.includes("skin")) return "https://bk.shajgoj.com/storage/2026/04/skin-care.png";
    if (name.includes("hair")) return "https://bk.shajgoj.com/storage/2026/04/hair-care.png";
    if (name.includes("personal") || name.includes("care")) return "https://bk.shajgoj.com/storage/2026/04/accessories.png";
    if (name.includes("mom") || name.includes("baby")) return "https://bk.shajgoj.com/storage/2026/04/mom-baby.png";
    if (name.includes("fragrance") || name.includes("perfume")) return "https://bk.shajgoj.com/storage/2026/04/fragrance.png";
    if (name.includes("undergarment") || name.includes("innerwear")) return "https://bk.shajgoj.com/storage/2026/04/undergarments.png";
    return "https://bk.shajgoj.com/storage/2026/04/k-beauty.png";
  };

  // Filter States
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeBrand, setActiveBrand] = useState<string | null>(null);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sortOption, setSortOption] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeNotification, setActiveNotification] = useState<any>(null);
  const [showNotification, setShowNotification] = useState(false);

  // Slide Banner State
  const [activeSlide, setActiveSlide] = useState(0);
  const [bannersLoaded, setBannersLoaded] = useState(false);

  const activeSlidesList = dynamicSlides.length > 0 ? dynamicSlides : initialHeroSlides;

  // Auto rotate slides
  useEffect(() => {
    if (activeSlidesList.length <= 1) return;
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % activeSlidesList.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [activeSlidesList]);

  // Parse query parameters
  useEffect(() => {
    if (typeof window !== "undefined") {
      document.title = "Home-Glowgoodly";
      const params = new URLSearchParams(window.location.search);
      const search = params.get("search");
      if (search) setSearchQuery(search);

      const catParam = params.get("category");
      if (catParam && categories.length > 0) {
        const found = categories.find((c) => c.name.toLowerCase() === catParam.toLowerCase());
        if (found) {
          setActiveCategory(found.id);
        }
      }

      const brandParam = params.get("brand");
      if (brandParam) setActiveBrand(brandParam);
    }
  }, [categories]);

  // Fetch initial data
  useEffect(() => {
    registerFcmToken();

    const fetchMetadata = async (bypass: boolean = false) => {
      try {
        const [catData, brandData, bannerData, notifRes] = await Promise.all([
          fetchWithCache(`${API_BASE}/categories`, bypass),
          fetchWithCache(`${API_BASE}/brands`, bypass),
          fetchWithCache(`${API_BASE}/banners`, bypass),
          fetchWithCache(`${API_BASE}/notifications/active`, bypass)
        ]);
        setCategories(Array.isArray(catData) && catData.length > 0 ? catData : DEFAULT_BEAUTY_CATEGORIES);
        setBrands(Array.isArray(brandData) ? brandData : []);
        if (bannerData && Array.isArray(bannerData) && bannerData.length > 0) {
          setHomepageBanners(bannerData);
          const homeBanners = bannerData.filter((b: any) => 
            b.isActive !== false &&
            (b.page === "Hero Slides" || 
             b.page === "Hero Slides Carousel" || 
             (b.page && b.page.toLowerCase().includes("hero")) || 
             (b.title && b.title.toLowerCase().includes("hero")))
          );

          if (homeBanners.length > 0) {
            const validSlides = homeBanners
              .filter((b: any) => b.imageUrl && b.imageUrl.startsWith("http"))
              .map((b: any) => ({
                title: b.title,
                desc: "Exclusive Collection at GlowGoodly",
                bg: b.bgColor || "linear-gradient(135deg, #e63b7a 0%, #ff758c 100%)",
                img: b.imageUrl,
                mobileImg: b.mobileImageUrl || b.imageUrl,
                tabletImg: b.tabletImageUrl || b.imageUrl,
                link: b.linkUrl || "/shop"
              }));
            if (validSlides.length > 0) {
              setDynamicSlides(validSlides);
            }
          }
        }

        if (notifRes && notifRes.isActive) {
          const closedId = localStorage.getItem("glowgoodly_last_notification_closed");
          if (closedId !== notifRes.id) {
            setActiveNotification(notifRes);
            setShowNotification(true);
          }
        }
      } catch (e) {
        console.error("Error loading categories/brands/notifications", e);
      } finally {
        setBannersLoaded(true);
      }
    };
    fetchMetadata();

    const handleSyncEvent = () => fetchMetadata(true);
    window.addEventListener("glowgoodly_data_updated", handleSyncEvent);

    return () => {
      window.removeEventListener("glowgoodly_data_updated", handleSyncEvent);
    };
  }, []);

  // Fetch filtered products
  useEffect(() => {
    const fetchProducts = async (bypass: boolean = false) => {
      try {
        let url = `${API_BASE}/products?`;
        if (activeCategory) url += `category=${activeCategory}&`;
        if (activeBrand) url += `brand=${activeBrand}&`;
        if (searchQuery) url += `search=${encodeURIComponent(searchQuery)}&`;
        if (minPrice) url += `minPrice=${minPrice}&`;
        if (maxPrice) url += `maxPrice=${maxPrice}&`;
        if (sortOption) url += `sort=${sortOption}&`;

        const data = await fetchWithCache(url, bypass);
        setProducts(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error("Error loading products", e);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();

    const handleSyncEvent = () => fetchProducts(true);
    window.addEventListener("glowgoodly_data_updated", handleSyncEvent);

    return () => {
      window.removeEventListener("glowgoodly_data_updated", handleSyncEvent);
    };
  }, [activeCategory, activeBrand, searchQuery, minPrice, maxPrice, sortOption]);


  const handleAddToCart = (product: Product) => {
    const primaryVariant = product.variants[0];
    if (!primaryVariant) return;

    const primaryImage = product.images.find((img) => img.isPrimary)?.url || product.images[0]?.url || "";

    addToCart({
      id: primaryVariant.id,
      productId: product.id,
      name: product.name,
      variantName: primaryVariant.name,
      image: primaryImage,
      price: primaryVariant.discountPrice || primaryVariant.price,
      stock: primaryVariant.stock,
    });
  };

  const handleResetFilters = () => {
    setActiveCategory(null);
    setActiveBrand(null);
    setMinPrice("");
    setMaxPrice("");
    setSortOption("");
    setSearchQuery("");
    window.history.pushState({}, "", "/");
  };

  return (
    <>
      <Header />
      <PromoBanner />

      {/* Full-width Dynamic Promotional Banner Slider - Exact Shajgoj Layout */}
      {(() => {
        const safeSlideIdx = activeSlide % (activeSlidesList.length || 1);
        const currentSlide = activeSlidesList[safeSlideIdx] || activeSlidesList[0];
        if (!currentSlide || !currentSlide.img) return null;
        return (
        <section
          style={{
            width: "100%",
            position: "relative",
            overflow: "hidden",
            backgroundColor: "#ffffff",
          }}
        >
        <div style={{ position: "relative", width: "100%", display: "block" }}>
          {/* Left Navigation Arrow */}
          <button
            onClick={() => setActiveSlide((prev) => (prev === 0 ? activeSlidesList.length - 1 : prev - 1))}
            style={{
              position: "absolute",
              left: "15px",
              top: "50%",
              transform: "translateY(-50%)",
              backgroundColor: "rgba(255, 255, 255, 0.75)",
              color: "#000000",
              border: "none",
              borderRadius: "50%",
              width: "36px",
              height: "36px",
              display: "flex",
              alignItems: "center",
              justify-content: "center",
              cursor: "pointer",
              zIndex: 10,
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
              fontSize: "18px",
              fontWeight: "bold",
              transition: "all 0.2s ease"
            }}
            aria-label="Previous Slide"
          >
            ‹
          </button>

          {/* Right Navigation Arrow */}
          <button
            onClick={() => setActiveSlide((prev) => (prev + 1) % activeSlidesList.length)}
            style={{
              position: "absolute",
              right: "15px",
              top: "50%",
              transform: "translateY(-50%)",
              backgroundColor: "rgba(255, 255, 255, 0.75)",
              color: "#000000",
              border: "none",
              borderRadius: "50%",
              width: "36px",
              height: "36px",
              display: "flex",
              alignItems: "center",
              justify-content: "center",
              cursor: "pointer",
              zIndex: 10,
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
              fontSize: "18px",
              fontWeight: "bold",
              transition: "all 0.2s ease"
            }}
            aria-label="Next Slide"
          >
            ›
          </button>

          {currentSlide?.link?.startsWith("http") ? (
            <a
              href={currentSlide?.link}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: "block", width: "100%", cursor: "pointer" }}
            >
              <picture style={{ display: "block", width: "100%" }}>
                {currentSlide?.mobileImg && (
                  <source media="(max-width: 640px)" srcSet={currentSlide?.mobileImg} />
                )}
                {currentSlide?.tabletImg && (
                  <source media="(max-width: 1024px)" srcSet={currentSlide?.tabletImg} />
                )}
                <img
                  src={currentSlide?.img}
                  alt={currentSlide?.title || "Hero Slider"}
                  style={{
                    width: "100%",
                    height: "auto",
                    display: "block",
                  }}
                />
              </picture>
            </a>
          ) : (
            <Link
              href={currentSlide?.link || "/shop"}
              style={{ display: "block", width: "100%", cursor: "pointer" }}
            >
              <picture style={{ display: "block", width: "100%" }}>
                {currentSlide?.mobileImg && (
                  <source media="(max-width: 640px)" srcSet={currentSlide?.mobileImg} />
                )}
                {currentSlide?.tabletImg && (
                  <source media="(max-width: 1024px)" srcSet={currentSlide?.tabletImg} />
                )}
                <img
                  src={currentSlide?.img}
                  alt={currentSlide?.title || "Hero Slider"}
                  style={{
                    width: "100%",
                    height: "auto",
                    display: "block",
                  }}
                />
              </picture>
            </Link>
          )}

          {/* Shajgoj Dots Indicator */}
          <div
            style={{
              position: "absolute",
              bottom: "12px",
              left: "50%",
              transform: "translateX(-50%)",
              display: "flex",
              gap: "8px",
              zIndex: 3,
            }}
          >
            {activeSlidesList.map((_, idx) => (
              <div
                key={idx}
                onClick={() => setActiveSlide(idx)}
                style={{
                  width: safeSlideIdx === idx ? "24px" : "8px",
                  height: "8px",
                  borderRadius: "4px",
                  backgroundColor: safeSlideIdx === idx ? "#e2136e" : "rgba(255, 255, 255, 0.7)",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                }}
              />
            ))}
          </div>
        </div>
      </section>
        );
      })()}

      <main className="container" style={{ paddingBottom: "40px", paddingTop: "20px" }}>

        {/* Wide horizontal promo banner ad */}
        <Link href={getBannerForPage("Homepage Wide Banner", "", "").link} style={{ margin: "10px 0 35px 0", borderRadius: "8px", overflow: "hidden", cursor: "pointer", display: "block" }} className="promo-card-hover">
          <img
            src={getBannerForPage("Homepage Wide Banner", "https://bk.shajgoj.com/storage/2026/07/prime-banner-web.png", "").img}
            alt={getBannerForPage("Homepage Wide Banner", "", "Beauty Must Haves Exclusive Savings").title}
            style={{
              width: "100%",
              height: "auto",
              display: "block",
            }}
          />
        </Link>

        {/* MAKEUP Section */}
        <section style={{ margin: "30px 0", backgroundColor: "#ffffff", padding: "10px 0" }}>
          <div style={{ position: "relative", marginBottom: "20px" }}>
            <h2 style={{ fontSize: "14px", fontWeight: "800", textAlign: "center", textTransform: "uppercase", letterSpacing: "1.5px", color: "#000", margin: 0 }}>
              MAKEUP
            </h2>
            <Link href="/shop?category=Makeup" style={{ position: "absolute", right: "0", top: "50%", transform: "translateY(-50%)", backgroundColor: "#e2136e", color: "#ffffff", padding: "6px 14px", borderRadius: "20px", fontSize: "11.5px", fontWeight: "800", textDecoration: "none", boxShadow: "0 2px 8px rgba(226,19,110,0.25)" }}>
              SEE ALL ›
            </Link>
          </div>

          <div className="homepage-product-grid mobile-limit-2">
            {(products
              .filter(p => p.category?.name?.toLowerCase().includes("makeup") || p.name?.toLowerCase().includes("lipstick") || p.name?.toLowerCase().includes("mascara") || p.name?.toLowerCase().includes("powder") || p.name?.toLowerCase().includes("foundation") || p.name?.toLowerCase().includes("primer"))
              .slice(0, 4)
              .concat(
                products.slice(0, Math.max(0, 4 - products.filter(p => p.category?.name?.toLowerCase().includes("makeup") || p.name?.toLowerCase().includes("lipstick") || p.name?.toLowerCase().includes("mascara") || p.name?.toLowerCase().includes("powder") || p.name?.toLowerCase().includes("foundation") || p.name?.toLowerCase().includes("primer")).length))
              )
              .slice(0, 4)
            ).map((p) => {
              const primaryImage = p.images?.find((img) => img.isPrimary)?.url || p.images?.[0]?.url || "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=500&auto=format&fit=crop&q=60";
              const primaryVariant = p.variants?.[0];
              const oldPrice = primaryVariant?.price || 1200;
              const currentPrice = primaryVariant?.discountPrice || primaryVariant?.price || 899;
              const hasDiscount = primaryVariant?.discountPrice && primaryVariant.discountPrice < primaryVariant.price;
              const discountPercent = hasDiscount ? Math.round(((oldPrice - currentPrice) / oldPrice) * 100) : 25;
              const sizeLabel = (primaryVariant as any)?.size || primaryVariant?.name || "Standard";

              return (
                <div key={p.id} className="product-card" style={{ backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", overflow: "hidden", display: "flex", flexDirection: "column", justifyContent: "space-between", position: "relative" }}>
                  <div style={{ backgroundColor: "#e2136e", color: "#fff", fontSize: "11px", fontWeight: "800", padding: "4px 10px", borderRadius: "0 0 10px 0", position: "absolute", top: 0, left: 0, zIndex: 5 }}>
                    {discountPercent}% OFF
                  </div>

                  <div className={`wishlist-btn ${wishlist.includes(p.id) ? "active" : ""}`} onClick={() => toggleWishlist(p.id)}>
                    <svg fill={wishlist.includes(p.id) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="18" height="18">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                    </svg>
                  </div>
                  <Link href={`/product/${p.id}`} className="card-image" style={{ height: "230px", backgroundColor: "#ffffff", padding: "16px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <img src={primaryImage} alt={p.name} style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }} />
                  </Link>
                  <div className="card-body" style={{ padding: "12px 14px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", flex: 1, justifyContent: "space-between" }}>
                    <Link href={`/product/${p.id}`} className="card-title" style={{ fontSize: "14px", fontWeight: "600", color: "#1e293b", textDecoration: "none", lineHeight: "1.3", marginBottom: "8px", height: "38px", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                      {p.name}
                    </Link>
                    <span style={{ backgroundColor: "#e2136e", color: "#ffffff", fontSize: "10px", fontWeight: "900", padding: "3px 12px", borderRadius: "12px", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>
                      MAKEUP
                    </span>
                    <div className="card-price-row" style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                      {hasDiscount && (
                        <span className="old-price" style={{ fontSize: "13px", color: "#94a3b8", textDecoration: "line-through", fontWeight: "600" }}>
                          ৳{oldPrice.toFixed(2)}
                        </span>
                      )}
                      <span className="price" style={{ fontSize: "16px", fontWeight: "800", color: "#e2136e" }}>
                        ৳{currentPrice.toFixed(2)}
                      </span>
                    </div>
                    <div style={{ color: "#f59e0b", fontSize: "13px", display: "flex", gap: "2px", marginBottom: "4px" }}>
                      ★ ★ ★ ★ <span style={{ color: "#cbd5e1" }}>★</span>
                    </div>
                    <div style={{ fontSize: "13px", fontWeight: "700", color: "#1e293b", marginBottom: "10px" }}>
                      {sizeLabel}
                    </div>
                  </div>
                  <button className="add-to-cart-btn" onClick={() => handleAddToCart(p)} style={{ backgroundColor: "#581c87", color: "#ffffff", border: "none", padding: "12px", fontWeight: "800", fontSize: "13px", letterSpacing: "0.5px", cursor: "pointer", width: "100%", borderRadius: "0 0 12px 12px" }}>
                    ADD TO CART
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        {/* DEALS YOU CANNOT MISS Section */}
        <section style={{ margin: "30px 0 40px 0" }}>
          <h2 style={{ fontSize: "14px", fontWeight: "800", textAlign: "center", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: "20px", color: "#000" }}>
            DEALS YOU CANNOT MISS
          </h2>
          <div className="dycm-grid">
            {/* Card 1 */}
            <Link href={getBannerForPage("Deal Card 1", "", "", "/shop?category=clearance-sale").link} style={{ display: "block", overflow: "hidden", borderRadius: "8px" }} className="promo-card-hover">
              <img src={getBannerForPage("Deal Card 1", "https://bk.shajgoj.com/storage/2025/05/clearance-sale.png", "").img} alt="Deal Card 1" style={{ width: "100%", height: "auto", aspectRatio: "1/1", objectFit: "cover", display: "block" }} />
            </Link>
            {/* Card 2 */}
            <Link href={getBannerForPage("Deal Card 2", "", "", "/shop?category=skincare").link} style={{ display: "block", overflow: "hidden", borderRadius: "8px" }} className="promo-card-hover">
              <img src={getBannerForPage("Deal Card 2", "https://bk.shajgoj.com/storage/2026/04/skin-care.png", "").img} alt="Deal Card 2" style={{ width: "100%", height: "auto", aspectRatio: "1/1", objectFit: "cover", display: "block" }} />
            </Link>
            {/* Card 3 */}
            <Link href={getBannerForPage("Deal Card 3", "", "", "/shop?category=combo").link} style={{ display: "block", overflow: "hidden", borderRadius: "8px" }} className="promo-card-hover">
              <img src={getBannerForPage("Deal Card 3", "https://bk.shajgoj.com/storage/2025/05/combo.png", "").img} alt="Deal Card 3" style={{ width: "100%", height: "auto", aspectRatio: "1/1", objectFit: "cover", display: "block" }} />
            </Link>
            {/* Card 4 */}
            <Link href={getBannerForPage("Deal Card 4", "", "", "/shop?category=makeup").link} style={{ display: "block", overflow: "hidden", borderRadius: "8px" }} className="promo-card-hover">
              <img src={getBannerForPage("Deal Card 4", "https://bk.shajgoj.com/storage/2026/04/makeup.png", "").img} alt="Deal Card 4" style={{ width: "100%", height: "auto", aspectRatio: "1/1", objectFit: "cover", display: "block" }} />
            </Link>
          </div>
        </section>

        {/* SKIN CARE Section */}
        <section style={{ margin: "40px 0", backgroundColor: "#ffffff", padding: "10px 0" }}>
          <div style={{ position: "relative", marginBottom: "20px" }}>
            <h2 style={{ fontSize: "14px", fontWeight: "800", textAlign: "center", textTransform: "uppercase", letterSpacing: "1.5px", color: "#000", margin: 0 }}>
              SKIN CARE
            </h2>
            <Link href="/shop?category=Skincare" style={{ position: "absolute", right: "0", top: "50%", transform: "translateY(-50%)", backgroundColor: "#e2136e", color: "#ffffff", padding: "6px 14px", borderRadius: "20px", fontSize: "11.5px", fontWeight: "800", textDecoration: "none", boxShadow: "0 2px 8px rgba(226,19,110,0.25)" }}>
              SEE ALL ›
            </Link>
          </div>

          <div className="homepage-product-grid mobile-limit-2">
            {(products
              .filter(p => p.category?.name?.toLowerCase().includes("skin") || p.name?.toLowerCase().includes("serum") || p.name?.toLowerCase().includes("cream") || p.name?.toLowerCase().includes("sunscreen") || p.name?.toLowerCase().includes("moisturizer") || p.name?.toLowerCase().includes("toner") || p.name?.toLowerCase().includes("face wash"))
              .slice(0, 4)
              .concat(
                products.slice(1, Math.max(1, 1 + 4 - products.filter(p => p.category?.name?.toLowerCase().includes("skin") || p.name?.toLowerCase().includes("serum") || p.name?.toLowerCase().includes("cream") || p.name?.toLowerCase().includes("sunscreen") || p.name?.toLowerCase().includes("moisturizer") || p.name?.toLowerCase().includes("toner") || p.name?.toLowerCase().includes("face wash")).length))
              )
              .slice(0, 4)
            ).map((p) => {
              const primaryImage = p.images?.find((img) => img.isPrimary)?.url || p.images?.[0]?.url || "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=500&auto=format&fit=crop&q=60";
              const primaryVariant = p.variants?.[0];
              const oldPrice = primaryVariant?.price || 1500;
              const currentPrice = primaryVariant?.discountPrice || primaryVariant?.price || 1199;
              const hasDiscount = primaryVariant?.discountPrice && primaryVariant.discountPrice < primaryVariant.price;
              const discountPercent = hasDiscount ? Math.round(((oldPrice - currentPrice) / oldPrice) * 100) : 20;
              const sizeLabel = (primaryVariant as any)?.size || primaryVariant?.name || "50ml";

              return (
                <div key={p.id} className="product-card" style={{ backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", overflow: "hidden", display: "flex", flexDirection: "column", justifyContent: "space-between", position: "relative" }}>
                  <div style={{ backgroundColor: "#e2136e", color: "#fff", fontSize: "11px", fontWeight: "800", padding: "4px 10px", borderRadius: "0 0 10px 0", position: "absolute", top: 0, left: 0, zIndex: 5 }}>
                    {discountPercent}% OFF
                  </div>

                  <div className={`wishlist-btn ${wishlist.includes(p.id) ? "active" : ""}`} onClick={() => toggleWishlist(p.id)}>
                    <svg fill={wishlist.includes(p.id) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="18" height="18">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                    </svg>
                  </div>
                  <Link href={`/product/${p.id}`} className="card-image" style={{ height: "230px", backgroundColor: "#ffffff", padding: "16px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <img src={primaryImage} alt={p.name} style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }} />
                  </Link>
                  <div className="card-body" style={{ padding: "12px 14px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", flex: 1, justifyContent: "space-between" }}>
                    <Link href={`/product/${p.id}`} className="card-title" style={{ fontSize: "14px", fontWeight: "600", color: "#1e293b", textDecoration: "none", lineHeight: "1.3", marginBottom: "8px", height: "38px", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                      {p.name}
                    </Link>
                    <span style={{ backgroundColor: "#e2136e", color: "#ffffff", fontSize: "10px", fontWeight: "900", padding: "3px 12px", borderRadius: "12px", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>
                      SKIN CARE
                    </span>
                    <div className="card-price-row" style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                      {hasDiscount && (
                        <span className="old-price" style={{ fontSize: "13px", color: "#94a3b8", textDecoration: "line-through", fontWeight: "600" }}>
                          ৳{oldPrice.toFixed(2)}
                        </span>
                      )}
                      <span className="price" style={{ fontSize: "16px", fontWeight: "800", color: "#e2136e" }}>
                        ৳{currentPrice.toFixed(2)}
                      </span>
                    </div>
                    <div style={{ color: "#f59e0b", fontSize: "13px", display: "flex", gap: "2px", marginBottom: "4px" }}>
                      ★ ★ ★ ★ ★
                    </div>
                    <div style={{ fontSize: "13px", fontWeight: "700", color: "#1e293b", marginBottom: "10px" }}>
                      {sizeLabel}
                    </div>
                  </div>
                  <button className="add-to-cart-btn" onClick={() => handleAddToCart(p)} style={{ backgroundColor: "#581c87", color: "#ffffff", border: "none", padding: "12px", fontWeight: "800", fontSize: "13px", letterSpacing: "0.5px", cursor: "pointer", width: "100%", borderRadius: "0 0 12px 12px" }}>
                    ADD TO CART
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        {/* TOP BRANDS & OFFERS Section */}
        <section style={{ margin: "30px 0" }}>
          <h2 style={{ fontSize: "14px", fontWeight: "800", textAlign: "center", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: "16px", color: "#000" }}>
            TOP BRANDS & OFFERS
          </h2>
          <div className="top-brands-grid">
            {/* Banner 1 */}
            <Link href={getBannerForPage("Brand Offer 1", "", "", "/shop?brand=the-ordinary").link} style={{ display: "block", overflow: "hidden", borderRadius: "10px", transition: "transform 0.2s ease" }} className="promo-card-hover">
              <img src={getBannerForPage("Brand Offer 1", "https://bk.shajgoj.com/storage/2026/04/skin-care.png", "").img} alt="Brand Offer 1" style={{ width: "100%", height: "auto", display: "block", borderRadius: "10px" }} />
            </Link>
            {/* Banner 2 */}
            <Link href={getBannerForPage("Brand Offer 2", "", "", "/shop?brand=skin-cafe").link} style={{ display: "block", overflow: "hidden", borderRadius: "10px", transition: "transform 0.2s ease" }} className="promo-card-hover">
              <img src={getBannerForPage("Brand Offer 2", "https://bk.shajgoj.com/storage/2025/05/combo.png", "").img} alt="Brand Offer 2" style={{ width: "100%", height: "auto", display: "block", borderRadius: "10px" }} />
            </Link>
            {/* Banner 5 */}
            <Link href={getBannerForPage("Brand Offer 5", "", "", "/shop?brand=the-ordinary").link} style={{ display: "block", overflow: "hidden", borderRadius: "10px", transition: "transform 0.2s ease" }} className="promo-card-hover">
              <img src={getBannerForPage("Brand Offer 5", "https://bk.shajgoj.com/storage/2026/04/accessories.png", "").img} alt="Brand Offer 5" style={{ width: "100%", height: "auto", display: "block", borderRadius: "10px" }} />
            </Link>
            {/* Banner 6 */}
            <Link href={getBannerForPage("Brand Offer 6", "", "", "/shop?brand=skin-cafe").link} style={{ display: "block", overflow: "hidden", borderRadius: "10px", transition: "transform 0.2s ease" }} className="promo-card-hover">
              <img src={getBannerForPage("Brand Offer 6", "https://bk.shajgoj.com/storage/2025/05/bogo-9lad.png", "").img} alt="Brand Offer 6" style={{ width: "100%", height: "auto", display: "block", borderRadius: "10px" }} />
            </Link>
          </div>
        </section>

        {/* BOGO Section */}
        <section style={{ margin: "40px 0", backgroundColor: "#ffffff", padding: "10px 0" }}>
          <div style={{ position: "relative", marginBottom: "20px" }}>
            <h2 style={{ fontSize: "14px", fontWeight: "800", textAlign: "center", textTransform: "uppercase", letterSpacing: "1.5px", color: "#000", margin: 0 }}>
              BOGO
            </h2>
            <Link href="/shop?category=BOGO" style={{ position: "absolute", right: "0", top: "50%", transform: "translateY(-50%)", backgroundColor: "#e2136e", color: "#ffffff", padding: "6px 14px", borderRadius: "20px", fontSize: "11.5px", fontWeight: "800", textDecoration: "none", boxShadow: "0 2px 8px rgba(226,19,110,0.25)" }}>
              SEE ALL ›
            </Link>
          </div>

          <div className="homepage-product-grid mobile-limit-2">
            {(products
              .filter(p => p.category?.name?.toLowerCase().includes("bogo") || p.name?.toLowerCase().includes("bogo") || p.name?.toLowerCase().includes("buy 1") || p.campaignName === "BOGO")
              .slice(0, 4)
              .concat(
                products.slice(1, Math.max(1, 1 + 4 - products.filter(p => p.category?.name?.toLowerCase().includes("bogo") || p.name?.toLowerCase().includes("bogo") || p.name?.toLowerCase().includes("buy 1") || p.campaignName === "BOGO").length))
              )
              .slice(0, 4)
            ).map((p) => {
              const primaryImage = p.images?.find((img) => img.isPrimary)?.url || p.images?.[0]?.url || "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=500&auto=format&fit=crop&q=60";
              const primaryVariant = p.variants?.[0];
              const oldPrice = primaryVariant?.price || 1400;
              const currentPrice = primaryVariant?.discountPrice || primaryVariant?.price || 999;
              const hasDiscount = primaryVariant?.discountPrice && primaryVariant.discountPrice < primaryVariant.price;
              const discountPercent = hasDiscount ? Math.round(((oldPrice - currentPrice) / oldPrice) * 100) : 30;
              const sizeLabel = primaryVariant?.size || primaryVariant?.name || "1+1 Free";

              return (
                <div key={p.id} className="product-card" style={{ backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", overflow: "hidden", display: "flex", flexDirection: "column", justifyContent: "space-between", position: "relative" }}>
                  <div style={{ backgroundColor: "#e2136e", color: "#fff", fontSize: "11px", fontWeight: "800", padding: "4px 10px", borderRadius: "0 0 10px 0", position: "absolute", top: 0, left: 0, zIndex: 5 }}>
                    BOGO 1+1
                  </div>

                  <div className={`wishlist-btn ${wishlist.includes(p.id) ? "active" : ""}`} onClick={() => toggleWishlist(p.id)}>
                    <svg fill={wishlist.includes(p.id) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="18" height="18">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                    </svg>
                  </div>
                  <Link href={`/product/${p.id}`} className="card-image" style={{ height: "230px", backgroundColor: "#ffffff", padding: "16px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <img src={primaryImage} alt={p.name} style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }} />
                  </Link>
                  <div className="card-body" style={{ padding: "12px 14px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", flex: 1, justifyContent: "space-between" }}>
                    <Link href={`/product/${p.id}`} className="card-title" style={{ fontSize: "14px", fontWeight: "600", color: "#1e293b", textDecoration: "none", lineHeight: "1.3", marginBottom: "8px", height: "38px", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                      {p.name}
                    </Link>
                    <span style={{ backgroundColor: "#e2136e", color: "#ffffff", fontSize: "10px", fontWeight: "900", padding: "3px 12px", borderRadius: "12px", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>
                      BOGO OFFER
                    </span>
                    <div className="card-price-row" style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                      {hasDiscount && (
                        <span className="old-price" style={{ fontSize: "13px", color: "#94a3b8", textDecoration: "line-through", fontWeight: "600" }}>
                          ৳{oldPrice.toFixed(2)}
                        </span>
                      )}
                      <span className="price" style={{ fontSize: "16px", fontWeight: "800", color: "#e2136e" }}>
                        ৳{currentPrice.toFixed(2)}
                      </span>
                    </div>
                    <div style={{ color: "#f59e0b", fontSize: "13px", display: "flex", gap: "2px", marginBottom: "4px" }}>
                      ★ ★ ★ ★ ★
                    </div>
                    <div style={{ fontSize: "13px", fontWeight: "700", color: "#1e293b", marginBottom: "10px" }}>
                      {sizeLabel}
                    </div>
                  </div>
                  <button className="add-to-cart-btn" onClick={() => handleAddToCart(p)} style={{ backgroundColor: "#581c87", color: "#ffffff", border: "none", padding: "12px", fontWeight: "800", fontSize: "13px", letterSpacing: "0.5px", cursor: "pointer", width: "100%", borderRadius: "0 0 12px 12px" }}>
                    ADD TO CART
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        {/* LIMITED TIME OFFERS Section */}
        <section style={{ margin: "40px 0" }}>
          <h2 style={{ fontSize: "14px", fontWeight: "800", textAlign: "center", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: "20px", color: "#000" }}>
            LIMITED TIME OFFERS
          </h2>
          <div className="limited-offers-grid">
            {/* Card 1: BOGO */}
            <Link href={getBannerForPage("BOGO", "", "", "/shop?campaign=BOGO").link} style={{ display: "block", overflow: "hidden", borderRadius: "8px" }} className="promo-card-hover">
              <img src={getBannerForPage("BOGO", "https://bk.shajgoj.com/storage/2025/05/bogo-9lad.png", "").img} alt="BOGO Offer" style={{ width: "100%", height: "auto", aspectRatio: "1/1", objectFit: "cover", display: "block" }} />
            </Link>
            {/* Card 2: COMBO */}
            <Link href={getBannerForPage("COMBO", "", "", "/shop?campaign=COMBO").link} style={{ display: "block", overflow: "hidden", borderRadius: "8px" }} className="promo-card-hover">
              <img src={getBannerForPage("COMBO", "https://bk.shajgoj.com/storage/2025/05/combo.png", "").img} alt="COMBO Offer" style={{ width: "100%", height: "auto", aspectRatio: "1/1", objectFit: "cover", display: "block" }} />
            </Link>
            {/* Card 3: OFFERS */}
            <Link href={getBannerForPage("OFFERS", "", "", "/shop?campaign=EXCLUSIVE").link} style={{ display: "block", overflow: "hidden", borderRadius: "8px" }} className="promo-card-hover">
              <img src={getBannerForPage("OFFERS", "https://bk.shajgoj.com/storage/2025/05/offers.png", "").img} alt="OFFERS" style={{ width: "100%", height: "auto", aspectRatio: "1/1", objectFit: "cover", display: "block" }} />
            </Link>
            {/* Card 4: Clearance SALE */}
            <Link href={getBannerForPage("Clearance SALE", "", "", "/shop?campaign=CLEARANCE").link} style={{ display: "block", overflow: "hidden", borderRadius: "8px" }} className="promo-card-hover">
              <img src={getBannerForPage("Clearance SALE", "https://bk.shajgoj.com/storage/2025/05/clearance-sale.png", "").img} alt="Clearance SALE Offer" style={{ width: "100%", height: "auto", aspectRatio: "1/1", objectFit: "cover", display: "block" }} />
            </Link>
          </div>
        </section>

        {/* PERFECT MATCH WITH COMBO Section */}
        <section style={{ margin: "40px 0", backgroundColor: "#ffffff", padding: "10px 0" }}>
          <div style={{ position: "relative", marginBottom: "20px" }}>
            <h2 style={{ fontSize: "14px", fontWeight: "800", textAlign: "center", textTransform: "uppercase", letterSpacing: "1.5px", color: "#000", margin: 0 }}>
              PERFECT MATCH WITH COMBO
            </h2>
            <Link href="/shop?category=Combo" style={{ position: "absolute", right: "0", top: "50%", transform: "translateY(-50%)", backgroundColor: "#e2136e", color: "#ffffff", padding: "6px 14px", borderRadius: "20px", fontSize: "11.5px", fontWeight: "800", textDecoration: "none", boxShadow: "0 2px 8px rgba(226,19,110,0.25)" }}>
              SEE ALL ›
            </Link>
          </div>

          <div className="homepage-product-grid mobile-limit-2">
            {(products
              .filter(p => p.category?.name?.toLowerCase().includes("combo") || p.name?.toLowerCase().includes("combo") || p.campaignName === "COMBO")
              .sort((a, b) => {
                const discA = (a.variants?.[0]?.price || 0) - (a.variants?.[0]?.discountPrice || a.variants?.[0]?.price || 0);
                const discB = (b.variants?.[0]?.price || 0) - (b.variants?.[0]?.discountPrice || b.variants?.[0]?.price || 0);
                return discB - discA;
              })
              .slice(0, 4)
              .concat(
                products.slice(0, Math.max(0, 4 - products.filter(p => p.category?.name?.toLowerCase().includes("combo") || p.name?.toLowerCase().includes("combo") || p.campaignName === "COMBO").length))
              )
              .slice(0, 4)
            ).map((p) => {
              const primaryImage = p.images?.find((img) => img.isPrimary)?.url || p.images?.[0]?.url || "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=500&auto=format&fit=crop&q=60";
              const primaryVariant = p.variants?.[0];
              const oldPrice = primaryVariant?.price || 1200;
              const currentPrice = primaryVariant?.discountPrice || primaryVariant?.price || 899;
              const hasDiscount = primaryVariant?.discountPrice && primaryVariant.discountPrice < primaryVariant.price;
              const discountPercent = hasDiscount ? Math.round(((oldPrice - currentPrice) / oldPrice) * 100) : 25;
              const sizeLabel = primaryVariant?.size || primaryVariant?.name || "22ml";

              return (
                <div key={p.id} className="product-card" style={{ backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", overflow: "hidden", display: "flex", flexDirection: "column", justifyContent: "space-between", position: "relative" }}>
                  {/* Top Left Discount Tag */}
                  <div style={{ backgroundColor: "#e2136e", color: "#fff", fontSize: "11px", fontWeight: "800", padding: "4px 10px", borderRadius: "0 0 10px 0", position: "absolute", top: 0, left: 0, zIndex: 5 }}>
                    {discountPercent}% OFF
                  </div>

                  <div className={`wishlist-btn ${wishlist.includes(p.id) ? "active" : ""}`} onClick={() => toggleWishlist(p.id)}>
                    <svg fill={wishlist.includes(p.id) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="18" height="18">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                    </svg>
                  </div>
                  <Link href={`/product/${p.id}`} className="card-image" style={{ height: "230px", backgroundColor: "#ffffff", padding: "16px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <img src={primaryImage} alt={p.name} style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }} />
                  </Link>
                  <div className="card-body" style={{ padding: "12px 14px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", flex: 1, justifyContent: "space-between" }}>
                    <Link href={`/product/${p.id}`} className="card-title" style={{ fontSize: "14px", fontWeight: "600", color: "#1e293b", textDecoration: "none", lineHeight: "1.3", marginBottom: "8px", height: "38px", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                      {p.name}
                    </Link>
                    <span style={{ backgroundColor: "#e2136e", color: "#ffffff", fontSize: "10px", fontWeight: "900", padding: "3px 12px", borderRadius: "12px", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>
                      SALE
                    </span>
                    <div className="card-price-row" style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                      {hasDiscount && (
                        <span className="old-price" style={{ fontSize: "13px", color: "#94a3b8", textDecoration: "line-through", fontWeight: "600" }}>
                          ৳{oldPrice.toFixed(2)}
                        </span>
                      )}
                      <span className="price" style={{ fontSize: "16px", fontWeight: "800", color: "#e2136e" }}>
                        ৳{currentPrice.toFixed(2)}
                      </span>
                    </div>
                    <div style={{ color: "#f59e0b", fontSize: "13px", display: "flex", gap: "2px", marginBottom: "4px" }}>
                      ★ ★ ★ ★ <span style={{ color: "#cbd5e1" }}>★</span>
                    </div>
                    <div style={{ fontSize: "13px", fontWeight: "700", color: "#1e293b", marginBottom: "10px" }}>
                      {sizeLabel}
                    </div>
                  </div>
                  <button className="add-to-cart-btn" onClick={() => handleAddToCart(p)} style={{ backgroundColor: "#581c87", color: "#ffffff", border: "none", padding: "12px", fontWeight: "800", fontSize: "13px", letterSpacing: "0.5px", cursor: "pointer", width: "100%", borderRadius: "0 0 12px 12px" }}>
                    ADD TO CART
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        {/* SHOP BEAUTY PRODUCTS BY CATEGORY Section */}
        <section style={{ margin: "40px 0" }}>
          <h2 style={{ fontSize: "14px", fontWeight: "800", textAlign: "center", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: "20px", color: "#000" }}>
            SHOP BEAUTY PRODUCTS BY CATEGORY
          </h2>
          <div className="categories-grid">
            {[
              { name: "Makeup", defaultImg: "https://bk.shajgoj.com/storage/2026/04/makeup.png", link: "/shop?category=makeup" },
              { name: "Skin", defaultImg: "https://bk.shajgoj.com/storage/2026/04/skin-care.png", link: "/shop?category=skincare" },
              { name: "Hair", defaultImg: "https://bk.shajgoj.com/storage/2026/04/hair-care.png", link: "/shop?category=haircare" },
              { name: "Personal Care", defaultImg: "https://bk.shajgoj.com/storage/2026/04/accessories.png", link: "/shop?category=personal-care" },
              { name: "Mom & Baby", defaultImg: "https://bk.shajgoj.com/storage/2026/04/mom-baby.png", link: "/shop?category=mom-baby" },
              { name: "Fragrance", defaultImg: "https://bk.shajgoj.com/storage/2026/04/fragrance.png", link: "/shop?category=fragrance" },
              { name: "Undergarments", defaultImg: "https://bk.shajgoj.com/storage/2026/04/undergarments.png", link: "/shop?category=undergarments" },
              { name: "Combo", defaultImg: "https://bk.shajgoj.com/storage/2026/04/k-beauty.png", link: "/shop?category=combo" }
            ].map((cat: any) => {
              const bannerInfo = getBannerForPage(`Category: ${cat.name}`, cat.defaultImg, cat.name, cat.link);
              return (
                <Link 
                  key={cat.name} 
                  href={bannerInfo.link} 
                  style={{ display: "block", borderRadius: "8px", overflow: "hidden", cursor: "pointer", textDecoration: "none" }} 
                  className="promo-card-hover"
                >
                  <img 
                    src={bannerInfo.img} 
                    alt={cat.name} 
                    style={{ width: "100%", height: "auto", aspectRatio: "1 / 1", objectFit: "cover", display: "block" }} 
                  />
                </Link>
              );
            })}
          </div>
        </section>

        {/* CLEARANCE SALE Section */}
        <section style={{ margin: "40px 0", backgroundColor: "#ffffff", padding: "10px 0" }}>
          <div style={{ position: "relative", marginBottom: "20px" }}>
            <h2 style={{ fontSize: "14px", fontWeight: "800", textAlign: "center", textTransform: "uppercase", letterSpacing: "1.5px", color: "#000", margin: 0 }}>
              CLEARANCE SALE
            </h2>
            <Link href="/shop?category=clearance-sale" style={{ position: "absolute", right: "0", top: "50%", transform: "translateY(-50%)", backgroundColor: "#e2136e", color: "#ffffff", padding: "6px 14px", borderRadius: "20px", fontSize: "11.5px", fontWeight: "800", textDecoration: "none", boxShadow: "0 2px 8px rgba(226,19,110,0.25)" }}>
              SEE ALL ›
            </Link>
          </div>

          <div className="homepage-product-grid mobile-limit-2">
            {(products
              .filter(p => p.category?.name?.toLowerCase().includes("clearance") || p.name?.toLowerCase().includes("clearance") || p.campaignName === "CLEARANCE")
              .slice(0, 4)
              .concat(
                products.slice(2, Math.max(2, 2 + 4 - products.filter(p => p.category?.name?.toLowerCase().includes("clearance") || p.name?.toLowerCase().includes("clearance") || p.campaignName === "CLEARANCE").length))
              )
              .slice(0, 4)
            ).map((p) => {
              const primaryImage = p.images?.find((img) => img.isPrimary)?.url || p.images?.[0]?.url || "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=500&auto=format&fit=crop&q=60";
              const primaryVariant = p.variants?.[0];
              const oldPrice = primaryVariant?.price || 1200;
              const currentPrice = primaryVariant?.discountPrice || primaryVariant?.price || 899;
              const hasDiscount = primaryVariant?.discountPrice && primaryVariant.discountPrice < primaryVariant.price;
              const discountPercent = hasDiscount ? Math.round(((oldPrice - currentPrice) / oldPrice) * 100) : 25;
              const sizeLabel = primaryVariant?.size || primaryVariant?.name || "22ml";

              return (
                <div key={p.id} className="product-card" style={{ backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", overflow: "hidden", display: "flex", flexDirection: "column", justifyContent: "space-between", position: "relative" }}>
                  <div style={{ backgroundColor: "#e2136e", color: "#fff", fontSize: "11px", fontWeight: "800", padding: "4px 10px", borderRadius: "0 0 10px 0", position: "absolute", top: 0, left: 0, zIndex: 5 }}>
                    {discountPercent}% OFF
                  </div>

                  <div className={`wishlist-btn ${wishlist.includes(p.id) ? "active" : ""}`} onClick={() => toggleWishlist(p.id)}>
                    <svg fill={wishlist.includes(p.id) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="18" height="18">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                    </svg>
                  </div>
                  <Link href={`/product/${p.id}`} className="card-image" style={{ height: "230px", backgroundColor: "#ffffff", padding: "16px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <img src={primaryImage} alt={p.name} style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }} />
                  </Link>
                  <div className="card-body" style={{ padding: "12px 14px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", flex: 1, justifyContent: "space-between" }}>
                    <Link href={`/product/${p.id}`} className="card-title" style={{ fontSize: "14px", fontWeight: "600", color: "#1e293b", textDecoration: "none", lineHeight: "1.3", marginBottom: "8px", height: "38px", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                      {p.name}
                    </Link>
                    <span style={{ backgroundColor: "#e2136e", color: "#ffffff", fontSize: "10px", fontWeight: "900", padding: "3px 12px", borderRadius: "12px", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>
                      SALE
                    </span>
                    <div className="card-price-row" style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                      {hasDiscount && (
                        <span className="old-price" style={{ fontSize: "13px", color: "#94a3b8", textDecoration: "line-through", fontWeight: "600" }}>
                          ৳{oldPrice.toFixed(2)}
                        </span>
                      )}
                      <span className="price" style={{ fontSize: "16px", fontWeight: "800", color: "#e2136e" }}>
                        ৳{currentPrice.toFixed(2)}
                      </span>
                    </div>
                    <div style={{ color: "#f59e0b", fontSize: "13px", display: "flex", gap: "2px", marginBottom: "4px" }}>
                      ★ ★ ★ ★ <span style={{ color: "#cbd5e1" }}>★</span>
                    </div>
                    <div style={{ fontSize: "13px", fontWeight: "700", color: "#1e293b", marginBottom: "10px" }}>
                      {sizeLabel}
                    </div>
                  </div>
                  <button className="add-to-cart-btn" onClick={() => handleAddToCart(p)} style={{ backgroundColor: "#581c87", color: "#ffffff", border: "none", padding: "12px", fontWeight: "800", fontSize: "13px", letterSpacing: "0.5px", cursor: "pointer", width: "100%", borderRadius: "0 0 12px 12px" }}>
                    ADD TO CART
                  </button>
                </div>
              );
            })}
          </div>
        </section>
        
        {/* SHOP BY CONCERN Section */}
        <section style={{ margin: "20px 0 10px 0" }}>
          <h2 style={{ fontSize: "14px", fontWeight: "800", textAlign: "center", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: "20px", color: "#000" }}>
            SHOP BY CONCERN
          </h2>
          <div className="concerns-grid">
            {/* Concern Card 1: ACNE */}
            <Link href={getBannerForPage("Concern: Acne", "", "", "/shop?category=skincare&sub=Acne%20Treatment").link} style={{ display: "block", overflow: "hidden", borderRadius: "8px" }} className="promo-card-hover">
              <img src={getBannerForPage("Concern: Acne", "https://bk.shajgoj.com/storage/2026/04/acne-treatment.png", "").img} alt="Acne Treatment" style={{ width: "100%", height: "auto", aspectRatio: "1 / 1", objectFit: "cover", display: "block" }} />
            </Link>
            {/* Concern Card 2: ANTI AGING */}
            <Link href={getBannerForPage("Concern: Anti Aging", "", "", "/shop?category=skincare&sub=Anti%20Aging").link} style={{ display: "block", overflow: "hidden", borderRadius: "8px" }} className="promo-card-hover">
              <img src={getBannerForPage("Concern: Anti Aging", "https://bk.shajgoj.com/storage/2026/04/anti-aging-treatment.png", "").img} alt="Anti Aging Treatment" style={{ width: "100%", height: "auto", aspectRatio: "1 / 1", objectFit: "cover", display: "block" }} />
            </Link>
            {/* Concern Card 3: DANDRUFF */}
            <Link href={getBannerForPage("Concern: Dandruff", "", "", "/shop?category=haircare&sub=Dandruff").link} style={{ display: "block", overflow: "hidden", borderRadius: "8px" }} className="promo-card-hover">
              <img src={getBannerForPage("Concern: Dandruff", "https://bk.shajgoj.com/storage/2026/04/dandruff-solution.png", "").img} alt="Dandruff Solution" style={{ width: "100%", height: "auto", aspectRatio: "1 / 1", objectFit: "cover", display: "block" }} />
            </Link>
            {/* Concern Card 4: DRY SKIN */}
            <Link href={getBannerForPage("Concern: Dry Skin", "", "", "/shop?category=skincare&sub=Dry%20Skin").link} style={{ display: "block", overflow: "hidden", borderRadius: "8px" }} className="promo-card-hover">
              <img src={getBannerForPage("Concern: Dry Skin", "https://bk.shajgoj.com/storage/2026/04/dry-skin-treatment.png", "").img} alt="Dry Skin Treatment" style={{ width: "100%", height: "auto", aspectRatio: "1 / 1", objectFit: "cover", display: "block" }} />
            </Link>
            {/* Concern Card 5: HAIR FALL */}
            <Link href={getBannerForPage("Concern: Hair Fall", "", "", "/shop?category=haircare&sub=Hair%20Fall").link} style={{ display: "block", overflow: "hidden", borderRadius: "8px" }} className="promo-card-hover concern-card-extra">
              <img src={getBannerForPage("Concern: Hair Fall", "https://bk.shajgoj.com/storage/2026/04/hair-fall-treatment.png", "").img} alt="Hair Fall Treatment" style={{ width: "100%", height: "auto", aspectRatio: "1 / 1", objectFit: "cover", display: "block" }} />
            </Link>
            {/* Concern Card 6: OIL CONTROL */}
            <Link href={getBannerForPage("Concern: Oil Control", "", "", "/shop?category=skincare").link} style={{ display: "block", overflow: "hidden", borderRadius: "8px" }} className="promo-card-hover concern-card-extra">
              <img src={getBannerForPage("Concern: Oil Control", "https://bk.shajgoj.com/storage/2026/04/oil-control-treatment.png", "").img} alt="Oil Control Treatment" style={{ width: "100%", height: "auto", aspectRatio: "1 / 1", objectFit: "cover", display: "block" }} />
            </Link>
            {/* Concern Card 7: PORE CARE */}
            <Link href={getBannerForPage("Concern: Pore Care", "", "", "/shop?category=skincare&sub=Pore%20Care").link} style={{ display: "block", overflow: "hidden", borderRadius: "8px" }} className="promo-card-hover concern-card-extra">
              <img src={getBannerForPage("Concern: Pore Care", "https://bk.shajgoj.com/storage/2026/04/pore-care.png", "").img} alt="Pore Care" style={{ width: "100%", height: "auto", aspectRatio: "1 / 1", objectFit: "cover", display: "block" }} />
            </Link>
            {/* Concern Card 8: SPOT TREATMENT */}
            <Link href={getBannerForPage("Concern: Spot Treatment", "", "", "/shop?category=skincare").link} style={{ display: "block", overflow: "hidden", borderRadius: "8px" }} className="promo-card-hover concern-card-extra">
              <img src={getBannerForPage("Concern: Spot Treatment", "https://bk.shajgoj.com/storage/2026/04/spot-treatment.png", "").img} alt="Spot Treatment" style={{ width: "100%", height: "auto", aspectRatio: "1 / 1", objectFit: "cover", display: "block" }} />
            </Link>
            {/* Concern Card 9: HAIR THINNING */}
            <Link href={getBannerForPage("Concern: Hair Thinning", "", "", "/shop?category=haircare").link} style={{ display: "block", overflow: "hidden", borderRadius: "8px" }} className="promo-card-hover concern-card-extra">
              <img src={getBannerForPage("Concern: Hair Thinning", "https://bk.shajgoj.com/storage/2026/04/hair-thinning-solution.png", "").img} alt="Hair Thinning Solution" style={{ width: "100%", height: "auto", aspectRatio: "1 / 1", objectFit: "cover", display: "block" }} />
            </Link>
            {/* Concern Card 10: SUN BURN */}
            <Link href={getBannerForPage("Concern: Sun Burn", "", "", "/shop?category=skincare").link} style={{ display: "block", overflow: "hidden", borderRadius: "8px" }} className="promo-card-hover concern-card-extra">
              <img src={getBannerForPage("Concern: Sun Burn", "https://bk.shajgoj.com/storage/2026/04/sun-burn-treatment.png", "").img} alt="Sun Burn Treatment" style={{ width: "100%", height: "auto", aspectRatio: "1 / 1", objectFit: "cover", display: "block" }} />
            </Link>
          </div>
        </section>

      </main>

      <Footer />
      <MobileNavbar />

      {/* Daily Offer Popup */}
      {showNotification && activeNotification && (
        <div style={{
          position: "fixed",
          bottom: "80px",
          right: "24px",
          width: "320px",
          backgroundColor: "rgba(255, 255, 255, 0.98)",
          boxShadow: "0 10px 25px rgba(0, 0, 0, 0.15)",
          borderRadius: "16px",
          border: "2px solid #e52860",
          padding: "20px",
          zIndex: 10000,
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}>
          <button 
            onClick={() => {
              localStorage.setItem("glowgoodly_last_notification_closed", activeNotification.id);
              setShowNotification(false);
            }}
            style={{
              position: "absolute",
              top: "10px",
              right: "10px",
              background: "none",
              border: "none",
              fontSize: "18px",
              fontWeight: "bold",
              color: "#a0aec0",
              cursor: "pointer"
            }}
          >
            ×
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "20px" }}>🎁</span>
            <h4 style={{ margin: 0, fontSize: "15px", fontWeight: "900", color: "#e52860" }}>
              {activeNotification.title}
            </h4>
          </div>
          <p style={{ margin: 0, fontSize: "13px", color: "#4a5568", fontWeight: "600", lineHeight: "1.4" }}>
            {activeNotification.message}
          </p>
          {activeNotification.linkUrl && (
            <Link 
              href={activeNotification.linkUrl}
              onClick={() => {
                localStorage.setItem("glowgoodly_last_notification_closed", activeNotification.id);
                setShowNotification(false);
              }}
              style={{
                display: "block",
                textAlign: "center",
                backgroundColor: "#e52860",
                color: "#ffffff",
                padding: "8px 12px",
                borderRadius: "8px",
                fontSize: "12px",
                fontWeight: "800",
                textDecoration: "none",
                marginTop: "4px"
              }}
            >
              Get Offer Now!
            </Link>
          )}
        </div>
      )}
    </>
  );
}
