"use client";

import React from "react";
import Header from "../../components/Header";
import PageBanner from "../../components/PageBanner";
import Footer from "../../components/Footer";
import MobileNavbar from "../../components/MobileNavbar";
import PolicyLayout from "../../components/PolicyLayout";

export default function TermsPage() {
  return (
    <>
      <Header />
      <PageBanner title="Terms & Conditions" />
      <main className="container" style={{ padding: "40px 20px 60px 20px" }}>
        <PolicyLayout currentTab="TERMS & CONDITIONS">
          <h2 style={{ fontSize: "22px", fontWeight: "900", color: "#0e1e38", marginBottom: "20px" }}>
            Terms & Conditions
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
              Welcome to <strong>GlowGoodly (glowgoodly.com and shop.glowgoodly)</strong> (“we”, “our”, “us”). By accessing or using our website, you agree to be bound by the following Terms &amp; Conditions. If you do not agree with these terms, please do not use our website.
            </p>

            <h3 style={{ fontSize: "16px", fontWeight: "800", color: "#e52860", textTransform: "uppercase", marginTop: "10px" }}>
              1. Use of Website
            </h3>
            <p>
              By using our website, you confirm that:
            </p>
            <ul style={{ paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "6px" }}>
              <li>You are at least 13 years old.</li>
              <li>You will use this website only for lawful purposes.</li>
              <li>You will not misuse, hack, or damage the website in any way.</li>
            </ul>
            <p>
              We reserve the right to refuse service to anyone at any time for any reason.
            </p>

            <h3 style={{ fontSize: "16px", fontWeight: "800", color: "#e52860", textTransform: "uppercase", marginTop: "10px" }}>
              2. Products (Skincare &amp; Cosmetics)
            </h3>
            <p>
              We sell skincare and cosmetic products. By purchasing from us:
            </p>
            <ul style={{ paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "6px" }}>
              <li>You acknowledge that results may vary from person to person.</li>
              <li>You are responsible for checking product ingredients before use.</li>
              <li>We are not responsible for allergic reactions or misuse of products. Always perform a patch test before using any skincare product.</li>
            </ul>

            <h3 style={{ fontSize: "16px", fontWeight: "800", color: "#e52860", textTransform: "uppercase", marginTop: "10px" }}>
              3. Orders &amp; Acceptance
            </h3>
            <ul style={{ paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "6px" }}>
              <li>All orders placed on our website are subject to acceptance and availability.</li>
              <li>We reserve the right to cancel or refuse any order for inventory or pricing discrepancies.</li>
              <li>If an order is cancelled after payment, a refund will be issued according to our refund policy.</li>
            </ul>

            <h3 style={{ fontSize: "16px", fontWeight: "800", color: "#e52860", textTransform: "uppercase", marginTop: "10px" }}>
              4. Pricing &amp; Payment
            </h3>
            <ul style={{ paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "6px" }}>
              <li>All prices are listed in BDT.</li>
              <li>We reserve the right to change prices at any time without prior notice.</li>
              <li>Payments must be made through secure third-party payment gateways. We do not store your full payment card details.</li>
            </ul>

            <h3 style={{ fontSize: "16px", fontWeight: "800", color: "#e52860", textTransform: "uppercase", marginTop: "10px" }}>
              5. Intellectual Property
            </h3>
            <p>
              All branding, catalog texts, icons, images, code, and stylesheets are protected under Intellectual Property laws. Unauthorized replication is strictly prohibited.
            </p>
          </div>
        </PolicyLayout>
      </main>
      <Footer />
      <MobileNavbar />
    </>
  );
}
