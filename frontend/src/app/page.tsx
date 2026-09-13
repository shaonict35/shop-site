"use client";

import React, { useEffect, useState } from "react";
import { fetchWithCache, API_BASE, getProductUrl, subscribeToDataSync } from "../utils/api";
import { registerFcmToken } from "../utils/fcm";

import Header from "../components/Header";
import PromoBanner from "../components/PromoBanner";
import MobileNavbar from "../components/MobileNavbar";
import Footer from "../components/Footer";
import { useApp } from "../context/AppContext";
import Link from "next/link";
import GlowLoader from "../components/GlowLoader";

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

const DEFAULT_BEAUTY_CATEGORIES = [
  { id: "cat-makeup", name: "Makeup", slug: "makeup", image: "" },
  { id: "cat-skincare", name: "Skin Care", slug: "skincare", image: "" },
  { id: "cat-haircare", name: "Hair Care", slug: "haircare", image: "" },
  { id: "cat-personal-care", name: "Personal Care", slug: "personal-care", image: "" },
  { id: "cat-mom-baby", name: "Mom & Baby", slug: "mom-baby", image: "" },
  { id: "cat-fragrance", name: "Fragrance", slug: "fragrance", image: "" },
  { id: "cat-undergarments", name: "Undergarments", slug: "undergarments", image: "" },
  { id: "cat-kbeauty", name: "K-Beauty", slug: "k-beauty", image: "" }
];

const DEFAULT_HERO_SLIDES = [
  {
    id: "hero-slide-1",
    title: "Nirvana #1 Makeup Brand from Bangladesh",
    desc: "Unleash your true color with authentic Nirvana collection.",
    bg: "linear-gradient(135deg, #111827 0%, #1f2937 100%)",
    img: "/images/sliders/slider-1.png",
    mobileImg: "/images/sliders/slider-1.png",
    tabletImg: "/images/sliders/slider-1.png",
    link: "/shop?brand=nirvana"
  },
  {
    id: "hero-slide-2",
    title: "July Jaw Droppers - Up to 45% Off",
    desc: "Unilever presents mega discounts on Pond's, Lux, Vaseline & Closeup.",
    bg: "linear-gradient(135deg, #e9d5ff 0%, #f3e8ff 100%)",
    img: "/images/sliders/slider-2.png",
    mobileImg: "/images/sliders/slider-2.png",
    tabletImg: "/images/sliders/slider-2.png",
    link: "/shop?deal=jaw-droppers"
  },
  {
    id: "hero-slide-3",
    title: "Treasure of Glow - Free Delivery",
    desc: "Free delivery on orders of 1999+ and up to 35% off on CeraVe, St. Ives & Dove.",
    bg: "linear-gradient(135deg, #fef3c7 0%, #fffbeb 100%)",
    img: "/images/sliders/slider-3.png",
    mobileImg: "/images/sliders/slider-3.png",
    tabletImg: "/images/sliders/slider-3.png",
    link: "/shop?deal=treasure-of-glow"
  }
];

