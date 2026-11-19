"use client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

import React, { useEffect, useState } from "react";
import { fetchWithCache, API_BASE, getProductUrl, subscribeToDataSync, safeImageUrl } from "../utils/api";
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
  slug?: string;
  description: string;
  brand: { name: string };
  category: { name: string };
  campaignName?: string | null;
  images: { url: string; isPrimary: boolean }[];
  variants: { id: string; name: string; price: number; discountPrice: number | null; stock: number; shadeColor: string | null; size?: string | null }[];
}

const FALLBACK_PRODUCT_IMG = "/placeholder-product.svg";

const getProductImage = (p: any): string => {
  const raw = p?.images?.find((img: any) => img.isPrimary)?.url || p?.images?.[0]?.url || p?.imageUrl;
  return safeImageUrl(raw, FALLBACK_PRODUCT_IMG);
};

export default function Home() {
  const { addToCart, wishlist, toggleWishlist } = useApp();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [dynamicSlides, setDynamicSlides] = useState<any[]>([]);
  const [homepageBanners, setHomepageBanners] = useState<any[]>([]);

  const getBannerForPage = (identifier: string, fallbackImg: string = "", fallbackTitle: string = "", fallbackLink: string = "#") => {
    const rawTerm = (identifier || "").trim();
    const term = rawTerm.toLowerCase();
    const cleanTerm = term.replace(/[^a-z0-9]/g, "");

    const found = homepageBanners.find((b: any) => {
      if (!b) return false;
      const p = (b.page || "").toLowerCase().trim();
      const id = (b.id || "").toLowerCase().trim();
      const t = (b.title || "").toLowerCase().trim();
      const cleanId = id.replace(/[^a-z0-9]/g, "");
      const cleanP = p.replace(/[^a-z0-9]/g, "");
      const cleanT = t.replace(/[^a-z0-9]/g, "");

      // 1. Direct or sanitized ID match ("dealcard1" == "dealcard1", "deal-card-1" == "deal card 1")
      if (id === term || cleanId === cleanTerm) return true;

      // 2. Specific card slot matching
      if (cleanTerm === "dealcard1" && (cleanId.includes("dealcard1") || cleanId === "deal1" || cleanT.includes("dealcard1"))) return true;
      if (cleanTerm === "dealcard2" && (cleanId.includes("dealcard2") || cleanId === "deal2" || cleanT.includes("dealcard2"))) return true;
      if (cleanTerm === "dealcard3" && (cleanId.includes("dealcard3") || cleanId === "deal3" || cleanT.includes("dealcard3"))) return true;
      if (cleanTerm === "dealcard4" && (cleanId.includes("dealcard4") || cleanId === "deal4" || cleanT.includes("dealcard4"))) return true;

      if (cleanTerm === "brandoffer1" && (cleanId.includes("brandoffer1") || cleanId === "brandoffer1" || cleanT.includes("brandoffer1"))) return true;
      if (cleanTerm === "brandoffer2" && (cleanId.includes("brandoffer2") || cleanId === "brandoffer2" || cleanT.includes("brandoffer2"))) return true;
      if (cleanTerm === "brandoffer5" && (cleanId.includes("brandoffer5") || cleanId.includes("brandoffer3") || cleanT.includes("brandoffer5"))) return true;
      if (cleanTerm === "brandoffer6" && (cleanId.includes("brandoffer6") || cleanId.includes("brandoffer4") || cleanT.includes("brandoffer6"))) return true;

      // 3. Wide banner matching
      if (cleanTerm.includes("wide") || cleanTerm.includes("exclusivesavings") || cleanTerm.includes("beautymusthaves")) {
        if (cleanId.includes("wide") || cleanP.includes("wide") || cleanT.includes("wide") || cleanT.includes("beautymusthaves")) return true;
      }

      // 4. Four deal strip matching
      if (cleanTerm === "bogo" && (cleanId.includes("bogo") || cleanT.includes("bogo"))) return true;
      if (cleanTerm === "combo" && (cleanId.includes("combo") || cleanT.includes("combo"))) return true;
      if (cleanTerm === "offers" && (cleanId.includes("dealstripoffers") || (cleanId.includes("offers") && cleanP.includes("deal")) || cleanT.includes("exclusiveoffers"))) return true;
      if ((cleanTerm.includes("clearance") || cleanTerm.includes("sale")) && (cleanId.includes("clearance") || cleanT.includes("clearance"))) return true;

      // 5. Category matching with alias & ID support
      if (term.startsWith("category:")) {
        const catPart = term.replace("category:", "").trim().replace(/[^a-z0-9]/g, "");
        if (cleanId.includes(`catcard${catPart}`) || cleanId.includes(`cat${catPart}`) || cleanT.includes(catPart) || cleanP.includes(catPart)) return true;
        return false;
      }

      // 6. Concern matching with alias & ID support
      if (term.startsWith("concern:")) {
        const conPart = term.replace("concern:", "").trim().replace(/[^a-z0-9]/g, "");
        if (cleanId.includes(`concerncard${conPart}`) || cleanId.includes(conPart) || cleanT.includes(conPart)) return true;
        return false;
      }

      // 7. Generic fuzzy match
      if (cleanTerm.length >= 3) {
        if (cleanId.includes(cleanTerm) || cleanT.includes(cleanTerm) || cleanTerm.includes(cleanId)) return true;
      }

      return false;
    });

    if (typeof window !== "undefined") {
      try {
        const deletedRaw = localStorage.getItem("gg_deleted_banner_ids");
        if (deletedRaw) {
          const deletedIds: string[] = JSON.parse(deletedRaw);
          if (deletedIds.includes(term) || (found && (deletedIds.includes(found.id) || deletedIds.includes(found.page)))) {
            return { img: "", mobileImg: "", tabletImg: "", title: "", link: fallbackLink };
          }
        }
      } catch (e) {}
    }

    const rawImg = found ? (found.imageUrl || found.image || found.mediaUrl) : "";
    const cleanImg = safeImageUrl(rawImg, "");
    const finalImg = cleanImg || fallbackImg;

    return {
      img: finalImg,
      mobileImg: safeImageUrl(found && found.mobileImageUrl ? found.mobileImageUrl : finalImg, finalImg),
      tabletImg: safeImageUrl(found && found.tabletImageUrl ? found.tabletImageUrl : finalImg, finalImg),
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
    const found = categories.find((c: any) => c.name?.toLowerCase() === catName?.toLowerCase());
    if (found && (found.imageUrl || found.image)) {
      return safeImageUrl(found.imageUrl || found.image);
    }
    return "/cosmetics_circle_illustration.png";
  };

  // Filter States
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeBrand, setActiveBrand] = useState<string | null>(null);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sortOption, setSortOption] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [addingToCartId, setAddingToCartId] = useState<string | null>(null);
  const [activeNotification, setActiveNotification] = useState<any>(null);
  const [showNotification, setShowNotification] = useState(false);

  // Slide Banner State
  const [activeSlide, setActiveSlide] = useState(0);
  const [isHeroPaused, setIsHeroPaused] = useState(false);
  const [bannersLoaded, setBannersLoaded] = useState(true);

  const activeSlidesList = dynamicSlides;

  // Auto rotate slides smoothly (pauses on hover)
  useEffect(() => {
    if (activeSlidesList.length <= 1 || isHeroPaused) return;
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % activeSlidesList.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [activeSlidesList.length, isHeroPaused]);

  // Parse query parameters
  useEffect(() => {
    if (typeof window !== "undefined") {
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

    const fetchMetadata = async (bypass: boolean = true) => {
      try {
        const timestamp = Date.now();
        // Fetch real categories, promotional banners, brands, and dynamic hero banners strictly from backend API
        const [categoriesRes, bannersRes, brandsRes, heroBannersRes] = await Promise.all([
          fetchWithCache(`${API_BASE}/categories?t=${timestamp}`, true).catch(() => null),
          fetchWithCache(`${API_BASE}/banners?t=${timestamp}`, true).catch(() => null),
          fetchWithCache(`${API_BASE}/brands?t=${timestamp}`, true).catch(() => null),
          fetchWithCache(`${API_BASE}/hero-banners?t=${timestamp}`, true).catch(() => null),
        ]);

        if (Array.isArray(categoriesRes) && categoriesRes.length > 0) {
          setCategories(categoriesRes);
        }
        if (Array.isArray(brandsRes) && brandsRes.length > 0) {
          setBrands(brandsRes);
        }

        let combinedSlides: any[] = [];

        // 1. Prioritize dynamic Hero Banner uploads from /api/hero-banners
        if (Array.isArray(heroBannersRes) && heroBannersRes.length > 0) {
          const activeHeroMedia = heroBannersRes.filter((b: any) => b.isActive !== false);
          if (activeHeroMedia.length > 0) {
            combinedSlides = activeHeroMedia.map((b: any, idx: number) => {
              const rawUrl = b.mediaUrl || b.imageUrl || b.url;
              const resolvedUrl = safeImageUrl(rawUrl);
              const mediaType = b.mediaType || (rawUrl?.includes(".mp4") || rawUrl?.includes(".webm") ? "video" : rawUrl?.includes(".gif") ? "gif" : "image");

              return {
                id: b.id || `hero-media-${idx}`,
                title: b.title || "GlowGoodly Hero Banner",
                desc: b.subtitle || "",
                mediaUrl: resolvedUrl,
                mediaType,
                img: resolvedUrl,
                mobileImg: resolvedUrl,
                tabletImg: resolvedUrl,
                link: b.ctaLink || "/shop"
              };
            });
          }
        }

        // 2. Also check /api/banners for Hero Slides
        if (Array.isArray(bannersRes) && bannersRes.length > 0) {
          setHomepageBanners(bannersRes);
          if (combinedSlides.length === 0) {
            const heroBanners = bannersRes.filter((b: any) => {
              const p = (b.page || "").toLowerCase().trim();
              const t = (b.title || "").toLowerCase().trim();
              return p.includes("hero") || t.includes("hero") || p === "homepage" || p === "hero slides";
            });
            if (heroBanners.length > 0) {
              combinedSlides = heroBanners.map((b: any, idx: number) => ({
                id: b.id || `hero-${idx}`,
                title: b.title || "GlowGoodly",
                desc: b.description || b.subTitle || "",
                bg: b.backgroundColor || "linear-gradient(135deg, #111827 0%, #1f2937 100%)",
                img: safeImageUrl(b.imageUrl || b.image),
                mobileImg: safeImageUrl(b.mobileImageUrl || b.imageUrl || b.image),
                tabletImg: safeImageUrl(b.tabletImageUrl || b.imageUrl || b.image),
                link: b.linkUrl || b.link || "/shop"
              }));
            }
          }
        }

        if (combinedSlides.length > 0) {
          setDynamicSlides(combinedSlides);
        }

        const notifRes = await fetchWithCache(`${API_BASE}/notifications/active?t=${timestamp}`, true).catch(() => null);
        if (notifRes && notifRes.isActive) {
          const closedId = localStorage.getItem("glowgoodly_last_notification_closed");
          if (closedId !== notifRes.id) {
            setActiveNotification(notifRes);
            setShowNotification(true);
          }
        }
      } catch (e) {
        console.error("Error setting metadata", e);
      } finally {
        setBannersLoaded(true);
      }
    };
    fetchMetadata(true);

    return subscribeToDataSync(() => fetchMetadata(true));
  }, []);

  // Fetch filtered products
  useEffect(() => {
    const fetchProducts = async (bypass: boolean = true) => {
      try {
        let url = `${API_BASE}/products?includeAll=true&t=${Date.now()}&`;
        if (activeCategory) url += `category=${activeCategory}&`;
        if (activeBrand) url += `brand=${activeBrand}&`;
        if (searchQuery) url += `search=${encodeURIComponent(searchQuery)}&`;
        if (minPrice) url += `minPrice=${minPrice}&`;
        if (maxPrice) url += `maxPrice=${maxPrice}&`;
        if (sortOption) url += `sort=${sortOption}&`;

        const data = await fetchWithCache(url, true);
        setProducts(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error("Error loading products", e);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts(true);

    return subscribeToDataSync(() => fetchProducts(true));
  }, [activeCategory, activeBrand, searchQuery, minPrice, maxPrice, sortOption]);


  const handleAddToCart = (product: Product) => {
    setAddingToCartId(product.id);
    const primaryVariant = product.variants?.[0];
    const primaryImage = getProductImage(product);
    const effectivePrice = primaryVariant 
      ? (primaryVariant.discountPrice || primaryVariant.price)
      : ((product as any).price || 0);

    addToCart({
      id: primaryVariant?.id || product.id,
      productId: product.id,
      name: product.name,
      variantName: primaryVariant?.name || "Standard",
      image: primaryImage,
      price: effectivePrice,
      stock: primaryVariant?.stock ?? 50,
    });

    setTimeout(() => {
      setAddingToCartId(null);
    }, 1200);
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
      <h1
        style={{
          position: "absolute",
          width: "1px",
          height: "1px",
          padding: 0,
          margin: "-1px",
          overflow: "hidden",
          clip: "rect(0, 0, 0, 0)",
          whiteSpace: "nowrap",
          border: 0,
        }}
      >
        GlowGoodly — 100% Authentic Cosmetics, Korean Skincare & Beauty Shop Bangladesh
      </h1>

      {/* Full-width Dynamic Promotional Banner Slider - Preloaded CSS Sliding Carousel */}
      {(() => {
        const safeSlideIdx = activeSlide % (activeSlidesList.length || 1);
        return (
          <section
            style={{
              width: "100%",
              position: "relative",
              overflow: "hidden",
              backgroundColor: "#fcf8fa",
            }}
            onMouseEnter={() => setIsHeroPaused(true)}
            onMouseLeave={() => setIsHeroPaused(false)}
            onTouchStart={() => setIsHeroPaused(true)}
            onTouchEnd={() => setIsHeroPaused(false)}
          >
            {/* Sliding Track: All slides preloaded once, zero subsequent network requests */}
            <div
              style={{
                display: "flex",
                width: "100%",
                transform: `translateX(-${safeSlideIdx * 100}%)`,
                transition: "transform 0.55s cubic-bezier(0.25, 1, 0.5, 1)",
                willChange: "transform",
              }}
            >
              {activeSlidesList.map((slide, idx) => {
                const isVideo = slide?.mediaType === "video" || slide?.mediaUrl?.includes(".mp4") || slide?.mediaUrl?.includes(".webm");
                const slideImg = slide?.img || slide?.mediaUrl || DEFAULT_HERO_SLIDES[idx % DEFAULT_HERO_SLIDES.length].img;
                const slideMobileImg = slide?.mobileImg || slideImg;
                const slideTabletImg = slide?.tabletImg || slideImg;
                const isExternal = slide?.link?.startsWith("http");

                const slideContent = isVideo ? (
                  <div
                    style={{
                      width: "100%",
                      aspectRatio: "1920 / 600",
                      maxHeight: "600px",
                      overflow: "hidden",
                      backgroundColor: "#0f172a",
                      position: "relative",
                    }}
                  >
                    <video
                      src={slide?.mediaUrl || slideImg}
                      autoPlay
                      muted
                      loop
                      playsInline
                      preload="metadata"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                      }}
                    />
                  </div>
                ) : (
                  <picture
                    style={{
                      display: "block",
                      width: "100%",
                      aspectRatio: "1920 / 600",
                      maxHeight: "600px",
                      overflow: "hidden",
                      backgroundColor: "#f8fafc",
                    }}
                  >
                    <source media="(max-width: 640px)" srcSet={slideMobileImg} />
                    <source media="(max-width: 1024px)" srcSet={slideTabletImg} />
                    <img
                      src={slideImg}
                      alt={slide?.title || `Hero Slide ${idx + 1}`}
                      loading={idx === 0 ? "eager" : "lazy"}
                      fetchPriority={idx === 0 ? "high" : "auto"}
                      decoding="async"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                      }}
                    />
                  </picture>
                );

                return (
                  <div
                    key={slide.id || idx}
                    style={{
                      flex: "0 0 100%",
                      width: "100%",
                      minWidth: "100%",
                      position: "relative",
                    }}
                  >
                    {isExternal ? (
                      <a
                        href={slide?.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ display: "block", width: "100%", cursor: "pointer" }}
                      >
                        {slideContent}
                      </a>
                    ) : (
                      <Link
                        href={slide?.link || "/shop"}
                        style={{ display: "block", width: "100%", cursor: "pointer" }}
                      >
                        {slideContent}
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Navigation Arrows for Easy User Control */}
            {activeSlidesList.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => setActiveSlide((prev) => (prev - 1 + activeSlidesList.length) % activeSlidesList.length)}
                  aria-label="Previous Slide"
                  style={{
                    position: "absolute",
                    left: "16px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    backgroundColor: "rgba(255, 255, 255, 0.8)",
                    border: "none",
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#0f172a",
                    fontWeight: "900",
                    fontSize: "18px",
                    zIndex: 4,
                    transition: "all 0.2s ease"
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#ffffff")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.8)")}
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSlide((prev) => (prev + 1) % activeSlidesList.length)}
                  aria-label="Next Slide"
                  style={{
                    position: "absolute",
                    right: "16px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    backgroundColor: "rgba(255, 255, 255, 0.8)",
                    border: "none",
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#0f172a",
                    fontWeight: "900",
                    fontSize: "18px",
                    zIndex: 4,
                    transition: "all 0.2s ease"
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#ffffff")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.8)")}
                >
                  ›
                </button>
              </>
            )}

            {/* Dots Indicator */}
            {activeSlidesList.length > 1 && (
              <div
                style={{
                  position: "absolute",
                  bottom: "15px",
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
                      width: safeSlideIdx === idx ? "24px" : "10px",
                      height: "10px",
                      borderRadius: "5px",
                      backgroundColor: safeSlideIdx === idx ? "#e63b7a" : "rgba(255, 255, 255, 0.7)",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
                      cursor: "pointer",
                      transition: "all 0.25s ease",
                    }}
                  />
                ))}
              </div>
            )}
          </section>
        );
      })()}

      <main className="container" style={{ paddingBottom: "40px", paddingTop: "20px" }}>

        {/* Wide horizontal promo banner ad: Beauty Must Haves Exclusive Savings */}
        {(() => {
          const wideBanner = getBannerForPage("Homepage Wide Banner", "", "Beauty Must Haves Exclusive Savings", "/shop");
          if (!wideBanner.img) return null;
          return (
            <Link href={wideBanner.link} style={{ margin: "10px 0 35px 0", borderRadius: "8px", overflow: "hidden", cursor: "pointer", display: "block" }} className="promo-card-hover">
              <picture style={{ display: "block", width: "100%" }}>
                {wideBanner.mobileImg && (
                  <source media="(max-width: 640px)" srcSet={wideBanner.mobileImg} />
                )}
                {wideBanner.tabletImg && (
                  <source media="(max-width: 1024px)" srcSet={wideBanner.tabletImg} />
                )}
                <img
                  src={wideBanner.img}
                  alt={wideBanner.title}
                  style={{
                    width: "100%",
                    height: "auto",
                    display: "block",
                  }}
                />
              </picture>
            </Link>
          );
        })()}

        {/* NEW ARRIVALS & TRENDING PRODUCTS (Live from database) */}
        {products && products.length > 0 && (
          <section style={{ margin: "25px 0 35px 0", backgroundColor: "#ffffff", padding: "10px 0" }}>
            <div style={{ position: "relative", marginBottom: "20px" }}>
              <h2 style={{ fontSize: "14px", fontWeight: "800", textAlign: "center", textTransform: "uppercase", letterSpacing: "1.5px", color: "#000", margin: 0 }}>
                NEW ARRIVALS & TRENDING
              </h2>
              <Link href="/shop" style={{ position: "absolute", right: "0", top: "50%", transform: "translateY(-50%)", backgroundColor: "#e2136e", color: "#ffffff", padding: "6px 14px", borderRadius: "20px", fontSize: "11.5px", fontWeight: "800", textDecoration: "none", boxShadow: "0 2px 8px rgba(226,19,110,0.25)" }}>
                SEE ALL ›
              </Link>
            </div>

            <div className="homepage-product-grid mobile-limit-2">
              {products.slice(0, 4).map((p) => {
                const primaryImage = getProductImage(p);
                const primaryVariant = p.variants?.[0];
                const oldPrice = primaryVariant?.price || (p as any).price || 0;
                const currentPrice = primaryVariant?.discountPrice || primaryVariant?.price || (p as any).discountPrice || (p as any).price || 0;
                const hasDiscount = Boolean(primaryVariant?.discountPrice && primaryVariant.discountPrice < primaryVariant.price);
                const discountPercent = hasDiscount && oldPrice > 0 ? Math.round(((oldPrice - currentPrice) / oldPrice) * 100) : 0;
                const sizeLabel = (primaryVariant as any)?.size || (primaryVariant?.name && !primaryVariant.name.toLowerCase().includes("default") ? primaryVariant.name : "");

                return (
                  <div key={`new-${p.id}`} className="product-card" style={{ backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", overflow: "hidden", display: "flex", flexDirection: "column", justifyContent: "space-between", position: "relative" }}>
                    {hasDiscount && discountPercent > 0 ? (
                      <div style={{ backgroundColor: "#e2136e", color: "#fff", fontSize: "11px", fontWeight: "800", padding: "4px 10px", borderRadius: "0 0 10px 0", position: "absolute", top: 0, left: 0, zIndex: 5 }}>
                        {discountPercent}% OFF
                      </div>
                    ) : (
                      <div style={{ backgroundColor: "#0284c7", color: "#fff", fontSize: "10.5px", fontWeight: "800", padding: "4px 10px", borderRadius: "0 0 10px 0", position: "absolute", top: 0, left: 0, zIndex: 5 }}>
                        NEW
                      </div>
                    )}

                    <div className={`wishlist-btn ${wishlist.includes(p.id) ? "active" : ""}`} onClick={() => toggleWishlist(p.id)}>
                      <svg fill={wishlist.includes(p.id) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="18" height="18">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                      </svg>
                    </div>
                    <Link href={getProductUrl(p)} className="card-image" style={{ height: "230px", backgroundColor: "#ffffff", padding: "16px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <img src={primaryImage} alt={p.name} loading="lazy" onError={(e) => { (e.currentTarget as HTMLImageElement).src = FALLBACK_PRODUCT_IMG; }} style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }} />
                    </Link>
                    <div className="card-body" style={{ padding: "12px 14px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", flex: 1, justifyContent: "space-between" }}>
                      <Link href={getProductUrl(p)} className="card-title" style={{ fontSize: "14px", fontWeight: "600", color: "#1e293b", textDecoration: "none", lineHeight: "1.3", marginBottom: "8px", height: "38px", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                        {p.name}
                      </Link>
                      <span style={{ backgroundColor: "#f1f5f9", color: "#475569", fontSize: "10px", fontWeight: "800", padding: "3px 10px", borderRadius: "12px", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>
                        {p.brand?.name || "AUTHENTIC"}
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
                      {sizeLabel && (
                        <div style={{ fontSize: "13px", fontWeight: "700", color: "#1e293b", marginBottom: "10px" }}>
                          {sizeLabel}
                        </div>
                      )}
                    </div>
                    <button
                      className="add-to-cart-btn"
                      onClick={() => handleAddToCart(p)}
                      disabled={addingToCartId === p.id}
                      style={{
                        backgroundColor: addingToCartId === p.id ? "#059669" : "#581c87",
                        color: "#ffffff",
                        border: "none",
                        padding: "12px",
                        fontWeight: "800",
                        fontSize: "13px",
                        letterSpacing: "0.5px",
                        cursor: addingToCartId === p.id ? "default" : "pointer",
                        width: "100%",
                        borderRadius: "0 0 12px 12px",
                        transition: "all 0.2s ease"
                      }}
                    >
                      {addingToCartId === p.id ? "✓ ADDED!" : "ADD TO CART"}
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        )}



        {/* CLEARANCE SALE Section (Top Section) */}
        {(() => {
          const clearanceProducts = products
            .filter(p => p.category?.name?.toLowerCase().includes("clearance") || p.campaignName?.toLowerCase().includes("clearance") || p.name?.toLowerCase().includes("clearance"))
            .slice(0, 4);

          if (clearanceProducts.length === 0) return null;

          return (
            <section style={{ margin: "30px 0", backgroundColor: "#ffffff", padding: "10px 0" }}>
              <div style={{ position: "relative", marginBottom: "20px" }}>
                <h2 style={{ fontSize: "14px", fontWeight: "800", textAlign: "center", textTransform: "uppercase", letterSpacing: "1.5px", color: "#000", margin: 0 }}>
                  CLEARANCE SALE
                </h2>
                <Link href="/shop?category=Clearance%20Sale" style={{ position: "absolute", right: "0", top: "50%", transform: "translateY(-50%)", backgroundColor: "#e2136e", color: "#ffffff", padding: "6px 14px", borderRadius: "20px", fontSize: "11.5px", fontWeight: "800", textDecoration: "none", boxShadow: "0 2px 8px rgba(226,19,110,0.25)" }}>
                  SEE ALL ›
                </Link>
              </div>

              <div className="homepage-product-grid mobile-limit-2">
                {clearanceProducts.map((p) => {
                  const primaryImage = getProductImage(p);
                  const primaryVariant = p.variants?.[0];
                  const oldPrice = primaryVariant?.price || 0;
                  const currentPrice = primaryVariant?.discountPrice || primaryVariant?.price || 0;
                  const hasDiscount = Boolean(primaryVariant?.discountPrice && primaryVariant.discountPrice < primaryVariant.price);
                  const discountPercent = hasDiscount && oldPrice > 0 ? Math.round(((oldPrice - currentPrice) / oldPrice) * 100) : 0;
                  const sizeLabel = (primaryVariant as any)?.size || (primaryVariant?.name && !primaryVariant.name.toLowerCase().includes("default") ? primaryVariant.name : "");

                  return (
                    <div key={p.id} className="product-card" style={{ backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", overflow: "hidden", display: "flex", flexDirection: "column", justifyContent: "space-between", position: "relative" }}>
                      {hasDiscount && discountPercent > 0 && (
                        <div style={{ backgroundColor: "#e2136e", color: "#fff", fontSize: "11px", fontWeight: "800", padding: "4px 10px", borderRadius: "0 0 10px 0", position: "absolute", top: 0, left: 0, zIndex: 5 }}>
                          {discountPercent}% OFF
                        </div>
                      )}

                      <div className={`wishlist-btn ${wishlist.includes(p.id) ? "active" : ""}`} onClick={() => toggleWishlist(p.id)}>
                        <svg fill={wishlist.includes(p.id) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="18" height="18">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                        </svg>
                      </div>
                      <Link href={getProductUrl(p)} className="card-image" style={{ height: "230px", backgroundColor: "#ffffff", padding: "16px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <img src={primaryImage} alt={p.name} loading="lazy" onError={(e) => { (e.currentTarget as HTMLImageElement).src = FALLBACK_PRODUCT_IMG; }} style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }} />
                      </Link>
                      <div className="card-body" style={{ padding: "12px 14px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", flex: 1, justifyContent: "space-between" }}>
                        <Link href={getProductUrl(p)} className="card-title" style={{ fontSize: "14px", fontWeight: "600", color: "#1e293b", textDecoration: "none", lineHeight: "1.3", marginBottom: "8px", height: "38px", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                          {p.name}
                        </Link>
                        <span style={{ backgroundColor: "#e2136e", color: "#ffffff", fontSize: "10px", fontWeight: "900", padding: "3px 12px", borderRadius: "12px", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>
                          CLEARANCE
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
                        {sizeLabel && (
                          <div style={{ fontSize: "13px", fontWeight: "700", color: "#1e293b", marginBottom: "10px" }}>
                            {sizeLabel}
                          </div>
                        )}
                      </div>
                      <button
                        className="add-to-cart-btn"
                        onClick={() => handleAddToCart(p)}
                        disabled={addingToCartId === p.id}
                        style={{
                          backgroundColor: addingToCartId === p.id ? "#059669" : "#581c87",
                          color: "#ffffff",
                          border: "none",
                          padding: "12px",
                          fontWeight: "800",
                          fontSize: "13px",
                          letterSpacing: "0.5px",
                          cursor: addingToCartId === p.id ? "default" : "pointer",
                          width: "100%",
                          borderRadius: "0 0 12px 12px",
                          transition: "all 0.2s ease"
                        }}
                      >
                        {addingToCartId === p.id ? "✓ ADDED!" : "ADD TO CART"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })()}

        {/* DEALS YOU CANNOT MISS Section */}
        <section style={{ margin: "30px 0 40px 0" }}>
          <h2 style={{ fontSize: "14px", fontWeight: "800", textAlign: "center", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: "20px", color: "#000" }}>
            DEALS YOU CANNOT MISS
          </h2>
          <div className="dycm-grid">
            {/* Card 1 */}
            {(() => {
              const b = getBannerForPage("Deal Card 1", "", "Ombre 30% Off", "/shop?deal=ombre");
              return (
                <Link href={b.link} style={{ display: "block", overflow: "hidden", borderRadius: "8px" }} className="promo-card-hover">
                  {b.img ? (
                    <img 
                      src={b.img} 
                      alt={b.title || "Deal Card 1"} 
                      style={{ width: "100%", height: "auto", aspectRatio: "1/1", objectFit: "cover", display: "block" }} 
                    />
                  ) : (
                    <div style={{ width: "100%", aspectRatio: "1/1", background: "linear-gradient(135deg, #fdf2f8, #fce7f3)", display: "flex", alignItems: "center", justifyContent: "center", color: "#db2777", fontWeight: "800", fontSize: "13px", textAlign: "center", padding: "10px" }}>
                      {b.title || "Special Deal"}
                    </div>
                  )}
                </Link>
              );
            })()}
            {/* Card 2 */}
            {(() => {
              const b = getBannerForPage("Deal Card 2", "", "Marico Free Delivery", "/shop?deal=marico");
              return (
                <Link href={b.link} style={{ display: "block", overflow: "hidden", borderRadius: "8px" }} className="promo-card-hover">
                  {b.img ? (
                    <img 
                      src={b.img} 
                      alt={b.title || "Deal Card 2"} 
                      style={{ width: "100%", height: "auto", aspectRatio: "1/1", objectFit: "cover", display: "block" }} 
                    />
                  ) : (
                    <div style={{ width: "100%", aspectRatio: "1/1", background: "linear-gradient(135deg, #eff6ff, #dbeafe)", display: "flex", alignItems: "center", justifyContent: "center", color: "#2563eb", fontWeight: "800", fontSize: "13px", textAlign: "center", padding: "10px" }}>
                      {b.title || "Free Delivery Deal"}
                    </div>
                  )}
                </Link>
              );
            })()}
            {/* Card 3 */}
            {(() => {
              const b = getBannerForPage("Deal Card 3", "", "PNS Campaign", "/shop?deal=pns");
              return (
                <Link href={b.link} style={{ display: "block", overflow: "hidden", borderRadius: "8px" }} className="promo-card-hover">
                  {b.img ? (
                    <img 
                      src={b.img} 
                      alt={b.title || "Deal Card 3"} 
                      style={{ width: "100%", height: "auto", aspectRatio: "1/1", objectFit: "cover", display: "block" }} 
                    />
                  ) : (
                    <div style={{ width: "100%", aspectRatio: "1/1", background: "linear-gradient(135deg, #f0fdf4, #dcfce7)", display: "flex", alignItems: "center", justifyContent: "center", color: "#16a34a", fontWeight: "800", fontSize: "13px", textAlign: "center", padding: "10px" }}>
                      {b.title || "Campaign Offer"}
                    </div>
                  )}
                </Link>
              );
            })()}
            {/* Card 4 */}
            {(() => {
              const b = getBannerForPage("Deal Card 4", "", "Senora Deal", "/shop?deal=senora");
              return (
                <Link href={b.link} style={{ display: "block", overflow: "hidden", borderRadius: "8px" }} className="promo-card-hover">
                  {b.img ? (
                    <img 
                      src={b.img} 
                      alt={b.title || "Deal Card 4"} 
                      style={{ width: "100%", height: "auto", aspectRatio: "1/1", objectFit: "cover", display: "block" }} 
                    />
                  ) : (
                    <div style={{ width: "100%", aspectRatio: "1/1", background: "linear-gradient(135deg, #faf5ff, #f3e8ff)", display: "flex", alignItems: "center", justifyContent: "center", color: "#9333ea", fontWeight: "800", fontSize: "13px", textAlign: "center", padding: "10px" }}>
                      {b.title || "Top Deal"}
                    </div>
                  )}
                </Link>
              );
            })()}
          </div>
        </section>

        {/* SKIN CARE Section */}
        {(() => {
          const skincareProducts = products
            .filter(p => p.category?.name?.toLowerCase().includes("skin") || p.name?.toLowerCase().includes("serum") || p.name?.toLowerCase().includes("cream") || p.name?.toLowerCase().includes("sunscreen") || p.name?.toLowerCase().includes("moisturizer") || p.name?.toLowerCase().includes("toner") || p.name?.toLowerCase().includes("face wash"))
            .slice(0, 4);

          if (skincareProducts.length === 0) return null;

          return (
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
                {skincareProducts.map((p) => {
                  const primaryImage = getProductImage(p);
                  const primaryVariant = p.variants?.[0];
                  const oldPrice = primaryVariant?.price || 0;
                  const currentPrice = primaryVariant?.discountPrice || primaryVariant?.price || 0;
                  const hasDiscount = Boolean(primaryVariant?.discountPrice && primaryVariant.discountPrice < primaryVariant.price);
                  const discountPercent = hasDiscount && oldPrice > 0 ? Math.round(((oldPrice - currentPrice) / oldPrice) * 100) : 0;
                  const sizeLabel = (primaryVariant as any)?.size || (primaryVariant?.name && !primaryVariant.name.toLowerCase().includes("default") ? primaryVariant.name : "");

                  return (
                    <div key={p.id} className="product-card" style={{ backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", overflow: "hidden", display: "flex", flexDirection: "column", justifyContent: "space-between", position: "relative" }}>
                      {hasDiscount && discountPercent > 0 && (
                        <div style={{ backgroundColor: "#e2136e", color: "#fff", fontSize: "11px", fontWeight: "800", padding: "4px 10px", borderRadius: "0 0 10px 0", position: "absolute", top: 0, left: 0, zIndex: 5 }}>
                          {discountPercent}% OFF
                        </div>
                      )}

                      <div className={`wishlist-btn ${wishlist.includes(p.id) ? "active" : ""}`} onClick={() => toggleWishlist(p.id)}>
                        <svg fill={wishlist.includes(p.id) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="18" height="18">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                        </svg>
                      </div>
                      <Link href={getProductUrl(p)} className="card-image" style={{ height: "230px", backgroundColor: "#ffffff", padding: "16px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <img src={primaryImage} alt={p.name} loading="lazy" onError={(e) => { (e.currentTarget as HTMLImageElement).src = FALLBACK_PRODUCT_IMG; }} style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }} />
                      </Link>
                      <div className="card-body" style={{ padding: "12px 14px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", flex: 1, justifyContent: "space-between" }}>
                        <Link href={getProductUrl(p)} className="card-title" style={{ fontSize: "14px", fontWeight: "600", color: "#1e293b", textDecoration: "none", lineHeight: "1.3", marginBottom: "8px", height: "38px", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
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
                        {sizeLabel && (
                          <div style={{ fontSize: "13px", fontWeight: "700", color: "#1e293b", marginBottom: "10px" }}>
                            {sizeLabel}
                          </div>
                        )}
                      </div>
                      <button
                        className="add-to-cart-btn"
                        onClick={() => handleAddToCart(p)}
                        disabled={addingToCartId === p.id}
                        style={{
                          backgroundColor: addingToCartId === p.id ? "#059669" : "#581c87",
                          color: "#ffffff",
                          border: "none",
                          padding: "12px",
                          fontWeight: "800",
                          fontSize: "13px",
                          letterSpacing: "0.5px",
                          cursor: addingToCartId === p.id ? "default" : "pointer",
                          width: "100%",
                          borderRadius: "0 0 12px 12px",
                          transition: "all 0.2s ease"
                        }}
                      >
                        {addingToCartId === p.id ? "✓ ADDED!" : "ADD TO CART"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })()}

        {/* TOP BRANDS & OFFERS Section */}
        <section style={{ margin: "30px 0" }}>
          <h2 style={{ fontSize: "14px", fontWeight: "800", textAlign: "center", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: "16px", color: "#000" }}>
            TOP BRANDS & OFFERS
          </h2>
          <div className="top-brands-grid">
            {/* Banner 1 */}
            {(() => {
              const b = getBannerForPage("Brand Offer 1", "", "The Ordinary", "/shop?brand=the-ordinary");
              return (
                <Link href={b.link} style={{ display: "block", overflow: "hidden", borderRadius: "10px", transition: "transform 0.2s ease" }} className="promo-card-hover">
                  {b.img ? (
                    <img 
                      src={b.img} 
                      alt={b.title || "Brand Offer 1"} 
                      style={{ width: "100%", height: "auto", display: "block", borderRadius: "10px" }} 
                    />
                  ) : (
                    <div style={{ width: "100%", aspectRatio: "1/1", background: "linear-gradient(135deg, #f8fafc, #f1f5f9)", display: "flex", alignItems: "center", justifyContent: "center", color: "#475569", fontWeight: "800", fontSize: "13px", textAlign: "center", padding: "10px", borderRadius: "10px" }}>
                      {b.title || "Brand Offer 1"}
                    </div>
                  )}
                </Link>
              );
            })()}
            {/* Banner 2 */}
            {(() => {
              const b = getBannerForPage("Brand Offer 2", "", "Skin Cafe", "/shop?brand=skin-cafe");
              return (
                <Link href={b.link} style={{ display: "block", overflow: "hidden", borderRadius: "10px", transition: "transform 0.2s ease" }} className="promo-card-hover">
                  {b.img ? (
                    <img 
                      src={b.img} 
                      alt={b.title || "Brand Offer 2"} 
                      style={{ width: "100%", height: "auto", display: "block", borderRadius: "10px" }} 
                    />
                  ) : (
                    <div style={{ width: "100%", aspectRatio: "1/1", background: "linear-gradient(135deg, #f0fdf4, #dcfce7)", display: "flex", alignItems: "center", justifyContent: "center", color: "#16a34a", fontWeight: "800", fontSize: "13px", textAlign: "center", padding: "10px", borderRadius: "10px" }}>
                      {b.title || "Brand Offer 2"}
                    </div>
                  )}
                </Link>
              );
            })()}
            {/* Banner 5 */}
            {(() => {
              const b = getBannerForPage("Brand Offer 5", "", "Treasure of Glow", "/shop?brand=treasure-of-glow");
              return (
                <Link href={b.link} style={{ display: "block", overflow: "hidden", borderRadius: "10px", transition: "transform 0.2s ease" }} className="promo-card-hover">
                  {b.img ? (
                    <img 
                      src={b.img} 
                      alt={b.title || "Brand Offer 5"} 
                      style={{ width: "100%", height: "auto", display: "block", borderRadius: "10px" }} 
                    />
                  ) : (
                    <div style={{ width: "100%", aspectRatio: "1/1", background: "linear-gradient(135deg, #fdf2f8, #fce7f3)", display: "flex", alignItems: "center", justifyContent: "center", color: "#db2777", fontWeight: "800", fontSize: "13px", textAlign: "center", padding: "10px", borderRadius: "10px" }}>
                      {b.title || "Brand Offer 5"}
                    </div>
                  )}
                </Link>
              );
            })()}
            {/* Banner 6 */}
            {(() => {
              const b = getBannerForPage("Brand Offer 6", "", "Trimmer Offer", "/shop?category=trimmer");
              return (
                <Link href={b.link} style={{ display: "block", overflow: "hidden", borderRadius: "10px", transition: "transform 0.2s ease" }} className="promo-card-hover">
                  {b.img ? (
                    <img 
                      src={b.img} 
                      alt={b.title || "Brand Offer 6"} 
                      style={{ width: "100%", height: "auto", display: "block", borderRadius: "10px" }} 
                    />
                  ) : (
                    <div style={{ width: "100%", aspectRatio: "1/1", background: "linear-gradient(135deg, #eff6ff, #dbeafe)", display: "flex", alignItems: "center", justifyContent: "center", color: "#2563eb", fontWeight: "800", fontSize: "13px", textAlign: "center", padding: "10px", borderRadius: "10px" }}>
                      {b.title || "Brand Offer 6"}
                    </div>
                  )}
                </Link>
              );
            })()}
          </div>
        </section>

        {/* BOGO Section */}
        {(() => {
          const bogoProducts = products
            .filter(p => p.category?.name?.toLowerCase().includes("bogo") || p.name?.toLowerCase().includes("bogo") || p.name?.toLowerCase().includes("buy 1") || p.campaignName === "BOGO")
            .slice(0, 4);

          if (bogoProducts.length === 0) return null;

          return (
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
                {bogoProducts.map((p) => {
                  const primaryImage = getProductImage(p);
                  const primaryVariant = p.variants?.[0];
                  const oldPrice = primaryVariant?.price || 0;
                  const currentPrice = primaryVariant?.discountPrice || primaryVariant?.price || 0;
                  const hasDiscount = Boolean(primaryVariant?.discountPrice && primaryVariant.discountPrice < primaryVariant.price);
                  const discountPercent = hasDiscount && oldPrice > 0 ? Math.round(((oldPrice - currentPrice) / oldPrice) * 100) : 0;
                  const sizeLabel = (primaryVariant as any)?.size || (primaryVariant?.name && !primaryVariant.name.toLowerCase().includes("default") ? primaryVariant.name : "");

                  return (
                    <div key={p.id} className="product-card" style={{ backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", overflow: "hidden", display: "flex", flexDirection: "column", justifyContent: "space-between", position: "relative" }}>
                      {hasDiscount && discountPercent > 0 && (
                        <div style={{ backgroundColor: "#e2136e", color: "#fff", fontSize: "11px", fontWeight: "800", padding: "4px 10px", borderRadius: "0 0 10px 0", position: "absolute", top: 0, left: 0, zIndex: 5 }}>
                          {discountPercent}% OFF
                        </div>
                      )}

                      <div className={`wishlist-btn ${wishlist.includes(p.id) ? "active" : ""}`} onClick={() => toggleWishlist(p.id)}>
                        <svg fill={wishlist.includes(p.id) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="18" height="18">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                        </svg>
                      </div>
                      <Link href={getProductUrl(p)} className="card-image" style={{ height: "230px", backgroundColor: "#ffffff", padding: "16px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <img src={primaryImage} alt={p.name} loading="lazy" onError={(e) => { (e.currentTarget as HTMLImageElement).src = FALLBACK_PRODUCT_IMG; }} style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }} />
                      </Link>
                      <div className="card-body" style={{ padding: "12px 14px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", flex: 1, justifyContent: "space-between" }}>
                        <Link href={getProductUrl(p)} className="card-title" style={{ fontSize: "14px", fontWeight: "600", color: "#1e293b", textDecoration: "none", lineHeight: "1.3", marginBottom: "8px", height: "38px", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
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
                        {sizeLabel && (
                          <div style={{ fontSize: "13px", fontWeight: "700", color: "#1e293b", marginBottom: "10px" }}>
                            {sizeLabel}
                          </div>
                        )}
                      </div>
                      <button
                        className="add-to-cart-btn"
                        onClick={() => handleAddToCart(p)}
                        disabled={addingToCartId === p.id}
                        style={{
                          backgroundColor: addingToCartId === p.id ? "#059669" : "#581c87",
                          color: "#ffffff",
                          border: "none",
                          padding: "12px",
                          fontWeight: "800",
                          fontSize: "13px",
                          letterSpacing: "0.5px",
                          cursor: addingToCartId === p.id ? "default" : "pointer",
                          width: "100%",
                          borderRadius: "0 0 12px 12px",
                          transition: "all 0.2s ease"
                        }}
                      >
                        {addingToCartId === p.id ? "✓ ADDED!" : "ADD TO CART"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })()}

        {/* MAKEUP Section (After TOP BRANDS & OFFERS / Above LIMITED TIME OFFERS) */}
        {(() => {
          const makeupProducts = products
            .filter(p => (p.category?.name?.toLowerCase().includes("makeup") && !p.category?.name?.toLowerCase().includes("tool")) || p.name?.toLowerCase().includes("lipstick") || p.name?.toLowerCase().includes("mascara") || p.name?.toLowerCase().includes("powder") || p.name?.toLowerCase().includes("foundation") || p.name?.toLowerCase().includes("primer") || p.name?.toLowerCase().includes("gloss"))
            .slice(0, 4);

          if (makeupProducts.length === 0) return null;

          return (
            <section style={{ margin: "40px 0", backgroundColor: "#ffffff", padding: "10px 0" }}>
              <div style={{ position: "relative", marginBottom: "20px" }}>
                <h2 style={{ fontSize: "14px", fontWeight: "800", textAlign: "center", textTransform: "uppercase", letterSpacing: "1.5px", color: "#000", margin: 0 }}>
                  MAKEUP
                </h2>
                <Link href="/shop?category=Makeup" style={{ position: "absolute", right: "0", top: "50%", transform: "translateY(-50%)", backgroundColor: "#e2136e", color: "#ffffff", padding: "6px 14px", borderRadius: "20px", fontSize: "11.5px", fontWeight: "800", textDecoration: "none", boxShadow: "0 2px 8px rgba(226,19,110,0.25)" }}>
                  SEE ALL ›
                </Link>
              </div>

              <div className="homepage-product-grid mobile-limit-2">
                {makeupProducts.map((p) => {
                  const primaryImage = getProductImage(p);
                  const primaryVariant = p.variants?.[0];
                  const oldPrice = primaryVariant?.price || 0;
                  const currentPrice = primaryVariant?.discountPrice || primaryVariant?.price || 0;
                  const hasDiscount = Boolean(primaryVariant?.discountPrice && primaryVariant.discountPrice < primaryVariant.price);
                  const discountPercent = hasDiscount && oldPrice > 0 ? Math.round(((oldPrice - currentPrice) / oldPrice) * 100) : 0;
                  const sizeLabel = (primaryVariant as any)?.size || (primaryVariant?.name && !primaryVariant.name.toLowerCase().includes("default") ? primaryVariant.name : "");

                  return (
                    <div key={p.id} className="product-card" style={{ backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", overflow: "hidden", display: "flex", flexDirection: "column", justifyContent: "space-between", position: "relative" }}>
                      {hasDiscount && discountPercent > 0 && (
                        <div style={{ backgroundColor: "#e2136e", color: "#fff", fontSize: "11px", fontWeight: "800", padding: "4px 10px", borderRadius: "0 0 10px 0", position: "absolute", top: 0, left: 0, zIndex: 5 }}>
                          {discountPercent}% OFF
                        </div>
                      )}

                      <div className={`wishlist-btn ${wishlist.includes(p.id) ? "active" : ""}`} onClick={() => toggleWishlist(p.id)}>
                        <svg fill={wishlist.includes(p.id) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="18" height="18">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                        </svg>
                      </div>
                      <Link href={getProductUrl(p)} className="card-image" style={{ height: "230px", backgroundColor: "#ffffff", padding: "16px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <img src={primaryImage} alt={p.name} loading="lazy" onError={(e) => { (e.currentTarget as HTMLImageElement).src = FALLBACK_PRODUCT_IMG; }} style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }} />
                      </Link>
                      <div className="card-body" style={{ padding: "12px 14px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", flex: 1, justifyContent: "space-between" }}>
                        <Link href={getProductUrl(p)} className="card-title" style={{ fontSize: "14px", fontWeight: "600", color: "#1e293b", textDecoration: "none", lineHeight: "1.3", marginBottom: "8px", height: "38px", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
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
                          ★ ★ ★ ★ ★
                        </div>
                        {sizeLabel && (
                          <div style={{ fontSize: "13px", fontWeight: "700", color: "#1e293b", marginBottom: "10px" }}>
                            {sizeLabel}
                          </div>
                        )}
                      </div>
                      <button
                        className="add-to-cart-btn"
                        onClick={() => handleAddToCart(p)}
                        disabled={addingToCartId === p.id}
                        style={{
                          backgroundColor: addingToCartId === p.id ? "#059669" : "#581c87",
                          color: "#ffffff",
                          border: "none",
                          padding: "12px",
                          fontWeight: "800",
                          fontSize: "13px",
                          letterSpacing: "0.5px",
                          cursor: addingToCartId === p.id ? "default" : "pointer",
                          width: "100%",
                          borderRadius: "0 0 12px 12px",
                          transition: "all 0.2s ease"
                        }}
                      >
                        {addingToCartId === p.id ? "✓ ADDED!" : "ADD TO CART"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })()}

        {/* LIMITED TIME OFFERS Section */}
        <section style={{ margin: "40px 0" }}>
          <h2 style={{ fontSize: "14px", fontWeight: "800", textAlign: "center", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: "20px", color: "#000" }}>
            LIMITED TIME OFFERS
          </h2>
          <div className="limited-offers-grid">
            {/* Card 1: BOGO */}
            {(() => {
              const b = getBannerForPage("BOGO", "", "BOGO Deals", "/shop?campaign=BOGO");
              return (
                <Link href={b.link} style={{ display: "block", overflow: "hidden", borderRadius: "8px" }} className="promo-card-hover">
                  {b.img ? (
                    <img 
                      src={b.img} 
                      alt={b.title || "BOGO Offer"} 
                      style={{ width: "100%", height: "auto", aspectRatio: "1/1", objectFit: "cover", display: "block" }} 
                    />
                  ) : (
                    <div style={{ width: "100%", aspectRatio: "1/1", background: "linear-gradient(135deg, #fce7f3, #fbcfe8)", display: "flex", alignItems: "center", justifyContent: "center", color: "#db2777", fontWeight: "900", fontSize: "14px", textAlign: "center", padding: "10px" }}>
                      {b.title || "BOGO Deals"}
                    </div>
                  )}
                </Link>
              );
            })()}
            {/* Card 2: COMBO */}
            {(() => {
              const b = getBannerForPage("COMBO", "", "Combo Specials", "/shop?campaign=COMBO");
              return (
                <Link href={b.link} style={{ display: "block", overflow: "hidden", borderRadius: "8px" }} className="promo-card-hover">
                  {b.img ? (
                    <img 
                      src={b.img} 
                      alt={b.title || "COMBO Offer"} 
                      style={{ width: "100%", height: "auto", aspectRatio: "1/1", objectFit: "cover", display: "block" }} 
                    />
                  ) : (
                    <div style={{ width: "100%", aspectRatio: "1/1", background: "linear-gradient(135deg, #eff6ff, #bfdbfe)", display: "flex", alignItems: "center", justifyContent: "center", color: "#1d4ed8", fontWeight: "900", fontSize: "14px", textAlign: "center", padding: "10px" }}>
                      {b.title || "Combo Specials"}
                    </div>
                  )}
                </Link>
              );
            })()}
            {/* Card 3: OFFERS */}
            {(() => {
              const b = getBannerForPage("OFFERS", "", "Special Offers", "/shop?campaign=OFFERS");
              return (
                <Link href={b.link} style={{ display: "block", overflow: "hidden", borderRadius: "8px" }} className="promo-card-hover">
                  {b.img ? (
                    <img 
                      src={b.img} 
                      alt={b.title || "Exclusive Offers"} 
                      style={{ width: "100%", height: "auto", aspectRatio: "1/1", objectFit: "cover", display: "block" }} 
                    />
                  ) : (
                    <div style={{ width: "100%", aspectRatio: "1/1", background: "linear-gradient(135deg, #f0fdf4, #bbf7d0)", display: "flex", alignItems: "center", justifyContent: "center", color: "#15803d", fontWeight: "900", fontSize: "14px", textAlign: "center", padding: "10px" }}>
                      {b.title || "Exclusive Offers"}
                    </div>
                  )}
                </Link>
              );
            })()}
            {/* Card 4: Clearance SALE */}
            {(() => {
              const b = getBannerForPage("Clearance SALE", "", "Clearance Sale", "/shop?campaign=Clearance%20SALE");
              return (
                <Link href={b.link} style={{ display: "block", overflow: "hidden", borderRadius: "8px" }} className="promo-card-hover">
                  {b.img ? (
                    <img 
                      src={b.img} 
                      alt={b.title || "Clearance Sale"} 
                      style={{ width: "100%", height: "auto", aspectRatio: "1/1", objectFit: "cover", display: "block" }} 
                    />
                  ) : (
                    <div style={{ width: "100%", aspectRatio: "1/1", background: "linear-gradient(135deg, #fff7ed, #fed7aa)", display: "flex", alignItems: "center", justifyContent: "center", color: "#c2410c", fontWeight: "900", fontSize: "14px", textAlign: "center", padding: "10px" }}>
                      {b.title || "Clearance Sale"}
                    </div>
                  )}
                </Link>
              );
            })()}
          </div>
        </section>

        {/* PERFECT MATCH WITH COMBO Section */}
        {(() => {
          const comboProducts = products
            .filter(p => p.category?.name?.toLowerCase().includes("combo") || p.name?.toLowerCase().includes("combo") || p.campaignName === "COMBO")
            .sort((a, b) => {
              const discA = (a.variants?.[0]?.price || 0) - (a.variants?.[0]?.discountPrice || a.variants?.[0]?.price || 0);
              const discB = (b.variants?.[0]?.price || 0) - (b.variants?.[0]?.discountPrice || b.variants?.[0]?.price || 0);
              return discB - discA;
            })
            .slice(0, 4);

          if (comboProducts.length === 0) return null;

          return (
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
                {comboProducts.map((p) => {
                  const primaryImage = getProductImage(p);
                  const primaryVariant = p.variants?.[0];
                  const oldPrice = primaryVariant?.price || 0;
                  const currentPrice = primaryVariant?.discountPrice || primaryVariant?.price || 0;
                  const hasDiscount = Boolean(primaryVariant?.discountPrice && primaryVariant.discountPrice < primaryVariant.price);
                  const discountPercent = hasDiscount && oldPrice > 0 ? Math.round(((oldPrice - currentPrice) / oldPrice) * 100) : 0;
                  const sizeLabel = (primaryVariant as any)?.size || (primaryVariant?.name && !primaryVariant.name.toLowerCase().includes("default") ? primaryVariant.name : "");

                  return (
                    <div key={p.id} className="product-card" style={{ backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", overflow: "hidden", display: "flex", flexDirection: "column", justifyContent: "space-between", position: "relative" }}>
                      {hasDiscount && discountPercent > 0 && (
                        <div style={{ backgroundColor: "#e2136e", color: "#fff", fontSize: "11px", fontWeight: "800", padding: "4px 10px", borderRadius: "0 0 10px 0", position: "absolute", top: 0, left: 0, zIndex: 5 }}>
                          {discountPercent}% OFF
                        </div>
                      )}

                      <div className={`wishlist-btn ${wishlist.includes(p.id) ? "active" : ""}`} onClick={() => toggleWishlist(p.id)}>
                        <svg fill={wishlist.includes(p.id) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="18" height="18">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                        </svg>
                      </div>
                      <Link href={getProductUrl(p)} className="card-image" style={{ height: "230px", backgroundColor: "#ffffff", padding: "16px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <img src={primaryImage} alt={p.name} loading="lazy" onError={(e) => { (e.currentTarget as HTMLImageElement).src = FALLBACK_PRODUCT_IMG; }} style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }} />
                      </Link>
                      <div className="card-body" style={{ padding: "12px 14px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", flex: 1, justifyContent: "space-between" }}>
                        <Link href={getProductUrl(p)} className="card-title" style={{ fontSize: "14px", fontWeight: "600", color: "#1e293b", textDecoration: "none", lineHeight: "1.3", marginBottom: "8px", height: "38px", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                          {p.name}
                        </Link>
                        <span style={{ backgroundColor: "#e2136e", color: "#ffffff", fontSize: "10px", fontWeight: "900", padding: "3px 12px", borderRadius: "12px", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>
                          COMBO
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
                        {sizeLabel && (
                          <div style={{ fontSize: "13px", fontWeight: "700", color: "#1e293b", marginBottom: "10px" }}>
                            {sizeLabel}
                          </div>
                        )}
                      </div>
                      <button
                        className="add-to-cart-btn"
                        onClick={() => handleAddToCart(p)}
                        disabled={addingToCartId === p.id}
                        style={{
                          backgroundColor: addingToCartId === p.id ? "#059669" : "#581c87",
                          color: "#ffffff",
                          border: "none",
                          padding: "12px",
                          fontWeight: "800",
                          fontSize: "13px",
                          letterSpacing: "0.5px",
                          cursor: addingToCartId === p.id ? "default" : "pointer",
                          width: "100%",
                          borderRadius: "0 0 12px 12px",
                          transition: "all 0.2s ease"
                        }}
                      >
                        {addingToCartId === p.id ? "✓ ADDED!" : "ADD TO CART"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })()}

        {/* MAKEUP TOOLS Section (Above SHOP BEAUTY PRODUCTS BY CATEGORY) */}
        {(() => {
          const toolProducts = products
            .filter(p => p.category?.name?.toLowerCase().includes("tool") || p.name?.toLowerCase().includes("brush") || p.name?.toLowerCase().includes("sponge") || p.name?.toLowerCase().includes("curler") || p.name?.toLowerCase().includes("applicator"))
            .slice(0, 4);

          if (toolProducts.length === 0) return null;

          return (
            <section style={{ margin: "40px 0", backgroundColor: "#ffffff", padding: "10px 0" }}>
              <div style={{ position: "relative", marginBottom: "20px" }}>
                <h2 style={{ fontSize: "14px", fontWeight: "800", textAlign: "center", textTransform: "uppercase", letterSpacing: "1.5px", color: "#000", margin: 0 }}>
                  MAKEUP TOOLS
                </h2>
                <Link href="/shop?category=Makeup%20Tools" style={{ position: "absolute", right: "0", top: "50%", transform: "translateY(-50%)", backgroundColor: "#e2136e", color: "#ffffff", padding: "6px 14px", borderRadius: "20px", fontSize: "11.5px", fontWeight: "800", textDecoration: "none", boxShadow: "0 2px 8px rgba(226,19,110,0.25)" }}>
                  SEE ALL ›
                </Link>
              </div>

              <div className="homepage-product-grid mobile-limit-2">
                {toolProducts.map((p) => {
                  const primaryImage = getProductImage(p);
                  const primaryVariant = p.variants?.[0];
                  const oldPrice = primaryVariant?.price || 0;
                  const currentPrice = primaryVariant?.discountPrice || primaryVariant?.price || 0;
                  const hasDiscount = Boolean(primaryVariant?.discountPrice && primaryVariant.discountPrice < primaryVariant.price);
                  const discountPercent = hasDiscount && oldPrice > 0 ? Math.round(((oldPrice - currentPrice) / oldPrice) * 100) : 0;
                  const sizeLabel = (primaryVariant as any)?.size || (primaryVariant?.name && !primaryVariant.name.toLowerCase().includes("default") ? primaryVariant.name : "");

                  return (
                    <div key={p.id} className="product-card" style={{ backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", overflow: "hidden", display: "flex", flexDirection: "column", justifyContent: "space-between", position: "relative" }}>
                      {hasDiscount && discountPercent > 0 && (
                        <div style={{ backgroundColor: "#e2136e", color: "#fff", fontSize: "11px", fontWeight: "800", padding: "4px 10px", borderRadius: "0 0 10px 0", position: "absolute", top: 0, left: 0, zIndex: 5 }}>
                          {discountPercent}% OFF
                        </div>
                      )}

                      <div className={`wishlist-btn ${wishlist.includes(p.id) ? "active" : ""}`} onClick={() => toggleWishlist(p.id)}>
                        <svg fill={wishlist.includes(p.id) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="18" height="18">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                        </svg>
                      </div>
                      <Link href={getProductUrl(p)} className="card-image" style={{ height: "230px", backgroundColor: "#ffffff", padding: "16px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <img src={primaryImage} alt={p.name} loading="lazy" onError={(e) => { (e.currentTarget as HTMLImageElement).src = FALLBACK_PRODUCT_IMG; }} style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }} />
                      </Link>
                      <div className="card-body" style={{ padding: "12px 14px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", flex: 1, justifyContent: "space-between" }}>
                        <Link href={getProductUrl(p)} className="card-title" style={{ fontSize: "14px", fontWeight: "600", color: "#1e293b", textDecoration: "none", lineHeight: "1.3", marginBottom: "8px", height: "38px", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                          {p.name}
                        </Link>
                        <span style={{ backgroundColor: "#e2136e", color: "#ffffff", fontSize: "10px", fontWeight: "900", padding: "3px 12px", borderRadius: "12px", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>
                          MAKEUP TOOLS
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
                        {sizeLabel && (
                          <div style={{ fontSize: "13px", fontWeight: "700", color: "#1e293b", marginBottom: "10px" }}>
                            {sizeLabel}
                          </div>
                        )}
                      </div>
                      <button
                        className="add-to-cart-btn"
                        onClick={() => handleAddToCart(p)}
                        disabled={addingToCartId === p.id}
                        style={{
                          backgroundColor: addingToCartId === p.id ? "#059669" : "#581c87",
                          color: "#ffffff",
                          border: "none",
                          padding: "12px",
                          fontWeight: "800",
                          fontSize: "13px",
                          letterSpacing: "0.5px",
                          cursor: addingToCartId === p.id ? "default" : "pointer",
                          width: "100%",
                          borderRadius: "0 0 12px 12px",
                          transition: "all 0.2s ease"
                        }}
                      >
                        {addingToCartId === p.id ? "✓ ADDED!" : "ADD TO CART"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })()}

        {/* SHOP BEAUTY PRODUCTS BY CATEGORY Section */}
        {(() => {
          const displayCats = (categories && categories.length > 0 ? categories.filter((c: any) => !c.parentId).slice(0, 8) : [
            { name: "Makeup", slug: "makeup" },
            { name: "Skin", slug: "skin" },
            { name: "Hair", slug: "hair" },
            { name: "Personal Care", slug: "personal-care" },
            { name: "Mom & Baby", slug: "mom-baby" },
            { name: "Fragrance", slug: "fragrance" },
            { name: "Undergarments", slug: "undergarments" },
            { name: "Combo", slug: "combo" }
          ]).map((item: any) => {
            const fromDb = categories.find((c: any) => c.name?.toLowerCase().trim() === item.name.toLowerCase() || c.slug === item.slug) || item;
            return {
              id: fromDb?.id || `cat-${item.slug}`,
              name: fromDb?.name || item.name,
              slug: fromDb?.slug || item.slug,
              imageUrl: safeImageUrl(fromDb?.imageUrl || fromDb?.image, "/placeholder-product.svg")
            };
          });

          return (
            <section style={{ margin: "40px 0" }}>
              <h2 style={{ fontSize: "14px", fontWeight: "800", textAlign: "center", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: "20px", color: "#000" }}>
                SHOP BEAUTY PRODUCTS BY CATEGORY
              </h2>
              <div className="categories-grid">
                {displayCats.map((cat: any) => {
                  const catLink = `/shop?category=${encodeURIComponent(cat.slug)}`;
                  const bannerInfo = getBannerForPage(`Category: ${cat.name}`, cat.imageUrl, cat.name, catLink);
                  const catImg = safeImageUrl(bannerInfo.img || cat.imageUrl, "");
                  return (
                    <Link 
                      key={cat.id || cat.name} 
                      href={bannerInfo.link || catLink} 
                      style={{ display: "block", borderRadius: "10px", overflow: "hidden", cursor: "pointer", textDecoration: "none" }} 
                      className="promo-card-hover"
                    >
                      {catImg ? (
                        <img 
                          src={catImg} 
                          alt={cat.name} 
                          style={{ width: "100%", height: "auto", aspectRatio: "1 / 1", objectFit: "cover", display: "block", borderRadius: "10px" }} 
                        />
                      ) : (
                        <div style={{ width: "100%", aspectRatio: "1 / 1", background: "linear-gradient(135deg, #fdf2f8, #fbcfe8)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", borderRadius: "10px", padding: "10px" }}>
                          <span style={{ fontSize: "28px", marginBottom: "4px" }}>✨</span>
                          <span style={{ fontSize: "12px", fontWeight: "800", color: "#db2777", textAlign: "center" }}>{cat.name}</span>
                        </div>
                      )}
                    </Link>
                  );
                })}
              </div>
            </section>
          );
        })()}

        {/* HAIR CARE Section (Below SHOP BEAUTY PRODUCTS BY CATEGORY) */}
        {(() => {
          const hairProducts = products
            .filter(p => p.category?.name?.toLowerCase().includes("hair") || p.name?.toLowerCase().includes("hair") || p.name?.toLowerCase().includes("shampoo") || p.name?.toLowerCase().includes("conditioner"))
            .slice(0, 4);

          if (hairProducts.length === 0) return null;

          return (
            <section style={{ margin: "40px 0", backgroundColor: "#ffffff", padding: "10px 0" }}>
              <div style={{ position: "relative", marginBottom: "20px" }}>
                <h2 style={{ fontSize: "14px", fontWeight: "800", textAlign: "center", textTransform: "uppercase", letterSpacing: "1.5px", color: "#000", margin: 0 }}>
                  HAIR CARE
                </h2>
                <Link href="/shop?category=haircare" style={{ position: "absolute", right: "0", top: "50%", transform: "translateY(-50%)", backgroundColor: "#e2136e", color: "#ffffff", padding: "6px 14px", borderRadius: "20px", fontSize: "11.5px", fontWeight: "800", textDecoration: "none", boxShadow: "0 2px 8px rgba(226,19,110,0.25)" }}>
                  SEE ALL ›
                </Link>
              </div>

              <div className="homepage-product-grid mobile-limit-2">
                {hairProducts.map((p, idx) => {
                  const primaryImage = getProductImage(p);
                  const primaryVariant = p.variants?.[0];
                  const oldPrice = primaryVariant?.price || 0;
                  const currentPrice = primaryVariant?.discountPrice || primaryVariant?.price || 0;
                  const hasDiscount = Boolean(primaryVariant?.discountPrice && primaryVariant.discountPrice < primaryVariant.price);
                  const discountPercent = hasDiscount && oldPrice > 0 ? Math.round(((oldPrice - currentPrice) / oldPrice) * 100) : 0;
                  const sizeLabel = (primaryVariant as any)?.size || (primaryVariant?.name && !primaryVariant.name.toLowerCase().includes("default") ? primaryVariant.name : "");

                  return (
                    <div key={p.id ? `${p.id}-${idx}` : idx} className="product-card" style={{ backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", overflow: "hidden", display: "flex", flexDirection: "column", justifyContent: "space-between", position: "relative" }}>
                      {hasDiscount && discountPercent > 0 && (
                        <div style={{ backgroundColor: "#e2136e", color: "#fff", fontSize: "11px", fontWeight: "800", padding: "4px 10px", borderRadius: "0 0 10px 0", position: "absolute", top: 0, left: 0, zIndex: 5 }}>
                          {discountPercent}% OFF
                        </div>
                      )}

                      <div className={`wishlist-btn ${wishlist.includes(p.id) ? "active" : ""}`} onClick={() => toggleWishlist(p.id)}>
                        <svg fill={wishlist.includes(p.id) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="18" height="18">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                        </svg>
                      </div>
                      <Link href={getProductUrl(p)} className="card-image" style={{ height: "230px", backgroundColor: "#ffffff", padding: "16px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <img src={primaryImage} alt={p.name} loading="lazy" onError={(e) => { (e.currentTarget as HTMLImageElement).src = FALLBACK_PRODUCT_IMG; }} style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }} />
                      </Link>
                      <div className="card-body" style={{ padding: "12px 14px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", flex: 1, justifyContent: "space-between" }}>
                        <Link href={getProductUrl(p)} className="card-title" style={{ fontSize: "14px", fontWeight: "600", color: "#1e293b", textDecoration: "none", lineHeight: "1.3", marginBottom: "8px", height: "38px", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                          {p.name}
                        </Link>
                        <span style={{ backgroundColor: "#e2136e", color: "#ffffff", fontSize: "10px", fontWeight: "900", padding: "3px 12px", borderRadius: "12px", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>
                          HAIR CARE
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
                        {sizeLabel && (
                          <div style={{ fontSize: "13px", fontWeight: "700", color: "#1e293b", marginBottom: "10px" }}>
                            {sizeLabel}
                          </div>
                        )}
                      </div>
                      <button
                        className="add-to-cart-btn"
                        onClick={() => handleAddToCart(p)}
                        disabled={addingToCartId === p.id}
                        style={{
                          backgroundColor: addingToCartId === p.id ? "#059669" : "#581c87",
                          color: "#ffffff",
                          border: "none",
                          padding: "12px",
                          fontWeight: "800",
                          fontSize: "13px",
                          letterSpacing: "0.5px",
                          cursor: addingToCartId === p.id ? "default" : "pointer",
                          width: "100%",
                          borderRadius: "0 0 12px 12px",
                          transition: "all 0.2s ease"
                        }}
                      >
                        {addingToCartId === p.id ? "✓ ADDED!" : "ADD TO CART"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })()}
        
        {/* JUST ARRIVED / NEW ARRIVALS Section */}
        {(() => {
          const sorted = [...products].sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
          const newArrivals = sorted.slice(0, 4);
          if (newArrivals.length === 0) return null;

          return (
            <section style={{ margin: "40px 0", backgroundColor: "#ffffff", padding: "10px 0" }}>
              <div style={{ position: "relative", marginBottom: "20px" }}>
                <h2 style={{ fontSize: "14px", fontWeight: "800", textAlign: "center", textTransform: "uppercase", letterSpacing: "1.5px", color: "#000", margin: 0 }}>
                  JUST ARRIVED / NEW ARRIVALS
                </h2>
                <Link href="/shop?sort=newest" style={{ position: "absolute", right: "0", top: "50%", transform: "translateY(-50%)", backgroundColor: "#e2136e", color: "#ffffff", padding: "6px 14px", borderRadius: "20px", fontSize: "11.5px", fontWeight: "800", textDecoration: "none", boxShadow: "0 2px 8px rgba(226,19,110,0.25)" }}>
                  SEE ALL ›
                </Link>
              </div>

              <div className="homepage-product-grid mobile-limit-2">
                {newArrivals.map((p) => {
                  const primaryImage = getProductImage(p);
                  const primaryVariant = p.variants?.[0];
                  const oldPrice = primaryVariant?.price || 0;
                  const currentPrice = primaryVariant?.discountPrice || primaryVariant?.price || 0;
                  const hasDiscount = Boolean(primaryVariant?.discountPrice && primaryVariant.discountPrice < primaryVariant.price);
                  const discountPercent = hasDiscount && oldPrice > 0 ? Math.round(((oldPrice - currentPrice) / oldPrice) * 100) : 0;
                  const sizeLabel = (primaryVariant as any)?.size || (primaryVariant?.name && !primaryVariant.name.toLowerCase().includes("default") ? primaryVariant.name : "");

                  return (
                    <div key={p.id} className="product-card" style={{ backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", overflow: "hidden", display: "flex", flexDirection: "column", justifyContent: "space-between", position: "relative" }}>
                      {hasDiscount && discountPercent > 0 && (
                        <div style={{ backgroundColor: "#e2136e", color: "#fff", fontSize: "11px", fontWeight: "800", padding: "4px 10px", borderRadius: "0 0 10px 0", position: "absolute", top: 0, left: 0, zIndex: 5 }}>
                          {discountPercent}% OFF
                        </div>
                      )}

                      <div className={`wishlist-btn ${wishlist.includes(p.id) ? "active" : ""}`} onClick={() => toggleWishlist(p.id)}>
                        <svg fill={wishlist.includes(p.id) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="18" height="18">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                        </svg>
                      </div>
                      <Link href={getProductUrl(p)} className="card-image" style={{ height: "230px", backgroundColor: "#ffffff", padding: "16px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <img src={primaryImage} alt={p.name} loading="lazy" onError={(e) => { (e.currentTarget as HTMLImageElement).src = FALLBACK_PRODUCT_IMG; }} style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }} />
                      </Link>
                      <div className="card-body" style={{ padding: "12px 14px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", flex: 1, justifyContent: "space-between" }}>
                        <Link href={getProductUrl(p)} className="card-title" style={{ fontSize: "14px", fontWeight: "600", color: "#1e293b", textDecoration: "none", lineHeight: "1.3", marginBottom: "8px", height: "38px", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                          {p.name}
                        </Link>
                        <span style={{ backgroundColor: "#10b981", color: "#ffffff", fontSize: "10px", fontWeight: "900", padding: "3px 12px", borderRadius: "12px", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>
                          JUST ARRIVED
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
                        {sizeLabel && (
                          <div style={{ fontSize: "13px", fontWeight: "700", color: "#1e293b", marginBottom: "10px" }}>
                            {sizeLabel}
                          </div>
                        )}
                      </div>
                      <button
                        className="add-to-cart-btn"
                        onClick={() => handleAddToCart(p)}
                        disabled={addingToCartId === p.id}
                        style={{
                          backgroundColor: addingToCartId === p.id ? "#059669" : "#581c87",
                          color: "#ffffff",
                          border: "none",
                          padding: "12px",
                          fontWeight: "800",
                          fontSize: "13px",
                          letterSpacing: "0.5px",
                          cursor: addingToCartId === p.id ? "default" : "pointer",
                          width: "100%",
                          borderRadius: "0 0 12px 12px",
                          transition: "all 0.2s ease"
                        }}
                      >
                        {addingToCartId === p.id ? "✓ ADDED!" : "ADD TO CART"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })()}

        {/* SHOP BY CONCERN Section */}
        <section style={{ margin: "20px 0 10px 0" }}>
          <h2 style={{ fontSize: "14px", fontWeight: "800", textAlign: "center", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: "20px", color: "#000" }}>
            SHOP BY CONCERN
          </h2>
          <div className="concerns-grid">
            {[
              { id: "Concern: Acne", title: "Acne Treatment", icon: "🌿", color: "#ecfdf5", border: "#a7f3d0", link: "/shop?category=skincare&sub=Acne%20Treatment", extra: false },
              { id: "Concern: Anti Aging", title: "Anti Aging Treatment", icon: "✨", color: "#fffbeb", border: "#fde68a", link: "/shop?category=skincare&sub=Anti%20Aging", extra: false },
              { id: "Concern: Dandruff", title: "Dandruff Solution", icon: "💧", color: "#eff6ff", border: "#bfdbfe", link: "/shop?category=haircare&sub=Dandruff", extra: false },
              { id: "Concern: Dry Skin", title: "Dry Skin Treatment", icon: "🧴", color: "#fef2f2", border: "#fecaca", link: "/shop?category=skincare&sub=Dry%20Skin", extra: false },
              { id: "Concern: Hair Fall", title: "Hair Fall Treatment", icon: "💇‍♀️", color: "#faf5ff", border: "#e9d5ff", link: "/shop?category=haircare&sub=Hair%20Fall", extra: true },
              { id: "Concern: Oil Control", title: "Oil Control Treatment", icon: "🍃", color: "#f0fdf4", border: "#bbf7d0", link: "/shop?category=skincare", extra: true },
              { id: "Concern: Pore Care", title: "Pore Care", icon: "🫧", color: "#f0f9ff", border: "#bae6fd", link: "/shop?category=skincare&sub=Pore%20Care", extra: true },
              { id: "Concern: Spot Treatment", title: "Spot Treatment", icon: "🎯", color: "#fdf4ff", border: "#f5d0fe", link: "/shop?category=skincare", extra: true },
              { id: "Concern: Hair Thinning", title: "Hair Thinning Solution", icon: "🌾", color: "#fff7ed", border: "#fed7aa", link: "/shop?category=haircare", extra: true },
              { id: "Concern: Sun Burn", title: "Sun Burn Treatment", icon: "☀️", color: "#fff1f2", border: "#fecdd3", link: "/shop?category=skincare", extra: true }
            ].map((concern) => {
              const banner = getBannerForPage(concern.id, "", concern.title, concern.link);
              return (
                <Link
                  key={concern.id}
                  href={banner.link}
                  style={{ display: "block", overflow: "hidden", borderRadius: "10px", textDecoration: "none" }}
                  className={`promo-card-hover ${concern.extra ? "concern-card-extra" : ""}`}
                >
                  {banner.img ? (
                    <img
                      src={banner.img}
                      alt={concern.title}
                      style={{ width: "100%", height: "auto", aspectRatio: "1 / 1", objectFit: "cover", display: "block", borderRadius: "10px" }}
                    />
                  ) : (
                    <div style={{
                      aspectRatio: "1 / 1",
                      backgroundColor: concern.color,
                      border: `1.5px solid ${concern.border}`,
                      borderRadius: "10px",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "10px",
                      boxShadow: "0 2px 6px rgba(0,0,0,0.03)"
                    }}>
                      <span style={{ fontSize: "24px", marginBottom: "4px" }}>{concern.icon}</span>
                      <span style={{ fontSize: "11px", fontWeight: "800", color: "#1e293b", textAlign: "center", lineHeight: "1.2" }}>{concern.title}</span>
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        </section>

      </main>

      <Footer />
      <MobileNavbar />

      {/* Shajgoj-style Android Promotional Push Notification Card */}
      {showNotification && activeNotification && (
        <div style={{
          position: "fixed",
          bottom: "85px",
          right: "20px",
          width: "360px",
          maxWidth: "calc(100vw - 32px)",
          backgroundColor: "#ffffff",
          boxShadow: "0 14px 35px rgba(0, 0, 0, 0.22), 0 0 0 1px rgba(226, 19, 110, 0.15)",
          borderRadius: "20px",
          overflow: "hidden",
          zIndex: 10000,
          display: "flex",
          flexDirection: "column",
          animation: "slideInUp 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
          fontFamily: "inherit"
        }}>
          {/* Android Notification Header row */}
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 16px 8px 16px",
            backgroundColor: "#fff5f8",
            borderBottom: "1px solid #fce7ef"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{
                width: "28px",
                height: "28px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #e2136e 0%, #ff5292 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff",
                fontWeight: "900",
                fontSize: "13px",
                boxShadow: "0 2px 6px rgba(226,19,110,0.3)"
              }}>
                G
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ fontSize: "13px", fontWeight: "800", color: "#1e293b" }}>GlowGoodly</span>
                <span style={{ fontSize: "11px", color: "#94a3b8" }}>•</span>
                <span style={{ fontSize: "11px", fontWeight: "600", color: "#64748b" }}>Live Offer</span>
              </div>
            </div>
            <button 
              onClick={() => {
                localStorage.setItem("glowgoodly_last_notification_closed", activeNotification.id);
                setShowNotification(false);
              }}
              aria-label="Close notification"
              style={{
                background: "#ffffff",
                border: "1px solid #f1f5f9",
                borderRadius: "50%",
                width: "24px",
                height: "24px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "14px",
                fontWeight: "bold",
                color: "#64748b",
                cursor: "pointer",
                boxShadow: "0 1px 3px rgba(0,0,0,0.08)"
              }}
            >
              ×
            </button>
          </div>

          {/* Optional Banner Image */}
          {activeNotification.imageUrl && !activeNotification.imageUrl.includes("shop.glowgoodly.com") && (
            <div style={{ width: "100%", height: "130px", overflow: "hidden", backgroundColor: "#f8fafc" }}>
              <img 
                src={safeImageUrl(activeNotification.imageUrl, FALLBACK_PRODUCT_IMG)} 
                alt="Promo Banner" 
                style={{ width: "100%", height: "100%", objectFit: "cover" }} 
              />
            </div>
          )}

          {/* Notification Body */}
          <div style={{ padding: "14px 16px 16px 16px", display: "flex", flexDirection: "column", gap: "8px" }}>
            <h4 style={{
              margin: 0,
              fontSize: "15px",
              fontWeight: "900",
              color: "#0f172a",
              lineHeight: "1.35",
              letterSpacing: "-0.2px"
            }}>
              {activeNotification.title}
            </h4>
            <p style={{
              margin: 0,
              fontSize: "13px",
              color: "#475569",
              fontWeight: "500",
              lineHeight: "1.45"
            }}>
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
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  background: "linear-gradient(135deg, #e2136e 0%, #d81b60 100%)",
                  color: "#ffffff",
                  padding: "10px 16px",
                  borderRadius: "12px",
                  fontSize: "13px",
                  fontWeight: "800",
                  textDecoration: "none",
                  marginTop: "6px",
                  boxShadow: "0 4px 14px rgba(226,19,110,0.35)",
                  transition: "transform 0.15s ease"
                }}
              >
                <span>অর্ডার করুন এখনই</span>
                <span style={{ fontSize: "14px" }}>🛍️</span>
              </Link>
            )}
          </div>
          <style>{`
            @keyframes slideInUp {
              from { transform: translateY(20px); opacity: 0; }
              to { transform: translateY(0); opacity: 1; }
            }
          `}</style>
        </div>
      )}
    </>
  );
}
