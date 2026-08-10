"use client";

import React, { useState } from "react";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import MobileNavbar from "../../components/MobileNavbar";
import { useApp } from "../../context/AppContext";

export default function LoginPage() {
  const { login, logout, user } = useApp();

  // Mode tab: default to "signup" as requested ("login page a first a signup required ekta number diye ekbar signup hbe")
  const [modeTab, setModeTab] = useState<"signup" | "login">("signup");
  const [loginMethod, setLoginMethod] = useState<"password" | "otp">("password");

  // Form input states
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // OTP state
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");

  // UI state
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // ─── 1. SIGNUP NEW CUSTOMER (PHONE NUMBER REQUIRED, 1 SIGNUP PER NUMBER) ─
  const handleCustomerSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!name || !phone || !password) {
      setErrorMsg("Full Name, Mobile Phone Number, and Password are required to sign up.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, email, password }),
      });

      const data = await res.json();
      if (res.ok || res.status === 201) {
        login(data.user, data.token);
        setSuccessMsg("Account created successfully! Redirecting to your Customer Dashboard...");
        setTimeout(() => {
          window.location.href = "/account";
        }, 800);
      } else {
        setErrorMsg(data.error || "Signup failed. Please try again.");
      }
    } catch (e) {
      setErrorMsg("An error occurred during registration. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ─── 2. LOGIN CUSTOMER (PHONE NUMBER / EMAIL + PASSWORD) ───────────────────
  const handleCustomerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!phone && !email) {
      setErrorMsg("Please enter your registered Phone Number or Email.");
      return;
    }
    if (!password) {
      setErrorMsg("Please enter your password.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailOrPhone: phone || email, password }),
      });

      const data = await res.json();
      if (res.ok) {
        login(data.user, data.token);
        setSuccessMsg("Logged in successfully! Entering your dashboard...");
        setTimeout(() => {
          window.location.href = "/account";
        }, 800);
      } else {
        setErrorMsg(data.error || "Login failed. Check your credentials.");
      }
    } catch (e) {
      setErrorMsg("Unable to connect to server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ─── 3. OTP LOGIN HANDLERS ────────────────────────────────────────────────
  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!phone || phone.length < 10) {
      setErrorMsg("Please enter your registered phone number.");
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setOtpSent(true);
      setSuccessMsg("A 4-digit OTP has been sent to " + phone + ". (Use code: 1234)");
    }, 800);
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!otpCode || otpCode.length !== 4) {
      setErrorMsg("Please enter the 4-digit OTP code.");
      return;
    }

    if (otpCode !== "1234") {
      setErrorMsg("Invalid OTP code. Please try again (Hint: Use code 1234).");
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      const mockUserData = {
        id: "customer-" + Date.now(),
        name: "Customer (" + phone.slice(-4) + ")",
        email: phone + "@glowgoodly.com",
        phone: phone,
        role: "Customer",
        points: 100,
        status: "Active",
      };
      const mockToken = "customer-jwt-token-" + Date.now();

      login(mockUserData, mockToken);
      setSuccessMsg("Logged in successfully! Redirecting...");
      setTimeout(() => {
        window.location.href = "/account";
      }, 800);
    }, 800);
  };

  if (user) {
    return (
      <>
        <Header />
        <main className="container" style={{ padding: "80px 20px", textAlign: "center", minHeight: "60vh" }}>
          <div style={{ backgroundColor: "#ffffff", padding: "40px", borderRadius: "12px", border: "1px solid #edf2f7", maxWidth: "500px", margin: "0 auto", boxShadow: "0 4px 15px rgba(0,0,0,0.02)" }}>
            <h2 style={{ fontSize: "22px", fontWeight: "900", color: "#0e1e38", marginBottom: "15px" }}>Welcome Back!</h2>
            <p style={{ fontSize: "14px", color: "#718096", fontWeight: "600", marginBottom: "25px" }}>
              Signed in as <strong style={{ color: "#e52860" }}>{user.name}</strong> ({user.phone || user.email}).
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "24px" }}>
              <Link href="/account" style={{ display: "block", backgroundColor: "#e52860", color: "#ffffff", padding: "14px 30px", borderRadius: "30px", fontWeight: "800", fontSize: "14px", textDecoration: "none", textAlign: "center" }}>
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
      </>
    );
  }

  return (
    <>
      <Header />

      <main className="container" style={{ padding: "60px 20px", minHeight: "75vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        
        <div 
          style={{ 
            backgroundColor: "#ffffff", 
            border: "1px solid #e2e8f0", 
            borderRadius: "12px", 
            maxWidth: "920px", 
            width: "100%",
            margin: "0 auto", 
            overflow: "hidden", 
            boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "stretch"
          }}
        >
          {/* Left Column: Brand Illustration */}
          <div 
            style={{ 
              flex: "1", 
              minWidth: "320px", 
              backgroundColor: "#fff0f5", 
              display: "flex", 
              flexDirection: "column",
              alignItems: "center", 
              justifyContent: "center",
              position: "relative",
              padding: "40px 30px",
              borderRight: "1px solid #f1f3f5",
              gap: "20px"
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
              <div 
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "50%",
                  backgroundColor: "#e52860",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#ffffff",
                  fontWeight: "950",
                  fontSize: "24px",
                  boxShadow: "0 4px 12px rgba(229,40,96,0.25)"
                }}
              >
                G
              </div>
              <span style={{ fontSize: "18px", fontWeight: "900", color: "#e52860", letterSpacing: "2px", textTransform: "uppercase" }}>
                GLOWGOODLY
              </span>
              <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "600" }}>
                100% Authentic Beauty & Cosmetics
              </span>
            </div>

            <div style={{ width: "100%", maxWidth: "280px", aspectRatio: "1/1" }}>
              <img 
                src="/cosmetics_circle_illustration.png" 
                alt="Cosmetics illustration"
                onError={(e) => { e.currentTarget.src = "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=500&auto=format&fit=crop&q=60"; }}
                style={{ width: "100%", height: "100%", objectFit: "contain", borderRadius: "12px" }}
              />
            </div>
          </div>

          {/* Right Column: Customer Auth Form */}
          <div 
            style={{ 
              flex: "1", 
              minWidth: "320px", 
              padding: "40px 35px", 
              display: "flex", 
              flexDirection: "column", 
              justifyContent: "center",
              alignItems: "stretch"
            }}
          >
            {/* Main Tabs: SIGN UP (First Required) vs LOGIN */}
            <div style={{ display: "flex", borderBottom: "2px solid #edf2f7", marginBottom: "25px" }}>
              <button
                onClick={() => { setModeTab("signup"); setErrorMsg(""); setSuccessMsg(""); }}
                style={{
                  flex: 1,
                  padding: "12px",
                  fontSize: "15px",
                  fontWeight: "800",
                  border: "none",
                  backgroundColor: "transparent",
                  color: modeTab === "signup" ? "#e52860" : "#a0aec0",
                  borderBottom: modeTab === "signup" ? "3px solid #e52860" : "none",
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
              >
                1. Sign Up (First Time)
              </button>
              <button
                onClick={() => { setModeTab("login"); setErrorMsg(""); setSuccessMsg(""); }}
                style={{
                  flex: 1,
                  padding: "12px",
                  fontSize: "15px",
                  fontWeight: "800",
                  border: "none",
                  backgroundColor: "transparent",
                  color: modeTab === "login" ? "#e52860" : "#a0aec0",
                  borderBottom: modeTab === "login" ? "3px solid #e52860" : "none",
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
              >
                2. Login (Existing User)
              </button>
            </div>

            {/* Error / Success Notifications */}
            {errorMsg && (
              <div style={{ backgroundColor: "#fff5f5", color: "#e53e3e", padding: "12px 16px", borderRadius: "8px", fontSize: "13px", fontWeight: "700", marginBottom: "20px", borderLeft: "4px solid #e53e3e", textAlign: "left" }}>
                {errorMsg}
                {errorMsg.includes("already registered") && (
                  <div style={{ marginTop: "6px" }}>
                    <button onClick={() => { setModeTab("login"); setErrorMsg(""); }} style={{ background: "none", border: "none", color: "#e52860", fontWeight: "900", cursor: "pointer", textDecoration: "underline", padding: 0 }}>
                      Click here to Login with your password →
                    </button>
                  </div>
                )}
                {errorMsg.includes("Please sign up first") && (
                  <div style={{ marginTop: "6px" }}>
                    <button onClick={() => { setModeTab("signup"); setErrorMsg(""); }} style={{ background: "none", border: "none", color: "#e52860", fontWeight: "900", cursor: "pointer", textDecoration: "underline", padding: 0 }}>
                      Click here to Sign Up with your mobile number →
                    </button>
                  </div>
                )}
              </div>
            )}
            {successMsg && (
              <div style={{ backgroundColor: "#f0fff4", color: "#38a169", padding: "12px 16px", borderRadius: "8px", fontSize: "13px", fontWeight: "700", marginBottom: "20px", borderLeft: "4px solid #38a169", textAlign: "left" }}>
                {successMsg}
              </div>
            )}

            {/* MODE 1: MANDATORY SIGN UP WITH MOBILE PHONE NUMBER */}
            {modeTab === "signup" && (
              <form onSubmit={handleCustomerSignup} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div style={{ backgroundColor: "#fff5f8", padding: "10px 14px", borderRadius: "6px", fontSize: "12px", color: "#e52860", fontWeight: "700" }}>
                  ℹ️ Sign up is required once per mobile phone number before entering dashboard.
                </div>

                <div>
                  <label style={{ fontSize: "12px", fontWeight: "700", color: "#4a5568", display: "block", marginBottom: "4px" }}>Full Name *</label>
                  <input
                    type="text"
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    style={{
                      width: "100%",
                      padding: "11px 15px",
                      fontSize: "13.5px",
                      fontWeight: "600",
                      border: "1.5px solid #cbd5e0",
                      borderRadius: "8px",
                      outline: "none"
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "12px", fontWeight: "700", color: "#4a5568", display: "block", marginBottom: "4px" }}>Mobile Phone Number * (1 Signup Per Number)</label>
                  <input
                    type="tel"
                    placeholder="e.g. 017XXXXXXXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    style={{
                      width: "100%",
                      padding: "11px 15px",
                      fontSize: "13.5px",
                      fontWeight: "600",
                      border: "1.5px solid #cbd5e0",
                      borderRadius: "8px",
                      outline: "none"
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "12px", fontWeight: "700", color: "#4a5568", display: "block", marginBottom: "4px" }}>Email Address (Optional)</label>
                  <input
                    type="email"
                    placeholder="yourname@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "11px 15px",
                      fontSize: "13.5px",
                      fontWeight: "600",
                      border: "1.5px solid #cbd5e0",
                      borderRadius: "8px",
                      outline: "none"
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "12px", fontWeight: "700", color: "#4a5568", display: "block", marginBottom: "4px" }}>Create Password *</label>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Minimum 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      style={{
                        width: "100%",
                        padding: "11px 45px 11px 15px",
                        fontSize: "13.5px",
                        fontWeight: "600",
                        border: "1.5px solid #cbd5e0",
                        borderRadius: "8px",
                        outline: "none"
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: "absolute",
                        right: "12px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        fontSize: "16px",
                        padding: "4px"
                      }}
                      title={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? "👁️‍🗨️" : "👁️"}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    backgroundColor: "#e52860",
                    color: "#ffffff",
                    padding: "13px",
                    fontWeight: "800",
                    fontSize: "14.5px",
                    borderRadius: "8px",
                    border: "none",
                    cursor: loading ? "not-allowed" : "pointer",
                    marginTop: "6px"
                  }}
                >
                  {loading ? "REGISTERING PHONE NUMBER..." : "SIGN UP & ENTER DASHBOARD"}
                </button>
              </form>
            )}

            {/* MODE 2: CUSTOMER LOGIN */}
            {modeTab === "login" && (
              <div>
                <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
                  <button
                    type="button"
                    onClick={() => { setLoginMethod("password"); setErrorMsg(""); }}
                    style={{
                      flex: 1,
                      padding: "8px",
                      borderRadius: "6px",
                      border: loginMethod === "password" ? "1.5px solid #e52860" : "1px solid #e2e8f0",
                      backgroundColor: loginMethod === "password" ? "#fff5f8" : "#ffffff",
                      color: loginMethod === "password" ? "#e52860" : "#718096",
                      fontSize: "12.5px",
                      fontWeight: "700",
                      cursor: "pointer"
                    }}
                  >
                    Phone / Email Login
                  </button>
                  <button
                    type="button"
                    onClick={() => { setLoginMethod("otp"); setErrorMsg(""); }}
                    style={{
                      flex: 1,
                      padding: "8px",
                      borderRadius: "6px",
                      border: loginMethod === "otp" ? "1.5px solid #e52860" : "1px solid #e2e8f0",
                      backgroundColor: loginMethod === "otp" ? "#fff5f8" : "#ffffff",
                      color: loginMethod === "otp" ? "#e52860" : "#718096",
                      fontSize: "12.5px",
                      fontWeight: "700",
                      cursor: "pointer"
                    }}
                  >
                    OTP SMS Login
                  </button>
                </div>

                {loginMethod === "password" ? (
                  <form onSubmit={handleCustomerLogin} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                    <div>
                      <label style={{ fontSize: "12px", fontWeight: "700", color: "#4a5568", display: "block", marginBottom: "4px" }}>Registered Mobile Number or Email</label>
                      <input
                        type="text"
                        placeholder="017XXXXXXXX or email"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                        style={{
                          width: "100%",
                          padding: "12px 16px",
                          fontSize: "14px",
                          fontWeight: "600",
                          border: "1.5px solid #cbd5e0",
                          borderRadius: "8px",
                          outline: "none"
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: "12px", fontWeight: "700", color: "#4a5568", display: "block", marginBottom: "4px" }}>Password</label>
                      <div style={{ position: "relative" }}>
                        <input
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          style={{
                            width: "100%",
                            padding: "12px 45px 12px 16px",
                            fontSize: "14px",
                            fontWeight: "600",
                            border: "1.5px solid #cbd5e0",
                            borderRadius: "8px",
                            outline: "none"
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          style={{
                            position: "absolute",
                            right: "12px",
                            top: "50%",
                            transform: "translateY(-50%)",
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            fontSize: "16px",
                            padding: "4px"
                          }}
                          title={showPassword ? "Hide password" : "Show password"}
                        >
                          {showPassword ? "👁️‍🗨️" : "👁️"}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      style={{
                        backgroundColor: "#1b2735",
                        color: "#ffffff",
                        padding: "14px",
                        fontWeight: "700",
                        fontSize: "14.5px",
                        borderRadius: "8px",
                        border: "none",
                        cursor: loading ? "not-allowed" : "pointer",
                        marginTop: "5px"
                      }}
                    >
                      {loading ? "LOGGING IN..." : "LOGIN TO DASHBOARD"}
                    </button>
                  </form>
                ) : (
                  <div>
                    {!otpSent ? (
                      <form onSubmit={handleSendOtp} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                        <div>
                          <label style={{ fontSize: "12px", fontWeight: "700", color: "#4a5568", display: "block", marginBottom: "4px" }}>Registered Phone Number</label>
                          <input
                            type="tel"
                            placeholder="017XXXXXXXX"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            required
                            style={{
                              width: "100%",
                              padding: "12px 16px",
                              fontSize: "14px",
                              fontWeight: "600",
                              border: "1.5px solid #cbd5e0",
                              borderRadius: "8px",
                              outline: "none"
                            }}
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={loading}
                          style={{
                            backgroundColor: "#1b2735",
                            color: "#ffffff",
                            padding: "14px",
                            fontWeight: "700",
                            fontSize: "14.5px",
                            borderRadius: "8px",
                            border: "none",
                            cursor: loading ? "not-allowed" : "pointer"
                          }}
                        >
                          {loading ? "SENDING OTP..." : "SEND OTP SMS"}
                        </button>
                      </form>
                    ) : (
                      <form onSubmit={handleVerifyOtp} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                        <p style={{ fontSize: "13px", color: "#718096", fontWeight: "600" }}>
                          We sent a 4-digit code to <strong style={{ color: "#2d3748" }}>{phone}</strong>.
                        </p>
                        <input
                          type="text"
                          maxLength={4}
                          placeholder="Enter 4-Digit OTP"
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value)}
                          required
                          style={{
                            width: "100%",
                            padding: "12px 16px",
                            fontSize: "15px",
                            fontWeight: "800",
                            textAlign: "center",
                            letterSpacing: "4px",
                            border: "1.5px solid #cbd5e0",
                            borderRadius: "8px",
                            outline: "none"
                          }}
                        />

                        <button
                          type="submit"
                          disabled={loading}
                          style={{
                            backgroundColor: "#1b2735",
                            color: "#ffffff",
                            padding: "14px",
                            fontWeight: "700",
                            fontSize: "14.5px",
                            borderRadius: "8px",
                            border: "none",
                            cursor: loading ? "not-allowed" : "pointer"
                          }}
                        >
                          {loading ? "VERIFYING..." : "VERIFY & LOGIN"}
                        </button>
                        <button
                          type="button"
                          onClick={() => { setOtpSent(false); setOtpCode(""); }}
                          style={{
                            backgroundColor: "transparent",
                            color: "#718096",
                            border: "none",
                            fontSize: "12px",
                            fontWeight: "700",
                            cursor: "pointer",
                            textDecoration: "underline",
                            textAlign: "center"
                          }}
                        >
                          Change Phone Number
                        </button>
                      </form>
                    )}
                  </div>
                )}
              </div>
            )}

          </div>
        </div>

      </main>

      <Footer />
      <MobileNavbar />
    </>
  );
}