const DEFAULT_HOMEPAGE_BANNERS = [
  // Homepage Wide Banner (Original Beauty Must Haves banner)
  {
    id: "default-wide-banner",
    title: "Beauty Must Haves Exclusive Savings",
    page: "Homepage Wide Banner",
    imageUrl: "/hero-slide-1.png",
    linkUrl: "/shop",
    isActive: true
  },
  // Deals You Cannot Miss (4 Cards)
  {
    id: "default-deal-1",
    title: "Deal Card 1 - Ombre 30% Off",
    page: "Deal Card 1",
    imageUrl: "/images/deals/deal-1.png",
    linkUrl: "/shop?deal=ombre",
    isActive: true
  },
  {
    id: "default-deal-2",
    title: "Deal Card 2 - Marico Free Delivery",
    page: "Deal Card 2",
    imageUrl: "/images/deals/deal-2.png",
    linkUrl: "/shop?deal=marico",
    isActive: true
  },
  {
    id: "default-deal-3",
    title: "Deal Card 3 - PNS Campaign",
    page: "Deal Card 3",
    imageUrl: "/images/deals/deal-3.gif",
    linkUrl: "/shop?deal=pns",
    isActive: true
  },
  {
    id: "default-deal-4",
    title: "Deal Card 4 - Senora Deal",
    page: "Deal Card 4",
    imageUrl: "/images/deals/deal-4.jpg",
    linkUrl: "/shop?deal=senora",
    isActive: true
  },
  // Top Brands & Offers (4 Cards)
  {
    id: "default-brand-1",
    title: "Brand Offer 1 - The Ordinary",
    page: "Brand Offer 1",
    imageUrl: "/images/brands/brand-offer-1.png",
    linkUrl: "/shop?brand=the-ordinary",
    isActive: true
  },
  {
    id: "default-brand-2",
    title: "Brand Offer 2 - Skin Cafe",
    page: "Brand Offer 2",
    imageUrl: "/images/brands/brand-offer-2.gif",
    linkUrl: "/shop?brand=skin-cafe",
    isActive: true
  },
  {
    id: "default-brand-5",
    title: "Brand Offer 5 - Treasure of Glow",
    page: "Brand Offer 5",
    imageUrl: "/images/brands/brand-offer-5.png",
    linkUrl: "/shop?brand=treasure-of-glow",
    isActive: true
  },
  {
    id: "default-brand-6",
    title: "Brand Offer 6 - Trimmer Offer",
    page: "Brand Offer 6",
    imageUrl: "/images/brands/brand-offer-6.gif",
    linkUrl: "/shop?category=trimmer",
    isActive: true
  },
  // Limited Time Offers (4 Cards)
  {
    id: "default-bogo",
    title: "BOGO Offer",
    page: "BOGO",
    imageUrl: "/images/deals/deal-1.png",
    linkUrl: "/shop?campaign=BOGO",
    isActive: true
  },
  {
    id: "default-combo",
    title: "COMBO Offer",
    page: "COMBO",
    imageUrl: "/images/deals/deal-2.png",
    linkUrl: "/shop?campaign=COMBO",
    isActive: true
  },
  {
    id: "default-offers",
    title: "OFFERS Mega Savings",
    page: "OFFERS",
    imageUrl: "/images/deals/deal-3.gif",
    linkUrl: "/shop?campaign=OFFERS",
    isActive: true
  },
  {
    id: "default-clearance",
    title: "Clearance SALE Deals",
    page: "Clearance SALE",
    imageUrl: "/images/deals/deal-4.jpg",
    linkUrl: "/shop?campaign=Clearance%20SALE",
    isActive: true
  }
];

