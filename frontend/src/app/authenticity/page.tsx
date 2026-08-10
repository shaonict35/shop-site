"use client";

import React from "react";
import Header from "../../components/Header";
import PageBanner from "../../components/PageBanner";
import Footer from "../../components/Footer";
import MobileNavbar from "../../components/MobileNavbar";
import PolicyLayout from "../../components/PolicyLayout";

export default function AuthenticityPage() {
  return (
    <>
      <Header />
      <PageBanner title="AUTHENTICITY" />
      <main className="container" style={{ padding: "40px 20px 60px 20px" }}>
        <PolicyLayout currentTab="AUTHENTICITY">
          <h2 style={{ fontSize: "22px", fontWeight: "900", color: "#0e1e38", marginBottom: "20px" }}>
            Our 100% Authentic Product Guarantee
          </h2>

          <div style={{ fontSize: "14.5px", lineHeight: "1.8", color: "#4a5568", display: "flex", flexDirection: "column", gap: "20px" }}>
            <p>
              At <strong>GlowGoodly</strong>, authenticity is the core of our business values. In the cosmetics and skincare industry, using fake or counterfeit products is not just a waste of money—it's a direct threat to your skin health and personal safety.
            </p>

            <h3 style={{ fontSize: "16px", fontWeight: "800", color: "#e52860", textTransform: "uppercase", marginTop: "10px" }}>
              How We Ensure Authenticity
            </h3>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
              <div style={{ paddingLeft: "15px", borderLeft: "3.5px solid #e52860" }}>
                <strong>1. Direct Brand Partnerships:</strong> We source beauty items directly from global brand manufacturer warehouses or their officially authorized regional distributors.
              </div>
              <div style={{ paddingLeft: "15px", borderLeft: "3.5px solid #e52860" }}>
                <strong>2. Import Clearances:</strong> Every consignment imported into Bangladesh carries verified customs declaration forms, manufacturer barcodes, and product certificates of analysis.
              </div>
              <div style={{ paddingLeft: "15px", borderLeft: "3.5px solid #e52860" }}>
                <strong>3. Batch Code Tracking:</strong> Any customer can request the batch code or manufacturing details of their delivered product to verify with the brand's official online directory.
              </div>
            </div>

            <p style={{ marginTop: "15px", backgroundColor: "#fff0f4", padding: "15px 20px", borderRadius: "8px", fontWeight: "600", color: "#e52860", textAlign: "center" }}>
              "Zero Tolerance for Counterfeits. If you prove any product purchased from us is not genuine, we promise a 100% instant cash refund."
            </p>

            <p style={{ marginTop: "10px" }}>
              Shop with confidence and experience genuine premium beauty solutions at GlowGoodly. Your trust is our most valuable asset.
            </p>
          </div>
        </PolicyLayout>
      </main>
      <Footer />
      <MobileNavbar />
    </>
  );
}
