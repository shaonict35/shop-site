"use client";

import React, { useState, useEffect, useRef } from "react";
import { MessageSquare, X, Send, Camera, Smile, ChevronDown } from "lucide-react";
import { usePathname } from "next/navigation";
import { API_BASE } from "../utils/api";

interface ChatMessage {
  id?: string;
  chatId: string;
  sender: "Customer" | "Admin";
  message: string;
  createdAt?: string;
}

// ── Customer Care Girl Avatar Vector Component ──
export function CustomerCareGirlIcon({ size = 32, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={style}
    >
      <defs>
        <linearGradient id="ccg_hair" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1e1b4b" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>
        <linearGradient id="ccg_skin" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffe4c4" />
          <stop offset="100%" stopColor="#fed7aa" />
        </linearGradient>
        <linearGradient id="ccg_headset" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ec4899" />
          <stop offset="100%" stopColor="#be185d" />
        </linearGradient>
        <linearGradient id="ccg_suit" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#e11d48" />
          <stop offset="100%" stopColor="#9f1239" />
        </linearGradient>
      </defs>

      {/* Back Hair */}
      <path
        d="M18 29C18 18 23 11 32 11C41 11 46 18 46 29C46 38 44 47 42 49C38 47 37 42 37 42L27 42C27 42 26 47 22 49C20 47 18 38 18 29Z"
        fill="url(#ccg_hair)"
      />

      {/* Shoulders / Pink Professional Uniform */}
      <path
        d="M16 60C16 50 22 46 32 46C42 46 48 50 48 60V64H16V60Z"
        fill="url(#ccg_suit)"
      />

      {/* Collar Lapels */}
      <path
        d="M26 46L32 55L38 46"
        stroke="#ffffff"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* Neck */}
      <rect x="28" y="38" width="8" height="9" rx="3" fill="url(#ccg_skin)" />

      {/* Face */}
      <ellipse cx="32" cy="28" rx="12.5" ry="13" fill="url(#ccg_skin)" />

      {/* Cheeks Blush */}
      <ellipse cx="23.5" cy="31" rx="3" ry="2" fill="#fb7185" opacity="0.5" />
      <ellipse cx="40.5" cy="31" rx="3" ry="2" fill="#fb7185" opacity="0.5" />

      {/* Happy Friendly Eyes */}
      <path
        d="M23.5 25C24.5 23.5 27 23.5 28 25"
        stroke="#0f172a"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <circle cx="25.5" cy="25" r="0.8" fill="#ffffff" />
      <path
        d="M36 25C37 23.5 39.5 23.5 40.5 25"
        stroke="#0f172a"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <circle cx="38.5" cy="25" r="0.8" fill="#ffffff" />

      {/* Friendly Smile */}
      <path
        d="M27.5 31.5C29 34.5 35 34.5 36.5 31.5"
        stroke="#e11d48"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />

      {/* Side-swept Hair Bangs */}
      <path
        d="M19.5 26C21.5 17 27 13.5 32 13.5C38 13.5 44.5 17 44.5 26C41 22 36 21 33 21C27 21 22 25 19.5 26Z"
        fill="url(#ccg_hair)"
      />
      <path
        d="M19.5 26C21 29 21.5 33 21.5 37C21.5 37 23.5 32 25 29"
        stroke="#1e1b4b"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />

      {/* Customer Care Headset Band */}
      <path
        d="M17 28C16 16 22 9 32 9C42 9 48 16 47 28"
        stroke="url(#ccg_headset)"
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
      />

      {/* Headset Ear Cushion Left */}
      <rect x="14" y="24" width="5.5" height="11" rx="2.5" fill="#be185d" />
      <rect x="15" y="25.5" width="3.5" height="8" rx="1.5" fill="#f472b6" />

      {/* Headset Ear Cushion Right */}
      <rect x="44.5" y="24" width="5.5" height="11" rx="2.5" fill="#be185d" />
      <rect x="45.5" y="25.5" width="3.5" height="8" rx="1.5" fill="#f472b6" />

      {/* Boom Microphone Stem */}
      <path
        d="M16 32C16 38.5 22 41 27.5 38"
        stroke="#1e293b"
        strokeWidth="2.2"
        strokeLinecap="round"
        fill="none"
      />

      {/* Microphone Capsule with Online Indicator */}
      <rect x="27.5" y="36.5" width="4.5" height="3" rx="1.5" fill="#0f172a" />
      <circle cx="29.7" cy="38" r="1.1" fill="#22c55e" />
    </svg>
  );
}

