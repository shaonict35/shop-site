"use client";

import React, { useState } from "react";
import Link from "next/link";
import Header from "../../components/Header";
import PageBanner from "../../components/PageBanner";
import Footer from "../../components/Footer";
import MobileNavbar from "../../components/MobileNavbar";
import PolicyLayout from "../../components/PolicyLayout";

export default function AboutPage() {
  const [activeTab, setActiveTab] = useState<number>(0);

  const stats = [
    { number: "100K+", label: "Happy Customers", icon: "💖", desc: "Across 64 districts in Bangladesh" },
    { number: "100%", label: "Authentic Guarantee", icon: "🛡️", desc: "Zero tolerance for counterfeits" },
    { number: "500+", label: "Global Brands", icon: "✨", desc: "Korea, USA, UK, Japan & Europe" },
    { number: "24/7", label: "Expert Beauty Help", icon: "💬", desc: "Skin consultation & support" },
  ];

  const milestones = [
    {
      year: "2023",
      title: "The Genesis",
      desc: "GlowGoodly was founded with a fierce commitment: to create a safe haven where Bangladeshi skincare lovers could shop authentic global cosmetics without fear of counterfeit products.",
      tag: "Foundation",
    },
    {
      year: "2024",
      title: "500+ Direct Brand Network",
      desc: "Formed verified direct relationships with authorized global brand distributors for COSRX, CeraVe, The Ordinary, Beauty of Joseon, and La Roche-Posay.",
      tag: "Expansion",
    },
    {
      year: "2025",
      title: "High-Performance Tech Upgrade",
      desc: "Re-engineered our entire platform from WordPress to a lightning-fast custom API-driven stack, with instant checkout, live tracking, and smart shade finders.",
      tag: "Innovation",
    },
    {
      year: "2026",
      title: "Nationwide Beauty Ecosystem",
      desc: "Expanding next-day door delivery across Bangladesh, launching exclusive member rewards, and debuting our upcoming native iOS & Android applications.",
      tag: "Present",
    },
  ];

  const promises = [
    {
      num: "01",
      title: "100% Genuine & Authentic Products",
      desc: "We source directly from brand manufacturing hubs and authorized tier-1 importers. Every single bottle carries valid verifiable batch codes.",
      icon: "💎",
      color: "#e52860",
    },
    {
      num: "02",
      title: "Climate-Controlled Storage",
      desc: "Skincare ingredients like Vitamin C, Retinol, and Sunscreen lose efficacy in tropical heat. Our Dhaka warehouses maintain optimal temperature regulation.",
      icon: "❄️",
      color: "#0284c7",
    },
    {
      num: "03",
      title: "Lightning-Fast Delivery",
      desc: "Inside Dhaka within 24-48 hours (৳70), Sub-Dhaka (৳100), and all 64 districts (৳130) with premier parcel logistics & Cash on Delivery.",
      icon: "⚡",
      color: "#f59e0b",
    },
    {
      num: "04",
      title: "Hassle-Free 7-Day Replacement",
      desc: "If any item arrives compromised, unsealed, or defective, we replace it instantly with zero questions asked and free courier return.",
      icon: "🔄",
      color: "#10b981",
    },
  ];

  return (
    <>
      <Header />
      <PageBanner title="OUR STORY" />
      <main className="container" style={{ padding: "40px 20px 70px 20px" }}>
        <PolicyLayout currentTab="OUR STORY">
          
          {/* Animated Hero Header */}
          <div
            style={{
              marginBottom: "35px",
              padding: "28px",
              borderRadius: "18px",
              background: "linear-gradient(135deg, #fff0f5 0%, #fff7ed 100%)",
              border: "1.5px solid #fce7f0",
              boxShadow: "0 10px 30px -10px rgba(229,40,96,0.1)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Background glowing gradient orb */}
            <div
              style={{
                position: "absolute",
                top: "-40px",
                right: "-40px",
                width: "160px",
                height: "160px",
                borderRadius: "50%",
                background: "radial-gradient(circle, rgba(229,40,96,0.2) 0%, rgba(229,40,96,0) 70%)",
                animation: "pulseGlow 3s infinite ease-in-out",
                pointerEvents: "none",
              }}
            />

            <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "5px 14px", backgroundColor: "#ffffff", borderRadius: "20px", boxShadow: "0 2px 8px rgba(229,40,96,0.15)", marginBottom: "14px", animation: "badgePulse 2.5s infinite ease-in-out" }}>
              <span style={{ fontSize: "14px" }}>✨</span>
              <span style={{ fontSize: "11.5px", fontWeight: "800", color: "#e52860", letterSpacing: "1px", textTransform: "uppercase" }}>
                100% Authentic Beauty Sanctuary in BD
              </span>
            </div>

            <h1
              style={{
                fontSize: "28px",
                fontWeight: "900",
                color: "#0e1e38",
                lineHeight: "1.3",
                marginBottom: "14px",
                fontFamily: "'Montserrat', sans-serif",
              }}
            >
              Empowering Bangladesh with Genuine Skincare & Clean Beauty 🌸
            </h1>

            <p style={{ fontSize: "14.5px", lineHeight: "1.8", color: "#475569", fontWeight: "500", margin: 0 }}>
              Welcome to <strong>GlowGoodly</strong> — founded with one clear mission: to bring 100% authentic, high-efficacy international cosmetics, Korean skincare, and dermatological essentials directly to the hands of beauty enthusiasts in Bangladesh at fair, transparent prices.
            </p>
          </div>

          {/* Interactive Stats Grid with Animations */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "16px",
              marginBottom: "40px",
            }}
          >
            {stats.map((s, idx) => (
              <div
                key={idx}
                className="glow-card-interactive"
                style={{
                  backgroundColor: "#ffffff",
                  padding: "22px 18px",
                  borderRadius: "14px",
                  border: "1px solid #f1f5f9",
                  boxShadow: "0 4px 15px rgba(0,0,0,0.03)",
                  textAlign: "center",
                  cursor: "default",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div style={{ fontSize: "28px", marginBottom: "8px", animation: "floatSoft 3s ease-in-out infinite", animationDelay: `${idx * 0.4}s` }}>
                  {s.icon}
                </div>
                <div style={{ fontSize: "24px", fontWeight: "900", color: "#e52860", marginBottom: "4px", letterSpacing: "-0.5px" }}>
                  {s.number}
                </div>
                <div style={{ fontSize: "13px", fontWeight: "800", color: "#0e1e38", marginBottom: "4px" }}>
                  {s.label}
                </div>
                <div style={{ fontSize: "11px", color: "#94a3b8", fontWeight: "500" }}>
                  {s.desc}
                </div>
              </div>
            ))}
          </div>

          {/* Our Core Promises (Interactive Animated Cards) */}
          <div style={{ marginBottom: "45px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "18px" }}>
              <span style={{ width: "4px", height: "24px", backgroundColor: "#e52860", borderRadius: "2px", display: "inline-block" }} />
              <h2 style={{ fontSize: "20px", fontWeight: "900", color: "#0e1e38", margin: 0 }}>
                Our 4 Pillars of Trust (আমাদের অঙ্গীকার)
              </h2>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "18px" }}>
              {promises.map((p, idx) => (
                <div
                  key={idx}
                  className="glow-card-interactive"
                  style={{
                    backgroundColor: "#ffffff",
                    borderRadius: "14px",
                    padding: "24px",
                    border: "1.5px solid #f1f5f9",
                    position: "relative",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                      <span style={{ fontSize: "26px" }}>{p.icon}</span>
                      <span
                        style={{
                          fontSize: "12px",
                          fontWeight: "900",
                          color: p.color,
                          backgroundColor: `${p.color}15`,
                          padding: "3px 10px",
                          borderRadius: "20px",
                        }}
                      >
                        {p.num}
                      </span>
                    </div>
                    <h3 style={{ fontSize: "15px", fontWeight: "800", color: "#0e1e38", marginBottom: "8px", lineHeight: "1.4" }}>
                      {p.title}
                    </h3>
                    <p style={{ fontSize: "13px", lineHeight: "1.6", color: "#64748b", margin: 0 }}>
                      {p.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* GlowGoodly Journey & Milestones (Animated Path) */}
          <div style={{ marginBottom: "45px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "22px" }}>
              <span style={{ width: "4px", height: "24px", backgroundColor: "#e52860", borderRadius: "2px", display: "inline-block" }} />
              <h2 style={{ fontSize: "20px", fontWeight: "900", color: "#0e1e38", margin: 0 }}>
                Our Evolution & Milestones (আমাদের পথচলা)
              </h2>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {milestones.map((m, idx) => (
                <div
                  key={idx}
                  className="glow-card-interactive"
                  style={{
                    backgroundColor: "#ffffff",
                    borderRadius: "14px",
                    padding: "20px 24px",
                    border: "1.5px solid #f1f5f9",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "20px",
                    flexWrap: "wrap",
                  }}
                >
                  <div
                    style={{
                      backgroundColor: idx === milestones.length - 1 ? "#e52860" : "#0e1e38",
                      color: "#ffffff",
                      fontWeight: "900",
                      fontSize: "14px",
                      padding: "8px 16px",
                      borderRadius: "10px",
                      minWidth: "75px",
                      textAlign: "center",
                      boxShadow: idx === milestones.length - 1 ? "0 4px 14px rgba(229,40,96,0.3)" : "none",
                    }}
                  >
                    {m.year}
                  </div>
                  <div style={{ flex: 1, minWidth: "240px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px", flexWrap: "wrap" }}>
                      <h3 style={{ fontSize: "16px", fontWeight: "800", color: "#0e1e38", margin: 0 }}>
                        {m.title}
                      </h3>
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: "800",
                          backgroundColor: "#f1f5f9",
                          color: "#475569",
                          padding: "2px 8px",
                          borderRadius: "6px",
                          textTransform: "uppercase",
                        }}
                      >
                        {m.tag}
                      </span>
                    </div>
                    <p style={{ fontSize: "13.5px", color: "#64748b", lineHeight: "1.7", margin: 0 }}>
                      {m.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Interactive CTA Banner */}
          <div
            style={{
              background: "linear-gradient(135deg, #0e1e38 0%, #1a365d 100%)",
              borderRadius: "16px",
              padding: "32px 28px",
              color: "#ffffff",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "20px",
              boxShadow: "0 10px 25px rgba(14,30,56,0.15)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                right: "-20px",
                bottom: "-30px",
                fontSize: "120px",
                opacity: 0.06,
                userSelect: "none",
                pointerEvents: "none",
              }}
            >
              💖
            </div>

            <div style={{ maxWidth: "520px", position: "relative", zIndex: 1 }}>
              <h3 style={{ fontSize: "20px", fontWeight: "900", marginBottom: "8px" }}>
                Ready to Experience Genuine Beauty Care?
              </h3>
              <p style={{ fontSize: "13.5px", color: "#cbd5e1", lineHeight: "1.6", margin: 0 }}>
                Explore 500+ curated skincare, makeup, and hair care essentials with 100% authenticity guarantee and doorstep delivery.
              </p>
            </div>

            <Link
              href="/shop"
              className="glow-interactive-button"
              style={{
                backgroundColor: "#e52860",
                color: "#ffffff",
                padding: "13px 26px",
                borderRadius: "30px",
                fontWeight: "800",
                fontSize: "13px",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                boxShadow: "0 4px 15px rgba(229,40,96,0.4)",
                position: "relative",
                zIndex: 1,
              }}
            >
              <span>EXPLORE AUTHENTIC SHOP</span>
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
