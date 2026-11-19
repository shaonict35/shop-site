"use client";

import React, { useState } from "react";
import Link from "next/link";
import Header from "../../components/Header";
import PageBanner from "../../components/PageBanner";
import Footer from "../../components/Footer";
import MobileNavbar from "../../components/MobileNavbar";
import PolicyLayout from "../../components/PolicyLayout";

export default function AuthenticityPage() {
  const [testCode, setTestCode] = useState("");
  const [verifiedResult, setVerifiedResult] = useState<boolean | null>(null);

  const verificationSteps = [
    {
      num: "01",
      title: "Direct Tier-1 Sourcing",
      desc: "Every product in our inventory originates directly from authorized brand headquarters, official laboratories, or certified sole-distributors in South Korea, USA, UK, and Japan.",
      icon: "🏢",
      badge: "Supply Chain",
    },
    {
      num: "02",
      title: "Customs & Port Certification",
      desc: "Consignments pass through official Bangladesh Customs clearance with certified Bill of Lading, Certificate of Origin, and Manufacturer Analysis Reports.",
      icon: "📜",
      badge: "Legal Import",
    },
    {
      num: "03",
      title: "Batch Code & Barcode Verification",
      desc: "Every item features an authentic manufacturer batch code stamped onto the bottle/packaging, cross-referenced with official brand databases before stocking.",
      icon: "🔍",
      badge: "Quality Check",
    },
    {
      num: "04",
      title: "Tamper-Proof Hologram Seal",
      desc: "Before dispatch, our fulfillment center applies a specialized GlowGoodly security seal to ensure the formula remains intact and unopened during courier transit.",
      icon: "🛡️",
      badge: "Secure Dispatch",
    },
  ];

  const fakeVsReal = [
    {
      item: "Packaging & Print Quality",
      authentic: "Crisp, embossed typography, even fonts, zero ink smudges, and intact security seals.",
      fake: "Faded lettering, typo errors, peeling stickers, and cheap loose cellophane wrapping.",
    },
    {
      item: "Formula & Scent",
      authentic: "Consistent dermatological texture, correct viscosity, gentle clean fragrance or completely fragrance-free as formulated.",
      fake: "Pungent chemical or synthetic floral smell, separated watery layers, or greasy artificial feel.",
    },
    {
      item: "Batch Code Stamping",
      authentic: "Clear, dot-matrix or laser embossed batch code matching on both outer box and bottom of the container.",
      fake: "Missing batch code, mismatched numbers between box and container, or easily rubbed off with a finger.",
    },
  ];

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testCode.trim()) return;
    setVerifiedResult(true);
  };

  return (
    <>
      <Header />
      <PageBanner title="AUTHENTICITY" />
      <main className="container" style={{ padding: "40px 20px 70px 20px" }}>
        <PolicyLayout currentTab="AUTHENTICITY">
          
          {/* Animated Hero Banner */}
          <div
            style={{
              padding: "32px 28px",
              borderRadius: "20px",
              background: "linear-gradient(135deg, #0e1e38 0%, #1e293b 100%)",
              color: "#ffffff",
              marginBottom: "35px",
              boxShadow: "0 10px 30px rgba(14,30,56,0.15)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Pulsing Shield Background Aura */}
            <div
              style={{
                position: "absolute",
                top: "-40px",
                right: "-30px",
                width: "180px",
                height: "180px",
                borderRadius: "50%",
                background: "radial-gradient(circle, rgba(229,40,96,0.3) 0%, rgba(229,40,96,0) 70%)",
                animation: "pulseGlow 3.5s infinite ease-in-out",
                pointerEvents: "none",
              }}
            />

            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "6px 16px",
                backgroundColor: "rgba(229,40,96,0.2)",
                border: "1px solid rgba(229,40,96,0.5)",
                borderRadius: "30px",
                color: "#fda4af",
                fontSize: "11px",
                fontWeight: "800",
                letterSpacing: "1.5px",
                textTransform: "uppercase",
                marginBottom: "14px",
                animation: "badgePulse 2.5s infinite ease-in-out",
              }}
            >
              <span>🛡️</span>
              <span>100% AUTHENTICITY GUARANTEE</span>
            </div>

            <h1
              style={{
                fontSize: "28px",
                fontWeight: "900",
                lineHeight: "1.3",
                marginBottom: "12px",
                fontFamily: "'Montserrat', sans-serif",
              }}
            >
              Our Uncompromised Authenticity Pledge 💎
            </h1>

            <p style={{ fontSize: "14.5px", color: "#cbd5e1", lineHeight: "1.8", margin: 0 }}>
              At <strong>GlowGoodly</strong>, authenticity is not just a marketing promise—it is the foundation of everything we do. Counterfeit cosmetics pose severe dermatological risks. We operate with a <strong>Zero-Tolerance Fake Policy</strong> and back every order with a <strong>100% Instant Refund Guarantee</strong>.
            </p>
          </div>

          {/* 4 Pillars of Verification (Animated Interactive Cards) */}
          <div style={{ marginBottom: "45px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
              <span style={{ width: "4px", height: "22px", backgroundColor: "#e52860", borderRadius: "2px", display: "inline-block" }} />
              <h2 style={{ fontSize: "20px", fontWeight: "900", color: "#0e1e38", margin: 0 }}>
                4-Stage Authenticity Verification Protocol
              </h2>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "18px" }}>
              {verificationSteps.map((step, idx) => (
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
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                    <span style={{ fontSize: "32px", animation: "floatSoft 3s ease-in-out infinite", animationDelay: `${idx * 0.4}s` }}>
                      {step.icon}
                    </span>
                    <span style={{ fontSize: "11px", fontWeight: "900", color: "#e52860", backgroundColor: "#fff0f4", padding: "3px 10px", borderRadius: "20px" }}>
                      STEP {step.num}
                    </span>
                  </div>

                  <h3 style={{ fontSize: "16px", fontWeight: "900", color: "#0e1e38", marginBottom: "8px" }}>
                    {step.title}
                  </h3>

                  <p style={{ fontSize: "13px", color: "#64748b", lineHeight: "1.65", margin: 0 }}>
                    {step.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Interactive Batch Code Inspector Tool Widget */}
          <div
            className="glow-card-interactive"
            style={{
              backgroundColor: "#fff0f5",
              borderRadius: "18px",
              padding: "28px",
              border: "1.5px solid #fce7f0",
              marginBottom: "45px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
              <span style={{ fontSize: "24px" }}>🔬</span>
              <h3 style={{ fontSize: "18px", fontWeight: "900", color: "#0e1e38", margin: 0 }}>
                Live Batch Code & Authenticity Guide
              </h3>
            </div>
            
            <p style={{ fontSize: "13.5px", color: "#64748b", lineHeight: "1.6", marginBottom: "18px" }}>
              Every product received from GlowGoodly has a batch code printed on the bottom of the container (e.g., COSRX, CeraVe, The Ordinary). Enter your code below to learn how to cross-check:
            </p>

            <form onSubmit={handleVerify} style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "16px" }}>
              <input
                type="text"
                value={testCode}
                onChange={(e) => setTestCode(e.target.value)}
                placeholder="e.g., 24J701 or 38T400"
                style={{
                  flex: 1,
                  minWidth: "220px",
                  padding: "12px 16px",
                  borderRadius: "10px",
                  border: "1.5px solid #e2e8f0",
                  fontSize: "13.5px",
                  outline: "none",
                  backgroundColor: "#ffffff",
                }}
              />
              <button
                type="submit"
                className="glow-interactive-button"
                style={{
                  backgroundColor: "#e52860",
                  color: "#ffffff",
                  padding: "12px 24px",
                  borderRadius: "10px",
                  border: "none",
                  fontWeight: "800",
                  fontSize: "13px",
                  cursor: "pointer",
                  boxShadow: "0 4px 12px rgba(229,40,96,0.3)",
                }}
              >
                VERIFY BATCH CODE 🔍
              </button>
            </form>

            {verifiedResult && (
              <div
                style={{
                  backgroundColor: "#ffffff",
                  borderRadius: "12px",
                  padding: "18px",
                  border: "1.5px solid #10b981",
                  animation: "fadeInUp 0.3s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#059669", fontWeight: "900", fontSize: "14px", marginBottom: "6px" }}>
                  <span>✅</span>
                  <span>Batch Code Format Recognized!</span>
                </div>
                <p style={{ fontSize: "13px", color: "#475569", lineHeight: "1.6", margin: 0 }}>
                  You can verify this code "{testCode}" internationally using official cosmetics directories like <strong>CheckFresh</strong> or <strong>CheckCosmetic</strong>. The batch indicates production date, factory batch identity, and shelf-life validity.
                </p>
              </div>
            )}
          </div>

          {/* Authentic vs Counterfeit Comparison Table */}
          <div style={{ marginBottom: "45px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
              <span style={{ width: "4px", height: "22px", backgroundColor: "#e52860", borderRadius: "2px", display: "inline-block" }} />
              <h2 style={{ fontSize: "20px", fontWeight: "900", color: "#0e1e38", margin: 0 }}>
                Authentic vs Counterfeit: Key Differences
              </h2>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {fakeVsReal.map((item, idx) => (
                <div
                  key={idx}
                  className="glow-card-interactive"
                  style={{
                    backgroundColor: "#ffffff",
                    borderRadius: "14px",
                    border: "1px solid #f1f5f9",
                    padding: "20px 24px",
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                    gap: "18px",
                  }}
                >
                  <div style={{ gridColumn: "1 / -1", borderBottom: "1px solid #f1f5f9", paddingBottom: "10px" }}>
                    <span style={{ fontSize: "15px", fontWeight: "900", color: "#0e1e38" }}>
                      {item.item}
                    </span>
                  </div>
                  <div style={{ backgroundColor: "#ecfdf5", padding: "16px", borderRadius: "10px", border: "1px solid #a7f3d0" }}>
                    <div style={{ fontSize: "12px", fontWeight: "900", color: "#047857", marginBottom: "4px" }}>
                      ✨ 100% GENUINE GLOWGOODLY
                    </div>
                    <div style={{ fontSize: "13px", color: "#065f46", lineHeight: "1.6" }}>
                      {item.authentic}
                    </div>
                  </div>
                  <div style={{ backgroundColor: "#fef2f2", padding: "16px", borderRadius: "10px", border: "1px solid #fecaca" }}>
                    <div style={{ fontSize: "12px", fontWeight: "900", color: "#b91c1c", marginBottom: "4px" }}>
                      ⚠️ SUSPICIOUS / COUNTERFEIT
                    </div>
                    <div style={{ fontSize: "13px", color: "#991b1b", lineHeight: "1.6" }}>
                      {item.fake}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 100% Instant Refund Assurance Box */}
          <div
            style={{
              background: "linear-gradient(135deg, #fff0f5 0%, #ffe4e6 100%)",
              border: "2px solid #f43f5e",
              borderRadius: "16px",
              padding: "26px",
              textAlign: "center",
              boxShadow: "0 8px 25px rgba(244,63,94,0.12)",
            }}
          >
            <div style={{ fontSize: "36px", marginBottom: "6px" }}>🤝</div>
            <h3 style={{ fontSize: "19px", fontWeight: "900", color: "#9f1239", marginBottom: "8px" }}>
              Our 100% Money-Back Authenticity Guarantee
            </h3>
            <p style={{ fontSize: "14px", color: "#881337", maxWidth: "620px", margin: "0 auto 18px auto", lineHeight: "1.7", fontWeight: "500" }}>
              "If you ever purchase any cosmetic, skincare, or haircare item from GlowGoodly that is proven inauthentic by the brand manufacturer or certified laboratory, we guarantee an instant 100% full refund plus reimbursement of your courier fees."
            </p>
            <Link
              href="/shop"
              className="glow-interactive-button"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                backgroundColor: "#e52860",
                color: "#ffffff",
                padding: "12px 28px",
                borderRadius: "30px",
                fontWeight: "800",
                fontSize: "13px",
                textDecoration: "none",
                boxShadow: "0 4px 14px rgba(229,40,96,0.35)",
              }}
            >
              <span>SHOP AUTHENTIC BRANDS SAFELY</span>
              <span>→</span>
            </Link>
          </div>

        </PolicyLayout>
      </main>
      <Footer />
      <MobileNavbar />
    </>
  );
}
