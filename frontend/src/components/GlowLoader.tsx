"use client";

import React, { useState, useEffect } from "react";

interface GlowLoaderProps {
  text?: string;
  subtext?: string;
  fullScreen?: boolean;
  compact?: boolean;
}

const LUXURY_PHRASES = [
  "100% Authentic Guaranteed",
  "Curating Luxury Skincare & Cosmetics",
  "Direct Import • Seoul • Tokyo • Paris",
  "Dermatologist & Quality Verified",
];

export default function GlowLoader({
  text = "Loading Products...",
  subtext,
  fullScreen = false,
  compact = false,
}: GlowLoaderProps) {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [fadeState, setFadeState] = useState<"in" | "out">("in");

  useEffect(() => {
    if (subtext) return; // if custom subtext provided, don't cycle
    const interval = setInterval(() => {
      setFadeState("out");
      setTimeout(() => {
        setPhraseIndex((prev) => (prev + 1) % LUXURY_PHRASES.length);
        setFadeState("in");
      }, 300);
    }, 2400);

    return () => clearInterval(interval);
  }, [subtext]);

  const activeSubtext = subtext || LUXURY_PHRASES[phraseIndex];

  if (compact) {
    return (
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "10px",
          padding: "8px 14px",
          fontFamily: "'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        }}
      >
        <div
          style={{
            width: "20px",
            height: "20px",
            borderRadius: "50%",
            border: "2px solid rgba(226, 19, 110, 0.18)",
            borderTopColor: "#e2136e",
            animation: "luxurySpin 0.75s cubic-bezier(0.4, 0.1, 0.2, 1) infinite",
          }}
        />
        <span style={{ fontSize: "13px", fontWeight: "600", color: "#64748b" }}>
          {text}
        </span>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: fullScreen ? "0" : "50px 20px",
        minHeight: fullScreen ? "75vh" : "280px",
        width: "100%",
        fontFamily: "'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        position: "relative",
      }}
    >
      <style jsx>{`
        @keyframes luxurySpin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        @keyframes luxurySpinReverse {
          0% {
            transform: rotate(360deg);
          }
          100% {
            transform: rotate(0deg);
          }
        }

        @keyframes luxuryPulseHalo {
          0%, 100% {
            transform: scale(0.96);
            opacity: 0.55;
          }
          50% {
            transform: scale(1.1);
            opacity: 0.85;
          }
        }

        @keyframes luxuryShimmerBar {
          0% {
            left: -40%;
            width: 35%;
          }
          50% {
            left: 30%;
            width: 60%;
          }
          100% {
            left: 100%;
            width: 35%;
          }
        }

        @keyframes sparkleTwinkle {
          0%, 100% {
            opacity: 0.3;
            transform: scale(0.8) rotate(0deg);
          }
          50% {
            opacity: 1;
            transform: scale(1.2) rotate(45deg);
          }
        }
      `}</style>

      {/* Main Luxury Emblem Container */}
      <div
        style={{
          position: "relative",
          width: "96px",
          height: "96px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "20px",
        }}
      >
        {/* Soft Pink Radial Ambient Aura */}
        <div
          style={{
            position: "absolute",
            inset: "-16px",
            background: "radial-gradient(circle, rgba(226, 19, 110, 0.22) 0%, rgba(244, 63, 94, 0.08) 50%, transparent 72%)",
            borderRadius: "50%",
            animation: "luxuryPulseHalo 3s ease-in-out infinite",
            pointerEvents: "none",
          }}
        />

        {/* Outer Continuous Rotating Gradient Arc */}
        <div
          style={{
            position: "absolute",
            inset: "0px",
            borderRadius: "50%",
            border: "2.5px solid transparent",
            borderTopColor: "#e2136e",
            borderRightColor: "#f43f5e",
            animation: "luxurySpin 1.4s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite",
            filter: "drop-shadow(0 0 6px rgba(226, 19, 110, 0.35))",
          }}
        />

        {/* Inner Delicate Concentric Reverse Ring */}
        <div
          style={{
            position: "absolute",
            inset: "7px",
            borderRadius: "50%",
            border: "1px dashed rgba(226, 19, 110, 0.35)",
            animation: "luxurySpinReverse 6s linear infinite",
          }}
        />

        {/* Twinkling Luxury Sparkle 1 */}
        <div
          style={{
            position: "absolute",
            top: "-4px",
            right: "2px",
            color: "#e2136e",
            fontSize: "13px",
            animation: "sparkleTwinkle 2.2s ease-in-out infinite",
            pointerEvents: "none",
          }}
        >
          ✦
        </div>

        {/* Twinkling Luxury Sparkle 2 */}
        <div
          style={{
            position: "absolute",
            bottom: "-2px",
            left: "6px",
            color: "#f43f5e",
            fontSize: "11px",
            animation: "sparkleTwinkle 1.8s ease-in-out 0.8s infinite",
            pointerEvents: "none",
          }}
        >
          ✦
        </div>

        {/* Center Floating Disc with Official Brand Logo */}
        <div
          style={{
            width: "66px",
            height: "66px",
            borderRadius: "50%",
            backgroundColor: "#ffffff",
            border: "1.5px solid rgba(226, 19, 110, 0.16)",
            boxShadow: "0 10px 24px -4px rgba(226, 19, 110, 0.18), 0 2px 8px rgba(0, 0, 0, 0.04)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2,
            overflow: "hidden",
            padding: "8px",
          }}
        >
          <img
            src="/user-glow-logo.png"
            alt="GlowGoodly"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              userSelect: "none",
              pointerEvents: "none",
            }}
            onError={(e) => {
              // Graceful fallback to glowing monogram if image path fails
              const target = e.currentTarget;
              target.style.display = "none";
              if (target.parentElement) {
                target.parentElement.innerHTML = `<span style="font-weight:900;color:#e2136e;font-size:22px;letter-spacing:-1px;">GG</span>`;
              }
            }}
          />
        </div>
      </div>

      {/* Brand Header */}
      <div
        style={{
          fontSize: "10.5px",
          fontWeight: "800",
          letterSpacing: "3px",
          textTransform: "uppercase",
          color: "#e2136e",
          marginBottom: "5px",
        }}
      >
        GLOWGOODLY
      </div>

      {/* Main Status Text */}
      <div
        style={{
          fontSize: "15px",
          fontWeight: "800",
          color: "#0f172a",
          marginBottom: "12px",
          textAlign: "center",
          letterSpacing: "0.2px",
        }}
      >
        {text}
      </div>

      {/* Precision Luxury Shimmer Line Indicator */}
      <div
        style={{
          width: "140px",
          height: "3px",
          backgroundColor: "rgba(226, 19, 110, 0.1)",
          borderRadius: "999px",
          overflow: "hidden",
          position: "relative",
          marginBottom: "12px",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "0",
            bottom: "0",
            background: "linear-gradient(90deg, #e2136e 0%, #f43f5e 50%, #fda4af 100%)",
            borderRadius: "999px",
            boxShadow: "0 0 8px rgba(226, 19, 110, 0.5)",
            animation: "luxuryShimmerBar 1.5s cubic-bezier(0.4, 0, 0.2, 1) infinite",
          }}
        />
      </div>

      {/* Dynamic Rotating Luxury Subtext Assurance */}
      <div
        style={{
          fontSize: "12px",
          color: "#64748b",
          fontWeight: "600",
          letterSpacing: "0.3px",
          textAlign: "center",
          minHeight: "18px",
          opacity: fadeState === "in" ? 1 : 0,
          transform: fadeState === "in" ? "translateY(0)" : "translateY(3px)",
          transition: "opacity 0.3s ease, transform 0.3s ease",
        }}
      >
        {activeSubtext}
      </div>
    </div>
  );
}
