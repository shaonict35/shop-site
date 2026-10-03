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

const DEFAULT_HERO_SLIDES = [
  {
    id: "hero-slide-1",
    title: "Nirvana Hero Slider Banner",
    desc: "Discover premium skincare & makeup collections",
    bg: "linear-gradient(135deg, #111827 0%, #1f2937 100%)",
    img: "/images/sliders/slider-1.png",
    mobileImg: "/images/sliders/slider-1.png",
    tabletImg: "/images/sliders/slider-1.png",
    link: "/shop?brand=nirvana"
  },
  {
    id: "hero-slide-2",
    title: "Unilever Campaign Banner",
    desc: "Exclusive discounts & deals",
    bg: "linear-gradient(135deg, #111827 0%, #1f2937 100%)",
    img: "/images/sliders/slider-2.png",
    mobileImg: "/images/sliders/slider-2.png",
    tabletImg: "/images/sliders/slider-2.png",
    link: "/shop?deal=jaw-droppers"
  },
  {
    id: "hero-slide-3",
    title: "Treasure of Glow Web Slider",
    desc: "Authentic beauty products guaranteed",
    bg: "linear-gradient(135deg, #111827 0%, #1f2937 100%)",
    img: "/images/sliders/slider-3.png",
    mobileImg: "/images/sliders/slider-3.png",
    tabletImg: "/images/sliders/slider-3.png",
    link: "/shop?deal=treasure-of-glow"
  }
];

const FALLBACK_PRODUCT_IMG = "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=300&q=80";

