"use client";

import React from "react";
import Link from "next/link";
import Header from "../../components/Header";
import PageBanner from "../../components/PageBanner";
import Footer from "../../components/Footer";
import MobileNavbar from "../../components/MobileNavbar";
import PolicyLayout from "../../components/PolicyLayout";

export default function RefundPage() {
  const steps = [
    {
      num: "01",
      icon: "📸",
      title: "Report Issue with Photo/Video",
      desc: "Contact our customer care at 01609013011 or email support@glowgoodly.com within 3-7 days of delivery with an unboxing video or photo of the damaged/incorrect product.",
    },
    {
      num: "02",
      icon: "🚚",
      title: "Hassle-Free Return Pickup",
      desc: "Our courier partner will collect the returned item from your address, or you can drop it at our designated Dhaka fulfillment hub. Return delivery cost is covered by us.",
    },
    {
      num: "03",
      icon: "💳",
      title: "Instant Replacement or Refund",
      desc: "Choose between an immediate replacement delivery or a 100% full refund sent directly to your bKash wallet or bank account within 3-5 working days.",
    },
  ];

  return (
    <>
      <Header />
      <PageBanner title="Refund & Return Policy" />
      <main className="container" style={{ padding: "40px 20px 70px 20px" }}>
        <PolicyLayout currentTab="REFUND & RETURN POLICY">
          
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
              <span>🔄</span>
              <span style={{ fontSize: "11.5px", fontWeight: "800", color: "#e52860", letterSpacing: "1px", textTransform: "uppercase" }}>
                CUSTOMER SATISFACTION GUARANTEE
              </span>
            </div>

            <h1 style={{ fontSize: "28px", fontWeight: "900", color: "#0e1e38", lineHeight: "1.3", marginBottom: "10px", fontFamily: "'Montserrat', sans-serif" }}>
              7-Day Easy Return & Instant Refund Policy 🛡️
            </h1>
            <p style={{ fontSize: "14px", color: "#64748b", margin: 0, lineHeight: "1.7", maxWidth: "680px" }}>
              At <strong>GlowGoodly</strong>, your confidence and satisfaction are paramount. We ensure clear, transparent, and fair return solutions for every cosmetic purchase.
            </p>
          </div>

          {/* 3 Step Return Process (Animated Floating Cards) */}
          <div style={{ marginBottom: "45px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
              <span style={{ width: "4px", height: "22px", backgroundColor: "#e52860", borderRadius: "2px", display: "inline-block" }} />
              <h2 style={{ fontSize: "20px", fontWeight: "900", color: "#0e1e38", margin: 0 }}>
                Simple 3-Step Return Process
              </h2>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "18px" }}>
              {steps.map((s, idx) => (
                <div
                  key={idx}
                  className="glow-card-interactive"
                  style={{
                    backgroundColor: "#ffffff",
                    borderRadius: "16px",
                    padding: "24px",
                    border: "1.5px solid #f1f5f9",
                    boxShadow: "0 4px 15px rgba(0,0,0,0.02)",
                    position: "relative",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                    <span style={{ fontSize: "32px", animation: "floatSoft 3s ease-in-out infinite", animationDelay: `${idx * 0.3}s` }}>
                      {s.icon}
                    </span>
                    <span style={{ fontSize: "11px", fontWeight: "900", color: "#e52860", backgroundColor: "#fff0f4", padding: "3px 10px", borderRadius: "20px" }}>
                      STEP {s.num}
                    </span>
                  </div>

                  <h3 style={{ fontSize: "16px", fontWeight: "900", color: "#0e1e38", marginBottom: "8px" }}>
                    {s.title}
                  </h3>

                  <p style={{ fontSize: "13px", color: "#64748b", lineHeight: "1.65", margin: 0 }}>
                    {s.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Eligible vs Ineligible Return Conditions */}
          <div style={{ marginBottom: "45px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
              <span style={{ width: "4px", height: "22px", backgroundColor: "#e52860", borderRadius: "2px", display: "inline-block" }} />
              <h2 style={{ fontSize: "20px", fontWeight: "900", color: "#0e1e38", margin: 0 }}>
                Return Eligibility Guidelines
              </h2>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "18px" }}>
              {/* Eligible */}
              <div
                className="glow-card-interactive"
                style={{
                  backgroundColor: "#ffffff",
                  borderRadius: "16px",
                  padding: "24px",
                  border: "1.5px solid #bbf7d0",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px", color: "#166534", fontWeight: "900", fontSize: "15px" }}>
                  <span>✅</span>
                  <span>Eligible for Free Return / Replacement</span>
                </div>
                <ul style={{ paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "8px", fontSize: "13px", color: "#374151", margin: 0, lineHeight: "1.6" }}>
                  <li>Damaged bottles, leaking serums, or shattered compacts upon delivery.</li>
                  <li>Incorrect product variant, formula, or shade sent by error.</li>
                  <li>Manufacturer packaging defect (e.g. broken pump or dispenser).</li>
                  <li>Proven inauthentic or counterfeit product (immediate 100% refund).</li>
                </ul>
              </div>

              {/* Ineligible */}
              <div
                className="glow-card-interactive"
                style={{
                  backgroundColor: "#ffffff",
                  borderRadius: "16px",
                  padding: "24px",
                  border: "1.5px solid #fecaca",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px", color: "#991b1b", fontWeight: "900", fontSize: "15px" }}>
                  <span>❌</span>
                  <span>Non-Returnable Items (Health & Hygiene)</span>
                </div>
                <ul style={{ paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "8px", fontSize: "13px", color: "#374151", margin: 0, lineHeight: "1.6" }}>
                  <li>Opened, swatched, or used cosmetic items and creams.</li>
                  <li>Perfume bottles with seals removed or partial contents sprayed.</li>
                  <li>Products returned past the 7-day delivery reporting window.</li>
                  <li>Change of mind after breaking original plastic shrink wrapping.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Contact Support for Return */}
          <div
            style={{
              background: "linear-gradient(135deg, #0e1e38 0%, #1e293b 100%)",
              borderRadius: "16px",
              padding: "26px 28px",
              color: "#ffffff",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "20px",
            }}
          >
            <div>
              <h3 style={{ fontSize: "18px", fontWeight: "900", marginBottom: "6px" }}>
                Need to Initiate a Return or Exchange?
              </h3>
              <p style={{ fontSize: "13px", color: "#cbd5e1", margin: 0 }}>
                WhatsApp our hotline team at <strong>01609013011</strong> with your Order ID for instant approval.
              </p>
            </div>
            <a
              href="https://wa.me/8801609013011?text=Hi%20GlowGoodly!%20I%20would%20like%20to%20request%20a%20return/replacement."
              target="_blank"
              rel="noreferrer"
              className="glow-interactive-button"
              style={{
                backgroundColor: "#e52860",
                color: "#ffffff",
                padding: "11px 22px",
                borderRadius: "25px",
                fontWeight: "800",
                fontSize: "13px",
                textDecoration: "none",
                boxShadow: "0 4px 14px rgba(229,40,96,0.35)",
              }}
            >
              Start Return Request →
            </a>
          </div>

        </PolicyLayout>
      </main>
      <Footer />
      <MobileNavbar />
    </>
  );
}
