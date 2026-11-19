"use client";

import React from "react";
import Link from "next/link";
import Header from "../../components/Header";
import PageBanner from "../../components/PageBanner";
import Footer from "../../components/Footer";
import MobileNavbar from "../../components/MobileNavbar";
import PolicyLayout from "../../components/PolicyLayout";

export default function ShippingDeliveryPage() {
  const zones = [
    {
      title: "Inside Dhaka Metro",
      rate: "৳70",
      time: "24 – 48 Hours",
      coverage: "All locations within Dhaka North & South City Corporation.",
      tag: "Fast Express",
      color: "#e52860",
      icon: "🏙️",
    },
    {
      title: "Sub-Dhaka Zones",
      rate: "৳100",
      time: "2 – 3 Days",
      coverage: "Keraniganj, Savar, Narayanganj & Gazipur urban centers.",
      tag: "Standard",
      color: "#0284c7",
      icon: "🚚",
    },
    {
      title: "Outside Dhaka (64 Districts)",
      rate: "৳130",
      time: "2 – 4 Days",
      coverage: "All divisional cities, districts, and upazila headquarters.",
      tag: "Nationwide",
      color: "#7c3aed",
      icon: "🗺️",
    },
  ];

  const features = [
    {
      icon: "📦",
      title: "Multi-Layer Protective Packaging",
      desc: "Every glass dropper, serum, and powder compact is double wrapped in heavy-duty protective bubble wrap to ensure zero damage in transit.",
    },
    {
      icon: "🔔",
      title: "Live SMS & Courier Tracking",
      desc: "Receive real-time automated SMS notifications with direct tracking links as soon as your parcel leaves our central dispatch hub.",
    },
    {
      icon: "💵",
      title: "Cash on Delivery Everywhere",
      desc: "Inspect parcel external packaging and pay cash directly to the courier delivery executive upon arrival at your doorstep.",
    },
  ];

  return (
    <>
      <Header />
      <PageBanner title="Shipping & Delivery" />
      <main className="container" style={{ padding: "40px 20px 70px 20px" }}>
        <PolicyLayout currentTab="SHIPPING & DELIVERY">
          
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
              <span>⚡</span>
              <span style={{ fontSize: "11.5px", fontWeight: "800", color: "#e52860", letterSpacing: "1px", textTransform: "uppercase" }}>
                RELIABLE DOORSTEP LOGISTICS
              </span>
            </div>

            <h1 style={{ fontSize: "28px", fontWeight: "900", color: "#0e1e38", lineHeight: "1.3", marginBottom: "10px", fontFamily: "'Montserrat', sans-serif" }}>
              Fast Delivery Across All 64 Districts 🚀
            </h1>
            <p style={{ fontSize: "14px", color: "#64748b", margin: 0, lineHeight: "1.7", maxWidth: "680px" }}>
              At <strong>GlowGoodly</strong>, we partner with premier courier networks to ensure your skincare and beauty essentials reach you swiftly and safely.
            </p>
          </div>

          {/* 3 Delivery Zone Cards (Animated Floating) */}
          <div style={{ marginBottom: "45px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
              <span style={{ width: "4px", height: "22px", backgroundColor: "#e52860", borderRadius: "2px", display: "inline-block" }} />
              <h2 style={{ fontSize: "20px", fontWeight: "900", color: "#0e1e38", margin: 0 }}>
                Transparent Delivery Rates & Schedules
              </h2>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "18px" }}>
              {zones.map((z, idx) => (
                <div
                  key={idx}
                  className="glow-card-interactive"
                  style={{
                    backgroundColor: "#ffffff",
                    borderRadius: "16px",
                    padding: "26px",
                    border: "1.5px solid #f1f5f9",
                    boxShadow: "0 4px 15px rgba(0,0,0,0.02)",
                    position: "relative",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                    <span style={{ fontSize: "32px", animation: "floatSoft 3s ease-in-out infinite", animationDelay: `${idx * 0.3}s` }}>
                      {z.icon}
                    </span>
                    <span style={{ fontSize: "11px", fontWeight: "900", color: z.color, backgroundColor: `${z.color}15`, padding: "3px 10px", borderRadius: "20px" }}>
                      {z.tag}
                    </span>
                  </div>

                  <h3 style={{ fontSize: "17px", fontWeight: "900", color: "#0e1e38", marginBottom: "4px" }}>
                    {z.title}
                  </h3>

                  <div style={{ display: "flex", alignItems: "baseline", gap: "6px", margin: "10px 0" }}>
                    <span style={{ fontSize: "26px", fontWeight: "900", color: "#e52860" }}>{z.rate}</span>
                    <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "600" }}>/ per parcel</span>
                  </div>

                  <div style={{ fontSize: "13px", fontWeight: "700", color: "#1e293b", marginBottom: "8px" }}>
                    ⏱️ Estimated Time: {z.time}
                  </div>

                  <p style={{ fontSize: "12.5px", color: "#64748b", lineHeight: "1.6", margin: 0 }}>
                    {z.coverage}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Delivery Assurance Pillars */}
          <div style={{ marginBottom: "45px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
              <span style={{ width: "4px", height: "22px", backgroundColor: "#e52860", borderRadius: "2px", display: "inline-block" }} />
              <h2 style={{ fontSize: "20px", fontWeight: "900", color: "#0e1e38", margin: 0 }}>
                Our Delivery Safety Promises
              </h2>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "18px" }}>
              {features.map((f, idx) => (
                <div
                  key={idx}
                  className="glow-card-interactive"
                  style={{
                    backgroundColor: "#ffffff",
                    borderRadius: "16px",
                    padding: "22px",
                    border: "1.5px solid #f1f5f9",
                  }}
                >
                  <div style={{ fontSize: "28px", marginBottom: "10px" }}>{f.icon}</div>
                  <h3 style={{ fontSize: "15px", fontWeight: "900", color: "#0e1e38", marginBottom: "6px" }}>
                    {f.title}
                  </h3>
                  <p style={{ fontSize: "13px", color: "#64748b", lineHeight: "1.6", margin: 0 }}>
                    {f.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Live Tracking Help Box */}
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
                Need Help Tracking Your Package?
              </h3>
              <p style={{ fontSize: "13px", color: "#cbd5e1", margin: 0 }}>
                Have your Order ID ready or WhatsApp our logistics desk directly at <strong>01609013011</strong>.
              </p>
            </div>
            <a
              href="https://wa.me/8801609013011"
              target="_blank"
              rel="noreferrer"
              className="glow-interactive-button"
              style={{
                backgroundColor: "#25D366",
                color: "#ffffff",
                padding: "11px 22px",
                borderRadius: "25px",
                fontWeight: "800",
                fontSize: "13px",
                textDecoration: "none",
                boxShadow: "0 4px 14px rgba(37,211,102,0.3)",
              }}
            >
              WhatsApp Logistics Desk →
            </a>
          </div>

        </PolicyLayout>
      </main>
      <Footer />
      <MobileNavbar />
    </>
  );
}
