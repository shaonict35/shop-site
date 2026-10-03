"use client";

import React, { useState, useEffect, useRef } from "react";
import { Send, Sparkles, Radio, Users, Tag, Image as ImageIcon, Upload, RefreshCw, Trash2, Edit3, CheckCircle, AlertCircle, Clock, Square, Eye } from "lucide-react";
import { io, Socket } from "socket.io-client";
import { API_BASE, API_ROOT } from "../utils/api";

interface PromoItem {
  id: string;
  title: string;
  message: string;
  code?: string;
  discount?: string;
  link?: string;
  image?: string;
  timestamp?: string;
}

export default function SocketIoPromoBroadcaster({ token }: { token: string | null }) {
  const [title, setTitle] = useState("⚡ Exclusive Flash Sale Alert!");
  const [message, setMessage] = useState("Get BDT 150 discount on your order using promo code GLOW15 at checkout!");
  const [code, setCode] = useState("GLOW15");
  const [discount, setDiscount] = useState("BDT 150 OFF");
  const [link, setLink] = useState("/shop");
  const [image, setImage] = useState("");

  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [socketConnected, setSocketConnected] = useState(false);
  const [activeClients, setActiveClients] = useState<number | null>(null);
  const [promoHistory, setPromoHistory] = useState<PromoItem[]>([]);
  const [activeBroadcast, setActiveBroadcast] = useState<PromoItem | null>(null);

  const socketRef = useRef<Socket | null>(null);

  // Fetch past promo history from backend
  const fetchPromoHistory = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/broadcast-promo`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setPromoHistory(data);
          if (data.length > 0) {
            setActiveBroadcast(data[0]);
            try { localStorage.setItem("gg_promo_history", JSON.stringify(data)); } catch (e) {}
          } else {
            setActiveBroadcast(null);
            try { localStorage.removeItem("gg_promo_history"); } catch (e) {}
          }
          return;
        }
      }
    } catch (e) {
      console.log("Using local history fallback");
    }

    const saved = localStorage.getItem("gg_promo_history");
    if (saved && saved.trim()) {
      try {
        setPromoHistory(JSON.parse(saved));
      } catch (e) {
        localStorage.removeItem("gg_promo_history");
      }
    }
  };

  useEffect(() => {
    fetchPromoHistory();

    const socket: Socket = io(API_ROOT, {
      transports: ["websocket", "polling"]
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      setSocketConnected(true);
    });

    socket.on("disconnect", () => {
      setSocketConnected(false);
    });

    socket.on("clients:count", (count: number) => {
      setActiveClients(count);
    });

    socket.on("promo:message", (data: PromoItem) => {
      if (data && data.title) {
        setActiveBroadcast(data);
      }
    });

    socket.on("promo:clear", () => {
      setActiveBroadcast(null);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  // Handle local image file upload (FileReader Base64)
  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) {
        setStatusMsg("❌ Image size is too large. Please select an image under 3MB.");
        return;
      }
      const reader = new FileReader();
      reader.onload = (evt) => {
        if (evt.target?.result) {
          setImage(evt.target.result as string);
          setStatusMsg("✅ Image file loaded successfully!");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const getAuthHeader = (): Record<string, string> => {
    const activeToken = token || (typeof window !== "undefined" ? (localStorage.getItem("gg_token") || localStorage.getItem("glowgoodly_token") || "") : "");
    if (activeToken && activeToken !== "null" && activeToken !== "undefined") {
      return { Authorization: `Bearer ${activeToken}` };
    }
    return {};
  };

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !message) {
      setStatusMsg("Title and Message are required.");
      return;
    }

    setLoading(true);
    setStatusMsg("");

    try {
      const payload = {
        title,
        message,
        code,
        discount,
        link,
        image
      };

      const res = await fetch(`${API_BASE}/admin/broadcast-promo`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader()
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setActiveClients(data.activeClients);
        setStatusMsg(`✅ Broadcast Sent! Delivered live to ${data.activeClients ?? "all"} active website visitors via Socket.io.`);
        if (data.promo) {
          setActiveBroadcast(data.promo);
          setPromoHistory((prev) => {
            const updated = [data.promo, ...prev.filter(p => p.id !== data.promo.id)];
            try { localStorage.setItem("gg_promo_history", JSON.stringify(updated)); } catch (e) {}
            return updated;
          });
        }
      } else {
        setStatusMsg(`❌ Error: ${data.error || "Failed to broadcast message"}`);
      }
    } catch (err) {
      setStatusMsg("❌ Network error sending Socket.io broadcast.");
    } finally {
      setLoading(false);
    }
  };

  // Stop / Clear the active live broadcast from all visitor screens
  const handleClearActivePromo = async () => {
    if (!confirm("Stop and remove the live popup from all active visitor screens right now?")) return;

    setActiveBroadcast(null);
    try {
      if (socketRef.current) {
        socketRef.current.emit("admin:clear-promo");
      }
      const res = await fetch(`${API_BASE}/admin/broadcast-promo/clear`, {
        method: "POST",
        headers: getAuthHeader()
      });
      if (res.ok) {
        setStatusMsg("🛑 Live promo popup cleared and removed from all visitors' screens!");
      }
    } catch (e: any) {
      setStatusMsg("❌ Error clearing live promo: " + e.message);
    }
  };

  // Re-broadcast a past saved promo with 1-click
  const handleResendPromo = async (item: PromoItem) => {
    setLoading(true);
    setStatusMsg(`Sending broadcast for "${item.title}"...`);

    try {
      const res = await fetch(`${API_BASE}/admin/broadcast-promo`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader()
        },
        body: JSON.stringify(item)
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setActiveClients(data.activeClients);
        setStatusMsg(`🚀 Re-Sent Broadcast! "${item.title}" delivered to ${data.activeClients ?? "all"} live website visitors.`);
        if (data.promo) {
          setActiveBroadcast(data.promo);
          setPromoHistory((prev) => {
            const updated = [data.promo, ...prev.filter(p => p.id !== data.promo.id)];
            try { localStorage.setItem("gg_promo_history", JSON.stringify(updated)); } catch (e) {}
            return updated;
          });
        }
      } else {
        setStatusMsg(`❌ Resend Error: ${data.error}`);
      }
    } catch (e) {
      setStatusMsg("❌ Network error resending broadcast.");
    } finally {
      setLoading(false);
    }
  };

  // Load a saved promo into the form for editing
  const handleLoadInForm = (item: PromoItem) => {
    setTitle(item.title);
    setMessage(item.message);
    setCode(item.code || "");
    setDiscount(item.discount || "");
    setLink(item.link || "/shop");
    setImage(item.image || "");
    setStatusMsg(`Loaded "${item.title}" into broadcast editor.`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Permanently delete promo from server DB & memory & local state
  const handleDeleteHistory = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this promo? It will be removed from the server and will not come back on reload.")) return;

    // Optimistically remove from state
    setPromoHistory((prev) => {
      const updated = prev.filter((p) => p.id !== id);
      try {
        if (updated.length > 0) {
          localStorage.setItem("gg_promo_history", JSON.stringify(updated));
        } else {
          localStorage.removeItem("gg_promo_history");
        }
      } catch (e) {}
      return updated;
    });

    if (activeBroadcast?.id === id) {
      setActiveBroadcast(null);
    }

    try {
      const res = await fetch(`${API_BASE}/admin/broadcast-promo/${id}`, {
        method: "DELETE",
        headers: getAuthHeader()
      });

      if (res.ok) {
        setStatusMsg("✅ Promo deleted permanently from server and stopped from live screens!");
      } else {
        setStatusMsg("⚠️ Server response on delete: " + res.statusText);
      }
    } catch (err: any) {
      console.error("Error deleting promo:", err);
      setStatusMsg("❌ Network error deleting promo from server.");
    }
  };

  // Clear all promos from server
  const handleClearAllHistory = async () => {
    if (!confirm("Delete ALL promos from the history and server database?")) return;

    setPromoHistory([]);
    setActiveBroadcast(null);
    try { localStorage.removeItem("gg_promo_history"); } catch (e) {}

    try {
      await fetch(`${API_BASE}/admin/broadcast-promo`, {
        method: "DELETE",
        headers: getAuthHeader()
      });
      setStatusMsg("✅ All promo history cleared permanently from server!");
    } catch (e) {}
  };

  // Preview / Test popup on this browser
  const handleTestPopup = () => {
    window.dispatchEvent(new CustomEvent("gg_test_promo", {
      detail: {
        id: "test_" + Date.now(),
        title,
        message,
        code,
        discount,
        link,
        image,
        timestamp: new Date().toISOString()
      }
    }));
    setStatusMsg("✨ Test popup preview displayed on your screen right now!");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Broadcaster Main Form */}
      <div style={{ backgroundColor: "#ffffff", borderRadius: "14px", border: "1px solid #e2e8f0", padding: "24px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", borderBottom: "2px solid #f1f5f9", paddingBottom: "14px", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h2 style={{ fontSize: "20px", fontWeight: "900", color: "#e63b7a", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
              <Radio size={22} className="animate-pulse" />
              📢 Socket.io Real-Time Promo Broadcaster (Free WebSockets)
            </h2>
            <p style={{ fontSize: "13px", color: "#64748b", margin: "4px 0 0 0" }}>
              Send instant promotional offers, uploaded banner graphics, and discount codes to all online website visitors.
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ backgroundColor: socketConnected ? "#ecfdf5" : "#fef2f2", border: `1px solid ${socketConnected ? "#a7f3d0" : "#fecaca"}`, padding: "8px 14px", borderRadius: "20px", display: "flex", alignItems: "center", gap: "6px" }}>
              <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: socketConnected ? "#059669" : "#dc2626" }} />
              <span style={{ fontSize: "12.5px", fontWeight: "800", color: socketConnected ? "#047857" : "#b91c1c" }}>
                {socketConnected ? `Live Connected (${activeClients !== null ? activeClients : 1} Users)` : "Reconnecting..."}
              </span>
            </div>

            {activeBroadcast && (
              <button
                type="button"
                onClick={handleClearActivePromo}
                style={{
                  backgroundColor: "#fee2e2",
                  color: "#991b1b",
                  border: "1px solid #fca5a5",
                  padding: "7px 12px",
                  borderRadius: "8px",
                  fontWeight: "800",
                  fontSize: "12px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px"
                }}
                title="Stop and clear the live promo from all visitors' screens immediately"
              >
                <Square size={13} />
                <span>Stop Live Popup</span>
              </button>
            )}
          </div>
        </div>

        {/* Active Broadcast Alert Box */}
        {activeBroadcast && (
          <div style={{ backgroundColor: "#fdf2f8", border: "1.5px solid #fbcfe8", borderRadius: "10px", padding: "12px 16px", marginBottom: "18px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "20px" }}>⚡</span>
              <div>
                <div style={{ fontSize: "13px", fontWeight: "800", color: "#831843" }}>
                  Active Live Promo: "{activeBroadcast.title}"
                </div>
                <div style={{ fontSize: "11.5px", color: "#9d174d" }}>
                  Code: <strong>{activeBroadcast.code || "None"}</strong> | Discount: <strong>{activeBroadcast.discount || "N/A"}</strong>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: "8px" }}>
              <button
                type="button"
                onClick={handleTestPopup}
                style={{ backgroundColor: "#ffffff", color: "#db2777", border: "1px solid #f472b6", padding: "6px 12px", borderRadius: "6px", fontSize: "12px", fontWeight: "800", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
              >
                <Eye size={14} /> Preview on Screen
              </button>
              <button
                type="button"
                onClick={handleClearActivePromo}
                style={{ backgroundColor: "#e11d48", color: "#ffffff", border: "none", padding: "6px 12px", borderRadius: "6px", fontSize: "12px", fontWeight: "800", cursor: "pointer" }}
              >
                ✕ Clear Live Popup
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleBroadcast} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div>
              <label style={{ fontSize: "13px", fontWeight: "700", color: "#334155", display: "block", marginBottom: "4px" }}>
                Promo Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. 🌸 Weekend Special 20% OFF!"
                style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1.5px solid #cbd5e1", fontSize: "14px", fontWeight: "600" }}
              />
            </div>

            <div>
              <label style={{ fontSize: "13px", fontWeight: "700", color: "#334155", display: "block", marginBottom: "4px" }}>
                Coupon Code (Optional)
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. GLOW15"
                style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1.5px solid #cbd5e1", fontSize: "14px", fontWeight: "700", textTransform: "uppercase" }}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: "13px", fontWeight: "700", color: "#334155", display: "block", marginBottom: "4px" }}>
              Promotional Message Body *
            </label>
            <textarea
              required
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your promo announcement here..."
              style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1.5px solid #cbd5e1", fontSize: "14px", fontWeight: "500" }}
            />
          </div>

          {/* Image Upload & URL Section */}
          <div style={{ backgroundColor: "#f8fafc", padding: "16px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
            <label style={{ fontSize: "13px", fontWeight: "800", color: "#0f172a", display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
              <ImageIcon size={16} color="#e63b7a" />
              Promotional Banner Image (Upload from Computer or URL)
            </label>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", alignItems: "center" }}>
              <div>
                <span style={{ fontSize: "12px", color: "#64748b", display: "block", marginBottom: "4px", fontWeight: "600" }}>Option A: Upload Image File from PC</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileUpload}
                  style={{ fontSize: "12px", width: "100%" }}
                />
              </div>

              <div>
                <span style={{ fontSize: "12px", color: "#64748b", display: "block", marginBottom: "4px", fontWeight: "600" }}>Option B: Direct Image URL</span>
                <input
                  type="text"
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  placeholder="https://..."
                  style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                />
              </div>
            </div>

            {/* Image Preview Box */}
            {image && (
              <div style={{ marginTop: "12px", display: "flex", alignItems: "center", gap: "12px", backgroundColor: "#ffffff", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }}>
                <img src={image} alt="Promo Preview" style={{ width: "80px", height: "60px", objectFit: "cover", borderRadius: "6px" }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "12px", fontWeight: "800", color: "#15803d" }}>Image Attached</div>
                  <div style={{ fontSize: "11px", color: "#64748b", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap", maxWidth: "300px" }}>{image.substring(0, 60)}...</div>
                </div>
                <button
                  type="button"
                  onClick={() => setImage("")}
                  style={{ backgroundColor: "#fee2e2", color: "#991b1b", border: "none", padding: "4px 8px", borderRadius: "6px", fontSize: "12px", fontWeight: "700", cursor: "pointer" }}
                >
                  Remove Image
                </button>
              </div>
            )}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
            <div>
              <label style={{ fontSize: "13px", fontWeight: "700", color: "#334155", display: "block", marginBottom: "4px" }}>
                Discount Badge Tag
              </label>
              <input
                type="text"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                placeholder="e.g. BDT 150 OFF"
                style={{ width: "100%", padding: "9px", borderRadius: "8px", border: "1.5px solid #cbd5e1", fontSize: "13px" }}
              />
            </div>

            <div>
              <label style={{ fontSize: "13px", fontWeight: "700", color: "#334155", display: "block", marginBottom: "4px" }}>
                Target Page Link
              </label>
              <input
                type="text"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="/shop or product URL"
                style={{ width: "100%", padding: "9px", borderRadius: "8px", border: "1.5px solid #cbd5e1", fontSize: "13px" }}
              />
            </div>
          </div>

          {statusMsg && (
            <div
              style={{
                backgroundColor: statusMsg.startsWith("✅") || statusMsg.startsWith("🚀") || statusMsg.startsWith("✨") ? "#f0fdf4" : "#fef2f2",
                color: statusMsg.startsWith("✅") || statusMsg.startsWith("🚀") || statusMsg.startsWith("✨") ? "#166534" : "#991b1b",
                border: `1px solid ${statusMsg.startsWith("✅") || statusMsg.startsWith("🚀") || statusMsg.startsWith("✨") ? "#bbf7d0" : "#fecaca"}`,
                padding: "12px 16px",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: "700"
              }}
            >
              {statusMsg}
            </div>
          )}

          <div style={{ display: "flex", gap: "12px", marginTop: "4px" }}>
            <button
              type="submit"
              disabled={loading}
              style={{
                flex: 1,
                backgroundColor: "#e63b7a",
                color: "#ffffff",
                border: "none",
                padding: "14px 24px",
                borderRadius: "8px",
                fontWeight: "900",
                fontSize: "15px",
                cursor: loading ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                boxShadow: "0 4px 14px rgba(230, 59, 122, 0.4)"
              }}
            >
              <Send size={18} />
              <span>{loading ? "Broadcasting..." : "🚀 BROADCAST PROMO TO ALL LIVE VISITORS"}</span>
            </button>

            <button
              type="button"
              onClick={handleTestPopup}
              style={{
                backgroundColor: "#f8fafc",
                color: "#334155",
                border: "1.5px solid #cbd5e1",
                padding: "14px 20px",
                borderRadius: "8px",
                fontWeight: "800",
                fontSize: "14px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px"
              }}
            >
              <Eye size={17} />
              <span>Test Preview</span>
            </button>
          </div>
        </form>
      </div>

      {/* History List & Saved Promos (Admin History Manager) */}
      <div style={{ backgroundColor: "#ffffff", borderRadius: "14px", border: "1px solid #e2e8f0", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", borderBottom: "2px solid #f1f5f9", paddingBottom: "10px", flexWrap: "wrap", gap: "10px" }}>
          <div>
            <h3 style={{ fontSize: "16px", fontWeight: "900", color: "#0f172a", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
              <Clock size={18} color="#e63b7a" />
              📋 Saved Promos & Broadcast History ({promoHistory.length})
            </h3>
            <p style={{ fontSize: "12px", color: "#64748b", margin: "2px 0 0 0" }}>All created promo broadcasts are saved here below. Click "Resend Live" anytime to broadcast again!</p>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            {promoHistory.length > 0 && (
              <button
                onClick={handleClearAllHistory}
                style={{ backgroundColor: "#fee2e2", border: "1px solid #fca5a5", color: "#991b1b", padding: "6px 12px", borderRadius: "6px", fontSize: "12px", fontWeight: "700", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
              >
                <Trash2 size={13} /> Clear All History
              </button>
            )}
            <button
              onClick={fetchPromoHistory}
              style={{ backgroundColor: "#f1f5f9", border: "1px solid #cbd5e1", padding: "6px 12px", borderRadius: "6px", fontSize: "12px", fontWeight: "700", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
            >
              <RefreshCw size={14} /> Refresh List
            </button>
          </div>
        </div>

        {promoHistory.length === 0 ? (
          <div style={{ padding: "30px", textAlign: "center", color: "#94a3b8", fontSize: "13px" }}>
            No promo broadcasts in history. Fill out the form above to broadcast your first promo!
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {promoHistory.map((item) => (
              <div
                key={item.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "14px",
                  padding: "14px",
                  backgroundColor: activeBroadcast?.id === item.id ? "#fdf2f8" : "#f8fafc",
                  borderRadius: "10px",
                  border: activeBroadcast?.id === item.id ? "1.5px solid #f472b6" : "1px solid #e2e8f0"
                }}
              >
                {item.image ? (
                  <img src={item.image} alt="Promo" style={{ width: "70px", height: "55px", objectFit: "cover", borderRadius: "6px", border: "1px solid #cbd5e1" }} />
                ) : (
                  <div style={{ width: "70px", height: "55px", backgroundColor: "#fff0f5", color: "#e63b7a", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "800", fontSize: "12px" }}>
                    PROMO
                  </div>
                )}

                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "14px", fontWeight: "800", color: "#0f172a" }}>{item.title}</span>
                    {activeBroadcast?.id === item.id && (
                      <span style={{ fontSize: "10px", backgroundColor: "#e63b7a", color: "#ffffff", padding: "2px 7px", borderRadius: "10px", fontWeight: "900", letterSpacing: "0.5px" }}>
                        LIVE NOW
                      </span>
                    )}
                    {item.code && (
                      <span style={{ fontSize: "11px", backgroundColor: "#fff1f2", color: "#be185d", border: "1px solid #fecdd3", padding: "1px 7px", borderRadius: "6px", fontWeight: "800" }}>
                        CODE: {item.code}
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: "12.5px", color: "#475569", margin: "2px 0 0 0", overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical" }}>
                    {item.message}
                  </p>
                  <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "4px" }}>
                    {item.timestamp ? new Date(item.timestamp).toLocaleString() : "Saved Broadcast"}
                  </div>
                </div>

                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <button
                    onClick={() => handleResendPromo(item)}
                    disabled={loading}
                    style={{
                      backgroundColor: "#16a34a",
                      color: "#ffffff",
                      border: "none",
                      padding: "8px 14px",
                      borderRadius: "6px",
                      fontSize: "12px",
                      fontWeight: "800",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px"
                    }}
                  >
                    <Send size={14} />
                    <span>Resend Live</span>
                  </button>

                  <button
                    onClick={() => handleLoadInForm(item)}
                    style={{
                      backgroundColor: "#3b82f6",
                      color: "#ffffff",
                      border: "none",
                      padding: "8px 12px",
                      borderRadius: "6px",
                      fontSize: "12px",
                      fontWeight: "700",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px"
                    }}
                  >
                    <Edit3 size={14} />
                    <span>Edit</span>
                  </button>

                  <button
                    onClick={() => handleDeleteHistory(item.id)}
                    title="Permanently Delete Promo from Server & Database"
                    style={{
                      backgroundColor: "#fee2e2",
                      color: "#dc2626",
                      border: "1px solid #fca5a5",
                      padding: "8px",
                      borderRadius: "6px",
                      cursor: "pointer"
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
