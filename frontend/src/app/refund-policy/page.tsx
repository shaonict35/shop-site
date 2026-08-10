"use client";

import React from "react";
import Header from "../../components/Header";
import PageBanner from "../../components/PageBanner";
import Footer from "../../components/Footer";
import MobileNavbar from "../../components/MobileNavbar";
import PolicyLayout from "../../components/PolicyLayout";

export default function RefundPage() {
  return (
    <>
      <Header />
      <PageBanner title="Refund & Return Policy" />
      <main className="container" style={{ padding: "40px 20px 60px 20px" }}>
        <PolicyLayout currentTab="REFUND & RETURN POLICY">
          <h2 style={{ fontSize: "22px", fontWeight: "900", color: "#0e1e38", marginBottom: "20px" }}>
            Return & Refund Policy
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
              At <strong>GlowGoodly (glowgoodly.com and shop.glowgoodly.com)</strong>, customer satisfaction is our top priority. We want you to love your authentic cosmetics and skincare products! Please read our return and refund guidelines below.
            </p>

            <h3 style={{ fontSize: "16px", fontWeight: "800", color: "#e52860", textTransform: "uppercase", marginTop: "10px" }}>
              Return Conditions
            </h3>
            <ul style={{ paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "6px" }}>
              <li>Products must be returned or reported within <strong>3 days</strong> of delivery.</li>
              <li>Cosmetic items, skincare containers, and fragrances must be <strong>unopened, unused, and with original seals/tags intact</strong> due to hygiene and health protection reasons.</li>
              <li>A return claim must be accompanied by the original order details or email registration.</li>
            </ul>

            <h3 style={{ fontSize: "16px", fontWeight: "800", color: "#e52860", textTransform: "uppercase", marginTop: "10px" }}>
              Damaged, Defective, or Incorrect Items
            </h3>
            <p>
              Only damaged, defective, or incorrect products (e.g. wrong variant/shade sent) qualify for return. If you receive such an item, please reach out to us at <strong>support@glowgoodly.com</strong> immediately with proof photos. We will arrange a replacement free of charge.
            </p>

            <h3 style={{ fontSize: "16px", fontWeight: "800", color: "#e52860", textTransform: "uppercase", marginTop: "10px" }}>
              Refund Processing
            </h3>
            <p>
              Once your returned item is received and inspected at our hub, we will notify you. Approved refunds will be processed back to your original payment method (bKash wallet or bank card) within <strong>7 working days</strong>.
            </p>
          </div>
        </PolicyLayout>
      </main>
      <Footer />
      <MobileNavbar />
    </>
  );
}
