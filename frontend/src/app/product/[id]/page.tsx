"use client";

import React, { useEffect, useState, useRef, useMemo } from "react";
import Header from "../../../components/Header";
import MobileNavbar from "../../../components/MobileNavbar";
import Footer from "../../../components/Footer";
import { useApp } from "../../../context/AppContext";
import { trackViewContent } from "../../../utils/pixel";
import Link from "next/link";

interface Variant {
  id: string;
  name: string;
  price: number;
  discountPrice: number | null;
  stock: number;
  sku: string;
  shadeColor: string | null;
  sizeValue: string | null;
}

interface ProductDetail {
  id: string;
  name: string;
  description: string;
  ingredients: string;
  howToUse: string;
  brand: { name: string };
  category: { name: string };
  subcategory?: string | null;
  childSubcategory?: string | null;
  images: { id: string; url: string; isPrimary: boolean }[];
  variants: Variant[];
  reviews: { id: string; customerName: string; rating: number; comment: string; createdAt: string }[];
}

export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { addToCart, wishlist, toggleWishlist } = useApp();
  const [unwrappedParams, setUnwrappedParams] = useState<{ id: string } | null>(null);
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const relatedSliderRef = useRef<HTMLDivElement>(null);
  const offersSliderRef = useRef<HTMLDivElement>(null);
  const [isOffersPaused, setIsOffersPaused] = useState(false);

  const scrollOffers = (direction: "left" | "right") => {
    if (offersSliderRef.current) {
      const amount = direction === "left" ? -240 : 240;
      offersSliderRef.current.scrollBy({ left: amount, behavior: "smooth" });
    }
  };

  // Auto-scroll Available Offers slider every 2.5 seconds (Pauses on hover/touch)
  useEffect(() => {
    if (isOffersPaused) return;
    const timer = setInterval(() => {
      if (offersSliderRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = offersSliderRef.current;
        if (scrollLeft + clientWidth >= scrollWidth - 10) {
          offersSliderRef.current.scrollTo({ left: 0, behavior: "smooth" });
        } else {
          offersSliderRef.current.scrollBy({ left: 200, behavior: "smooth" });
        }
      }
    }, 2500);
    return () => clearInterval(timer);
  }, [isOffersPaused]);

  // Detail View States
  const [activeImage, setActiveImage] = useState("");
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [activeTab, setActiveTab] = useState<"desc" | "ingredients" | "howToUse">("desc");

  // Review Form States
  const [customerName, setCustomerName] = useState("");
  const [rating, setRating] = useState("5");
  const [comment, setComment] = useState("");
  const [reviewMessage, setReviewMessage] = useState("");

  // Unwrap params
  useEffect(() => {
    params.then((p) => setUnwrappedParams(p));
  }, [params]);

  useEffect(() => {
    if (!unwrappedParams) return;
    if (typeof window !== "undefined") {
      window.scrollTo(0, 0);
    }
    const fetchProductDetails = async () => {
      setLoading(true);
      try {
        const res = await fetch(`http://localhost:5000/api/products/${unwrappedParams.id}`, { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          setProduct(data.product);
          setRelatedProducts(data.relatedProducts);

          // Always set Product Main Cover Image as the primary display image when page opens
          const mainCoverImg = data.product.images?.find((img: any) => img.isPrimary)?.url 
            || data.product.images?.[0]?.url 
            || (data.product.variants?.[0] as any)?.imageUrl 
            || "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=500&auto=format&fit=crop&q=60";

          setActiveImage(mainCoverImg);
          if (data.product.variants.length > 0) {
            setSelectedVariant(data.product.variants[0]);
          }

          // Meta Pixel ViewContent event
          trackViewContent({
            id: data.product.id,
            name: data.product.name,
            price: data.product.variants?.[0]?.discountPrice || data.product.variants?.[0]?.price || 0,
            category: data.product.category?.name || "Cosmetics"
          });
        }
      } catch (e) {
        console.error("Error fetching product", e);
      } finally {
        setLoading(false);
      }
    };
    fetchProductDetails();
  }, [unwrappedParams]);

  // Dynamic SEO meta tags updater (safe non-destructive DOM update)
  useEffect(() => {
    if (product) {
      document.title = `${product.name} | GlowGoodly`;
      
      // Update meta description
      let metaDesc = document.querySelector('meta[name="description"]');
      if (!metaDesc) {
        metaDesc = document.createElement('meta');
        metaDesc.setAttribute('name', 'description');
        document.head.appendChild(metaDesc);
      }
      metaDesc.setAttribute('content', product.description.substring(0, 160).replace(/\n/g, ' '));

      // Update primary og:image tag in-place without deleting nodes
      let ogImage = document.querySelector('meta[property="og:image"]');
      if (!ogImage) {
        ogImage = document.createElement('meta');
        ogImage.setAttribute('property', 'og:image');
        document.head.appendChild(ogImage);
      }
      const primaryImg = product.images?.find((img: any) => img.isPrimary)?.url || product.images?.[0]?.url;
      if (primaryImg) {
        ogImage.setAttribute('content', primaryImg);
      }
    }
  }, [product]);

  const handleAddToCart = () => {
    if (!product || !selectedVariant) return;

    addToCart({
      id: selectedVariant.id,
      productId: product.id,
      name: product.name,
      variantName: selectedVariant.name,
      image: activeImage,
      price: selectedVariant.discountPrice || selectedVariant.price,
      stock: selectedVariant.stock || 50,
    });
  };

  const handleBuyNow = () => {
    handleAddToCart();
    window.location.href = "/checkout";
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unwrappedParams) return;
    if (!customerName || !comment) {
      setReviewMessage("Please fill in all review fields.");
      return;
    }

    try {
      const res = await fetch(`http://localhost:5000/api/products/${unwrappedParams.id}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerName, rating, comment }),
      });
      if (res.ok) {
        setCustomerName("");
        setComment("");
        setReviewMessage("Thank you! Your review has been submitted and is pending admin approval.");
      } else {
        setReviewMessage("Failed to submit review. Please try again.");
      }
    } catch (e) {
      setReviewMessage("An error occurred. Please try again later.");
    }
  };

  // Build complete list of images: 1st is Main Cover, followed by Shade 1, Shade 2, Shade 3 in exact order
  const allGalleryItems = useMemo(() => {
    if (!product) return [];
    const items: { id: string; url: string; variant?: Variant; isCover?: boolean }[] = [];
    const addedUrls = new Set<string>();

    // 1. First thumbnail is ALWAYS Main Cover Product Image
    const coverUrl = product.images?.find(i => i.isPrimary)?.url || product.images?.[0]?.url;
    if (coverUrl) {
      addedUrls.add(coverUrl);
      items.push({ id: "cover-img", url: coverUrl, isCover: true });
    }

    // 2. Next thumbnails match each variant in exact index order (Shade 1, Shade 2, Shade 3...)
    (product.variants || []).forEach((v, vIdx) => {
      const vImg = ((v as any).imageUrl && (v as any).imageUrl.trim() !== "")
        ? (v as any).imageUrl
        : product.images?.[vIdx + 1]?.url || coverUrl;

      if (vImg) {
        items.push({
          id: `var-thumb-${v.id || vIdx}`,
          url: vImg,
          variant: v
        });
      }
    });

    // 3. Add any additional product gallery images not already added
    (product.images || []).forEach((img, idx) => {
      if (img.url && !addedUrls.has(img.url) && !items.some(i => i.url === img.url)) {
        addedUrls.add(img.url);
        items.push({ id: img.id || `img-extra-${idx}`, url: img.url });
      }
    });

    return items;
  }, [product]);

  if (loading || !product) {
    return (
      <>
        <Header />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "400px", color: "var(--primary)", fontWeight: "800" }}>
          Loading product details...
        </div>
        <MobileNavbar />
      </>
    );
  }

  const isDiscounted = selectedVariant?.discountPrice !== null;
  const currentPrice = selectedVariant ? (isDiscounted ? selectedVariant.discountPrice : selectedVariant.price) : 0;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            "name": product.name,
            "image": product.images.map((img) => img.url),
            "description": product.description || "Authentic product available at GlowGoodly",
            "sku": selectedVariant?.sku || product.variants[0]?.sku || product.id,
            "mpn": product.id,
            "brand": {
              "@type": "Brand",
              "name": product.brand?.name || "GlowGoodly"
            },
            "offers": {
              "@type": "Offer",
              "url": typeof window !== "undefined" ? window.location.href : "",
              "priceCurrency": "BDT",
              "price": selectedVariant ? (selectedVariant.discountPrice || selectedVariant.price) : (product.variants[0]?.discountPrice || product.variants[0]?.price || 0),
              "priceValidUntil": "2027-12-31",
              "itemCondition": "https://schema.org/NewCondition",
              "availability": selectedVariant && selectedVariant.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
              "seller": {
                "@type": "Organization",
                "name": "GlowGoodly"
              }
            },
            "aggregateRating": product.reviews.length > 0 ? {
              "@type": "AggregateRating",
              "ratingValue": (product.reviews.reduce((acc, r) => acc + r.rating, 0) / product.reviews.length).toFixed(1),
              "reviewCount": product.reviews.length
            } : undefined,
            "review": product.reviews.map((rev) => ({
              "@type": "Review",
              "author": {
                "@type": "Person",
                "name": rev.customerName
              },
              "datePublished": rev.createdAt,
              "reviewBody": rev.comment,
              "reviewRating": {
                "@type": "Rating",
                "ratingValue": rev.rating
              }
            }))
          })
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
              {
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": "https://shop.glowgoodly.com"
              },
              {
                "@type": "ListItem",
                "position": 2,
                "name": product.category?.name || "Shop",
                "item": `https://shop.glowgoodly.com/shop?category=${encodeURIComponent(product.category?.name || "")}`
              },
              {
                "@type": "ListItem",
                "position": 3,
                "name": product.name,
                "item": `https://shop.glowgoodly.com/product/${product.id}`
              }
            ]
          })
        }}
      />
      <Header />

      <main className="container" style={{ padding: "30px 20px 60px 20px" }}>
        
        {/* Shajgoj-style Breadcrumbs Bar (Matches Image 2 & Image 4) */}
        <div style={{ backgroundColor: "#f8fafc", padding: "12px 18px", borderRadius: "10px", border: "1px solid #e2e8f0", fontSize: "13.5px", fontWeight: "600", color: "#64748b", marginBottom: "28px", display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          <Link href="/" style={{ color: "#475569", textDecoration: "none" }}>Home</Link>
          <span>›</span>
          <Link href="/shop" style={{ color: "#475569", textDecoration: "none" }}>Shop</Link>
          <span>›</span>
          <Link href={`/shop?category=${encodeURIComponent(product.category?.name || "makeup")}`} style={{ color: "#475569", textDecoration: "none" }}>{product.category?.name || "Makeup"}</Link>
          {product.subcategory && (
            <>
              <span>›</span>
              <Link href={`/shop?category=${encodeURIComponent(product.category?.name || "")}&sub=${encodeURIComponent(product.subcategory)}`} style={{ color: "#475569", textDecoration: "none" }}>{product.subcategory}</Link>
            </>
          )}
          {product.childSubcategory && (
            <>
              <span>›</span>
              <Link href={`/shop?category=${encodeURIComponent(product.category?.name || "")}&sub=${encodeURIComponent(product.childSubcategory)}`} style={{ color: "#475569", textDecoration: "none" }}>{product.childSubcategory}</Link>
            </>
          )}
          <span>›</span>
          <span style={{ color: "#e2136e", fontWeight: "800" }}>{product.name}</span>
        </div>

        {/* Product General Layout */}
        <div style={{ display: "flex", gap: "40px", flexWrap: "wrap", marginBottom: "40px" }}>
          
          {/* Images Section */}
          <div style={{ flex: "1.2", minWidth: "300px" }}>
            <div
              style={{
                width: "100%",
                height: "400px",
                borderRadius: "var(--radius-lg)",
                backgroundColor: "var(--white)",
                border: "1px solid var(--gray-200)",
                overflow: "hidden",
                boxShadow: "var(--shadow-sm)",
                marginBottom: "15px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <img
                src={activeImage || "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=500&auto=format&fit=crop&q=60"}
                alt={product.name}
                onError={(e) => { e.currentTarget.src = "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=500&auto=format&fit=crop&q=60"; }}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>
            
            {/* Gallery Thumbnails (All shade pictures side-by-side as highlighted in red boxes) */}
            <div style={{ display: "flex", gap: "10px", overflowX: "auto", paddingBottom: "8px" }}>
              {allGalleryItems.map((item) => {
                const isActive = activeImage === item.url;
                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      setActiveImage(item.url);
                      if (item.variant) {
                        setSelectedVariant(item.variant);
                      }
                    }}
                    style={{
                      width: "72px",
                      height: "72px",
                      borderRadius: "8px",
                      border: isActive ? "2.5px solid #e63b7a" : "1.5px solid #cbd5e1",
                      boxShadow: isActive ? "0 2px 8px rgba(230, 59, 122, 0.2)" : "none",
                      cursor: "pointer",
                      overflow: "hidden",
                      flexShrink: 0,
                      backgroundColor: "#ffffff",
                      position: "relative",
                      transition: "all 0.2s ease"
                    }}
                  >
                    <img 
                      src={item.url || "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=500&auto=format&fit=crop&q=60"} 
                      alt="product thumbnail" 
                      onError={(e) => { e.currentTarget.src = "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=500&auto=format&fit=crop&q=60"; }}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }} 
                    />
                    {(item.isCover || item.variant) && (
                      <div
                        style={{
                          position: "absolute",
                          bottom: "0",
                          left: "0",
                          right: "0",
                          backgroundColor: isActive ? "#e63b7a" : "rgba(15, 23, 42, 0.75)",
                          color: "#ffffff",
                          fontSize: "9px",
                          fontWeight: "800",
                          textAlign: "center",
                          padding: "2px 0",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis"
                        }}
                      >
                        {item.isCover ? "Main Cover" : item.variant?.name}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Details Section */}
          <div style={{ flex: "1.5", minWidth: "320px", display: "flex", flexDirection: "column", gap: "20px" }}>
            <div>
              <span style={{ fontSize: "13px", fontWeight: "700", color: "var(--primary)", textTransform: "uppercase", letterSpacing: "1px" }}>
                {product.brand.name}
              </span>
              <h1 style={{ fontSize: "28px", fontWeight: "800", color: "var(--dark)", marginTop: "4px" }}>
                {product.name}
              </h1>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "10px" }}>
                <span style={{ color: "var(--secondary)", fontWeight: "700" }}>★★★★★ 4.8</span>
                <span style={{ color: "var(--gray-500)", fontSize: "13px", fontWeight: "600" }}>| {product.reviews.length} Approved Reviews</span>
              </div>
            </div>

            {/* Price section */}
            <div style={{ padding: "16px", backgroundColor: "var(--white)", border: "1px solid var(--gray-200)", borderRadius: "var(--radius-md)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ fontSize: "28px", fontWeight: "800", color: "var(--primary)" }}>
                  BDT {currentPrice}
                </span>
                {isDiscounted && (
                  <span style={{ fontSize: "18px", color: "var(--gray-500)", textDecoration: "line-through", fontWeight: "600" }}>
                    BDT {selectedVariant?.price}
                  </span>
                )}
              </div>
              <p style={{ fontSize: "12px", color: "var(--gray-500)", fontWeight: "500", marginTop: "6px" }}>
                SKU: <span style={{ color: "var(--dark)", fontWeight: "700" }}>{selectedVariant?.sku}</span>
              </p>
            </div>

            {/* Variant Selectors (Shades & Size Variants Side-by-Side) */}
            {product.variants && product.variants.length > 0 && (
              <div>
                <h3 style={{ fontSize: "14px", fontWeight: "800", color: "var(--dark)", marginBottom: "10px", display: "flex", alignItems: "center", gap: "6px" }}>
                  <span>🎨 Available Shades & Variants:</span>
                  <span style={{ fontSize: "12px", color: "var(--primary)", fontWeight: "700" }}>({product.variants.length} available)</span>
                </h3>
                
                {/* Side-by-side flex wrap container */}
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
                  {product.variants.map((v, vIdx) => {
                    const isSelected = selectedVariant?.id === v.id;
                    const vImg = (v as any).imageUrl && (v as any).imageUrl.trim() !== "" ? (v as any).imageUrl : null;
                    const galleryMatch = allGalleryItems.find(item => item.variant?.id === v.id || item.variant?.name === v.name)?.url;
                    const variantImg = vImg || galleryMatch || product.images?.[vIdx + 1]?.url || product.images?.[0]?.url;
                    const hasSwatch = Boolean(v.shadeColor);

                    return (
                      <div
                        key={v.id || vIdx}
                        onClick={() => {
                          setSelectedVariant(v);
                          if (variantImg) {
                            setActiveImage(variantImg);
                          }
                        }}
                        style={{
                          padding: "8px 16px",
                          border: isSelected ? "2px solid #e63b7a" : "1.5px solid #cbd5e1",
                          borderRadius: "8px",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          backgroundColor: isSelected ? "#fff0f5" : "#ffffff",
                          color: isSelected ? "#e63b7a" : "#1e293b",
                          boxShadow: isSelected ? "0 2px 8px rgba(230, 59, 122, 0.15)" : "none",
                          transition: "all 0.2s ease",
                          userSelect: "none"
                        }}
                      >
                        {/* Color Swatch Dot */}
                        {hasSwatch && (
                          <div
                            style={{
                              width: "18px",
                              height: "18px",
                              borderRadius: "50%",
                              backgroundColor: v.shadeColor || "#e63b7a",
                              border: "1.5px solid #cbd5e1",
                              boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                              flexShrink: 0
                            }}
                            title={`Color swatch: ${v.shadeColor}`}
                          />
                        )}
                        {/* Image preview thumbnail */}
                        {!hasSwatch && variantImg && (
                          <img
                            src={variantImg}
                            alt={v.name}
                            onError={(e) => { e.currentTarget.src = "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=500&auto=format&fit=crop&q=60"; }}
                            style={{
                              width: "22px",
                              height: "22px",
                              borderRadius: "4px",
                              objectFit: "cover",
                              border: "1px solid #cbd5e1"
                            }}
                          />
                        )}

                        <span style={{ fontSize: "13px", fontWeight: "700" }}>{v.name || `Shade ${vIdx + 1}`}</span>

                        {isSelected && (
                          <span style={{ fontSize: "11px", color: "#e63b7a", fontWeight: "900" }}>✓</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Inventory Status & Actions */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "var(--radius-full)",
                    backgroundColor: selectedVariant && selectedVariant.stock > 0 ? "var(--success)" : "var(--danger)",
                  }}
                />
                <span style={{ fontSize: "13px", fontWeight: "700" }}>
                  {selectedVariant && selectedVariant.stock > 0
                    ? `In Stock (${selectedVariant.stock} items left)`
                    : "Out of Stock"}
                </span>
              </div>

              <div style={{ display: "flex", gap: "15px", marginTop: "10px" }}>
                <button
                  onClick={handleAddToCart}
                  disabled={!selectedVariant || selectedVariant.stock === 0}
                  style={{
                    flex: 1,
                    background: "linear-gradient(135deg, var(--primary), #ff5e97)",
                    color: "var(--white)",
                    padding: "14px 0",
                    fontWeight: "800",
                    borderRadius: "var(--radius-md)",
                    cursor: selectedVariant && selectedVariant.stock > 0 ? "pointer" : "not-allowed",
                    boxShadow: "var(--shadow-premium)",
                    opacity: selectedVariant && selectedVariant.stock > 0 ? 1 : 0.6,
                    textAlign: "center",
                    border: "none",
                    fontSize: "15px",
                  }}
                >
                  🛒 ADD TO BASKET
                </button>
                
                <button
                  onClick={() => toggleWishlist(product.id)}
                  style={{
                    flex: 0.5,
                    border: "1.5px solid var(--gray-300)",
                    borderRadius: "var(--radius-md)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    color: wishlist.includes(product.id) ? "var(--primary)" : "var(--dark)",
                    backgroundColor: "var(--white)",
                  }}
                >
                  <svg
                    fill={wishlist.includes(product.id) ? "currentColor" : "none"}
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    width="22"
                    height="22"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    ></path>
                  </svg>
                </button>
              </div>
                <div style={{ marginTop: "24px", paddingTop: "20px", borderTop: "1.5px solid #f1f5f9", display: "flex", flexDirection: "column", gap: "10px", fontSize: "13.5px", color: "#475569" }}>
                  <div style={{ display: "flex", gap: "24px" }}>
                    <span style={{ fontWeight: "700", minWidth: "90px", color: "#334155" }}>SKU</span>
                    <span style={{ color: "#0f172a", fontWeight: "700" }}>{selectedVariant?.sku || product.variants?.[0]?.sku || `GG-${product.id}`}</span>
                  </div>
                  <div style={{ display: "flex", gap: "24px" }}>
                    <span style={{ fontWeight: "700", minWidth: "90px", color: "#334155" }}>Categories</span>
                    <span style={{ color: "#0f172a", fontWeight: "700" }}>
                      {[product.category?.name, product.subcategory, product.childSubcategory].filter(Boolean).join(", ") || "Makeup, Face, Face Primer"}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: "24px" }}>
                    <span style={{ fontWeight: "700", minWidth: "90px", color: "#334155" }}>Brands</span>
                    <span style={{ color: "#e2136e", fontWeight: "800" }}>{product.brand?.name || "GlowGoodly"}</span>
                  </div>
                </div>

                {/* 3 Trust Badges (Matches Image 3) */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginTop: "24px", padding: "16px 12px", backgroundColor: "#f8fafc", borderRadius: "12px", border: "1px solid #e2e8f0", textAlign: "center" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                    <span style={{ fontSize: "11px", fontWeight: "800", color: "#334155" }}>100% Genuine Products</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                    <span style={{ fontSize: "11px", fontWeight: "800", color: "#334155" }}>100% Secure Payments</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="2"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg>
                    <span style={{ fontSize: "11px", fontWeight: "800", color: "#334155" }}>Help Center (+8801609013011)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

        {/* Frequently Bought Together (Larger) & Available Offers (Compact Square Auto-Slider) */}
        <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "24px", marginTop: "32px", marginBottom: "36px" }}>
          {/* Frequently Bought Together (Larger Box) */}
          <div style={{ backgroundColor: "#ffffff", padding: "24px", borderRadius: "16px", border: "1.5px solid #e2e8f0", boxShadow: "0 4px 14px rgba(0,0,0,0.04)" }}>
            <h3 style={{ fontSize: "17px", fontWeight: "800", color: "#0f172a", marginBottom: "18px" }}>
              Frequently Bought Together
            </h3>
            {relatedProducts && relatedProducts.length > 0 ? (
              (() => {
                const rel = relatedProducts[0];
                const relImg = rel.images?.find((img: any) => img.isPrimary)?.url || rel.images?.[0]?.url || activeImage;
                const relVariant = rel.variants?.[0];
                const relPrice = relVariant ? (relVariant.discountPrice !== null ? relVariant.discountPrice : relVariant.price) : 0;
                const totalPrice = currentPrice + relPrice;

                return (
                  <div style={{ display: "flex", alignItems: "center", gap: "20px", flexWrap: "wrap" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                      <img src={activeImage || "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=500&auto=format&fit=crop&q=60"} alt={product.name} style={{ width: "95px", height: "95px", objectFit: "contain", borderRadius: "10px", border: "1.5px solid #e2e8f0", backgroundColor: "#f8fafc", padding: "6px" }} />
                      <span style={{ fontSize: "24px", fontWeight: "900", color: "#94a3b8" }}>+</span>
                      <img src={relImg} alt={rel.name} style={{ width: "95px", height: "95px", objectFit: "contain", borderRadius: "10px", border: "1.5px solid #e2e8f0", backgroundColor: "#f8fafc", padding: "6px" }} />
                    </div>

                    <div style={{ flex: 1, minWidth: "180px" }}>
                      <div style={{ fontSize: "13.5px", color: "#475569", fontWeight: "600" }}>
                        Total Price: <strong style={{ fontSize: "20px", color: "#e2136e", fontWeight: "900" }}>৳ {totalPrice.toLocaleString()}</strong>
                      </div>
                      <button
                        onClick={() => {
                          const var1 = selectedVariant || product.variants[0];
                          if (var1) {
                            addToCart({
                              id: var1.id,
                              productId: product.id,
                              name: product.name,
                              variantName: var1.name,
                              image: activeImage || product.images.find((i) => i.isPrimary)?.url || product.images[0]?.url || "",
                              price: var1.discountPrice !== null ? var1.discountPrice : var1.price,
                              stock: var1.stock || 50,
                            });
                          }
                          if (relVariant) {
                            addToCart({
                              id: relVariant.id,
                              productId: rel.id,
                              name: rel.name,
                              variantName: relVariant.name,
                              image: relImg,
                              price: relPrice,
                              stock: relVariant.stock || 50,
                            });
                          }
                          alert("Added both products to cart!");
                        }}
                        style={{ marginTop: "12px", width: "100%", backgroundColor: "#e2136e", color: "#ffffff", border: "none", padding: "12px", borderRadius: "10px", fontWeight: "800", fontSize: "13.5px", cursor: "pointer", boxShadow: "0 4px 14px rgba(226,19,110,0.3)" }}
                      >
                        ADD BOTH TO CART
                      </button>
                    </div>
                  </div>
                );
              })()
            ) : (
              <p style={{ fontSize: "13px", color: "#64748b" }}>No bundle items available right now.</p>
            )}
          </div>

          {/* Available Offers — Unified Shape Box Container with Slideview Carousel */}
          <div style={{ backgroundColor: "#fff0f5", border: "1.5px solid #fbcfe8", borderRadius: "16px", padding: "16px", display: "flex", flexDirection: "column", gap: "12px", boxShadow: "0 2px 10px rgba(226,19,110,0.05)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ fontSize: "15px", fontWeight: "800", color: "#be185d", margin: 0, display: "flex", alignItems: "center", gap: "6px" }}>
                🎁 Available Offers
              </h3>
              <div style={{ display: "flex", gap: "6px" }}>
                <button
                  onClick={() => scrollOffers("left")}
                  style={{ width: "28px", height: "28px", borderRadius: "50%", backgroundColor: "#e2136e", color: "#ffffff", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: "12px", fontWeight: "bold" }}
                  aria-label="Scroll left"
                >
                  ‹
                </button>
                <button
                  onClick={() => scrollOffers("right")}
                  style={{ width: "28px", height: "28px", borderRadius: "50%", backgroundColor: "#e2136e", color: "#ffffff", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: "12px", fontWeight: "bold" }}
                  aria-label="Scroll right"
                >
                  ›
                </button>
              </div>
            </div>

            {/* Slider Container with Hover/Touch Pause Handlers */}
            <div
              ref={offersSliderRef}
              onMouseEnter={() => setIsOffersPaused(true)}
              onMouseLeave={() => setIsOffersPaused(false)}
              onTouchStart={() => setIsOffersPaused(true)}
              onTouchEnd={() => setIsOffersPaused(false)}
              style={{ display: "flex", gap: "12px", overflowX: "auto", scrollSnapType: "x mandatory", paddingBottom: "4px", scrollbarWidth: "none" }}
            >
              {(() => {
                let offers = [
                  { id: "off-1", title: "Free Shipping Offer", subtitle: "Free delivery over ৳699", code: "FREESHIP699" },
                  { id: "off-2", title: "Welcome Customer Discount", subtitle: "Flat ৳150 BDT Off", code: "GLOW15" },
                  { id: "off-3", title: "10% Marketing Coupon", subtitle: "Extra 10% Off on Cart", code: "GLOW10" }
                ];
                if (typeof window !== "undefined") {
                  const saved = localStorage.getItem("glowgoodly_available_offers");
                  if (saved) {
                    try {
                      const parsed = JSON.parse(saved);
                      if (Array.isArray(parsed) && parsed.length > 0) offers = parsed;
                    } catch (e) { }
                  }
                }
                return offers.map((off) => (
                  <div
                    key={off.id}
                    style={{
                      flex: "0 0 calc(75% - 8px)",
                      minWidth: "190px",
                      height: "110px",
                      scrollSnapAlign: "start",
                      backgroundColor: "#ffffff",
                      border: "1.5px solid #fecdd3",
                      borderRadius: "12px",
                      padding: "10px 12px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      boxShadow: "0 2px 6px rgba(226,19,110,0.05)"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <div style={{ width: "26px", height: "26px", borderRadius: "6px", backgroundColor: "#ffe4e6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", flexShrink: 0 }}>
                        🚚
                      </div>
                      <div style={{ fontSize: "11.5px", fontWeight: "800", color: "#1e293b", lineHeight: "1.2", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {off.title.replace(/^[^a-zA-Z0-9]+/, "")}
                      </div>
                    </div>

                    <div style={{ fontSize: "10px", color: "#64748b", margin: "2px 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{off.subtitle}</div>
                    <div style={{ fontSize: "9.5px", color: "#e2136e", fontWeight: "800" }}>
                      Code: <span style={{ backgroundColor: "#fff0f5", border: "1px solid #fbcfe8", padding: "1px 5px", borderRadius: "4px", textTransform: "uppercase" }}>{off.code}</span>
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>
        </div>

        {/* Product Details Tabs (Description, Ingredients, How to Use) */}
        <section
          style={{
            backgroundColor: "var(--white)",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--gray-200)",
            padding: "30px",
            boxShadow: "var(--shadow-sm)",
            marginBottom: "40px",
          }}
        >
          {/* Tab headers */}
          <div style={{ display: "flex", gap: "24px", borderBottom: "1.5px solid var(--gray-200)", paddingBottom: "10px", marginBottom: "20px" }}>
            <button
              onClick={() => setActiveTab("desc")}
              style={{
                fontSize: "15px",
                fontWeight: "800",
                color: activeTab === "desc" ? "var(--primary)" : "var(--gray-500)",
                borderBottom: activeTab === "desc" ? "2.5px solid var(--primary)" : "none",
                paddingBottom: "8px",
                cursor: "pointer",
              }}
            >
              Product Description
            </button>
            {product.ingredients && (
              <button
                onClick={() => setActiveTab("ingredients")}
                style={{
                  fontSize: "15px",
                  fontWeight: "800",
                  color: activeTab === "ingredients" ? "var(--primary)" : "var(--gray-500)",
                  borderBottom: activeTab === "ingredients" ? "2.5px solid var(--primary)" : "none",
                  paddingBottom: "8px",
                  cursor: "pointer",
                }}
              >
                Ingredients
              </button>
            )}
            {product.howToUse && (
              <button
                onClick={() => setActiveTab("howToUse")}
                style={{
                  fontSize: "15px",
                  fontWeight: "800",
                  color: activeTab === "howToUse" ? "var(--primary)" : "var(--gray-500)",
                  borderBottom: activeTab === "howToUse" ? "2.5px solid var(--primary)" : "none",
                  paddingBottom: "8px",
                  cursor: "pointer",
                }}
              >
                How to Use
              </button>
            )}
          </div>

          {/* Tab Content */}
          <div style={{ fontSize: "14px", lineHeight: "1.7", color: "var(--gray-800)", fontWeight: "500" }}>
            {activeTab === "desc" && <p>{product.description}</p>}
            {activeTab === "ingredients" && <p>{product.ingredients}</p>}
            {activeTab === "howToUse" && <p>{product.howToUse}</p>}
          </div>
        </section>

        {/* Customer Reviews Section */}
        <section style={{ display: "flex", gap: "40px", flexWrap: "wrap", marginBottom: "40px" }}>
          
          {/* Reviews List */}
          <div style={{ flex: 1.5, minWidth: "300px" }}>
            <h2 style={{ fontSize: "20px", fontWeight: "800", marginBottom: "20px" }}>
              Customer Reviews ({product.reviews.length})
            </h2>

            {product.reviews.length === 0 ? (
              <p style={{ color: "var(--gray-500)", fontWeight: "600" }}>No approved reviews for this product yet.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                {product.reviews.map((rev) => (
                  <div
                    key={rev.id}
                    style={{
                      padding: "16px",
                      backgroundColor: "var(--white)",
                      border: "1px solid var(--gray-200)",
                      borderRadius: "var(--radius-md)",
                      boxShadow: "var(--shadow-sm)",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                      <span style={{ fontWeight: "700", fontSize: "14px" }}>{rev.customerName}</span>
                      <span style={{ color: "var(--secondary)", fontSize: "12px", fontWeight: "700" }}>
                        {"★".repeat(rev.rating)}
                      </span>
                    </div>
                    <p style={{ fontSize: "13px", color: "var(--gray-800)", fontWeight: "500" }}>{rev.comment}</p>
                    <span style={{ fontSize: "11px", color: "var(--gray-500)", display: "block", marginTop: "8px", fontWeight: "500" }}>
                      Reviewed on {new Date(rev.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Write a Review Form */}
          <div
            style={{
              flex: 1,
              minWidth: "300px",
              backgroundColor: "var(--white)",
              border: "1px solid var(--gray-200)",
              borderRadius: "var(--radius-md)",
              padding: "24px",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <h3 style={{ fontSize: "18px", fontWeight: "800", marginBottom: "15px" }}>
              Write a Review
            </h3>
            <form onSubmit={handleReviewSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={{ fontSize: "12px", fontWeight: "700", color: "var(--gray-700)", display: "block", marginBottom: "4px" }}>
                  Your Name
                </label>
                <input
                  type="text"
                  placeholder="Enter your name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1.5px solid var(--gray-200)",
                    borderRadius: "var(--radius-sm)",
                    fontSize: "13px",
                    fontWeight: "600",
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: "12px", fontWeight: "700", color: "var(--gray-700)", display: "block", marginBottom: "4px" }}>
                  Rating
                </label>
                <select
                  value={rating}
                  onChange={(e) => setRating(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1.5px solid var(--gray-200)",
                    borderRadius: "var(--radius-sm)",
                    fontSize: "13px",
                    fontWeight: "600",
                    backgroundColor: "var(--white)",
                  }}
                >
                  <option value="5">5 Stars (Excellent)</option>
                  <option value="4">4 Stars (Good)</option>
                  <option value="3">3 Stars (Average)</option>
                  <option value="2">2 Stars (Poor)</option>
                  <option value="1">1 Star (Very Poor)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: "12px", fontWeight: "700", color: "var(--gray-700)", display: "block", marginBottom: "4px" }}>
                  Comments
                </label>
                <textarea
                  rows={4}
                  placeholder="Write your product experience..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1.5px solid var(--gray-200)",
                    borderRadius: "var(--radius-sm)",
                    fontSize: "13px",
                    fontWeight: "600",
                  }}
                />
              </div>

              {reviewMessage && (
                <p style={{ fontSize: "12px", fontWeight: "700", color: "var(--primary)", marginTop: "4px" }}>
                  {reviewMessage}
                </p>
              )}

              <button
                type="submit"
                style={{
                  backgroundColor: "var(--primary)",
                  color: "var(--white)",
                  fontWeight: "700",
                  textAlign: "center",
                  padding: "12px",
                  borderRadius: "var(--radius-sm)",
                  cursor: "pointer",
                  marginTop: "8px",
                }}
              >
                SUBMIT FOR REVIEW
              </button>
            </form>
          </div>
        </section>



        {/* Similar / Related Products Section */}
        {relatedProducts.length > 0 && (
          <section style={{ marginTop: "50px", position: "relative" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2 style={{ fontSize: "20px", fontWeight: "800", color: "#0f172a" }}>
                Related Products
              </h2>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={() => {
                    if (relatedSliderRef.current) {
                      relatedSliderRef.current.scrollBy({ left: -280, behavior: "smooth" });
                    }
                  }}
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    border: "1.5px solid #cbd5e1",
                    backgroundColor: "#ffffff",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: "900",
                    fontSize: "16px",
                    color: "#334155",
                    boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
                  }}
                  aria-label="Scroll left"
                >
                  ‹
                </button>
                <button
                  onClick={() => {
                    if (relatedSliderRef.current) {
                      relatedSliderRef.current.scrollBy({ left: 280, behavior: "smooth" });
                    }
                  }}
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    border: "1.5px solid #cbd5e1",
                    backgroundColor: "#ffffff",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: "900",
                    fontSize: "16px",
                    color: "#334155",
                    boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
                  }}
                  aria-label="Scroll right"
                >
                  ›
                </button>
              </div>
            </div>

            <div
              ref={relatedSliderRef}
              style={{
                display: "flex",
                gap: "20px",
                overflowX: "auto",
                scrollSnapType: "x mandatory",
                paddingBottom: "16px",
                scrollBehavior: "smooth",
                scrollbarWidth: "none",
              }}
            >
              {relatedProducts.map((p) => {
                const primaryImage = p.images?.find((img: any) => img.isPrimary)?.url || p.images?.[0]?.url || "";
                const primaryVariant = p.variants?.[0];
                if (!primaryVariant) return null;

                const oldPrice = primaryVariant.price || 1200;
                const currentPrice = primaryVariant.discountPrice || primaryVariant.price;
                const hasDiscount = primaryVariant.discountPrice && primaryVariant.discountPrice < primaryVariant.price;
                const discountPercent = hasDiscount ? Math.round(((oldPrice - currentPrice) / oldPrice) * 100) : 25;
                const sizeLabel = primaryVariant.size || primaryVariant.name || "Standard";

                return (
                  <div
                    className="product-card"
                    key={p.id}
                    style={{ flex: "0 0 240px", minWidth: "240px", scrollSnapAlign: "start", backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid #e2a8f0", overflow: "hidden", display: "flex", flexDirection: "column", justifyContent: "space-between", position: "relative" }}
                  >
                    {/* Top Left Discount Tag */}
                    <div style={{ backgroundColor: "#e2136e", color: "#fff", fontSize: "11px", fontWeight: "800", padding: "4px 10px", borderRadius: "0 0 10px 0", position: "absolute", top: 0, left: 0, zIndex: 5 }}>
                      {discountPercent}% OFF
                    </div>

                    <div
                      className={`wishlist-btn ${wishlist.includes(p.id) ? "active" : ""}`}
                      onClick={() => toggleWishlist(p.id)}
                    >
                      <svg
                        fill={wishlist.includes(p.id) ? "currentColor" : "none"}
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                        width="18"
                        height="18"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                        ></path>
                      </svg>
                    </div>

                    <Link href={`/product/${p.id}`} className="card-image" style={{ height: "210px", backgroundColor: "#ffffff", padding: "14px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <img src={primaryImage} alt={p.name} style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }} />
                    </Link>

                    <div className="card-body" style={{ padding: "12px 14px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", flex: 1, justifyContent: "space-between" }}>
                      <Link href={`/product/${p.id}`} className="card-title" style={{ fontSize: "13.5px", fontWeight: "600", color: "#1e293b", textDecoration: "none", lineHeight: "1.3", marginBottom: "6px", height: "36px", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                        {p.name}
                      </Link>
                      <span style={{ backgroundColor: "#e2136e", color: "#ffffff", fontSize: "9.5px", fontWeight: "900", padding: "2px 10px", borderRadius: "10px", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>
                        SALE
                      </span>
                      <div className="card-price-row" style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                        {hasDiscount && (
                          <span className="old-price" style={{ fontSize: "12.5px", color: "#94a3b8", textDecoration: "line-through", fontWeight: "600" }}>
                            ৳{oldPrice.toFixed(2)}
                          </span>
                        )}
                        <span className="price" style={{ fontSize: "15px", fontWeight: "800", color: "#e2136e" }}>
                          ৳{currentPrice.toFixed(2)}
                        </span>
                      </div>
                      <div style={{ color: "#f59e0b", fontSize: "12px", display: "flex", gap: "2px", marginBottom: "4px" }}>
                        ★ ★ ★ ★ <span style={{ color: "#cbd5e1" }}>★</span>
                      </div>
                      <div style={{ fontSize: "12px", fontWeight: "700", color: "#1e293b", marginBottom: "8px" }}>
                        {sizeLabel}
                      </div>
                    </div>

                    <button
                      className="add-to-cart-btn"
                      onClick={() =>
                        addToCart({
                          id: primaryVariant.id,
                          productId: p.id,
                          name: p.name,
                          variantName: primaryVariant.name,
                          image: primaryImage,
                          price: currentPrice,
                          stock: primaryVariant.stock || 50,
                        })
                      }
                      style={{ backgroundColor: "#581c87", color: "#ffffff", border: "none", padding: "10px", fontWeight: "800", fontSize: "12.5px", letterSpacing: "0.5px", cursor: "pointer", width: "100%", borderRadius: "0 0 12px 12px" }}
                    >
                      ADD TO CART
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        )}

      </main>

      <Footer />
      <MobileNavbar />
    </>
  );
}
