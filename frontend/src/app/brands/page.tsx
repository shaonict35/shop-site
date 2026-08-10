"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Header from "../../components/Header";
import PromoBanner from "../../components/PromoBanner";
import Footer from "../../components/Footer";
import MobileNavbar from "../../components/MobileNavbar";

interface Brand {
  id: string;
  name: string;
  logoUrl?: string | null;
}

export default function BrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [searchVal, setSearchVal] = useState("");
  const [loading, setLoading] = useState(true);

  const brandLogosMap: Record<string, string> = {
    "M.A.C": "/images/brands/mac.svg",
    "The Body Shop": "/images/brands/the-body-shop.svg",
    "NYX": "/images/brands/nyx.svg",
    "Maybelline": "/images/brands/maybelline.svg",
    "Revlon": "/images/brands/revlon.svg",
    "Wet n Wild": "/images/brands/wet-n-wild.svg",
    "e.l.f.": "/images/brands/elf.svg"
  };

  useEffect(() => {
    const fetchBrands = async (bypass: boolean = false) => {
      setLoading(true);
      try {
        const data = await fetchWithCache("http://localhost:5000/api/brands", bypass);
        if (Array.isArray(data)) {
          setBrands(data);
        }
      } catch (e) {
        console.error("Error loading brands", e);
      } finally {
        setLoading(false);
      }
    };
    fetchBrands();

    const handleSync = () => fetchBrands(true);
    window.addEventListener("glowgoodly_data_updated", handleSync);
    return () => window.removeEventListener("glowgoodly_data_updated", handleSync);
  }, []);

  const filteredBrands = brands.filter((b) =>
    b.name.toLowerCase().includes(searchVal.toLowerCase())
  );

  // Group brands by first letter
  const groupedBrands: Record<string, Brand[]> = {};
  filteredBrands.forEach((b) => {
    const letter = b.name.charAt(0).toUpperCase();
    if (!groupedBrands[letter]) {
      groupedBrands[letter] = [];
    }
    groupedBrands[letter].push(b);
  });

  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  return (
    <>
      <Header />
      <PromoBanner />

      <main className="container" style={{ padding: "40px 20px", minHeight: "85vh" }}>
        {/* Breadcrumbs */}
        <div style={{ fontSize: "13.5px", color: "#718096", fontWeight: "700", marginBottom: "25px" }}>
          <Link href="/">Home</Link> &nbsp;»&nbsp; <span style={{ color: "#e52860" }}>Brands</span>
        </div>

        <div style={{ borderBottom: "2px solid #f1f3f5", paddingBottom: "15px", marginBottom: "35px", display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "20px" }}>
          <div>
            <h1 style={{ fontSize: "28px", fontWeight: "900", color: "#0e1e38" }}>Shop By Brand</h1>
            <p style={{ fontSize: "14px", color: "#718096", fontWeight: "600", marginTop: "5px" }}>
              Explore cosmetics and beauty products from premium worldwide brands.
            </p>
          </div>

          <input
            type="text"
            placeholder="Search brands..."
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            style={{
              padding: "12px 20px",
              width: "300px",
              fontSize: "13.5px",
              fontWeight: "600",
              border: "1.5px solid #cbd5e0",
              borderRadius: "8px",
              outline: "none",
            }}
          />
        </div>

        {/* Alphabet Quick Links */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", justifyContent: "center", marginBottom: "40px", backgroundColor: "#f8fafc", padding: "15px", borderRadius: "10px", border: "1px solid #edf2f7" }}>
          {alphabet.map((letter) => {
            const hasBrands = groupedBrands[letter] && groupedBrands[letter].length > 0;
            return (
              <a
                href={hasBrands ? `#brand-group-${letter}` : undefined}
                key={letter}
                style={{
                  fontSize: "14px",
                  fontWeight: "800",
                  width: "32px",
                  height: "32px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "50%",
                  color: hasBrands ? "#e52860" : "#cbd5e0",
                  cursor: hasBrands ? "pointer" : "not-allowed",
                  textDecoration: "none",
                  backgroundColor: hasBrands ? "#fff5f7" : "transparent",
                  transition: "all 0.15s ease",
                }}
              >
                {letter}
              </a>
            );
          })}
        </div>

        {loading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "300px", fontSize: "16px", fontWeight: "700", color: "#e52860" }}>
            Loading cosmetic brands...
          </div>
        ) : filteredBrands.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#718096", fontSize: "15px", fontWeight: "700" }}>
            No brands found matching your search.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "45px" }}>
            {Object.keys(groupedBrands).sort().map((letter) => (
              <section id={`brand-group-${letter}`} key={letter} className="brand-group-section" style={{ borderBottom: "1px dashed #e2e8f0", paddingBottom: "30px" }}>

                {/* Alphabet label indicator */}
                <div style={{ fontSize: "36px", fontWeight: "900", color: "#e52860", marginBottom: "16px" }}>
                  {letter}
                </div>

                {/* Brands Logo Grid */}
                <div className="brand-logo-grid">
                  {groupedBrands[letter].map((b) => {
                    const logo = b.logoUrl || brandLogosMap[b.name] || "";
                    return (
                      <Link
                        href={`/shop?brand=${b.id}`}
                        key={b.id}
                        className="brand-card"
                        style={{
                          textDecoration: "none",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          border: "1.5px solid #edf2f7",
                          borderRadius: "12px",
                          padding: "12px",
                          backgroundColor: "#ffffff",
                          transition: "all 0.25s ease",
                          boxShadow: "0 3px 8px rgba(0,0,0,0.01)",
                          minHeight: "90px",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = "#e52860";
                          e.currentTarget.style.boxShadow = "0 6px 15px rgba(229,40,96,0.06)";
                          e.currentTarget.style.transform = "translateY(-2px)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = "#edf2f7";
                          e.currentTarget.style.boxShadow = "0 3px 8px rgba(0,0,0,0.01)";
                          e.currentTarget.style.transform = "translateY(0)";
                        }}
                      >
                        {logo ? (
                          <img
                            src={logo}
                            alt={b.name}
                            style={{ maxHeight: "40px", maxWidth: "85%", objectFit: "contain", marginBottom: "6px" }}
                          />
                        ) : (
                          <span style={{ fontSize: "13px", fontWeight: "900", color: "#4a5568", textTransform: "uppercase", letterSpacing: "0.2px", textAlign: "center" }}>
                            {b.name}
                          </span>
                        )}
                        <span style={{ fontSize: "10px", fontWeight: "800", color: "#718096", textTransform: "uppercase", textAlign: "center", marginTop: "4px" }}>
                          {b.name}
                        </span>
                      </Link>
                    );
                  })}
                </div>

              </section>
            ))}
          </div>
        )}
      </main>

      <Footer />
      <MobileNavbar />
    </>
  );
}
