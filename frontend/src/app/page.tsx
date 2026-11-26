"use client";

import React, { useEffect, useState } from "react";
import { fetchWithCache, API_BASE, API_ROOT, getProductUrl, subscribeToDataSync, safeImageUrl, idbGet, MASTER_HOMEPAGE_BANNERS } from "../utils/api";
import { registerFcmToken } from "../utils/fcm";
import { io } from "socket.io-client";

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

const DEFAULT_HERO_SLIDES = [
  { img: "/images/sliders/slider-1.png", title: "Nirvana Makeup", desc: "Special offers", link: "/shop?brand=nirvana" },
  { img: "/images/sliders/slider-2.png", title: "July Jaw Droppers", desc: "Special deals on international brands", link: "/shop?deal=jaw-droppers" },
  { img: "/images/sliders/slider-3.png", title: "Treasure of Glow", desc: "Premium skincare", link: "/shop?deal=treasure-of-glow" }
];

const defaultHomepageBanners: Record<string, any[]> = {
  dealsYouCannotMiss: [],
  topBrandsOffers: [],
  limitedTimeOffers: [],
  shopByCategory: [],
  shopByConcern: [],
  promoBanner: []
};

const getProductImage = (p: any): string => {
  const raw = p?.images?.find((img: any) => img.isPrimary)?.url || p?.images?.[0]?.url || p?.imageUrl;
  return safeImageUrl(raw, FALLBACK_PRODUCT_IMG);
};

// Helper to load frontend hero banners directly from localStorage
const loadFrontendHeroBanners = () => {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem("gg_frontend_hero_banners");
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const deletedRaw = localStorage.getItem("gg_deleted_banner_ids");
        const deletedIds: string[] = deletedRaw ? JSON.parse(deletedRaw) : [];
        const activeOnly = parsed.filter((b: any) => b && !deletedIds.includes(b.id) && (b.isActive === undefined || b.isActive === true || b.isActive === "true" || String(b.isActive) !== "false"));
        if (activeOnly.length > 0) {
          return activeOnly.map((b: any, idx: number) => {
            const rawUrl = b.mediaUrl || b.imageUrl || b.url || b.img;
            const resolvedUrl = safeImageUrl(rawUrl);
            const mediaType = b.mediaType || (rawUrl?.includes(".mp4") || rawUrl?.includes(".webm") ? "video" : rawUrl?.includes(".gif") ? "gif" : "image");
            return {
              id: b.id || `frontend-hero-${idx}`,
              title: b.title || "GlowGoodly Hero Banner",
              desc: b.subtitle || b.desc || "",
              mediaUrl: resolvedUrl,
              mediaType,
              img: resolvedUrl,
              mobileImg: b.mobileImageUrl || resolvedUrl,
              tabletImg: b.tabletImageUrl || resolvedUrl,
              link: b.ctaLink || b.linkUrl || b.link || "/shop"
            };
          });
        }
      }
    }
  } catch (e) { }
  return [];
};

// Helper to load cached homepage products directly from localStorage
const loadCachedProducts = (): Product[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("gg_cached_homepage_products");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) { }
  return [];
};

// Helper to load cached categories from localStorage
const loadCachedCategories = (): any[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("gg_cached_categories");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) { }
  return [];
};

// Helper to load cached brands from localStorage
const loadCachedBrands = (): any[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("gg_cached_brands");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) { }
  return [];
};

// Helper to load initial homepage banners directly from master + localStorage
const loadInitialHomeBanners = () => {
  const master = Array.isArray(MASTER_HOMEPAGE_BANNERS) ? MASTER_HOMEPAGE_BANNERS : [];
  if (typeof window === "undefined") return master;
  try {
    const deletedRaw = localStorage.getItem("gg_deleted_banner_ids");
    const deletedIds: string[] = deletedRaw ? JSON.parse(deletedRaw) : [];
    let storedBanners: any[] = [];
    const storedBannersRaw = localStorage.getItem("gg_frontend_home_banners") || localStorage.getItem("gg_synced_homepage_banners");
    if (storedBannersRaw) {
      try {
        const parsed = JSON.parse(storedBannersRaw);
        if (Array.isArray(parsed) && parsed.length > 0) storedBanners = parsed;
      } catch (e) { }
    }

    const map = new Map();
    master.forEach((item) => {
      const isDeleted = deletedIds.includes(item.id) || deletedIds.includes(item.page);
      map.set(item.id, {
        ...item,
        imageUrl: isDeleted ? "" : item.imageUrl
      });
    });

    storedBanners.forEach((b: any) => {
      if (!b || !b.id) return;
      const isDeleted = deletedIds.includes(b.id) || (b.page && deletedIds.includes(b.page));
      if (map.has(b.id)) {
        const existing = map.get(b.id);
        map.set(b.id, {
          ...existing,
          ...b,
          imageUrl: isDeleted ? "" : (b.imageUrl ?? existing.imageUrl)
        });
      } else {
        if (!isDeleted) map.set(b.id, b);
      }
    });

    return Array.from(map.values());
  } catch (e) {
    return master;
  }
};

