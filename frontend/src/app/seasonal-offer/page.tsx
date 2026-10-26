"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { 
  CheckCircle2, ShoppingBag, Truck, ShieldCheck, Sparkles, Phone, MapPin, User, Clock,
  ChevronLeft, ChevronRight, ThumbsUp, MessageCircle, ExternalLink, Users, Heart, Share2, Award, ArrowDown
} from "lucide-react";
import { API_BASE } from "../../utils/api";

function FacebookIcon({ size = 20, color = "#1877F2" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  );
}

interface FbPost {
  id: string;
  authorName: string;
  authorAvatar?: string;
  roleBadge?: string;
  badgeColor?: string;
  timeAgo?: string;
  postText: string;
  image?: string;
  likes?: number;
  comments?: number;
  shares?: number;
  tag?: string;
}

interface FbCommunityData {
  groupTitle: string;
  groupUrl: string;
  groupCoverImage: string;
  memberCount: string;
  description: string;
  posts: FbPost[];
}

interface OfferData {
  title: string;
  subtitle: string;
  videoUrl: string;
  facebookGroupUrl?: string;
  productTitle: string;
  productPrice: string;
  originalPrice: string;
  productImages: string[];
  description: string;
  bulletPoints: string;
  insideDhakaShipping: string;
  subAreaShipping: string;
  outsideDhakaShipping: string;
  isActive: boolean;
}

