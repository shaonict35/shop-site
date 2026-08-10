"use client";

import React, { useState, useEffect } from "react";
import { Send, Sparkles, Radio, Users, Tag, Image as ImageIcon, Upload, RefreshCw, Trash2, Edit3, CheckCircle, AlertCircle, Clock } from "lucide-react";

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
  const [activeClients, setActiveClients] = useState<number | null>(null);
  const [promoHistory, setPromoHistory] = useState<PromoItem[]>([]);

  // Fetch past promo history from backend & local storage
  const fetchPromoHistory = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/admin/broadcast-promo");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setPromoHistory(data);
          return;
        }
      }
    } catch (e) {
      console.log("Using local history fallback");
    }

    const saved = localStorage.getItem("gg_promo_history");
    if (saved) {
      setPromoHistory(JSON.parse(saved));
    }
  };

  useEffect(() => {
    fetchPromoHistory();
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

  const saveHistory = (newPromo: PromoItem) => {
    setPromoHistory((prev) => {
      const filtered = prev.filter((p) => p.id !== newPromo.id);
      const updated = [newPromo, ...filtered];
      localStorage.setItem("gg_promo_history", JSON.stringify(updated));
      return updated;
    });
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
      const res = await fetch("http://localhost:5000/api/admin/broadcast-promo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title,
          message,
          code,
          discount,
          link,
          image
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setActiveClients(data.activeClients);
        setStatusMsg(`✅ Broadcast Sent! Delivered live to ${data.activeClients} active website visitors via Socket.io.`);
        if (data.promo) {
          saveHistory(data.promo);
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

  // Re-broadcast a past saved promo with 1-click
  const handleResendPromo = async (item: PromoItem) => {
    setLoading(true);
    setStatusMsg(`Sending broadcast for "${item.title}"...`);

    try {
      const res = await fetch("http://localhost:5000/api/admin/broadcast-promo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(item)
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setActiveClients(data.activeClients);
        setStatusMsg(`🚀 Re-Sent Broadcast! "${item.title}" delivered to ${data.activeClients} live website visitors.`);
        if (data.promo) {
          saveHistory(data.promo);
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

  const handleDeleteHistory = (id: string) => {
    setPromoHistory((prev) => {
      const updated = prev.filter((p) => p.id !== id);
      localStorage.setItem("gg_promo_history", JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Broadcaster Main Form */}
      <div style={{ backgroundColor: "#ffffff", borderRadius: "14px", border: "1px solid #e2e8f0", padding: "24px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", borderBottom: "2px solid #f1f5f9", paddingBottom: "14px" }}>
          <div>
            <h2 style={{ fontSize: "20px", fontWeight: "900", color: "#e63b7a", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
              <Radio size={22} className="animate-pulse" />
              📢 Socket.io Real-Time Promo Broadcaster (Free WebSockets)
            </h2>
            <p style={{ fontSize: "13px", color: "#64748b", margin: "4px 0 0 0" }}>
              Send instant promotional offers, uploaded banner graphics, and discount codes to all online website visitors.
            </p>
          </div>

          <div style={{ backgroundColor: "#ecfdf5", border: "1px solid #a7f3d0", padding: "8px 14px", borderRadius: "20px", display: "flex", alignItems: "center", gap: "6px" }}>
            <Users size={16} color="#059669" />
            <span style={{ fontSize: "12.5px", fontWeight: "800", color: "#047857" }}>
              {activeClients !== null ? `${activeClients} Connected Live` : "Socket.io Active"}
            </span>
          </div>
        </div>

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
                backgroundColor: statusMsg.startsWith("✅") || statusMsg.startsWith("🚀") ? "#f0fdf4" : "#fef2f2",
                color: statusMsg.startsWith("✅") || statusMsg.startsWith("🚀") ? "#166534" : "#991b1b",
                border: `1px solid ${statusMsg.startsWith("✅") || statusMsg.startsWith("🚀") ? "#bbf7d0" : "#fecaca"}`,
                padding: "12px 16px",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: "700"
              }}
            >
              {statusMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
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
              boxShadow: "0 4px 14px rgba(230, 59, 122, 0.4)",
              marginTop: "4px"
            }}
          >
            <Send size={18} />
            <span>{loading ? "Broadcasting..." : "🚀 BROADCAST PROMO TO ALL LIVE VISITORS"}</span>
          </button>
        </form>
      </div>

      {/* History List & Saved Promos (Admin History Manager) */}
      <div style={{ backgroundColor: "#ffffff", borderRadius: "14px", border: "1px solid #e2e8f0", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", borderBottom: "2px solid #f1f5f9", paddingBottom: "10px" }}>
          <div>
            <h3 style={{ fontSize: "16px", fontWeight: "900", color: "#0f172a", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
              <Clock size={18} color="#e63b7a" />
              📋 Saved Promos & Broadcast History ({promoHistory.length})
            </h3>
            <p style={{ fontSize: "12px", color: "#64748b", margin: "2px 0 0 0" }}>All created promo broadcasts are saved here below. Click "Resend Live" anytime to broadcast again!</p>
          </div>
          <button
            onClick={fetchPromoHistory}
            style={{ backgroundColor: "#f1f5f9", border: "1px solid #cbd5e1", padding: "6px 12px", borderRadius: "6px", fontSize: "12px", fontWeight: "700", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
          >
            <RefreshCw size={14} /> Refresh List
          </button>
        </div>

        {promoHistory.length === 0 ? (
          <div style={{ padding: "30px", textAlign: "center", color: "#94a3b8", fontSize: "13px" }}>
            No promo broadcasts created yet. Fill out the form above to broadcast your first promo!
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
                  backgroundColor: "#f8fafc",
                  borderRadius: "10px",
                  border: "1px solid #e2e8f0"
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
                    <span>Edit Form</span>
                  </button>

                  <button
                    onClick={() => handleDeleteHistory(item.id)}
                    style={{
                      backgroundColor: "#fee2e2",
                      color: "#dc2626",
                      border: "none",
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
