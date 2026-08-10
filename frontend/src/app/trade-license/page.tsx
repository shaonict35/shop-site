"use client";

import React from "react";
import Header from "../../components/Header";
import PageBanner from "../../components/PageBanner";
import Footer from "../../components/Footer";
import MobileNavbar from "../../components/MobileNavbar";
import PolicyLayout from "../../components/PolicyLayout";

export default function TradeLicensePage() {
  return (
    <>
      <Header />
      <PageBanner title="Trade License" />
      <main className="container" style={{ padding: "40px 20px 60px 20px" }}>
        <PolicyLayout currentTab="TRADE LICENSE">
          <h2 style={{ fontSize: "22px", fontWeight: "900", color: "#0e1e38", marginBottom: "20px" }}>
            Business Registration & Trade License Information
          </h2>
          <div
            style={{
              fontSize: "14px",
              lineHeight: "1.8",
              color: "#4a5568",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              fontWeight: "500",
            }}
          >
            <p>
              <strong>GlowGoodly</strong> is a registered e-commerce retail company operating under Dhaka North City Corporation regulations. We strictly adhere to trading and consumer protection laws in Bangladesh.
            </p>

            <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "15px", marginBottom: "15px", fontSize: "13.5px" }}>
              <tbody>
                <tr style={{ borderBottom: "1px solid #edf2f7" }}>
                  <td style={{ padding: "12px 0", fontWeight: "800", color: "#e52860", width: "40%" }}>Trade License Number</td>
                  <td style={{ padding: "12px 0", color: "#4a5568", fontWeight: "700" }}>TRAD/DNCC/029983/2026</td>
                </tr>
                <tr style={{ borderBottom: "1px solid #edf2f7" }}>
                  <td style={{ padding: "12px 0", fontWeight: "800", color: "#e52860" }}>Company Name</td>
                  <td style={{ padding: "12px 0", color: "#4a5568" }}>GlowGoodly Limited</td>
                </tr>
                <tr style={{ borderBottom: "1px solid #edf2f7" }}>
                  <td style={{ padding: "12px 0", fontWeight: "800", color: "#e52860" }}>Authorized DNCC Zone</td>
                  <td style={{ padding: "12px 0", color: "#4a5568" }}>Zone 03, Gulshan / Banani, Dhaka</td>
                </tr>
                <tr style={{ borderBottom: "1px solid #edf2f7" }}>
                  <td style={{ padding: "12px 0", fontWeight: "800", color: "#e52860" }}>BIN / TIN Number</td>
                  <td style={{ padding: "12px 0", color: "#4a5568", fontWeight: "700" }}>BIN-192837482937 / TIN-8823728372</td>
                </tr>
                <tr style={{ borderBottom: "1px solid #edf2f7" }}>
                  <td style={{ padding: "12px 0", fontWeight: "800", color: "#e52860" }}>Business Type</td>
                  <td style={{ padding: "12px 0", color: "#4a5568" }}>E-Commerce Retail (Cosmetics and Personal Care)</td>
                </tr>
              </tbody>
            </table>

            <p style={{ marginTop: "10px" }}>
              For any legal or corporate verification inquiries, please contact our support team at legal@glowgoodly.com.
            </p>
          </div>
        </PolicyLayout>
      </main>
      <Footer />
      <MobileNavbar />
    </>
  );
}