function ProductSectionSkeleton({ title }: { title: string }) {
  return (
    <section style={{ margin: "30px 0", backgroundColor: "#ffffff", padding: "10px 0" }}>
      <div style={{ position: "relative", marginBottom: "20px" }}>
        <h2 style={{ fontSize: "14px", fontWeight: "800", textAlign: "center", textTransform: "uppercase", letterSpacing: "1.5px", color: "#000", margin: 0 }}>
          {title}
        </h2>
      </div>
      <div className="homepage-product-grid mobile-limit-2">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "12px",
              border: "1px solid #f1f5f9",
              minHeight: "360px",
              display: "flex",
              flexDirection: "column",
              padding: "16px",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: "100%",
                height: "200px",
                backgroundColor: "#f8fafc",
                borderRadius: "8px",
                marginBottom: "16px",
              }}
            />
            <div style={{ height: "14px", width: "80%", backgroundColor: "#f1f5f9", borderRadius: "4px", margin: "0 auto 10px auto" }} />
            <div style={{ height: "12px", width: "40%", backgroundColor: "#f1f5f9", borderRadius: "4px", margin: "0 auto 12px auto" }} />
            <div style={{ height: "16px", width: "50%", backgroundColor: "#f1f5f9", borderRadius: "4px", margin: "0 auto" }} />
          </div>
        ))}
      </div>
    </section>
  );
}