export default function Home() {
  const { addToCart, wishlist, toggleWishlist } = useApp();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>(DEFAULT_BEAUTY_CATEGORIES);
  const [brands, setBrands] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [dynamicSlides, setDynamicSlides] = useState<any[]>(DEFAULT_HERO_SLIDES);
  const [homepageBanners, setHomepageBanners] = useState<any[]>(DEFAULT_HOMEPAGE_BANNERS);

  const getBannerForPage = (identifier: string, fallbackImg: string, fallbackTitle: string, fallbackLink: string = "#") => {
    const term = (identifier || "").toLowerCase().trim();
    const found = homepageBanners.find((b: any) => {
      const p = (b.page || "").toLowerCase().trim();
      const id = (b.id || "").toLowerCase().trim();
      return p === term || id === term || (term.length > 5 && p.includes(term));
    });
    const rawImg = found ? (found.imageUrl || found.image) : "";
    const isHeroSliderImg = Boolean(rawImg && rawImg.includes("/images/sliders/"));
    const isIconSection = term.startsWith("category:") || term.startsWith("concern:");
    const isValidImg = Boolean(rawImg && (rawImg.startsWith("http") || rawImg.startsWith("/") || rawImg.startsWith("data:")) && !(isIconSection && isHeroSliderImg));
    return {
      img: isValidImg ? rawImg : fallbackImg,
      mobileImg: (found && found.mobileImageUrl) ? found.mobileImageUrl : (isValidImg ? rawImg : fallbackImg),
      tabletImg: (found && found.tabletImageUrl) ? found.tabletImageUrl : (isValidImg ? rawImg : fallbackImg),
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
    return "/cosmetics_circle_illustration.png";
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

  const activeSlidesList = dynamicSlides;

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
        // Keep Categories, Hero Slides, and Banners on static fixed designs
        setCategories(DEFAULT_BEAUTY_CATEGORIES);
        setDynamicSlides(DEFAULT_HERO_SLIDES);
        setHomepageBanners(DEFAULT_HOMEPAGE_BANNERS);

        // Optional non-intrusive notification banner check
        const notifRes = await fetchWithCache(`${API_BASE}/notifications/active`, bypass).catch(() => null);
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
    fetchMetadata();

    return subscribeToDataSync(() => fetchMetadata(true));
  }, []);

  // Fetch filtered products
  useEffect(() => {
    const fetchProducts = async (bypass: boolean = false) => {
      try {
        let url = `${API_BASE}/products?includeAll=true&`;
        if (activeCategory) url += `category=${activeCategory}&`;
        if (activeBrand) url += `brand=${activeBrand}&`;
        if (searchQuery) url += `search=${encodeURIComponent(searchQuery)}&`;
        if (minPrice) url += `minPrice=${minPrice}&`;
        if (maxPrice) url += `maxPrice=${maxPrice}&`;
        if (sortOption) url += `sort=${sortOption}&`;
        url += `t=${Date.now()}`;

        const data = await fetchWithCache(url, true);
        setProducts(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error("Error loading products", e);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();

    return subscribeToDataSync(() => fetchProducts(true));
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

      {/* Full-width Dynamic Promotional Banner Slider - Responsive Hero Slider */}
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
              backgroundColor: "#fcf8fa",
            }}
          >
            <div style={{ position: "relative", width: "100%", display: "block" }}>
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
                        width: "10px",
                        height: "10px",
                        borderRadius: "50%",
                        backgroundColor: safeSlideIdx === idx ? "#e63b7a" : "rgba(255, 255, 255, 0.6)",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
                        cursor: "pointer",
                        transition: "all 0.2s",
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          </section>
        );
      })()}

      <main className="container" style={{ paddingBottom: "40px", paddingTop: "20px" }}>

        {/* Wide horizontal promo banner ad with Mobile & Tablet responsiveness */}
        {(() => {
          const wideBanner = getBannerForPage("Homepage Wide Banner", "/hero-slide-1.png", "Beauty Must Haves Exclusive Savings", "/shop");
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

        {/* Loading Products Indicator */}
        {loading && products.length === 0 && (
          <div style={{ margin: "40px 0" }}>
            <GlowLoader text="Loading Products..." subtext="Authentic Skincare & Cosmetics" />
          </div>
        )}

        {/* MAKEUP Section */}
        {(() => {
          const makeupProducts = products
            .filter(p => p.category?.name?.toLowerCase().includes("makeup") || p.name?.toLowerCase().includes("lipstick") || p.name?.toLowerCase().includes("mascara") || p.name?.toLowerCase().includes("powder") || p.name?.toLowerCase().includes("foundation") || p.name?.toLowerCase().includes("primer"))
            .slice(0, 4);

          if (makeupProducts.length === 0) return null;

          return (
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
                {makeupProducts.map((p) => {
                  const primaryImage = p.images?.find((img) => img.isPrimary)?.url || p.images?.[0]?.url || "";
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
                        <img src={primaryImage} alt={p.name} style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }} />
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
                          ★ ★ ★ ★ <span style={{ color: "#cbd5e1" }}>★</span>
                        </div>
                        {sizeLabel && (
                          <div style={{ fontSize: "13px", fontWeight: "700", color: "#1e293b", marginBottom: "10px" }}>
                            {sizeLabel}
                          </div>
                        )}
                      </div>
                      <button className="add-to-cart-btn" onClick={() => handleAddToCart(p)} style={{ backgroundColor: "#581c87", color: "#ffffff", border: "none", padding: "12px", fontWeight: "800", fontSize: "13px", letterSpacing: "0.5px", cursor: "pointer", width: "100%", borderRadius: "0 0 12px 12px" }}>
                        ADD TO CART
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
            <Link href={getBannerForPage("Deal Card 1", "/images/deals/deal-1.png", "Ombre 30% Off", "/shop?deal=ombre").link} style={{ display: "block", overflow: "hidden", borderRadius: "8px" }} className="promo-card-hover">
              <img 
                src={getBannerForPage("Deal Card 1", "/images/deals/deal-1.png", "Ombre 30% Off").img} 
                onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/images/deals/deal-1.png"; }}
                alt="Deal Card 1" 
                style={{ width: "100%", height: "auto", aspectRatio: "1/1", objectFit: "cover", display: "block" }} 
              />
            </Link>
            {/* Card 2 */}
            <Link href={getBannerForPage("Deal Card 2", "/images/deals/deal-2.png", "Marico Free Delivery", "/shop?deal=marico").link} style={{ display: "block", overflow: "hidden", borderRadius: "8px" }} className="promo-card-hover">
              <img 
                src={getBannerForPage("Deal Card 2", "/images/deals/deal-2.png", "Marico Free Delivery").img} 
                onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/images/deals/deal-2.png"; }}
                alt="Deal Card 2" 
                style={{ width: "100%", height: "auto", aspectRatio: "1/1", objectFit: "cover", display: "block" }} 
              />
            </Link>
            {/* Card 3 */}
            <Link href={getBannerForPage("Deal Card 3", "/images/deals/deal-3.gif", "PNS Campaign", "/shop?deal=pns").link} style={{ display: "block", overflow: "hidden", borderRadius: "8px" }} className="promo-card-hover">
              <img 
                src={getBannerForPage("Deal Card 3", "/images/deals/deal-3.gif", "PNS Campaign").img} 
                onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/images/deals/deal-3.gif"; }}
                alt="Deal Card 3" 
                style={{ width: "100%", height: "auto", aspectRatio: "1/1", objectFit: "cover", display: "block" }} 
              />
            </Link>
            {/* Card 4 */}
            <Link href={getBannerForPage("Deal Card 4", "/images/deals/deal-4.jpg", "Senora Deal", "/shop?deal=senora").link} style={{ display: "block", overflow: "hidden", borderRadius: "8px" }} className="promo-card-hover">
              <img 
                src={getBannerForPage("Deal Card 4", "/images/deals/deal-4.jpg", "Senora Deal").img} 
                onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/images/deals/deal-4.jpg"; }}
                alt="Deal Card 4" 
                style={{ width: "100%", height: "auto", aspectRatio: "1/1", objectFit: "cover", display: "block" }} 
              />
            </Link>
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
                  const primaryImage = p.images?.find((img) => img.isPrimary)?.url || p.images?.[0]?.url || "";
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
                        <img src={primaryImage} alt={p.name} style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }} />
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
                      <button className="add-to-cart-btn" onClick={() => handleAddToCart(p)} style={{ backgroundColor: "#581c87", color: "#ffffff", border: "none", padding: "12px", fontWeight: "800", fontSize: "13px", letterSpacing: "0.5px", cursor: "pointer", width: "100%", borderRadius: "0 0 12px 12px" }}>
                        ADD TO CART
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
            <Link href={getBannerForPage("Brand Offer 1", "/images/brands/brand-offer-1.png", "The Ordinary", "/shop?brand=the-ordinary").link} style={{ display: "block", overflow: "hidden", borderRadius: "10px", transition: "transform 0.2s ease" }} className="promo-card-hover">
              <img 
                src={getBannerForPage("Brand Offer 1", "/images/brands/brand-offer-1.png", "The Ordinary").img} 
                onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/images/brands/brand-offer-1.png"; }}
                alt="Brand Offer 1 - The Ordinary" 
                style={{ width: "100%", height: "auto", display: "block", borderRadius: "10px" }} 
              />
            </Link>
            {/* Banner 2 */}
            <Link href={getBannerForPage("Brand Offer 2", "/images/brands/brand-offer-2.gif", "Skin Cafe", "/shop?brand=skin-cafe").link} style={{ display: "block", overflow: "hidden", borderRadius: "10px", transition: "transform 0.2s ease" }} className="promo-card-hover">
              <img 
                src={getBannerForPage("Brand Offer 2", "/images/brands/brand-offer-2.gif", "Skin Cafe").img} 
                onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/images/brands/brand-offer-2.gif"; }}
                alt="Brand Offer 2 - Skin Cafe" 
                style={{ width: "100%", height: "auto", display: "block", borderRadius: "10px" }} 
              />
            </Link>
            {/* Banner 5 */}
            <Link href={getBannerForPage("Brand Offer 5", "/images/brands/brand-offer-5.png", "Treasure of Glow", "/shop?brand=treasure-of-glow").link} style={{ display: "block", overflow: "hidden", borderRadius: "10px", transition: "transform 0.2s ease" }} className="promo-card-hover">
              <img 
                src={getBannerForPage("Brand Offer 5", "/images/brands/brand-offer-5.png", "Treasure of Glow").img} 
                onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/images/brands/brand-offer-5.png"; }}
                alt="Brand Offer 5 - Treasure of Glow" 
                style={{ width: "100%", height: "auto", display: "block", borderRadius: "10px" }} 
              />
            </Link>
            {/* Banner 6 */}
            <Link href={getBannerForPage("Brand Offer 6", "/images/brands/brand-offer-6.gif", "Trimmer Offer", "/shop?category=trimmer").link} style={{ display: "block", overflow: "hidden", borderRadius: "10px", transition: "transform 0.2s ease" }} className="promo-card-hover">
              <img 
                src={getBannerForPage("Brand Offer 6", "/images/brands/brand-offer-6.gif", "Trimmer Offer").img} 
                onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/images/brands/brand-offer-6.gif"; }}
                alt="Brand Offer 6 - Trimmer Offer" 
                style={{ width: "100%", height: "auto", display: "block", borderRadius: "10px" }} 
              />
            </Link>
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
                  const primaryImage = p.images?.find((img) => img.isPrimary)?.url || p.images?.[0]?.url || "";
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
                        <img src={primaryImage} alt={p.name} style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }} />
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
                      <button className="add-to-cart-btn" onClick={() => handleAddToCart(p)} style={{ backgroundColor: "#581c87", color: "#ffffff", border: "none", padding: "12px", fontWeight: "800", fontSize: "13px", letterSpacing: "0.5px", cursor: "pointer", width: "100%", borderRadius: "0 0 12px 12px" }}>
                        ADD TO CART
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
            <Link href={getBannerForPage("BOGO", "", "", "/shop?campaign=BOGO").link} style={{ display: "block", overflow: "hidden", borderRadius: "8px" }} className="promo-card-hover">
              <img src={getBannerForPage("BOGO", "/images/deals/deal-1.png", "").img} alt="BOGO Offer" style={{ width: "100%", height: "auto", aspectRatio: "1/1", objectFit: "cover", display: "block" }} />
            </Link>
            {/* Card 2: COMBO */}
            <Link href={getBannerForPage("COMBO", "", "", "/shop?campaign=COMBO").link} style={{ display: "block", overflow: "hidden", borderRadius: "8px" }} className="promo-card-hover">
              <img src={getBannerForPage("COMBO", "/images/deals/deal-2.png", "").img} alt="COMBO Offer" style={{ width: "100%", height: "auto", aspectRatio: "1/1", objectFit: "cover", display: "block" }} />
            </Link>
            {/* Card 3: OFFERS */}
            <Link href={getBannerForPage("OFFERS", "", "", "/shop?campaign=OFFERS").link} style={{ display: "block", overflow: "hidden", borderRadius: "8px" }} className="promo-card-hover">
              <img src={getBannerForPage("OFFERS", "/images/deals/deal-3.gif", "").img} alt="OFFERS" style={{ width: "100%", height: "auto", aspectRatio: "1/1", objectFit: "cover", display: "block" }} />
            </Link>
            {/* Card 4: Clearance SALE */}
            <Link href={getBannerForPage("Clearance SALE", "", "", "/shop?campaign=Clearance%20SALE").link} style={{ display: "block", overflow: "hidden", borderRadius: "8px" }} className="promo-card-hover">
              <img src={getBannerForPage("Clearance SALE", "/images/deals/deal-4.jpg", "").img} alt="Clearance SALE Offer" style={{ width: "100%", height: "auto", aspectRatio: "1/1", objectFit: "cover", display: "block" }} />
            </Link>
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
                  const primaryImage = p.images?.find((img) => img.isPrimary)?.url || p.images?.[0]?.url || "";
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
                        <img src={primaryImage} alt={p.name} style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }} />
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
                      <button className="add-to-cart-btn" onClick={() => handleAddToCart(p)} style={{ backgroundColor: "#581c87", color: "#ffffff", border: "none", padding: "12px", fontWeight: "800", fontSize: "13px", letterSpacing: "0.5px", cursor: "pointer", width: "100%", borderRadius: "0 0 12px 12px" }}>
                        ADD TO CART
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })()}

        {/* SHOP BEAUTY PRODUCTS BY CATEGORY Section */}
        <section style={{ margin: "40px 0" }}>
          <h2 style={{ fontSize: "14px", fontWeight: "800", textAlign: "center", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: "20px", color: "#000" }}>
            SHOP BEAUTY PRODUCTS BY CATEGORY
          </h2>
          <div className="categories-grid">
            {[
              { name: "Makeup", icon: "💄", color: "#fdf2f8", border: "#fbcfe8", link: "/shop?category=makeup" },
              { name: "Skin", icon: "✨", color: "#f0fdf4", border: "#bbf7d0", link: "/shop?category=skincare" },
              { name: "Hair", icon: "💇‍♀️", color: "#eff6ff", border: "#bfdbfe", link: "/shop?category=haircare" },
              { name: "Personal Care", icon: "🧴", color: "#faf5ff", border: "#e9d5ff", link: "/shop?category=personal-care" },
              { name: "Mom & Baby", icon: "🍼", color: "#fffbeb", border: "#fde68a", link: "/shop?category=mom-baby" },
              { name: "Fragrance", icon: "🌸", color: "#fff1f2", border: "#fecdd3", link: "/shop?category=fragrance" },
              { name: "Undergarments", icon: "👙", color: "#f5f3ff", border: "#ddd6fe", link: "/shop?category=undergarments" },
              { name: "Combo", icon: "🎁", color: "#fefce8", border: "#fef08a", link: "/shop?category=combo" }
            ].map((cat: any) => {
              const bannerInfo = getBannerForPage(`Category: ${cat.name}`, "", cat.name, cat.link);
              return (
                <Link 
                  key={cat.name} 
                  href={bannerInfo.link} 
                  style={{ display: "block", borderRadius: "10px", overflow: "hidden", cursor: "pointer", textDecoration: "none" }} 
                  className="promo-card-hover"
                >
                  {bannerInfo.img ? (
                    <img 
                      src={bannerInfo.img} 
                      alt={cat.name} 
                      style={{ width: "100%", height: "auto", aspectRatio: "1 / 1", objectFit: "cover", display: "block", borderRadius: "10px" }} 
                    />
                  ) : (
                    <div style={{
                      aspectRatio: "1 / 1",
                      backgroundColor: cat.color,
                      border: `1.5px solid ${cat.border}`,
                      borderRadius: "10px",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "10px",
                      boxShadow: "0 2px 6px rgba(0,0,0,0.03)"
                    }}>
                      <span style={{ fontSize: "26px", marginBottom: "4px" }}>{cat.icon}</span>
                      <span style={{ fontSize: "12px", fontWeight: "800", color: "#0f172a", textAlign: "center", lineHeight: "1.2" }}>{cat.name}</span>
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        </section>

        {/* CLEARANCE SALE Section */}
        {(() => {
          const clearanceProducts = products
            .filter(p => p.category?.name?.toLowerCase().includes("clearance") || p.name?.toLowerCase().includes("clearance") || p.campaignName === "CLEARANCE")
            .slice(0, 4);

          if (clearanceProducts.length === 0) return null;

          return (
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
                {clearanceProducts.map((p, idx) => {
                  const primaryImage = p.images?.find((img) => img.isPrimary)?.url || p.images?.[0]?.url || "";
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
                        <img src={primaryImage} alt={p.name} style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }} />
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
                          ★ ★ ★ ★ <span style={{ color: "#cbd5e1" }}>★</span>
                        </div>
                        {sizeLabel && (
                          <div style={{ fontSize: "13px", fontWeight: "700", color: "#1e293b", marginBottom: "10px" }}>
                            {sizeLabel}
                          </div>
                        )}
                      </div>
                      <button className="add-to-cart-btn" onClick={() => handleAddToCart(p)} style={{ backgroundColor: "#581c87", color: "#ffffff", border: "none", padding: "12px", fontWeight: "800", fontSize: "13px", letterSpacing: "0.5px", cursor: "pointer", width: "100%", borderRadius: "0 0 12px 12px" }}>
                        ADD TO CART
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
