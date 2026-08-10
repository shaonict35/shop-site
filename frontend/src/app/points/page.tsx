"use client";

import React from "react";
import Header from "../../components/Header";
import PageBanner from "../../components/PageBanner";
import Footer from "../../components/Footer";
import MobileNavbar from "../../components/MobileNavbar";
import PolicyLayout from "../../components/PolicyLayout";

export default function PointsPage() {
  return (
    <>
      <Header />
      <PageBanner title="Points" />
      <main className="container" style={{ padding: "40px 20px 60px 20px" }}>
        <PolicyLayout currentTab="POINTS">
          <h2 style={{ fontSize: "22px", fontWeight: "900", color: "#0e1e38", marginBottom: "20px" }}>
            GlowGoodly Rewards & Loyalty Points
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
              We believe in rewarding our loyal community! With the <strong>GlowGoodly Loyalty Program</strong>, you earn points automatically every time you shop with us.
            </p>

            <h3 style={{ fontSize: "16px", fontWeight: "800", color: "#e52860", textTransform: "uppercase", marginTop: "10px" }}>
              How Do I Earn Points?
            </h3>
            <p>
              For every purchase made on our website, you earn <strong>5% of the total order value</strong> back as loyalty points.
              For example, if you make a purchase of BDT 1,000, you will instantly accumulate 50 reward points in your account balance once the order status is completed.
            </p>

            {/* Visual Table */}
            <table style={{ width: "100%", borderCollapse: "collapse", margin: "10px 0 20px 0", textAlign: "left", fontSize: "13.5px" }}>
              <thead>
                <tr style={{ backgroundColor: "#fff0f4", borderBottom: "2px solid #ffd1dc" }}>
                  <th style={{ padding: "12px", fontWeight: "800", color: "#e52860" }}>Order Value (BDT)</th>
                  <th style={{ padding: "12px", fontWeight: "800", color: "#e52860" }}>Points Earned</th>
                  <th style={{ padding: "12px", fontWeight: "800", color: "#e52860" }}>Equivalent Discount</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: "1px solid #edf2f7" }}>
                  <td style={{ padding: "12px", fontWeight: "700" }}>৳500</td>
                  <td style={{ padding: "12px", fontWeight: "700", color: "#e52860" }}>25 Points</td>
                  <td style={{ padding: "12px" }}>৳25 off next order</td>
                </tr>
                <tr style={{ borderBottom: "1px solid #edf2f7" }}>
                  <td style={{ padding: "12px", fontWeight: "700" }}>৳1,000</td>
                  <td style={{ padding: "12px", fontWeight: "700", color: "#e52860" }}>50 Points</td>
                  <td style={{ padding: "12px" }}>৳50 off next order</td>
                </tr>
                <tr style={{ borderBottom: "1px solid #edf2f7" }}>
                  <td style={{ padding: "12px", fontWeight: "700" }}>৳5,000</td>
                  <td style={{ padding: "12px", fontWeight: "700", color: "#e52860" }}>250 Points</td>
                  <td style={{ padding: "12px" }}>৳250 off next order</td>
                </tr>
              </tbody>
            </table>

            <h3 style={{ fontSize: "16px", fontWeight: "800", color: "#e52860", textTransform: "uppercase", marginTop: "10px" }}>
              🎁 Redeem Loyalty Points into Discount Coupons
            </h3>
            <p>
              Convert your earned loyalty points into exclusive discount coupons to apply on your next order at checkout!
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "14px", margin: "10px 0 20px 0" }}>
              {[
                { points: 50, discount: 50, code: "POINTS50", label: "৳50 OFF Discount Coupon" },
                { points: 100, discount: 100, code: "POINTS100", label: "৳100 OFF Discount Coupon" },
                { points: 250, discount: 250, code: "POINTS250", label: "৳250 OFF Discount Coupon" },
                { points: 500, discount: 500, code: "POINTS500", label: "৳500 OFF Discount Coupon" }
              ].map((tier) => (
                <div key={tier.code} style={{ backgroundColor: "#ffffff", border: "1.5px solid #fecdd3", borderRadius: "10px", padding: "16px", textAlign: "center", boxShadow: "0 2px 8px rgba(229,40,96,0.06)" }}>
                  <div style={{ fontSize: "22px", fontWeight: "900", color: "#e52860" }}>{tier.points} Points</div>
                  <div style={{ fontSize: "14px", fontWeight: "700", color: "#1e293b", margin: "4px 0 10px 0" }}>{tier.label}</div>
                  <div style={{ fontSize: "12px", color: "#64748b", backgroundColor: "#f8fafc", padding: "6px", borderRadius: "6px", fontFamily: "monospace", fontWeight: "800", marginBottom: "12px", border: "1px dashed #cbd5e1" }}>
                    Coupon Code: <strong>{tier.code}</strong>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(tier.code);
                      alert(`🎉 Coupon code '${tier.code}' copied to clipboard! Paste it at checkout to get ৳${tier.discount} OFF.`);
                      window.location.href = "/checkout";
                    }}
                    style={{
                      width: "100%",
                      backgroundColor: "#e52860",
                      color: "#ffffff",
                      border: "none",
                      padding: "9px 12px",
                      borderRadius: "6px",
                      fontSize: "12.5px",
                      fontWeight: "800",
                      cursor: "pointer",
                      boxShadow: "0 2px 6px rgba(229,40,96,0.2)"
                    }}
                  >
                    Redeem & Copy Code →
                  </button>
                </div>
              ))}
            </div>

            <h3 style={{ fontSize: "16px", fontWeight: "800", color: "#e52860", textTransform: "uppercase", marginTop: "10px" }}>
              How Can I Redeem My Points at Checkout?
            </h3>
            <p>
              Redeeming is simple! Copy any coupon code above (e.g. <strong>POINTS50</strong> or <strong>POINTS100</strong>) or click the <strong>"Redeem & Copy Code"</strong> button. Then paste it into the <em>Have a Promo Coupon?</em> field on the checkout page to enjoy instant cash discount on your order.
            </p>

            <h3 style={{ fontSize: "16px", fontWeight: "800", color: "#e52860", textTransform: "uppercase", marginTop: "10px" }}>
              How Can I Check My Points Balance?
            </h3>
            <p>
              Simply log into your account and navigate to your dashboard/profile area. Your active loyalty points balance and point history will be displayed clearly.
            </p>
          </div>
        </PolicyLayout>
      </main>
      <Footer />
      <MobileNavbar />
    </>
  );
}
