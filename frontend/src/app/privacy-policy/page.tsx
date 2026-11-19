"use client";

import React from "react";
import Header from "../../components/Header";
import PageBanner from "../../components/PageBanner";
import Footer from "../../components/Footer";
import MobileNavbar from "../../components/MobileNavbar";
import PolicyLayout from "../../components/PolicyLayout";

export default function PrivacyPolicyPage() {
  const points = [
    {
      num: "01",
      icon: "📋",
      title: "Information We Collect",
      desc: "We collect only necessary information required to process and deliver your beauty orders: full name, phone number, shipping address, and email for dispatch tracking. We never store debit/credit card CVV or PIN numbers.",
    },
    {
      num: "02",
      icon: "🔐",
      title: "How We Protect Your Data",
      desc: "Our platform operates with high-grade 256-bit SSL encryption. All payment transactions via bKash, Bangla QR, or cards are processed in PCI-DSS Level-1 certified secure financial gateways.",
    },
    {
      num: "03",
      icon: "🚫",
      title: "Zero Third-Party Data Selling",
      desc: "We have an absolute strict policy: we never sell, rent, or lease your personal contact details, mobile numbers, or browsing habits to advertisers or third-party marketing firms.",
    },
    {
      num: "04",
      icon: "🍪",
      title: "Cookies & Session Experience",
      desc: "We use essential cookies to remember items in your shopping bag, preserve your wishlist, and ensure your authentication stays secure when navigating our website.",
    },
    {
      num: "05",
      icon: "👤",
      title: "Your Data Control Rights",
      desc: "You have complete control over your personal data. You can request a copy of your stored order records or ask to delete your account by contacting our privacy compliance desk.",
    },
  ];

  return (
    <>
      <Header />
      <PageBanner title="Privacy Policy" />
      <main className="container" style={{ padding: "40px 20px 70px 20px" }}>
        <PolicyLayout currentTab="PRIVACY POLICY">
          
          {/* Animated Hero Banner */}
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
                position: "absolute",
                top: "-40px",
                right: "-30px",
                width: "160px",
                height: "160px",
                borderRadius: "50%",
                background: "radial-gradient(circle, rgba(229,40,96,0.2) 0%, rgba(229,40,96,0) 70%)",
                animation: "pulseGlow 3s infinite ease-in-out",
                pointerEvents: "none",
              }}
            />

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
              <span>🔒</span>
              <span style={{ fontSize: "11.5px", fontWeight: "800", color: "#e52860", letterSpacing: "1px", textTransform: "uppercase" }}>
                BANK-GRADE DATA ENCRYPTION & PRIVACY
              </span>
            </div>

            <h1 style={{ fontSize: "28px", fontWeight: "900", color: "#0e1e38", lineHeight: "1.3", marginBottom: "10px", fontFamily: "'Montserrat', sans-serif" }}>
              Your Privacy Is Sacred to Us 🛡️
            </h1>
            <p style={{ fontSize: "14px", color: "#64748b", margin: 0, lineHeight: "1.7", maxWidth: "680px" }}>
              At <strong>GlowGoodly</strong>, we respect your personal information and safeguard your customer profile with the utmost care and security.
            </p>
          </div>

          {/* Privacy Principles (Animated Cards) */}
          <div style={{ display: "flex", flexDirection: "column", gap: "18px", marginBottom: "40px" }}>
            {points.map((p, idx) => (
              <div
                key={idx}
                className="glow-card-interactive"
                style={{
                  backgroundColor: "#ffffff",
                  borderRadius: "16px",
                  padding: "24px",
                  border: "1.5px solid #f1f5f9",
                  boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "20px",
                }}
              >
                <span style={{ fontSize: "32px", animation: "floatSoft 3s ease-in-out infinite", animationDelay: `${idx * 0.3}s` }}>
                  {p.icon}
                </span>

                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                    <span style={{ fontSize: "11px", fontWeight: "900", color: "#e52860", backgroundColor: "#fff0f4", padding: "2px 8px", borderRadius: "4px" }}>
                      CLAUSE {p.num}
                    </span>
                    <h3 style={{ fontSize: "16px", fontWeight: "800", color: "#0e1e38", margin: 0 }}>
                      {p.title}
                    </h3>
                  </div>
                  <p style={{ fontSize: "13.5px", color: "#64748b", lineHeight: "1.7", margin: 0 }}>
                    {p.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Privacy Officer Contact */}
          <div
            style={{
              backgroundColor: "#f8fafc",
              border: "1.5px dashed #cbd5e1",
              borderRadius: "14px",
              padding: "24px",
              textAlign: "center",
            }}
          >
            <h4 style={{ fontSize: "16px", fontWeight: "800", color: "#0e1e38", marginBottom: "6px" }}>
              Data Protection & Privacy Officer
            </h4>
            <p style={{ fontSize: "13px", color: "#64748b", margin: 0, lineHeight: "1.6" }}>
              To update your details, request account removal, or ask questions about how we handle your data, contact our security officer at: <strong style={{ color: "#e52860" }}>support@glowgoodly.com</strong> or call <strong style={{ color: "#e52860" }}>01609013011</strong>.
            </p>
          </div>

        </PolicyLayout>
      </main>
      <Footer />
      <MobileNavbar />
    </>
  );
}
