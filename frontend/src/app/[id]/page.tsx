"use client";

import React, { useEffect, useState, use } from "react";
import { fetchWithCache } from "../../utils/api";
import Header from "../../components/Header";
import MobileNavbar from "../../components/MobileNavbar";
import { useApp } from "../../context/AppContext";
import Link from "next/link";
import Footer from "../../components/Footer";

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
  images: { id: string; url: string; isPrimary: boolean }[];
  variants: Variant[];
  reviews: { id: string; customerName: string; rating: number; comment: string; createdAt: string }[];
}

export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { addToCart, wishlist, toggleWishlist, setCartOpen } = useApp();
  const unwrappedParams = use(params);
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Detail View States
  const [activeImage, setActiveImage] = useState("");
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [activeTab, setActiveTab] = useState<"desc" | "ingredients" | "faq" | "reviews" | "qa">("desc");
  const [qty, setQty] = useState(1);

  // Frequently Bought Together checkboxes
  const [fbtItem1Checked, setFbtItem1Checked] = useState(true);
  const [fbtItem2Checked, setFbtItem2Checked] = useState(true);

  // Review Form States
  const [customerName, setCustomerName] = useState("");
  const [rating, setRating] = useState("5");
  const [comment, setComment] = useState("");
  const [reviewMessage, setReviewMessage] = useState("");

  useEffect(() => {
    if (!unwrappedParams) return;
    const fetchProductDetails = async () => {
      setLoading(true);
      try {
        const data = await fetchWithCache(`http://localhost:5000/api/products/${unwrappedParams.id}`);
        if (data && data.product) {
          setProduct(data.product);
          setRelatedProducts(data.relatedProducts || []);

          // Select primary image and first variant as defaults
          const primaryImg = data.product.images.find((img: any) => img.isPrimary)?.url || data.product.images[0]?.url || "";
          setActiveImage(primaryImg);
          if (data.product.variants.length > 0) {
            setSelectedVariant(data.product.variants[0]);
          }
        }
      } catch (e: any) {
        if (!e.message.includes("404")) {
          console.error("Error fetching product", e);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchProductDetails();
  }, [unwrappedParams]);

  const handleAddToCart = () => {
    if (!product || !selectedVariant) return;

    addToCart(
      {
        id: selectedVariant.id,
        productId: product.id,
        name: product.name,
        variantName: selectedVariant.name,
        image: activeImage,
        price: selectedVariant.discountPrice || selectedVariant.price,
        stock: selectedVariant.stock,
      },
      qty
    );
  };

  const handleAddBothToCart = () => {
    if (!product || !selectedVariant) return;

    // Add Main Product
    if (fbtItem1Checked) {
      addToCart({
        id: selectedVariant.id,
        productId: product.id,
        name: product.name,
        variantName: selectedVariant.name,
        image: activeImage,
        price: selectedVariant.discountPrice || selectedVariant.price,
        stock: selectedVariant.stock,
      }, qty);
    }

    // Add Frequently Bought item
    const fbtProduct = relatedProducts[0];
    if (fbtProduct && fbtItem2Checked) {
      const fbtVariant = fbtProduct.variants[0];
      if (fbtVariant) {
        addToCart({
          id: fbtVariant.id,
          productId: fbtProduct.id,
          name: fbtProduct.name,
          variantName: fbtVariant.name,
          image: fbtProduct.images.find((i: any) => i.isPrimary)?.url || fbtProduct.images[0]?.url || "",
          price: fbtVariant.discountPrice || fbtVariant.price,
          stock: fbtVariant.stock,
        }, 1);
      }
    }
    // Auto open cart drawer so they can checkout/buy immediately
    setCartOpen(true);
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

  const isDiscounted = selectedVariant?.discountPrice != null;
  const currentPrice = selectedVariant?.discountPrice ?? selectedVariant?.price ?? 0;
  const oldPrice = selectedVariant?.price ?? 0;
  const savings = isDiscounted ? (oldPrice - currentPrice) : 0;
  const discountPct = isDiscounted ? Math.round((savings / oldPrice) * 100) : 0;

  // Setup FBT (Frequently Bought Together) item
  const fbtProduct = relatedProducts[0];
  const fbtVariant = fbtProduct ? fbtProduct.variants[0] : null;
  const fbtPrice = fbtVariant ? (fbtVariant.discountPrice || fbtVariant.price) : 0;
  
  let totalPrice = 0;
  if (fbtItem1Checked) totalPrice += currentPrice || 0;
  if (fbtProduct && fbtItem2Checked) totalPrice += fbtPrice || 0;

  // Split related products for bottom grids
  const alsoViewedProducts = relatedProducts.slice(0, 4);
  const recommendedProducts = relatedProducts.slice(4, 8);

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
      <Header />

      <main className="container" style={{ padding: "20px 20px 60px 20px" }}>
        
        {/* Breadcrumbs */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "12px 18px",
          backgroundColor: "#f7f9fa",
          borderRadius: "8px",
          fontSize: "12.5px",
          fontWeight: "600",
          color: "#718096",
          marginBottom: "28px",
          flexWrap: "wrap"
        }}>
          <Link href="/" style={{ color: "inherit" }}>Home</Link>
          <span>&gt;</span>
          <Link href="/shop" style={{ color: "inherit" }}>Shop</Link>
          <span>&gt;</span>
          <span style={{ color: "inherit" }}>{product.category.name}</span>
          <span>&gt;</span>
          <span style={{ color: "#e52860", fontWeight: "700" }}>{product.name}</span>
        </div>

        {/* Product General Layout */}
        <div style={{ display: "flex", gap: "48px", flexWrap: "wrap", marginBottom: "40px" }}>
          
          {/* Left Column (Images, Thumbnails, Share Icons) */}
          <div style={{ flex: "1", minWidth: "300px", display: "flex", flexDirection: "column", gap: "16px" }}>
            <div
              style={{
                width: "100%",
                height: "460px",
                borderRadius: "12px",
                backgroundColor: "#ffffff",
                border: "1px solid #e2e8f0",
                overflow: "hidden",
                boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "16px"
              }}
            >
              <img
                src={activeImage}
                alt={product.name}
                style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", transition: "transform 0.3s ease" }}
              />
            </div>
            
            {/* Gallery Thumbnails */}
            <div style={{ display: "flex", gap: "10px", overflowX: "auto", paddingBottom: "6px" }}>
              {product.images.map((img) => (
                <div
                  key={img.id}
                  onClick={() => setActiveImage(img.url)}
                  style={{
                    width: "72px",
                    height: "72px",
                    borderRadius: "8px",
                    border: activeImage === img.url ? "2px solid #e52860" : "1.5px solid #e2e8f0",
                    cursor: "pointer",
                    overflow: "hidden",
                    flexShrink: 0,
                    backgroundColor: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "4px"
                  }}
                >
                  <img src={img.url} alt="product thumbnail" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                </div>
              ))}
            </div>

            {/* Social Share Buttons */}
            <div style={{ display: "flex", gap: "10px", alignItems: "center", marginTop: "8px", justifyContent: "flex-start" }}>
              <button style={{ width: "32px", height: "32px", borderRadius: "50%", backgroundColor: "#1877f2", color: "#fff", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: "bold" }}>
                <span style={{ margin: "auto" }}>f</span>
              </button>
              <button style={{ width: "32px", height: "32px", borderRadius: "50%", backgroundColor: "#000000", color: "#fff", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: "bold" }}>
                <span style={{ margin: "auto" }}>𝕏</span>
              </button>
              <button style={{ width: "32px", height: "32px", borderRadius: "50%", backgroundColor: "#0a66c2", color: "#fff", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: "bold" }}>
                <span style={{ margin: "auto" }}>in</span>
              </button>
              <button style={{ width: "32px", height: "32px", borderRadius: "50%", backgroundColor: "#25d366", color: "#fff", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: "bold" }}>
                <span style={{ margin: "auto" }}>w</span>
              </button>
            </div>
          </div>

          {/* Right Column (Product Info, Price, Actions, Metadata) */}
          <div style={{ flex: "1.2", minWidth: "320px", display: "flex", flexDirection: "column", gap: "20px" }}>
            <div>
              <span style={{ fontSize: "13px", fontWeight: "800", color: "#e52860", textTransform: "uppercase", letterSpacing: "0.8px" }}>
                {product.brand.name}
              </span>
              <h1 style={{ fontSize: "24px", fontWeight: "800", color: "#1a1a2e", marginTop: "4px", lineHeight: "1.3" }}>
                {product.name}
              </h1>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "10px" }}>
                <span style={{ color: "#f59e0b", fontWeight: "800", fontSize: "14.5px" }}>★★★★★</span>
                <span style={{ color: "#4a5568", fontSize: "13px", fontWeight: "700" }}>{product.reviews.length} customer reviews</span>
              </div>
            </div>

            {/* Price section */}
            <div style={{ display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap", borderTop: "1px solid #edf2f7", borderBottom: "1px solid #edf2f7", padding: "16px 0" }}>
              <span style={{ fontSize: "28px", fontWeight: "900", color: "#e52860" }}>
                ৳{currentPrice.toFixed(2)}
              </span>
              {isDiscounted && (
                <>
                  <span style={{ fontSize: "16px", color: "#a0aec0", textDecoration: "line-through", fontWeight: "700" }}>
                    ৳{oldPrice.toFixed(2)}
                  </span>
                  <span style={{ color: "#2f855a", fontSize: "13.5px", fontWeight: "800" }}>
                    Save ৳{savings.toFixed(2)}
                  </span>
                  <span style={{ backgroundColor: "#e52860", color: "#fff", fontSize: "11px", fontWeight: "900", padding: "4px 8px", borderRadius: "4px", textTransform: "uppercase" }}>
                    {discountPct}% OFF
                  </span>
                </>
              )}
            </div>

            {/* App Promotion Box */}


            {/* Variant Selectors */}
            {product.variants.length > 1 && (
              <div>
                <h3 style={{ fontSize: "13.5px", fontWeight: "800", color: "#1a1a2e", marginBottom: "10px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Select Variant:
                </h3>
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  {product.variants.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVariant(v)}
                      style={{
                        padding: "8px 16px",
                        border: selectedVariant?.id === v.id ? "2px solid #e52860" : "1.5px solid #e2e8f0",
                        borderRadius: "8px",
                        backgroundColor: selectedVariant?.id === v.id ? "#fff0f4" : "#ffffff",
                        color: selectedVariant?.id === v.id ? "#e52860" : "#4a5568",
                        fontWeight: "800",
                        fontSize: "13px",
                        cursor: "pointer",
                        transition: "all 0.2s",
                      }}
                    >
                      {v.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Action Row: Wishlist + Qty Selector + Add To Cart */}
            <div style={{ display: "flex", gap: "14px", alignItems: "center", flexWrap: "wrap", marginTop: "10px" }}>
              
              {/* Wishlist Button */}
              <button
                onClick={() => toggleWishlist(product.id)}
                style={{
                  width: "48px",
                  height: "48px",
                  border: "none",
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: wishlist.includes(product.id) ? "#ffffff" : "#cbd5e0",
                  backgroundColor: wishlist.includes(product.id) ? "#e52860" : "#0e1e38",
                  transition: "all 0.2s"
                }}
              >
                <svg
                  fill={wishlist.includes(product.id) ? "currentColor" : "none"}
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  width="20"
                  height="20"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  ></path>
                </svg>
              </button>

              {/* Quantity Selector */}
              <div style={{
                display: "flex",
                alignItems: "center",
                border: "1.5px solid #edf2f7",
                borderRadius: "8px",
                overflow: "hidden",
                height: "48px"
              }}>
                <button onClick={() => setQty(Math.max(1, qty - 1))} style={{ width: "36px", height: "100%", backgroundColor: "#f7f9fa", border: "none", cursor: "pointer", fontSize: "16px", fontWeight: "bold", color: "#4a5568" }}>-</button>
                <div style={{ width: "40px", textAlign: "center", fontSize: "14px", fontWeight: "800", color: "#1a1a2e" }}>{qty}</div>
                <button onClick={() => setQty(qty + 1)} style={{ width: "36px", height: "100%", backgroundColor: "#f7f9fa", border: "none", cursor: "pointer", fontSize: "16px", fontWeight: "bold", color: "#4a5568" }}>+</button>
              </div>

              {/* Add to Basket Button */}
              <button
                onClick={handleAddToCart}
                disabled={!selectedVariant || selectedVariant.stock === 0}
                style={{
                  flex: 1,
                  minWidth: "160px",
                  height: "48px",
                  backgroundColor: "#e52860",
                  color: "#ffffff",
                  border: "none",
                  fontWeight: "800",
                  fontSize: "14px",
                  borderRadius: "8px",
                  cursor: selectedVariant && selectedVariant.stock > 0 ? "pointer" : "not-allowed",
                  opacity: selectedVariant && selectedVariant.stock > 0 ? 1 : 0.6,
                  textAlign: "center",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px"
                }}
              >
                ADD TO CART
              </button>
            </div>

            {/* Brief Description */}
            <div style={{ marginTop: "10px", borderTop: "1px solid #edf2f7", paddingTop: "18px" }}>
              <span style={{ fontSize: "13px", fontWeight: "800", color: "#718096", textTransform: "uppercase", display: "block", marginBottom: "8px" }}>
                Brief Description
              </span>
              <div style={{ fontSize: "13.5px", color: "#4a5568", lineHeight: "1.6", whiteSpace: "pre-line" }}>
                {product.description.split("\n").slice(0, 5).join("\n")}
                {product.description.split("\n").length > 5 && (
                  <span style={{ color: "#e52860", cursor: "pointer", fontWeight: "700", display: "block", marginTop: "4px" }} onClick={() => setActiveTab("desc")}>
                    Read More...
                  </span>
                )}
              </div>
            </div>

            {/* Metadata (SKU & Categories) */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "12.5px", color: "#718096", borderTop: "1px solid #edf2f7", paddingTop: "14px" }}>
              <p>SKU: <span style={{ color: "#1a1a2e", fontWeight: "700" }}>{selectedVariant?.sku || "N/A"}</span></p>
              <p>Categories: <span style={{ color: "#e52860", fontWeight: "700" }}>{product.category.name}</span></p>
              <p>Brands: <span style={{ color: "#e52860", fontWeight: "700" }}>{product.brand.name}</span></p>
            </div>
          </div>
        </div>

        {/* ═══ MIDDLE SECTION: FBT (Frequently Bought Together) & Available Offers ═══ */}
        <div style={{ display: "flex", gap: "28px", flexWrap: "wrap", marginBottom: "48px", borderTop: "1px solid #edf2f7", paddingTop: "32px" }}>
          
          {/* FBT block */}
          {fbtProduct && (
            <div style={{ flex: "1.4", minWidth: "320px", background: "#ffffff", padding: "20px", border: "1.5px solid #edf2f7", borderRadius: "12px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: "800", color: "#1a1a2e", marginBottom: "16px" }}>Frequently Bought Together</h3>
              <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap", marginBottom: "20px" }}>
                {/* Product 1 image */}
                <div style={{ width: "90px", height: "90px", border: "1px solid #e2e8f0", padding: "6px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <img src={activeImage} alt="main product" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                </div>
                <span style={{ fontSize: "24px", color: "#cbd5e0", fontWeight: "bold" }}>+</span>
                {/* Product 2 image */}
                <div style={{ width: "90px", height: "90px", border: "1px solid #e2e8f0", padding: "6px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <img src={fbtProduct.images.find((i: any) => i.isPrimary)?.url || fbtProduct.images[0]?.url || ""} alt="FBT product" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                </div>
                {/* Action Block */}
                <div style={{ marginLeft: "auto", display: "flex", flexDirection: "column", gap: "6px", minWidth: "160px" }}>
                  <p style={{ fontSize: "13px", color: "#718096", fontWeight: "700" }}>Total Price: <span style={{ fontSize: "16px", color: "#e52860", fontWeight: "900" }}>৳{totalPrice.toFixed(2)}</span></p>
                  <button onClick={handleAddBothToCart} style={{ backgroundColor: "#e52860", color: "#fff", border: "none", padding: "10px 16px", borderRadius: "6px", fontSize: "12px", fontWeight: "800", cursor: "pointer", textTransform: "uppercase" }}>ADD BOTH TO CART</button>
                </div>
              </div>
              
              {/* Checkboxes */}
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "13px", fontWeight: "600", color: "#4a5568" }}>
                <label style={{ display: "flex", alignItems: "flex-start", gap: "8px", cursor: "pointer" }}>
                  <input type="checkbox" checked={fbtItem1Checked} onChange={() => setFbtItem1Checked(!fbtItem1Checked)} style={{ marginTop: "4px", accentColor: "#e52860" }} />
                  <span>This Item: <span style={{ color: "#e52860" }}>{product.name}</span> (৳{currentPrice.toFixed(2)})</span>
                </label>
                <label style={{ display: "flex", alignItems: "flex-start", gap: "8px", cursor: "pointer" }}>
                  <input type="checkbox" checked={fbtItem2Checked} onChange={() => setFbtItem2Checked(!fbtItem2Checked)} style={{ marginTop: "4px", accentColor: "#e52860" }} />
                  <span>Recommended: <span style={{ color: "#e52860" }}>{fbtProduct.name}</span> (৳{fbtPrice.toFixed(2)})</span>
                </label>
              </div>
            </div>
          )}

          {/* Offers Carousel / ticket block */}
          <div style={{ flex: "1", minWidth: "280px", display: "flex", flexDirection: "column", gap: "12px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: "800", color: "#1a1a2e" }}>Available Offers</h3>
            <div style={{
              border: "2px dashed #ffe0ea",
              borderRadius: "12px",
              backgroundColor: "#fff5f7",
              padding: "16px 20px",
              display: "flex",
              gap: "14px",
              alignItems: "center",
              position: "relative",
              overflow: "hidden"
            }}>
              {/* Truck Icon */}
              <div style={{ width: "42px", height: "42px", borderRadius: "50%", backgroundColor: "#ffe0ea", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg fill="none" stroke="#e52860" strokeWidth="2.5" viewBox="0 0 24 24" width="20" height="20">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125a1.125 1.125 0 001.125-1.125V9.75M8.25 4.5h8.25a2.25 2.25 0 012.25 2.25v9a2.25 2.25 0 01-2.25 2.25m-18 0V14.25M17 14.25h4.25M16.5 9h5.25"></path>
                </svg>
              </div>
              <div style={{ fontSize: "12.5px", color: "#4a5568", lineHeight: "1.5" }}>
                <strong style={{ display: "block", color: "#e52860", textTransform: "uppercase", fontSize: "11px", letterSpacing: "0.5px", marginBottom: "2px" }}>Shipping Offer</strong>
                <strong style={{ color: "#1a1a2e" }}>Free Shipping</strong>
                <p>Get Free Delivery on store orders above 799 Taka</p>
                <span style={{ fontSize: "10.5px", color: "#a0aec0", display: "block", marginTop: "4px" }}>Offer Expiry: Aug 1, 2026</span>
              </div>
            </div>
          </div>
        </div>

        {/* ═══ INFORMATION TABS SECTION ═══ */}
        <section
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "12px",
            border: "1px solid #edf2f7",
            padding: "24px 28px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
            marginBottom: "48px",
          }}
        >
          {/* Tab headers */}
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", borderBottom: "1.5px solid #edf2f7", paddingBottom: "16px", marginBottom: "20px" }}>
            <button onClick={() => setActiveTab("desc")}
              style={{ padding: "10px 20px", backgroundColor: activeTab === "desc" ? "#e52860" : "#edf2f7", color: activeTab === "desc" ? "#fff" : "#4a5568", fontWeight: "800", fontSize: "12.5px", border: "none", borderRadius: "6px", cursor: "pointer", textTransform: "uppercase" }}>
              Description
            </button>
            {product.ingredients && (
              <button onClick={() => setActiveTab("ingredients")}
                style={{ padding: "10px 20px", backgroundColor: activeTab === "ingredients" ? "#e52860" : "#edf2f7", color: activeTab === "ingredients" ? "#fff" : "#4a5568", fontWeight: "800", fontSize: "12.5px", border: "none", borderRadius: "6px", cursor: "pointer", textTransform: "uppercase" }}>
                Ingredients
              </button>
            )}
            <button onClick={() => setActiveTab("faq")}
              style={{ padding: "10px 20px", backgroundColor: activeTab === "faq" ? "#e52860" : "#edf2f7", color: activeTab === "faq" ? "#fff" : "#4a5568", fontWeight: "800", fontSize: "12.5px", border: "none", borderRadius: "6px", cursor: "pointer", textTransform: "uppercase" }}>
              FAQ
            </button>
            <button onClick={() => setActiveTab("reviews")}
              style={{ padding: "10px 20px", backgroundColor: activeTab === "reviews" ? "#e52860" : "#edf2f7", color: activeTab === "reviews" ? "#fff" : "#4a5568", fontWeight: "800", fontSize: "12.5px", border: "none", borderRadius: "6px", cursor: "pointer", textTransform: "uppercase" }}>
              Reviews ({product.reviews.length})
            </button>
            <button onClick={() => setActiveTab("qa")}
              style={{ padding: "10px 20px", backgroundColor: activeTab === "qa" ? "#e52860" : "#edf2f7", color: activeTab === "qa" ? "#fff" : "#4a5568", fontWeight: "800", fontSize: "12.5px", border: "none", borderRadius: "6px", cursor: "pointer", textTransform: "uppercase" }}>
              Q&A (0)
            </button>
          </div>

          {/* Tab Content */}
          <div style={{ fontSize: "14px", lineHeight: "1.7", color: "#4a5568", fontWeight: "500" }}>
            {activeTab === "desc" && (
              <div style={{ whiteSpace: "pre-line" }}>{product.description}</div>
            )}
            
            {activeTab === "ingredients" && (
              <div style={{ whiteSpace: "pre-line" }}>{product.ingredients || "No ingredients lists available."}</div>
            )}
            
            {activeTab === "faq" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <strong style={{ color: "#1a1a2e", display: "block" }}>Is this product suitable for sensitive skin?</strong>
                  <p>Yes, all items in this range are thoroughly tested and dermatologist approved for daily use on sensitive skin.</p>
                </div>
                <div>
                  <strong style={{ color: "#1a1a2e", display: "block" }}>How long does delivery take inside Dhaka?</strong>
                  <p>Our standard delivery window inside Dhaka is 24 to 48 hours.</p>
                </div>
              </div>
            )}
            
            {activeTab === "reviews" && (
              <div style={{ display: "flex", gap: "40px", flexWrap: "wrap" }}>
                {/* Reviews List */}
                <div style={{ flex: 1.5, minWidth: "300px" }}>
                  {product.reviews.length === 0 ? (
                    <p style={{ color: "#718096", fontWeight: "600" }}>No approved reviews for this product yet.</p>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                      {product.reviews.map((rev) => (
                        <div
                          key={rev.id}
                          style={{
                            padding: "16px",
                            backgroundColor: "#ffffff",
                            border: "1px solid #edf2f7",
                            borderRadius: "8px",
                            boxShadow: "0 1px 4px rgba(0,0,0,0.01)",
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                            <span style={{ fontWeight: "700", fontSize: "14px", color: "#1a1a2e" }}>{rev.customerName}</span>
                            <span style={{ color: "#f59e0b", fontSize: "12px", fontWeight: "800" }}>
                              {"★".repeat(rev.rating)}
                            </span>
                          </div>
                          <p style={{ fontSize: "13px", color: "#4a5568", fontWeight: "500" }}>{rev.comment}</p>
                          <span style={{ fontSize: "11px", color: "#a0aec0", display: "block", marginTop: "8px" }}>
                            Reviewed on {new Date(rev.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Write a Review Form */}
                <div style={{ flex: 1, minWidth: "300px", backgroundColor: "#ffffff", border: "1px solid #edf2f7", borderRadius: "12px", padding: "24px" }}>
                  <h4 style={{ fontSize: "16px", fontWeight: "800", marginBottom: "15px", color: "#1a1a2e" }}>Write a Review</h4>
                  <form onSubmit={handleReviewSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    <div>
                      <label style={{ fontSize: "12px", fontWeight: "800", color: "#4a5568", display: "block", marginBottom: "4px" }}>Your Name</label>
                      <input type="text" placeholder="Enter your name" value={customerName} onChange={(e) => setCustomerName(e.target.value)}
                        style={{ width: "100%", padding: "10px", border: "1.5px solid #edf2f7", borderRadius: "6px", fontSize: "13px", fontWeight: "600" }} />
                    </div>
                    <div>
                      <label style={{ fontSize: "12px", fontWeight: "800", color: "#4a5568", display: "block", marginBottom: "4px" }}>Rating</label>
                      <select value={rating} onChange={(e) => setRating(e.target.value)}
                        style={{ width: "100%", padding: "10px", border: "1.5px solid #edf2f7", borderRadius: "6px", fontSize: "13px", fontWeight: "600", backgroundColor: "#fff" }}>
                        <option value="5">5 Stars (Excellent)</option>
                        <option value="4">4 Stars (Good)</option>
                        <option value="3">3 Stars (Average)</option>
                        <option value="2">2 Stars (Poor)</option>
                        <option value="1">1 Star (Very Poor)</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: "12px", fontWeight: "800", color: "#4a5568", display: "block", marginBottom: "4px" }}>Comments</label>
                      <textarea rows={4} placeholder="Write your product experience..." value={comment} onChange={(e) => setComment(e.target.value)}
                        style={{ width: "100%", padding: "10px", border: "1.5px solid #edf2f7", borderRadius: "6px", fontSize: "13px", fontWeight: "600" }} />
                    </div>
                    {reviewMessage && <p style={{ fontSize: "12px", fontWeight: "700", color: "#e52860" }}>{reviewMessage}</p>}
                    <button type="submit" style={{ backgroundColor: "#e52860", color: "#ffffff", fontWeight: "800", textAlign: "center", padding: "12px", borderRadius: "6px", cursor: "pointer", border: "none" }}>SUBMIT REVIEW</button>
                  </form>
                </div>
              </div>
            )}
            
            {activeTab === "qa" && (
              <div>
                <p>Have questions about this item? Ask questions and get answers from our beauty experts.</p>
                <div style={{ marginTop: "16px", padding: "12px", border: "1.5px dashed #edf2f7", borderRadius: "8px", display: "inline-block" }}>
                  <span style={{ fontWeight: "700", color: "#e52860" }}>💬 Contact customer helpline at +8809666737475 for instant advice.</span>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ═══ bottom grid 1: CUSTOMERS ALSO VIEWED ═══ */}
        {alsoViewedProducts.length > 0 && (
          <section style={{ marginTop: "40px", borderTop: "1px solid #edf2f7", paddingTop: "32px" }}>
            <h2 style={{ fontSize: "20px", fontWeight: "900", color: "#1a1a2e", marginBottom: "20px" }}>
              CUSTOMERS ALSO VIEWED
            </h2>
            <div className="product-grid-shajgoj">
              {alsoViewedProducts.map((p) => {
                const primaryImage = p.images.find((img: any) => img.isPrimary)?.url || p.images[0]?.url || "";
                const primaryVariant = p.variants[0];
                if (!primaryVariant) return null;

                const isDiscounted = primaryVariant.discountPrice !== null && primaryVariant.discountPrice! < primaryVariant.price;
                const displayPrice = isDiscounted ? primaryVariant.discountPrice : primaryVariant.price;
                const discountPct = isDiscounted ? Math.round(((primaryVariant.price - primaryVariant.discountPrice!) / primaryVariant.price) * 100) : 0;

                return (
                  <div className="product-card" key={p.id}>
                    {isDiscounted && <div className="badge-tag">{discountPct}% OFF</div>}
                    <div className={`wishlist-btn ${wishlist.includes(p.id) ? "active" : ""}`} onClick={() => toggleWishlist(p.id)}>
                      <svg fill={wishlist.includes(p.id) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="16" height="16">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                      </svg>
                    </div>

                    <Link href={`/${p.id}`} className="card-image">
                      <img src={primaryImage} alt={p.name} />
                    </Link>

                    <div className="card-body">
                      <Link href={`/${p.id}`} className="card-title">
                        {p.name}
                      </Link>

                      <div className="card-shipping-badge">FREE SHIPPING</div>

                      <div className="card-price-row">
                        <span className="price">৳{displayPrice}</span>
                        {isDiscounted && <span className="old-price">৳{primaryVariant.price}</span>}
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
                            price: displayPrice,
                            stock: primaryVariant.stock,
                          }, 1)
                        }
                      >
                        ADD TO CART
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ═══ bottom grid 2: RECOMMENDED FOR YOU ═══ */}
        {recommendedProducts.length > 0 && (
          <section style={{ marginTop: "48px", borderTop: "1px solid #edf2f7", paddingTop: "32px" }}>
            <h2 style={{ fontSize: "20px", fontWeight: "900", color: "#1a1a2e", marginBottom: "20px" }}>
              RECOMMENDED FOR YOU
            </h2>
            <div className="product-grid-shajgoj">
              {recommendedProducts.map((p) => {
                const primaryImage = p.images.find((img: any) => img.isPrimary)?.url || p.images[0]?.url || "";
                const primaryVariant = p.variants[0];
                if (!primaryVariant) return null;

                const isDiscounted = primaryVariant.discountPrice !== null && primaryVariant.discountPrice! < primaryVariant.price;
                const displayPrice = isDiscounted ? primaryVariant.discountPrice : primaryVariant.price;
                const discountPct = isDiscounted ? Math.round(((primaryVariant.price - primaryVariant.discountPrice!) / primaryVariant.price) * 100) : 0;

                return (
                  <div className="product-card" key={p.id}>
                    {isDiscounted && <div className="badge-tag">{discountPct}% OFF</div>}
                    <div className={`wishlist-btn ${wishlist.includes(p.id) ? "active" : ""}`} onClick={() => toggleWishlist(p.id)}>
                      <svg fill={wishlist.includes(p.id) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="16" height="16">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                      </svg>
                    </div>

                    <Link href={`/${p.id}`} className="card-image">
                      <img src={primaryImage} alt={p.name} />
                    </Link>

                    <div className="card-body">
                      <Link href={`/${p.id}`} className="card-title">
                        {p.name}
                      </Link>

                      <div className="card-shipping-badge">FREE SHIPPING</div>

                      <div className="card-price-row">
                        <span className="price">৳{displayPrice}</span>
                        {isDiscounted && <span className="old-price">৳{primaryVariant.price}</span>}
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
                            price: displayPrice,
                            stock: primaryVariant.stock,
                          }, 1)
                        }
                      >
                        ADD TO CART
                      </button>
                    </div>
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
