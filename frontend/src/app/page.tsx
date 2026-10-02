"use client";

import React, { useEffect, useState } from "react";
import { fetchWithCache, API_BASE } from "../utils/api";
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
  images: { url: string; isPrimary: boolean }[];
  variants: { id: string; name: string; price: number; discountPrice: number | null; stock: number; shadeColor: string | null }[];
}

const DEFAULT_CONCERNS = [
  { name: "Acne", subtitle: "TREATMENT", image: "https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?w=100&h=100&fit=crop&q=80", link: "/shop?category=skincare&sub=Acne%20Treatment" },
  { name: "Anti Aging", subtitle: "CARE", image: "https://images.unsplash.com/photo-1601049676099-e7ed07d825b0?w=100&h=100&fit=crop&q=80", link: "/shop?category=skincare&sub=Anti%20Aging" },
  { name: "Dandruff", subtitle: "SOLUTION", image: "https://images.unsplash.com/photo-1562322140-8baeececf3df?w=100&h=100&fit=crop&q=80", link: "/shop?category=haircare&sub=Dandruff" },
  { name: "Dry Skin", subtitle: "HYDRATION", image: "https://images.unsplash.com/photo-1512290906873-108719bc5a0e?w=100&h=100&fit=crop&q=80", link: "/shop?category=skincare&sub=Dry%20Skin" },
  { name: "Hair Fall", subtitle: "DEFENSE", image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=100&h=100&fit=crop&q=80", link: "/shop?category=haircare&sub=Hair%20Fall" },
  { name: "Oil Control", subtitle: "BALANCE", image: "https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?w=100&h=100&fit=crop&q=80", link: "/shop?category=skincare" },
  { name: "Pore Care", subtitle: "REFINING", image: "https://images.unsplash.com/photo-1601049676099-e7ed07d825b0?w=100&h=100&fit=crop&q=80", link: "/shop?category=skincare&sub=Pore%20Care" },
  { name: "Spot Treatment", subtitle: "CLEAR GLOW", image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=100&h=100&fit=crop&q=80", link: "/shop?category=skincare" },
  { name: "Hair Thinning", subtitle: "VOLUME", image: "https://images.unsplash.com/photo-1562322140-8baeececf3df?w=100&h=100&fit=crop&q=80", link: "/shop?category=haircare" },
  { name: "Sun Burn", subtitle: "RELIEF", image: "https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=100&h=100&fit=crop&q=80", link: "/shop?category=skincare" }
];

export default function Home() {
  const { addToCart, wishlist, toggleWishlist } = useApp();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dynamicSlides, setDynamicSlides] = useState<any[]>([]);
  const [homepageBanners, setHomepageBanners] = useState<any[]>([]);
  const [pagesConfig, setPagesConfig] = useState<any>({
    shopByCategory: {
      title: "SHOP BEAUTY PRODUCTS BY CATEGORY",
      showCount: 8,
      enabled: true
    },
    shopByConcern: {
      title: "SHOP BY CONCERN",
      enabled: true,
      concerns: DEFAULT_CONCERNS
    }
  });

  const getBannerForPage = (pageName: string, fallbackImg: string, fallbackTitle: string, fallbackLink: string = "#") => {
    const found = homepageBanners.find((b: any) => b.page === pageName);
    return {
      img: found ? found.imageUrl : fallbackImg,
      title: found ? found.title : fallbackTitle,
      link: found ? (found.linkUrl || fallbackLink) : fallbackLink
    };
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
  const slides = [
    {
      title: "Glow Up Season is Here!",
      desc: "Up to 40% off on premium Korean Skincare brands. Get clear skin today.",
      bg: "linear-gradient(135deg, #e63b7a 0%, #ff758c 100%)",
      img: "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=600&q=80",
    },
    {
      title: "Vibrant Lips, Premium Shine",
      desc: "Explore L'Oreal Paris Color Riche collection with unique variants.",
      bg: "linear-gradient(135deg, #495057 0%, #1a1a2e 100%)",
      img: "https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=600&q=80",
    },
  ];

  // Auto rotate slides
  const activeSlidesList = dynamicSlides.length > 0 ? dynamicSlides : slides;

  useEffect(() => {
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
    const fetchMetadata = async () => {
      try {
        const [catData, brandData, bannerData] = await Promise.all([
          fetchWithCache("http://localhost:5000/api/categories"),
          fetchWithCache("http://localhost:5000/api/brands"),
          fetch("http://localhost:5000/api/banners").then(res => res.json()).catch(() => [])
        ]);
        setCategories(catData);
        setBrands(brandData);
        if (bannerData && bannerData.length > 0) {
          setHomepageBanners(bannerData);
          const homeBanners = bannerData.filter((b: any) => !b.page || b.page === "Homepage");
          if (homeBanners.length > 0) {
            setDynamicSlides(homeBanners.map((b: any) => ({
              title: b.title,
              desc: "Exclusive Collection at GlowGoodly",
              bg: b.bgColor || "linear-gradient(135deg, #e63b7a 0%, #ff758c 100%)",
              img: b.imageUrl,
              link: b.linkUrl || "#store-section"
            })));
          }
        }
        // Fetch active notification
        const notifRes = await fetch("http://localhost:5000/api/notifications/active").then(res => res.json()).catch(() => null);
        if (notifRes && notifRes.isActive) {
          const closedId = localStorage.getItem("glowgoodly_last_notification_closed");
          if (closedId !== notifRes.id) {
            setActiveNotification(notifRes);
            setShowNotification(true);
          }
        }

        // Fetch dynamic pages & sections config
        fetch(`${API_BASE}/settings/pages-config`)
          .then(res => res.json())
          .then(cfg => { if (cfg) setPagesConfig((prev: any) => ({ ...prev, ...cfg })); })
          .catch(() => {});
      } catch (e) {
        console.error("Error loading categories/brands/notifications", e);
      }
    };
    fetchMetadata();
  }, []);

  // Fetch filtered products
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        let url = `http://localhost:5000/api/products?`;
        if (activeCategory) url += `category=${activeCategory}&`;
        if (activeBrand) url += `brand=${activeBrand}&`;
        if (searchQuery) url += `search=${encodeURIComponent(searchQuery)}&`;
        if (minPrice) url += `minPrice=${minPrice}&`;
        if (maxPrice) url += `maxPrice=${maxPrice}&`;
        if (sortOption) url += `sort=${sortOption}&`;

        const data = await fetchWithCache(url);
        setProducts(data);
      } catch (e) {
        console.error("Error loading products", e);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
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

      {/* Full-width Dynamic Promotional Banner Slider - Responsive with larger styling */}
      <section
        className="hero-banner-slider-container"
        style={{
          background: activeSlidesList[activeSlide]?.bg || "linear-gradient(135deg, #e63b7a 0%, #ff758c 100%)",
        }}
      >
        <div className="container" style={{ display: "flex", width: "100%", height: "100%", position: "relative" }}>
          <div className="hero-slider-content">
            <h1 className="hero-slider-title">
              {activeSlidesList[activeSlide]?.title}
            </h1>
            <p className="hero-slider-desc">
              {activeSlidesList[activeSlide]?.desc}
            </p>
            <Link
              href={activeSlidesList[activeSlide]?.link || "#store-section"}
              style={{
                backgroundColor: "var(--white)",
                color: "var(--primary)",
                padding: "14px 32px",
                borderRadius: "var(--radius-full)",
                fontSize: "14px",
                fontWeight: "800",
                width: "fit-content",
                boxShadow: "var(--shadow-md)",
                cursor: "pointer",
                transition: "var(--transition-fast)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.05)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              SHOP THE CAMPAIGN
            </Link>
          </div>
          <div className="hero-slider-image-container">
            <img
              src={activeSlidesList[activeSlide]?.img}
              alt="Banner Promotion"
              className="hero-slider-image"
            />
          </div>

          {/* Dots Indicator */}
          <div
            style={{
              position: "absolute",
              bottom: "15px",
              left: "50%",
              transform: "translateX(-50%)",
              display: "flex",
              gap: "10px",
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
                  backgroundColor: activeSlide === idx ? "#e52860" : "#555555",
                  cursor: "pointer",
                  transition: "var(--transition-fast)",
                }}
              />
            ))}
          </div>
        </div>
      </section>

      <main className="container" style={{ paddingBottom: "40px", paddingTop: "20px" }}>

        {/* Wide horizontal promo banner ad */}
        <Link href={getBannerForPage("Homepage Wide Banner", "", "").link} style={{ margin: "10px 0 35px 0", borderRadius: "var(--radius-md)", overflow: "hidden", cursor: "pointer", display: "block" }} className="promo-card-hover">
          <img
            src={getBannerForPage("Homepage Wide Banner", "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=1200&q=80", "").img}
            alt={getBannerForPage("Homepage Wide Banner", "", "Beauty Must Haves Exclusive Savings").title}
            style={{
              width: "100%",
              height: "auto",
              maxHeight: "160px",
              objectFit: "cover",
              display: "block",
            }}
          />
        </Link>

        {/* DEALS YOU CANNOT MISS Section */}
        <section style={{ margin: "30px 0 40px 0" }}>
          <h2 style={{ fontSize: "14px", fontWeight: "800", textAlign: "center", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "20px", color: "var(--dark)" }}>
            DEALS YOU CANNOT MISS
          </h2>
          <div className="shajgoj-grid-4">
            {/* Card 1 */}
            <Link href={getBannerForPage("Deal Card 1", "", "", "/shop?category=clearance-sale").link} style={{ borderRadius: "var(--radius-md)", overflow: "hidden", boxShadow: "var(--shadow-sm)", border: "1px solid var(--gray-200)", cursor: "pointer", transition: "var(--transition-fast)", backgroundColor: "#fff", display: "block", textDecoration: "none" }} className="promo-card-hover">
              <img src={getBannerForPage("Deal Card 1", "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=500&q=80", "", "/shop?category=clearance-sale").img} alt="Deal Card 1" style={{ width: "100%", height: "260px", objectFit: "cover" }} />
              <div style={{ padding: "10px", textAlign: "center", fontWeight: "700", fontSize: "12px", color: "var(--primary)" }}>{getBannerForPage("Deal Card 1", "", "MEGA OFFERS (UP TO 50% OFF)").title}</div>
            </Link>
            {/* Card 2 */}
            <Link href={getBannerForPage("Deal Card 2", "", "", "/shop?category=skincare").link} style={{ borderRadius: "var(--radius-md)", overflow: "hidden", boxShadow: "var(--shadow-sm)", border: "1px solid var(--gray-200)", cursor: "pointer", transition: "var(--transition-fast)", backgroundColor: "#fff", display: "block", textDecoration: "none" }} className="promo-card-hover">
              <img src={getBannerForPage("Deal Card 2", "https://images.unsplash.com/photo-1612817288484-6f916006741a?w=500&q=80", "", "/shop?category=skincare").img} alt="Deal Card 2" style={{ width: "100%", height: "260px", objectFit: "cover" }} />
              <div style={{ padding: "10px", textAlign: "center", fontWeight: "700", fontSize: "12px", color: "var(--primary)" }}>{getBannerForPage("Deal Card 2", "", "GOODNESS OF NATURE").title}</div>
            </Link>
            {/* Card 3 */}
            <Link href={getBannerForPage("Deal Card 3", "", "", "/shop?category=combo").link} style={{ borderRadius: "var(--radius-md)", overflow: "hidden", boxShadow: "var(--shadow-sm)", border: "1px solid var(--gray-200)", cursor: "pointer", transition: "var(--transition-fast)", backgroundColor: "#fff", display: "block", textDecoration: "none" }} className="promo-card-hover">
              <img src={getBannerForPage("Deal Card 3", "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=500&q=80", "", "/shop?category=combo").img} alt="Deal Card 3" style={{ width: "100%", height: "260px", objectFit: "cover" }} />
              <div style={{ padding: "10px", textAlign: "center", fontWeight: "700", fontSize: "12px", color: "var(--primary)" }}>{getBannerForPage("Deal Card 3", "", "BUY 2 GET BDT 101 OFF").title}</div>
            </Link>
            {/* Card 4 */}
            <Link href={getBannerForPage("Deal Card 4", "", "", "/shop?category=makeup").link} style={{ borderRadius: "var(--radius-md)", overflow: "hidden", boxShadow: "var(--shadow-sm)", border: "1px solid var(--gray-200)", cursor: "pointer", transition: "var(--transition-fast)", backgroundColor: "#fff", display: "block", textDecoration: "none" }} className="promo-card-hover">
              <img src={getBannerForPage("Deal Card 4", "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=500&q=80", "", "/shop?category=makeup").img} alt="Deal Card 4" style={{ width: "100%", height: "260px", objectFit: "cover" }} />
              <div style={{ padding: "10px", textAlign: "center", fontWeight: "700", fontSize: "12px", color: "var(--primary)" }}>{getBannerForPage("Deal Card 4", "", "OMBRE SALE (UP TO 16% OFF)").title}</div>
            </Link>
          </div>
        </section>

        {/* TOP BRANDS & OFFERS Section */}
        <section style={{ margin: "40px 0" }}>
          <h2 style={{ fontSize: "14px", fontWeight: "800", textAlign: "center", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "20px", color: "var(--dark)" }}>
            TOP BRANDS & OFFERS
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "15px" }}>
            {/* Banner 1 */}
            <Link href={getBannerForPage("Brand Offer 1", "", "", "/shop?search=trimmer").link} style={{ borderRadius: "var(--radius-md)", overflow: "hidden", boxShadow: "var(--shadow-sm)", border: "1px solid var(--gray-200)", cursor: "pointer", transition: "var(--transition-fast)", backgroundColor: "#fff", display: "block", textDecoration: "none" }} className="promo-card-hover">
              <img src={getBannerForPage("Brand Offer 1", "https://images.unsplash.com/photo-1608248597279-f99d160bfcbc5?w=800&q=80", "", "/shop?search=trimmer").img} alt="Brand Offer 1" style={{ width: "100%", height: "180px", objectFit: "cover" }} />
              <div style={{ padding: "10px", textAlign: "center", fontWeight: "700", fontSize: "12.5px", color: "#2b3544" }}>{getBannerForPage("Brand Offer 1", "", "THE ONLY TRIMMER YOU NEED").title}</div>
            </Link>
            {/* Banner 2 */}
            <Link href={getBannerForPage("Brand Offer 2", "", "", "/shop?search=sunscreen").link} style={{ borderRadius: "var(--radius-md)", overflow: "hidden", boxShadow: "var(--shadow-sm)", border: "1px solid var(--gray-200)", cursor: "pointer", transition: "var(--transition-fast)", backgroundColor: "#fff", display: "block", textDecoration: "none" }} className="promo-card-hover">
              <img src={getBannerForPage("Brand Offer 2", "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=800&q=80", "", "/shop?search=sunscreen").img} alt="Brand Offer 2" style={{ width: "100%", height: "180px", objectFit: "cover" }} />
              <div style={{ padding: "10px", textAlign: "center", fontWeight: "700", fontSize: "12.5px", color: "#2b3544" }}>{getBannerForPage("Brand Offer 2", "", "SUMMER PROTECTION (UP TO 50% OFF)").title}</div>
            </Link>
            {/* Banner 3 */}
            <Link href={getBannerForPage("Brand Offer 3", "", "", "/shop?brand=Vatika").link} style={{ borderRadius: "var(--radius-md)", overflow: "hidden", boxShadow: "var(--shadow-sm)", border: "1px solid var(--gray-200)", cursor: "pointer", transition: "var(--transition-fast)", backgroundColor: "#fff", display: "block", textDecoration: "none" }} className="promo-card-hover">
              <img src={getBannerForPage("Brand Offer 3", "https://images.unsplash.com/photo-1527799822364-9491090333d0?w=800&q=80", "", "/shop?brand=Vatika").img} alt="Brand Offer 3" style={{ width: "100%", height: "180px", objectFit: "cover" }} />
              <div style={{ padding: "10px", textAlign: "center", fontWeight: "700", fontSize: "12.5px", color: "#2b3544" }}>{getBannerForPage("Brand Offer 3", "", "FLAT 30% OFF ON VATIKA").title}</div>
            </Link>
            {/* Banner 4 */}
            <Link href={getBannerForPage("Brand Offer 4", "", "", "/shop?search=glow").link} style={{ borderRadius: "var(--radius-md)", overflow: "hidden", boxShadow: "var(--shadow-sm)", border: "1px solid var(--gray-200)", cursor: "pointer", transition: "var(--transition-fast)", backgroundColor: "#fff", display: "block", textDecoration: "none" }} className="promo-card-hover">
              <img src={getBannerForPage("Brand Offer 4", "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&q=80", "", "/shop?search=glow").img} alt="Brand Offer 4" style={{ width: "100%", height: "180px", objectFit: "cover" }} />
              <div style={{ padding: "10px", textAlign: "center", fontWeight: "700", fontSize: "12.5px", color: "#2b3544" }}>{getBannerForPage("Brand Offer 4", "", "TREASURE OF GLOW (UP TO 35% OFF)").title}</div>
            </Link>
            {/* Banner 5 */}
            <Link href={getBannerForPage("Brand Offer 5", "", "", "/shop?brand=The+Ordinary").link} style={{ borderRadius: "var(--radius-md)", overflow: "hidden", boxShadow: "var(--shadow-sm)", border: "1px solid var(--gray-200)", cursor: "pointer", transition: "var(--transition-fast)", backgroundColor: "#fff", display: "block", textDecoration: "none" }} className="promo-card-hover">
              <img src={getBannerForPage("Brand Offer 5", "https://images.unsplash.com/photo-1612817288484-6f916006741a?w=800&q=80", "", "/shop?brand=The+Ordinary").img} alt="Brand Offer 5" style={{ width: "100%", height: "180px", objectFit: "cover" }} />
              <div style={{ padding: "10px", textAlign: "center", fontWeight: "700", fontSize: "12.5px", color: "#2b3544" }}>{getBannerForPage("Brand Offer 5", "", "THE ORDINARY (UP TO 33% OFF)").title}</div>
            </Link>
            {/* Banner 6 */}
            <Link href={getBannerForPage("Brand Offer 6", "", "", "/shop?brand=skin+cafe&search=shower+gel").link} style={{ borderRadius: "var(--radius-md)", overflow: "hidden", boxShadow: "var(--shadow-sm)", border: "1px solid var(--gray-200)", cursor: "pointer", transition: "var(--transition-fast)", backgroundColor: "#fff", display: "block", textDecoration: "none" }} className="promo-card-hover">
              <img src={getBannerForPage("Brand Offer 6", "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=800&q=80", "", "/shop?brand=skin+cafe&search=shower+gel").img} alt="Brand Offer 6" style={{ width: "100%", height: "180px", objectFit: "cover" }} />
              <div style={{ padding: "10px", textAlign: "center", fontWeight: "700", fontSize: "12.5px", color: "#2b3544" }}>{getBannerForPage("Brand Offer 6", "", "SKIN CAFE SHOWER GEL").title}</div>
            </Link>
          </div>
        </section>

        {/* EXTRA DISCOUNT Section */}
        <section style={{ margin: "40px 0" }}>
          <h2 style={{ fontSize: "14px", fontWeight: "800", textAlign: "center", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "20px", color: "var(--dark)" }}>
            EXTRA DISCOUNT
          </h2>
          <Link href={getBannerForPage("Homepage Extra Discount", "", "").link} style={{ borderRadius: "var(--radius-md)", overflow: "hidden", cursor: "pointer", display: "block" }} className="promo-card-hover">
            <img
              src={getBannerForPage("Homepage Extra Discount", "https://images.unsplash.com/photo-1617897903246-719242758050?w=1200&q=80", "").img}
              alt={getBannerForPage("Homepage Extra Discount", "", "Extra Discount Step-by-Step Deal").title}
              style={{
                width: "100%",
                height: "auto",
                maxHeight: "160px",
                objectFit: "cover",
                display: "block",
              }}
            />
          </Link>
        </section>

        {/* LIMITED TIME OFFERS Section */}
        <section style={{ margin: "40px 0" }}>
          <h2 style={{ fontSize: "14px", fontWeight: "800", textAlign: "center", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "20px", color: "var(--dark)" }}>
            LIMITED TIME OFFERS
          </h2>
          <div className="shajgoj-grid-4">
            {/* Card 1: BOGO */}
            <Link href={getBannerForPage("Offer BOGO", "/shop?campaign=BOGO", "").link} style={{ display: "block", background: `url(${getBannerForPage("Offer BOGO", "", "").img}) center/cover, linear-gradient(135deg, #d63384 0%, #e52860 100%)`, borderRadius: "16px", height: "200px", color: "#ffffff", padding: "20px", textAlign: "center", boxShadow: "var(--shadow-sm)", cursor: "pointer", position: "relative", overflow: "hidden", textDecoration: "none" }} className="promo-card-hover">
              <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", height: "100%", width: "100%", background: getBannerForPage("Offer BOGO", "", "").img ? "rgba(0,0,0,0.4)" : "transparent" }}>
                <span style={{ fontSize: "10px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "1.5px", opacity: "0.9" }}>{getBannerForPage("Offer BOGO", "", "Double the fun with").title}</span>
                {!getBannerForPage("Offer BOGO", "", "").title && <span style={{ fontSize: "36px", fontWeight: "900", textTransform: "uppercase", letterSpacing: "0.5px", transform: "rotate(-3deg)", marginTop: "8px" }}>BOGO</span>}
              </div>
            </Link>
            {/* Card 2: COMBO */}
            <Link href={getBannerForPage("Offer COMBO", "/shop?campaign=COMBO", "").link} style={{ display: "block", background: `url(${getBannerForPage("Offer COMBO", "", "").img}) center/cover, linear-gradient(135deg, #d63384 0%, #e52860 100%)`, borderRadius: "16px", height: "200px", color: "#ffffff", padding: "20px", textAlign: "center", boxShadow: "var(--shadow-sm)", cursor: "pointer", position: "relative", overflow: "hidden", textDecoration: "none" }} className="promo-card-hover">
              <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", height: "100%", width: "100%", background: getBannerForPage("Offer COMBO", "", "").img ? "rgba(0,0,0,0.4)" : "transparent" }}>
                <span style={{ fontSize: "10px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "1.5px", opacity: "0.9" }}>{getBannerForPage("Offer COMBO", "", "Perfect Match").title}</span>
                {!getBannerForPage("Offer COMBO", "", "").title && <span style={{ fontSize: "36px", fontWeight: "900", textTransform: "uppercase", letterSpacing: "0.5px", transform: "rotate(-3deg)", marginTop: "8px" }}>COMBO</span>}
              </div>
            </Link>
            {/* Card 3: EXCLUSIVE OFFERS */}
            <Link href={getBannerForPage("Offer Exclusive", "/shop?campaign=EXCLUSIVE", "").link} style={{ display: "block", background: `url(${getBannerForPage("Offer Exclusive", "", "").img}) center/cover, linear-gradient(135deg, #d63384 0%, #e52860 100%)`, borderRadius: "16px", height: "200px", color: "#ffffff", padding: "20px", textAlign: "center", boxShadow: "var(--shadow-sm)", cursor: "pointer", position: "relative", overflow: "hidden", textDecoration: "none" }} className="promo-card-hover">
              <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", height: "100%", width: "100%", background: getBannerForPage("Offer Exclusive", "", "").img ? "rgba(0,0,0,0.4)" : "transparent" }}>
                <span style={{ fontSize: "10px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "1.5px", opacity: "0.9" }}>{getBannerForPage("Offer Exclusive", "", "Exclusive").title}</span>
                {!getBannerForPage("Offer Exclusive", "", "").title && <span style={{ fontSize: "36px", fontWeight: "900", textTransform: "uppercase", letterSpacing: "0.5px", transform: "rotate(-3deg)", marginTop: "8px" }}>OFFERS</span>}
              </div>
            </Link>
            {/* Card 4: CLEARANCE SALE */}
            <Link href={getBannerForPage("Offer Clearance", "/shop?campaign=CLEARANCE", "").link} style={{ display: "block", background: `url(${getBannerForPage("Offer Clearance", "", "").img}) center/cover, linear-gradient(135deg, #d63384 0%, #e52860 100%)`, borderRadius: "16px", height: "200px", color: "#ffffff", padding: "20px", textAlign: "center", boxShadow: "var(--shadow-sm)", cursor: "pointer", position: "relative", overflow: "hidden", textDecoration: "none" }} className="promo-card-hover">
              <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", height: "100%", width: "100%", background: getBannerForPage("Offer Clearance", "", "").img ? "rgba(0,0,0,0.4)" : "transparent" }}>
                <span style={{ fontSize: "10px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "1.5px", opacity: "0.9" }}>{getBannerForPage("Offer Clearance", "", "Clearance").title}</span>
                {!getBannerForPage("Offer Clearance", "", "").title && <span style={{ fontSize: "36px", fontWeight: "900", textTransform: "uppercase", letterSpacing: "0.5px", transform: "rotate(-3deg)", marginTop: "8px" }}>SALE</span>}
              </div>
            </Link>
          </div>
        </section>

        {/* SHOP BEAUTY PRODUCTS BY CATEGORY Section */}
        {pagesConfig?.shopByCategory?.enabled !== false && (
          <section style={{ margin: "40px 0" }}>
            <h2 style={{ fontSize: "14px", fontWeight: "800", textAlign: "center", textTransform: "uppercase", letterSpacing: "1px", marginBottom: pagesConfig?.shopByCategory?.subtitle ? "6px" : "20px", color: "var(--dark)" }}>
              {pagesConfig?.shopByCategory?.title || "SHOP BEAUTY PRODUCTS BY CATEGORY"}
            </h2>
            {pagesConfig?.shopByCategory?.subtitle && (
              <p style={{ textAlign: "center", fontSize: "12px", color: "#718096", margin: "0 0 20px 0" }}>
                {pagesConfig.shopByCategory.subtitle}
              </p>
            )}
            <div className="shajgoj-grid-4">
              {categories.filter(c => !c.parentId).slice(0, pagesConfig?.shopByCategory?.showCount || 8).map((cat) => (
                <Link 
                  key={cat.id} 
                  href={`/shop?category=${cat.id}`} 
                  style={{ display: "block", borderRadius: "16px", overflow: "hidden", height: "260px", position: "relative", boxShadow: "var(--shadow-sm)", cursor: "pointer" }} 
                  className="promo-card-hover"
                >
                  <img 
                    src={getBannerForPage(`Category: ${cat.name}`, cat.imageUrl || "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=500&q=80", "").img} 
                    alt={cat.name} 
                    style={{ width: "100%", height: "100%", objectFit: "cover" }} 
                  />
                  <div style={{ position: "absolute", top: "15px", width: "100%", textAlign: "center", color: "#ffffff", textShadow: "1px 1px 3px rgba(0,0,0,0.8)", fontSize: "20px", fontWeight: "900", textTransform: "uppercase", letterSpacing: "1px" }}>
                    {cat.name}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
        
        {/* SHOP BY CONCERN Section */}
        {pagesConfig?.shopByConcern?.enabled !== false && (
          <section style={{ margin: "40px 0" }}>
            <h2 style={{ fontSize: "14px", fontWeight: "800", textAlign: "center", textTransform: "uppercase", letterSpacing: "1px", marginBottom: pagesConfig?.shopByConcern?.subtitle ? "6px" : "20px", color: "var(--dark)" }}>
              {pagesConfig?.shopByConcern?.title || "SHOP BY CONCERN"}
            </h2>
            {pagesConfig?.shopByConcern?.subtitle && (
              <p style={{ textAlign: "center", fontSize: "12px", color: "#718096", margin: "0 0 20px 0" }}>
                {pagesConfig.shopByConcern.subtitle}
              </p>
            )}
            <div className="shajgoj-grid-5">
              {(pagesConfig?.shopByConcern?.concerns && pagesConfig?.shopByConcern?.concerns.length > 0 ? pagesConfig.shopByConcern.concerns : DEFAULT_CONCERNS).map((concern: any, idx: number) => (
                <Link
                  key={idx}
                  href={getBannerForPage(`Concern: ${concern.name}`, concern.link || "/shop", "").link}
                  style={{ display: "flex", textDecoration: "none", background: "linear-gradient(135deg, #e5a93b 0%, #ffd066 100%)", borderRadius: "16px", height: "230px", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "20px", textAlign: "center", color: "#ffffff", cursor: "pointer", boxShadow: "var(--shadow-sm)" }}
                  className="promo-card-hover"
                >
                  <img
                    src={getBannerForPage(`Concern: ${concern.name}`, concern.image || "https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?w=100&h=100&fit=crop&q=80", "").img}
                    alt={concern.name}
                    style={{ width: "90px", height: "90px", borderRadius: "50%", objectFit: "cover", border: "2px solid #ffffff", marginBottom: "15px" }}
                  />
                  <span style={{ fontSize: "15px", fontWeight: "900", letterSpacing: "0.5px", textShadow: "1px 1px 2px rgba(0,0,0,0.3)" }}>
                    {concern.name?.toUpperCase()}
                  </span>
                  <span style={{ fontSize: "10px", fontWeight: "800", opacity: "0.9" }}>
                    {concern.subtitle?.toUpperCase()}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

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
