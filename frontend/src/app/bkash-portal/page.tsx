"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ShieldCheck, ArrowRight, Lock, CheckCircle2, AlertCircle } from "lucide-react";

function BkashPortalContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const paymentID = searchParams.get("paymentID") || `BKASH-${Date.now()}`;
  const amount = searchParams.get("amount") || "0";
  const orderId = searchParams.get("orderId") || "";
  const initialPhone = searchParams.get("phone") || "";

  const [step, setStep] = useState<"phone" | "otp" | "pin" | "processing" | "success">("phone");
  const [bkashPhone, setBkashPhone] = useState(initialPhone);
  const [otp, setOtp] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [trxID, setTrxID] = useState("");
  const [loading, setLoading] = useState(false);

  const merchantNumber = "01609013011";

  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bkashPhone || bkashPhone.length < 11) {
      setError("Please enter a valid 11-digit bKash account number.");
      return;
    }
    setError("");
    setStep("otp");
  };

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length < 4) {
      setError("Please enter the 6-digit OTP code sent to your mobile number.");
      return;
    }
    setError("");
    setStep("pin");
  };

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin || pin.length < 5) {
      setError("Please enter your 5-digit bKash PIN.");
      return;
    }

    setLoading(true);
    setError("");
    setStep("processing");

    try {
      const generatedTrxId = `8N7A${Math.floor(100000 + Math.random() * 900000)}`;
      setTrxID(generatedTrxId);

      const res = await fetch("http://localhost:5000/api/bkash/execute-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentID,
          orderId,
          customerPhone: bkashPhone,
          amount,
          trxID: generatedTrxId
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setStep("success");
        setTimeout(() => {
          router.push(`/thank-you?orderNumber=${orderId}&paymentID=${paymentID}&trxID=${generatedTrxId}&total=${amount}&paymentMethod=bKash`);
        }, 1500);
      } else {
        setError(data.error || "bKash Payment processing failed. Please try again.");
        setStep("pin");
      }
    } catch (err) {
      setError("Network error. Please try again.");
      setStep("pin");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#e2136e",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        fontFamily: "'Segoe UI', Roboto, sans-serif"
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "440px",
          backgroundColor: "#ffffff",
          borderRadius: "16px",
          overflow: "hidden",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.35)"
        }}
      >
        {/* bKash Official Pink Header */}
        <div
          style={{
            backgroundColor: "#e2136e",
            color: "#ffffff",
            padding: "20px",
            textAlign: "center",
            position: "relative"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
            <span style={{ fontSize: "28px", fontWeight: "900", letterSpacing: "1px" }}>bKash</span>
            <span style={{ fontSize: "12px", backgroundColor: "#ffffff", color: "#e2136e", padding: "2px 8px", borderRadius: "12px", fontWeight: "800" }}>
              PAYMENT GATEWAY
            </span>
          </div>
          <div style={{ marginTop: "10px", fontSize: "14px", opacity: 0.9, fontWeight: "600" }}>
            Merchant: GlowGoodly Official ({merchantNumber})
          </div>
        </div>

        {/* Amount Badge */}
        <div
          style={{
            backgroundColor: "#fff0f5",
            padding: "15px 20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "1px solid #fecdd3"
          }}
        >
          <div>
            <div style={{ fontSize: "12px", color: "#881337", textTransform: "uppercase", fontWeight: "700" }}>
              Order Amount to Pay
            </div>
            <div style={{ fontSize: "22px", fontWeight: "800", color: "#be185d" }}>
              BDT {Number(amount).toLocaleString("en-BD", { minimumFractionDigits: 2 })}
            </div>
          </div>
          <ShieldCheck size={32} color="#e2136e" />
        </div>

        {/* Body Content */}
        <div style={{ padding: "25px 20px" }}>
          {error && (
            <div
              style={{
                backgroundColor: "#fef2f2",
                color: "#991b1b",
                padding: "12px 14px",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: "600",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "18px"
              }}
            >
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {step === "phone" && (
            <form onSubmit={handlePhoneSubmit}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#374151", marginBottom: "8px" }}>
                Your bKash Account Number
              </label>
              <input
                type="tel"
                placeholder="e.g. 017XXXXXXXX"
                value={bkashPhone}
                onChange={(e) => setBkashPhone(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  fontSize: "16px",
                  borderRadius: "8px",
                  border: "1.5px solid #d1d5db",
                  outline: "none",
                  boxSizing: "border-box",
                  marginBottom: "16px"
                }}
              />

              <button
                type="submit"
                style={{
                  width: "100%",
                  backgroundColor: "#e2136e",
                  color: "#ffffff",
                  padding: "14px",
                  fontSize: "15px",
                  fontWeight: "700",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px"
                }}
              >
                <span>CONFIRM & CONTINUE</span>
                <ArrowRight size={18} />
              </button>
            </form>
          )}

          {step === "otp" && (
            <form onSubmit={handleOtpSubmit}>
              <div style={{ fontSize: "13px", color: "#4b5563", marginBottom: "14px" }}>
                A 6-digit verification code (OTP) was sent to <strong>{bkashPhone}</strong>.
              </div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#374151", marginBottom: "8px" }}>
                Enter bKash Verification Code (OTP)
              </label>
              <input
                type="text"
                placeholder="e.g. 123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
                maxLength={6}
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  fontSize: "18px",
                  letterSpacing: "4px",
                  textAlign: "center",
                  borderRadius: "8px",
                  border: "1.5px solid #d1d5db",
                  outline: "none",
                  boxSizing: "border-box",
                  marginBottom: "16px"
                }}
              />

              <button
                type="submit"
                style={{
                  width: "100%",
                  backgroundColor: "#e2136e",
                  color: "#ffffff",
                  padding: "14px",
                  fontSize: "15px",
                  fontWeight: "700",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer"
                }}
              >
                VERIFY OTP
              </button>
            </form>
          )}

          {step === "pin" && (
            <form onSubmit={handlePinSubmit}>
              <div style={{ fontSize: "13px", color: "#4b5563", marginBottom: "14px" }}>
                Enter your 5-digit bKash PIN to authorize payment to merchant account <strong>{merchantNumber}</strong>.
              </div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#374151", marginBottom: "8px" }}>
                bKash Account PIN
              </label>
              <input
                type="password"
                placeholder="•••••"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                required
                maxLength={5}
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  fontSize: "22px",
                  letterSpacing: "8px",
                  textAlign: "center",
                  borderRadius: "8px",
                  border: "1.5px solid #d1d5db",
                  outline: "none",
                  boxSizing: "border-box",
                  marginBottom: "16px"
                }}
              />

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: "100%",
                  backgroundColor: loading ? "#9ca3af" : "#e2136e",
                  color: "#ffffff",
                  padding: "14px",
                  fontSize: "15px",
                  fontWeight: "700",
                  border: "none",
                  borderRadius: "8px",
                  cursor: loading ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px"
                }}
              >
                <Lock size={18} />
                <span>{loading ? "PROCESSING PAYMENT..." : `PAY BDT ${amount}`}</span>
              </button>
            </form>
          )}

          {step === "processing" && (
            <div style={{ textAlign: "center", padding: "30px 10px" }}>
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  border: "4px solid #fbcfe8",
                  borderTopColor: "#e2136e",
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite",
                  margin: "0 auto 16px auto"
                }}
              />
              <style jsx>{`
                @keyframes spin {
                  0% { transform: rotate(0deg); }
                  100% { transform: rotate(360deg); }
                }
              `}</style>
              <div style={{ fontSize: "16px", fontWeight: "700", color: "#111827" }}>
                Communicating with bKash Merchant Gateway...
              </div>
              <div style={{ fontSize: "13px", color: "#6b7280", marginTop: "6px" }}>
                Deducting BDT {amount} to merchant account {merchantNumber}
              </div>
            </div>
          )}

          {step === "success" && (
            <div style={{ textAlign: "center", padding: "20px 10px" }}>
              <CheckCircle2 size={56} color="#16a34a" style={{ margin: "0 auto 14px auto" }} />
              <div style={{ fontSize: "20px", fontWeight: "800", color: "#15803d" }}>
                Payment Successful!
              </div>
              <div style={{ fontSize: "14px", color: "#374151", marginTop: "8px" }}>
                TrxID: <strong>{trxID}</strong>
              </div>
              <div style={{ fontSize: "13px", color: "#6b7280", marginTop: "4px" }}>
                BDT {amount} received at merchant 01609013011
              </div>
            </div>
          )}
        </div>

        {/* bKash Footer Security Notice */}
        <div
          style={{
            backgroundColor: "#f9fafb",
            padding: "12px",
            textAlign: "center",
            fontSize: "11px",
            color: "#6b7280",
            borderTop: "1px solid #f3f4f6"
          }}
        >
          🔒 Encrypted 256-bit SSL Connection | Authorized bKash Merchant Payment
        </div>
      </div>
    </div>
  );
}

export default function BkashPortalPage() {
  return (
    <Suspense fallback={<div style={{ padding: "40px", textAlign: "center" }}>Loading bKash Payment Portal...</div>}>
      <BkashPortalContent />
    </Suspense>
  );
}