export default function Home() {
  const { addToCart, wishlist, toggleWishlist } = useApp();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [dynamicSlides, setDynamicSlides] = useState<any[]>([]);
  const [homepageBanners, setHomepageBanners] = useState<any[]>(() => {
    return Array.isArray(MASTER_HOMEPAGE_BANNERS) ? MASTER_HOMEPAGE_BANNERS : [];
  });
  const [dynamicSections, setDynamicSections] = useState<Record<string, any[]>>({
    DEALS_YOU_CANNOT_MISS: [],
    TOP_BRANDS_OFFERS: [],
    LIMITED_TIME_OFFERS: [],
    SHOP_BY_CATEGORY: [],
    SHOP_BY_CONCERN: [],
    PROMO_BANNER: [],
  });
  const [deletedBannerIds, setDeletedBannerIds] = useState<string[]>([]);
  const [cardLinks, setCardLinks] = useState<Record<string, string>>({});
  const [isClientMounted, setIsClientMounted] = useState<boolean>(false);

  const getBannerForPage = (identifier: string, fallbackImg: string = "", fallbackTitle: string = "", fallbackLink: string = "#") => {
    const rawTerm = (identifier || "").trim();
    const term = rawTerm.toLowerCase();
    const cleanTerm = term.replace(/[^a-z0-9]/g, "");

    const found = homepageBanners.find((b: any) => {
      if (!b) return false;
      const p = (b.page || "").toLowerCase().trim();
      const id = (b.id || "").toLowerCase().trim();
      const cleanId = id.replace(/[^a-z0-9]/g, "");
      const cleanP = p.replace(/[^a-z0-9]/g, "");

      // 1. Direct exact match
      if (id === term || p === term || cleanId === cleanTerm || cleanP === cleanTerm) return true;

      // 2. Exact slot mapping without wildcards
      if (cleanTerm === "dealcard1" && (cleanId === "deal1" || cleanId === "dealcard1")) return true;
      if (cleanTerm === "dealcard2" && (cleanId === "deal2" || cleanId === "dealcard2")) return true;
      if (cleanTerm === "dealcard3" && (cleanId === "deal3" || cleanId === "dealcard3")) return true;
      if (cleanTerm === "dealcard4" && (cleanId === "deal4" || cleanId === "dealcard4")) return true;

      if (cleanTerm === "brandoffer1" && (cleanId === "brandoffer1")) return true;
      if (cleanTerm === "brandoffer2" && (cleanId === "brandoffer2")) return true;
      if ((cleanTerm === "brandoffer5" || cleanTerm === "brandoffer3") && (cleanId === "brandoffer5" || cleanId === "brandoffer3")) return true;
      if ((cleanTerm === "brandoffer6" || cleanTerm === "brandoffer4") && (cleanId === "brandoffer6" || cleanId === "brandoffer4")) return true;

      if (cleanTerm === "bogo" && (cleanId === "limitedbogo" || cleanId === "bogo")) return true;
      if (cleanTerm === "combo" && (cleanId === "limitedcombo" || cleanId === "combo")) return true;
      if (cleanTerm === "offers" && (cleanId === "limitedoffers" || cleanId === "offers")) return true;
      if ((cleanTerm === "clearance" || cleanTerm === "clearancesale") && (cleanId === "limitedclearance" || cleanId === "clearancesale")) return true;

      if (cleanTerm.includes("widebanner") || cleanTerm === "homepagewidebanner") {
        if (cleanId === "widebanner1" || cleanId === "homepagewidebanner" || cleanP === "homepagewidebanner") return true;
      }
      if (cleanTerm.includes("promobanner")) {
        if (cleanId === "promobanner1" || cleanId === "promobannerlux" || cleanP === "promobanner") return true;
      }

      // Categories
      if (cleanTerm.startsWith("category")) {
        const sub = cleanTerm.replace("category", "");
        if (cleanId === `catcard${sub}` || cleanId === `cat${sub}` || cleanP === `category${sub}`) return true;

        // Enhanced Semantic Category Matching (Fixes empty cards for Cosmetics, Skin Care, Bath & Body, Fregnance)
        if ((sub === "skincare" || sub === "skin") && (cleanId.includes("skin") || cleanP.includes("skin"))) return true;
        if (sub === "cosmetics" && (cleanId.includes("cosmetic") || cleanP.includes("cosmetic") || cleanId.includes("kbeauty") || cleanP.includes("kbeauty"))) return true;
        if (sub === "makeup" && (cleanId.includes("makeup") || cleanP.includes("makeup"))) return true;
        if ((sub === "bathandbody" || sub === "bathbody" || sub === "personalcare") && (cleanId.includes("personal") || cleanP.includes("personal") || cleanId.includes("bath") || cleanP.includes("bath"))) return true;
        if ((sub === "fragrance" || sub === "fregnance" || sub === "perfume") && (cleanId.includes("fragran") || cleanP.includes("fragran") || cleanId.includes("fregnan") || cleanP.includes("fregnan"))) return true;
        if ((sub === "haircare" || sub === "hair") && (cleanId.includes("hair") || cleanP.includes("hair"))) return true;
        if ((sub === "mombaby" || sub === "mombabycare") && (cleanId.includes("mom") || cleanP.includes("mom"))) return true;
        if (sub.includes("undergarment") && (cleanId.includes("undergarment") || cleanP.includes("undergarment"))) return true;
      }
      // Concerns
      if (cleanTerm.startsWith("concern")) {
        const sub = cleanTerm.replace("concern", "");
        if (cleanId === `concerncard${sub}` || cleanId === `concern${sub}` || cleanP === `concern${sub}`) return true;
      }

      return false;
    });

    if (deletedBannerIds.length > 0) {
      if (
        deletedBannerIds.includes(term) ||
        deletedBannerIds.includes(rawTerm) ||
        (found && (deletedBannerIds.includes(found.id) || deletedBannerIds.includes(found.page) || deletedBannerIds.includes(found.title)))
      ) {
        return { img: "", mobileImg: "", tabletImg: "", title: "", link: fallbackLink };
      }
    }

    let targetLink = (found && found.linkUrl) ? found.linkUrl : fallbackLink;
    if (found?.id && cardLinks[found.id]) {
      targetLink = cardLinks[found.id];
    }

    const rawImg = found ? (found.imageUrl || found.image || found.mediaUrl) : "";
    const cleanImg = safeImageUrl(rawImg, "");
    const finalImg = cleanImg || fallbackImg;

    return {
      img: finalImg,
      mobileImg: safeImageUrl(found && found.mobileImageUrl ? found.mobileImageUrl : finalImg, finalImg),
      tabletImg: safeImageUrl(found && found.tabletImageUrl ? found.tabletImageUrl : finalImg, finalImg),
      title: (found && found.title) ? found.title : fallbackTitle,
      link: targetLink
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

  const activeSlidesList = dynamicSlides.length > 0 ? dynamicSlides : DEFAULT_HERO_SLIDES;

  // Real-time synchronization with Frontend LocalStorage Hero Banner updates
  useEffect(() => {
    setIsClientMounted(true);
    const local = loadFrontendHeroBanners();
    if (local.length > 0) {
      setDynamicSlides(local);
    }

    // Instantly hydrate cached products, categories, and brands on client mount
    const cachedProds = loadCachedProducts();
    if (cachedProds.length > 0) {
      setProducts(cachedProds);
    } else {
      setLoading(true);
    }

    const cachedCats = loadCachedCategories();
    if (cachedCats.length > 0) setCategories(cachedCats);

    const cachedBr = loadCachedBrands();
    if (cachedBr.length > 0) setBrands(cachedBr);
    if (typeof window !== "undefined") {
      idbGet("gg_frontend_hero_banners").then((stored) => {
        if (Array.isArray(stored) && stored.length > 0) {
          const deletedRaw = localStorage.getItem("gg_deleted_banner_ids");
          const deletedIds: string[] = deletedRaw ? JSON.parse(deletedRaw) : [];
          const active = stored.filter((b: any) => b && !deletedIds.includes(b.id) && b.isActive !== false);
          if (active.length > 0) {
            const mapped = active.map((b: any, idx: number) => {
              const rawUrl = b.mediaUrl || b.imageUrl || b.url || b.img;
              const resolvedUrl = safeImageUrl(rawUrl);
              return {
                id: b.id || `frontend-hero-${idx}`,
                title: b.title || "GlowGoodly Hero Banner",
                desc: b.subtitle || b.desc || "",
                mediaUrl: resolvedUrl,
                mediaType: b.mediaType || "image",
                img: resolvedUrl,
                mobileImg: b.mobileImageUrl || resolvedUrl,
                tabletImg: b.tabletImageUrl || resolvedUrl,
                link: b.ctaLink || b.linkUrl || b.link || "/shop"
              };
            });
            setDynamicSlides((prev) => {
              if (JSON.stringify(prev) === JSON.stringify(mapped)) return prev;
              return mapped;
            });
          }
        }
      });
    }

    const onHeroUpdate = () => {
      const updated = loadFrontendHeroBanners();
      if (updated.length > 0) {
        setDynamicSlides(updated);
      } else {
        setDynamicSlides([]);
      }
    };

    window.addEventListener("gg_hero_banners_updated", onHeroUpdate);
    window.addEventListener("storage", onHeroUpdate);

    return () => {
      window.removeEventListener("gg_hero_banners_updated", onHeroUpdate);
      window.removeEventListener("storage", onHeroUpdate);
    };
  }, []);

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

    const applyFrontendBanners = () => {
      if (typeof window === "undefined") return;
      try {
        const deletedRaw = localStorage.getItem("gg_deleted_banner_ids");
        const deletedIds: string[] = deletedRaw ? JSON.parse(deletedRaw) : [];
        const cardLinksRaw = localStorage.getItem("gg_card_links");
        const cardLinks: Record<string, string> = cardLinksRaw ? JSON.parse(cardLinksRaw) : {};

        setDeletedBannerIds(deletedIds);
        setCardLinks(cardLinks);

        let storedBanners: any[] = [];
        const storedBannersRaw = localStorage.getItem("gg_frontend_home_banners");
        if (storedBannersRaw) {
          try {
            const parsed = JSON.parse(storedBannersRaw);
            if (Array.isArray(parsed) && parsed.length > 0) storedBanners = parsed;
          } catch (e) { }
        }
        if (storedBanners.length === 0) {
          const cachedRaw = localStorage.getItem("gg_synced_homepage_banners");
          if (cachedRaw) {
            try {
              const parsed = JSON.parse(cachedRaw);
              if (Array.isArray(parsed) && parsed.length > 0) storedBanners = parsed;
            } catch (e) { }
          }
        }

        const heroStoredRaw = localStorage.getItem("gg_frontend_hero_banners");
        if (heroStoredRaw) {
          try {
            const parsedHero = JSON.parse(heroStoredRaw);
            if (Array.isArray(parsedHero)) {
              parsedHero.forEach((hb: any, idx: number) => {
                const hId = hb.id || `hero-slide-${idx + 1}`;
                if (!storedBanners.some((b: any) => b.id === hId)) {
                  storedBanners.push({
                    id: hId,
                    title: hb.title || `Hero Slide ${idx + 1}`,
                    page: "Hero Slides",
                    imageUrl: hb.mediaUrl || hb.imageUrl || hb.img,
                    mobileImageUrl: hb.mobileImageUrl || hb.mediaUrl || hb.imageUrl || hb.img,
                    tabletImageUrl: hb.tabletImageUrl || hb.mediaUrl || hb.imageUrl || hb.img,
                    linkUrl: hb.ctaLink || hb.linkUrl || hb.link || "/shop",
                    isActive: hb.isActive !== false,
                    sortOrder: hb.order || idx + 1
                  });
                }
              });
            }
          } catch (e) { }
        }

        const map = new Map();
        (MASTER_HOMEPAGE_BANNERS || []).forEach((item) => {
          const isDeleted = deletedIds.includes(item.id) || deletedIds.includes(item.page);
          map.set(item.id, {
            ...item,
            imageUrl: isDeleted ? "" : item.imageUrl
          });
        });

        storedBanners.forEach((b: any) => {
          if (!b || !b.id) return;
          const isDeleted = deletedIds.includes(b.id) || (b.page && deletedIds.includes(b.page));
          if (map.has(b.id)) {
            const existing = map.get(b.id);
            map.set(b.id, {
              ...existing,
              ...b,
              imageUrl: isDeleted ? "" : (b.imageUrl || existing.imageUrl)
            });
          } else {
            if (!isDeleted) map.set(b.id, b);
          }
        });

        setHomepageBanners(Array.from(map.values()));

        // Also update dynamicSections
        setDynamicSections((prev) => {
          const updated = { ...prev };
          storedBanners.forEach((b: any) => {
            if (!b || deletedIds.includes(b.id) || deletedIds.includes(b.page)) return;
            const p = (b.page || "").toLowerCase();
            const id = (b.id || "").toLowerCase();
            const customLink = cardLinks[b.id] || b.linkUrl;
            const bannerObj = { ...b, linkUrl: customLink || b.linkUrl };

            if (p.includes("category") || id.startsWith("cat-card-") || id.startsWith("cat-")) {
              const list = [...(updated.SHOP_BY_CATEGORY || [])];
              const cleanDef = (b.title || "").toLowerCase().replace(/[^a-z0-9]/g, "");
              const idx = list.findIndex(c => c.id === b.id || (b.title && c.title && c.title.toLowerCase().replace(/[^a-z0-9]/g, "").includes(cleanDef)));
              if (idx >= 0) list[idx] = { ...list[idx], ...bannerObj };
              else list.push(bannerObj);
              updated.SHOP_BY_CATEGORY = list;
            } else if (p.includes("concern") || id.startsWith("concern-card-") || id.startsWith("concern-")) {
              const list = [...(updated.SHOP_BY_CONCERN || [])];
              const cleanDef = (b.title || "").toLowerCase().replace(/[^a-z0-9]/g, "").replace("treatment", "").replace("solution", "");
              const idx = list.findIndex(c => c.id === b.id || (b.title && c.title && c.title.toLowerCase().replace(/[^a-z0-9]/g, "").includes(cleanDef)));
              if (idx >= 0) list[idx] = { ...list[idx], ...bannerObj };
              else list.push(bannerObj);
              updated.SHOP_BY_CONCERN = list;
            } else if (p.includes("deal") || id.startsWith("deal-")) {
              const list = [...(updated.DEALS_YOU_CANNOT_MISS || [])];
              const idx = list.findIndex(c => c.id === b.id || (b.page && c.page && b.page.toLowerCase().trim() === c.page.toLowerCase().trim()));
              if (idx >= 0) list[idx] = { ...list[idx], ...bannerObj };
              else list.push(bannerObj);
              updated.DEALS_YOU_CANNOT_MISS = list;
            } else if (p.includes("brand offer") || id.startsWith("brand-offer-")) {
              const list = [...(updated.TOP_BRANDS_OFFERS || [])];
              const idx = list.findIndex(c => c.id === b.id || (b.page && c.page && b.page.toLowerCase().trim() === c.page.toLowerCase().trim()));
              if (idx >= 0) list[idx] = { ...list[idx], ...bannerObj };
              else list.push(bannerObj);
              updated.TOP_BRANDS_OFFERS = list;
            } else if (p.includes("bogo") || p.includes("combo") || p.includes("offers") || p.includes("clearance") || id.startsWith("lto-") || id.startsWith("limited-")) {
              const list = [...(updated.LIMITED_TIME_OFFERS || [])];
              const idx = list.findIndex(c => c.id === b.id || (id.includes("bogo") && c.id.includes("bogo")) || (id.includes("combo") && c.id.includes("combo")) || (id.includes("offers") && c.id.includes("exclusive")) || (id.includes("clearance") && c.id.includes("sale")));
              if (idx >= 0) list[idx] = { ...list[idx], ...bannerObj };
              else list.push(bannerObj);
              updated.LIMITED_TIME_OFFERS = list;
            } else if (p.includes("wide") || p.includes("promo") || id.includes("wide") || id.startsWith("promo-")) {
              updated.PROMO_BANNER = [bannerObj];
            }
          });

          if (deletedIds.length > 0) {
            Object.keys(updated).forEach((key) => {
              updated[key] = (updated[key] || []).filter(
                (item: any) => !deletedIds.includes(item.id) && !deletedIds.includes(item.page)
              );
            });
          }

          return updated;
        });

        if (typeof window !== "undefined") {
          idbGet("gg_frontend_home_banners").then((idbBanners) => {
            if (Array.isArray(idbBanners) && idbBanners.length > 0) {
              setHomepageBanners((prev) => {
                const map = new Map();
                (prev || []).forEach((item: any) => {
                  if (item && item.id && !deletedIds.includes(item.id) && !deletedIds.includes(item.page)) {
                    map.set(item.id, item);
                  }
                });
                idbBanners.forEach((b: any) => {
                  if (b && b.id && !deletedIds.includes(b.id) && !deletedIds.includes(b.page)) {
                    const existing = map.get(b.id) || {};
                    map.set(b.id, {
                      ...existing,
                      ...b,
                      imageUrl: b.imageUrl || existing.imageUrl
                    });
                  }
                });
                return Array.from(map.values());
              });
            }
          });
        }
      } catch (e) {
        console.error("Error applying frontend banners", e);
      }
    };

    applyFrontendBanners();
    window.addEventListener("gg_home_banners_updated", applyFrontendBanners);
    window.addEventListener("storage", applyFrontendBanners);

    const fetchMetadata = async (bypass: boolean = true) => {
      try {
        const timestamp = Date.now();
        // Fetch categories and brands strictly from backend API for product filtering
        const [categoriesRes, brandsRes] = await Promise.all([
          fetchWithCache(`${API_BASE}/categories?t=${timestamp}`, true).catch(() => null),
          fetchWithCache(`${API_BASE}/brands?t=${timestamp}`, true).catch(() => null),
        ]);

        if (Array.isArray(categoriesRes) && categoriesRes.length > 0) {
          setCategories(categoriesRes);
          try { localStorage.setItem("gg_cached_categories", JSON.stringify(categoriesRes)); } catch (e) { }
        }
        if (Array.isArray(brandsRes) && brandsRes.length > 0) {
          setBrands(brandsRes);
          try { localStorage.setItem("gg_cached_brands", JSON.stringify(brandsRes)); } catch (e) { }
        }

        // Hero banners strictly load from frontend LocalStorage (no backend banner fetch)
        const localHeroSlides = loadFrontendHeroBanners();
        if (localHeroSlides.length > 0) {
          setDynamicSlides((prev) => (JSON.stringify(prev) === JSON.stringify(localHeroSlides) ? prev : localHeroSlides));
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
    let handlePageHide: any = null;
    let handlePageShow: any = null;
    let handleVisibilityChange: any = null;
    try {
      socket = io(API_ROOT, {
        transports: ["websocket", "polling"],
        timeout: 6000,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 2000,
        reconnectionDelayMax: 10000,
      });
      socket.on("homepage_sections:updated", () => {
        fetchMetadata(true);
      });
      socket.on("banners:updated", () => {
        fetchMetadata(true);
      });
      socket.on("content_updated", () => {
        fetchMetadata(true);
      });

      // BFCache graceful lifecycle handling
      handlePageHide = () => {
        try {
          if (socket) socket.disconnect();
        } catch (_) { }
      };
      handlePageShow = (e: PageTransitionEvent) => {
        try {
          if (e.persisted && socket && !socket.connected) {
            socket.connect();
          }
        } catch (_) { }
      };
      handleVisibilityChange = () => {
        try {
          if (document.visibilityState === "visible" && socket && !socket.connected) {
            socket.connect();
          }
        } catch (_) { }
      };
      window.addEventListener("pagehide", handlePageHide);
      window.addEventListener("pageshow", handlePageShow);
      document.addEventListener("visibilitychange", handleVisibilityChange);
    } catch (e) { }

    const unsub = subscribeToDataSync(() => fetchMetadata(true));

    return () => {
      window.removeEventListener("gg_home_banners_updated", applyFrontendBanners);
      window.removeEventListener("storage", applyFrontendBanners);
      if (handlePageHide) window.removeEventListener("pagehide", handlePageHide);
      if (handlePageShow) window.removeEventListener("pageshow", handlePageShow);
      if (handleVisibilityChange) document.removeEventListener("visibilitychange", handleVisibilityChange);
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
        const valid = Array.isArray(data) ? data : [];
        setProducts(valid);
        if (typeof window !== "undefined" && valid.length > 0 && !activeCategory && !activeBrand && !searchQuery) {
          try {
            localStorage.setItem("gg_cached_homepage_products", JSON.stringify(valid.slice(0, 80)));
          } catch (e) { }
        }
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
        {products && products.length > 0 ? (
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
        ) : isClientMounted && loading ? (
          <ProductSectionSkeleton title="NEW ARRIVALS & TRENDING" />
        ) : null}



        {/* CLEARANCE SALE Section (Top Section) */}
        {(() => {
          const clearanceProducts = products
            .filter(p => p.category?.name?.toLowerCase().includes("clearance") || p.campaignName?.toLowerCase().includes("clearance") || p.name?.toLowerCase().includes("clearance"))
            .slice(0, 4);

          if (clearanceProducts.length === 0) {
            if (isClientMounted && loading) return <ProductSectionSkeleton title="CLEARANCE SALE" />;
            return null;
          }

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
          <div className="dycm-grid" suppressHydrationWarning>
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

          if (skincareProducts.length === 0) {
            if (isClientMounted && loading) return <ProductSectionSkeleton title="SKIN CARE" />;
            return null;
          }

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
          <div className="top-brands-grid" suppressHydrationWarning>
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

          if (bogoProducts.length === 0) {
            if (isClientMounted && loading) return <ProductSectionSkeleton title="BOGO" />;
            return null;
          }

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

          if (makeupProducts.length === 0) {
            if (isClientMounted && loading) return <ProductSectionSkeleton title="MAKEUP" />;
            return null;
          }

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
          <div className="limited-offers-grid" suppressHydrationWarning>
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

          if (comboProducts.length === 0) {
            if (isClientMounted && loading) return <ProductSectionSkeleton title="PERFECT MATCH WITH COMBO" />;
            return null;
          }

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

          if (toolProducts.length === 0) {
            if (isClientMounted && loading) return <ProductSectionSkeleton title="MAKEUP TOOLS" />;
            return null;
          }

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
          // 8 Canonical Categories aligned with Admin Panel CARD_SLOTS, Official Banners & Image Assets
          const CANONICAL_CATEGORY_SLOTS = [
            { slotId: "cat-card-cosmetics", name: "Cosmetics", slug: "cosmetics", pageName: "Category: Cosmetics", defaultImg: "/banners/1795248298104-1.png", aliases: ["cosmetics", "cosmetic", "cat-card-cosmetics", "cat-cosmetics", "kbeauty", "k-beauty"] },
            { slotId: "cat-card-makeup", name: "Makeup", slug: "makeup", pageName: "Category: Makeup", defaultImg: "/banners/1795246745435-8.png", aliases: ["makeup", "cat-card-makeup", "cat-makeup"] },
            { slotId: "cat-card-skin", name: "Skin Care", slug: "skincare", pageName: "Category: Skin", defaultImg: "/banners/1795248428897-3.png", aliases: ["skin", "skincare", "skin care", "cat-card-skin", "cat-skin"] },
            { slotId: "cat-card-hair", name: "Hair Care", slug: "haircare", pageName: "Category: Hair", defaultImg: "/banners/1795248333712-4.png", aliases: ["hair", "haircare", "hair care", "cat-card-hair", "cat-hair"] },
            { slotId: "cat-card-personal-care", name: "Bath & Body", slug: "personal-care", pageName: "Category: Personal Care", defaultImg: "/banners/1795248447541-2.png", aliases: ["bath", "bath & body", "bath and body", "personal care", "personal-care", "cat-card-personal-care"] },
            { slotId: "cat-card-mom-baby", name: "Mom & Baby", slug: "mom-baby", pageName: "Category: Mom & Baby", defaultImg: "/banners/1795248375067-5.png", aliases: ["mom", "mom & baby", "mom and baby", "mombaby", "cat-card-mom-baby"] },
            { slotId: "cat-card-fragrance", name: "Fragrance", slug: "fragrance", pageName: "Category: Fragrance", defaultImg: "/banners/1795248468415-6.png", aliases: ["fragrance", "fregnance", "perfume", "cat-card-fragrance"] },
            { slotId: "cat-card-undergarments", name: "Undergarments", slug: "undergarments", pageName: "Category: Undergarments", defaultImg: "/banners/1795248459173-7.png", aliases: ["undergarments", "undergarment", "cat-card-undergarments"] },
          ];

          return (
            <section style={{ margin: "40px 0" }}>
              <h2 style={{ fontSize: "14px", fontWeight: "800", textAlign: "center", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: "20px", color: "#000" }}>
                SHOP BEAUTY PRODUCTS BY CATEGORY
              </h2>
              <div className="categories-grid" suppressHydrationWarning>
                {CANONICAL_CATEGORY_SLOTS.map((slot) => {
                  const defaultLink = `/shop?category=${encodeURIComponent(slot.slug)}`;
                  // Priority 1: Card Links saved in localStorage
                  let targetLink = cardLinks[slot.slotId] || defaultLink;

                  // Priority 2: Look up banner image from homepageBanners
                  const bannerInfo = getBannerForPage(slot.pageName, "", slot.name, targetLink);
                  if (bannerInfo.link && bannerInfo.link !== "#") {
                    targetLink = bannerInfo.link;
                  }

                  // Priority 2: Look up custom banner image from homepageBanners
                  const isSlotDeleted = deletedBannerIds.includes(slot.slotId) || deletedBannerIds.includes(slot.pageName);
                  let catImg = (!isSlotDeleted && bannerInfo.img) ? safeImageUrl(bannerInfo.img, "") : "";

                  // Priority 3: Fallback to preloaded official category artwork (guarantees artwork always shows)
                  if (!catImg && slot.defaultImg) {
                    catImg = safeImageUrl(slot.defaultImg, "");
                  }

                  // Priority 4: Fallback to category image from database
                  if (!catImg) {
                    const matchedCat = categories.find((c: any) => {
                      const cName = (c.name || "").toLowerCase().trim();
                      const cSlug = (c.slug || "").toLowerCase().trim();
                      return slot.aliases.some(a => cName === a || cSlug === a || cName.includes(a));
                    });
                    if (matchedCat && (matchedCat.imageUrl || matchedCat.image)) {
                      catImg = safeImageUrl(matchedCat.imageUrl || matchedCat.image, "");
                    }
                  }

                  return (
                    <Link
                      key={slot.slotId}
                      href={targetLink}
                      style={{ display: "block", borderRadius: "10px", overflow: "hidden", cursor: "pointer", textDecoration: "none" }}
                      className="promo-card-hover"
                    >
                      {catImg ? (
                        <img
                          src={catImg}
                          alt={slot.name}
                          onError={(e) => {
                            if (slot.defaultImg && e.currentTarget.src !== slot.defaultImg) {
                              e.currentTarget.src = slot.defaultImg;
                            }
                          }}
                          style={{ width: "100%", height: "auto", aspectRatio: "1 / 1", objectFit: "cover", display: "block", borderRadius: "10px" }}
                        />
                      ) : slot.defaultImg ? (
                        <img
                          src={slot.defaultImg}
                          alt={slot.name}
                          style={{ width: "100%", height: "auto", aspectRatio: "1 / 1", objectFit: "cover", display: "block", borderRadius: "10px" }}
                        />
                      ) : (
                        <div style={{ width: "100%", aspectRatio: "1 / 1", background: "linear-gradient(135deg, #fdf2f8, #fbcfe8)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", borderRadius: "10px", padding: "10px" }}>
                          <span style={{ fontSize: "28px", marginBottom: "4px" }}>✨</span>
                          <span style={{ fontSize: "12px", fontWeight: "800", color: "#db2777", textAlign: "center" }}>{slot.name}</span>
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

          if (hairProducts.length === 0) {
            if (isClientMounted && loading) return <ProductSectionSkeleton title="HAIR CARE" />;
            return null;
          }

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

        {/* Promotional Banner (Lux Royale Promo) */}
        {(() => {
          const promo = getBannerForPage("Promo Banner", "/banners/lux-royale-promo.jpg", "Promotional Offer", "/shop");
          const promoImg = promo.img || "/banners/lux-royale-promo.jpg";
          const promoLink = promo.link || "/shop";

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

        {/* JUST ARRIVED / NEW ARRIVALS Section */}
        {(() => {
          const sorted = [...products].sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
          const newArrivals = sorted.slice(0, 4);
          if (newArrivals.length === 0) {
            if (isClientMounted && loading) return <ProductSectionSkeleton title="JUST ARRIVED" />;
            return null;
          }

          return (
            <section style={{ margin: "35px 0 35px 0" }}>
              <div style={{ position: "relative", marginBottom: "20px" }}>
                <h2 style={{ fontSize: "14px", fontWeight: "900", color: "#000000", textTransform: "uppercase", letterSpacing: "1.5px", textAlign: "center", margin: 0 }}>
                  JUST ARRIVED
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
          <div className="concerns-grid" suppressHydrationWarning>
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

          {/* Optional Banner Image - Disabled for clean notifications */}
          {false && activeNotification.imageUrl && (
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
