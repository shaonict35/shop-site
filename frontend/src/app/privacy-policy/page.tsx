"use client";

import React from "react";
import Header from "../../components/Header";
import PageBanner from "../../components/PageBanner";
import Footer from "../../components/Footer";
import MobileNavbar from "../../components/MobileNavbar";
import PolicyLayout from "../../components/PolicyLayout";

export default function PrivacyPolicyPage() {
  return (
    <>
      <Header />
      <PageBanner title="Privacy Policy" />
      <main className="container" style={{ padding: "40px 20px 60px 20px" }}>
        <PolicyLayout currentTab="PRIVACY POLICY">
          <h2 style={{ fontSize: "22px", fontWeight: "900", color: "#0e1e38", marginBottom: "20px" }}>
            Privacy Policy
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
            <p><strong>Effective Date:</strong> 27/04/2026</p>
            
            <p>
              Welcome to <strong>GlowGoodly (glowgoodly.com and shop.glowgoodly)</strong> (“we”, “our”, “us”). We respect your privacy and are committed to protecting your personal information while you shop for skincare and cosmetic products with us.
            </p>
            <p>
              This Privacy Policy explains how we collect, use, store, and protect your personal data. By using our website, you agree to the practices described in this Policy.
            </p>
            <p>
              Data protection is very important to us. We only collect information that is necessary for providing our services and improving your shopping experience. We keep your data only for as long as required by law or business needs. You can browse our website without providing personal information. However, certain features (such as placing orders) require data collection.
            </p>

            <h3 style={{ fontSize: "16px", fontWeight: "800", color: "#e52860", textTransform: "uppercase", marginTop: "10px" }}>
              1. Information We Collect
            </h3>
            <p>
              We may collect the following types of information when you use our website or place an order:
            </p>
            <ul style={{ paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "6px" }}>
              <li><strong>Personal Information:</strong> Full name, email address, phone number, and shipping/billing address. Payment details are securely processed by third-party payment gateways.</li>
              <li><strong>Order &amp; Service Information:</strong> Purchased skincare/cosmetic products, order history, delivery preferences, and customer support messages.</li>
              <li><strong>Technical Information:</strong> IP address, device and browser information, cookies, usage data, and pages visited on the website.</li>
            </ul>

            <h3 style={{ fontSize: "16px", fontWeight: "800", color: "#e52860", textTransform: "uppercase", marginTop: "10px" }}>
              2. How We Use Your Information
            </h3>
            <p>
              We use the collected information for the following purposes:
            </p>
            <ul style={{ paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "6px" }}>
              <li>To process checkout transactions and deliver orders via partnered courier services.</li>
              <li>To send order notifications, tracking links, and transactional updates.</li>
              <li>To calculate loyalty reward points for customer balances.</li>
              <li>To improve web rendering speed, security, and responsive UI layouts.</li>
            </ul>

            <h3 style={{ fontSize: "16px", fontWeight: "800", color: "#e52860", textTransform: "uppercase", marginTop: "10px" }}>
              3. Data Security &amp; Sharing
            </h3>
            <p>
              We protect your data using industry-standard security measures. We do not sell your personal data. We only share necessary delivery information with our partnered courier companies to fulfill your order.
            </p>

            <p style={{ marginTop: "10px" }}>
              If you have additional questions or require more information about our Privacy Policy, do not hesitate to contact us at support@glowgoodly.com.
            </p>
          </div>
        </PolicyLayout>
      </main>
      <Footer />
      <MobileNavbar />
    </>
  );
}
