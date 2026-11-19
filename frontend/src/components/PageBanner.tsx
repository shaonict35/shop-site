"use client";

import React from "react";

interface PageBannerProps {
  title: string;
}

export default function PageBanner({ title }: PageBannerProps) {
  return (
    <div
      className="page-banner-wrapper"
      style={{
        backgroundColor: "#ffe5ec",
        backgroundImage: "linear-gradient(135deg, #ffe5ec 0%, #fff0f5 100%)",
        borderBottom: "1px solid #ffd1dc"
      }}
    >
      {/* Decorative circles */}
      <div style={{
        position: "absolute",
        width: "120px",
        height: "120px",
        borderRadius: "50%",
        backgroundColor: "rgba(229, 40, 96, 0.04)",
        top: "-20px",
        left: "10%"
      }} />
      <div style={{
        position: "absolute",
        width: "180px",
        height: "180px",
        borderRadius: "50%",
        backgroundColor: "rgba(229, 40, 96, 0.03)",
        bottom: "-40px",
        right: "8%"
      }} />

      <h1
        className="page-banner-title"
        style={{
          color: "#0e1e38",
          textShadow: "0 2px 4px rgba(0,0,0,0.02)",
          margin: 0,
          cursor: "pointer",
          transition: "all 0.3s ease-in-out"
        }}
      >
        {title}
      </h1>
    </div>
  );
}
