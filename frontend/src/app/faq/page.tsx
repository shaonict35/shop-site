"use client";

import React, { useState } from "react";
import Header from "../../components/Header";
import PageBanner from "../../components/PageBanner";
import Footer from "../../components/Footer";
import MobileNavbar from "../../components/MobileNavbar";
import PolicyLayout from "../../components/PolicyLayout";

export default function FAQPage() {
  const faqData = [
    {
      q: "Are the products authentic?",
      a: "Yes, 100%! We guarantee that all our cosmetics, skincare, and fragrances are 100% authentic and sourced directly from brands or authorized distributors."
    },
    {
      q: "What are the shipping charges?",
      a: "Our delivery charges are BDT 70 inside Dhaka City, BDT 100 for Keraniganj, Savar, Narayanganj & Gazipur, and BDT 130 for anywhere else in Bangladesh."
    },
    {
      q: "How long does delivery take?",
      a: "Orders inside Dhaka are delivered within 24-48 hours. Orders outside Dhaka take 2 to 4 working days."
    },
    {
      q: "How do I check my order status?",
      a: "You can track your order using the order number generated during checkout on our tracking page. Once an admin updates status to 'Shipped', a live Pathao/Steadfast tracking link is generated."
    },
    {
      q: "How does the loyalty program work?",
      a: "Registered customers earn loyalty points (5% of the total order value) on every checkout. These points accumulate in your profile and can be redeemed for discounts on subsequent checkouts."
    }
  ];

  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <>
      <Header />
      <PageBanner title="FAQS" />
      <main className="container" style={{ padding: "40px 20px 60px 20px" }}>
        <PolicyLayout currentTab="FAQS">
          <h2 style={{ fontSize: "22px", fontWeight: "900", color: "#0e1e38", marginBottom: "20px" }}>
            Frequently Asked Questions
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
            {faqData.map((faq, idx) => (
              <div
                key={idx}
                style={{
                  border: "1.5px solid #edf2f7",
                  borderRadius: "8px",
                  overflow: "hidden",
                }}
              >
                <div
                  onClick={() => toggleFAQ(idx)}
                  style={{
                    backgroundColor: "#fcfcfc",
                    padding: "16px 20px",
                    fontWeight: "700",
                    cursor: "pointer",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontSize: "14px",
                    color: "#0e1e38",
                  }}
                >
                  <span>{faq.q}</span>
                  <span style={{ fontSize: "18px", color: "#e52860" }}>
                    {activeIndex === idx ? "−" : "+"}
                  </span>
                </div>
                {activeIndex === idx && (
                  <div
                    style={{
                      padding: "16px 20px",
                      fontSize: "13.5px",
                      lineHeight: "1.6",
                      color: "#4a5568",
                      backgroundColor: "#ffffff",
                      borderTop: "1.5px solid #edf2f7",
                      fontWeight: "500",
                    }}
                  >
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </PolicyLayout>
      </main>
      <Footer />
      <MobileNavbar />
    </>
  );
}
