"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { fetchWithCache, API_BASE } from "../utils/api";
import CourierJourneyWidget from "./CourierJourneyWidget";
import { Sparkles, FileText, CheckCircle2 } from "lucide-react";

interface PolicyLayoutProps {
  currentTab: string;
  slug?: string;
  children?: React.ReactNode;
}

export default function PolicyLayout({ currentTab, slug, children }: PolicyLayoutProps) {
  const pathname = usePathname();
  const [pageData, setPageData] = useState<{ title?: string; contentHtml?: string; isCustomized?: boolean } | null>(null);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<"standard" | "custom">("standard");

  const links = [
    { name: "OUR STORY", href: "/about", slug: "about" },
    { name: "AUTHENTICITY", href: "/authenticity", slug: "authenticity" },
    { name: "SHIPPING & DELIVERY", href: "/shipping-delivery", slug: "shipping-delivery" },
    { name: "REFUND & RETURN POLICY", href: "/refund-policy", slug: "refund-policy" },
    { name: "TERMS & CONDITIONS", href: "/terms", slug: "terms" },
    { name: "PRIVACY POLICY", href: "/privacy-policy", slug: "privacy-policy" },
    { name: "FAQS", href: "/faq", slug: "faq" },
    { name: "POINTS", href: "/points", slug: "points" },
    { name: "CONTACT US", href: "/contact", slug: "contact" },
  ];

  const currentSlug = slug || links.find(l => l.name === currentTab || l.href === pathname)?.slug;

  const loadDynamicPage = async () => {
    if (!currentSlug) return;
    setLoading(true);
    try {
      const data = await fetchWithCache(`${API_BASE}/pages/${currentSlug}`, true);

      if (data && data.contentHtml) {
        setPageData(data);
        if (data.isCustomized) {
          setViewMode("custom");
        }
      }
    } catch (err) {
      console.warn("Using local fallback content for policy page:", currentSlug);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDynamicPage();
    const handleSync = () => loadDynamicPage();
    window.addEventListener("glowgoodly_data_updated", handleSync);
    return () => window.removeEventListener("glowgoodly_data_updated", handleSync);
  }, [currentSlug]);

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 15px" }}>
      {/* 🚚 ANIMATED COURIER JOURNEY WIDGET (Always visible at top of policy area) */}
      <CourierJourneyWidget />

      <div style={{ display: "flex", gap: "30px", alignItems: "flex-start", flexWrap: "wrap" }}>
        {/* Left Sticky Sidebar Navigation */}
        <aside 
          className="policy-sidebar"
          style={{ 
            flex: "0 0 260px", 
            backgroundColor: "#ffffff", 
            border: "1px solid #edf2f7", 
            borderRadius: "12px", 
            padding: "20px", 
            boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
            position: "sticky",
            top: "100px",
            display: "flex",
            flexDirection: "column",
            gap: "6px"
          }}
        >
          <h3 style={{ fontSize: "11px", fontWeight: "900", color: "#e52860", textTransform: "uppercase", letterSpacing: "1.2px", marginBottom: "12px", borderBottom: "2px solid #f5f5f5", paddingBottom: "8px" }}>
            POLICIES & PAGES
          </h3>
          {links.map((link) => {
            const isActive = pathname === link.href || currentTab === link.name;
            return (
              <Link 
                key={link.href} 
                href={link.href}
                style={{
                  display: "block",
                  padding: "10px 14px",
                  fontSize: "12px",
                  fontWeight: "700",
                  color: isActive ? "#e52860" : "#4a5568",
                  backgroundColor: isActive ? "#fff0f4" : "transparent",
                  borderRadius: "6px",
                  textDecoration: "none",
                  transition: "all 0.15s ease"
                }}
                onMouseEnter={(e) => {
                  if (!isActive && e?.currentTarget) e.currentTarget.style.color = "#e52860";
                }}
                onMouseLeave={(e) => {
                  if (!isActive && e?.currentTarget) e.currentTarget.style.color = "#4a5568";
                }}
              >
                {link.name}
              </Link>
            );
          })}
        </aside>

        {/* Right Side Content Panel */}
        <div 
          className="policy-content"
          style={{ 
            flex: 1, 
            minWidth: "300px", 
            backgroundColor: "#ffffff", 
            border: "1px solid #edf2f7", 
            borderRadius: "12px", 
            padding: "36px", 
            boxShadow: "0 4px 15px rgba(0,0,0,0.03)" 
          }}
        >
          {/* Admin Live CMS Customization Indicator & Toggle */}
          {pageData && pageData.contentHtml && pageData.isCustomized && (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                backgroundColor: "#fdf2f8",
                border: "1px solid #fbcfe8",
                borderRadius: "10px",
                padding: "10px 16px",
                marginBottom: "24px",
                fontSize: "12.5px"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#9d174d", fontWeight: "700" }}>
                <CheckCircle2 size={16} color="#db2777" />
                <span>Live Admin CMS Version Active for this page</span>
              </div>
              <div style={{ display: "flex", gap: "6px" }}>
                <button
                  type="button"
                  onClick={() => setViewMode("custom")}
                  style={{
                    padding: "4px 10px",
                    borderRadius: "6px",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "11px",
                    fontWeight: "700",
                    backgroundColor: viewMode === "custom" ? "#db2777" : "#ffffff",
                    color: viewMode === "custom" ? "#ffffff" : "#475569"
                  }}
                >
                  Admin Content
                </button>
                {children && (
                  <button
                    type="button"
                    onClick={() => setViewMode("standard")}
                    style={{
                      padding: "4px 10px",
                      borderRadius: "6px",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "11px",
                      fontWeight: "700",
                      backgroundColor: viewMode === "standard" ? "#db2777" : "#ffffff",
                      color: viewMode === "standard" ? "#ffffff" : "#475569"
                    }}
                  >
                    Interactive Tools
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Render Content Based on Mode */}
          {viewMode === "custom" && pageData && pageData.contentHtml ? (
            <div>
              <h2 style={{ fontSize: "22px", fontWeight: "900", color: "#0e1e38", marginBottom: "20px" }}>
                {pageData.title || currentTab}
              </h2>
              <div
                style={{
                  fontSize: "14px",
                  lineHeight: "1.8",
                  color: "#4a5568",
                  fontWeight: "500",
                }}
                dangerouslySetInnerHTML={{ __html: pageData.contentHtml }}
              />
            </div>
          ) : children ? (
            children
          ) : pageData && pageData.contentHtml ? (
            <div>
              <h2 style={{ fontSize: "22px", fontWeight: "900", color: "#0e1e38", marginBottom: "20px" }}>
                {pageData.title || currentTab}
              </h2>
              <div
                style={{
                  fontSize: "14px",
                  lineHeight: "1.8",
                  color: "#4a5568",
                  fontWeight: "500",
                }}
                dangerouslySetInnerHTML={{ __html: pageData.contentHtml }}
              />
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "40px 0", color: "#a0aec0", fontWeight: "600" }}>
              Loading content...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
