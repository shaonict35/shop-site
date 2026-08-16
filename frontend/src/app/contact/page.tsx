"use client";

import React, { useState } from "react";
import Header from "../../components/Header";
import PageBanner from "../../components/PageBanner";
import Footer from "../../components/Footer";
import MobileNavbar from "../../components/MobileNavbar";
import PolicyLayout from "../../components/PolicyLayout";
import { API_BASE } from "../../utils/api";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !message) {
      setStatus("Please enter your name, phone number, and message.");
      return;
    }
    setLoading(true);
    setStatus("");
    try {
      const res = await fetch(`${API_BASE}/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, email, message }),
      });
      if (res.ok) {
        setStatus("Thank you! Your message has been sent successfully to GlowGoodly team.");
        setName("");
        setPhone("");
        setEmail("");
        setMessage("");
      } else {
        const data = await res.json();
        setStatus(data.error || "Failed to send message. Please try again.");
      }
    } catch (e) {
      setStatus("An error occurred. Please check your network and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <PageBanner title="Contact Us" />
      <main className="container" style={{ padding: "40px 20px 60px 20px" }}>
        <PolicyLayout currentTab="CONTACT US">
          <div style={{ display: "flex", gap: "30px", flexWrap: "wrap" }}>
            {/* Form Card */}
            <form
              onSubmit={handleSubmit}
              style={{
                flex: 1.2,
                minWidth: "280px",
                display: "flex",
                flexDirection: "column",
                gap: "15px",
              }}
            >
              <h2 style={{ fontSize: "22px", fontWeight: "900", color: "#0e1e38" }}>
                Get in Touch
              </h2>
              <p style={{ fontSize: "13.5px", color: "#718096", fontWeight: "500" }}>
                Have questions about cosmetics, shades, or orders? Drop us a message!
              </p>

              <div>
                <label style={{ fontSize: "12px", fontWeight: "700", display: "block", marginBottom: "4px", color: "#4a5568" }}>Your Name *</label>
                <input
                  type="text"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    border: "1.5px solid #edf2f7",
                    borderRadius: "8px",
                    fontSize: "13px",
                    fontWeight: "600",
                    outline: "none",
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: "12px", fontWeight: "700", display: "block", marginBottom: "4px", color: "#4a5568" }}>Phone Number *</label>
                <input
                  type="tel"
                  placeholder="e.g. 017XXXXXXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    border: "1.5px solid #edf2f7",
                    borderRadius: "8px",
                    fontSize: "13px",
                    fontWeight: "600",
                    outline: "none",
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: "12px", fontWeight: "700", display: "block", marginBottom: "4px", color: "#4a5568" }}>Email Address (Optional)</label>
                <input
                  type="email"
                  placeholder="Enter email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    border: "1.5px solid #edf2f7",
                    borderRadius: "8px",
                    fontSize: "13px",
                    fontWeight: "600",
                    outline: "none",
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: "12px", fontWeight: "700", display: "block", marginBottom: "4px", color: "#4a5568" }}>Message *</label>
                <textarea
                  rows={4}
                  placeholder="How can we help you?"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    border: "1.5px solid #edf2f7",
                    borderRadius: "8px",
                    fontSize: "13px",
                    fontWeight: "600",
                    outline: "none",
                    resize: "vertical",
                  }}
                />
              </div>

              {status && (
                <p style={{ fontSize: "12px", fontWeight: "700", color: status.includes("Thank you") ? "#2e7d32" : "#e52860" }}>{status}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{
                  backgroundColor: "#e52860",
                  color: "#ffffff",
                  fontWeight: "800",
                  padding: "12px",
                  borderRadius: "8px",
                  cursor: loading ? "not-allowed" : "pointer",
                  textAlign: "center",
                  border: "none",
                  fontSize: "13px",
                  letterSpacing: "0.5px",
                  opacity: loading ? 0.7 : 1
                }}
              >
                {loading ? "SENDING INQUIRY..." : "SEND INQUIRY"}
              </button>
            </form>

            {/* Contact Details Card */}
            <div
              style={{
                flex: 0.8,
                minWidth: "220px",
                backgroundColor: "#fcfcfc",
                border: "1px solid #edf2f7",
                borderRadius: "10px",
                padding: "24px",
                display: "flex",
                flexDirection: "column",
                gap: "20px",
              }}
            >
              <h3 style={{ fontSize: "16px", fontWeight: "800", color: "#0e1e38" }}>
                Contact Details
              </h3>

              <div style={{ display: "flex", flexDirection: "column", gap: "18px", fontSize: "13.5px", fontWeight: "600" }}>
                <div>
                  <span style={{ display: "block", color: "#e52860", fontWeight: "800", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px" }}>HOTLINE SUPPORT</span>
                  <p style={{ marginTop: "4px", color: "#4a5568" }}>+880 1XXXXXXXXX</p>
                </div>
                
                <div>
                  <span style={{ display: "block", color: "#e52860", fontWeight: "800", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px" }}>EMAIL OFFICE</span>
                  <p style={{ marginTop: "4px", color: "#4a5568" }}>support@glowgoodly.com</p>
                </div>

                <div>
                  <span style={{ display: "block", color: "#e52860", fontWeight: "800", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px" }}>CORPORATE ADDRESS</span>
                  <p style={{ marginTop: "4px", lineHeight: "1.5", color: "#4a5568" }}>House 12, Road 5, Dhanmondi, Dhaka-1209, Bangladesh</p>
                </div>

                <div>
                  <span style={{ display: "block", color: "#e52860", fontWeight: "800", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px" }}>BUSINESS HOURS</span>
                  <p style={{ marginTop: "4px", color: "#4a5568" }}>Saturday - Thursday: 10:00 AM - 8:00 PM</p>
                </div>
              </div>
            </div>
          </div>
        </PolicyLayout>
      </main>
      <Footer />
      <MobileNavbar />
    </>
  );
}
