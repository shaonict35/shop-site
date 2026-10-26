"use client";

import React, { useEffect, useState, useTransition, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Image from "next/image";

function GlobalLoaderContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState<boolean>(false);
  const [isPending, startTransition] = useTransition();

  // Reset loading state whenever pathname or query string settles
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 180);
    return () => clearTimeout(timer);
  }, [pathname, searchParams]);

  // Intercept client-side link navigation
  useEffect(() => {
    let safetyTimer: NodeJS.Timeout | null = null;

    const handleAnchorClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const anchor = target?.closest("a") as HTMLAnchorElement | null;

      if (!anchor || !anchor.href) return;

      // Ignore modified clicks (Ctrl, Cmd, Shift, right-click) or target="_blank"
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        anchor.target === "_blank" ||
        anchor.hasAttribute("download") ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey ||
        event.shiftKey
      ) {
        return;
      }

      // Check if link is same origin and a different route
      try {
        const targetUrl = new URL(anchor.href, window.location.href);
        const currentUrl = new URL(window.location.href);

        // Same domain
        if (targetUrl.origin === currentUrl.origin) {
          // Ignore anchor hash changes on same page
          if (
            targetUrl.pathname === currentUrl.pathname &&
            targetUrl.search === currentUrl.search &&
            targetUrl.hash !== currentUrl.hash
          ) {
            return;
          }

          // If navigating to different path or search params, trigger loader
          if (
            targetUrl.pathname !== currentUrl.pathname ||
            targetUrl.search !== currentUrl.search
          ) {
            startTransition(() => {
              setLoading(true);
            });

            // Safety timeout to prevent permanent freeze if navigation fails
            if (safetyTimer) clearTimeout(safetyTimer);
            safetyTimer = setTimeout(() => {
              setLoading(false);
            }, 6000);
          }
        }
      } catch {
        // Ignore invalid URLs
      }
    };

    // Custom window events to trigger loader programmatically
    const handleStartEvent = () => {
      setLoading(true);
      if (safetyTimer) clearTimeout(safetyTimer);
      safetyTimer = setTimeout(() => setLoading(false), 6000);
    };

    const handleStopEvent = () => {
      setLoading(false);
      if (safetyTimer) clearTimeout(safetyTimer);
    };

    const handlePopState = () => {
      setLoading(false);
      if (safetyTimer) clearTimeout(safetyTimer);
    };

    document.addEventListener("click", handleAnchorClick, { capture: true });
    window.addEventListener("glow-loading-start", handleStartEvent);
    window.addEventListener("glow-loading-stop", handleStopEvent);
    window.addEventListener("popstate", handlePopState);

    return () => {
      document.removeEventListener("click", handleAnchorClick, { capture: true });
      window.removeEventListener("glow-loading-start", handleStartEvent);
      window.removeEventListener("glow-loading-stop", handleStopEvent);
      window.removeEventListener("popstate", handlePopState);
      if (safetyTimer) clearTimeout(safetyTimer);
    };
  }, []);

  if (!loading && !isPending) return null;

  return (
    <div
      id="global-page-transition-loader"
      className="global-page-loader-overlay"
      aria-label="Loading page content"
      role="status"
    >
      <div className="global-loader-container">
        {/* ── 3 Concentric Spinning Rings ── */}
        <div className="loader-ring loader-ring-outer" />
        <div className="loader-ring loader-ring-middle" />
        <div className="loader-ring loader-ring-inner" />

        {/* ── Centered Logo with Subtle Pulse ── */}
        <div className="loader-logo-wrapper">
          <img
            src="/user-glow-logo.png"
            alt="GlowGoodly Logo"
            className="loader-logo-img"
            onError={(e) => {
              // Fallback if image fails
              e.currentTarget.style.display = "none";
              const parent = e.currentTarget.parentElement;
              if (parent && !parent.querySelector(".fallback-text")) {
                const textSpan = document.createElement("span");
                textSpan.className = "fallback-text";
                textSpan.innerText = "✨";
                textSpan.style.fontSize = "32px";
                parent.appendChild(textSpan);
              }
            }}
          />
        </div>
      </div>

      {/* Brand Text & Loading Indicator */}
      <div className="loader-text-block">
        <span className="loader-brand-title">GlowGoodly</span>
        <div className="loader-dots-row">
          <span className="loader-dot dot-1" />
          <span className="loader-dot dot-2" />
          <span className="loader-dot dot-3" />
        </div>
      </div>

      <style jsx>{`
        .global-page-loader-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(255, 255, 255, 0.88);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          z-index: 999999;
          pointer-events: all;
          user-select: none;
          animation: fadeInOverlay 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .global-loader-container {
          position: relative;
          width: 170px;
          height: 170px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* ── Outer Ring: Clockwise, Smooth Gradient Accent ── */
        .loader-ring-outer {
          position: absolute;
          width: 160px;
          height: 160px;
          border-radius: 50%;
          border: 2px dashed rgba(230, 59, 122, 0.28);
          border-top: 2.5px solid #e63b7a;
          border-right: 2.5px solid transparent;
          animation: spinOuter 2.4s cubic-bezier(0.4, 0, 0.2, 1) infinite;
          box-shadow: 0 0 20px rgba(230, 59, 122, 0.12);
        }

        /* ── Middle Ring: Counter-Clockwise, Vibrant Pink ── */
        .loader-ring-middle {
          position: absolute;
          width: 124px;
          height: 124px;
          border-radius: 50%;
          border: 2.5px solid transparent;
          border-bottom: 2.5px solid #ff5e97;
          border-left: 2.5px solid #be185d;
          animation: spinMiddle 1.6s cubic-bezier(0.4, 0, 0.2, 1) infinite reverse;
        }

        /* ── Inner Ring: Clockwise Fast, Bright Accent ── */
        .loader-ring-inner {
          position: absolute;
          width: 90px;
          height: 90px;
          border-radius: 50%;
          border: 2.5px solid transparent;
          border-top: 2.5px solid #e63b7a;
          border-bottom: 2.5px solid #fda4af;
          animation: spinInner 1.1s linear infinite;
        }

        /* ── Centered Logo Frame ── */
        .loader-logo-wrapper {
          position: relative;
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: #ffffff;
          box-shadow: 0 4px 16px rgba(230, 59, 122, 0.18), 0 1px 4px rgba(0, 0, 0, 0.06);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 8px;
          z-index: 10;
          animation: logoGlowPulse 2s ease-in-out infinite;
        }

        .loader-logo-img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          border-radius: 50%;
        }

        /* ── Brand text & animated dots ── */
        .loader-text-block {
          margin-top: 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
        }

        .loader-brand-title {
          font-size: 15px;
          font-weight: 800;
          letter-spacing: 0.8px;
          color: #0f172a;
          text-transform: uppercase;
        }

        .loader-dots-row {
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .loader-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #e63b7a;
          animation: dotBounce 1.4s infinite ease-in-out both;
        }

        .dot-1 {
          animation-delay: -0.32s;
        }
        .dot-2 {
          animation-delay: -0.16s;
        }
        .dot-3 {
          animation-delay: 0s;
        }

        /* ── Keyframe Animations ── */
        @keyframes spinOuter {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        @keyframes spinMiddle {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        @keyframes spinInner {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        @keyframes logoGlowPulse {
          0%, 100% {
            transform: scale(1);
            box-shadow: 0 4px 16px rgba(230, 59, 122, 0.18), 0 0 0 0 rgba(230, 59, 122, 0.3);
          }
          50% {
            transform: scale(1.06);
            box-shadow: 0 6px 22px rgba(230, 59, 122, 0.32), 0 0 0 6px rgba(230, 59, 122, 0.08);
          }
        }

        @keyframes dotBounce {
          0%, 80%, 100% {
            transform: scale(0);
            opacity: 0.4;
          }
          40% {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes fadeInOverlay {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}

export default function GlobalLoader() {
  return (
    <Suspense fallback={null}>
      <GlobalLoaderContent />
    </Suspense>
  );
}