export default function ChatWidget() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [chatId, setChatId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [tempName, setTempName] = useState("");
  const [isNameSet, setIsNameSet] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [showPulse, setShowPulse] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize Chat ID and saved Customer Name
  useEffect(() => {
    if (typeof window !== "undefined") {
      let id = localStorage.getItem("gg_chat_id");
      if (!id) {
        id = "chat_" + Math.random().toString(36).substring(2, 11);
        localStorage.setItem("gg_chat_id", id);
      }
      setChatId(id);

      const savedName = localStorage.getItem("gg_customer_name");
      if (savedName && savedName.trim()) {
        const cleanName = savedName.trim();
        setCustomerName(cleanName);
        setTempName(cleanName);
        setIsNameSet(true);
      }
    }
  }, []);

  // Poll for messages (only when chat is open)
  useEffect(() => {
    if (!chatId || !isOpen) return;

    const fetchHistory = async () => {
      try {
        const res = await fetch(`${API_BASE}/chat/history/${chatId}`);
        if (res.ok) {
          const data = await res.json();
          setMessages(data);
        }
      } catch (e) {
        // Silently fail — backend might be down
      }
    };

    fetchHistory();
    const interval = setInterval(fetchHistory, 3000);
    return () => clearInterval(interval);
  }, [chatId, isOpen]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Hide pulse animation after first open
  useEffect(() => {
    if (isOpen) setShowPulse(false);
  }, [isOpen]);

  // Handle saving customer name
  const handleSaveName = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = tempName.trim();
    if (!trimmed) return;

    setCustomerName(trimmed);
    setIsNameSet(true);
    setIsEditingName(false);

    if (typeof window !== "undefined") {
      localStorage.setItem("gg_customer_name", trimmed);
    }

    // Register with backend so admin sees name immediately
    if (chatId) {
      try {
        await fetch(`${API_BASE}/chat/register-customer`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chatId, customerName: trimmed }),
        });
      } catch (err) {
        console.warn("Failed to register customer name with backend", err);
      }
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() && !isNameSet) {
      setIsEditingName(true);
      return;
    }
    if (!inputValue.trim() || !chatId || isSending) return;

    const msgText = inputValue.trim();
    setInputValue("");
    setIsSending(true);

    const activeName = customerName.trim() || "Customer";

    // Optimistic UI — show message immediately
    const optimisticMsg: ChatMessage = {
      id: "temp_" + Date.now(),
      chatId,
      sender: "Customer",
      message: msgText,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    try {
      const res = await fetch(`${API_BASE}/chat/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId, message: msgText, customerName: activeName }),
      });
      if (res.ok) {
        const newMsg = await res.json();
        // Replace optimistic message with server response
        setMessages((prev) =>
          prev.map((m) => (m.id === optimisticMsg.id ? newMsg : m))
        );
      }
    } catch (e) {
      console.error("Failed to send message", e);
    } finally {
      setIsSending(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("Image size must be less than 2MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64data = reader.result as string;
      const activeName = customerName.trim() || "Customer";

      // Optimistic image
      const optimisticMsg: ChatMessage = {
        id: "temp_img_" + Date.now(),
        chatId,
        sender: "Customer",
        message: base64data,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, optimisticMsg]);

      try {
        const res = await fetch(`${API_BASE}/chat/send`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chatId, message: base64data, customerName: activeName }),
        });
        if (res.ok) {
          const newMsg = await res.json();
          setMessages((prev) =>
            prev.map((m) => (m.id === optimisticMsg.id ? newMsg : m))
          );
        }
      } catch (e) {
        console.error("Failed to upload image", e);
      }
    };
    reader.readAsDataURL(file);
    // Reset input so same file can be selected again
    e.target.value = "";
  };

  const formatTime = (dateStr?: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  if (pathname?.startsWith("/admin") || pathname?.startsWith("/valobasa")) return null;

  return (
    <div
      className="chat-widget-root fixed bottom-6 right-6 z-50"
      style={{
        position: "fixed",
        bottom: "24px",
        right: "24px",
        zIndex: 50,
        fontFamily: "'Inter', 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      {/* ═══ Floating Chat Button (Customer Care Girl - Not Round!) ═══ */}
      {!isOpen && (
        <button
          className="chat-widget-toggle-btn"
          onClick={() => setIsOpen(true)}
          aria-label="Open Customer Care chat support"
          style={{
            height: "54px",
            padding: "5px 16px 5px 6px",
            borderRadius: "27px",
            background: "linear-gradient(135deg, #e63b7a 0%, #db2777 50%, #be185d 100%)",
            color: "#fff",
            border: "1.5px solid rgba(255, 255, 255, 0.4)",
            boxShadow: "0 8px 24px rgba(230, 59, 122, 0.42), 0 2px 8px rgba(0,0,0,0.08)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            transition: "all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)",
            position: "relative",
            animation: showPulse ? "chatBadgeBounce 3s ease-in-out infinite" : "none",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-3px) scale(1.03)";
            e.currentTarget.style.boxShadow = "0 12px 28px rgba(230, 59, 122, 0.55), 0 4px 10px rgba(0,0,0,0.12)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0) scale(1)";
            e.currentTarget.style.boxShadow = "0 8px 24px rgba(230, 59, 122, 0.42), 0 2px 8px rgba(0,0,0,0.08)";
          }}
        >
          {/* Customer Care Girl Avatar in squircle frame (Not round!) */}
          <div
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "14px",
              backgroundColor: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
              position: "relative",
              flexShrink: 0,
            }}
          >
            <CustomerCareGirlIcon size={35} />
            {/* Green Online Pulsing Indicator */}
            <span
              style={{
                position: "absolute",
                bottom: "-1px",
                right: "-1px",
                width: "11px",
                height: "11px",
                borderRadius: "50%",
                backgroundColor: "#22c55e",
                border: "2px solid #ffffff",
                boxShadow: "0 0 6px rgba(34, 197, 94, 0.6)",
              }}
            />
          </div>

          {/* Text block */}
          <div style={{ textAlign: "left", display: "flex", flexDirection: "column" }}>
            <span
              style={{
                fontWeight: "800",
                fontSize: "13px",
                lineHeight: "1.2",
                color: "#ffffff",
                letterSpacing: "0.2px",
              }}
            >
              কাস্টমার কেয়ার
            </span>
            <span
              style={{
                fontSize: "10.5px",
                fontWeight: "600",
                color: "#fce7f3",
                lineHeight: "1.3",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <span
                style={{
                  width: "5px",
                  height: "5px",
                  borderRadius: "50%",
                  backgroundColor: "#4ade80",
                  display: "inline-block",
                }}
              />
              অনলাইন • চ্যাট করুন 💬
            </span>
          </div>
        </button>
      )}

      {/* ═══ Compact Chat Window ═══ */}
      {isOpen && (
        <div
          className="chat-widget-window"
          style={{
            width: "320px",
            maxWidth: "calc(100vw - 30px)",
            height: "430px",
            maxHeight: "calc(100vh - 90px)",
            backgroundColor: "#ffffff",
            borderRadius: "16px",
            boxShadow: "0 12px 40px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.08)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            border: "1px solid rgba(237, 242, 247, 0.8)",
            animation: "chatSlideUp 0.3s cubic-bezier(0.34,1.56,0.64,1)",
          }}
        >
          {/* ── Header ── */}
          <div
            style={{
              padding: "12px 16px",
              background: "linear-gradient(135deg, #e63b7a 0%, #db2777 100%)",
              color: "#fff",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  width: "38px",
                  height: "38px",
                  borderRadius: "12px",
                  backgroundColor: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                  position: "relative",
                  flexShrink: 0,
                }}
              >
                <CustomerCareGirlIcon size={32} />
                <span
                  style={{
                    position: "absolute",
                    bottom: "-2px",
                    right: "-2px",
                    width: "10px",
                    height: "10px",
                    borderRadius: "50%",
                    backgroundColor: "#22c55e",
                    border: "2px solid #ffffff",
                  }}
                />
              </div>
              <div>
                <div style={{ fontWeight: "800", fontSize: "13.5px", letterSpacing: "0.2px" }}>
                  সাদিয়া • কাস্টমার কেয়ার
                </div>
                <div style={{ fontSize: "11px", opacity: 0.95, fontWeight: "600", display: "flex", alignItems: "center", gap: "5px" }}>
                  <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#4ade80", display: "inline-block" }} />
                  অনলাইন স্পেশালিস্ট • প্রস্তুত
                </div>
              </div>
            </div>
            {/* Close Arrow Button */}
            <button
              onClick={() => setIsOpen(false)}
              aria-label="Close chat window"
              style={{
                background: "rgba(255,255,255,0.25)",
                border: "none",
                color: "#fff",
                cursor: "pointer",
                borderRadius: "50%",
                width: "28px",
                height: "28px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.4)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.25)")}
              title="Close chat"
            >
              <ChevronDown size={20} />
            </button>
          </div>

          {/* ── Content View: Name Onboarding Prompt OR Messages Feed ── */}
          {(!isNameSet || isEditingName) ? (
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "24px 20px",
                textAlign: "center",
                backgroundColor: "#ffffff",
                backgroundImage: "radial-gradient(circle at 50% 10%, rgba(230,59,122,0.06), transparent 70%)",
              }}
            >
              <div
                style={{
                  width: "64px",
                  height: "64px",
                  borderRadius: "18px",
                  backgroundColor: "#fff0f5",
                  border: "2px solid #fecdd3",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 8px 20px rgba(230, 59, 122, 0.15)",
                  marginBottom: "14px",
                }}
              >
                <CustomerCareGirlIcon size={50} />
              </div>

              <h3
                style={{
                  fontSize: "15.5px",
                  fontWeight: "800",
                  color: "#1e293b",
                  margin: "0 0 6px 0",
                }}
              >
                কাস্টমার কেয়ার চ্যাটে স্বাগতম! 🌸
              </h3>

              <p
                style={{
                  fontSize: "12px",
                  color: "#64748b",
                  lineHeight: "1.5",
                  margin: "0 0 18px 0",
                  maxWidth: "250px",
                }}
              >
                চ্যাট শুরু করতে অনুগ্রহ করে আপনার নামটি লিখুন:
              </p>

              <form
                onSubmit={handleSaveName}
                style={{
                  width: "100%",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                <div style={{ textAlign: "left" }}>
                  <label
                    htmlFor="customer-name-field"
                    style={{
                      display: "block",
                      fontSize: "11.5px",
                      fontWeight: "700",
                      color: "#334155",
                      marginBottom: "5px",
                    }}
                  >
                    আপনার নাম (Customer Name) *
                  </label>
                  <input
                    id="customer-name-field"
                    type="text"
                    autoFocus
                    required
                    placeholder="যেমন: তানজিলা আক্তার বা রাফি"
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "11px 14px",
                      borderRadius: "12px",
                      border: "1.5px solid #fbcfe8",
                      fontSize: "13.5px",
                      fontWeight: "600",
                      color: "#0f172a",
                      backgroundColor: "#fdf2f8",
                      outline: "none",
                      boxSizing: "border-box",
                      transition: "all 0.2s",
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = "#e63b7a";
                      e.currentTarget.style.backgroundColor = "#ffffff";
                      e.currentTarget.style.boxShadow = "0 0 0 3px rgba(230, 59, 122, 0.12)";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = "#fbcfe8";
                      e.currentTarget.style.backgroundColor = "#fdf2f8";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={!tempName.trim()}
                  style={{
                    width: "100%",
                    padding: "11px",
                    borderRadius: "12px",
                    border: "none",
                    background: tempName.trim()
                      ? "linear-gradient(135deg, #e63b7a 0%, #db2777 100%)"
                      : "#cbd5e1",
                    color: "#ffffff",
                    fontSize: "13.5px",
                    fontWeight: "800",
                    cursor: tempName.trim() ? "pointer" : "not-allowed",
                    boxShadow: tempName.trim() ? "0 4px 14px rgba(230, 59, 122, 0.35)" : "none",
                    transition: "all 0.2s",
                  }}
                >
                  চ্যাট শুরু করুন 💬
                </button>

                {isEditingName && (
                  <button
                    type="button"
                    onClick={() => setIsEditingName(false)}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "#94a3b8",
                      fontSize: "12px",
                      fontWeight: "600",
                      cursor: "pointer",
                      padding: "4px",
                    }}
                  >
                    বাতিল করুন
                  </button>
                )}
              </form>

              <div
                style={{
                  marginTop: "16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "10.5px",
                  color: "#94a3b8",
                }}
              >
                <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#22c55e" }} />
                <span>আমাদের লাইভ টিম এখন সক্রিয় রয়েছে</span>
              </div>
            </div>
          ) : (
            <>
              {/* ── Subheader with customer's active identity & change option ── */}
              <div
                style={{
                  padding: "6px 14px",
                  backgroundColor: "#fff1f2",
                  borderBottom: "1px solid #ffe4e6",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  fontSize: "11.5px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#881337", fontWeight: "600" }}>
                  <span>👤</span>
                  <span>
                    চ্যাট করছেন: <strong>{customerName}</strong>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setTempName(customerName);
                    setIsEditingName(true);
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#e63b7a",
                    fontSize: "11px",
                    fontWeight: "700",
                    cursor: "pointer",
                    padding: "2px 6px",
                    borderRadius: "6px",
                  }}
                >
                  নাম পরিবর্তন ✎
                </button>
              </div>

              {/* ── Messages Area ── */}
              <div
                style={{
                  flex: 1,
                  padding: "16px",
                  overflowY: "auto",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                  backgroundColor: "#f8fafc",
                  backgroundImage: "radial-gradient(circle at 20% 80%, rgba(230,59,122,0.03), transparent 50%), radial-gradient(circle at 80% 20%, rgba(100,100,255,0.03), transparent 50%)",
                }}
              >
                {messages.length === 0 && (
                  <div style={{ textAlign: "center", marginTop: "32px", padding: "0 20px" }}>
                    <div
                      style={{
                        width: "56px",
                        height: "56px",
                        borderRadius: "16px",
                        backgroundColor: "#ffffff",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 4px 14px rgba(230, 59, 122, 0.15)",
                        border: "1px solid #fce7f3",
                        marginBottom: "12px",
                      }}
                    >
                      <CustomerCareGirlIcon size={46} />
                    </div>
                    <div style={{ color: "#1e293b", fontSize: "14px", fontWeight: "800", marginBottom: "6px" }}>
                      হাই {customerName || "বন্ধু"}! গ্লো গুডলি কাস্টমার কেয়ারে স্বাগতম 👋
                    </div>
                    <div style={{ color: "#64748b", fontSize: "12px", fontWeight: "500", lineHeight: "1.5" }}>
                      স্কিনকেয়ার পরামর্শ, অর্ডার ট্র্যাকিং বা যেকোনো প্রশ্নে মেসেজ পাঠান। আমি এখনই সাহায্য করছি!
                    </div>
                  </div>
                )}

                {messages.map((msg, idx) => {
                  const isAdmin = msg.sender === "Admin";
                  const isImg = msg.message && msg.message.startsWith("data:image/");
                  return (
                    <div key={msg.id || idx} style={{ display: "flex", flexDirection: "column", alignItems: isAdmin ? "flex-start" : "flex-end" }}>
                      <div style={{ display: "flex", alignItems: "flex-end", gap: "6px", maxWidth: "86%", flexDirection: isAdmin ? "row" : "row-reverse" }}>
                        {isAdmin && (
                          <div
                            style={{
                              width: "24px",
                              height: "24px",
                              borderRadius: "8px",
                              backgroundColor: "#ffffff",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
                              flexShrink: 0,
                              marginBottom: "4px",
                            }}
                          >
                            <CustomerCareGirlIcon size={20} />
                          </div>
                        )}
                        <div
                          style={{
                            backgroundColor: isAdmin ? "#ffffff" : "#e63b7a",
                            color: isAdmin ? "#1e293b" : "#ffffff",
                            padding: isImg ? "6px" : "10px 14px",
                            borderRadius: isAdmin ? "4px 16px 16px 16px" : "16px 4px 16px 16px",
                            fontSize: "13px",
                            lineHeight: "1.5",
                            fontWeight: "500",
                            boxShadow: isAdmin ? "0 1px 4px rgba(0,0,0,0.06)" : "0 2px 8px rgba(230,59,122,0.2)",
                            wordBreak: "break-word",
                          }}
                        >
                          {isImg ? (
                            <img
                              src={msg.message}
                              alt="Attachment"
                              style={{
                                maxWidth: "100%",
                                maxHeight: "200px",
                                borderRadius: "10px",
                                display: "block",
                                objectFit: "cover",
                              }}
                            />
                          ) : (
                            msg.message
                          )}
                        </div>
                      </div>
                      {/* Timestamp */}
                      <span style={{ fontSize: "10px", color: "#94a3b8", fontWeight: "600", marginTop: "3px", padding: "0 4px", marginLeft: isAdmin ? "30px" : "0" }}>
                        {isAdmin ? "সাদিয়া (Customer Care) • " : ""}{formatTime(msg.createdAt)}
                      </span>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* ── Input Form ── */}
              <form
                onSubmit={handleSendMessage}
                style={{
                  padding: "12px 16px",
                  borderTop: "1px solid #edf2f7",
                  display: "flex",
                  gap: "8px",
                  alignItems: "center",
                  backgroundColor: "#ffffff",
                }}
              >
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#a0aec0",
                    cursor: "pointer",
                    padding: "6px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "50%",
                    transition: "color 0.15s, background 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "#e63b7a";
                    e.currentTarget.style.background = "#fff5f7";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "#a0aec0";
                    e.currentTarget.style.background = "none";
                  }}
                  title="Upload image"
                >
                  <Camera size={20} />
                </button>
                <input
                  id="chat-file-input"
                  name="chatFile"
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  style={{ display: "none" }}
                />
                <input
                  id="chat-message-input"
                  name="chatMessage"
                  type="text"
                  aria-label="Type your message"
                  placeholder="Type a message..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  style={{
                    flex: 1,
                    padding: "10px 16px",
                    borderRadius: "24px",
                    border: "1.5px solid #edf2f7",
                    fontSize: "13px",
                    fontWeight: "500",
                    outline: "none",
                    backgroundColor: "#f7fafc",
                    color: "#000000",
                    transition: "border-color 0.2s",
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "#e63b7a")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "#edf2f7")}
                />
                <button
                  type="submit"
                  disabled={isSending || !inputValue.trim()}
                  style={{
                    width: "38px",
                    height: "38px",
                    borderRadius: "50%",
                    background: inputValue.trim() ? "linear-gradient(135deg, #e63b7a, #ff758c)" : "#edf2f7",
                    color: inputValue.trim() ? "#fff" : "#a0aec0",
                    border: "none",
                    cursor: inputValue.trim() ? "pointer" : "default",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "background 0.2s, transform 0.15s",
                    flexShrink: 0,
                  }}
                  onMouseEnter={(e) => {
                    if (inputValue.trim()) e.currentTarget.style.transform = "scale(1.08)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "scale(1)";
                  }}
                >
                  <Send size={16} />
                </button>
              </form>
            </>
          )}
        </div>
      )}

      {/* Keyframe animations and responsive positioning */}
      <style>{`
        .chat-widget-root {
          position: fixed;
          bottom: 24px;
          right: 24px;
          z-index: 50;
        }
        @media (max-width: 768px) {
          .chat-widget-root {
            bottom: 74px !important;
            right: 16px !important;
          }
          .chat-widget-window {
            width: calc(100vw - 32px) !important;
            max-height: calc(100vh - 160px) !important;
          }
        }
        @media (max-width: 420px) {
          .chat-widget-toggle-btn {
            padding: 5px 12px 5px 6px !important;
            height: 50px !important;
          }
        }
        @keyframes chatBadgeBounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
        @keyframes chatPulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.4); opacity: 0.6; }
        }
        @keyframes chatSlideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
