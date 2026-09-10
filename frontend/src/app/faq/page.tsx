"use client";

import React, { useState } from "react";
import Link from "next/link";
import Header from "../../components/Header";
import PageBanner from "../../components/PageBanner";
import Footer from "../../components/Footer";
import MobileNavbar from "../../components/MobileNavbar";
import PolicyLayout from "../../components/PolicyLayout";

export default function FAQPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCat, setSelectedCat] = useState("ALL");
  const [activeIndex, setActiveIndex] = useState<number | null>(0);

  const categories = ["ALL", "ORDERS & PAYMENT", "DELIVERY", "AUTHENTICITY", "RETURNS"];

  const faqData = [
    {
      q: "Are the products sold at GlowGoodly 100% authentic?",
      a: "Yes, absolutely 100%! We strictly source our inventory from authorized international brand manufacturers and certified tier-1 distributors in South Korea, USA, UK, and Japan. Every product includes genuine manufacturer batch codes.",
      category: "AUTHENTICITY",
      badge: "Top Question",
    },
    {
      q: "What are your delivery charges across Bangladesh?",
      a: "Our delivery rates are: Inside Dhaka City ৳70 (24-48 hrs), Sub-Dhaka (Keraniganj, Savar, Narayanganj, Gazipur) ৳100 (2-3 days), and all 64 districts outside Dhaka ৳130 (2-4 days).",
      category: "DELIVERY",
      badge: "Shipping",
    },
    {
      q: "Do you provide Cash on Delivery (COD)?",
      a: "Yes! We offer nationwide Cash on Delivery across all 64 districts. You can also pay via bKash Merchant Direct Checkout (01609013011), Bangla QR, and Visa/Mastercard.",
      category: "ORDERS & PAYMENT",
      badge: "Payment",
    },
    {
      q: "How can I track my parcel status?",
      a: "Once you place an order, you receive an instant Order ID. You can check order progress anytime via our online Tracking page. Once dispatched, an active Steadfast/Pathao live tracking link is provided.",
      category: "DELIVERY",
      badge: "Tracking",
    },
    {
      q: "What is your return and refund policy?",
      a: "We provide an easy 7-day hassle-free replacement for any damaged, defective, or incorrect items. If any product is proven inauthentic, we provide an immediate 100% full money-back refund.",
      category: "RETURNS",
      badge: "Guarantee",
    },
    {
      q: "How does the GlowGoodly Loyalty Rewards Program work?",
      a: "Every registered customer automatically earns 5% of their total order value as reward points (1 Point = ৳1 discount). These points never expire and can be redeemed on your next checkout.",
      category: "ORDERS & PAYMENT",
      badge: "Rewards",
    },
    {
      q: "How do I choose the right shade for foundation or concealer?",
      a: "You can consult our expert beauty advisors via WhatsApp hotline at 01609013011. Send us a picture of your current foundation shade or skin tone under natural light for personalized recommendations.",
      category: "AUTHENTICITY",
      badge: "Consultation",
    },
  ];

  const filteredFaqs = faqData.filter((faq) => {
    const matchesCategory = selectedCat === "ALL" || faq.category === selectedCat;
    const matchesSearch =
      faq.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.a.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const toggleFAQ = (index: number) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <>
      <Header />
      <PageBanner title="FAQS" />
      <main className="container" style={{ padding: "40px 20px 70px 20px" }}>
        <PolicyLayout currentTab="FAQS">
          
          {/* Animated Hero Header */}
          <div
            style={{
              padding: "30px 28px",
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
              <span>💡</span>
              <span style={{ fontSize: "11.5px", fontWeight: "800", color: "#e52860", letterSpacing: "1px", textTransform: "uppercase" }}>
                HELP CENTER & FREQUENTLY ASKED QUESTIONS
              </span>
            </div>

            <h1 style={{ fontSize: "28px", fontWeight: "900", color: "#0e1e38", lineHeight: "1.3", marginBottom: "10px", fontFamily: "'Montserrat', sans-serif" }}>
              How Can We Help You Today? 🌸
            </h1>
            <p style={{ fontSize: "14px", color: "#64748b", margin: 0, lineHeight: "1.7", maxWidth: "680px" }}>
              Find instant answers regarding shipping rates, authenticity verification, order tracking, and refund processing.
            </p>

            {/* Interactive Live FAQ Search Input */}
            <div style={{ marginTop: "22px", maxWidth: "550px" }}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search questions (e.g., delivery charges, authentic, return)..."
                style={{
                  width: "100%",
                  padding: "13px 18px",
                  borderRadius: "25px",
                  border: "1.5px solid #e2e8f0",
                  fontSize: "13.5px",
                  outline: "none",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.04)",
                  boxSizing: "border-box",
                }}
              />
            </div>
          </div>

          {/* Animated Category Pills */}
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "26px" }}>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCat(cat)}
                className="glow-interactive-button"
                style={{
                  padding: "8px 16px",
                  borderRadius: "20px",
                  border: selectedCat === cat ? "none" : "1.5px solid #e2e8f0",
                  backgroundColor: selectedCat === cat ? "#e52860" : "#ffffff",
                  color: selectedCat === cat ? "#ffffff" : "#475569",
                  fontSize: "12px",
                  fontWeight: "800",
                  cursor: "pointer",
                  boxShadow: selectedCat === cat ? "0 4px 12px rgba(229,40,96,0.25)" : "none",
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Animated Accordion FAQs */}
          <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "40px" }}>
            {filteredFaqs.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 20px", backgroundColor: "#ffffff", borderRadius: "14px", border: "1px solid #f1f5f9" }}>
                <p style={{ fontSize: "14px", color: "#64748b" }}>No matching questions found for "{searchQuery}".</p>
                <button onClick={() => { setSearchQuery(""); setSelectedCat("ALL"); }} style={{ color: "#e52860", fontWeight: "800", background: "none", border: "none", cursor: "pointer", fontSize: "13px" }}>
                  Clear Search & Show All
                </button>
              </div>
            ) : (
              filteredFaqs.map((faq, idx) => {
                const isOpen = activeIndex === idx;
                return (
                  <div
                    key={idx}
                    className="glow-card-interactive"
                    style={{
                      backgroundColor: "#ffffff",
                      border: isOpen ? "1.5px solid #e52860" : "1.5px solid #f1f5f9",
                      borderRadius: "14px",
                      overflow: "hidden",
                      boxShadow: isOpen ? "0 8px 24px rgba(229,40,96,0.08)" : "0 2px 8px rgba(0,0,0,0.02)",
                    }}
                  >
                    <div
                      onClick={() => toggleFAQ(idx)}
                      style={{
                        padding: "18px 22px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        cursor: "pointer",
                        backgroundColor: isOpen ? "#fff0f5" : "#ffffff",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <span style={{ fontSize: "11px", fontWeight: "900", color: "#e52860", backgroundColor: "#ffffff", padding: "3px 8px", borderRadius: "6px", border: "1px solid #fce7f0" }}>
                          {faq.badge}
                        </span>
                        <h3 style={{ fontSize: "15px", fontWeight: "800", color: "#0e1e38", margin: 0 }}>
                          {faq.q}
                        </h3>
                      </div>
                      <span style={{ fontSize: "20px", fontWeight: "800", color: "#e52860", transition: "transform 0.3s ease", transform: isOpen ? "rotate(45deg)" : "rotate(0deg)" }}>
                        +
                      </span>
                    </div>

                    {isOpen && (
                      <div style={{ padding: "18px 22px", borderTop: "1px solid #fce7f0", backgroundColor: "#ffffff", animation: "fadeInUp 0.25s ease" }}>
                        <p style={{ fontSize: "14px", color: "#475569", lineHeight: "1.75", margin: 0 }}>
                          {faq.a}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Need More Assistance Banner */}
          <div
            style={{
              backgroundColor: "#f8fafc",
              border: "1.5px dashed #cbd5e1",
              borderRadius: "16px",
              padding: "26px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "28px", marginBottom: "6px" }}>💬</div>
            <h3 style={{ fontSize: "17px", fontWeight: "900", color: "#0e1e38", marginBottom: "6px" }}>
              Still Have Unanswered Questions?
            </h3>
            <p style={{ fontSize: "13.5px", color: "#64748b", maxWidth: "550px", margin: "0 auto 16px auto", lineHeight: "1.6" }}>
              Our beauty concierge is active Saturday to Thursday. Reach out on WhatsApp or call our support line.
            </p>
            <div style={{ display: "flex", justifyContent: "center", gap: "12px", flexWrap: "wrap" }}>
              <a
                href="https://wa.me/8801609013011"
                target="_blank"
                rel="noreferrer"
                className="glow-interactive-button"
                style={{
                  backgroundColor: "#25D366",
                  color: "#ffffff",
                  padding: "10px 20px",
                  borderRadius: "20px",
                  fontWeight: "800",
                  fontSize: "12.5px",
                  textDecoration: "none",
                }}
              >
                Chat on WhatsApp (01609013011) →
              </a>
              <Link
                href="/contact"
                className="glow-interactive-button"
                style={{
                  backgroundColor: "#0e1e38",
                  color: "#ffffff",
                  padding: "10px 20px",
                  borderRadius: "20px",
                  fontWeight: "800",
                  fontSize: "12.5px",
                  textDecoration: "none",
                }}
              >
                Contact Form →
              </Link>
            </div>
          </div>

        </PolicyLayout>
      </main>
      <Footer />
      <MobileNavbar />
    </>
  );
}
