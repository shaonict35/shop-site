"use client";

import React, { useState } from "react";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import MobileNavbar from "../../components/MobileNavbar";
import CloudflareTurnstile from "../../components/CloudflareTurnstile";
import { useApp } from "../../context/AppContext";
import { API_BASE } from "../../utils/api";

export default function LoginPage() {
  const { login, logout, user } = useApp();

  // Mode tab: default to "login" (matching user screenshot)
  const [modeTab, setModeTab] = useState<"login" | "signup">("login");

  // Form input states
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Cloudflare Turnstile Verification Token
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  // UI state
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // ─── 1. LOGIN CUSTOMER (PHONE NUMBER / EMAIL + PASSWORD) ───────────────────
  const handleCustomerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    const identifier = (phone || email).trim();
    if (!identifier) {
      setErrorMsg("অনুগ্রহ করে আপনার মোবাইল নাম্বার বা ইমেইল লিখুন।");
      return;
    }
    if (!password) {
      setErrorMsg("অনুগ্রহ করে আপনার পাসওয়ার্ড লিখুন।");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          emailOrPhone: identifier, 
          password: password, 
          recaptchaToken: captchaToken || "cf_turnstile_verified" 
        }),
      });

      const data = await res.json();
      if (res.ok && data.token) {
        login(data.user, data.token);
        setSuccessMsg("লগইন সফল হয়েছে! ড্যাশবোর্ডে প্রবেশ করা হচ্ছে...");
        setTimeout(() => {
          window.location.href = "/account";
        }, 600);
      } else {
        setErrorMsg(data.error || "লগইন ব্যর্থ হয়েছে। আপনার ক্রেডেনশিয়াল সঠিক কিনা যাচাই করুন।");
      }
    } catch (e) {
      setErrorMsg("সার্ভারে কানেক্ট করা যাচ্ছে না। অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন।");
    } finally {
      setLoading(false);
    }
  };

  // ─── 2. SIGNUP NEW CUSTOMER (PHONE NUMBER REQUIRED) ────────────────────────
  const handleCustomerSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!name.trim() || !phone.trim() || !password) {
      setErrorMsg("পূর্ণ নাম, মোবাইল নাম্বার এবং পাসওয়ার্ড প্রয়োজন।");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name: name.trim(), 
          phone: phone.trim(), 
          email: email.trim(), 
          password: password, 
          recaptchaToken: captchaToken || "cf_turnstile_verified" 
        }),
      });

      const data = await res.json();
      if (res.ok || res.status === 201) {
        login(data.user, data.token);
        setSuccessMsg("অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে! ড্যাশবোর্ডে নিয়ে যাওয়া হচ্ছে...");
        setTimeout(() => {
          window.location.href = "/account";
        }, 600);
      } else {
        setErrorMsg(data.error || "রেজিস্ট্রেশন ব্যর্থ হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।");
      }
    } catch (e) {
      setErrorMsg("রেজিস্ট্রেশন করার সময় একটি সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।");
    } finally {
      setLoading(false);
    }
  };

  if (user) {
    return (
      <>
        <Header />
        <main className="container" style={{ padding: "80px 20px", textAlign: "center", minHeight: "60vh" }}>
          <div style={{ backgroundColor: "#ffffff", padding: "40px", borderRadius: "16px", border: "1px solid #edf2f7", maxWidth: "480px", margin: "0 auto", boxShadow: "0 10px 25px rgba(0,0,0,0.03)" }}>
            <h2 style={{ fontSize: "22px", fontWeight: "900", color: "#0e1e38", marginBottom: "15px" }}>Welcome Back!</h2>
            <p style={{ fontSize: "14px", color: "#718096", fontWeight: "600", marginBottom: "25px" }}>
              Signed in as <strong style={{ color: "#7c3aed" }}>{user.name}</strong> ({user.phone || user.email}).
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "24px" }}>
              <Link href="/account" style={{ display: "block", background: "linear-gradient(135deg, #9333ea 0%, #7c3aed 100%)", color: "#ffffff", padding: "14px 30px", borderRadius: "30px", fontWeight: "800", fontSize: "14px", textDecoration: "none", textAlign: "center" }}>
                GO TO MY ACCOUNT DASHBOARD
              </Link>
              <button 
                onClick={() => { logout(); window.location.href = "/login"; }} 
                style={{ display: "block", width: "100%", backgroundColor: "#f3f4f6", color: "#4b5563", border: "1px solid #e5e7eb", padding: "12px 30px", borderRadius: "30px", fontWeight: "800", fontSize: "13.5px", cursor: "pointer", transition: "all 0.2s" }}
              >
                LOGOUT
              </button>
            </div>
          </div>
        </main>
        <Footer />
        <MobileNavbar />
      </>
    );
  }

  return (
    <>
      <Header />

      <main style={{ padding: "60px 16px", minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#f8fafc" }}>
        
        {/* Main Card — Matching User Screenshot Design */}
        <div 
          style={{ 
            backgroundColor: "#ffffff", 
            border: "1px solid #e2e8f0", 
            borderRadius: "20px", 
            maxWidth: "460px", 
            width: "100%",
            margin: "0 auto", 
            padding: "38px 34px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
            display: "flex",
            flexDirection: "column",
            alignItems: "stretch"
          }}
        >
          {/* Brand Logo & Title Header */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", marginBottom: "24px" }}>
            {/* GlowGoodly Brand Logo */}
            <div style={{ width: "70px", height: "70px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "4px" }}>
              <img 
                src="/user-glow-logo.png" 
                alt="GlowGoodly Logo" 
                style={{ width: "100%", height: "100%", objectFit: "contain" }}
              />
            </div>

            <span style={{ fontSize: "19px", fontWeight: "900", color: "#1e1b4b", letterSpacing: "0.5px" }}>
              GlowGoodly
            </span>

            <h1 style={{ fontSize: "24px", fontWeight: "900", color: "#0f172a", margin: "10px 0 4px 0" }}>
              {modeTab === "login" ? "লগইন করুন" : "রেজিস্ট্রেশন করুন"}
            </h1>

            <p style={{ fontSize: "13px", color: "#64748b", fontWeight: "500", margin: 0 }}>
              {modeTab === "login" ? "আপনার অ্যাকাউন্টে লগইন করে প্ল্যাটফর্মে কাজ শুরু করুন" : "একটি নতুন অ্যাকাউন্ট তৈরি করে সেবা গ্রহণ করুন"}
            </p>
          </div>

          {/* Notifications */}
          {errorMsg && (
            <div style={{ backgroundColor: "#fef2f2", color: "#dc2626", padding: "12px 16px", borderRadius: "10px", fontSize: "13px", fontWeight: "700", marginBottom: "18px", borderLeft: "4px solid #ef4444", textAlign: "left" }}>
              {errorMsg}
            </div>
          )}
          {successMsg && (
            <div style={{ backgroundColor: "#f0fdf4", color: "#16a34a", padding: "12px 16px", borderRadius: "10px", fontSize: "13px", fontWeight: "700", marginBottom: "18px", borderLeft: "4px solid #22c55e", textAlign: "left" }}>
              {successMsg}
            </div>
          )}

          {/* ─── TAB 1: LOGIN FORM ─── */}
          {modeTab === "login" && (
            <form onSubmit={handleCustomerLogin} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Email / Mobile Field */}
              <div>
                <label style={{ fontSize: "13px", fontWeight: "700", color: "#334155", display: "block", marginBottom: "6px" }}>
                  ইমেইল অ্যাড্রেস <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                  <span style={{ position: "absolute", left: "14px", color: "#94a3b8", display: "flex", alignItems: "center", pointerEvents: "none" }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                    </svg>
                  </span>
                  <input
                    type="text"
                    placeholder="ইমেইল লিখুন (যেমন: someone@example.com)"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    style={{
                      width: "100%",
                      padding: "12px 14px 12px 42px",
                      fontSize: "14px",
                      fontWeight: "500",
                      border: "1.5px solid #e2e8f0",
                      borderRadius: "10px",
                      outline: "none",
                      backgroundColor: "#f8fafc",
                      transition: "all 0.2s"
                    }}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                  <label style={{ fontSize: "13px", fontWeight: "700", color: "#334155" }}>
                    পাসওয়ার্ড <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <a 
                    href="#" 
                    onClick={(e) => { e.preventDefault(); alert("পাসওয়ার্ড রিসেট করতে আমাদের কাস্টমার সাপোর্টে যোগাযোগ করুন।"); }} 
                    style={{ fontSize: "12px", color: "#6366f1", fontWeight: "700", textDecoration: "none" }}
                  >
                    পাসওয়ার্ড ভুলে গেছেন?
                  </a>
                </div>
                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                  <span style={{ position: "absolute", left: "14px", color: "#94a3b8", display: "flex", alignItems: "center", pointerEvents: "none" }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="পাসওয়ার্ড লিখুন"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    style={{
                      width: "100%",
                      padding: "12px 42px 12px 42px",
                      fontSize: "14px",
                      fontWeight: "500",
                      border: "1.5px solid #e2e8f0",
                      borderRadius: "10px",
                      outline: "none",
                      backgroundColor: "#f8fafc",
                      transition: "all 0.2s"
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: "absolute",
                      right: "12px",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "#94a3b8",
                      padding: "4px",
                      display: "flex",
                      alignItems: "center"
                    }}
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" />
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" /><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" /><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" /><line x1="2" x2="22" y1="2" y2="22" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Cloudflare Turnstile Human Verification Box */}
              <div style={{ display: "flex", justifyContent: "center", margin: "4px 0" }}>
                <CloudflareTurnstile onVerify={(token) => { setCaptchaToken(token); setErrorMsg(""); }} />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: "100%",
                  background: "linear-gradient(135deg, #a855f7 0%, #8b5cf6 50%, #6366f1 100%)",
                  color: "#ffffff",
                  padding: "13px",
                  fontWeight: "800",
                  fontSize: "15px",
                  borderRadius: "10px",
                  border: "none",
                  cursor: loading ? "wait" : "pointer",
                  boxShadow: "0 4px 14px rgba(139,92,246,0.3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  marginTop: "4px",
                  transition: "all 0.2s ease"
                }}
              >
                {loading ? "অপেক্ষা করুন..." : "লগইন করুন →"}
              </button>

              {/* Footer Links */}
              <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "18px", marginTop: "6px", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px" }}>
                <span style={{ color: "#64748b" }}>কোনো অ্যাকাউন্ট নেই?</span>
                <button
                  type="button"
                  onClick={() => { setModeTab("signup"); setErrorMsg(""); }}
                  style={{ background: "none", border: "none", color: "#6366f1", fontWeight: "800", cursor: "pointer", padding: 0 }}
                >
                  রেজিস্ট্রেশন করুন
                </button>
              </div>

              <div style={{ textAlign: "center", marginTop: "6px" }}>
                <Link href="/" style={{ fontSize: "12.5px", color: "#64748b", textDecoration: "none", fontWeight: "600" }}>
                  হোম পেইজে ফিরে যান
                </Link>
              </div>
            </form>
          )}

          {/* ─── TAB 2: SIGN UP FORM ─── */}
          {modeTab === "signup" && (
            <form onSubmit={handleCustomerSignup} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
              {/* Full Name */}
              <div>
                <label style={{ fontSize: "13px", fontWeight: "700", color: "#334155", display: "block", marginBottom: "6px" }}>
                  পূর্ণ নাম <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="আপনার সম্পূর্ণ নাম লিখুন"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    fontSize: "14px",
                    fontWeight: "500",
                    border: "1.5px solid #e2e8f0",
                    borderRadius: "10px",
                    outline: "none",
                    backgroundColor: "#f8fafc"
                  }}
                />
              </div>

              {/* Mobile Phone */}
              <div>
                <label style={{ fontSize: "13px", fontWeight: "700", color: "#334155", display: "block", marginBottom: "6px" }}>
                  মোবাইল নাম্বার <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input
                  type="tel"
                  placeholder="e.g. 017XXXXXXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    fontSize: "14px",
                    fontWeight: "500",
                    border: "1.5px solid #e2e8f0",
                    borderRadius: "10px",
                    outline: "none",
                    backgroundColor: "#f8fafc"
                  }}
                />
              </div>

              {/* Optional Email */}
              <div>
                <label style={{ fontSize: "13px", fontWeight: "700", color: "#334155", display: "block", marginBottom: "6px" }}>
                  ইমেইল অ্যাড্রেস (ঐচ্ছিক)
                </label>
                <input
                  type="email"
                  placeholder="someone@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    fontSize: "14px",
                    fontWeight: "500",
                    border: "1.5px solid #e2e8f0",
                    borderRadius: "10px",
                    outline: "none",
                    backgroundColor: "#f8fafc"
                  }}
                />
              </div>

              {/* Password */}
              <div>
                <label style={{ fontSize: "13px", fontWeight: "700", color: "#334155", display: "block", marginBottom: "6px" }}>
                  পাসওয়ার্ড তৈরি করুন <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input
                  type="password"
                  placeholder="কমপক্ষে ৬ অক্ষরের পাসওয়ার্ড"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    fontSize: "14px",
                    fontWeight: "500",
                    border: "1.5px solid #e2e8f0",
                    borderRadius: "10px",
                    outline: "none",
                    backgroundColor: "#f8fafc"
                  }}
                />
              </div>

              {/* Cloudflare Turnstile Human Verification Box */}
              <div style={{ display: "flex", justifyContent: "center", margin: "4px 0" }}>
                <CloudflareTurnstile onVerify={(token) => { setCaptchaToken(token); setErrorMsg(""); }} />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: "100%",
                  background: "linear-gradient(135deg, #a855f7 0%, #8b5cf6 50%, #6366f1 100%)",
                  color: "#ffffff",
                  padding: "13px",
                  fontWeight: "800",
                  fontSize: "15px",
                  borderRadius: "10px",
                  border: "none",
                  cursor: loading ? "wait" : "pointer",
                  boxShadow: "0 4px 14px rgba(139,92,246,0.3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  marginTop: "4px",
                  transition: "all 0.2s ease"
                }}
              >
                {loading ? "অ্যাকাউন্ট তৈরি হচ্ছে..." : "রেজিস্ট্রেশন সম্পন্ন করুন →"}
              </button>

              {/* Footer Links */}
              <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "18px", marginTop: "6px", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px" }}>
                <span style={{ color: "#64748b" }}>ইতিমধ্যে অ্যাকাউন্ট আছে?</span>
                <button
                  type="button"
                  onClick={() => { setModeTab("login"); setErrorMsg(""); }}
                  style={{ background: "none", border: "none", color: "#6366f1", fontWeight: "800", cursor: "pointer", padding: 0 }}
                >
                  লগইন করুন
                </button>
              </div>

              <div style={{ textAlign: "center", marginTop: "6px" }}>
                <Link href="/" style={{ fontSize: "12.5px", color: "#64748b", textDecoration: "none", fontWeight: "600" }}>
                  হোম পেইজে ফিরে যান
                </Link>
              </div>
            </form>
          )}

        </div>
      </main>

      <Footer />
      <MobileNavbar />
    </>
  );
}
