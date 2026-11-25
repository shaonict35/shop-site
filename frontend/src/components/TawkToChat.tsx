"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

declare global {
  interface Window {
    Tawk_API?: any;
    Tawk_LoadStart?: any;
  }
}

/**
 * TawkToChat — 100% Official Free Plan Tawk.to Live Chat Integration for GlowGoodly
 * Property ID: 6b069014398c563cb23977c4
 * Widget ID: 1k88q5k7e
 * 
 * Features:
 * - Free plan branding preserved
 * - No paid add-ons or subscriptions
 * - Asynchronous Next.js App Router client-side injection
 * - Zero hydration mismatch
 * - Duplicate script tag prevention across page transitions
 * - Automatically hidden on Admin and Valobasa dashboard routes
 */
export default function TawkToChat() {
  const pathname = usePathname();
  const isAdminRoute = Boolean(
    pathname?.startsWith("/valobasa") ||
    pathname?.startsWith("/admin")
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    const isNativeMode = typeof window !== "undefined" && localStorage.getItem("gg_chat_mode") === "native";

    // 1. If currently on Admin / Valobasa route or native chat is active, hide widget
    if (isAdminRoute || isNativeMode) {
      if (window.Tawk_API?.hideWidget) {
        try {
          window.Tawk_API.hideWidget();
        } catch (_) { }
      }
      return;
    }

    // 2. If navigating back to customer storefront and widget exists, show it
    if (window.Tawk_API?.showWidget) {
      try {
        window.Tawk_API.showWidget();
      } catch (_) { }
    }

    // 3. Avoid duplicate script injection if already added
    if (document.getElementById("tawk-to-script")) {
      return;
    }

    // 4. Inject official Tawk.to embed script
    window.Tawk_API = window.Tawk_API || {};
    window.Tawk_LoadStart = new Date();

    const s1 = document.createElement("script");
    s1.id = "tawk-to-script";
    s1.async = true;
    s1.src = "https://embed.tawk.to/6b069014398c563cb23977c4/1k88q5k7e";
    s1.charset = "UTF-8";
    s1.setAttribute("crossorigin", "*");

    const firstScript = document.getElementsByTagName("script")[0];
    if (firstScript && firstScript.parentNode) {
      firstScript.parentNode.insertBefore(s1, firstScript);
    } else {
      document.head.appendChild(s1);
    }

    return () => {
      // If unmounted or navigating to admin, hide widget cleanly
      if (window.Tawk_API?.hideWidget) {
        try {
          window.Tawk_API.hideWidget();
        } catch (_) { }
      }
    };
  }, [pathname, isAdminRoute]);

  return null;
}
