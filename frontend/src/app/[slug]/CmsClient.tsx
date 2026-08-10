"use client";

import React, { useEffect, useState } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import MobileNavbar from "../../components/MobileNavbar";
import { useParams } from "next/navigation";

export default function CustomCmsPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const [page, setPage] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    const fetchPage = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/pages/${slug}`, { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          setPage(data);
        }
      } catch (err) {
        console.error("Error loading custom page:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPage();
  }, [slug]);

  return (
    <>
      <Header />

      {/* Auto-generated Banner Header for Custom Page */}
      <div
        style={{
          background: "linear-gradient(135deg, #e63b7a 0%, #ff758c 100%)",
          padding: "45px 20px",
          textAlign: "center",
          color: "#ffffff",
          boxShadow: "inset 0 -10px 20px rgba(0,0,0,0.05)"
        }}
      >
        <div className="container">
          <h1 style={{ fontSize: "28px", fontWeight: "900", margin: 0, textTransform: "uppercase", letterSpacing: "1px" }}>
            {page?.title || slug?.replace(/-/g, " ")}
          </h1>
          <p style={{ fontSize: "13px", opacity: 0.9, marginTop: "6px", fontWeight: "600" }}>
            GlowGoodly Official Page
          </p>
        </div>
      </div>

      {/* Main Page Middle Content */}
      <main className="container" style={{ padding: "40px 20px 80px 20px", minHeight: "50vh" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#e63b7a", fontWeight: "800" }}>
            Loading page content...
          </div>
        ) : page && page.contentHtml ? (
          <div
            style={{
              backgroundColor: "#ffffff",
              padding: "36px",
              borderRadius: "14px",
              border: "1px solid #e2e8f0",
              boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
              lineHeight: "1.7",
              fontSize: "14.5px",
              color: "#1e293b"
            }}
            dangerouslySetInnerHTML={{ __html: page.contentHtml }}
          />
        ) : (
          <div style={{ textAlign: "center", padding: "60px 0", backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
            <h2 style={{ fontSize: "20px", fontWeight: "800", color: "#0f172a" }}>Page Not Found</h2>
            <p style={{ color: "#64748b", fontSize: "13px", marginTop: "4px" }}>
              This page has not been published yet or is undergoing maintenance.
            </p>
          </div>
        )}
      </main>

      <Footer />
      <MobileNavbar />
    </>
  );
}
