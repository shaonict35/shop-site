"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

interface GlowLoaderProps {
  text?: string;
  subtext?: string;
  fullScreen?: boolean;
  autoDismiss?: boolean;
  dismissMs?: number;
}

export default function GlowLoader({
  text = "GLOWGOODLY",
  subtext = "100% Authentic Beauty & Cosmetics • Bangladesh",
  fullScreen = false,
  autoDismiss = true,
  dismissMs = 850,
}: GlowLoaderProps) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);
  const [progress, setProgress] = useState(25);
  const [navProgress, setNavProgress] = useState(0);
  const [isNavigating, setIsNavigating] = useState(false);
  const [logoError, setLogoError] = useState(false);

  // Initial page load smooth progress & auto-dismiss
  useEffect(() => {
    setMounted(true);

    const t1 = setTimeout(() => setProgress(65), 180);
    const t2 = setTimeout(() => setProgress(92), 450);
    const t3 = setTimeout(() => setProgress(100), 700);

    let fadeTimer: NodeJS.Timeout;
    let dismissTimer: NodeJS.Timeout;

    if (autoDismiss) {
      fadeTimer = setTimeout(() => {
        setFading(true);
      }, dismissMs);

      dismissTimer = setTimeout(() => {
        setVisible(false);
      }, dismissMs + 280);
    }

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      if (fadeTimer) clearTimeout(fadeTimer);
      if (dismissTimer) clearTimeout(dismissTimer);
    };
  }, [autoDismiss, dismissMs]);

  // Route change instant feedback: top progress bar animation across pages
  useEffect(() => {
    if (!mounted) return;
    setIsNavigating(true);
    setNavProgress(35);

    const nav1 = setTimeout(() => setNavProgress(80), 120);
    const nav2 = setTimeout(() => setNavProgress(100), 320);
    const navDone = setTimeout(() => {
      setIsNavigating(false);
      setNavProgress(0);
    }, 550);

    return () => {
      clearTimeout(nav1);
      clearTimeout(nav2);
      clearTimeout(navDone);
    };
  }, [pathname, mounted]);

  // Render top navigation progress bar on any route navigation
  const topNavBar = isNavigating ? (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "3.5px",
        zIndex: 9999999,
        pointerEvents: "none",
        backgroundColor: "rgba(230, 59, 122, 0.15)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          height: "100%",
          width: `${navProgress}%`,
          background: "linear-gradient(90deg, #e63b7a 0%, #d81b60 50%, #9333ea 100%)",
          boxShadow: "0 0 12px rgba(230, 59, 122, 0.8)",
          borderRadius: "0 2px 2px 0",
          transition: "width 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      />
    </div>
  ) : null;

  if (!mounted) return topNavBar;
  if (!fullScreen) return topNavBar;
  if (!visible && !isNavigating) return null;
  if (!visible) return topNavBar;

  return (
    <>
      {topNavBar}
      <div
        aria-hidden="true"
        style={{
          position: fullScreen ? "fixed" : "relative",
          inset: fullScreen ? 0 : "auto",
          width: "100%",
          height: fullScreen ? "100vh" : "290px",
          backgroundColor: fullScreen ? "rgba(255, 255, 255, 0.94)" : "transparent",
          backdropFilter: fullScreen ? "blur(10px)" : "none",
          WebkitBackdropFilter: fullScreen ? "blur(10px)" : "none",
          zIndex: fullScreen ? 999998 : 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          opacity: fading ? 0 : 1,
          pointerEvents: fading ? "none" : "auto",
          transition: "opacity 0.28s cubic-bezier(0.4, 0, 0.2, 1), transform 0.28s ease",
          transform: fading ? "scale(1.02)" : "scale(1)",
          userSelect: "none",
        }}
      >
        <style>{`
          @keyframes ggOrbitSpin {
            0% {
              transform: rotate(0deg);
            }
            100% {
              transform: rotate(360deg);
            }
          }

          @keyframes ggOrbitCounter {
            0% {
              transform: rotate(360deg);
            }
            100% {
              transform: rotate(0deg);
            }
          }

          @keyframes ggBreathingPulse {
            0%, 100% {
              transform: translateY(0) scale(1);
              box-shadow: 0 10px 30px rgba(230, 59, 122, 0.25), 0 0 0 1px rgba(230, 59, 122, 0.15);
            }
            50% {
              transform: translateY(-5px) scale(1.04);
              box-shadow: 0 16px 40px rgba(230, 59, 122, 0.4), 0 0 0 2px rgba(230, 59, 122, 0.3);
            }
          }

          @keyframes ggShimmerText {
            0% {
              background-position: -200% center;
            }
            100% {
              background-position: 200% center;
            }
          }

          @keyframes ggGlowPulse {
            0%, 100% {
              opacity: 0.55;
              transform: scale(0.96);
            }
            50% {
              opacity: 0.95;
              transform: scale(1.06);
            }
          }

          .gg-orbit-outer {
            animation: ggOrbitSpin 3.8s linear infinite;
          }

          .gg-orbit-inner {
            animation: ggOrbitCounter 2.6s linear infinite;
          }

          .gg-center-circle {
            animation: ggBreathingPulse 2.2s ease-in-out infinite;
          }

          .gg-shimmer-title {
            background: linear-gradient(90deg, #0f172a 0%, #e63b7a 40%, #d81b60 60%, #0f172a 100%);
            background-size: 250% 100%;
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            animation: ggShimmerText 3.2s ease-in-out infinite;
          }

          .gg-ambient-aura {
            animation: ggGlowPulse 2.4s ease-in-out infinite;
          }
        `}</style>

        {/* Ambient Radial Soft Glow */}
        <div
          className="gg-ambient-aura"
          style={{
            position: "absolute",
            width: "240px",
            height: "240px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(230, 59, 122, 0.2) 0%, rgba(216, 27, 96, 0.08) 50%, transparent 70%)",
            filter: "blur(20px)",
            pointerEvents: "none",
            zIndex: 0,
          }}
        />

        {/* Main Brand Logo Solar Orbiting Centerpiece */}
        <div
          style={{
            position: "relative",
            width: "165px",
            height: "165px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "20px",
            zIndex: 1,
          }}
        >
          {/* Ring 1: Solar Orbit Ring with Glowing Satellite Planet */}
          <div
            className="gg-orbit-outer"
            style={{
              position: "absolute",
              inset: "-16px",
              borderRadius: "50%",
              border: "1.5px solid rgba(230, 59, 122, 0.28)",
              boxShadow: "0 0 16px rgba(230, 59, 122, 0.12)",
            }}
          >
            {/* Glowing Orbiting Planet Dot on the Ring Line */}
            <div
              style={{
                position: "absolute",
                top: "-6px",
                left: "50%",
                transform: "translateX(-50%)",
                width: "12px",
                height: "12px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #ffffff 0%, #e63b7a 60%, #be185d 100%)",
                boxShadow: "0 0 10px #e63b7a, 0 0 18px rgba(230, 59, 122, 0.8)",
                border: "2px solid #ffffff",
              }}
            />
          </div>

          {/* Ring 2: Counter-Rotating Dashed Inner Aura Ring */}
          <div
            className="gg-orbit-inner"
            style={{
              position: "absolute",
              inset: "-4px",
              borderRadius: "50%",
              border: "2px dashed rgba(15, 23, 42, 0.25)",
              borderTopColor: "#e63b7a",
              borderRightColor: "#0f172a",
            }}
          />

          {/* Center Brand Glassmorphism Disc with Logo */}
          <div
            className="gg-center-circle"
            style={{
              width: "135px",
              height: "135px",
              borderRadius: "50%",
              backgroundColor: "#ffffff",
              border: "2.5px solid rgba(230, 59, 122, 0.35)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              zIndex: 10,
              overflow: "hidden",
              padding: "20px",
              boxShadow: "0 6px 20px rgba(230, 59, 122, 0.18)",
            }}
          >
            {!logoError ? (
              <img
                src="/logo.png"
                alt="GlowGoodly Logo"
                onError={() => setLogoError(true)}
                style={{
                  width: "100%",
                  height: "100%",
                  maxWidth: "76px",
                  maxHeight: "76px",
                  objectFit: "contain",
                  display: "block",
                  margin: "auto",
                }}
              />
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  textAlign: "center",
                }}
              >
                <span
                  style={{
                    fontSize: "26px",
                    fontWeight: "900",
                    color: "#e63b7a",
                    lineHeight: 1,
                    letterSpacing: "-0.5px",
                  }}
                >
                  GG
                </span>
                <span
                  style={{
                    fontSize: "8px",
                    fontWeight: "800",
                    color: "#0f172a",
                    letterSpacing: "1px",
                    marginTop: "2px",
                  }}
                >
                  GLOW
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Shimmering Brand Typography */}
        <div
          className="gg-shimmer-title"
          style={{
            fontSize: "20px",
            fontWeight: "900",
            letterSpacing: "3.5px",
            marginBottom: "6px",
            textTransform: "uppercase",
            fontFamily: "'Montserrat', -apple-system, BlinkMacSystemFont, sans-serif",
            zIndex: 1,
          }}
        >
          {text}
        </div>

        {/* Luxury Subtitle & Authenticity Seal */}
        <div
          style={{
            fontSize: "11px",
            fontWeight: "700",
            letterSpacing: "1px",
            color: "#64748b",
            marginBottom: "18px",
            textTransform: "uppercase",
            textAlign: "center",
            maxWidth: "320px",
            zIndex: 1,
          }}
        >
          {subtext}
        </div>

        {/* Brand Smooth Animated Progress Bar */}
        <div
          style={{
            width: "190px",
            height: "4px",
            backgroundColor: "#f1f5f9",
            borderRadius: "999px",
            overflow: "hidden",
            position: "relative",
            boxShadow: "inset 0 1px 2px rgba(0,0,0,0.06)",
            zIndex: 1,
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${progress}%`,
              background: "linear-gradient(90deg, #0f172a 0%, #e63b7a 50%, #d81b60 100%)",
              borderRadius: "999px",
              transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              boxShadow: "0 0 10px rgba(230, 59, 122, 0.6)",
            }}
          />
        </div>
      </div>
    </>
  );
}
