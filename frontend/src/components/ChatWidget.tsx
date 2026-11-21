"use client";

import React, { useState, useEffect, useRef } from "react";
import { MessageSquare, X, Send, Camera, Smile, ChevronDown } from "lucide-react";
import { usePathname } from "next/navigation";
import { io } from "socket.io-client";
import { API_BASE, API_ROOT } from "../utils/api";

interface ChatMessage {
  id?: string;
  chatId: string;
  sender: "Customer" | "Admin";
  message: string;
  createdAt?: string;
}

export default function ChatWidget() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [chatId, setChatId] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [showPulse, setShowPulse] = useState(true);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [isRegistered, setIsRegistered] = useState(false);
  const [regNameInput, setRegNameInput] = useState("");
  const [regPhoneInput, setRegPhoneInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize Chat ID and User Info
  useEffect(() => {
    if (typeof window !== "undefined") {
      let id = localStorage.getItem("gg_chat_id");
      if (!id) {
        id = "chat_" + Math.random().toString(36).substring(2, 11);
        localStorage.setItem("gg_chat_id", id);
      }
      setChatId(id);

      const savedName = localStorage.getItem("gg_chat_user_name");
      const savedPhone = localStorage.getItem("gg_chat_user_phone");
      if (savedName && savedPhone) {
        setCustomerName(savedName);
        setCustomerPhone(savedPhone);
        setRegNameInput(savedName);
        setRegPhoneInput(savedPhone);
        setIsRegistered(true);
      }
    }
  }, []);

  // Real-time pure Socket.io message synchronization (Zero HTTP polling)
  useEffect(() => {
    if (!chatId || !isOpen || !isRegistered) return;

    // 1. Fetch past conversation history ONCE when opened
    const fetchHistory = async () => {
      try {
        const res = await fetch(`${API_BASE}/chat/history/${chatId}`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setMessages(data);
          }
        }
      } catch (e) {
        // Silently fail — backend might be temporarily offline
      }
    };
    fetchHistory();

    // 2. Pure real-time Socket.io listeners for incoming customer and admin replies
    let socket: any = null;
    try {
      socket = io(API_ROOT, {
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 2000,
      });

      const handleIncomingMessage = (newMsg: any) => {
        if (!newMsg || !newMsg.message) return;
        if (newMsg.chatId === chatId) {
          setMessages((prev) => {
            if (newMsg.id && prev.some((m) => m.id === newMsg.id)) {
              return prev;
            }
            return [...prev, newMsg];
          });
        }
      };

      socket.on("chat:new_message", handleIncomingMessage);
      socket.on("new_chat_message", handleIncomingMessage);
      socket.on("admin_reply", handleIncomingMessage);
    } catch (err) {
      console.warn("Socket.io chat connection failed:", err);
    }

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [chatId, isOpen, isRegistered]);

  // Handle start chat with customer name & phone + send instant Bengali auto-reply
  const handleStartChatWithInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = regNameInput.trim();
    const phone = regPhoneInput.trim();
    if (!name || !phone) {
      alert("দয়া করে আপনার নাম এবং মোবাইল নম্বর প্রদান করুন।");
      return;
    }
    setCustomerName(name);
    setCustomerPhone(phone);
    setIsRegistered(true);

    if (typeof window !== "undefined") {
      localStorage.setItem("gg_chat_user_name", name);
      localStorage.setItem("gg_chat_user_phone", phone);
    }

    // Instant Bengali welcome auto-reply addressing the customer by name
    const autoReplyText = `হ্যালো ${name}! GlowGoodly-তে আপনাকে স্বাগতম 🌸 আপনার কোনো প্রোডাক্ট বা অর্ডার সম্পর্কিত প্রশ্ন থাকলে নির্দ্বিধায় জানান। আমাদের বিউটি এক্সপার্ট ও সাপোর্ট টিম এখনই আপনাকে সাহায্য করছে!`;

    const autoMsg: ChatMessage = {
      id: "bot_" + Date.now(),
      chatId,
      sender: "Admin",
      message: autoReplyText,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, autoMsg]);

    try {
      await fetch(`${API_BASE}/chat/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatId,
          message: autoReplyText,
          sender: "Admin",
          customerName: name,
          customerPhone: phone,
        }),
      });
    } catch (err) {}
  };

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Hide pulse animation after first open
  useEffect(() => {
    if (isOpen) setShowPulse(false);
  }, [isOpen]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !chatId || isSending) return;

    const msgText = inputValue.trim();
    setInputValue("");
    setIsSending(true);

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
        body: JSON.stringify({
          chatId,
          message: msgText,
          sender: "Customer",
          customerName,
          customerPhone,
        }),
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
          body: JSON.stringify({
            chatId,
            message: base64data,
            sender: "Customer",
            customerName,
            customerPhone,
          }),
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
    <div style={{ position: "fixed", bottom: "20px", right: "20px", zIndex: 9999, fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>
      {/* ═══ Floating Chat Button ═══ */}
      {!isOpen && (
        <button
          className="chat-widget-toggle-btn"
          onClick={() => setIsOpen(true)}
          aria-label="Open chat support"
          style={{
            width: "52px",
            height: "52px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, #e63b7a 0%, #ff758c 100%)",
            color: "#fff",
            border: "none",
            boxShadow: "0 6px 20px rgba(230, 59, 122, 0.4)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "transform 0.25s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.25s",
            position: "relative",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "scale(1.1)";
            e.currentTarget.style.boxShadow = "0 8px 25px rgba(230, 59, 122, 0.5)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
            e.currentTarget.style.boxShadow = "0 6px 20px rgba(230, 59, 122, 0.4)";
          }}
        >
          <MessageSquare size={22} />
          {/* Pulse ring animation */}
          {showPulse && (
            <span
              style={{
                position: "absolute",
                top: "-2px",
                right: "-2px",
                width: "14px",
                height: "14px",
                borderRadius: "50%",
                backgroundColor: "#48bb78",
                border: "2px solid #fff",
                animation: "chatPulse 2s ease-in-out infinite",
              }}
            />
          )}
        </button>
      )}

      {/* ═══ Compact Chat Window ═══ */}
      {isOpen && (
        <div
          style={{
            width: "315px",
            maxWidth: "calc(100vw - 30px)",
            height: "420px",
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
              background: "linear-gradient(135deg, #e63b7a 0%, #ff758c 100%)",
              color: "#fff",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.2)",
                  backdropFilter: "blur(6px)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "15px",
                }}
              >
                💬
              </div>
              <div>
                <div style={{ fontWeight: "800", fontSize: "13px", letterSpacing: "0.2px" }}>
                  GlowGoodly Support
                </div>
                <div style={{ fontSize: "10.5px", opacity: 0.9, fontWeight: "600", display: "flex", alignItems: "center", gap: "4px" }}>
                  <span style={{ width: "5px", height: "5px", borderRadius: "50%", backgroundColor: "#48bb78", display: "inline-block" }} />
                  Online now
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

          {!isRegistered ? (
            /* ── Customer Registration View Before Starting Chat ── */
            <div
              style={{
                flex: 1,
                padding: "20px 18px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                backgroundColor: "#f8fafc",
                overflowY: "auto",
              }}
            >
              <div style={{ textAlign: "center", marginBottom: "16px" }}>
                <div style={{ fontSize: "38px", marginBottom: "6px" }}>🌸💬</div>
                <h3 style={{ fontSize: "16px", fontWeight: "800", color: "#1e293b", margin: "0 0 4px 0" }}>
                  লাইভ চ্যাটে স্বাগতম!
                </h3>
                <p style={{ fontSize: "12px", color: "#64748b", margin: 0, lineHeight: "1.5" }}>
                  আপনাকে দ্রুত ও নির্ভুল সহায়তা দিতে অনুগ্রহ করে আপনার নাম ও মোবাইল নম্বর প্রদান করুন:
                </p>
              </div>

              <form onSubmit={handleStartChatWithInfo} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "11.5px", fontWeight: "700", color: "#334155", display: "block", marginBottom: "4px" }}>
                    আপনার নাম *
                  </label>
                  <input
                    required
                    type="text"
                    value={regNameInput}
                    onChange={(e) => setRegNameInput(e.target.value)}
                    placeholder="যেমন: ফাতেমা আক্তার"
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: "8px",
                      border: "1.5px solid #cbd5e1",
                      fontSize: "13px",
                      outline: "none",
                      boxSizing: "border-box",
                      backgroundColor: "#fff",
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "11.5px", fontWeight: "700", color: "#334155", display: "block", marginBottom: "4px" }}>
                    মোবাইল নম্বর *
                  </label>
                  <input
                    required
                    type="tel"
                    value={regPhoneInput}
                    onChange={(e) => setRegPhoneInput(e.target.value)}
                    placeholder="যেমন: 017XXXXXXXX"
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: "8px",
                      border: "1.5px solid #cbd5e1",
                      fontSize: "13px",
                      outline: "none",
                      boxSizing: "border-box",
                      backgroundColor: "#fff",
                    }}
                  />
                </div>

                <button
                  type="submit"
                  style={{
                    marginTop: "6px",
                    backgroundColor: "#e63b7a",
                    color: "#fff",
                    border: "none",
                    padding: "12px",
                    borderRadius: "8px",
                    fontWeight: "800",
                    fontSize: "13.5px",
                    cursor: "pointer",
                    boxShadow: "0 4px 12px rgba(230,59,122,0.35)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    transition: "transform 0.15s, background 0.2s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.02)")}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                >
                  <span>চ্যাট শুরু করুন</span> 🚀
                </button>
              </form>
            </div>
          ) : (
            <>
              {/* ── Messages Area ── */}
              <div
                style={{
                  flex: 1,
                  padding: "16px",
                  overflowY: "auto",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                  backgroundColor: "#f8fafc",
                  backgroundImage: "radial-gradient(circle at 20% 80%, rgba(230,59,122,0.03), transparent 50%), radial-gradient(circle at 80% 20%, rgba(100,100,255,0.03), transparent 50%)",
                }}
              >
                {messages.length === 0 && (
                  <div style={{ textAlign: "center", marginTop: "50px", padding: "0 25px" }}>
                    <div style={{ fontSize: "40px", marginBottom: "12px" }}>👋</div>
                    <div style={{ color: "#4a5568", fontSize: "14px", fontWeight: "700", marginBottom: "6px" }}>
                      Hi {customerName}! Welcome to GlowGoodly
                    </div>
                    <div style={{ color: "#a0aec0", fontSize: "12.5px", fontWeight: "600", lineHeight: "1.5" }}>
                      Ask us anything about products, orders, or beauty tips. We usually reply within a few minutes!
                    </div>
                  </div>
                )}

                {messages.map((msg, idx) => {
                  const isAdmin = msg.sender === "Admin";
                  const isImg = msg.message && msg.message.startsWith("data:image/");
                  return (
                    <div key={msg.id || idx} style={{ display: "flex", flexDirection: "column", alignItems: isAdmin ? "flex-start" : "flex-end" }}>
                      <div
                        style={{
                          backgroundColor: isAdmin ? "#ffffff" : "#e63b7a",
                          color: isAdmin ? "#2d3748" : "#ffffff",
                          padding: isImg ? "6px" : "10px 15px",
                          borderRadius: isAdmin ? "4px 16px 16px 16px" : "16px 4px 16px 16px",
                          maxWidth: "78%",
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
                      {/* Timestamp */}
                      <span style={{ fontSize: "10px", color: "#a0aec0", fontWeight: "600", marginTop: "3px", padding: "0 4px" }}>
                        {isAdmin ? "Support • " : ""}{formatTime(msg.createdAt)}
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

      {/* Keyframe animations */}
      <style>{`
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
