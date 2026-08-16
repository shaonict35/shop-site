"use client";

import React, { useEffect, useState } from "react";

export default function SplashScreen() {
  const [visible, setVisible] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Check if splash was already shown in this session
    const hasSeenSplash = sessionStorage.getItem("hasSeenSplash");
    const duration = hasSeenSplash ? 400 : 1200;

    const fadeTimer = setTimeout(() => {
      setFadeOut(true);
    }, duration);

    const hideTimer = setTimeout(() => {
      setVisible(false);
      sessionStorage.setItem("hasSeenSplash", "true");
    }, duration + 350);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className="splash-screen-overlay"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100dvh",
        backgroundColor: "#1a1a2e",
        backgroundImage: "radial-gradient(circle at center, #2a1b3d 0%, #1a1a2e 100%)",
        zIndex: 99999,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        opacity: fadeOut ? 0 : 1,
        visibility: fadeOut ? "hidden" : "visible",
        transition: "opacity 0.4s ease-out, visibility 0.4s linear",
        pointerEvents: fadeOut ? "none" : "auto",
        fontFamily: "'Outfit', sans-serif",
      }}
    >
      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          transform: fadeOut ? "scale(1.05)" : "scale(1)",
          transition: "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        {/* Animated outer glowing ring */}
        <div
          style={{
            width: "120px",
            height: "120px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, #e63b7a, #ffb703)",
            padding: "4px",
            boxShadow: "0 0 40px rgba(230, 59, 122, 0.4), 0 0 80px rgba(255, 183, 3, 0.2)",
            animation: "splashPulse 2s infinite ease-in-out",
            marginBottom: "20px",
          }}
        >
          <div
            style={{
              width: "100%",
              height: "100%",
              borderRadius: "50%",
              backgroundColor: "#1a1a2e",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
            }}
          >
            <img
              src="/cosmetics_circle_illustration.png"
              alt="GlowGoodly"
              style={{
                width: "80%",
                height: "80%",
                objectFit: "contain",
                filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.3))",
              }}
              onError={(e) => {
                // Fallback to text icon if image fails
                (e.currentTarget as HTMLElement).style.display = "none";
              }}
            />
          </div>
        </div>

        {/* Brand Name */}
        <h1
          style={{
            fontSize: "32px",
            fontWeight: "800",
            color: "#ffffff",
            letterSpacing: "-0.5px",
            margin: "0 0 6px 0",
            display: "flex",
            alignItems: "center",
            gap: "2px",
          }}
        >
          <span style={{ color: "#e63b7a" }}>Glow</span>
          <span style={{ color: "#ffb703" }}>Goodly</span>
        </h1>

        {/* Tagline */}
        <p
          style={{
            color: "rgba(255, 255, 255, 0.75)",
            fontSize: "13px",
            fontWeight: "500",
            letterSpacing: "1px",
            textTransform: "uppercase",
            margin: "0 0 28px 0",
            textAlign: "center",
          }}
        >
          100% Authentic Cosmetics BD
        </p>

        {/* Progress bar line */}
        <div
          style={{
            width: "140px",
            height: "4px",
            backgroundColor: "rgba(255, 255, 255, 0.1)",
            borderRadius: "999px",
            overflow: "hidden",
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              height: "100%",
              width: "100%",
              background: "linear-gradient(90deg, #e63b7a, #ffb703)",
              borderRadius: "999px",
              animation: "splashBar 1.2s ease-in-out forwards",
            }}
          />
        </div>
      </div>

      <style jsx global>{`
        @keyframes splashPulse {
          0%, 100% {
            transform: scale(1);
            box-shadow: 0 0 30px rgba(230, 59, 122, 0.4), 0 0 60px rgba(255, 183, 3, 0.2);
          }
          50% {
            transform: scale(1.05);
            box-shadow: 0 0 50px rgba(230, 59, 122, 0.6), 0 0 90px rgba(255, 183, 3, 0.35);
          }
        }
        @keyframes splashBar {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(0%);
          }
        }
      `}</style>
    </div>
  );
}
