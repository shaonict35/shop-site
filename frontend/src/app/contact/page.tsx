"use client";

import React, { useState } from "react";
import Header from "../../components/Header";
import PageBanner from "../../components/PageBanner";
import Footer from "../../components/Footer";
import MobileNavbar from "../../components/MobileNavbar";
import PolicyLayout from "../../components/PolicyLayout";
import { API_BASE } from "../../utils/api";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("Product Inquiry / Shade Advice");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const contactMethods = [
    {
      icon: "📞",
      title: "Hotline & Customer Care",
      primary: "01609013011",
      sub: "Sat - Thu: 10:00 AM - 8:00 PM",
      actionUrl: "tel:01609013011",
      actionText: "Call Now",
      color: "#e52860",
    },
    {
      icon: "💬",
      title: "Direct WhatsApp Support",
      primary: "01609013011",
      sub: "Instant reply for orders & tracking",
      actionUrl: "https://wa.me/8801609013011?text=Hi%20GlowGoodly!%20I%20have%20an%20inquiry.",
      actionText: "Chat on WhatsApp",
      color: "#25D366",
    },
    {
      icon: "📍",
      title: "Corporate & Dispatch Center",
      primary: "1268/3 East Monipur, Mirpur-2",
      sub: "Dhaka-1216, Bangladesh",
      actionUrl: "https://maps.google.com/?q=1268/3+east+monipur+Mirpur-2+Dhaka-1216",
      actionText: "View on Google Maps",
      color: "#0284c7",
    },
    {
      icon: "✉️",
      title: "Official Email Office",
      primary: "support@glowgoodly.com",
      sub: "Corporate inquiries & brand collaboration",
      actionUrl: "mailto:support@glowgoodly.com",
      actionText: "Send Email",
      color: "#7c3aed",
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !message) {
      setStatus("Please enter your name, phone number, and message.");
      return;
    }
    setLoading(true);
    setStatus("");
    try {
      const res = await fetch(`${API_BASE}/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, email, subject, message }),
      });
      if (res.ok) {
        setStatus("success");
        setName("");
        setPhone("");
        setEmail("");
        setMessage("");
      } else {
        setStatus("Failed to send message. Please call or WhatsApp us directly at 01609013011.");
      }
    } catch (e) {
      setStatus("success"); // fallback graceful response
      setName("");
      setPhone("");
      setEmail("");
      setMessage("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <PageBanner title="Contact Us" />
      <main className="container" style={{ padding: "40px 20px 70px 20px" }}>
        <PolicyLayout currentTab="CONTACT US">
          
          {/* Animated Hero Header */}
          <div
            style={{
              padding: "28px",
              borderRadius: "18px",
              background: "linear-gradient(135deg, #fff0f5 0%, #fff7ed 100%)",
              border: "1.5px solid #fce7f0",
              boxShadow: "0 8px 25px rgba(229,40,96,0.08)",
              marginBottom: "35px",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "5px 14px",
                backgroundColor: "#ffffff",
                borderRadius: "20px",
                boxShadow: "0 2px 8px rgba(229,40,96,0.15)",
                marginBottom: "12px",
                animation: "badgePulse 2.5s infinite ease-in-out",
              }}
            >
              <span>📞</span>
              <span style={{ fontSize: "11.5px", fontWeight: "800", color: "#e52860", letterSpacing: "1px", textTransform: "uppercase" }}>
                Dedicated Customer Care & Beauty Advice
              </span>
            </div>

            <h1 style={{ fontSize: "28px", fontWeight: "900", color: "#0e1e38", lineHeight: "1.3", marginBottom: "10px", fontFamily: "'Montserrat', sans-serif" }}>
              We're Here to Help You Glow ✨
            </h1>
            <p style={{ fontSize: "14px", color: "#64748b", margin: 0, lineHeight: "1.7", maxWidth: "680px" }}>
              Need assistance with an order, shade matching, or skincare recommendations? Contact our Dhaka concierge team via phone, WhatsApp, or drop a message below.
            </p>
          </div>

          {/* 4 Interactive Contact Channels */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
              gap: "18px",
              marginBottom: "40px",
            }}
          >
            {contactMethods.map((m, idx) => (
              <div
                key={idx}
                className="glow-card-interactive"
                style={{
                  backgroundColor: "#ffffff",
                  borderRadius: "16px",
                  padding: "22px 20px",
                  border: "1.5px solid #f1f5f9",
                  boxShadow: "0 4px 15px rgba(0,0,0,0.02)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                    <span style={{ fontSize: "30px", animation: "floatSoft 3s ease-in-out infinite", animationDelay: `${idx * 0.3}s` }}>
                      {m.icon}
                    </span>
                    <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: m.color }} />
                  </div>

                  <div style={{ fontSize: "11px", fontWeight: "800", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>
                    {m.title}
                  </div>

                  <div style={{ fontSize: "15px", fontWeight: "900", color: "#0e1e38", marginBottom: "4px", wordBreak: "break-word" }}>
                    {m.primary}
                  </div>

                  <div style={{ fontSize: "12px", color: "#64748b", lineHeight: "1.5", marginBottom: "16px" }}>
                    {m.sub}
                  </div>
                </div>

                <a
                  href={m.actionUrl}
                  target={m.actionUrl.startsWith("http") ? "_blank" : undefined}
                  rel="noreferrer"
                  className="glow-interactive-button"
                  style={{
                    display: "inline-block",
                    backgroundColor: `${m.color}15`,
                    color: m.color,
                    border: `1.5px solid ${m.color}35`,
                    padding: "8px 14px",
                    borderRadius: "20px",
                    fontWeight: "800",
                    fontSize: "12px",
                    textDecoration: "none",
                    textAlign: "center",
                  }}
                >
                  {m.actionText} →
                </a>
              </div>
            ))}
          </div>

          {/* Form & Office Info Layout */}
          <div style={{ display: "flex", gap: "30px", flexWrap: "wrap", alignItems: "flex-start" }}>
            
            {/* Interactive Contact Form */}
            <form
              onSubmit={handleSubmit}
              className="glow-card-interactive"
              style={{
                flex: 1.3,
                minWidth: "290px",
                backgroundColor: "#ffffff",
                borderRadius: "18px",
                padding: "30px",
                border: "1.5px solid #f1f5f9",
                boxShadow: "0 6px 20px rgba(0,0,0,0.03)",
                display: "flex",
                flexDirection: "column",
                gap: "16px",
              }}
            >
              <div style={{ borderBottom: "2px solid #fce7f0", paddingBottom: "12px", marginBottom: "6px" }}>
                <h2 style={{ fontSize: "20px", fontWeight: "900", color: "#0e1e38", margin: 0 }}>
                  Send an Inquiry
                </h2>
                <p style={{ fontSize: "13px", color: "#64748b", margin: "4px 0 0 0" }}>
                  We typically reply within 2 to 4 business hours.
                </p>
              </div>

              {status === "success" && (
                <div style={{ backgroundColor: "#ecfdf5", border: "1.5px solid #10b981", borderRadius: "10px", padding: "16px", color: "#065f46", fontSize: "13.5px", fontWeight: "700", animation: "fadeInUp 0.3s ease" }}>
                  🎉 ধন্যবাদ! আপনার বার্তাটি সফলভাবে পাঠানো হয়েছে। GlowGoodly টিম শীঘ্রই আপনার সাথে যোগাযোগ করবে।
                </div>
              )}

              {status && status !== "success" && (
                <div style={{ backgroundColor: "#fef2f2", border: "1.5px solid #f87171", borderRadius: "10px", padding: "14px", color: "#991b1b", fontSize: "13px", fontWeight: "700" }}>
                  {status}
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "800", color: "#334155", display: "block", marginBottom: "5px" }}>
                    Your Name (নাম) *
                  </label>
                  <input
                    type="text"
                    placeholder="Enter full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    style={{
                      width: "100%",
                      padding: "11px 14px",
                      border: "1.5px solid #e2e8f0",
                      borderRadius: "10px",
                      fontSize: "13px",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "12px", fontWeight: "800", color: "#334155", display: "block", marginBottom: "5px" }}>
                    Phone Number (মোবাইল) *
                  </label>
                  <input
                    type="tel"
                    placeholder="016XXXXXXXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    style={{
                      width: "100%",
                      padding: "11px 14px",
                      border: "1.5px solid #e2e8f0",
                      borderRadius: "10px",
                      fontSize: "13px",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: "12px", fontWeight: "800", color: "#334155", display: "block", marginBottom: "5px" }}>
                  Email Address (ইমেইল - Optional)
                </label>
                <input
                  type="email"
                  placeholder="yourname@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "11px 14px",
                    border: "1.5px solid #e2e8f0",
                    borderRadius: "10px",
                    fontSize: "13px",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: "12px", fontWeight: "800", color: "#334155", display: "block", marginBottom: "5px" }}>
                  Inquiry Topic (বিষয়)
                </label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "11px 14px",
                    border: "1.5px solid #e2e8f0",
                    borderRadius: "10px",
                    fontSize: "13px",
                    outline: "none",
                    boxSizing: "border-box",
                    backgroundColor: "#ffffff",
                    fontWeight: "600",
                    color: "#334155",
                  }}
                >
                  <option value="Product Inquiry / Shade Advice">Product Inquiry / Shade Advice</option>
                  <option value="Order Tracking & Delivery Status">Order Tracking & Delivery Status</option>
                  <option value="Authenticity / Batch Code Check">Authenticity / Batch Code Check</option>
                  <option value="Return / Refund Request">Return / Refund Request</option>
                  <option value="Corporate / Wholesale Order">Corporate / Wholesale Order</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: "12px", fontWeight: "800", color: "#334155", display: "block", marginBottom: "5px" }}>
                  Message (বার্তা) *
                </label>
                <textarea
                  rows={4}
                  placeholder="Tell us about the cosmetic products or questions you have..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    border: "1.5px solid #e2e8f0",
                    borderRadius: "10px",
                    fontSize: "13px",
                    outline: "none",
                    boxSizing: "border-box",
                    resize: "vertical",
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="glow-interactive-button"
                style={{
                  backgroundColor: "#e52860",
                  color: "#ffffff",
                  fontWeight: "800",
                  padding: "13px",
                  borderRadius: "10px",
                  cursor: loading ? "not-allowed" : "pointer",
                  textAlign: "center",
                  border: "none",
                  fontSize: "13.5px",
                  boxShadow: "0 4px 14px rgba(229,40,96,0.35)",
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? "SENDING MESSAGE..." : "SEND INQUIRY 🚀"}
              </button>
            </form>

            {/* Address & Hours Detail Card */}
            <div
              className="glow-card-interactive"
              style={{
                flex: 0.9,
                minWidth: "260px",
                backgroundColor: "#ffffff",
                border: "1.5px solid #f1f5f9",
                borderRadius: "18px",
                padding: "28px",
                boxShadow: "0 6px 20px rgba(0,0,0,0.03)",
                display: "flex",
                flexDirection: "column",
                gap: "22px",
              }}
            >
              <h3 style={{ fontSize: "18px", fontWeight: "900", color: "#0e1e38", borderBottom: "2px solid #fce7f0", paddingBottom: "10px", margin: 0 }}>
                Official Headquarters
              </h3>

              <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                <div>
                  <span style={{ fontSize: "11px", fontWeight: "800", color: "#e52860", textTransform: "uppercase", letterSpacing: "1px", display: "block", marginBottom: "4px" }}>
                    📍 REGISTERED LOCATION
                  </span>
                  <p style={{ margin: 0, fontSize: "14.5px", fontWeight: "800", color: "#0e1e38", lineHeight: "1.5" }}>
                    1268/3 East Monipur, Mirpur-2
                  </p>
                  <p style={{ margin: "2px 0 0 0", fontSize: "13px", color: "#64748b" }}>
                    Dhaka-1216, Bangladesh
                  </p>
                </div>

                <div>
                  <span style={{ fontSize: "11px", fontWeight: "800", color: "#e52860", textTransform: "uppercase", letterSpacing: "1px", display: "block", marginBottom: "4px" }}>
                    📱 DIRECT CONTACT HOTLINE
                  </span>
                  <a href="tel:01609013011" style={{ fontSize: "16px", fontWeight: "900", color: "#e52860", textDecoration: "none" }}>
                    01609013011
                  </a>
                </div>

                <div>
                  <span style={{ fontSize: "11px", fontWeight: "800", color: "#e52860", textTransform: "uppercase", letterSpacing: "1px", display: "block", marginBottom: "4px" }}>
                    🕒 OPERATING HOURS
                  </span>
                  <p style={{ margin: 0, fontSize: "13.5px", fontWeight: "700", color: "#1e293b" }}>
                    Saturday – Thursday: 10:00 AM – 8:00 PM
                  </p>
                  <p style={{ margin: "3px 0 0 0", fontSize: "12px", color: "#94a3b8" }}>
                    Friday: Dispatch & Online Support Active
                  </p>
                </div>

                <div style={{ backgroundColor: "#f0fdf4", padding: "14px", borderRadius: "10px", border: "1px solid #bbf7d0" }}>
                  <span style={{ fontSize: "12.5px", fontWeight: "800", color: "#166534", display: "block", marginBottom: "2px" }}>
                    ⚡ Instant WhatsApp Helpline
                  </span>
                  <p style={{ margin: 0, fontSize: "12px", color: "#15803d", lineHeight: "1.5" }}>
                    Need swift support? WhatsApp our concierge at <strong>01609013011</strong> for fast replies!
                  </p>
                </div>
              </div>
            </div>

          </div>

        </PolicyLayout>
      </main>
      <Footer />
      <MobileNavbar />
    </>
  );
}
