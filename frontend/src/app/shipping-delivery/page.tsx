"use client";

import React from "react";
import Header from "../../components/Header";
import PageBanner from "../../components/PageBanner";
import Footer from "../../components/Footer";
import MobileNavbar from "../../components/MobileNavbar";
import PolicyLayout from "../../components/PolicyLayout";

export default function ShippingDeliveryPage() {
  return (
    <>
      <Header />
      <PageBanner title="Shipping & Delivery" />
      <main className="container" style={{ padding: "40px 20px 60px 20px" }}>
        <PolicyLayout currentTab="SHIPPING & DELIVERY">
          <h2 style={{ fontSize: "22px", fontWeight: "900", color: "#0e1e38", marginBottom: "20px" }}>
            Shipping Fees & Delivery Policies
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
              At <strong>GlowGoodly</strong>, we work to process and deliver your authentic cosmetics as fast as possible. Below are the delivery timelines and charges based on your shipping zone.
            </p>

            <h3 style={{ fontSize: "16px", fontWeight: "800", color: "#e52860", textTransform: "uppercase", marginTop: "10px" }}>
              Delivery Charges Table
            </h3>
            <p>
              Delivery charges are dynamically computed based on your shipping address during checkout:
            </p>
            <table style={{ width: "100%", borderCollapse: "collapse", margin: "10px 0 20px 0", textAlign: "left", fontSize: "13.5px" }}>
              <thead>
                <tr style={{ backgroundColor: "#fff0f4", borderBottom: "2px solid #ffd1dc" }}>
                  <th style={{ padding: "12px", fontWeight: "800", color: "#e52860" }}>Delivery Zone</th>
                  <th style={{ padding: "12px", fontWeight: "800", color: "#e52860" }}>Delivery Cost (BDT)</th>
                  <th style={{ padding: "12px", fontWeight: "800", color: "#e52860" }}>Estimated Time</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: "1px solid #edf2f7" }}>
                  <td style={{ padding: "12px", fontWeight: "700" }}>Inside Dhaka City</td>
                  <td style={{ padding: "12px", fontWeight: "700", color: "#e52860" }}>৳70</td>
                  <td style={{ padding: "12px" }}>24 - 48 Hours</td>
                </tr>
                <tr style={{ borderBottom: "1px solid #edf2f7" }}>
                  <td style={{ padding: "12px", fontWeight: "700" }}>Keraniganj, Savar, Narayanganj & Gazipur</td>
                  <td style={{ padding: "12px", fontWeight: "700", color: "#e52860" }}>৳100</td>
                  <td style={{ padding: "12px" }}>2 - 3 Days</td>
                </tr>
                <tr style={{ borderBottom: "1px solid #edf2f7" }}>
                  <td style={{ padding: "12px", fontWeight: "700" }}>Outside Dhaka (All other Districts)</td>
                  <td style={{ padding: "12px", fontWeight: "700", color: "#e52860" }}>৳130</td>
                  <td style={{ padding: "12px" }}>2 - 4 Days</td>
                </tr>
              </tbody>
            </table>

            <h3 style={{ fontSize: "16px", fontWeight: "800", color: "#e52860", textTransform: "uppercase", marginTop: "10px" }}>
              Estimated Delivery Times
            </h3>
            <ul style={{ paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "6px" }}>
              <li><strong>Inside Dhaka City</strong>: Delivered within 24 to 48 hours.</li>
              <li><strong>Keraniganj, Savar, Narayanganj, Gazipur & Other Districts</strong>: Delivered within 2 to 4 working days.</li>
            </ul>

            <h3 style={{ fontSize: "16px", fontWeight: "800", color: "#e52860", textTransform: "uppercase", marginTop: "10px" }}>
              Order Tracking & live updates
            </h3>
            <p>
              As soon as your package is dispatched, we send you an automated SMS containing a tracking link so you can check delivery progress live through Pathao or Steadfast courier portals.
            </p>
          </div>
        </PolicyLayout>
      </main>
      <Footer />
      <MobileNavbar />
    </>
  );
}
