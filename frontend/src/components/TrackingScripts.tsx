"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useApp } from "../context/AppContext";

export default function TrackingScripts() {
  const { trackingSettings } = useApp();
  const pathname = usePathname();

  const pixelId = trackingSettings?.META_PIXEL_ID || "921781274061851";

  // 1. Initialize Meta Pixel, GA4, GTM
  useEffect(() => {
    const { GA4_MEASUREMENT_ID, GTM_CONTAINER_ID } = trackingSettings as any;

    if (pixelId && typeof window !== "undefined") {
      if (!window.hasOwnProperty("fbq")) {
        console.log(`[Analytics] Initializing Meta Pixel ID = ${pixelId}`);
        (function (f: any, b: any, e: any, v: any, n?: any, t?: any, s?: any) {
          if (f.fbq) return;
          n = f.fbq = function () {
            n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
          };
          if (!f._fbq) f._fbq = n;
          n.push = n;
          n.loaded = !0;
          n.version = "2.0";
          n.queue = [];
          t = b.createElement(e);
          t.async = !0;
          t.src = v;
          s = b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t, s);
        })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");

        (window as any).fbq("init", pixelId);
        (window as any).fbq("track", "PageView");
      }
    }

    // Inject Google Analytics (GA4)
    if (GA4_MEASUREMENT_ID && typeof window !== "undefined" && !(window as any).dataLayer) {
      const script = document.createElement("script");
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${GA4_MEASUREMENT_ID}`;
      document.head.appendChild(script);

      (window as any).dataLayer = (window as any).dataLayer || [];
      function gtag(...args: any[]) {
        (window as any).dataLayer.push(arguments);
      }
      (window as any).gtag = gtag;
      gtag("js", new Date());
      gtag("config", GA4_MEASUREMENT_ID);
    }

    // Inject Google Tag Manager (GTM)
    if (GTM_CONTAINER_ID && typeof window !== "undefined" && !document.getElementById("gtm-script")) {
      (function (w: any, d: any, s: any, l: any, i: any) {
        w[l] = w[l] || [];
        w[l].push({ "gtm.start": new Date().getTime(), event: "gtm.js" });
        var f = d.getElementsByTagName(s)[0],
          j = d.createElement(s),
          dl = l != "dataLayer" ? "&l=" + l : "";
        j.async = true;
        j.src = "https://www.googletagmanager.com/gtm.js?id=" + i + dl;
        j.id = "gtm-script";
        f.parentNode.insertBefore(j, f);
      })(window, document, "script", "dataLayer", GTM_CONTAINER_ID);
    }
  }, [trackingSettings, pixelId]);

  // 2. Track PageView automatically on every single page navigation across the website
  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).fbq) {
      (window as any).fbq("track", "PageView");
    }
  }, [pathname]);

  return null;
}
