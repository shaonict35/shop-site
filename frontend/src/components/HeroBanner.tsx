"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { API_BASE, fetchWithCache, safeImageUrl } from "../utils/api";

export interface HeroBannerItem {
  id: string;
  title: string;
  subtitle?: string | null;
  mediaUrl: string;
  mediaType: "image" | "video" | "gif";
  ctaLink?: string | null;
  isActive: boolean;
  order: number;
}

const DEFAULT_SLIDES = [
  {
    id: "hero-default-1",
    title: "Premium Beauty Collection",
    subtitle: "Discover authentic skincare & cosmetics",
    mediaUrl: "/images/sliders/slider-1.png",
    mediaType: "image" as const,
    ctaLink: "/shop"
  },
  {
    id: "hero-default-2",
    title: "Exclusive Brand Offers",
    subtitle: "Special deals on international brands",
    mediaUrl: "/images/sliders/slider-2.png",
    mediaType: "image" as const,
    ctaLink: "/shop"
  }
];

export default function HeroBanner() {
  const [banners, setBanners] = useState<HeroBannerItem[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadBanners() {
      try {
        const data = await fetchWithCache(`${API_BASE}/hero-banners`);
        if (isMounted && Array.isArray(data) && data.length > 0) {
          const activeList = data.filter((b: any) => b.isActive !== false);
          if (activeList.length > 0) {
            setBanners(activeList);
          }
        }
      } catch (err) {
        console.warn("Could not load hero banners:", err);
      }
    }
    loadBanners();
    return () => { isMounted = false; };
  }, []);

  const slidesToRender = banners.length > 0 ? banners : DEFAULT_SLIDES;

  useEffect(() => {
    if (slidesToRender.length <= 1 || isPaused) return;
    const interval = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % slidesToRender.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [slidesToRender.length, isPaused]);

  const current = slidesToRender[activeIdx % slidesToRender.length];
  const isVideo = current.mediaType === "video" || current.mediaUrl.endsWith(".mp4") || current.mediaUrl.endsWith(".webm");
  const fullUrl = current.mediaUrl.startsWith("http") || current.mediaUrl.startsWith("data:")
    ? current.mediaUrl
    : (current.mediaUrl.startsWith("/") ? `${API_BASE.replace(/\/api\/?$/, "")}${current.mediaUrl}` : `${API_BASE.replace(/\/api\/?$/, "")}/${current.mediaUrl}`);

  return (
    <section
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      style={{
        width: "100%",
        position: "relative",
        overflow: "hidden",
        backgroundColor: "#0f172a",
        aspectRatio: "1920 / 600",
        maxHeight: "600px",
      }}
    >
      <Link href={current.ctaLink || "/shop"} style={{ display: "block", width: "100%", height: "100%" }}>
        {isVideo ? (
          <video
            src={fullUrl}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block"
            }}
          />
        ) : (
          <img
            src={fullUrl}
            alt={current.title}
            loading="eager"
            decoding="async"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block"
            }}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = "/images/sliders/slider-1.png";
            }}
          />
        )}
      </Link>

      {slidesToRender.length > 1 && (
        <div
          style={{
            position: "absolute",
            bottom: "16px",
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            gap: "8px",
            zIndex: 10
          }}
        >
          {slidesToRender.map((_, idx) => (
            <button
              key={idx}
              type="button"
              aria-label={`Slide ${idx + 1}`}
              onClick={() => setActiveIdx(idx)}
              style={{
                width: activeIdx === idx ? "24px" : "10px",
                height: "10px",
                borderRadius: "5px",
                backgroundColor: activeIdx === idx ? "#e63b7a" : "rgba(255, 255, 255, 0.6)",
                border: "none",
                cursor: "pointer",
                transition: "all 0.25s ease"
              }}
            />
          ))}
        </div>
      )}
    </section>
  );
}