const DEFAULT_MAKEUP_PRODUCTS: Product[] = [
  {
    id: "prod-makeup-1",
    name: "L'Oreal Paris Color Riche Intense Matte Lipstick",
    slug: "loreal-paris-color-riche-intense-matte-lipstick",
    description: "Iconic richly pigmented matte lipstick with hydrating oils.",
    brand: { name: "L'Oreal Paris" },
    category: { name: "Makeup" },
    images: [{ url: "https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=500&q=80", isPrimary: true }],
    variants: [{ id: "var-m1", name: "3.7g", price: 1150, discountPrice: 950, stock: 45, shadeColor: null, size: "3.7g" }]
  },
  {
    id: "prod-makeup-2",
    name: "Maybelline Fit Me Matte + Poreless Liquid Foundation",
    slug: "maybelline-fit-me-matte-poreless-liquid-foundation",
    description: "Oil-free lightweight liquid matte foundation for natural finish.",
    brand: { name: "Maybelline" },
    category: { name: "Makeup" },
    images: [{ url: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=500&q=80", isPrimary: true }],
    variants: [{ id: "var-m2", name: "30ml", price: 1350, discountPrice: 1150, stock: 35, shadeColor: null, size: "30ml" }]
  },
  {
    id: "prod-makeup-3",
    name: "MAC Studio Fix Powder Plus Foundation Compact",
    slug: "mac-studio-fix-powder-plus-foundation-compact",
    description: "One-step powder and foundation that gives skin a smooth finish.",
    brand: { name: "M.A.C" },
    category: { name: "Makeup" },
    images: [{ url: "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=500&q=80", isPrimary: true }],
    variants: [{ id: "var-m3", name: "15g", price: 3600, discountPrice: 3250, stock: 20, shadeColor: null, size: "15g" }]
  },
  {
    id: "prod-makeup-4",
    name: "NYX Professional Butter Gloss Non-Sticky Lip Gloss",
    slug: "nyx-professional-butter-gloss-non-sticky-lip-gloss",
    description: "Silky-smooth, decadent butter gloss that melts on lips.",
    brand: { name: "NYX" },
    category: { name: "Makeup" },
    images: [{ url: "https://images.unsplash.com/photo-1599733589046-10c005739ef9?w=500&q=80", isPrimary: true }],
    variants: [{ id: "var-m4", name: "8ml", price: 850, discountPrice: 720, stock: 50, shadeColor: null, size: "8ml" }]
  }
];

const DEFAULT_TOOL_PRODUCTS: Product[] = [
  {
    id: "prod-tool-1",
    name: "Real Techniques Everyday Essentials 5-Piece Makeup Brush Set",
    slug: "real-techniques-everyday-essentials-5-piece-brush-set",
    description: "Professional face and eye makeup brush kit for seamless blending.",
    brand: { name: "Real Techniques" },
    category: { name: "Makeup Tools" },
    images: [{ url: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=500&q=80", isPrimary: true }],
    variants: [{ id: "var-t1", name: "Set of 5", price: 2450, discountPrice: 2150, stock: 25, shadeColor: null, size: "Set of 5" }]
  },
  {
    id: "prod-tool-2",
    name: "Beautyblender Original Pink Precision Makeup Blending Sponge",
    slug: "beautyblender-original-pink-precision-makeup-blending-sponge",
    description: "The edgeless, reusable makeup sponge for flawless application.",
    brand: { name: "Beautyblender" },
    category: { name: "Makeup Tools" },
    images: [{ url: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=500&q=80", isPrimary: true }],
    variants: [{ id: "var-t2", name: "1 Sponge", price: 1850, discountPrice: 1650, stock: 30, shadeColor: null, size: "1 Pc" }]
  },
  {
    id: "prod-tool-3",
    name: "Real Techniques Miracle Complexion Sponge Duo 2-Pack",
    slug: "real-techniques-miracle-complexion-sponge-duo-2-pack",
    description: "Multi-functional 3-in-1 miracle complexion sponge duo.",
    brand: { name: "Real Techniques" },
    category: { name: "Makeup Tools" },
    images: [{ url: "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=500&q=80", isPrimary: true }],
    variants: [{ id: "var-t3", name: "2 Pcs", price: 1550, discountPrice: 1350, stock: 40, shadeColor: null, size: "2 Pcs" }]
  },
  {
    id: "prod-tool-4",
    name: "Revlon Extra Curl Professional Eyelash Curler With Pad Refill",
    slug: "revlon-extra-curl-professional-eyelash-curler-with-pad-refill",
    description: "Ergonomic lash curler engineered for dramatic, long-lasting curls.",
    brand: { name: "Revlon" },
    category: { name: "Makeup Tools" },
    images: [{ url: "https://images.unsplash.com/photo-1599733589046-10c005739ef9?w=500&q=80", isPrimary: true }],
    variants: [{ id: "var-t4", name: "1 Curler", price: 950, discountPrice: 790, stock: 25, shadeColor: null, size: "1 Curler" }]
  }
];

const DEFAULT_CLEARANCE_PRODUCTS: Product[] = [
  {
    id: "prod-clearance-1",
    name: "COSRX Low pH Good Morning Gel Cleanser (Clearance Sale)",
    slug: "cosrx-low-ph-good-morning-gel-cleanser-clearance",
    description: "Gentle morning gel cleanser formulated with purifying botanical ingredients.",
    brand: { name: "COSRX" },
    category: { name: "Clearance Sale" },
    campaignName: "Clearance SALE",
    images: [{ url: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500&q=80", isPrimary: true }],
    variants: [{ id: "var-c1", name: "150ml", price: 1350, discountPrice: 850, stock: 15, shadeColor: null, size: "150ml" }]
  },
  {
    id: "prod-clearance-2",
    name: "Beauty of Joseon Relief Sun Rice + Probiotics SPF50+ (Clearance Stock)",
    slug: "beauty-of-joseon-relief-sun-clearance",
    description: "Organic sunscreen enriched with 30% rice extract and grain fermented extracts.",
    brand: { name: "Beauty of Joseon" },
    category: { name: "Clearance Sale" },
    campaignName: "Clearance SALE",
    images: [{ url: "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=500&q=80", isPrimary: true }],
    variants: [{ id: "var-c2", name: "50ml", price: 1650, discountPrice: 1150, stock: 20, shadeColor: null, size: "50ml" }]
  },
  {
    id: "prod-clearance-3",
    name: "The Ordinary Niacinamide 10% + Zinc 1% High-Strength Serum (Special Clearance)",
    slug: "the-ordinary-niacinamide-10-zinc-1-clearance",
    description: "High-strength vitamin and mineral blemish formula with niacinamide and zinc.",
    brand: { name: "The Ordinary" },
    category: { name: "Clearance Sale" },
    campaignName: "Clearance SALE",
    images: [{ url: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=500&q=80", isPrimary: true }],
    variants: [{ id: "var-c3", name: "30ml", price: 1400, discountPrice: 990, stock: 12, shadeColor: null, size: "30ml" }]
  },
  {
    id: "prod-clearance-4",
    name: "Laneige Lip Sleeping Mask Intense Moisture Berry (Final Clearance)",
    slug: "laneige-lip-sleeping-mask-berry-clearance",
    description: "Leave-on lip mask that soothes and moisturizes for smoother, more supple lips overnight.",
    brand: { name: "Laneige" },
    category: { name: "Clearance Sale" },
    campaignName: "Clearance SALE",
    images: [{ url: "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=500&q=80", isPrimary: true }],
    variants: [{ id: "var-c4", name: "20g", price: 1950, discountPrice: 1250, stock: 18, shadeColor: null, size: "20g" }]
  }
];

const DEFAULT_HAIR_PRODUCTS: Product[] = [
  {
    id: "prod-hair-1",
    name: "Olaplex No. 3 Hair Perfector Repairing Treatment",
    slug: "olaplex-no-3-hair-perfector-treatment",
    description: "Concentrated treatment that strengthens hair from within, reducing breakage and improving look and feel.",
    brand: { name: "Olaplex" },
    category: { name: "Haircare" },
    images: [{ url: "https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=500&q=80", isPrimary: true }],
    variants: [{ id: "var-h1", name: "100ml", price: 3200, discountPrice: 2850, stock: 25, shadeColor: null, size: "100ml" }]
  },
  {
    id: "prod-hair-2",
    name: "L'Oreal Paris Elvive Extraordinary Oil Serum",
    slug: "loreal-paris-elvive-extraordinary-oil-serum",
    description: "Nourishing hair serum infused with 6 precious floral oils for brilliant shine and silky smoothness.",
    brand: { name: "L'Oreal Paris" },
    category: { name: "Haircare" },
    images: [{ url: "https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=500&q=80", isPrimary: true }],
    variants: [{ id: "var-h2", name: "100ml", price: 1250, discountPrice: 990, stock: 35, shadeColor: null, size: "100ml" }]
  },
  {
    id: "prod-hair-3",
    name: "Tresemme Keratin Smooth Anti-Frizz Pro Shampoo",
    slug: "tresemme-keratin-smooth-anti-frizz-shampoo",
    description: "Infused with keratin and marula oil, giving up to 72 hours of frizz control and salon smoothness.",
    brand: { name: "Tresemme" },
    category: { name: "Haircare" },
    images: [{ url: "https://images.unsplash.com/photo-1608248597359-25f053ca2651?w=500&q=80", isPrimary: true }],
    variants: [{ id: "var-h3", name: "400ml", price: 950, discountPrice: 780, stock: 40, shadeColor: null, size: "400ml" }]
  },
  {
    id: "prod-hair-4",
    name: "The Ordinary Multi-Peptide Serum for Hair Density",
    slug: "the-ordinary-multi-peptide-serum-for-hair-density",
    description: "Concentrated leave-in serum that supports scalp health for visibly thicker and healthier hair.",
    brand: { name: "The Ordinary" },
    category: { name: "Haircare" },
    images: [{ url: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500&q=80", isPrimary: true }],
    variants: [{ id: "var-h4", name: "60ml", price: 2150, discountPrice: 1850, stock: 20, shadeColor: null, size: "60ml" }]
  }
];

export default function Home() {
  const { addToCart, wishlist, toggleWishlist } = useApp();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [dynamicSlides, setDynamicSlides] = useState<any[]>(DEFAULT_HERO_SLIDES);
  const [homepageBanners, setHomepageBanners] = useState<any[]>([]);

  const getBannerForPage = (identifier: string, fallbackImg: string, fallbackTitle: string, fallbackLink: string = "#") => {
    const term = (identifier || "").toLowerCase().trim();
    const found = homepageBanners.find((b: any) => {
      if (!b) return false;
      const p = (b.page || "").toLowerCase().trim();
      const id = (b.id || "").toLowerCase().trim();

      // Direct exact match
      if (p === term || id === term) return true;

      // Handle Category matching with alias & ID support (e.g. "Category: Combo", "cat-card-combo")
      if (term.startsWith("category:")) {
        const catPart = term.replace("category:", "").trim();
        const catSlug = catPart.replace(/\s+/g, "-");
        if (id === `cat-card-${catSlug}` || id === `cat-card-${catPart}`) return true;

        if (p.startsWith("category:")) {
          const pCatPart = p.replace("category:", "").trim();
          if (catPart === pCatPart) return true;
          // Slug-based matching: "skincare" matches "skin", "haircare" matches "hair"
          const pCatSlug = pCatPart.replace(/\s+/g, "-");
          if (catSlug === pCatSlug) return true;
          if (catPart.includes("skin") && pCatPart.includes("skin")) return true;
          if (catPart.includes("hair") && pCatPart.includes("hair")) return true;
          if (catPart.includes("baby") && pCatPart.includes("baby")) return true;
          if (catPart.includes("personal") && pCatPart.includes("personal")) return true;
          if (catPart.includes("undergarment") && pCatPart.includes("undergarment")) return true;
          if (catPart.includes("makeup") && pCatPart.includes("makeup")) return true;
          if (catPart.includes("fragrance") && pCatPart.includes("fragrance")) return true;
          if (catPart.includes("combo") && pCatPart.includes("combo")) return true;
        }
        // Critical: Never fall through to generic substring matching for category banners!
        return false;
      }

      // Handle Concern matching with alias & ID support
      if (term.startsWith("concern:")) {
        const conPart = term.replace("concern:", "").trim();
        const conSlug = conPart.replace(/\s+/g, "-");
        if (id === `concern-card-${conSlug}` || id === `concern-card-${conPart}`) return true;

        if (p.startsWith("concern:")) {
          const pConPart = p.replace("concern:", "").trim();
          if (conPart === pConPart || pConPart.includes(conPart) || conPart.includes(pConPart)) return true;
        }
        // Critical: Never fall through to generic substring matching for concern banners!
        return false;
      }

      // Prevent non-category queries (like campaign "COMBO") from matching category or concern cards
      if (p.startsWith("category:") || p.startsWith("concern:") || id.startsWith("cat-card-") || id.startsWith("concern-card-")) {
        return false;
      }

      // Substring match for deals / brand offers / campaigns
      if (term.length > 3 && (p === term || p.includes(term) || term.includes(p))) {
        return true;
      }

      return false;
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
        // Fetch real categories and promotional banners dynamically from backend database
        const [categoriesRes, bannersRes] = await Promise.all([
          fetchWithCache(`${API_BASE}/categories`, bypass).catch(() => null),
          fetchWithCache(`${API_BASE}/banners?t=${Date.now()}`, true).catch(() => null),
        ]);

        if (Array.isArray(categoriesRes) && categoriesRes.length > 0) {
          setCategories(categoriesRes);
        }
        if (Array.isArray(bannersRes) && bannersRes.length > 0) {
          // Store ALL banners for getBannerForPage lookups (Category, Concern, etc.)
          setHomepageBanners(bannersRes);
          // Extract dynamic hero slides from banners where page is Hero Slides or hero or Homepage
          const heroBanners = bannersRes.filter((b: any) => {
            const p = (b.page || "").toLowerCase().trim();
            const t = (b.title || "").toLowerCase().trim();
            return p.includes("hero") || t.includes("hero") || p === "homepage" || p === "hero slides";
          });
          if (heroBanners.length > 0) {
            setDynamicSlides(heroBanners.map((b: any, idx: number) => ({
              id: b.id || `hero-${idx}`,
              title: b.title || DEFAULT_HERO_SLIDES[idx % DEFAULT_HERO_SLIDES.length].title,
              desc: b.description || b.subTitle || DEFAULT_HERO_SLIDES[idx % DEFAULT_HERO_SLIDES.length].desc,
              bg: b.backgroundColor || "linear-gradient(135deg, #111827 0%, #1f2937 100%)",
              img: b.imageUrl || b.image || DEFAULT_HERO_SLIDES[idx % DEFAULT_HERO_SLIDES.length].img,
              mobileImg: b.mobileImageUrl || b.imageUrl || b.image || DEFAULT_HERO_SLIDES[idx % DEFAULT_HERO_SLIDES.length].mobileImg,
              tabletImg: b.tabletImageUrl || b.imageUrl || b.image || DEFAULT_HERO_SLIDES[idx % DEFAULT_HERO_SLIDES.length].tabletImg,
              link: b.linkUrl || b.link || "/shop"
            })));
          }
        }

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
    const primaryVariant = product.variants?.[0];
    const primaryImage = product.images?.find((img) => img.isPrimary)?.url || product.images?.[0]?.url || "";
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
        const currentSlide = activeSlidesList[safeSlideIdx] || activeSlidesList[0] || DEFAULT_HERO_SLIDES[0];
        const slideImg = currentSlide?.img || DEFAULT_HERO_SLIDES[0].img;
        const slideMobileImg = currentSlide?.mobileImg || slideImg;
        const slideTabletImg = currentSlide?.tabletImg || slideImg;
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
                    <source media="(max-width: 640px)" srcSet={slideMobileImg} />
                    <source media="(max-width: 1024px)" srcSet={slideTabletImg} />
                    <img
                      src={slideImg}
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
                    <source media="(max-width: 640px)" srcSet={slideMobileImg} />
                    <source media="(max-width: 1024px)" srcSet={slideTabletImg} />
                    <img
                      src={slideImg}
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



        {/* CLEARANCE SALE Section (Top Section) */}
        {(() => {
          const filtered = products
            .filter(p => p.category?.name?.toLowerCase().includes("clearance") || p.campaignName?.toLowerCase().includes("clearance") || p.name?.toLowerCase().includes("clearance"))
            .slice(0, 4);

          const clearanceProducts = filtered.length > 0 ? filtered : DEFAULT_CLEARANCE_PRODUCTS;

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

        {/* MAKEUP Section (After TOP BRANDS & OFFERS / Above LIMITED TIME OFFERS) */}
        {(() => {
          const filtered = products
            .filter(p => (p.category?.name?.toLowerCase().includes("makeup") && !p.category?.name?.toLowerCase().includes("tool")) || p.name?.toLowerCase().includes("lipstick") || p.name?.toLowerCase().includes("mascara") || p.name?.toLowerCase().includes("powder") || p.name?.toLowerCase().includes("foundation") || p.name?.toLowerCase().includes("primer") || p.name?.toLowerCase().includes("gloss"))
            .slice(0, 4);

          const makeupProducts = filtered.length > 0 ? filtered : DEFAULT_MAKEUP_PRODUCTS;

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

        {/* MAKEUP TOOLS Section (Above SHOP BEAUTY PRODUCTS BY CATEGORY) */}
        {(() => {
          const filtered = products
            .filter(p => p.category?.name?.toLowerCase().includes("tool") || p.name?.toLowerCase().includes("brush") || p.name?.toLowerCase().includes("sponge") || p.name?.toLowerCase().includes("curler") || p.name?.toLowerCase().includes("applicator"))
            .slice(0, 4);

          const toolProducts = filtered.length > 0 ? filtered : DEFAULT_TOOL_PRODUCTS;

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
        {(() => {
          const defaultCategories = [
            { name: "Makeup", slug: "makeup" },
            { name: "Skin", slug: "skin" },
            { name: "Hair", slug: "hair" },
            { name: "Personal Care", slug: "personal-care" },
            { name: "Mom & Baby", slug: "mom-baby" },
            { name: "Fragrance", slug: "fragrance" },
            { name: "Undergarments", slug: "undergarments" },
            { name: "Combo", slug: "combo" }
          ];

          const displayCats = defaultCategories.map(item => {
            const fromDb = categories.find((c: any) => c.name?.toLowerCase().trim() === item.name.toLowerCase() || c.slug === item.slug);
            return {
              id: fromDb?.id || `cat-${item.slug}`,
              name: fromDb?.name || item.name,
              slug: fromDb?.slug || item.slug,
              imageUrl: fromDb?.imageUrl || fromDb?.image || ""
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
                  const catImg = bannerInfo.img || cat.imageUrl;
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
                        <div style={{
                          aspectRatio: "1 / 1",
                          backgroundColor: "#fdf2f8",
                          border: "1.5px solid #fbcfe8",
                          borderRadius: "10px",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          padding: "10px",
                          boxShadow: "0 2px 6px rgba(0,0,0,0.03)"
                        }}>
                          <span style={{ fontSize: "26px", marginBottom: "4px" }}>✨</span>
                          <span style={{ fontSize: "12px", fontWeight: "800", color: "#0f172a", textAlign: "center", lineHeight: "1.2" }}>{cat.name}</span>
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
          const filtered = products
            .filter(p => p.category?.name?.toLowerCase().includes("hair") || p.name?.toLowerCase().includes("hair") || p.name?.toLowerCase().includes("shampoo") || p.name?.toLowerCase().includes("conditioner"))
            .slice(0, 4);

          const hairProducts = filtered.length > 0 ? filtered : DEFAULT_HAIR_PRODUCTS;

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
