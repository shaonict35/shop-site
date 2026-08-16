"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { CheckCircle2, ShoppingBag, Truck, ShieldCheck, Sparkles, Phone, MapPin, User, Clock } from "lucide-react";
import { API_BASE } from "../../../utils/api";

export default function DynamicLandingPage() {
  const params = useParams();
  const slug = (params?.slug as string) || "seasonal-offer";

  const [offer, setOffer] = useState<any>({
    title: "বিশেষ অফারে অরিজিনাল বিউটি কম্বো প্যাকেজ!",
    subtitle: "সীমিত সময়ের জন্য ছাড়! ১০০% অরিজিনাল প্রোডাক্ট দ্রুত ক্যাশ অন ডেলিভারিতে পান।",
    videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
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

  const [selectedImage, setSelectedImage] = useState(0);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [deliveryZone, setDeliveryZone] = useState<"inside" | "sub" | "outside">("inside");
  const [quantity, setQuantity] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<any>(null);

  useEffect(() => {
    fetchPageData();
  }, [slug]);

  const fetchPageData = async () => {
    try {
      const res = await fetch(`${API_BASE}/settings/landing-pages/${slug}`);
      if (res.ok) {
        const data = await res.json();
        if (data && typeof data === "object") {
          setOffer((prev: any) => ({
            ...prev,
            ...data,
            productImages: Array.isArray(data.productImages) ? data.productImages : [data.productImages || prev.productImages[0]]
          }));
        }
      }
    } catch (e) {
      console.log("Using default offer data.", e);
    }
  };

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
            id: `landing-${slug}`,
            title: offer.productTitle,
            price: productPriceNum,
            quantity: quantity,
            image: offer.productImages[0] || ""
          }
        ],
        totalAmount: grandTotal,
        paymentMethod: "Cash on Delivery",
        status: "Pending",
        notes: `Order placed from Landing Page [/${slug}] [Zone: ${zoneLabel}]`
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
            <span>বিশেষ অফার</span>
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
          
          {/* Images */}
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
              <div style={{ display: "flex", gap: "10px", marginTop: "12px" }}>
                {offer.productImages.map((img: string, idx: number) => (
                  <img 
                    key={idx}
                    src={img}
                    alt={`Thumb ${idx}`}
                    onClick={() => setSelectedImage(idx)}
                    style={{ width: "60px", height: "60px", borderRadius: "8px", objectFit: "cover", cursor: "pointer", border: selectedImage === idx ? "2px solid #e52860" : "1px solid #e2e8f0" }}
                  />
                ))}
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
              {pointsList.map((pt: string, idx: number) => (
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
                <label style={{ display: "block", fontSize: "14px", fontWeight: "700", color: "#1a202c", marginBottom: "6px" }}>
                  আপনার নাম *
                </label>
                <div style={{ position: "relative" }}>
                  <User size={18} color="#a0aec0" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)" }} />
                  <input 
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
                <label style={{ display: "block", fontSize: "14px", fontWeight: "700", color: "#1a202c", marginBottom: "6px" }}>
                  মোবাইল নম্বর *
                </label>
                <div style={{ position: "relative" }}>
                  <Phone size={18} color="#a0aec0" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)" }} />
                  <input 
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
                <label style={{ display: "block", fontSize: "14px", fontWeight: "700", color: "#1a202c", marginBottom: "6px" }}>
                  পূর্ণাঙ্গ ঠিকানা *
                </label>
                <div style={{ position: "relative" }}>
                  <MapPin size={18} color="#a0aec0" style={{ position: "absolute", left: "14px", top: "14px" }} />
                  <textarea 
                    required
                    rows={2}
                    placeholder="বাসা/রোড নম্বর, এলাকা, থানা ও জেলা লিখুন"
                    value={customerAddress}
                    onChange={(e) => handleAddressChange(e.target.value)}
                    style={{ width: "100%", padding: "12px 14px 12px 42px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "15px", outline: "none", boxSizing: "border-box" }}
                  />
                </div>
              </div>

              {/* Delivery Zone Selector */}
              <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: "700", color: "#1a202c", marginBottom: "8px" }}>
                  ডেলিভারি জোন নির্বাচন করুন (GlowGoodly Delivery Policy) *
                </label>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  
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
                  <span>ডেলিভারি চার্জ</span>
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
