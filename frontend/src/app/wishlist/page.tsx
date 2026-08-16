"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import MobileNavbar from "../../components/MobileNavbar";
import { useApp } from "../../context/AppContext";
import { API_BASE } from "../../utils/api";

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
  brand?: { id: string; name: string };
  images?: { id: string; url: string; isPrimary: boolean }[];
  variants?: Variant[];
}

export default function WishlistPage() {
  const { wishlist, toggleWishlist, addToCart } = useApp();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWishlistItems = async () => {
      if (!wishlist || wishlist.length === 0) {
        setProducts([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const idsParam = wishlist.join(",");
        const res = await fetch(`${API_BASE}/products?ids=${encodeURIComponent(idsParam)}`);
        if (res.ok) {
          const fetchedProducts = await res.json();
          setProducts(Array.isArray(fetchedProducts) ? fetchedProducts : []);
        }
      } catch (e) {
        console.error("Error fetching wishlist products:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchWishlistItems();
  }, [wishlist]);

  const handleAddToCart = (product: Product) => {
    const primaryVariant = product.variants?.[0];
    const displayPrice = primaryVariant ? (primaryVariant.discountPrice || primaryVariant.price) : 350;

    const primaryImage = product.images?.find((img) => img.isPrimary)?.url || 
      product.images?.[0]?.url || 
      "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=500&auto=format&fit=crop&q=60";

    addToCart({
      id: primaryVariant?.id || `v-${product.id}`,
      productId: product.id,
      name: product.name,
      variantName: primaryVariant?.name || "Standard",
      image: primaryImage,
      price: displayPrice,
      stock: primaryVariant?.stock || 20,
    });
  };

  return (
    <>
      <Header />

      <main className="container" style={{ padding: "40px 20px 80px 20px", minHeight: "75vh" }}>
        
        {/* Breadcrumb Navigation */}
        <div style={{ fontSize: "13.5px", color: "#718096", fontWeight: "700", marginBottom: "25px" }}>
          <Link href="/">Home</Link> &nbsp;»&nbsp; <span style={{ color: "#e52860" }}>My Wishlist</span>
        </div>

        <div style={{ borderBottom: "2px solid #f1f3f5", paddingBottom: "15px", marginBottom: "30px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" }}>
          <div>
            <h1 style={{ fontSize: "28px", fontWeight: "900", color: "#0e1e38", margin: 0 }}>
              My Wishlist ({wishlist.length})
            </h1>
            <p style={{ fontSize: "14px", color: "#718096", fontWeight: "600", marginTop: "5px", margin: 0 }}>
              Keep track of your favorite beauty products and essentials.
            </p>
          </div>

          <Link href="/shop" style={{ fontSize: "13.5px", fontWeight: "800", color: "#e52860", textDecoration: "none" }}>
            ← Continue Shopping
          </Link>
        </div>

        {loading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "300px", fontSize: "16px", fontWeight: "800", color: "#e52860" }}>
            Loading your favorites...
          </div>
        ) : products.length === 0 ? (
          <div style={{ backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid #edf2f7", padding: "60px 20px", textAlign: "center", maxWidth: "550px", margin: "0 auto", boxShadow: "0 4px 15px rgba(0,0,0,0.02)" }}>
            <div style={{ backgroundColor: "#fff5f8", width: "80px", height: "80px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#e52860", margin: "0 auto 20px auto" }}>
              <svg fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" width="40" height="40">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"></path>
              </svg>
            </div>
            <h2 style={{ fontSize: "22px", fontWeight: "900", color: "#2d3748", marginBottom: "8px" }}>Your Wishlist is Empty</h2>
            <p style={{ fontSize: "14px", color: "#718096", fontWeight: "600", marginBottom: "25px" }}>
              You haven't saved any products to your wishlist yet. Explore our shop and tap the heart icon on your favorite items!
            </p>
            <Link href="/shop" style={{ display: "inline-block", backgroundColor: "#e52860", color: "#ffffff", padding: "13px 32px", borderRadius: "30px", fontWeight: "800", fontSize: "14px", textDecoration: "none" }}>
              EXPLORE SHOP NOW
            </Link>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "25px" }}>
            {products.map((p) => {
              const primaryImage = p.images?.find((img) => img.isPrimary)?.url || 
                p.images?.[0]?.url || 
                "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=500&auto=format&fit=crop&q=60";

              const primaryVariant = p.variants?.[0];
              const isDiscounted = Boolean(primaryVariant?.discountPrice);
              const displayPrice = primaryVariant ? (isDiscounted ? primaryVariant.discountPrice : primaryVariant.price) : 350;

              return (
                <div 
                  key={p.id}
                  style={{
                    backgroundColor: "#ffffff",
                    borderRadius: "12px",
                    border: "1px solid #e2e8f0",
                    overflow: "hidden",
                    position: "relative",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
                    transition: "transform 0.2s, box-shadow 0.2s"
                  }}
                >
                  {/* Remove from Wishlist Trash Button */}
                  <button
                    onClick={() => toggleWishlist(p.id)}
                    style={{
                      position: "absolute",
                      top: "12px",
                      right: "12px",
                      backgroundColor: "#ffffff",
                      border: "none",
                      width: "34px",
                      height: "34px",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#e53e3e",
                      boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
                      cursor: "pointer",
                      zIndex: 10,
                    }}
                    title="Remove from Wishlist"
                  >
                    <svg fill="currentColor" viewBox="0 0 24 24" width="16" height="16">
                      <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"></path>
                    </svg>
                  </button>

                  <Link href={`/product/${p.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                    <div style={{ width: "100%", height: "230px", overflow: "hidden", backgroundColor: "#f8fafc", position: "relative" }}>
                      <img 
                        src={primaryImage} 
                        alt={p.name} 
                        onError={(e) => { e.currentTarget.src = "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=500&auto=format&fit=crop&q=60"; }}
                        style={{ width: "100%", height: "100%", objectFit: "contain", padding: "10px" }} 
                      />
                    </div>

                    <div style={{ padding: "16px 16px 10px 16px" }}>
                      <span style={{ fontSize: "11px", fontWeight: "800", color: "#a0aec0", textTransform: "uppercase", display: "block" }}>
                        {p.brand?.name || "GlowGoodly"}
                      </span>
                      <h3 style={{ fontSize: "14px", fontWeight: "700", color: "#1a202c", margin: "6px 0 10px 0", lineHeight: "1.4", height: "40px", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                        {p.name}
                      </h3>

                      <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
                        <span style={{ fontSize: "16px", fontWeight: "900", color: "#e52860" }}>
                          BDT {displayPrice}
                        </span>
                        {isDiscounted && primaryVariant?.price && (
                          <span style={{ fontSize: "12.5px", color: "#a0aec0", textDecoration: "line-through", fontWeight: "600" }}>
                            BDT {primaryVariant.price}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>

                  <div style={{ padding: "0 16px 16px 16px" }}>
                    <button
                      onClick={() => handleAddToCart(p)}
                      style={{
                        width: "100%",
                        backgroundColor: "#1b2735",
                        color: "#ffffff",
                        border: "none",
                        padding: "11px",
                        borderRadius: "8px",
                        fontWeight: "800",
                        fontSize: "13px",
                        cursor: "pointer"
                      }}
                    >
                      ADD TO CART
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
      <MobileNavbar />
    </>
  );
}
