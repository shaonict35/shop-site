"use client";

import React from "react";
import Header from "../../components/Header";
import PageBanner from "../../components/PageBanner";
import Footer from "../../components/Footer";
import MobileNavbar from "../../components/MobileNavbar";
import PolicyLayout from "../../components/PolicyLayout";

export default function AboutPage() {
  return (
    <>
      <Header />
      <PageBanner title="OUR STORY" />
      <main className="container" style={{ padding: "40px 20px 60px 20px" }}>
        <PolicyLayout currentTab="OUR STORY">
          <h2 style={{ fontSize: "22px", fontWeight: "900", color: "#0e1e38", marginBottom: "20px" }}>
            About GlowGoodly
          </h2>
          
          <div
            style={{
              fontSize: "14px",
              lineHeight: "1.8",
              color: "#4a5568",
              display: "flex",
              flexDirection: "column",
              gap: "20px",
              fontWeight: "500",
            }}
          >
            <p>
              Welcome to <strong>GlowGoodly</strong>, your trusted destination for 100% authentic cosmetics, skincare, and beauty products in Bangladesh. We believe that everyone deserves to look and feel their best, which is why we source and supply the highest quality products from global brands.
            </p>
            <p>
              GlowGoodly has transitioned from a WordPress-based system to this custom-coded, high-performance platform. Our technology has been built with an API-first approach, meaning our web services can serve our upcoming mobile apps (iOS & Android) smoothly and reliably.
            </p>
            
            <div style={{ marginTop: "10px", backgroundColor: "#fff0f4", padding: "20px", borderRadius: "12px", borderLeft: "4px solid #e52860" }}>
              <h3 style={{ fontSize: "16px", fontWeight: "800", color: "#e52860", textTransform: "uppercase", margin: "0 0 12px 0" }}>
                Our Promises (আমাদের অঙ্গীকার)
              </h3>
              <ul style={{ paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "10px", margin: 0 }}>
                <li><strong>1. 100% Authentic & Genuine Products:</strong> We work directly with verified brands and authorized distributors.</li>
                <li><strong>2. Fast Nationwide Delivery:</strong> Inside Dhaka ৳70, Sub Area (Keraniganj, Savar, Gazipur, Narayanganj) ৳100, Outside Dhaka ৳130.</li>
                <li><strong>3. Hassle-Free 7-Day Return Policy:</strong> Easy return and instant store replacement for any defective or damaged items.</li>
                <li><strong>4. Safe & Secure Payments:</strong> bKash Direct Merchant & Bangla QR Payment (01609013011) along with Cash on Delivery.</li>
                <li><strong>5. 24/7 Dedicated Customer Support:</strong> Always here to assist you with order inquiries and personalized beauty advice.</li>
              </ul>
            </div>

            <p style={{ marginTop: "10px" }}>
              Thank you for choosing GlowGoodly. We look forward to helping you glow every single day!
            </p>
          </div>
        </PolicyLayout>
      </main>
      <Footer />
      <MobileNavbar />
    </>
  );
}
