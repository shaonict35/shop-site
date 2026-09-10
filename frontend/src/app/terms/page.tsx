"use client";

import React from "react";
import Header from "../../components/Header";
import PageBanner from "../../components/PageBanner";
import Footer from "../../components/Footer";
import MobileNavbar from "../../components/MobileNavbar";
import PolicyLayout from "../../components/PolicyLayout";

export default function TermsPage() {
  const sections = [
    {
      num: "01",
      title: "Use of Website & Account Registration",
      desc: "By browsing or purchasing from GlowGoodly (glowgoodly.com and shop.glowgoodly.com), you confirm you are at least 13 years old and will use the platform only for lawful personal purposes. You are responsible for keeping your account credentials confidential.",
    },
    {
      num: "02",
      title: "Skincare Products & Allergy Disclaimer",
      desc: "All products sold on GlowGoodly are 100% genuine and sourced from authorized manufacturers. However, skin reactions can vary by individual skin sensitivity. Customers must read all listed ingredients prior to use and perform a 24-hour patch test.",
    },
    {
      num: "03",
      title: "Orders, Pricing & Currency",
      desc: "All prices on GlowGoodly are listed in Bangladeshi Taka (BDT) inclusive of relevant duties. We reserve the right to correct any accidental typographical errors in pricing. Orders are confirmed upon verification via SMS or phone call.",
    },
    {
      num: "04",
      title: "Payment Methods & Security",
      desc: "We accept Cash on Delivery (COD), bKash Merchant Direct Checkout (01609013011), Bangla QR, and encrypted Visa/Mastercard transactions. All digital payments are handled through PCI-DSS compliant secure gateways.",
    },
    {
      num: "05",
      title: "Intellectual Property Rights",
      desc: "All GlowGoodly logos, site graphics, custom UI code, and marketing content are the exclusive intellectual property of GlowGoodly. Unauthorized scraping, duplication, or reproduction is strictly prohibited.",
    },
  ];

  return (
    <>
      <Header />
      <PageBanner title="Terms & Conditions" />
      <main className="container" style={{ padding: "40px 20px 70px 20px" }}>
        <PolicyLayout currentTab="TERMS & CONDITIONS">
          
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
              <span>📜</span>
              <span style={{ fontSize: "11.5px", fontWeight: "800", color: "#e52860", letterSpacing: "1px", textTransform: "uppercase" }}>
                USER AGREEMENT & SERVICE POLICIES
              </span>
            </div>

            <h1 style={{ fontSize: "28px", fontWeight: "900", color: "#0e1e38", lineHeight: "1.3", marginBottom: "10px", fontFamily: "'Montserrat', sans-serif" }}>
              Terms of Service & Usage Guidelines ⚖️
            </h1>
            <p style={{ fontSize: "14px", color: "#64748b", margin: 0, lineHeight: "1.7", maxWidth: "680px" }}>
              Welcome to <strong>GlowGoodly</strong>. Please review these terms of service which govern your shopping experience and use of our digital platforms.
            </p>
          </div>

          {/* Patch Test Advisory Callout */}
          <div
            className="glow-card-interactive"
            style={{
              backgroundColor: "#fff0f5",
              border: "1.5px solid #fce7f0",
              borderRadius: "14px",
              padding: "20px 24px",
              display: "flex",
              alignItems: "center",
              gap: "16px",
              marginBottom: "35px",
            }}
          >
            <span style={{ fontSize: "32px", animation: "floatSoft 2.5s infinite ease-in-out" }}>🌿</span>
            <div>
              <div style={{ fontSize: "13.5px", fontWeight: "900", color: "#e52860", marginBottom: "3px" }}>
                Important Dermatological Reminder
              </div>
              <p style={{ fontSize: "13px", color: "#64748b", margin: 0, lineHeight: "1.6" }}>
                Always perform a 24-hour patch test behind your ear or inside your wrist before applying new active skincare ingredients (AHA/BHA, Retinoids, Vitamin C).
              </p>
            </div>
          </div>

          {/* Key Clauses (Animated Floating Cards) */}
          <div style={{ display: "flex", flexDirection: "column", gap: "18px", marginBottom: "40px" }}>
            {sections.map((s, idx) => (
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
                <div
                  style={{
                    backgroundColor: "#fff0f4",
                    color: "#e52860",
                    fontWeight: "900",
                    fontSize: "13px",
                    padding: "6px 12px",
                    borderRadius: "8px",
                    minWidth: "36px",
                    textAlign: "center",
                  }}
                >
                  {s.num}
                </div>
                <div>
                  <h3 style={{ fontSize: "16px", fontWeight: "800", color: "#0e1e38", marginBottom: "6px" }}>
                    {s.title}
                  </h3>
                  <p style={{ fontSize: "13.5px", color: "#64748b", lineHeight: "1.7", margin: 0 }}>
                    {s.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Support Banner */}
          <div
            style={{
              backgroundColor: "#f8fafc",
              border: "1.5px dashed #cbd5e1",
              borderRadius: "14px",
              padding: "22px",
              textAlign: "center",
            }}
          >
            <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>
              Questions regarding these terms? Contact our legal & compliance desk at <strong>support@glowgoodly.com</strong> or call <strong>01609013011</strong>.
            </p>
          </div>

        </PolicyLayout>
      </main>
      <Footer />
      <MobileNavbar />
    </>
  );
}
