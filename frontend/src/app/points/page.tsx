"use client";

import React, { useState } from "react";
import Link from "next/link";
import Header from "../../components/Header";
import PageBanner from "../../components/PageBanner";
import Footer from "../../components/Footer";
import MobileNavbar from "../../components/MobileNavbar";
import PolicyLayout from "../../components/PolicyLayout";

export default function PointsPage() {
  const [calcAmount, setCalcAmount] = useState<number>(2000);

  const pointsEarned = Math.floor(calcAmount * 0.05);

  const steps = [
    {
      step: "01",
      icon: "🛍️",
      title: "Shop Authentic Products",
      desc: "Earn 5% of your total order value in Glow Points on every single purchase made through your account.",
    },
    {
      step: "02",
      icon: "💎",
      title: "Accumulate Glow Points",
      desc: "Every 1 Glow Point = 1 BDT cash discount. Your points never expire as long as your account remains active.",
    },
    {
      step: "03",
      icon: "🎉",
      title: "Redeem at Checkout",
      desc: "Apply your points directly on the checkout screen to slash your final total instantly with one click.",
    },
  ];

  const tiers = [
    {
      name: "Pink Glow Member",
      spend: "৳0 – ৳9,999",
      perk: "5% Points on every order + Birthday Gift Voucher",
      badge: "Standard",
      color: "#e52860",
    },
    {
      name: "Gold Glam VIP",
      spend: "৳10,000 – ৳24,999",
      perk: "7% Points on orders + Free Delivery Coupons + Early Access to Sales",
      badge: "VIP Tier",
      color: "#d97706",
    },
    {
      name: "Diamond Elite Club",
      spend: "৳25,000+",
      perk: "10% Points + Dedicated Beauty Advisor + Free Luxury Beauty Boxes",
      badge: "Elite VIP",
      color: "#7c3aed",
    },
  ];

  return (
    <>
      <Header />
      <PageBanner title="Points & Rewards" />
      <main className="container" style={{ padding: "40px 20px 70px 20px" }}>
        <PolicyLayout currentTab="POINTS">
          
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
              <span>💎</span>
              <span style={{ fontSize: "11.5px", fontWeight: "800", color: "#e52860", letterSpacing: "1px", textTransform: "uppercase" }}>
                GLOWGOODLY LOYALTY CLUB
              </span>
            </div>

            <h1 style={{ fontSize: "28px", fontWeight: "900", color: "#0e1e38", lineHeight: "1.3", marginBottom: "10px", fontFamily: "'Montserrat', sans-serif" }}>
              Shop, Glow & Earn 5% Cashback Rewards 🎁
            </h1>
            <p style={{ fontSize: "14px", color: "#64748b", margin: 0, lineHeight: "1.7", maxWidth: "680px" }}>
              We reward your dedication to authentic beauty! Every order at GlowGoodly earns reward points that convert directly into money off your next skincare purchase.
            </p>
          </div>

          {/* Interactive Live Points Calculator Widget */}
          <div
            className="glow-card-interactive"
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "18px",
              padding: "28px",
              border: "1.5px solid #f1f5f9",
              boxShadow: "0 6px 25px rgba(0,0,0,0.03)",
              marginBottom: "40px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
              <span style={{ fontSize: "26px" }}>🧮</span>
              <div>
                <h2 style={{ fontSize: "18px", fontWeight: "900", color: "#0e1e38", margin: 0 }}>
                  Live Glow Points Calculator
                </h2>
                <p style={{ fontSize: "12.5px", color: "#64748b", margin: "2px 0 0 0" }}>
                  Adjust the slider or enter your planned purchase to see your points return:
                </p>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "20px", flexWrap: "wrap", marginBottom: "20px" }}>
              <div style={{ flex: 1, minWidth: "220px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", fontWeight: "700", marginBottom: "8px", color: "#334155" }}>
                  <span>Planned Order Amount:</span>
                  <span style={{ color: "#e52860", fontWeight: "900", fontSize: "15px" }}>৳{calcAmount.toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min="500"
                  max="20000"
                  step="500"
                  value={calcAmount}
                  onChange={(e) => setCalcAmount(Number(e.target.value))}
                  style={{ width: "100%", accentColor: "#e52860", cursor: "pointer" }}
                />
              </div>

              {/* Reward Result Card */}
              <div
                style={{
                  background: "linear-gradient(135deg, #fff0f5 0%, #ffe4e6 100%)",
                  padding: "16px 24px",
                  borderRadius: "14px",
                  border: "1.5px solid #fce7f0",
                  textAlign: "center",
                  minWidth: "160px",
                }}
              >
                <div style={{ fontSize: "11px", fontWeight: "800", color: "#e52860", textTransform: "uppercase" }}>
                  POINTS YOU WILL EARN
                </div>
                <div style={{ fontSize: "28px", fontWeight: "900", color: "#e52860", margin: "4px 0" }}>
                  +{pointsEarned} pts
                </div>
                <div style={{ fontSize: "12px", color: "#475569", fontWeight: "700" }}>
                  = ৳{pointsEarned} Cash Discount
                </div>
              </div>
            </div>
          </div>

          {/* 3 Steps to Earn & Redeem (Interactive Floating Cards) */}
          <div style={{ marginBottom: "45px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
              <span style={{ width: "4px", height: "22px", backgroundColor: "#e52860", borderRadius: "2px", display: "inline-block" }} />
              <h2 style={{ fontSize: "20px", fontWeight: "900", color: "#0e1e38", margin: 0 }}>
                How the Glow Club Works
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
                      STEP {s.step}
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

          {/* VIP Membership Tiers */}
          <div style={{ marginBottom: "45px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
              <span style={{ width: "4px", height: "22px", backgroundColor: "#e52860", borderRadius: "2px", display: "inline-block" }} />
              <h2 style={{ fontSize: "20px", fontWeight: "900", color: "#0e1e38", margin: 0 }}>
                VIP Loyalty Membership Tiers
              </h2>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "18px" }}>
              {tiers.map((t, idx) => (
                <div
                  key={idx}
                  className="glow-card-interactive"
                  style={{
                    backgroundColor: "#ffffff",
                    borderRadius: "16px",
                    padding: "24px",
                    border: "1.5px solid #f1f5f9",
                    position: "relative",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                      <span style={{ fontSize: "11px", fontWeight: "800", color: t.color, backgroundColor: `${t.color}15`, padding: "4px 10px", borderRadius: "20px" }}>
                        {t.badge}
                      </span>
                    </div>
                    <h3 style={{ fontSize: "17px", fontWeight: "900", color: "#0e1e38", marginBottom: "6px" }}>
                      {t.name}
                    </h3>
                    <div style={{ fontSize: "12.5px", fontWeight: "700", color: "#e52860", marginBottom: "12px" }}>
                      Annual Spend: {t.spend}
                    </div>
                    <p style={{ fontSize: "13px", color: "#64748b", lineHeight: "1.6", margin: 0 }}>
                      {t.perk}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick CTA */}
          <div
            style={{
              background: "linear-gradient(135deg, #0e1e38 0%, #1e293b 100%)",
              borderRadius: "16px",
              padding: "28px",
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
                Start Earning Points Today!
              </h3>
              <p style={{ fontSize: "13px", color: "#cbd5e1", margin: 0 }}>
                Log into your GlowGoodly account and get points on your very first order.
              </p>
            </div>
            <Link
              href="/shop"
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
              START SHOPPING →
            </Link>
          </div>

        </PolicyLayout>
      </main>
      <Footer />
      <MobileNavbar />
    </>
  );
}
