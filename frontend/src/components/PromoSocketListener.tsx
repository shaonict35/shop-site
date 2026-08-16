"use client";

import React, { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import Link from "next/link";
import { Sparkles, X, Tag, ExternalLink, Copy, Check } from "lucide-react";
import { API_ROOT } from "../utils/api";

interface PromoData {
  id: string;
  title: string;
  message: string;
  code?: string;
  discount?: string;
  link?: string;
  image?: string;
  timestamp?: string;
}

export default function PromoSocketListener() {
  const [promo, setPromo] = useState<PromoData | null>(null);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const socket: Socket = io(API_ROOT, {
      transports: ["websocket", "polling"]
    });

    socket.on("connect", () => {
      console.log("⚡ Connected to GlowGoodly Socket.io Promo Server");
    });

    socket.on("promo:message", (data: PromoData) => {
      if (data && data.title) {
        setPromo(data);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  if (!promo || dismissedIds.includes(promo.id)) return null;

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDismiss = () => {
    setDismissedIds((prev) => [...prev, promo.id]);
    setPromo(null);
  };

  return (
    <div
      style={{
        position: "fixed",
        bottom: "24px",
        right: "24px",
        zIndex: 99999,
        maxWidth: "420px",
        width: "calc(100vw - 48px)",
        backgroundColor: "#ffffff",
        borderRadius: "20px",
        boxShadow: "0 20px 45px rgba(230, 59, 122, 0.25), 0 4px 15px rgba(0,0,0,0.08)",
        border: "2px solid #fecdd3",
        overflow: "hidden",
        animation: "slideInUp 0.4s ease-out forwards",
        fontFamily: "'Inter', system-ui, sans-serif"
      }}
    >
      <style jsx global>{`
        @keyframes slideInUp {
          from {
            transform: translateY(100px) scale(0.9);
            opacity: 0;
          }
          to {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
        }
      `}</style>

      {/* Header Banner */}
      <div
        style={{
          background: "linear-gradient(135deg, #e63b7a 0%, #be185d 100%)",
          color: "#ffffff",
          padding: "14px 18px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: "700", fontSize: "15px" }}>
          <Sparkles size={18} className="animate-bounce" />
          <span>{promo.title || "Special Promo Announcement!"}</span>
        </div>
        <button
          onClick={handleDismiss}
          style={{
            background: "rgba(255, 255, 255, 0.2)",
            border: "none",
            color: "#ffffff",
            borderRadius: "50%",
            width: "28px",
            height: "28px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            transition: "all 0.2s ease"
          }}
        >
          <X size={16} />
        </button>
      </div>

      {/* Body Content */}
      <div style={{ padding: "18px" }}>
        {promo.image && (
          <img
            src={promo.image}
            alt="Promo"
            style={{ width: "100%", height: "140px", objectFit: "cover", borderRadius: "12px", marginBottom: "14px" }}
          />
        )}

        <p style={{ color: "#334155", fontSize: "14px", lineHeight: "1.5", margin: "0 0 14px 0", fontWeight: "500" }}>
          {promo.message}
        </p>

        {/* Coupon Box */}
        {promo.code && (
          <div
            style={{
              backgroundColor: "#fff1f2",
              border: "1.5px dashed #f43f5e",
              borderRadius: "12px",
              padding: "10px 14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "14px"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Tag size={16} color="#e63b7a" />
              <div>
                <div style={{ fontSize: "11px", color: "#9f1239", textTransform: "uppercase", fontWeight: "700" }}>
                  Promo Coupon Code
                </div>
                <div style={{ fontSize: "16px", fontWeight: "800", color: "#881337", letterSpacing: "0.5px" }}>
                  {promo.code}
                </div>
              </div>
            </div>
            <button
              onClick={() => handleCopy(promo.code || "")}
              style={{
                backgroundColor: copied ? "#16a34a" : "#e63b7a",
                color: "#ffffff",
                border: "none",
                borderRadius: "8px",
                padding: "6px 12px",
                fontSize: "12px",
                fontWeight: "700",
                display: "flex",
                alignItems: "center",
                gap: "5px",
                cursor: "pointer"
              }}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        )}

        {/* Action Button */}
        <div style={{ display: "flex", gap: "10px" }}>
          <Link
            href={promo.link || "/shop"}
            onClick={handleDismiss}
            style={{
              flex: 1,
              backgroundColor: "#e63b7a",
              color: "#ffffff",
              textDecoration: "none",
              padding: "10px",
              borderRadius: "10px",
              textAlign: "center",
              fontWeight: "700",
              fontSize: "14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              boxShadow: "0 4px 12px rgba(230, 59, 122, 0.3)"
            }}
          >
            <span>Claim Offer Now</span>
            <ExternalLink size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}
