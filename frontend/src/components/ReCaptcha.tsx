"use client";

import React, { useEffect, useRef, useState } from "react";

interface ReCaptchaProps {
  siteKey?: string;
  onVerify: (token: string) => void;
  onExpire?: () => void;
}

declare global {
  interface Window {
    grecaptcha?: {
      ready: (cb: () => void) => void;
      render: (container: HTMLElement | string, parameters: any) => number;
      reset: (widgetId?: number) => void;
      getResponse: (widgetId?: number) => string;
    };
    onGrecaptchaLoaded?: () => void;
  }
}

export default function ReCaptcha({
  siteKey = "6LfFxbMtAAAAAEYjy9I2zALRD-VTo6mOsjEWl-vd",
  onVerify,
  onExpire
}: ReCaptchaProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<number | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    // Callback when script is ready
    const initWidget = () => {
      if (!isMounted || !containerRef.current || !window.grecaptcha) return;
      try {
        window.grecaptcha.ready(() => {
          if (!containerRef.current || widgetIdRef.current !== null) return;
          try {
            // Clear any prior DOM content inside container
            containerRef.current.innerHTML = "";
            const wid = window.grecaptcha!.render(containerRef.current, {
              sitekey: siteKey,
              callback: (token: string) => {
                onVerify(token);
              },
              "expired-callback": () => {
                if (onExpire) onExpire();
                else onVerify("");
              },
              "error-callback": () => {
                console.warn("reCAPTCHA encountered an error");
              },
              theme: "light",
              size: "normal"
            });
            widgetIdRef.current = wid;
            setIsLoaded(true);
          } catch (err) {
            console.error("Failed to render reCAPTCHA:", err);
          }
        });
      } catch (e) {
        console.error("reCAPTCHA ready error:", e);
      }
    };

    // Check if script already on page
    if (typeof window !== "undefined") {
      if (window.grecaptcha && window.grecaptcha.render) {
        initWidget();
      } else {
        const existingScript = document.getElementById("google-recaptcha-script");
        if (!existingScript) {
          const script = document.createElement("script");
          script.id = "google-recaptcha-script";
          script.src = "https://www.google.com/recaptcha/api.js?render=explicit";
          script.async = true;
          script.defer = true;
          script.onload = () => {
            initWidget();
          };
          script.onerror = () => {
            if (isMounted) setError(true);
          };
          document.head.appendChild(script);
        } else {
          // Poll until ready
          const interval = setInterval(() => {
            if (window.grecaptcha && window.grecaptcha.render) {
              clearInterval(interval);
              initWidget();
            }
          }, 300);
          setTimeout(() => clearInterval(interval), 10000);
        }
      }
    }

    return () => {
      isMounted = false;
    };
  }, [siteKey]);

  return (
    <div style={{ margin: "14px 0", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div ref={containerRef} style={{ minHeight: "78px" }} />
      {error && (
        <div style={{ fontSize: "12px", color: "#e11d48", marginTop: "4px" }}>
          Failed to load security verification. Please check your internet connection.
        </div>
      )}
    </div>
  );
}
