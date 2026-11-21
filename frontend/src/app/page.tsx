"use client";

import React, { useEffect, useState } from "react";
import { fetchWithCache, API_BASE, API_ROOT, getProductUrl, subscribeToDataSync, safeImageUrl } from "../utils/api";
import { registerFcmToken } from "../utils/fcm";
import { io } from "socket.io-client";
import defaultHomepageBanners from "../data/homepage-banners.json";

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
  return safeImageUrl(raw, FALLBACK_PRODUCT_IMG, p?.updatedAt);
};

export default function Home() {
  const { addToCart, wishlist, toggleWishlist } = useApp();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [dynamicSlides, setDynamicSlides] = useState<any[]>([]);
  const [homepageBanners, setHomepageBanners] = useState<any[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem("gg_synced_homepage_banners");
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch (e) {}
    }
    return [
      ...(defaultHomepageBanners.dealsYouCannotMiss || []),
      ...(defaultHomepageBanners.topBrandsOffers || []),
      ...(defaultHomepageBanners.limitedTimeOffers || []),
      ...(defaultHomepageBanners.shopByCategory || []),
      ...(defaultHomepageBanners.shopByConcern || [])
    ];
  });
  const [dynamicSections, setDynamicSections] = useState<Record<string, any[]>>(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem("gg_synced_dynamic_sections");
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && typeof parsed === "object") return parsed;
        }
      } catch (e) {}
    }
    return {
      DEALS_YOU_CANNOT_MISS: defaultHomepageBanners.dealsYouCannotMiss || [],
      TOP_BRANDS_OFFERS: defaultHomepageBanners.topBrandsOffers || [],
      LIMITED_TIME_OFFERS: defaultHomepageBanners.limitedTimeOffers || [],
      SHOP_BY_CATEGORY: defaultHomepageBanners.shopByCategory || [],
      SHOP_BY_CONCERN: defaultHomepageBanners.shopByConcern || [],
      PROMO_BANNER: (defaultHomepageBanners as any).promoBanner || [],
    };
  });

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
    let cleanImg = safeImageUrl(rawImg, "");
    if (cleanImg && !cleanImg.startsWith("data:") && found && (found.updatedAt || found.createdAt)) {
      const v = encodeURIComponent(String(found.updatedAt || found.createdAt));
      cleanImg += (cleanImg.includes("?") ? `&v=${v}` : `?v=${v}`);
    }
    const finalImg = cleanImg || fallbackImg;

    let finalMobileImg = safeImageUrl(found && found.mobileImageUrl ? found.mobileImageUrl : finalImg, finalImg);
    if (finalMobileImg && !finalMobileImg.startsWith("data:") && found && (found.updatedAt || found.createdAt)) {
      const v = encodeURIComponent(String(found.updatedAt || found.createdAt));
      finalMobileImg += (finalMobileImg.includes("?") ? `&v=${v}` : `?v=${v}`);
    }

    let finalTabletImg = safeImageUrl(found && found.tabletImageUrl ? found.tabletImageUrl : finalImg, finalImg);
    if (finalTabletImg && !finalTabletImg.startsWith("data:") && found && (found.updatedAt || found.createdAt)) {
      const v = encodeURIComponent(String(found.updatedAt || found.createdAt));
      finalTabletImg += (finalTabletImg.includes("?") ? `&v=${v}` : `?v=${v}`);
    }

    return {
      img: finalImg,
      mobileImg: finalMobileImg,
      tabletImg: finalTabletImg,
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
      return safeImageUrl(found.imageUrl || found.image, undefined, found.updatedAt);
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
        let combinedSlides: any[] = [];
        // 1. Fetch internal local dynamic homepage banners & config (instant & decoupled from backend)
        try {
          const [localBannersRes, heroBannersRes] = await Promise.all([
            fetch(`/api/local-banners?t=${timestamp}`, { cache: "no-store" }).then(r => r.ok ? r.json() : null).catch(() => null),
            fetch(`/api/hero-banners-local?t=${timestamp}`, { cache: "no-store" }).then(r => r.ok ? r.json() : null).catch(() => null),
          ]);

          const heroSource = (Array.isArray(heroBannersRes) && heroBannersRes.length > 0)
            ? heroBannersRes
            : (Array.isArray(localBannersRes?.heroBanners) && localBannersRes.heroBanners.length > 0 ? localBannersRes.heroBanners : []);

          if (heroSource.length > 0) {
            const localHeroSlides = heroSource
              .filter((b: any) => b.isActive !== false)
              .map((b: any, idx: number) => {
                const rawUrl = b.mediaUrl || b.imageUrl || "";
                const isVideoFile = rawUrl.includes(".mp4") || rawUrl.includes(".webm") || rawUrl.includes(".mov");
                const isGifFile = rawUrl.includes(".gif");
                const detectedType = b.mediaType || (isVideoFile ? "video" : isGifFile ? "gif" : "image");
                const resolved = safeImageUrl(rawUrl);
                return {
                  id: b.id || `hero-local-${idx}`,
                  title: b.title || "GlowGoodly",
                  desc: b.subtitle || "",
                  mediaUrl: resolved,
                  mediaType: detectedType,
                  img: resolved,
                  mobileImg: safeImageUrl(b.mobileImageUrl || rawUrl),
                  tabletImg: safeImageUrl(b.tabletImageUrl || rawUrl),
                  link: b.linkUrl || b.ctaLink || "/shop"
                };
              });
            if (localHeroSlides.length > 0) {
              combinedSlides = localHeroSlides;
              setDynamicSlides(combinedSlides);
              if (typeof window !== "undefined") {
                try { localStorage.setItem("gg_synced_dynamic_slides", JSON.stringify(combinedSlides)); } catch (_) {}
              }
            } else {
              setDynamicSlides([]);
              if (typeof window !== "undefined") {
                try { localStorage.removeItem("gg_synced_dynamic_slides"); } catch (_) {}
              }
            }
          } else {
            setDynamicSlides([]);
            if (typeof window !== "undefined") {
              try { localStorage.removeItem("gg_synced_dynamic_slides"); } catch (_) {}
            }
          }

          if (localBannersRes) {
            const newSections = {
              DEALS_YOU_CANNOT_MISS: localBannersRes.dealsYouCannotMiss || defaultHomepageBanners.dealsYouCannotMiss || [],
              TOP_BRANDS_OFFERS: localBannersRes.topBrandsOffers || defaultHomepageBanners.topBrandsOffers || [],
              LIMITED_TIME_OFFERS: localBannersRes.limitedTimeOffers || defaultHomepageBanners.limitedTimeOffers || [],
              SHOP_BY_CATEGORY: localBannersRes.shopByCategory || defaultHomepageBanners.shopByCategory || [],
              SHOP_BY_CONCERN: localBannersRes.shopByConcern || defaultHomepageBanners.shopByConcern || [],
              PROMO_BANNER: localBannersRes.promoBanner || (defaultHomepageBanners as any).promoBanner || [],
            };
            setDynamicSections(newSections);

            const flattenedLocal = [
              ...(localBannersRes.heroBanners || []),
              ...(localBannersRes.dealsYouCannotMiss || []),
              ...(localBannersRes.topBrandsOffers || []),
              ...(localBannersRes.limitedTimeOffers || []),
              ...(localBannersRes.shopByCategory || []),
              ...(localBannersRes.shopByConcern || []),
              ...(localBannersRes.promoBanner || [])
            ];
            setHomepageBanners(flattenedLocal);
            if (typeof window !== "undefined") {
              try {
                localStorage.setItem("gg_synced_homepage_banners", JSON.stringify(flattenedLocal));
                localStorage.setItem("gg_synced_dynamic_sections", JSON.stringify(newSections));
              } catch (_) {}
            }
          }
        } catch (_) {}

        // 2. Fetch backend categories, brands & banners (deduplicated & unified)
        const [categoriesRes, brandsRes, backendBannersRes] = await Promise.all([
          fetchWithCache(`${API_BASE}/categories`, bypass).catch(() => null),
          fetchWithCache(`${API_BASE}/brands`, bypass).catch(() => null),
          fetchWithCache(`${API_BASE}/banners?t=${timestamp}`, bypass).catch(() => null),
        ]);

        if (Array.isArray(categoriesRes) && categoriesRes.length > 0) {
          setCategories(categoriesRes);
        }
        if (Array.isArray(brandsRes) && brandsRes.length > 0) {
          setBrands(brandsRes);
        }

        if (Array.isArray(backendBannersRes) && backendBannersRes.length > 0) {
          setHomepageBanners((prev) => {
            const map = new Map();
            (prev || []).forEach((item: any) => {
              if (item && item.id) map.set(item.id, item);
            });
            backendBannersRes.forEach((b: any) => {
              if (b && b.id) map.set(b.id, { ...(map.get(b.id) || {}), ...b });
            });
            return Array.from(map.values());
          });

          // Also merge into dynamicSections
          setDynamicSections((prev) => {
            const updated = { ...prev };
            backendBannersRes.forEach((b: any) => {
              const p = (b.page || "").toLowerCase();
              const id = (b.id || "").toLowerCase();
              if (p.includes("category") || id.startsWith("cat-card-") || id.startsWith("cat-")) {
                const list = [...(updated.SHOP_BY_CATEGORY || [])];
                const idx = list.findIndex(c => c.id === b.id || (b.title && c.title && c.title.toLowerCase().includes(b.title.toLowerCase())));
                if (idx >= 0) list[idx] = { ...list[idx], ...b };
                else list.push(b);
                updated.SHOP_BY_CATEGORY = list;
              } else if (p.includes("concern") || id.startsWith("concern-card-") || id.startsWith("concern-")) {
                const list = [...(updated.SHOP_BY_CONCERN || [])];
                const idx = list.findIndex(c => c.id === b.id || (b.title && c.title && c.title.toLowerCase().replace(/[^a-z0-9]/g, "").includes(b.title.toLowerCase().replace(/[^a-z0-9]/g, ""))));
                if (idx >= 0) list[idx] = { ...list[idx], ...b };
                else list.push(b);
                updated.SHOP_BY_CONCERN = list;
              } else if (p.includes("deal") || id.startsWith("deal-")) {
                const list = [...(updated.DEALS_YOU_CANNOT_MISS || [])];
                const idx = list.findIndex(c => c.id === b.id);
                if (idx >= 0) list[idx] = { ...list[idx], ...b };
                else list.push(b);
                updated.DEALS_YOU_CANNOT_MISS = list;
              } else if (p.includes("brand offer") || id.startsWith("brand-offer-")) {
                const list = [...(updated.TOP_BRANDS_OFFERS || [])];
                const idx = list.findIndex(c => c.id === b.id);
                if (idx >= 0) list[idx] = { ...list[idx], ...b };
                else list.push(b);
                updated.TOP_BRANDS_OFFERS = list;
              } else if (p.includes("bogo") || p.includes("combo") || p.includes("offers") || p.includes("clearance") || id.startsWith("lto-") || id.startsWith("limited-")) {
                const list = [...(updated.LIMITED_TIME_OFFERS || [])];
                const idx = list.findIndex(c => c.id === b.id);
                if (idx >= 0) list[idx] = { ...list[idx], ...b };
                else list.push(b);
                updated.LIMITED_TIME_OFFERS = list;
              }
            });
            return updated;
          });
        }

        if (combinedSlides.length > 0) {
          setDynamicSlides(combinedSlides);
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

    let socket: any = null;
    try {
      socket = io(API_ROOT, { transports: ["websocket", "polling"], timeout: 6000 });
      socket.on("homepage_sections:updated", () => {
        fetchMetadata(true);
      });
      socket.on("banners:updated", () => {
        fetchMetadata(true);
      });
      socket.on("content_updated", () => {
        fetchMetadata(true);
      });
    } catch (e) {}

    const unsub = subscribeToDataSync(() => fetchMetadata(true));

    return () => {
      unsub();
      if (socket) socket.disconnect();
    };
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
      {activeSlidesList.length > 0 && (() => {
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
                const slideImg = slide?.img || slide?.mediaUrl || "/placeholder-product.svg";
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
                        backgroundColor: addingToCartId === p.id ? "#059669" : "#e63b7a",
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
                      {addingToCartId === p.id ? "✓ ADDED!" : "ADD TO BAG"}
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
                          backgroundColor: addingToCartId === p.id ? "#059669" : "#e63b7a",
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
                        {addingToCartId === p.id ? "✓ ADDED!" : "ADD TO BAG"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })()}

        {/* DEALS YOU CANNOT MISS Section */}
        {(() => {
          const DEFAULT_DEAL_CARDS = [
            { id: "deal-1", title: "Ombre 30% Off", fallbackImg: "/banners/deal-1.png", linkUrl: "/shop?deal=ombre" },
            { id: "deal-2", title: "Serum Flat 25% Off", fallbackImg: "/banners/deal-2.png", linkUrl: "/shop?deal=serum" },
            { id: "deal-3", title: "Lipstick Buy 1 Get 1", fallbackImg: "/banners/deal-3.gif", linkUrl: "/shop?deal=lipstick" },
            { id: "deal-4", title: "Sunscreen Special", fallbackImg: "/banners/deal-4.jpg", linkUrl: "/shop?deal=sunscreen" }
          ];

          const dycmItems = DEFAULT_DEAL_CARDS.map((defCard) => {
            const uploaded = (dynamicSections.DEALS_YOU_CANNOT_MISS || []).find((c: any) => c.id === defCard.id);
            return {
              ...defCard,
              ...(uploaded || {}),
              imageUrl: uploaded?.imageUrl || defCard.fallbackImg,
              linkUrl: uploaded?.linkUrl || defCard.linkUrl,
              updatedAt: uploaded?.updatedAt
            };
          });

          return (
            <section style={{ margin: "30px 0 40px 0" }}>
              <h2 style={{ fontSize: "14px", fontWeight: "800", textAlign: "center", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: "20px", color: "#000" }}>
                DEALS YOU CANNOT MISS
              </h2>
              <div className="dycm-grid">
                {dycmItems.map((item: any, idx: number) => {
                  const img = safeImageUrl(item.imageUrl, item.fallbackImg, item.updatedAt);
                  const link = item.linkUrl || "/shop";
                  return (
                    <Link key={item.id || idx} href={link} style={{ display: "block", overflow: "hidden", borderRadius: "8px" }} className="promo-card-hover">
                      {img ? (
                        <img 
                          src={img} 
                          alt={item.title || `Deal Card ${idx + 1}`} 
                          style={{ width: "100%", height: "auto", aspectRatio: "1/1", objectFit: "cover", display: "block" }} 
                        />
                      ) : (
                        <div style={{ width: "100%", aspectRatio: "1/1", background: "linear-gradient(135deg, #fdf2f8, #fce7f3)", display: "flex", alignItems: "center", justifyContent: "center", color: "#db2777", fontWeight: "800", fontSize: "13px", textAlign: "center", padding: "10px" }}>
                          {item.title || "Special Deal"}
                        </div>
                      )}
                    </Link>
                  );
                })}
              </div>
            </section>
          );
        })()}

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
                          backgroundColor: addingToCartId === p.id ? "#059669" : "#e63b7a",
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
                        {addingToCartId === p.id ? "✓ ADDED!" : "ADD TO BAG"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })()}

        {/* TOP BRANDS & OFFERS Section */}
        {(() => {
          const DEFAULT_BRAND_OFFERS = [
            { id: "brand-offer-1", title: "Beauty Glazed Festive Offer", fallbackImg: "/banners/brand-offer-1.png", linkUrl: "/shop?brand=beauty-glazed" },
            { id: "brand-offer-2", title: "Pudaier Glam Kits", fallbackImg: "/banners/brand-offer-2.gif", linkUrl: "/shop?brand=pudaier" },
            { id: "brand-offer-3", title: "L'Oreal Paris Haircare", fallbackImg: "/banners/brand-offer-5.png", linkUrl: "/shop?brand=loreal" },
            { id: "brand-offer-4", title: "Wet n Wild Essentials", fallbackImg: "/banners/brand-offer-6.gif", linkUrl: "/shop?brand=wet-n-wild" }
          ];

          const brandItems = DEFAULT_BRAND_OFFERS.map((defCard) => {
            const uploaded = (dynamicSections.TOP_BRANDS_OFFERS || []).find((c: any) => c.id === defCard.id);
            return {
              ...defCard,
              ...(uploaded || {}),
              imageUrl: uploaded?.imageUrl || defCard.fallbackImg,
              linkUrl: uploaded?.linkUrl || defCard.linkUrl,
              updatedAt: uploaded?.updatedAt
            };
          });

          return (
            <section style={{ margin: "30px 0" }}>
              <h2 style={{ fontSize: "14px", fontWeight: "800", textAlign: "center", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: "16px", color: "#000" }}>
                TOP BRANDS & OFFERS
              </h2>
              <div className="top-brands-grid">
                {brandItems.map((item: any, idx: number) => {
                  const img = safeImageUrl(item.imageUrl, item.fallbackImg, item.updatedAt);
                  const link = item.linkUrl || "/shop";
                  return (
                    <Link key={item.id || idx} href={link} style={{ display: "block", overflow: "hidden", borderRadius: "10px", transition: "transform 0.2s ease" }} className="promo-card-hover">
                      {img ? (
                        <img 
                          src={img} 
                          alt={item.title || `Brand Offer ${idx + 1}`} 
                          style={{ width: "100%", height: "auto", display: "block", borderRadius: "10px" }} 
                        />
                      ) : (
                        <div style={{ width: "100%", aspectRatio: "1/1", background: "linear-gradient(135deg, #f8fafc, #f1f5f9)", display: "flex", alignItems: "center", justifyContent: "center", color: "#475569", fontWeight: "800", fontSize: "13px", textAlign: "center", padding: "10px", borderRadius: "10px" }}>
                          {item.title || "Brand Offer"}
                        </div>
                      )}
                    </Link>
                  );
                })}
              </div>
            </section>
          );
        })()}

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
                          backgroundColor: addingToCartId === p.id ? "#059669" : "#e63b7a",
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
                        {addingToCartId === p.id ? "✓ ADDED!" : "ADD TO BAG"}
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
                          backgroundColor: addingToCartId === p.id ? "#059669" : "#e63b7a",
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
                        {addingToCartId === p.id ? "✓ ADDED!" : "ADD TO BAG"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })()}

        {/* LIMITED TIME OFFERS Section */}
        {(() => {
          const DEFAULT_LTO_CARDS = [
            { id: "lto-bogo", title: "DOUBLE THE FUN WITH BOGO", fallbackImg: "/banners/offer-bogo.jpg", linkUrl: "/shop?deal=bogo" },
            { id: "lto-combo", title: "PERFECT MATCH COMBO", fallbackImg: "/banners/offer-combo.jpg", linkUrl: "/combos" },
            { id: "lto-exclusive", title: "EXCLUSIVE OFFERS", fallbackImg: "/banners/offer-exclusive.jpg", linkUrl: "/shop?deal=exclusive" },
            { id: "lto-sale", title: "CLEARANCE SALE", fallbackImg: "/banners/offer-sale.jpg", linkUrl: "/shop?category=clearance-sale" }
          ];

          const limitedItems = DEFAULT_LTO_CARDS.map((defCard) => {
            const uploaded = (dynamicSections.LIMITED_TIME_OFFERS || []).find((c: any) => c.id === defCard.id);
            return {
              ...defCard,
              ...(uploaded || {}),
              imageUrl: uploaded?.imageUrl || defCard.fallbackImg,
              linkUrl: uploaded?.linkUrl || defCard.linkUrl,
              updatedAt: uploaded?.updatedAt
            };
          });

          return (
            <section style={{ margin: "40px 0" }}>
              <h2 style={{ fontSize: "14px", fontWeight: "800", textAlign: "center", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: "20px", color: "#000" }}>
                LIMITED TIME OFFERS
              </h2>
              <div className="limited-offers-grid">
                {limitedItems.map((item: any, idx: number) => {
                  const img = safeImageUrl(item.imageUrl, item.fallbackImg, item.updatedAt);
                  const link = item.linkUrl || "/shop";
                  return (
                    <Link key={item.id || idx} href={link} style={{ display: "block", overflow: "hidden", borderRadius: "8px" }} className="promo-card-hover">
                      {img ? (
                        <img 
                          src={img} 
                          alt={item.title || `Offer ${idx + 1}`} 
                          style={{ width: "100%", height: "auto", aspectRatio: "1/1", objectFit: "cover", display: "block" }} 
                        />
                      ) : (
                        <div style={{ width: "100%", aspectRatio: "1/1", background: "linear-gradient(135deg, #fce7f3, #fbcfe8)", display: "flex", alignItems: "center", justifyContent: "center", color: "#db2777", fontWeight: "900", fontSize: "14px", textAlign: "center", padding: "10px" }}>
                          {item.title || "Limited Time Offer"}
                        </div>
                      )}
                    </Link>
                  );
                })}
              </div>
            </section>
          );
        })()}

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
                          backgroundColor: addingToCartId === p.id ? "#059669" : "#e63b7a",
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
                        {addingToCartId === p.id ? "✓ ADDED!" : "ADD TO BAG"}
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
                          backgroundColor: addingToCartId === p.id ? "#059669" : "#e63b7a",
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
                        {addingToCartId === p.id ? "✓ ADDED!" : "ADD TO BAG"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })()}

        {/* HAIR CARE Section */}
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
                          backgroundColor: addingToCartId === p.id ? "#059669" : "#e63b7a",
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
                        {addingToCartId === p.id ? "✓ ADDED!" : "ADD TO BAG"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })()}

        {/* LUXURY PROMOTIONAL BANNER (Above SHOP BY CONCERN - As in Uploaded Design) */}
        {(() => {
          const promo = (dynamicSections.PROMO_BANNER && dynamicSections.PROMO_BANNER[0])
            || {
                id: "promo-lux-royale",
                title: "LUX Royale - Win Authentic GUCCI Bag",
                imageUrl: "/banners/lux-royale-promo.jpg",
                linkUrl: "/shop?brand=lux"
              };

          const promoImg = safeImageUrl(promo.imageUrl, "/banners/lux-royale-promo.jpg", promo.updatedAt);
          const promoLink = promo.linkUrl || "/shop";

          return (
            <section style={{ margin: "25px 0 35px 0" }}>
              <Link
                href={promoLink}
                style={{
                  display: "block",
                  width: "100%",
                  borderRadius: "12px",
                  overflow: "hidden",
                  boxShadow: "0 4px 18px rgba(0,0,0,0.06)",
                  transition: "transform 0.25s ease, box-shadow 0.25s ease",
                }}
                className="promo-card-hover"
              >
                <img
                  src={promoImg}
                  alt={promo.title || "Promotional Banner"}
                  style={{
                    width: "100%",
                    height: "auto",
                    display: "block",
                    aspectRatio: "1200 / 140",
                    objectFit: "cover"
                  }}
                  onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/banners/lux-royale-promo.jpg"; }}
                />
              </Link>
            </section>
          );
        })()}

        {/* SHOP BEAUTY PRODUCTS BY CATEGORY (Placed Above SHOP BY CONCERN - 8 Category Cards) */}
        {(() => {
          const DEFAULT_CATEGORY_CARDS = [
            { id: "cat-makeup", title: "MAKEUP", fallbackImg: "/banners/cat-makeup.jpg", linkUrl: "/shop?category=makeup" },
            { id: "cat-kbeauty", title: "K-BEAUTY", fallbackImg: "/banners/cat-kbeauty.jpg", linkUrl: "/shop?category=k-beauty" },
            { id: "cat-haircare", title: "HAIR CARE", fallbackImg: "/banners/cat-haircare.jpg", linkUrl: "/shop?category=haircare" },
            { id: "cat-mombaby", title: "MOM & BABY", fallbackImg: "/banners/cat-mombaby.jpg", linkUrl: "/shop?category=mom-baby" },
            { id: "cat-skincare", title: "SKIN CARE", fallbackImg: "/banners/cat-skincare.jpg", linkUrl: "/shop?category=skincare" },
            { id: "cat-accessories", title: "ACCESSORIES", fallbackImg: "/banners/cat-accessories.jpg", linkUrl: "/shop?category=accessories" },
            { id: "cat-undergarments", title: "UNDERGARMENTS", fallbackImg: "/banners/cat-undergarments.jpg", linkUrl: "/shop?category=undergarments" },
            { id: "cat-fragrance", title: "FRAGRANCE", fallbackImg: "/banners/cat-fragrance.jpg", linkUrl: "/shop?category=fragrance" }
          ];

          const categoryCards = DEFAULT_CATEGORY_CARDS.map((defCard) => {
            const defSlug = defCard.id.replace("cat-", "");
            const uploaded = (dynamicSections.SHOP_BY_CATEGORY || []).find((c: any) => {
              if (!c) return false;
              if (c.id === defCard.id) return true;
              if (c.id === `cat-card-${defSlug}`) return true;
              const cleanC = (c.title || "").toLowerCase().replace(/[^a-z0-9]/g, "");
              const cleanDef = defCard.title.toLowerCase().replace(/[^a-z0-9]/g, "");
              if (cleanC.includes(cleanDef) || cleanDef.includes(cleanC)) return true;
              const pClean = (c.page || "").toLowerCase().replace(/[^a-z0-9]/g, "");
              if (pClean.includes(cleanDef)) return true;
              return false;
            });
            return {
              ...defCard,
              ...(uploaded || {}),
              imageUrl: uploaded?.imageUrl || defCard.fallbackImg,
              linkUrl: uploaded?.linkUrl || defCard.linkUrl,
              updatedAt: uploaded?.updatedAt
            };
          });

          return (
            <section style={{ margin: "35px 0 35px 0" }}>
              <div style={{ textAlign: "center", marginBottom: "20px" }}>
                <h2 style={{ fontSize: "14px", fontWeight: "900", color: "#000000", textTransform: "uppercase", letterSpacing: "1.5px", margin: 0 }}>
                  SHOP BEAUTY PRODUCTS BY CATEGORY
                </h2>
              </div>

              <div className="categories-grid">
                {categoryCards.map((cat: any, idx: number) => {
                  const catTitle = cat.title || cat.name || "Category";
                  const catLink = cat.linkUrl || `/shop?category=${encodeURIComponent(cat.slug || getCategorySlug(catTitle))}`;
                  const catImg = safeImageUrl(cat.imageUrl, "/placeholder-product.svg", cat.updatedAt);

                  return (
                    <Link
                      key={cat.id || idx}
                      href={catLink}
                      style={{
                        display: "block",
                        borderRadius: "16px",
                        overflow: "hidden",
                        boxShadow: "0 4px 15px rgba(226, 40, 110, 0.12)",
                        transition: "transform 0.25s ease, box-shadow 0.25s ease",
                        textDecoration: "none",
                        backgroundColor: "#e6196e",
                        aspectRatio: "1 / 1",
                        width: "100%",
                      }}
                      className="promo-card-hover"
                    >
                      <img
                        src={catImg}
                        alt={catTitle}
                        width={500}
                        height={500}
                        style={{
                          width: "100%",
                          height: "100%",
                          aspectRatio: "1 / 1",
                          objectFit: "cover",
                          display: "block"
                        }}
                        onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/placeholder-product.svg"; }}
                      />
                    </Link>
                  );
                })}
              </div>
            </section>
          );
        })()}

        {/* SHOP BY CONCERN Section */}
        {(() => {
          const DEFAULT_CONCERN_CARDS = [
            { id: "concern-card-acne", title: "Acne Treatment", icon: "🌿", color: "#ecfdf5", border: "#a7f3d0", linkUrl: "/shop?category=skincare&sub=Acne%20Treatment", extra: false },
            { id: "concern-card-anti-aging", title: "Anti Aging Treatment", icon: "✨", color: "#fffbeb", border: "#fde68a", linkUrl: "/shop?category=skincare&sub=Anti%20Aging", extra: false },
            { id: "concern-card-dandruff", title: "Dandruff Solution", icon: "💧", color: "#eff6ff", border: "#bfdbfe", linkUrl: "/shop?category=haircare&sub=Dandruff", extra: false },
            { id: "concern-card-dry-skin", title: "Dry Skin Treatment", icon: "🧴", color: "#fef2f2", border: "#fecaca", linkUrl: "/shop?category=skincare&sub=Dry%20Skin", extra: false },
            { id: "concern-card-hair-fall", title: "Hair Fall Treatment", icon: "💇‍♀️", color: "#faf5ff", border: "#e9d5ff", linkUrl: "/shop?category=haircare&sub=Hair%20Fall", extra: true },
            { id: "concern-card-oil-control", title: "Oil Control Treatment", icon: "🍃", color: "#f0fdf4", border: "#bbf7d0", linkUrl: "/shop?category=skincare", extra: true },
            { id: "concern-card-pore-care", title: "Pore Care", icon: "🫧", color: "#f0f9ff", border: "#bae6fd", linkUrl: "/shop?category=skincare&sub=Pore%20Care", extra: true },
            { id: "concern-card-spot-treatment", title: "Spot Treatment", icon: "🎯", color: "#fdf4ff", border: "#f5d0fe", linkUrl: "/shop?category=skincare", extra: true },
            { id: "concern-card-hair-thinning", title: "Hair Thinning Solution", icon: "🌾", color: "#fff7ed", border: "#fed7aa", linkUrl: "/shop?category=haircare", extra: true },
            { id: "concern-card-sun-burn", title: "Sun Burn Treatment", icon: "☀️", color: "#fff1f2", border: "#fecdd3", linkUrl: "/shop?category=skincare", extra: true }
          ];

          const concernItems = DEFAULT_CONCERN_CARDS.map((defCard) => {
            const defClean = defCard.title.toLowerCase().replace(/[^a-z0-9]/g, "").replace("treatment", "").replace("solution", "");
            const uploaded = (dynamicSections.SHOP_BY_CONCERN || []).find((c: any) => {
              if (!c) return false;
              if (c.id === defCard.id) return true;
              const cClean = (c.title || "").toLowerCase().replace(/[^a-z0-9]/g, "");
              if (cClean.includes(defClean)) return true;
              const pClean = (c.page || "").toLowerCase().replace(/[^a-z0-9]/g, "");
              if (pClean.includes(defClean)) return true;
              return false;
            });
            return {
              ...defCard,
              ...(uploaded || {}),
              imageUrl: uploaded?.imageUrl !== undefined ? uploaded.imageUrl : "",
              linkUrl: uploaded?.linkUrl || defCard.linkUrl,
              updatedAt: uploaded?.updatedAt
            };
          });

          return (
            <section style={{ margin: "20px 0 10px 0" }}>
              <h2 style={{ fontSize: "14px", fontWeight: "800", textAlign: "center", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: "20px", color: "#000" }}>
                SHOP BY CONCERN
              </h2>
              <div className="concerns-grid">
                {concernItems.map((concern: any, idx: number) => {
                  const img = safeImageUrl(concern.imageUrl, "", concern.updatedAt);
                  const link = concern.linkUrl || "/shop";
                  return (
                    <Link
                      key={concern.id || idx}
                      href={link}
                      style={{ display: "block", overflow: "hidden", borderRadius: "10px", textDecoration: "none" }}
                      className={`promo-card-hover ${concern.extra ? "concern-card-extra" : ""}`}
                    >
                      {img ? (
                        <img
                          src={img}
                          alt={concern.title}
                          style={{ width: "100%", height: "auto", aspectRatio: "1 / 1", objectFit: "cover", display: "block", borderRadius: "10px" }}
                        />
                      ) : (
                        <div style={{
                          aspectRatio: "1 / 1",
                          backgroundColor: concern.color || "#f8fafc",
                          border: `1.5px solid ${concern.border || "#e2e8f0"}`,
                          borderRadius: "10px",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          padding: "10px",
                          boxShadow: "0 2px 6px rgba(0,0,0,0.03)"
                        }}>
                          <span style={{ fontSize: "24px", marginBottom: "4px" }}>{concern.icon || "✨"}</span>
                          <span style={{ fontSize: "11px", fontWeight: "800", color: "#1e293b", textAlign: "center", lineHeight: "1.2" }}>{concern.title}</span>
                        </div>
                      )}
                    </Link>
                  );
                })}
              </div>
            </section>
          );
        })()}

        {/* End of content sections */}
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
