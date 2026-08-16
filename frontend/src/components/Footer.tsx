"use client";

import React from "react";
import Link from "next/link";
import { useApp } from "../context/AppContext";
import { API_BASE } from "../utils/api";

export default function Footer() {
  const { siteSettings } = useApp();
  const [footerMenus, setFooterMenus] = React.useState<any[]>([]);

  const loadFooterMenus = async () => {
    try {
      const res = await fetch(`${API_BASE}/menus?location=Footer`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setFooterMenus(data);
        }
      }
    } catch (err) {
      console.warn("Using default footer menus");
    }
  };

  React.useEffect(() => {
    loadFooterMenus();
    const handleSync = () => loadFooterMenus();
    window.addEventListener("glowgoodly_data_updated", handleSync);
    return () => window.removeEventListener("glowgoodly_data_updated", handleSync);
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%", marginTop: "auto" }}>

      {/* Purple Trust Badges Row (Full Width) - Attached Directly to Footer */}
      <div 
        style={{ 
          backgroundColor: "#821f9b", 
          color: "#ffffff", 
          padding: "60px 0", 
          width: "100%" 
        }}
      >
        <div 
          className="container footer-trust-badges" 
          style={{ 
            maxWidth: "1300px", 
            margin: "0 auto", 
            padding: "0 20px",
          }}
        >
          {/* Badge 1 */}
          <div className="footer-trust-badge">
            <span style={{ backgroundColor: "#e52860", color: "#ffffff", borderRadius: "50%", width: "64px", height: "64px", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "900", fontSize: "28px", boxShadow: "0 4px 10px rgba(0,0,0,0.12)", flexShrink: 0 }}>✓</span>
            <div style={{ textAlign: "left" }}>
              <div style={{ fontWeight: "900", fontSize: "20px", letterSpacing: "0.5px", lineHeight: "1.1" }}>100%</div>
              <div style={{ fontSize: "11px", fontWeight: "800", color: "#ffffff", textTransform: "uppercase", letterSpacing: "0.5px", marginTop: "2px" }}>AUTHENTIC PRODUCTS</div>
            </div>
          </div>
          {/* Badge 2 */}
          <div className="footer-trust-badge">
            <span style={{ backgroundColor: "#e52860", color: "#ffffff", borderRadius: "50%", width: "64px", height: "64px", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "900", fontSize: "28px", boxShadow: "0 4px 10px rgba(0,0,0,0.12)", flexShrink: 0 }}>🧴</span>
            <div style={{ textAlign: "left" }}>
              <div style={{ fontWeight: "900", fontSize: "20px", letterSpacing: "0.5px", lineHeight: "1.1" }}>15000+</div>
              <div style={{ fontSize: "11px", fontWeight: "800", color: "#ffffff", textTransform: "uppercase", letterSpacing: "0.5px", marginTop: "2px" }}>BEAUTY PRODUCTS</div>
            </div>
          </div>
          {/* Badge 3 */}
          <div className="footer-trust-badge">
            <span style={{ backgroundColor: "#e52860", color: "#ffffff", borderRadius: "50%", width: "64px", height: "64px", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "900", fontSize: "28px", boxShadow: "0 4px 10px rgba(0,0,0,0.12)", flexShrink: 0 }}>★</span>
            <div style={{ textAlign: "left" }}>
              <div style={{ fontWeight: "900", fontSize: "20px", letterSpacing: "0.5px", lineHeight: "1.1" }}>400+</div>
              <div style={{ fontSize: "11px", fontWeight: "800", color: "#ffffff", textTransform: "uppercase", letterSpacing: "0.5px", marginTop: "2px" }}>EXCLUSIVE BRANDS</div>
            </div>
          </div>
          {/* Badge 4 */}
          <div className="footer-trust-badge">
            <span style={{ backgroundColor: "#e52860", color: "#ffffff", borderRadius: "50%", width: "64px", height: "64px", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "900", fontSize: "28px", boxShadow: "0 4px 10px rgba(0,0,0,0.12)", flexShrink: 0 }}>💬</span>
            <div style={{ textAlign: "left" }}>
              <div style={{ fontWeight: "900", fontSize: "20px", letterSpacing: "0.5px", lineHeight: "1.1" }}>FREE</div>
              <div style={{ fontSize: "11px", fontWeight: "800", color: "#ffffff", textTransform: "uppercase", letterSpacing: "0.5px", marginTop: "2px" }}>BEAUTY CONSULTATION</div>
            </div>
          </div>
        </div>
      </div>

      {/* Dark Blue Footer Menu */}
      <footer
        style={{
          backgroundColor: "#0c1524",
          color: "#ffffff",
          padding: "50px 0 30px 0",
          fontSize: "12.5px",
        }}
      >
        <div className="container" style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 20px" }}>
          {/* Main Columns Grid */}
          <div className="footer-columns">
            {/* Column 1: Logo & Socials */}
            <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
              <h3
                className="footer-brand-title"
                style={{
                  fontSize: "24px",
                  fontWeight: "900",
                  letterSpacing: "1px",
                  margin: "0 0 10px 0",
                  textTransform: "uppercase",
                }}
              >
                GLOWGOODLY
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontWeight: "700" }}>
                <Link href="/about" style={{ color: "#ffffff", textDecoration: "none", textTransform: "uppercase" }}>Our Story</Link>
                <Link href="/blog" style={{ color: "#ffffff", textDecoration: "none", textTransform: "uppercase" }}>GlowGoodly Magazine</Link>
                <Link href="/join-our-team" style={{ color: "#ffffff", textDecoration: "none", textTransform: "uppercase" }}>Join Our Team</Link>
                <Link href="/authenticity" style={{ color: "#ffffff", textDecoration: "none", textTransform: "uppercase" }}>Authenticity</Link>
              </div>
              
              <div style={{ marginTop: "15px" }}>
                <h4 style={{ fontSize: "13px", fontWeight: "900", color: "#ffffff", textTransform: "uppercase", letterSpacing: "2.5px", marginBottom: "12px", whiteSpace: "nowrap" }}>
                  Share Your Love
                </h4>
                <div style={{ display: "flex", gap: "6px", flexWrap: "nowrap", alignItems: "center" }}>
                  {/* Facebook */}
                  <a href="https://www.facebook.com/glowgoodly" target="_blank" rel="noopener noreferrer" style={{ width: "30px", height: "30px", borderRadius: "50%", border: "1.5px solid #ffffff", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.2s", flexShrink: 0 }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#1877F2"; e.currentTarget.style.borderColor = "#1877F2"; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.borderColor = "#ffffff"; }} title="Facebook">
                    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
                  </a>
                  {/* Instagram */}
                  <a href="https://www.instagram.com/glowgoodly/" target="_blank" rel="noopener noreferrer" style={{ width: "30px", height: "30px", borderRadius: "50%", border: "1.5px solid #ffffff", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.2s", flexShrink: 0 }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#E1306C"; e.currentTarget.style.borderColor = "#E1306C"; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.borderColor = "#ffffff"; }} title="Instagram">
                    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
                  </a>
                  {/* TikTok */}
                  <a href="https://www.tiktok.com/@glowgoodly" target="_blank" rel="noopener noreferrer" style={{ width: "30px", height: "30px", borderRadius: "50%", border: "1.5px solid #ffffff", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.2s", flexShrink: 0 }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#010101"; e.currentTarget.style.borderColor = "#010101"; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.borderColor = "#ffffff"; }} title="TikTok">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.17 8.17 0 004.77 1.52V6.75a4.85 4.85 0 01-1-.06z"/>
                    </svg>
                  </a>
                  {/* Pinterest */}
                  <a href="https://www.pinterest.com/glowgoodly" target="_blank" rel="noopener noreferrer" style={{ width: "30px", height: "30px", borderRadius: "50%", border: "1.5px solid #ffffff", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.2s", flexShrink: 0 }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#E60023"; e.currentTarget.style.borderColor = "#E60023"; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.borderColor = "#ffffff"; }} title="Pinterest">
                    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.367 18.618 0 12.017 0z"/>
                    </svg>
                  </a>
                  {/* YouTube */}
                  <a href="https://www.youtube.com/@glowgoodly" target="_blank" rel="noopener noreferrer" style={{ width: "30px", height: "30px", borderRadius: "50%", border: "1.5px solid #ffffff", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.2s", flexShrink: 0 }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#FF0000"; e.currentTarget.style.borderColor = "#FF0000"; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.borderColor = "#ffffff"; }} title="YouTube">
                    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                    </svg>
                  </a>
                  {/* WhatsApp */}
                  <a href="https://wa.me/8801700000000" target="_blank" rel="noopener noreferrer" style={{ width: "30px", height: "30px", borderRadius: "50%", border: "1.5px solid #ffffff", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.2s", flexShrink: 0 }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#25D366"; e.currentTarget.style.borderColor = "#25D366"; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.borderColor = "#ffffff"; }} title="WhatsApp">
                    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                  </a>
                </div>

              </div>
            </div>

            {/* Column 2: Top Categories */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <h4 style={{ fontSize: "12px", fontWeight: "800", color: "#e52860", textTransform: "uppercase", letterSpacing: "0.5px", cursor: "default", transition: "color 0.2s" }} onMouseEnter={(e) => (e.currentTarget.style.color = "#ff6ba8")} onMouseLeave={(e) => (e.currentTarget.style.color = "#e52860")}>
                Top Categories
              </h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontWeight: "700" }}>
                <Link href="/shop?category=makeup" style={{ color: "#ffffff", textDecoration: "none", transition: "color 0.2s" }} onMouseEnter={(e) => (e.currentTarget.style.color = "#e52860")} onMouseLeave={(e) => (e.currentTarget.style.color = "#ffffff")}>MAKEUP</Link>
                <Link href="/shop?category=skincare" style={{ color: "#ffffff", textDecoration: "none", transition: "color 0.2s" }} onMouseEnter={(e) => (e.currentTarget.style.color = "#e52860")} onMouseLeave={(e) => (e.currentTarget.style.color = "#ffffff")}>SKIN</Link>
                <Link href="/shop?category=makeup" style={{ color: "#ffffff", textDecoration: "none", transition: "color 0.2s" }} onMouseEnter={(e) => (e.currentTarget.style.color = "#e52860")} onMouseLeave={(e) => (e.currentTarget.style.color = "#ffffff")}>EYE CARE</Link>
                <Link href="/shop?category=haircare" style={{ color: "#ffffff", textDecoration: "none", transition: "color 0.2s" }} onMouseEnter={(e) => (e.currentTarget.style.color = "#e52860")} onMouseLeave={(e) => (e.currentTarget.style.color = "#ffffff")}>HAIR</Link>
                <Link href="/shop?category=personal-care" style={{ color: "#ffffff", textDecoration: "none", transition: "color 0.2s" }} onMouseEnter={(e) => (e.currentTarget.style.color = "#e52860")} onMouseLeave={(e) => (e.currentTarget.style.color = "#ffffff")}>PERSONAL CARE</Link>
                <Link href="/shop?category=natural" style={{ color: "#ffffff", textDecoration: "none", transition: "color 0.2s" }} onMouseEnter={(e) => (e.currentTarget.style.color = "#e52860")} onMouseLeave={(e) => (e.currentTarget.style.color = "#ffffff")}>NATURAL</Link>
                <Link href="/shop?category=mom-baby" style={{ color: "#ffffff", textDecoration: "none", transition: "color 0.2s" }} onMouseEnter={(e) => (e.currentTarget.style.color = "#e52860")} onMouseLeave={(e) => (e.currentTarget.style.color = "#ffffff")}>MOM & BABY</Link>
              </div>
            </div>

            {/* Column 3: Quick Links */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <h4 style={{ fontSize: "12px", fontWeight: "800", color: "#e52860", textTransform: "uppercase", letterSpacing: "0.5px", cursor: "default", transition: "color 0.2s" }} onMouseEnter={(e) => (e.currentTarget.style.color = "#ff6ba8")} onMouseLeave={(e) => (e.currentTarget.style.color = "#e52860")}>
                Quick Links
              </h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontWeight: "700" }}>
                <Link href="/shop?tab=offers" style={{ color: "#ffffff", textDecoration: "none", transition: "color 0.2s" }} onMouseEnter={(e) => (e.currentTarget.style.color = "#e52860")} onMouseLeave={(e) => (e.currentTarget.style.color = "#ffffff")}>OFFERS</Link>
                <Link href="/shop?category=men" style={{ color: "#ffffff", textDecoration: "none", transition: "color 0.2s" }} onMouseEnter={(e) => (e.currentTarget.style.color = "#e52860")} onMouseLeave={(e) => (e.currentTarget.style.color = "#ffffff")}>MENS PRODUCTS</Link>
                <Link href="/shop?category=skincare" style={{ color: "#ffffff", textDecoration: "none", transition: "color 0.2s" }} onMouseEnter={(e) => (e.currentTarget.style.color = "#e52860")} onMouseLeave={(e) => (e.currentTarget.style.color = "#ffffff")}>SKIN CONCERNS</Link>
                <Link href="/shop?sort=newest" style={{ color: "#ffffff", textDecoration: "none", transition: "color 0.2s" }} onMouseEnter={(e) => (e.currentTarget.style.color = "#e52860")} onMouseLeave={(e) => (e.currentTarget.style.color = "#ffffff")}>NEW ARRIVAL</Link>
                <Link href="/shop?category=makeup" style={{ color: "#ffffff", textDecoration: "none", transition: "color 0.2s" }} onMouseEnter={(e) => (e.currentTarget.style.color = "#e52860")} onMouseLeave={(e) => (e.currentTarget.style.color = "#ffffff")}>MAKEUP</Link>
              </div>
            </div>

            {/* Column 4: All About Beauty */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <h4 style={{ fontSize: "12px", fontWeight: "800", color: "#e52860", textTransform: "uppercase", letterSpacing: "0.5px", cursor: "default", transition: "color 0.2s" }} onMouseEnter={(e) => (e.currentTarget.style.color = "#ff6ba8")} onMouseLeave={(e) => (e.currentTarget.style.color = "#e52860")}>
                All About Beauty
              </h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontWeight: "700" }}>
                <Link href={siteSettings?.ROUTINE_LINK || "/routine"} style={{ color: "#ffffff", textDecoration: "none", textTransform: "uppercase", transition: "color 0.2s" }} onMouseEnter={(e) => (e.currentTarget.style.color = "#e52860")} onMouseLeave={(e) => (e.currentTarget.style.color = "#ffffff")}>KNOW YOUR ROUTINE</Link>
                <Link href={siteSettings?.HAIR_CARE_101_LINK || "/hair-care-101"} style={{ color: "#ffffff", textDecoration: "none", textTransform: "uppercase", transition: "color 0.2s" }} onMouseEnter={(e) => (e.currentTarget.style.color = "#e52860")} onMouseLeave={(e) => (e.currentTarget.style.color = "#ffffff")}>HAIR CARE 101</Link>
                <Link href={siteSettings?.SKIN_CARE_101_LINK || "/skin-care-101"} style={{ color: "#ffffff", textDecoration: "none", textTransform: "uppercase", transition: "color 0.2s" }} onMouseEnter={(e) => (e.currentTarget.style.color = "#e52860")} onMouseLeave={(e) => (e.currentTarget.style.color = "#ffffff")}>SKIN CARE 101</Link>
                <Link href={siteSettings?.MAKEUP_101_LINK || "/makeup-101"} style={{ color: "#ffffff", textDecoration: "none", textTransform: "uppercase", transition: "color 0.2s" }} onMouseEnter={(e) => (e.currentTarget.style.color = "#e52860")} onMouseLeave={(e) => (e.currentTarget.style.color = "#ffffff")}>MAKEUP 101</Link>
              </div>
            </div>

            {/* Column 5: Help */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <h4 style={{ fontSize: "12px", fontWeight: "800", color: "#e52860", textTransform: "uppercase", letterSpacing: "0.5px", cursor: "default", transition: "color 0.2s" }} onMouseEnter={(e) => (e.currentTarget.style.color = "#ff6ba8")} onMouseLeave={(e) => (e.currentTarget.style.color = "#e52860")}>
                Help
              </h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontWeight: "700" }}>
                <Link href="/contact" style={{ color: "#ffffff", textDecoration: "none", transition: "color 0.2s" }} onMouseEnter={(e) => (e.currentTarget.style.color = "#e52860")} onMouseLeave={(e) => (e.currentTarget.style.color = "#ffffff")}>CONTACT US</Link>
                <Link href="/points" style={{ color: "#ffffff", textDecoration: "none", transition: "color 0.2s" }} onMouseEnter={(e) => (e.currentTarget.style.color = "#e52860")} onMouseLeave={(e) => (e.currentTarget.style.color = "#ffffff")}>POINTS</Link>
                <Link href="/faq" style={{ color: "#ffffff", textDecoration: "none", transition: "color 0.2s" }} onMouseEnter={(e) => (e.currentTarget.style.color = "#e52860")} onMouseLeave={(e) => (e.currentTarget.style.color = "#ffffff")}>FAQS</Link>
                <Link href="/shipping-delivery" style={{ color: "#ffffff", textDecoration: "none", transition: "color 0.2s" }} onMouseEnter={(e) => (e.currentTarget.style.color = "#e52860")} onMouseLeave={(e) => (e.currentTarget.style.color = "#ffffff")}>SHIPPING & DELIVERY</Link>
                <Link href="/terms" style={{ color: "#ffffff", textDecoration: "none", transition: "color 0.2s" }} onMouseEnter={(e) => (e.currentTarget.style.color = "#e52860")} onMouseLeave={(e) => (e.currentTarget.style.color = "#ffffff")}>TERMS & CONDITIONS</Link>
                <Link href="/refund-policy" style={{ color: "#ffffff", textDecoration: "none", transition: "color 0.2s" }} onMouseEnter={(e) => (e.currentTarget.style.color = "#e52860")} onMouseLeave={(e) => (e.currentTarget.style.color = "#ffffff")}>REFUND & RETURN POLICY</Link>
                <Link href="/privacy-policy" style={{ color: "#ffffff", textDecoration: "none", transition: "color 0.2s" }} onMouseEnter={(e) => (e.currentTarget.style.color = "#e52860")} onMouseLeave={(e) => (e.currentTarget.style.color = "#ffffff")}>PRIVACY POLICY</Link>
              </div>

              <div style={{ marginTop: "15px" }}>
                <h4 style={{ fontSize: "11px", fontWeight: "800", color: "#ffffff", textTransform: "uppercase", marginBottom: "10px" }}>
                  Payments Accepted
                </h4>
                <div style={{ display: "flex", gap: "8px", flexWrap: "nowrap", alignItems: "center" }}>
                  {/* bKash - Official Logo */}
                  <div style={{ backgroundColor: "#e2136e", display: "flex", alignItems: "center", justifyContent: "center", height: "36px", width: "60px", flexShrink: 0, borderRadius: "8px", boxShadow: "0 2px 6px rgba(226,19,110,0.35)", transition: "transform 0.2s, box-shadow 0.2s", overflow: "hidden", padding: "4px" }} onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 4px 12px rgba(226,19,110,0.5)"; }} onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 2px 6px rgba(226,19,110,0.35)"; }}>
                    <img src="/bkash-logo.png" alt="bKash" style={{ height: "28px", width: "28px", objectFit: "contain" }} />
                  </div>

                  {/* Mastercard */}
                  <div style={{ backgroundColor: "#0a0a0a", display: "flex", alignItems: "center", justifyContent: "center", height: "36px", width: "60px", flexShrink: 0, borderRadius: "8px", boxShadow: "0 2px 6px rgba(0,0,0,0.3)", transition: "transform 0.2s, box-shadow 0.2s" }} onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.5)"; }} onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 2px 6px rgba(0,0,0,0.3)"; }}>
                    <svg viewBox="0 0 52 32" width="46" height="28" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="18" cy="16" r="12" fill="#eb001b" />
                      <circle cx="34" cy="16" r="12" fill="#f79e1b" />
                      <ellipse cx="26" cy="16" rx="5" ry="12" fill="#ff5f00" />
                    </svg>
                  </div>
                  {/* VISA - Official Uploaded Image */}
                  <div style={{ backgroundColor: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", height: "36px", width: "60px", flexShrink: 0, borderRadius: "8px", border: "1px solid #e2e8f0", boxShadow: "0 2px 6px rgba(0,0,0,0.12)", transition: "transform 0.2s, box-shadow 0.2s", padding: "2px" }} onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.2)"; }} onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 2px 6px rgba(0,0,0,0.12)"; }}>
                    <img src="/visa-logo.png" alt="VISA" style={{ height: "26px", maxWidth: "90%", objectFit: "contain" }} />
                  </div>

                </div>
              </div>
            </div>
          </div>

          <hr style={{ border: "none", borderTop: "1px solid #1a2333", margin: "25px 0" }} />

          {/* Legal Links Row & Copyright */}
          <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: "14px" }}>
            <div
              className="footer-glowgoodly-text"
              style={{
                display: "flex",
                justifyContent: "space-between",
                width: "100%",
                maxWidth: "780px",
                margin: "0 auto 10px auto",
                fontSize: "64px",
                fontWeight: "900",
                color: "transparent",
                WebkitTextStroke: "1.5px rgba(255, 255, 255, 0.6)",
                lineHeight: "1.2",
                textTransform: "uppercase",
                userSelect: "none",
                fontFamily: "system-ui, -apple-system, sans-serif",
                cursor: "pointer",
                transition: "all 0.3s ease"
              }}
              onMouseEnter={(e) => {
                const spans = e.currentTarget.querySelectorAll('span');
                const colors = ['#ff3366','#ff4d6d','#e52860','#ff1a5e','#e63b7a','#ff4488','#e52860','#ff3366','#ff4d6d','#e52860'];
                spans.forEach((s: Element, i: number) => {
                  (s as HTMLElement).style.color = colors[i] || '#e52860';
                  (s as HTMLElement).style.webkitTextStroke = '0px';
                  (s as HTMLElement).style.backgroundImage = `linear-gradient(135deg, #ff3366 0%, #e52860 50%, #c42050 100%)`;
                  (s as HTMLElement).style.webkitBackgroundClip = 'text';
                  (s as HTMLElement).style.backgroundClip = 'text';
                  (s as HTMLElement).style.webkitTextFillColor = 'transparent';
                });
              }}
              onMouseLeave={(e) => {
                const spans = e.currentTarget.querySelectorAll('span');
                spans.forEach((s: Element) => {
                  (s as HTMLElement).style.color = 'transparent';
                  (s as HTMLElement).style.webkitTextStroke = '1.5px rgba(255,255,255,0.6)';
                  (s as HTMLElement).style.backgroundImage = '';
                  (s as HTMLElement).style.webkitBackgroundClip = '';
                  (s as HTMLElement).style.backgroundClip = '';
                  (s as HTMLElement).style.webkitTextFillColor = '';
                });
              }}
            >
              <span style={{ transition: "all 0.3s ease" }}>G</span>
              <span style={{ transition: "all 0.3s ease" }}>L</span>
              <span style={{ transition: "all 0.3s ease" }}>O</span>
              <span style={{ transition: "all 0.3s ease" }}>W</span>
              <span style={{ transition: "all 0.3s ease" }}>G</span>
              <span style={{ transition: "all 0.3s ease" }}>O</span>
              <span style={{ transition: "all 0.3s ease" }}>O</span>
              <span style={{ transition: "all 0.3s ease" }}>D</span>
              <span style={{ transition: "all 0.3s ease" }}>L</span>
              <span style={{ transition: "all 0.3s ease" }}>Y</span>
            </div>
            <div className="footer-legal-links" style={{ 
              display: "flex",
              justifyContent: "center",
              flexWrap: "wrap",
              gap: "12px",
              width: "100%",
              maxWidth: "780px",
              margin: "0 auto",
              fontWeight: "800", 
              fontSize: "11px", 
              letterSpacing: "0.5px",
              textAlign: "center"
            }}>
              <Link href="/authenticity" style={{ color: "#ffffff", textDecoration: "none", transition: "color 0.2s" }} onMouseEnter={(e) => (e.currentTarget.style.color = '#e52860')} onMouseLeave={(e) => (e.currentTarget.style.color = '#ffffff')}>AUTHENTICITY</Link>
              <Link href="/terms" style={{ color: "#ffffff", textDecoration: "none", transition: "color 0.2s" }} onMouseEnter={(e) => (e.currentTarget.style.color = '#e52860')} onMouseLeave={(e) => (e.currentTarget.style.color = '#ffffff')}>TERMS & CONDITIONS</Link>
              <Link href="/privacy-policy" style={{ color: "#ffffff", textDecoration: "none", transition: "color 0.2s" }} onMouseEnter={(e) => (e.currentTarget.style.color = '#e52860')} onMouseLeave={(e) => (e.currentTarget.style.color = '#ffffff')}>PRIVACY POLICY</Link>
              <Link href="/refund-policy" style={{ color: "#ffffff", textDecoration: "none", transition: "color 0.2s" }} onMouseEnter={(e) => (e.currentTarget.style.color = '#e52860')} onMouseLeave={(e) => (e.currentTarget.style.color = '#ffffff')}>REFUND & RETURN POLICY</Link>
              <Link href="/faq" style={{ color: "#ffffff", textDecoration: "none", transition: "color 0.2s" }} onMouseEnter={(e) => (e.currentTarget.style.color = '#e52860')} onMouseLeave={(e) => (e.currentTarget.style.color = '#ffffff')}>FAQS</Link>
            </div>
            <p style={{ color: "#a0aec0", fontSize: "11px", fontWeight: "600", marginTop: "5px" }}>
              Copyright © 2026 GlowGoodly. All Rights Reserved.
            </p>

          </div>
        </div>
      </footer>
      {/* Scroll to Top Arrow Button */}
      <div 
        className="scroll-to-top-btn"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        style={{
          position: "fixed",
          bottom: "105px",
          right: "40px",
          backgroundColor: "rgba(255, 255, 255, 0.5)", 
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          border: "1px solid rgba(229, 40, 96, 0.3)",
          color: "#e52860",
          width: "42px",
          height: "42px",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          zIndex: 140,
          boxShadow: "0 4px 15px rgba(229, 40, 96, 0.15)",
          transition: "transform 0.2s, background-color 0.2s"
        }}
        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.8)"; e.currentTarget.style.transform = "scale(1.1)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.5)"; e.currentTarget.style.transform = "scale(1)"; }}
      >
        ▲
      </div>
    </div>
  );
}
