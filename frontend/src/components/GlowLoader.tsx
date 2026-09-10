"use client";

import React from "react";

interface GlowLoaderProps {
  text?: string;
  subtext?: string;
  fullScreen?: boolean;
}

export default function GlowLoader({
  text = "GlowGoodly",
  subtext = "Authentic Beauty & Skincare",
  fullScreen = false
}: GlowLoaderProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: fullScreen ? "0" : "60px 20px",
        minHeight: fullScreen ? "80vh" : "280px",
        width: "100%",
      }}
    >
      <div style={{ position: "relative", width: "64px", height: "64px", marginBottom: "20px" }}>
        {/* Outer glowing pulsing orb */}
        <div
          style={{
            position: "absolute",
            inset: "-8px",
            background: "radial-gradient(circle, rgba(229, 40, 96, 0.25) 0%, rgba(229, 40, 96, 0) 70%)",
            borderRadius: "50%",
            animation: "pulseGlow 2s ease-in-out infinite",
          }}
        />

        {/* Outer spinner ring */}
        <div
          style={{
            width: "64px",
            height: "64px",
            borderRadius: "50%",
            border: "3.5px solid rgba(229, 40, 96, 0.12)",
            borderTopColor: "#e52860",
            borderRightColor: "#fb7185",
            animation: "spin 0.85s cubic-bezier(0.55, 0.15, 0.45, 0.85) infinite",
            boxShadow: "0 0 16px rgba(229, 40, 96, 0.25)",
          }}
        />

        {/* Inner reverse spinner */}
        <div
          style={{
            position: "absolute",
            top: "9px",
            left: "9px",
            width: "46px",
            height: "46px",
            borderRadius: "50%",
            border: "2.5px solid transparent",
            borderBottomColor: "#f43f5e",
            borderLeftColor: "#fda4af",
            animation: "spinReverse 0.65s linear infinite",
          }}
        />

        {/* Center glowing dot */}
        <div
          style={{
            position: "absolute",
            top: "26px",
            left: "26px",
            width: "12px",
            height: "12px",
            borderRadius: "50%",
            backgroundColor: "#e52860",
            boxShadow: "0 0 10px #e52860",
            animation: "badgePulse 1.2s ease-in-out infinite",
          }}
        />
      </div>

      {/* Brand Title */}
      <div
        style={{
          fontSize: "18px",
          fontWeight: "900",
          letterSpacing: "1px",
          background: "linear-gradient(135deg, #0e1e38 0%, #e52860 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          fontFamily: "'Montserrat', sans-serif",
          marginBottom: "4px",
        }}
      >
        {text}
      </div>

      {/* Subtext with gentle shimmer */}
      <div
        style={{
          fontSize: "12px",
          color: "#94a3b8",
          fontWeight: "600",
          letterSpacing: "0.5px",
        }}
      >
        {subtext}
      </div>
    </div>
  );
}
