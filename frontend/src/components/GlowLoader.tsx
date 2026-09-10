"use client";

import React, { useState, useEffect } from "react";
import { ShoppingBag, Sparkles } from "lucide-react";

interface GlowLoaderProps {
  text?: string;
  subtext?: string;
  fullScreen?: boolean;
}

export default function GlowLoader({
  text = "Loading Products...",
  subtext = "Authentic Skincare & Cosmetics",
  fullScreen = false,
}: GlowLoaderProps) {
  const [activeItem, setActiveItem] = useState(0);

  const productIcons = [
    { emoji: "🧴", name: "Serums & Toners" },
    { emoji: "💄", name: "Lipsticks & Makeup" },
    { emoji: "✨", name: "Glow Moisturizers" },
    { emoji: "🌸", name: "Korean K-Beauty" },
    { emoji: "🛍️", name: "Packing Your Bag" },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveItem((prev) => (prev + 1) % productIcons.length);
    }, 900);
    return () => clearInterval(timer);
  }, [productIcons.length]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: fullScreen ? "0" : "50px 20px",
        minHeight: fullScreen ? "80vh" : "280px",
        width: "100%",
        fontFamily: "'Montserrat', 'Inter', system-ui, sans-serif",
      }}
    >
      <style jsx>{`
        @keyframes bagFloat {
          0%, 100% {
            transform: translateY(0) scale(1);
          }
          50% {
            transform: translateY(-5px) scale(1.03);
          }
        }

        @keyframes itemDrop {
          0% {
            transform: translateY(-26px) scale(0.6) rotate(-15deg);
            opacity: 0;
          }
          50% {
            transform: translateY(0px) scale(1.1) rotate(5deg);
            opacity: 1;
          }
          85% {
            transform: translateY(6px) scale(0.95);
            opacity: 0.9;
          }
          100% {
            transform: translateY(12px) scale(0.8);
            opacity: 0;
          }
        }

        @keyframes shimmerLine {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }

        @keyframes pulseHalo {
          0%, 100% {
            box-shadow: 0 0 20px rgba(229, 40, 96, 0.25), 0 0 40px rgba(229, 40, 96, 0.1);
          }
          50% {
            box-shadow: 0 0 35px rgba(229, 40, 96, 0.5), 0 0 60px rgba(229, 40, 96, 0.2);
          }
        }

        .bag-container {
          animation: bagFloat 2.2s ease-in-out infinite;
        }

        .dropping-item {
          animation: itemDrop 0.9s cubic-bezier(0.34, 1.3, 0.64, 1) infinite;
        }

        .shimmer-progress {
          animation: shimmerLine 1.6s ease-in-out infinite;
        }
      `}</style>

      {/* Center Animation: Products Dropping into Glow Shopping Bag */}
      <div style={{ position: "relative", width: "90px", height: "90px", marginBottom: "18px" }}>
        {/* Soft Pink Background Glow Orb */}
        <div
          style={{
            position: "absolute",
            inset: "-10px",
            background: "radial-gradient(circle, rgba(229, 40, 96, 0.2) 0%, rgba(229, 40, 96, 0) 70%)",
            borderRadius: "50%",
          }}
        />

        {/* Animated Flying Cosmetic Products Dropping Into Bag */}
        <div
          key={activeItem}
          className="dropping-item"
          style={{
            position: "absolute",
            top: "2px",
            left: "calc(50% - 16px)",
            fontSize: "28px",
            zIndex: 10,
            pointerEvents: "none",
            filter: "drop-shadow(0 3px 6px rgba(0,0,0,0.15))",
          }}
        >
          {productIcons[activeItem].emoji}
        </div>

        {/* Shopping Tote / Bag Icon with Glow */}
        <div
          className="bag-container"
          style={{
            position: "absolute",
            bottom: "0",
            left: "calc(50% - 32px)",
            width: "64px",
            height: "64px",
            borderRadius: "18px",
            backgroundColor: "#ffffff",
            border: "2px solid #fce7f0",
            boxShadow: "0 8px 25px rgba(229, 40, 96, 0.22)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 5,
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "14px",
              background: "linear-gradient(135deg, #e52860 0%, #db2777 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
            }}
          >
            <ShoppingBag size={24} strokeWidth={2.4} />
          </div>

          {/* Sparkle badge on corner */}
          <div
            style={{
              position: "absolute",
              top: "-4px",
              right: "-4px",
              backgroundColor: "#ffedd5",
              border: "1.5px solid #fdba74",
              borderRadius: "50%",
              width: "20px",
              height: "20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Sparkles size={11} color="#ea580c" />
          </div>
        </div>
      </div>

      {/* Main Title */}
      <div
        style={{
          fontSize: "16px",
          fontWeight: "900",
          letterSpacing: "0.5px",
          color: "#0e1e38",
          marginBottom: "4px",
          display: "flex",
          alignItems: "center",
          gap: "6px",
        }}
      >
        <span>{text}</span>
      </div>

      {/* Dynamic current product loading indicator */}
      <div
        style={{
          fontSize: "12px",
          color: "#e52860",
          fontWeight: "700",
          marginBottom: "12px",
          height: "18px",
          transition: "opacity 0.2s",
        }}
      >
        {productIcons[activeItem].name}
      </div>

      {/* Sleek Shimmer Loading Progress Bar */}
      <div
        style={{
          width: "160px",
          height: "4px",
          backgroundColor: "#f1f5f9",
          borderRadius: "999px",
          overflow: "hidden",
          position: "relative",
          marginBottom: "8px",
        }}
      >
        <div
          className="shimmer-progress"
          style={{
            width: "50%",
            height: "100%",
            background: "linear-gradient(90deg, #e52860 0%, #fb7185 100%)",
            borderRadius: "999px",
          }}
        />
      </div>

      {/* Subtext */}
      <div
        style={{
          fontSize: "11px",
          color: "#94a3b8",
          fontWeight: "600",
          letterSpacing: "0.4px",
          textTransform: "uppercase",
        }}
      >
        {subtext}
      </div>
    </div>
  );
}