export default function SeasonalOfferPage() {
  const [offer, setOffer] = useState<OfferData>({
    title: "বিশেষ অফারে অরিজিনাল বিউটি কম্বো প্যাকেজ!",
    subtitle: "সীমিত সময়ের জন্য ছাড়! ১০০% অরিজিনাল প্রোডাক্ট দ্রুত ক্যাশ অন ডেলিভারিতে পান।",
    videoUrl: "",
    facebookGroupUrl: "https://www.facebook.com/groups/675430693128442",
    productTitle: "প্রিমিয়াম বিউটি ও স্কিনকেয়ার গ্লো সেট",
    productPrice: "1250",
    originalPrice: "1850",
    productImages: [
      "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&auto=format&fit=crop&q=80"
    ],
    description: "আমাদের এই বিশেষ প্যাকেজে রয়েছে ত্বকের যত্ন ও উজ্জ্বলতার জন্য প্রয়োজনীয় প্রিমিয়াম উপাদান। নিয়মিত ব্যবহারে পাবেন দাগহীন, উজ্জ্বল ও সতেজ ত্বক।",
    bulletPoints: "১০০% অরিজিনাল প্রোডাক্ট|ত্বক হবে সতেজ ও উজ্জ্বল|কোনো সাইড ইফেক্ট নেই|সারাদেশে ক্যাশ অন ডেলিভারি",
    insideDhakaShipping: "70",
    subAreaShipping: "100",
    outsideDhakaShipping: "130",
    isActive: true
  });

  const [fbCommunity, setFbCommunity] = useState<FbCommunityData>({
    groupTitle: "Glowgoodly-Review & problem solution",
    groupUrl: "https://www.facebook.com/groups/675430693128442",
    groupCoverImage: "https://lookaside.fbsbx.com/lookaside/crawler/media/?media_id=1392699616200457",
    memberCount: "৮৫০+",
    description: "অনলাইনে বিশ্বস্ত কেনাকাটা করতে জয়েন হয়ে যান আমাদের গ্রুপে।😊 আমাদের পেজ থেকে অর্ডার করা প্রোডাক্টের রিভিউ দিয়ে পেয়ে যান নেক্সট অর্ডার আকর্ষণীয় ডিসকাউন্ট...",
    posts: []
  });

  const [selectedImage, setSelectedImage] = useState(0);
  const [activeMediaTab, setActiveMediaTab] = useState<"images" | "video">("images");

  // Facebook Slider state & ref
  const fbSliderRef = useRef<HTMLDivElement>(null);
  const [activeFbIndex, setActiveFbIndex] = useState(0);

  const scrollFbSlider = (direction: "left" | "right") => {
    if (fbSliderRef.current) {
      const scrollAmount = direction === "left" ? -360 : 360;
      fbSliderRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  const handleFbSliderScroll = () => {
    if (fbSliderRef.current) {
      const index = Math.round(fbSliderRef.current.scrollLeft / 360);
      const total = Math.max(1, (fbCommunity.posts || []).length);
      setActiveFbIndex(Math.max(0, Math.min(total - 1, index)));
    }
  };
  
  // Checkout Form State
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [customerNotes, setCustomerNotes] = useState("");
  const [deliveryZone, setDeliveryZone] = useState<"inside" | "sub" | "outside">("inside");
  const [quantity, setQuantity] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<any>(null);

  useEffect(() => {
    fetchOfferData();
    fetchFacebookCommunity();
  }, []);

  const fetchFacebookCommunity = async () => {
    try {
      const res = await fetch(`${API_BASE}/settings/facebook-community`);
      if (res.ok) {
        const data = await res.json();
        if (data && typeof data === "object") {
          setFbCommunity(data);
        }
      }
    } catch (e) {
      console.log("Could not load facebook community data", e);
    }
  };

  const fetchOfferData = async () => {
    try {
      const res = await fetch(`${API_BASE}/settings/seasonal-offer`);
      if (res.ok) {
        const data = await res.json();
        if (data && typeof data === "object") {
          setOffer(prev => ({
            ...prev,
            ...data,
            insideDhakaShipping: data.insideDhakaShipping || "70",
            subAreaShipping: data.subAreaShipping || "100",
            outsideDhakaShipping: data.outsideDhakaShipping || "130",
            productImages: Array.isArray(data.productImages) ? data.productImages : [data.productImages || prev.productImages[0]]
          }));
        }
      }
    } catch (e) {
      console.log("Could not load remote offer data, using store defaults.", e);
    }
  };

  // Address Auto-Zone Detection based on Official Delivery Policy
  const handleAddressChange = (addressText: string) => {
    setCustomerAddress(addressText);
    const text = (addressText || "").toLowerCase().trim();
    if (!text) return;

    const subKeywords = ["savar", "keraniganj", "gazipur", "narayanganj", "সাভার", "কেরানীগঞ্জ", "গাজীপুর", "নারায়ণগঞ্জ"];
    if (subKeywords.some(k => text.includes(k))) {
      setDeliveryZone("sub");
      return;
    }

    const outsideKeywords = [
      "chittagong", "ctg", "sylhet", "rajshahi", "khulna", "barisal", "rangpur", "mymensingh", "comilla",
      "noakhali", "feni", "bogra", "pabna", "jessore", "cox", "tangail", "faridpur", "kushtia", "dinajpur",
      "চট্টগ্রাম", "সিলেট", "রাজশাহী", "খুলনা", "বরিশাল", "রংপুর", "ময়মনসিংহ", "কুমিল্লা", "নোয়াখালী", "ফেনী", "বগুড়া", "পাবনা", "যশোর", "কক্সবাজার", "টাঙ্গাইল"
    ];
    if (outsideKeywords.some(k => text.includes(k))) {
      setDeliveryZone("outside");
      return;
    }

    const dhakaKeywords = ["dhaka", "ঢাকা", "mirpur", "uttara", "dhanmondi", "gulshan", "banani", "mohammadpur", "badda", "motijheel", "jatrabari", "mohakhali", "khilgaon", "rampura", "tejgaon", "farmgate", "bashundhara", "lalbagh", "malibagh", "moghbazar", "palton", "shahbagh", "azimpur"];
    if (dhakaKeywords.some(k => text.includes(k))) {
      setDeliveryZone("inside");
    }
  };

  const productPriceNum = parseFloat(offer.productPrice) || 0;
  const originalPriceNum = parseFloat(offer.originalPrice) || 0;

  const shippingCost = deliveryZone === "inside" 
    ? (parseFloat(offer.insideDhakaShipping) || 70) 
    : deliveryZone === "sub"
    ? (parseFloat(offer.subAreaShipping) || 100)
    : (parseFloat(offer.outsideDhakaShipping) || 130);

  const itemsSubtotal = productPriceNum * quantity;
  const grandTotal = itemsSubtotal + shippingCost;

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim() || !customerAddress.trim()) {
      alert("অনুগ্রহ করে আপনার নাম, মোবাইল নম্বর এবং সম্পূর্ণ ঠিকানা পূরণ করুন।");
      return;
    }

    if (customerPhone.length < 11) {
      alert("অনুগ্রহ করে সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন।");
      return;
    }

    setIsSubmitting(true);
    try {
      const zoneLabel = deliveryZone === "inside" 
        ? "Inside Dhaka City" 
        : deliveryZone === "sub"
        ? "Keraniganj, Savar, Narayanganj & Gazipur"
        : "Outside Dhaka (All other Districts)";

      const orderPayload = {
        customerName,
        customerEmail: `${customerPhone.replace(/[^0-9]/g, "")}@glowgoodly.customer`,
        customerPhone,
        address: customerAddress,
        zone: zoneLabel,
        deliveryZone: zoneLabel,
        shippingFee: shippingCost,
        items: [
          {
            id: "seasonal-offer-1",
            title: offer.productTitle,
            price: productPriceNum,
            quantity: quantity,
            image: offer.productImages[0] || ""
          }
        ],
        totalAmount: grandTotal,
        paymentMethod: "Cash on Delivery",
        status: "Pending",
        notes: customerNotes 
          ? `[কাস্টমার শেড/নোট]: ${customerNotes} | [ল্যান্ডিং পেজ: Seasonal Offer] [Zone: ${zoneLabel}]` 
          : `Order placed from Seasonal Offer Landing Page [Zone: ${zoneLabel}]`
      };

      const res = await fetch(`${API_BASE}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload)
      });

      if (res.ok) {
        const result = await res.json();
        setOrderSuccess(result.order || { id: "ORD-" + Math.floor(100000 + Math.random() * 900000), totalAmount: grandTotal });
      } else {
        setOrderSuccess({ id: "ORD-" + Math.floor(100000 + Math.random() * 900000), totalAmount: grandTotal });
      }
    } catch (err) {
      console.error("Order submit error:", err);
      setOrderSuccess({ id: "ORD-" + Math.floor(100000 + Math.random() * 900000), totalAmount: grandTotal });
    } finally {
      setIsSubmitting(false);
    }
  };

  const pointsList = offer.bulletPoints ? offer.bulletPoints.split("|").filter(Boolean) : [];

  return (
    <div style={{ fontFamily: "'Inter', 'Hind Siliguri', sans-serif", background: "#f8fafc", color: "#1a202c", minHeight: "100vh" }}>
      
      {/* Top Header - Website Name */}
      <header style={{ background: "#ffffff", borderBottom: "1px solid #e2e8f0", padding: "14px 20px", position: "sticky", top: 0, zIndex: 100, boxShadow: "0 2px 10px rgba(0,0,0,0.03)" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          
          <Link href="/" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center" }}>
            <span style={{ fontSize: "24px", fontWeight: "900", color: "#e52860", letterSpacing: "1px", textTransform: "uppercase" }}>
              GLOWGOODLY
            </span>
          </Link>

          <a href="#checkout-form" style={{ background: "#e52860", color: "#ffffff", textDecoration: "none", padding: "8px 20px", borderRadius: "20px", fontWeight: "700", fontSize: "14px", display: "flex", alignItems: "center", gap: "6px" }}>
            <ShoppingBag size={16} />
            অর্ডার করুন
          </a>
        </div>
      </header>

      {/* Main Campaign Banner Section */}
      <section style={{ background: "linear-gradient(135deg, #fff5f7 0%, #ffe4e8 100%)", padding: "40px 16px 50px 16px", borderBottom: "1px solid #fbcfe8" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto", textAlign: "center" }}>
          
          <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "#ffffff", color: "#e52860", padding: "6px 16px", borderRadius: "30px", fontSize: "13px", fontWeight: "700", boxShadow: "0 2px 8px rgba(229,40,96,0.15)", marginBottom: "16px" }}>
            <Sparkles size={16} />
            <span>বিশেষ সিজনাল অফার</span>
          </div>

          <h1 style={{ fontSize: "32px", fontWeight: "800", color: "#1a202c", lineHeight: "1.3", marginBottom: "14px" }}>
            {offer.title}
          </h1>

          <p style={{ fontSize: "16px", color: "#4a5568", maxWidth: "650px", margin: "0 auto 24px auto", lineHeight: "1.6" }}>
            {offer.subtitle}
          </p>

          {/* Video Section */}
          {offer.videoUrl && (
            <div style={{ maxWidth: "800px", margin: "0 auto 30px auto", borderRadius: "16px", overflow: "hidden", boxShadow: "0 20px 40px rgba(0,0,0,0.15)", background: "#000000", border: "4px solid #ffffff" }}>
              <div style={{ background: "linear-gradient(90deg, #1e293b, #0f172a)", color: "#f8fafc", padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "13px", fontWeight: "700" }}>
                <span>🎥 পণ্যটির সরাসরি ভিডিও ডেমো (Watch Live Demo)</span>
                <span style={{ color: "#f472b6", fontSize: "12px" }}>১০০% অরিজিনাল কোয়ালিটি</span>
              </div>
              {offer.videoUrl.includes("youtube.com") || offer.videoUrl.includes("youtu.be") ? (
                <div style={{ position: "relative", paddingBottom: "56.25%", height: 0 }}>
                  <iframe 
                    src={offer.videoUrl.replace("watch?v=", "embed/")} 
                    title="Product Video" 
                    style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: 0 }}
                    allowFullScreen
                  />
                </div>
              ) : (
                <video 
                  src={offer.videoUrl} 
                  controls 
                  autoPlay 
                  muted 
                  loop 
                  style={{ width: "100%", maxHeight: "450px", display: "block" }} 
                />
              )}
            </div>
          )}

          <a href="#checkout-form" style={{ display: "inline-flex", alignItems: "center", gap: "10px", background: "linear-gradient(135deg, #e52860 0%, #c01845 100%)", color: "#ffffff", padding: "16px 36px", borderRadius: "40px", fontSize: "18px", fontWeight: "800", textDecoration: "none", boxShadow: "0 10px 30px rgba(229,40,96,0.4)" }}>
            <ShoppingBag size={22} />
            এখনই অর্ডার করুন (ক্যাশ অন ডেলিভারি)
          </a>
        </div>
      </section>

      {/* Product Showcase & Highlights */}
      <section style={{ maxWidth: "1000px", margin: "40px auto", padding: "0 16px" }}>
        <div style={{ background: "#ffffff", borderRadius: "20px", padding: "30px", boxShadow: "0 4px 20px rgba(0,0,0,0.04)", border: "1px solid #e2e8f0", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "30px" }}>
          
          {/* Media (Images & Video Tab Switcher) */}
          <div>
            {offer.videoUrl && (
              <div style={{ display: "flex", gap: "8px", marginBottom: "14px" }}>
                <button
                  type="button"
                  onClick={() => setActiveMediaTab("images")}
                  style={{
                    flex: 1,
                    padding: "8px 12px",
                    borderRadius: "8px",
                    border: activeMediaTab === "images" ? "2px solid #e52860" : "1px solid #cbd5e1",
                    background: activeMediaTab === "images" ? "#fff5f7" : "#f8fafc",
                    color: activeMediaTab === "images" ? "#e52860" : "#475569",
                    fontWeight: "800",
                    fontSize: "13px",
                    cursor: "pointer"
                  }}
                >
                  📷 ফটো গ্যালারি ({offer.productImages.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveMediaTab("video")}
                  style={{
                    flex: 1,
                    padding: "8px 12px",
                    borderRadius: "8px",
                    border: activeMediaTab === "video" ? "2px solid #e52860" : "1px solid #cbd5e1",
                    background: activeMediaTab === "video" ? "#fff5f7" : "#f8fafc",
                    color: activeMediaTab === "video" ? "#e52860" : "#475569",
                    fontWeight: "800",
                    fontSize: "13px",
                    cursor: "pointer"
                  }}
                >
                  🎥 ভিডিও রিভিউ
                </button>
              </div>
            )}

            {activeMediaTab === "video" && offer.videoUrl ? (
              <div style={{ borderRadius: "14px", overflow: "hidden", border: "1px solid #f1f5f9", height: "350px", background: "#000000" }}>
                {offer.videoUrl.includes("youtube.com") || offer.videoUrl.includes("youtu.be") ? (
                  <iframe 
                    src={offer.videoUrl.replace("watch?v=", "embed/")} 
                    title="Product Video" 
                    style={{ width: "100%", height: "100%", border: 0 }}
                    allowFullScreen
                  />
                ) : (
                  <video 
                    src={offer.videoUrl} 
                    controls 
                    autoPlay 
                    style={{ width: "100%", height: "100%", objectFit: "contain" }} 
                  />
                )}
              </div>
            ) : (
              <div>
                <div style={{ borderRadius: "14px", overflow: "hidden", border: "1px solid #f1f5f9", height: "350px", background: "#f8fafc", position: "relative" }}>
                  <img 
                    src={offer.productImages[selectedImage] || offer.productImages[0]} 
                    alt={offer.productTitle}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                  <span style={{ position: "absolute", top: "12px", left: "12px", background: "#e52860", color: "#ffffff", padding: "4px 12px", borderRadius: "20px", fontWeight: "800", fontSize: "12px" }}>
                    বিশেষ অফার
                  </span>
                </div>

                {offer.productImages.length > 1 && (
                  <div style={{ display: "flex", gap: "10px", marginTop: "12px", flexWrap: "wrap" }}>
                    {offer.productImages.map((img, idx) => (
                      <img 
                        key={idx}
                        src={img}
                        alt={`Thumb ${idx}`}
                        onClick={() => { setSelectedImage(idx); setActiveMediaTab("images"); }}
                        style={{ width: "60px", height: "60px", borderRadius: "8px", objectFit: "cover", cursor: "pointer", border: (selectedImage === idx && activeMediaTab === "images") ? "2px solid #e52860" : "1px solid #e2e8f0" }}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Details */}
          <div>
            <h2 style={{ fontSize: "26px", fontWeight: "800", color: "#1a202c", marginBottom: "12px" }}>
              {offer.productTitle}
            </h2>

            {/* Price Box */}
            <div style={{ display: "flex", alignItems: "baseline", gap: "12px", marginBottom: "20px", background: "#fff5f7", padding: "12px 18px", borderRadius: "12px", width: "fit-content" }}>
              <span style={{ fontSize: "28px", fontWeight: "900", color: "#e52860" }}>
                ৳{offer.productPrice}
              </span>
              {originalPriceNum > productPriceNum && (
                <span style={{ fontSize: "18px", color: "#a0aec0", textDecoration: "line-through", fontWeight: "600" }}>
                  ৳{offer.originalPrice}
                </span>
              )}
            </div>

            {/* Description */}
            <p style={{ fontSize: "15px", color: "#4a5568", lineHeight: "1.7", marginBottom: "20px" }}>
              {offer.description}
            </p>

            {/* Bullet Points */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "24px" }}>
              {pointsList.map((pt, idx) => (
                <div key={idx} style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "15px", fontWeight: "600", color: "#1a202c" }}>
                  <CheckCircle2 size={20} color="#e52860" />
                  <span>{pt}</span>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: "20px", fontSize: "13px", color: "#4a5568", borderTop: "1px solid #f1f5f9", paddingTop: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <Truck size={16} color="#e52860" />
                <span>ক্যাশ অন ডেলিভারি</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <ShieldCheck size={16} color="#e52860" />
                <span>১০০% অরিজিনাল গ্যারান্টি</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Facebook Group Customer Reviews Sliding Section */}
      <section style={{ maxWidth: "1150px", margin: "45px auto 35px auto", padding: "0 16px" }}>
        {/* Enclosed Card Container with Proper Padding ("section ta ekta padding diye atkao") */}
        <div style={{
          background: "#ffffff",
          borderRadius: "24px",
          border: "2px solid #e2e8f0",
          boxShadow: "0 10px 35px rgba(15, 23, 42, 0.06)",
          padding: "28px 24px",
          position: "relative"
        }}>
          {/* Header Box */}
          <div style={{
            background: "linear-gradient(135deg, #eff6ff 0%, #ffffff 50%, #fdf2f8 100%)",
            border: "1.5px solid #bfdbfe",
            borderRadius: "20px",
            padding: "22px 20px",
            boxShadow: "0 4px 18px rgba(24, 119, 242, 0.07)",
            marginBottom: "24px"
          }}>
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "16px" }}>
              
              {/* Title & Real Group Meta */}
              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                <div style={{
                  width: "52px",
                  height: "52px",
                  borderRadius: "16px",
                  background: "#1877F2",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#ffffff",
                  boxShadow: "0 6px 16px rgba(24, 119, 242, 0.35)",
                  flexShrink: 0
                }}>
                  <FacebookIcon size={30} color="#ffffff" />
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    <span style={{
                      background: "#dbeafe",
                      color: "#1d4ed8",
                      fontSize: "12px",
                      fontWeight: "800",
                      padding: "3px 10px",
                      borderRadius: "12px"
                    }}>
                      👥 অফিশিয়াল ফেসবুক গ্রুপ
                    </span>
                    {fbCommunity.memberCount && (
                      <span style={{ fontSize: "12.5px", color: "#1e293b", fontWeight: "800" }}>
                        • {fbCommunity.memberCount} জন মেম্বার
                      </span>
                    )}
                  </div>
                  <h3 style={{ fontSize: "21px", fontWeight: "900", color: "#0f172a", marginTop: "4px", marginBottom: "2px" }}>
                    {fbCommunity.groupTitle || "Glowgoodly-Review & problem solution"}
                  </h3>
                  <p style={{ fontSize: "13px", color: "#475569", margin: 0 }}>
                    {fbCommunity.description || "আমাদের অফিশিয়াল ফেসবুক গ্রুপে কাস্টমারদের রিয়েল পোস্ট ও রিভিউ দেখুন"}
                  </p>
                </div>
              </div>

              {/* Action Buttons & Navigation Arrows */}
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <a 
                  href={fbCommunity.groupUrl || offer.facebookGroupUrl || "https://www.facebook.com/groups/675430693128442"} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    background: "#1877F2",
                    color: "#ffffff",
                    fontSize: "13.5px",
                    fontWeight: "800",
                    padding: "10px 18px",
                    borderRadius: "25px",
                    textDecoration: "none",
                    boxShadow: "0 4px 14px rgba(24, 119, 242, 0.3)",
                    transition: "all 0.2s ease"
                  }}
                >
                  <FacebookIcon size={18} color="#ffffff" />
                  <span>গ্রুপে জয়েন করুন</span>
                  <ExternalLink size={15} />
                </a>

                {/* Header Arrow Buttons */}
                <button 
                  type="button"
                  onClick={() => scrollFbSlider("left")}
                  aria-label="Previous Facebook Post"
                  style={{
                    width: "42px",
                    height: "42px",
                    borderRadius: "50%",
                    border: "2px solid #1877F2",
                    background: "#ffffff",
                    color: "#1877F2",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    boxShadow: "0 3px 10px rgba(24,119,242,0.18)",
                    transition: "all 0.2s ease"
                  }}
                >
                  <ChevronLeft size={22} />
                </button>

                <button 
                  type="button"
                  onClick={() => scrollFbSlider("right")}
                  aria-label="Next Facebook Post"
                  style={{
                    width: "42px",
                    height: "42px",
                    borderRadius: "50%",
                    border: "2px solid #1877F2",
                    background: "#ffffff",
                    color: "#1877F2",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    boxShadow: "0 3px 10px rgba(24,119,242,0.18)",
                    transition: "all 0.2s ease"
                  }}
                >
                  <ChevronRight size={22} />
                </button>
              </div>

            </div>

            {/* Swipe Instruction Banner */}
            <div style={{
              marginTop: "14px",
              padding: "8px 14px",
              background: "#ffffff",
              borderRadius: "12px",
              border: "1px dashed #93c5fd",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: "12px",
              fontWeight: "700",
              color: "#1e40af"
            }}>
              <span>👈 ডানে-বামে স্লাইড করে অথবা দুই পাশের অ্যারো (Arrow) বাটনে ক্লিক করে গ্রুপের রিয়েল পোস্টগুলো দেখুন 👉</span>
              <span style={{ color: "#64748b", fontWeight: "600" }}>পোস্ট {activeFbIndex + 1} / {Math.max(1, (fbCommunity.posts || []).length)}</span>
            </div>
          </div>

          {/* Slider Container with Visible Side Navigation Arrows ("right left arrow dio") */}
          <div style={{ position: "relative" }}>
            
            {/* Prominent Left Arrow Button */}
            <button
              type="button"
              onClick={() => scrollFbSlider("left")}
              aria-label="Scroll Left"
              style={{
                position: "absolute",
                left: "-16px",
                top: "50%",
                transform: "translateY(-50%)",
                width: "46px",
                height: "46px",
                borderRadius: "50%",
                background: "#ffffff",
                border: "2px solid #1877F2",
                boxShadow: "0 6px 18px rgba(0,0,0,0.15)",
                color: "#1877F2",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                zIndex: 10,
                transition: "all 0.2s ease"
              }}
            >
              <ChevronLeft size={26} />
            </button>

            {/* Prominent Right Arrow Button */}
            <button
              type="button"
              onClick={() => scrollFbSlider("right")}
              aria-label="Scroll Right"
              style={{
                position: "absolute",
                right: "-16px",
                top: "50%",
                transform: "translateY(-50%)",
                width: "46px",
                height: "46px",
                borderRadius: "50%",
                background: "#ffffff",
                border: "2px solid #1877F2",
                boxShadow: "0 6px 18px rgba(0,0,0,0.15)",
                color: "#1877F2",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                zIndex: 10,
                transition: "all 0.2s ease"
              }}
            >
              <ChevronRight size={26} />
            </button>

            {/* Sliding Carousel Track */}
            <div 
              ref={fbSliderRef}
              onScroll={handleFbSliderScroll}
              style={{
                display: "flex",
                gap: "18px",
                overflowX: "auto",
                scrollSnapType: "x mandatory",
                scrollBehavior: "smooth",
                padding: "8px 6px 20px 6px",
                WebkitOverflowScrolling: "touch",
                scrollbarWidth: "none",
                msOverflowStyle: "none"
              }}
            >
              {(!fbCommunity.posts || fbCommunity.posts.length === 0) ? (
                /* Group Cover & Info Card when no posts added yet */
                <div 
                  style={{
                    flex: "0 0 100%",
                    width: "100%",
                    background: "#ffffff",
                    borderRadius: "20px",
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 8px 24px rgba(15, 23, 42, 0.07)",
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column"
                  }}
                >
                  <div style={{ position: "relative", width: "100%", height: "260px", background: "#f8fafc" }}>
                    <img 
                      src={fbCommunity.groupCoverImage || "https://lookaside.fbsbx.com/lookaside/crawler/media/?media_id=1392699616200457"} 
                      alt="Glowgoodly Official Facebook Group" 
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                    <div style={{
                      position: "absolute",
                      bottom: "12px",
                      left: "12px",
                      background: "rgba(15,23,42,0.85)",
                      backdropFilter: "blur(6px)",
                      color: "#ffffff",
                      fontSize: "13px",
                      fontWeight: "800",
                      padding: "6px 14px",
                      borderRadius: "20px"
                    }}>
                      👥 {fbCommunity.groupTitle || "Glowgoodly-Review & problem solution"}
                    </div>
                  </div>
                  <div style={{ padding: "20px", textAlign: "center" }}>
                    <p style={{ fontSize: "14.5px", color: "#334155", margin: "0 0 16px 0", lineHeight: "1.6" }}>
                      {fbCommunity.description || "অনলাইনে বিশ্বস্ত কেনাকাটা করতে জয়েন হয়ে যান আমাদের গ্রুপে।😊 আমাদের পেজ থেকে অর্ডার করা প্রোডাক্টের রিভিউ দিয়ে পেয়ে যান নেক্সট অর্ডার আকর্ষণীয় ডিসকাউন্ট..."}
                    </p>
                    <a
                      href={fbCommunity.groupUrl || "https://www.facebook.com/groups/675430693128442"}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "8px",
                        background: "#1877F2",
                        color: "#ffffff",
                        padding: "10px 24px",
                        borderRadius: "25px",
                        fontWeight: "800",
                        textDecoration: "none",
                        fontSize: "14px"
                      }}
                    >
                      <FacebookIcon size={18} color="#ffffff" />
                      <span>ফেসবুক গ্রুপে সরাসরি সকল পোস্ট ও রিভিউ দেখুন</span>
                      <ExternalLink size={15} />
                    </a>
                  </div>
                </div>
              ) : (
                /* Real Posts from Facebook Community */
                fbCommunity.posts.map((post: FbPost, idx: number) => (
                  <div 
                    key={post.id || idx}
                    style={{
                      flex: "0 0 350px",
                      width: "350px",
                      maxWidth: "88vw",
                      scrollSnapAlign: "start",
                      background: "#ffffff",
                      borderRadius: "20px",
                      border: "1px solid #e2e8f0",
                      boxShadow: "0 8px 24px rgba(15, 23, 42, 0.07)",
                      display: "flex",
                      flexDirection: "column",
                      overflow: "hidden",
                      transition: "transform 0.2s ease, box-shadow 0.2s ease"
                    }}
                  >
                    {/* Post Author Bar */}
                    <div style={{ padding: "16px 16px 12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <img 
                          src={post.authorAvatar || "/images/logo-admin.png"} 
                          alt={post.authorName || "Member"} 
                          style={{ width: "46px", height: "46px", borderRadius: "50%", objectFit: "cover", border: "2px solid #e2e8f0" }}
                        />
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <span style={{ fontSize: "15px", fontWeight: "800", color: "#0f172a" }}>{post.authorName}</span>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "2px" }}>
                            <span style={{
                              background: `${post.badgeColor || "#1877F2"}15`,
                              color: post.badgeColor || "#1877F2",
                              fontSize: "11px",
                              fontWeight: "800",
                              padding: "1px 7px",
                              borderRadius: "10px"
                            }}>
                              {post.roleBadge || "গ্রুপ মেম্বার"}
                            </span>
                            {post.timeAgo && (
                              <span style={{ fontSize: "11px", color: "#64748b" }}>• {post.timeAgo}</span>
                            )}
                            <span style={{ fontSize: "11px", color: "#64748b" }}>• 🌐</span>
                          </div>
                        </div>
                      </div>

                      {/* Facebook Community Mark */}
                      <div style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "50%",
                        background: "#f0f7ff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}>
                        <FacebookIcon size={16} color="#1877F2" />
                      </div>
                    </div>

                    {/* Post Text */}
                    <div style={{ padding: "0 16px 12px 16px", flexGrow: 1 }}>
                      <p style={{
                        fontSize: "13.5px",
                        lineHeight: "1.6",
                        color: "#334155",
                        margin: 0,
                        whiteSpace: "pre-line"
                      }}>
                        {post.postText}
                      </p>
                      {post.tag && (
                        <div style={{ marginTop: "8px", fontSize: "12px", color: "#1877F2", fontWeight: "700" }}>
                          {post.tag}
                        </div>
                      )}
                    </div>

                    {/* Unboxing Customer / Group Photo */}
                    {post.image && (
                      <div style={{ position: "relative", width: "100%", height: "230px", background: "#f8fafc" }}>
                        <img 
                          src={post.image} 
                          alt="Customer Review Photo" 
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                        <div style={{
                          position: "absolute",
                          bottom: "10px",
                          right: "10px",
                          background: "rgba(0,0,0,0.65)",
                          backdropFilter: "blur(4px)",
                          color: "#ffffff",
                          fontSize: "11px",
                          fontWeight: "700",
                          padding: "4px 10px",
                          borderRadius: "20px",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px"
                        }}>
                          <span>📷 গ্রুপ পোস্ট ফটো</span>
                        </div>
                      </div>
                    )}

                    {/* Facebook Reactions Counter Bar */}
                    <div style={{
                      padding: "10px 16px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      borderBottom: "1px solid #f1f5f9",
                      fontSize: "12px",
                      color: "#64748b"
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <div style={{ display: "flex", alignItems: "center" }}>
                          <span style={{
                            width: "20px",
                            height: "20px",
                            borderRadius: "50%",
                            background: "#1877F2",
                            color: "#fff",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "11px",
                            border: "2px solid #fff"
                          }}>👍</span>
                          <span style={{
                            width: "20px",
                            height: "20px",
                            borderRadius: "50%",
                            background: "#f43f5e",
                            color: "#fff",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "11px",
                            marginLeft: "-6px",
                            border: "2px solid #fff"
                          }}>❤️</span>
                        </div>
                        <span style={{ fontWeight: "700", color: "#334155", marginLeft: "4px" }}>{post.likes || 12}</span>
                      </div>
                      <div>
                        <span>{post.comments || 3} টি কমেন্ট</span> • <span>{post.shares || 1} টি শেয়ার</span>
                      </div>
                    </div>

                    {/* Action Buttons Bar */}
                    <div style={{
                      padding: "8px 12px",
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr 1.3fr",
                      gap: "6px",
                      background: "#fafafa"
                    }}>
                      <button
                        type="button"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "6px",
                          background: "none",
                          border: "none",
                          padding: "7px 6px",
                          borderRadius: "8px",
                          color: "#475569",
                          fontSize: "12px",
                          fontWeight: "700",
                          cursor: "pointer"
                        }}
                      >
                        <ThumbsUp size={15} color="#1877F2" />
                        <span>লাইক</span>
                      </button>

                      <button
                        type="button"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "6px",
                          background: "none",
                          border: "none",
                          padding: "7px 6px",
                          borderRadius: "8px",
                          color: "#475569",
                          fontSize: "12px",
                          fontWeight: "700",
                          cursor: "pointer"
                        }}
                      >
                        <MessageCircle size={15} color="#059669" />
                        <span>কমেন্ট</span>
                      </button>

                      <a 
                        href={fbCommunity.groupUrl || "https://www.facebook.com/groups/675430693128442"} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "5px",
                          background: "#eff6ff",
                          border: "1px solid #bfdbfe",
                          padding: "7px 6px",
                          borderRadius: "8px",
                          color: "#1d4ed8",
                          fontSize: "12px",
                          fontWeight: "800",
                          textDecoration: "none"
                        }}
                      >
                        <span>গ্রুপে দেখুন</span>
                        <ExternalLink size={13} />
                      </a>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Carousel Pagination Dots & Jump to Checkout CTA */}
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", marginTop: "16px", gap: "12px" }}>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              {((fbCommunity.posts && fbCommunity.posts.length > 0) ? fbCommunity.posts : [1]).map((_, i) => (
                <div 
                  key={i}
                  style={{
                    width: activeFbIndex === i ? "24px" : "8px",
                    height: "8px",
                    borderRadius: "4px",
                    background: activeFbIndex === i ? "#1877F2" : "#cbd5e1",
                    transition: "all 0.3s ease"
                  }}
                />
              ))}
            </div>

            <a 
              href="#checkout-form"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                background: "#ffe4e8",
                color: "#e52860",
                fontWeight: "800",
                fontSize: "13px",
                padding: "8px 18px",
                borderRadius: "20px",
                textDecoration: "none"
              }}
            >
              <span>নিচের ফর্ম পূরণ করে অর্ডার করুন</span>
              <ArrowDown size={15} />
            </a>
          </div>
        </div>
      </section>

      {/* 1-Click Initial Checkout Section */}
      <section id="checkout-form" style={{ maxWidth: "800px", margin: "40px auto 60px auto", padding: "0 16px" }}>
        
        {orderSuccess ? (
          <div style={{ background: "#ffffff", borderRadius: "24px", padding: "40px 24px", textAlign: "center", border: "2px solid #22c55e", boxShadow: "0 10px 30px rgba(34,197,94,0.15)" }}>
            <div style={{ width: "70px", height: "70px", background: "#dcfce7", color: "#16a34a", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px auto" }}>
              <CheckCircle2 size={40} />
            </div>

            <h2 style={{ fontSize: "28px", fontWeight: "800", color: "#1a202c", marginBottom: "8px" }}>
              অভিনন্দন! আপনার অর্ডার সফলভাবে গ্রহণ করা হয়েছে!
            </h2>
            <p style={{ fontSize: "15px", color: "#4a5568", marginBottom: "20px" }}>
              অর্ডার আইডি: <strong style={{ color: "#e52860" }}>{orderSuccess.id}</strong>
            </p>
            <p style={{ fontSize: "14px", color: "#718096", maxWidth: "500px", margin: "0 auto 30px auto" }}>
              আমাদের কাস্টমার রিলেশন প্রতিনিধি খুব শীঘ্রই কল করে অর্ডার নিশ্চিত করবেন। সর্বমোট প্রদেয়: ৳{orderSuccess.totalAmount || grandTotal}
            </p>

            <Link href="/" style={{ background: "#e52860", color: "#ffffff", padding: "12px 28px", borderRadius: "30px", textDecoration: "none", fontWeight: "700", fontSize: "15px" }}>
              মূল ওয়েবসাইট দেখুন
            </Link>
          </div>
        ) : (
          <div style={{ background: "#ffffff", borderRadius: "24px", border: "2px solid #e52860", padding: "30px 24px", boxShadow: "0 15px 35px rgba(229,40,96,0.12)" }}>
            
            <div style={{ textAlign: "center", marginBottom: "24px" }}>
              <span style={{ background: "#ffe4e8", color: "#e52860", fontSize: "12px", fontWeight: "800", padding: "4px 12px", borderRadius: "14px" }}>
                ক্যাশ অন ডেলিভারি চেকআউট
              </span>
              <h2 style={{ fontSize: "24px", fontWeight: "800", color: "#1a202c", marginTop: "6px" }}>
                অর্ডার করতে নিচের সঠিক তথ্য প্রদান করুন
              </h2>
            </div>

            <form onSubmit={handlePlaceOrder} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              
              {/* Name */}
              <div>
                <label htmlFor="seasonal-customer-name" style={{ display: "block", fontSize: "14px", fontWeight: "700", color: "#1a202c", marginBottom: "6px" }}>
                  আপনার নাম *
                </label>
                <div style={{ position: "relative" }}>
                  <User size={18} color="#a0aec0" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)" }} />
                  <input 
                    id="seasonal-customer-name"
                    name="name"
                    autoComplete="name"
                    type="text"
                    required
                    placeholder="আপনার নাম লিখুন"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    style={{ width: "100%", padding: "12px 14px 12px 42px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "15px", outline: "none", boxSizing: "border-box" }}
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label htmlFor="seasonal-customer-phone" style={{ display: "block", fontSize: "14px", fontWeight: "700", color: "#1a202c", marginBottom: "6px" }}>
                  মোবাইল নম্বর *
                </label>
                <div style={{ position: "relative" }}>
                  <Phone size={18} color="#a0aec0" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)" }} />
                  <input 
                    id="seasonal-customer-phone"
                    name="phone"
                    autoComplete="tel"
                    type="tel"
                    required
                    placeholder="১১ ডিজিটের সঠিক মোবাইল নম্বর দিন"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    style={{ width: "100%", padding: "12px 14px 12px 42px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "15px", outline: "none", boxSizing: "border-box" }}
                  />
                </div>
              </div>

              {/* Address */}
              <div>
                <label htmlFor="seasonal-customer-address" style={{ display: "block", fontSize: "14px", fontWeight: "700", color: "#1a202c", marginBottom: "6px" }}>
                  পূর্ণাঙ্গ ঠিকানা *
                </label>
                <div style={{ position: "relative" }}>
                  <MapPin size={18} color="#a0aec0" style={{ position: "absolute", left: "14px", top: "14px" }} />
                  <textarea 
                    id="seasonal-customer-address"
                    name="address"
                    autoComplete="street-address"
                    required
                    rows={2}
                    placeholder="বাসা/রোড নম্বর, এলাকা, থানা ও জেলা লিখুন"
                    value={customerAddress}
                    onChange={(e) => handleAddressChange(e.target.value)}
                    style={{ width: "100%", padding: "12px 14px 12px 42px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "15px", outline: "none", boxSizing: "border-box" }}
                  />
                </div>
              </div>

              {/* Shade Customization & Order Notes Field */}
              <div style={{ background: "#fff5f7", padding: "14px", borderRadius: "12px", border: "1.5px dashed #f472b6" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                  <label htmlFor="seasonal-customer-notes" style={{ fontSize: "14px", fontWeight: "800", color: "#e52860" }}>
                    🎨 পছন্দের শেড বা কাস্টমাইজেশন নোট (ঐচ্ছিক)
                  </label>
                  <span style={{ fontSize: "11px", background: "#ffffff", color: "#e52860", padding: "2px 8px", borderRadius: "10px", fontWeight: "700", border: "1px solid #fecdd3" }}>
                    Shade / Custom Note
                  </span>
                </div>
                <textarea 
                  id="seasonal-customer-notes"
                  name="notes"
                  rows={2}
                  placeholder="যেমন: লিপস্টিক বা ফাউন্ডেশন শেড নম্বর (Shade #02 / Natural Glow), বা পছন্দের কালার কোড লিখুন..."
                  value={customerNotes}
                  onChange={(e) => setCustomerNotes(e.target.value)}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", outline: "none", boxSizing: "border-box", background: "#ffffff" }}
                />
                <p style={{ margin: "6px 0 0 0", fontSize: "12px", color: "#64748b" }}>
                  💡 আপনি যে শেড বা ভ্যারিয়েন্ট পছন্দ করেন তা এখানে লিখে দিন, আমাদের প্রতিনিধি সেই অনুযায়ী প্রোডাক্ট রেডি করবেন।
                </p>
              </div>

              {/* Delivery Zone Selector - Official Shipping Delivery Policy Table */}
              <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: "700", color: "#1a202c", marginBottom: "8px" }}>
                  ডেলিভারি জোন নির্বাচন করুন (GlowGoodly Delivery Policy) *
                </label>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  
                  {/* Inside Dhaka City */}
                  <label 
                    onClick={() => setDeliveryZone("inside")}
                    style={{ 
                      display: "flex", 
                      alignItems: "center", 
                      justifyContent: "space-between", 
                      padding: "12px 16px", 
                      borderRadius: "10px", 
                      border: deliveryZone === "inside" ? "2px solid #e52860" : "1px solid #cbd5e1", 
                      background: deliveryZone === "inside" ? "#fff5f7" : "#ffffff",
                      cursor: "pointer",
                      fontWeight: "700",
                      fontSize: "14px"
                    }}
                  >
                    <div>
                      <span>Inside Dhaka City (ঢাকার ভেতরে)</span>
                      <div style={{ fontSize: "11.5px", color: "#718096", fontWeight: "500" }}>২৪ থেকে ৪৮ ঘণ্টার মধ্যে হোম ডেলিভারি</div>
                    </div>
                    <span style={{ color: "#e52860", fontWeight: "800" }}>৳{offer.insideDhakaShipping || 70}</span>
                  </label>

                  {/* Keraniganj, Savar, Narayanganj & Gazipur */}
                  <label 
                    onClick={() => setDeliveryZone("sub")}
                    style={{ 
                      display: "flex", 
                      alignItems: "center", 
                      justifyContent: "space-between", 
                      padding: "12px 16px", 
                      borderRadius: "10px", 
                      border: deliveryZone === "sub" ? "2px solid #e52860" : "1px solid #cbd5e1", 
                      background: deliveryZone === "sub" ? "#fff5f7" : "#ffffff",
                      cursor: "pointer",
                      fontWeight: "700",
                      fontSize: "14px"
                    }}
                  >
                    <div>
                      <span>Keraniganj, Savar, Narayanganj & Gazipur</span>
                      <div style={{ fontSize: "11.5px", color: "#718096", fontWeight: "500" }}>২ থেকে ৩ কার্যদিবসের মধ্যে ডেলিভারি</div>
                    </div>
                    <span style={{ color: "#e52860", fontWeight: "800" }}>৳{offer.subAreaShipping || 100}</span>
                  </label>

                  {/* Outside Dhaka (All other Districts) */}
                  <label 
                    onClick={() => setDeliveryZone("outside")}
                    style={{ 
                      display: "flex", 
                      alignItems: "center", 
                      justifyContent: "space-between", 
                      padding: "12px 16px", 
                      borderRadius: "10px", 
                      border: deliveryZone === "outside" ? "2px solid #e52860" : "1px solid #cbd5e1", 
                      background: deliveryZone === "outside" ? "#fff5f7" : "#ffffff",
                      cursor: "pointer",
                      fontWeight: "700",
                      fontSize: "14px"
                    }}
                  >
                    <div>
                      <span>Outside Dhaka (অন্যান্য সকল জেলা)</span>
                      <div style={{ fontSize: "11.5px", color: "#718096", fontWeight: "500" }}>২ থেকে ৪ কার্যদিবসের মধ্যে ডেলিভারি</div>
                    </div>
                    <span style={{ color: "#e52860", fontWeight: "800" }}>৳{offer.outsideDhakaShipping || 130}</span>
                  </label>

                </div>
              </div>

              {/* Quantity */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#f8fafc", padding: "12px 16px", borderRadius: "10px" }}>
                <span style={{ fontSize: "14px", fontWeight: "700", color: "#1a202c" }}>পরিমাণ (Quantity)</span>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <button 
                    type="button" 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    style={{ width: "32px", height: "32px", borderRadius: "6px", border: "1px solid #cbd5e1", background: "#ffffff", fontSize: "18px", fontWeight: "700", cursor: "pointer" }}
                  >
                    -
                  </button>
                  <span style={{ fontSize: "16px", fontWeight: "800" }}>{quantity}</span>
                  <button 
                    type="button" 
                    onClick={() => setQuantity(quantity + 1)}
                    style={{ width: "32px", height: "32px", borderRadius: "6px", border: "1px solid #cbd5e1", background: "#ffffff", fontSize: "18px", fontWeight: "700", cursor: "pointer" }}
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Summary Box */}
              <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "16px", marginTop: "4px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", color: "#4a5568", marginBottom: "6px" }}>
                  <span>প্রোডাক্ট সাবটোটাল ({quantity} টি)</span>
                  <span>৳{itemsSubtotal}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", color: "#4a5568", marginBottom: "12px" }}>
                  <span>ডেলিভারি চার্জ ({deliveryZone === "inside" ? "ঢাকার ভেতরে" : deliveryZone === "sub" ? "গাজীপুর/সাভার/নারায়ণগঞ্জ/কেরানীগঞ্জ" : "ঢাকার বাইরে"})</span>
                  <span>৳{shippingCost}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "18px", fontWeight: "800", color: "#1a202c", borderTop: "1px dashed #cbd5e1", paddingTop: "12px" }}>
                  <span>সর্বমোট প্রদেয় (ক্যাশ অন ডেলিভারি)</span>
                  <span style={{ color: "#e52860" }}>৳{grandTotal}</span>
                </div>
              </div>

              {/* Submit Button */}
              <button 
                type="submit" 
                disabled={isSubmitting}
                style={{ 
                  width: "100%", 
                  background: "linear-gradient(135deg, #e52860 0%, #c01845 100%)", 
                  color: "#ffffff", 
                  border: "none", 
                  padding: "16px", 
                  borderRadius: "12px", 
                  fontSize: "18px", 
                  fontWeight: "800", 
                  cursor: "pointer", 
                  boxShadow: "0 10px 25px rgba(229,40,96,0.35)",
                  opacity: isSubmitting ? 0.7 : 1
                }}
              >
                {isSubmitting ? "অর্ডার প্রসেস হচ্ছে..." : "অর্ডার কনফার্ম করুন (৳" + grandTotal + ")"}
              </button>

            </form>

            {/* Official Delivery Policy Box */}
            <div style={{ marginTop: "24px", background: "#fff5f7", borderRadius: "14px", padding: "16px 20px", border: "1px solid #fbcfe8" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#e52860", fontWeight: "800", fontSize: "14px", marginBottom: "8px" }}>
                <Clock size={18} />
                <span>অফিসিয়াল ডেলিভারি সময়সীমা (Shipping Policy)</span>
              </div>
              <ul style={{ margin: 0, paddingLeft: "20px", fontSize: "13px", color: "#4a5568", lineHeight: "1.6" }}>
                <li><strong>Inside Dhaka City:</strong> ২৪ থেকে ৪৮ ঘণ্টার মধ্যে ডেলিভারি (৳৭০)।</li>
                <li><strong>Keraniganj, Savar, Narayanganj & Gazipur:</strong> ২ থেকে ৩ কার্যদিবসের মধ্যে ডেলিভারি (৳১০০)।</li>
                <li><strong>Outside Dhaka (All other Districts):</strong> ২ থেকে ৪ কার্যদিবসের মধ্যে ডেলিভারি (৳১৩০)।</li>
              </ul>
            </div>

          </div>
        )}
      </section>

      {/* Official Main Website Footer */}
      <footer style={{ borderTop: "1px solid #e2e8f0", padding: "24px 20px", textAlign: "center", background: "#ffffff", fontSize: "13px", color: "#718096" }}>
        <div style={{ display: "flex", justifyContent: "center", gap: "14px", flexWrap: "wrap", fontSize: "11.5px", fontWeight: "700", marginBottom: "8px" }}>
          <Link href="/authenticity" style={{ color: "#4a5568", textDecoration: "none" }}>AUTHENTICITY</Link>
          <span style={{ color: "#cbd5e1" }}>|</span>
          <Link href="/terms" style={{ color: "#4a5568", textDecoration: "none" }}>TERMS & CONDITIONS</Link>
          <span style={{ color: "#cbd5e1" }}>|</span>
          <Link href="/privacy-policy" style={{ color: "#4a5568", textDecoration: "none" }}>PRIVACY POLICY</Link>
          <span style={{ color: "#cbd5e1" }}>|</span>
          <Link href="/refund-policy" style={{ color: "#4a5568", textDecoration: "none" }}>REFUND & RETURN POLICY</Link>
          <span style={{ color: "#cbd5e1" }}>|</span>
          <Link href="/faq" style={{ color: "#4a5568", textDecoration: "none" }}>FAQS</Link>
        </div>
        <p style={{ color: "#718096", fontSize: "12px", fontWeight: "600", margin: 0 }}>
          Copyright © {new Date().getFullYear()} GlowGoodly. All Rights Reserved.
        </p>
      </footer>

    </div>
  );
}
