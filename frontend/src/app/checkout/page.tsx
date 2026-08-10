"use client";

import React, { useState } from "react";
import Header from "../../components/Header";
import MobileNavbar from "../../components/MobileNavbar";
import Footer from "../../components/Footer";
import { useApp } from "../../context/AppContext";
import { trackInitiateCheckout } from "../../utils/pixel";
import Link from "next/link";
import { CreditCard, Truck, ShieldCheck, ArrowRight, Smartphone, AlertTriangle } from "lucide-react";

export default function CheckoutPage() {
  const {
    cart,
    clearCart,
    user,
    checkoutAddress,
    setCheckoutAddress,
    checkoutPhone,
    setCheckoutPhone,
    checkoutName,
    setCheckoutName,
  } = useApp();

  const [email, setEmail] = useState(user?.email || "");
  const [paymentMethod, setPaymentMethod] = useState("COD");

  const [couponCode, setCouponCode] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponMessage, setCouponMessage] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const cartSubtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

  const detectDeliveryZone = (address: string) => {
    const text = (address || "").toLowerCase().trim();
    if (!text) return { zone: "Inside Dhaka City", charge: 70, isSub: false, isOutside: false };

    const subKeywords = ["savar", "keraniganj", "gazipur", "narayanganj", "সাভার", "কেরানীগঞ্জ", "গাজীপুর", "নারায়ণগঞ্জ"];
    if (subKeywords.some(k => text.includes(k))) {
      return { zone: "Sub Area (Keraniganj, Savar, Gazipur, Narayanganj)", charge: 100, isSub: true, isOutside: false };
    }

    const dhakaKeywords = [
      "dhaka", "ঢাকা", "mirpur", "uttara", "dhanmondi", "gulshan", "banani", "mohammadpur", "badda",
      "motijheel", "jatrabari", "mohakhali", "khilgaon", "rampura", "tejgaon", "farmgate", "bashundhara",
      "lalbagh", "old dhaka", "puran dhaka", "malibagh", "moghbazar", "kakrail", "palton", "shahbagh",
      "azimpur", "cantonment", "nikunja", "agargaon", "shewrapara", "kazipara", "kallyanpur", "shyamoli",
      "gabtoli", "hazaribagh", "chawkbazar", "gandaria", "sutrapur", "wari", "demra", "kadamtali",
      "khilkhet", "bhatara", "baridhara", "tejturi", "niketon", "mircpur", "dhanmondy"
    ];

    if (dhakaKeywords.some(k => text.includes(k))) {
      return { zone: "Inside Dhaka City", charge: 70, isSub: false, isOutside: false };
    }

    const outsideKeywords = [
      "chittagong", "ctg", "sylhet", "rajshahi", "khulna", "barisal", "rangpur", "mymensingh", "comilla",
      "noakhali", "feni", "bogra", "pabna", "jessore", "cox's bazar", "coxsbazar", "tangail", "faridpur",
      "kushtia", "dinajpur", "jamalpur", "shariatpur", "madaripur", "gopalganj", "chandpur", "lakshmipur",
      "brahmanbaria", "kishoreganj", "netrokona", "sherpur", "munsiganj", "manikganj", "rajbari", "magura",
      "jhenaidah", "narail", "satkhira", "bagerhat", "chuadanga", "meherpur", "natore", "naogaon", "joypurhat",
      "chapainawabganj", "kurigram", "gaibandha", "lalmonirhat", "nilphamari", "panchagarh", "thakurgaon",
      "patuakhali", "bhola", "barguna", "jhalokati", "pirojpur", "habiganj", "moulvibazar", "sunamganj",
      "khagrachhari", "rangamati", "bandarban", "চট্টগ্রাম", "সিলেট", "রাজশাহী", "খুলনা", "বরিশাল", "রংপুর",
      "ময়মনসিংহ", "কুমিল্লা", "নোয়াখালী", "ফেনী", "বগুড়া", "পাবনা", "যশোর", "কক্সবাজার", "টাঙ্গাইল"
    ];

    if (outsideKeywords.some(k => text.includes(k))) {
      return { zone: "Outside Dhaka / All Districts", charge: 130, isSub: false, isOutside: true };
    }

    // Default to Inside Dhaka City (৳70) if not explicitly outside
    return { zone: "Inside Dhaka City", charge: 70, isSub: false, isOutside: false };
  };

  const detectedInfo = detectDeliveryZone(checkoutAddress);
  const deliveryCharge = detectedInfo.charge;
  const zone = detectedInfo.zone;
  const total = cartSubtotal + deliveryCharge - couponDiscount;

  // COD is enabled for all orders
  const isCodDisabled = false;

  React.useEffect(() => {
    if (cart.length > 0) {
      trackInitiateCheckout(cart, total);
    }
  }, []);

  const handleApplyCoupon = async () => {
    const code = couponCode.trim().toUpperCase();
    if (!code) return;
    try {
      if (code === "GLOW15") {
        setCouponDiscount(150);
        setCouponMessage("🎉 Promo code GLOW15 applied: Flat ৳150 discount!");
      } else if (code === "GLOW10") {
        const disc = Math.round(cartSubtotal * 0.10);
        setCouponDiscount(disc);
        setCouponMessage(`🎉 Marketing code GLOW10 applied: 10% Off (৳${disc} discount)!`);
      } else if (code === "FREESHIP699") {
        setCouponDiscount(deliveryCharge);
        setCouponMessage("🎉 Offer code FREESHIP699 applied: Free Delivery!");
      } else if (code.startsWith("POINTS") || code.startsWith("REWARD")) {
        let discAmount = 50;
        if (code.includes("500")) discAmount = 500;
        else if (code.includes("250")) discAmount = 250;
        else if (code.includes("100")) discAmount = 100;
        else if (code.includes("50")) discAmount = 50;
        setCouponDiscount(discAmount);
        setCouponMessage(`🎉 Loyalty Points Reward Coupon ${code} applied: ৳${discAmount} OFF your order!`);
      } else {
        // Fetch from backend coupons endpoint
        const res = await fetch(`http://localhost:5000/api/coupons/validate?code=${encodeURIComponent(code)}`);
        if (res.ok) {
          const data = await res.json();
          setCouponDiscount(data.discount || 0);
          setCouponMessage(`🎉 Coupon ${code} applied successfully!`);
        } else {
          setCouponMessage("❌ Invalid or expired coupon code.");
          setCouponDiscount(0);
        }
      }
    } catch (e) {
      setCouponMessage("Could not validate coupon.");
    }
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    if (!checkoutName || !checkoutPhone || !checkoutAddress) {
      setErrorMsg("Please fill in all delivery information.");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      // Create order in backend
      const payload = {
        customerId: user?.id || null,
        customerName: checkoutName,
        customerEmail: email || null,
        customerPhone: checkoutPhone,
        address: checkoutAddress,
        zone,
        paymentMethod: "Cash on Delivery (COD)",
        paymentPhone: checkoutPhone,
        paymentStatus: "Pending COD",
        items: cart.map((i) => ({ variantId: i.id, quantity: i.quantity })),
        couponCode: couponDiscount > 0 ? couponCode : null,
      };

      const res = await fetch("http://localhost:5000/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.order) {
        setErrorMsg(data.error || "Order failed to initialize. Please try again.");
        setLoading(false);
        return;
      }

      const createdOrderNumber = data.order.orderNumber;

      // Cash on Delivery (COD) -> Order complete!
      clearCart();
      window.location.href = `/thank-you?orderNumber=${createdOrderNumber}&total=${total}&paymentMethod=COD`;
    } catch (err: any) {
      setErrorMsg("Network error. Please try placing your order again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />

      <main className="container" style={{ padding: "40px 20px", maxWidth: "1200px", margin: "0 auto" }}>
        <h1 style={{ fontSize: "28px", fontWeight: "900", color: "#1e293b", marginBottom: "24px", borderBottom: "2px solid #f1f5f9", paddingBottom: "12px" }}>
          🛒 Secure Checkout
        </h1>

        {cart.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <h2 style={{ fontSize: "20px", fontWeight: "700", color: "#475569" }}>Your shopping cart is currently empty.</h2>
            <Link href="/shop" style={{ display: "inline-block", marginTop: "16px", padding: "12px 24px", backgroundColor: "#e63b7a", color: "#ffffff", borderRadius: "8px", fontWeight: "700", textDecoration: "none" }}>
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "30px" }}>
            {/* Form Section */}
            <form onSubmit={handlePlaceOrder} style={{ flex: "1 1 500px", display: "flex", flexDirection: "column", gap: "20px" }}>
              <div style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                <h2 style={{ fontSize: "18px", fontWeight: "800", color: "#0f172a", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <Truck size={20} color="#e63b7a" />
                  1. Delivery Details
                </h2>

                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  <div>
                    <label style={{ fontSize: "13px", fontWeight: "700", color: "#334155", display: "block", marginBottom: "4px" }}>Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Nusrat Jahan"
                      value={checkoutName}
                      onChange={(e) => setCheckoutName(e.target.value)}
                      style={{ width: "100%", padding: "11px", borderRadius: "8px", border: "1.5px solid #cbd5e1", fontSize: "14px", fontWeight: "600" }}
                    />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <div>
                      <label style={{ fontSize: "13px", fontWeight: "700", color: "#334155", display: "block", marginBottom: "4px" }}>Mobile Number *</label>
                      <input
                        type="tel"
                        required
                        placeholder="017XXXXXXXX"
                        value={checkoutPhone}
                        onChange={(e) => setCheckoutPhone(e.target.value)}
                        style={{ width: "100%", padding: "11px", borderRadius: "8px", border: "1.5px solid #cbd5e1", fontSize: "14px", fontWeight: "600" }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "13px", fontWeight: "700", color: "#334155", display: "block", marginBottom: "4px" }}>Email (Optional)</label>
                      <input
                        type="email"
                        placeholder="name@gmail.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        style={{ width: "100%", padding: "11px", borderRadius: "8px", border: "1.5px solid #cbd5e1", fontSize: "14px", fontWeight: "600" }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: "13px", fontWeight: "700", color: "#334155", display: "block", marginBottom: "4px" }}>Full Delivery Address *</label>
                    <textarea
                      required
                      rows={3}
                      placeholder="House No, Road No, Area, Thana, District..."
                      value={checkoutAddress}
                      onChange={(e) => setCheckoutAddress(e.target.value)}
                      style={{ width: "100%", padding: "11px", borderRadius: "8px", border: "1.5px solid #cbd5e1", fontSize: "14px", fontWeight: "600", resize: "vertical" }}
                    />
                    <div style={{ marginTop: "8px", padding: "10px 14px", backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "8px", fontSize: "13px", fontWeight: "700", color: "#166534", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span>🚚 Calculated Delivery Charge:</span>
                      <span style={{ fontSize: "14px", fontWeight: "900", color: "#e63b7a" }}>৳{deliveryCharge} ({zone})</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Method Selector */}
              <div style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                <h2 style={{ fontSize: "18px", fontWeight: "800", color: "#0f172a", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <CreditCard size={20} color="#e63b7a" />
                  2. Payment Method
                </h2>

                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  {/* Cash on Delivery Option */}
                  <div
                    style={{
                      padding: "16px",
                      borderRadius: "12px",
                      border: "2.5px solid #e63b7a",
                      backgroundColor: "#fff0f5",
                      display: "flex",
                      flexDirection: "column",
                      gap: "6px"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: "15px", fontWeight: "900", color: "#0f172a", display: "flex", alignItems: "center", gap: "6px" }}>
                        💵 Cash on Delivery (COD)
                      </span>
                      <span style={{ fontSize: "11px", backgroundColor: "#e63b7a", color: "#ffffff", padding: "2px 8px", borderRadius: "10px", fontWeight: "800" }}>ACTIVE</span>
                    </div>
                    <span style={{ fontSize: "12.5px", color: "#475569", fontWeight: "600" }}>
                      পণ্য হাতে পেয়ে নগদ মূল্য পরিশোধ করুন (Pay cash when your order arrives)
                    </span>
                  </div>
                </div>

                {errorMsg && (
                  <div style={{ color: "#dc2626", fontSize: "13px", fontWeight: "700", marginTop: "14px", padding: "10px", backgroundColor: "#fef2f2", borderRadius: "8px", border: "1px solid #fecaca" }}>
                    {errorMsg}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: "100%",
                    marginTop: "20px",
                    backgroundColor: paymentMethod === "bKash" ? "#e2136e" : "#e63b7a",
                    color: "#ffffff",
                    border: "none",
                    padding: "16px",
                    borderRadius: "10px",
                    fontWeight: "900",
                    fontSize: "16px",
                    cursor: loading ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    boxShadow: "0 4px 14px rgba(226,19,110,0.35)",
                    transition: "all 0.2s ease"
                  }}
                >
                  {loading ? (
                    "Processing..."
                  ) : paymentMethod === "bKash" ? (
                    <>
                      <span>PROCEED TO bKASH PAYMENT (BDT {total})</span>
                      <ArrowRight size={20} />
                    </>
                  ) : (
                    `PLACE ORDER (COD - BDT ${total})`
                  )}
                </button>
              </div>
            </form>

            {/* Order Summary & Coupon Section */}
            <aside style={{ flex: "1 1 340px", display: "flex", flexDirection: "column", gap: "20px" }}>
              <div style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                <h2 style={{ fontSize: "18px", fontWeight: "800", marginBottom: "15px", borderBottom: "1.5px solid #f1f5f9", paddingBottom: "10px" }}>
                  Order Summary
                </h2>

                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  {cart.map((item) => (
                    <div key={item.id} style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                      <div style={{ width: "48px", height: "48px", borderRadius: "8px", backgroundColor: "#f8fafc", overflow: "hidden", flexShrink: 0 }}>
                        <img src={item.image} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      </div>
                      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                        <span style={{ fontSize: "13px", fontWeight: "700", color: "#0f172a", display: "block", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap", maxWidth: "180px" }}>
                          {item.name}
                        </span>
                        <span style={{ fontSize: "11px", color: "#64748b", fontWeight: "500" }}>{item.variantName} x {item.quantity}</span>
                      </div>
                      <span style={{ fontSize: "14px", fontWeight: "700", color: "#e63b7a" }}>
                        BDT {item.price * item.quantity}
                      </span>
                    </div>
                  ))}

                  <hr style={{ border: "none", borderTop: "1.5px solid #f1f5f9", margin: "6px 0" }} />

                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", fontWeight: "600", color: "#475569" }}>
                    <span>Subtotal</span>
                    <span>BDT {cartSubtotal}</span>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", fontWeight: "600", color: "#475569" }}>
                    <span>Shipping Fee ({zone})</span>
                    <span>BDT {deliveryCharge}</span>
                  </div>

                  {couponDiscount > 0 && (
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", fontWeight: "700", color: "#16a34a" }}>
                      <span>Coupon Discount ({couponCode})</span>
                      <span>- BDT {couponDiscount}</span>
                    </div>
                  )}

                  <hr style={{ border: "none", borderTop: "1.5px solid #f1f5f9", margin: "6px 0" }} />

                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "18px", fontWeight: "900", color: "#e63b7a" }}>
                    <span>Total Amount</span>
                    <span>BDT {total}</span>
                  </div>
                </div>
              </div>

              {/* Coupon Code Card */}
              <div style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                <h3 style={{ fontSize: "14px", fontWeight: "800", color: "#0f172a", marginBottom: "10px" }}>
                  Have a Promo Coupon or Loyalty Points Code?
                </h3>
                <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
                  <input
                    type="text"
                    placeholder="e.g. POINTS50, POINTS100, GLOW15"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    style={{ flex: 1, padding: "9px 12px", border: "1.5px solid #cbd5e1", borderRadius: "8px", fontSize: "13px", fontWeight: "600" }}
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    style={{ backgroundColor: "#0f172a", color: "#ffffff", padding: "0 18px", fontWeight: "700", borderRadius: "8px", fontSize: "12px", cursor: "pointer" }}
                  >
                    APPLY
                  </button>
                </div>

                {/* Quick Points Reward Coupon Shortcuts */}
                <div style={{ backgroundColor: "#fff0f5", padding: "10px 12px", borderRadius: "8px", border: "1px dashed #fecdd3" }}>
                  <div style={{ fontSize: "11px", fontWeight: "800", color: "#be185d", marginBottom: "6px" }}>
                    🎁 Redeem Loyalty Points Coupon Shortcuts:
                  </div>
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    {[
                      { code: "POINTS50", text: "৳50 OFF" },
                      { code: "POINTS100", text: "৳100 OFF" },
                      { code: "POINTS250", text: "৳250 OFF" },
                      { code: "POINTS500", text: "৳500 OFF" }
                    ].map(btn => (
                      <button
                        key={btn.code}
                        type="button"
                        onClick={() => {
                          setCouponCode(btn.code);
                          let amt = 50;
                          if (btn.code === "POINTS100") amt = 100;
                          if (btn.code === "POINTS250") amt = 250;
                          if (btn.code === "POINTS500") amt = 500;
                          setCouponDiscount(amt);
                          setCouponMessage(`🎉 Loyalty Points Reward Coupon ${btn.code} applied: ৳${amt} OFF your order!`);
                        }}
                        style={{
                          backgroundColor: "#ffffff",
                          border: "1px solid #f472b6",
                          color: "#be185d",
                          padding: "3px 8px",
                          borderRadius: "4px",
                          fontSize: "11px",
                          fontWeight: "800",
                          cursor: "pointer"
                        }}
                      >
                        {btn.code} ({btn.text})
                      </button>
                    ))}
                  </div>
                </div>

                {couponMessage && (
                  <p style={{ fontSize: "12px", fontWeight: "700", color: "#e63b7a", marginTop: "8px" }}>
                    {couponMessage}
                  </p>
                )}
              </div>

              {/* Security Trust Badge */}
              <div style={{ backgroundColor: "#fdf2f8", border: "1px solid #fbcfe8", borderRadius: "12px", padding: "16px", display: "flex", alignItems: "center", gap: "12px" }}>
                <ShieldCheck size={28} color="#e2136e" style={{ flexShrink: 0 }} />
                <div style={{ fontSize: "12px", color: "#831843", fontWeight: "600", lineHeight: "1.4" }}>
                  100% Authentic Product Guarantee & Verified bKash Merchant Payment (01609013011).
                </div>
              </div>
            </aside>
          </div>
        )}
      </main>

      <Footer />
      <MobileNavbar />
    </>
  );
}
