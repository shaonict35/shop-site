"use client";

import React, { useState, useEffect } from "react";
import { API_BASE, safeImageUrl, triggerGlobalDataSync } from "../utils/api";
import { Bell, Send, CheckCircle2, Trash2, Power, Eye, Sparkles, Smartphone, Plus } from "lucide-react";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  imageUrl?: string | null;
  linkUrl?: string | null;
  isActive: boolean;
  createdAt: string;
}

export default function AdminPushNotifications({ token }: { token?: string }) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");

  const [form, setForm] = useState({
    title: "👉 ৯৯ টাকায় Face Wash+Moisturizer!! 😍",
    message: "মাত্র ৯৯ টাকায় কিনুন Glow & Hydrate Duo (Rajkonna Glow Booster Wash + Enso Skin Light Gel)!! অর্ডার করুন এখনই!!",
    linkUrl: "/shop?deal=combo",
    imageUrl: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&q=80",
    isActive: true,
  });

  const emojis = ["👉", "😍😍", "🔥", "🛍️", "৳", "🎁", "⚡", "🎉", "✨", "❤️"];

  const presets = [
    {
      label: "Shajgoj Style Combo Offer (৯৯ টাকা)",
      title: "👉 ৯৯ টাকায় Face Wash+Moisturizer!! 😍",
      message: "মাত্র ৯৯ টাকায় কিনুন Glow & Hydrate Duo (Rajkonna Glow Booster Wash + Enso Skin Light Gel)!! অর্ডার করুন এখনই!!",
      linkUrl: "/shop?deal=combo",
      imageUrl: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&q=80"
    },
    {
      label: "Free Delivery Flash Deal (ফ্রি ডেলিভারি)",
      title: "🚚 শুধুমাত্র আজকের জন্য সারা দেশে ফ্রি ডেলিভারি!! ⚡",
      message: "যেকোনো ১০০০ টাকার অর্ডারে উপভোগ করুন ১০০% ফ্রি হোম ডেলিভারি! কোড: FREEDEL",
      linkUrl: "/shop?deal=free-delivery",
      imageUrl: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&q=80"
    },
    {
      label: "BOGO Buy 1 Get 1 (১টি কিনলে ১টি ফ্রি)",
      title: "🎁 Buy 1 Get 1 Free — মেগা বিউটি অফার!! 🔥",
      message: "অরিজিনাল কোরিয়ান স্কিনকেয়ার ও মেকআপ প্রোডাক্টে চলছে ১ কিনলে ১ ফ্রি ধামাকা!",
      linkUrl: "/shop?category=bogo",
      imageUrl: "https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=600&q=80"
    },
    {
      label: "Clearance Sale (৫০% পর্যন্ত ছাড়)",
      title: "💥 ক্লিয়ারেন্স সেল — সর্বোচ্চ ৫০% ছাড়!! 😍",
      message: "স্টক সীমিত! আপনার পছন্দের ব্র্যান্ডেড লিপস্টিক, সিরাম ও সানস্ক্রিনে অবিশ্বাস্য ছাড়।",
      linkUrl: "/shop?category=clearance-sale",
      imageUrl: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600&q=80"
    }
  ];

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/notifications?t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setNotifications(data);
        }
      }
    } catch (e) {
      console.warn("Failed to load notifications", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.message.trim()) {
      alert("Please provide both Title and Message");
      return;
    }

    setSending(true);
    setStatusMsg("");

    try {
      const res = await fetch(`${API_BASE}/notifications/push`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });

      if (res.ok) {
        setStatusMsg("✅ Notification created and broadcasted successfully!");
        triggerGlobalDataSync();
        fetchNotifications();
      } else {
        const err = await res.json().catch(() => ({}));
        alert("Failed to send notification: " + (err.error || "Unknown error"));
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setSending(false);
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`${API_BASE}/notifications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentStatus })
      });

      if (res.ok) {
        triggerGlobalDataSync();
        fetchNotifications();
      }
    } catch (e) {
      alert("Failed to update status");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this notification?")) return;
    try {
      const res = await fetch(`${API_BASE}/notifications/${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        triggerGlobalDataSync();
        fetchNotifications();
      }
    } catch (e) {
      alert("Failed to delete notification");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header Banner */}
      <div style={{
        background: "linear-gradient(135deg, #1e1b4b 0%, #311042 100%)",
        borderRadius: "16px",
        padding: "24px",
        color: "#ffffff",
        boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "16px"
      }}>
        <div style={{ maxWidth: "600px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", backgroundColor: "#e2136e", padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "800", marginBottom: "10px" }}>
            <Sparkles size={14} /> Shajgoj-Style Rich Push & Promo Broadcaster
          </div>
          <h2 style={{ fontSize: "22px", fontWeight: "900", margin: "0 0 8px 0" }}>
            Push & Offer Notifications Center
          </h2>
          <p style={{ margin: 0, fontSize: "13.5px", color: "#cbd5e1", lineHeight: "1.5" }}>
            Broadcast real-time mobile push notifications and homepage popups to all visitors. Supports Bengali typography, high-res combo banners, and deep links.
          </p>
        </div>

        <button
          onClick={fetchNotifications}
          style={{
            backgroundColor: "rgba(255,255,255,0.15)",
            color: "#ffffff",
            border: "1px solid rgba(255,255,255,0.25)",
            padding: "10px 18px",
            borderRadius: "10px",
            fontWeight: "700",
            fontSize: "13px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}
        >
          🔄 Refresh Logs
        </button>
      </div>

      {/* Grid: Left = Form, Right = Mobile Phone Live Preview */}
      <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: "24px" }}>
        
        {/* Compose Form */}
        <div style={{ backgroundColor: "#ffffff", padding: "24px", borderRadius: "16px", border: "1px solid #e2e8f0", boxShadow: "0 2px 10px rgba(0,0,0,0.04)" }}>
          <h3 style={{ fontSize: "16px", fontWeight: "900", color: "#1e293b", margin: "0 0 16px 0", display: "flex", alignItems: "center", gap: "8px" }}>
            <Bell size={18} color="#e2136e" /> Compose New Push Notification
          </h3>

          {/* Quick Presets */}
          <div style={{ marginBottom: "16px" }}>
            <label style={{ fontSize: "12px", fontWeight: "700", color: "#64748b", display: "block", marginBottom: "6px" }}>
              Quick Templates (Click to fill):
            </label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {presets.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setForm({ ...form, title: p.title, message: p.message, linkUrl: p.linkUrl, imageUrl: p.imageUrl })}
                  style={{
                    backgroundColor: "#f8fafc",
                    border: "1px solid #cbd5e1",
                    borderRadius: "8px",
                    padding: "6px 10px",
                    fontSize: "12px",
                    fontWeight: "600",
                    color: "#334155",
                    cursor: "pointer"
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSend} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {/* Title with Emoji insert */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                <label style={{ fontSize: "13px", fontWeight: "800", color: "#334155" }}>
                  Notification Headline / Title *
                </label>
                <div style={{ display: "flex", gap: "4px" }}>
                  {emojis.map((em) => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => setForm({ ...form, title: form.title + " " + em })}
                      style={{ background: "none", border: "none", cursor: "pointer", fontSize: "14px" }}
                      title={`Add ${em}`}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>
              <input
                type="text"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. 👉 ৯৯ টাকায় Face Wash+Moisturizer!! 😍"
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  fontSize: "14px",
                  fontWeight: "600",
                  outline: "none"
                }}
              />
            </div>

            {/* Message */}
            <div>
              <label style={{ fontSize: "13px", fontWeight: "800", color: "#334155", display: "block", marginBottom: "4px" }}>
                Offer Message Details *
              </label>
              <textarea
                rows={3}
                required
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder="e.g. মাত্র ৯৯ টাকায় কিনুন Glow & Hydrate Duo (Rajkonna Glow Booster Wash + Enso Skin Light Gel)!! অর্ডার করুন এখনই!!"
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  fontSize: "13.5px",
                  outline: "none",
                  lineHeight: "1.4"
                }}
              />
            </div>

            {/* Banner Image URL */}
            <div>
              <label style={{ fontSize: "13px", fontWeight: "800", color: "#334155", display: "block", marginBottom: "4px" }}>
                Combo / Product Image URL (Optional)
              </label>
              <input
                type="text"
                value={form.imageUrl}
                onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                placeholder="https://images.unsplash.com/..."
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  fontSize: "13px",
                  outline: "none"
                }}
              />
            </div>

            {/* Target Link */}
            <div>
              <label style={{ fontSize: "13px", fontWeight: "800", color: "#334155", display: "block", marginBottom: "4px" }}>
                Destination Action Link *
              </label>
              <input
                type="text"
                required
                value={form.linkUrl}
                onChange={(e) => setForm({ ...form, linkUrl: e.target.value })}
                placeholder="/shop?deal=combo"
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  fontSize: "13px",
                  outline: "none"
                }}
              />
            </div>

            {/* Set as Active */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
              <input
                type="checkbox"
                id="isActiveCheck"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                style={{ width: "16px", height: "16px", accentColor: "#e2136e" }}
              />
              <label htmlFor="isActiveCheck" style={{ fontSize: "13px", fontWeight: "700", color: "#1e293b", cursor: "pointer" }}>
                Make Active immediately on Homepage Popup & Push Notification
              </label>
            </div>

            {statusMsg && (
              <div style={{ backgroundColor: "#f0fdf4", color: "#166534", padding: "10px 14px", borderRadius: "8px", fontSize: "13px", fontWeight: "700" }}>
                {statusMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={sending}
              style={{
                backgroundColor: "#e2136e",
                color: "#ffffff",
                border: "none",
                padding: "12px 20px",
                borderRadius: "10px",
                fontWeight: "800",
                fontSize: "15px",
                cursor: sending ? "wait" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                boxShadow: "0 4px 14px rgba(226,19,110,0.35)",
                marginTop: "6px"
              }}
            >
              <Send size={18} /> {sending ? "Broadcasting..." : "Broadcast Push Notification"}
            </button>
          </form>
        </div>

        {/* Live Android Notification Shade Preview */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ backgroundColor: "#1e293b", padding: "16px 20px", borderRadius: "16px 16px 0 0", color: "#ffffff", display: "flex", alignItems: "center", gap: "8px" }}>
            <Smartphone size={18} color="#38bdf8" />
            <h3 style={{ margin: 0, fontSize: "14px", fontWeight: "800" }}>Live Mobile Push Preview (Android System Shade)</h3>
          </div>

          <div style={{
            backgroundColor: "#0b0f19",
            padding: "24px 18px",
            borderRadius: "0 0 16px 16px",
            border: "1px solid #1e293b",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            boxShadow: "inset 0 2px 10px rgba(0,0,0,0.5)"
          }}>
            {/* Status bar mock */}
            <div style={{ width: "100%", display: "flex", justifyContent: "space-between", color: "#94a3b8", fontSize: "11px", fontWeight: "600", marginBottom: "16px", padding: "0 6px" }}>
              <span>3:38 Sun, Oct 4</span>
              <span>📶 75% 🔋</span>
            </div>

            {/* Android Notification Card (Matches Screenshot Exactly) */}
            <div style={{
              width: "100%",
              backgroundColor: "#ffffff",
              borderRadius: "18px",
              padding: "16px",
              boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
              display: "flex",
              flexDirection: "column",
              gap: "8px"
            }}>
              {/* Header */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #e2136e 0%, #ff5292 100%)",
                    color: "#ffffff",
                    fontWeight: "900",
                    fontSize: "13px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}>
                    G
                  </div>
                  <span style={{ fontSize: "13px", fontWeight: "800", color: "#1e293b" }}>GlowGoodly</span>
                  <span style={{ fontSize: "12px", color: "#94a3b8" }}>• 6 minutes ago ⌃</span>
                </div>
              </div>

              {/* Title */}
              <div style={{ fontSize: "14.5px", fontWeight: "900", color: "#0f172a", lineHeight: "1.3" }}>
                {form.title || "Notification Title"}
              </div>

              {/* Message */}
              <div style={{ fontSize: "13px", color: "#475569", fontWeight: "500", lineHeight: "1.4" }}>
                {form.message || "Notification message details will show here."}
              </div>

              {/* Image preview */}
              {form.imageUrl && (
                <div style={{ width: "100%", height: "120px", borderRadius: "10px", overflow: "hidden", marginTop: "4px", backgroundColor: "#f1f5f9" }}>
                  <img
                    src={safeImageUrl(form.imageUrl)}
                    alt="Push Preview"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    onError={(e) => { (e.currentTarget as HTMLImageElement).src = "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&q=80"; }}
                  />
                </div>
              )}

              {/* Action */}
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "6px" }}>
                <span style={{ backgroundColor: "#e2136e", color: "#ffffff", padding: "6px 14px", borderRadius: "20px", fontSize: "11px", fontWeight: "800" }}>
                  অর্ডার করুন এখনই 🛍️
                </span>
              </div>
            </div>

            <div style={{ marginTop: "16px", color: "#64748b", fontSize: "11.5px", textAlign: "center" }}>
              Displays identically on Android Chrome / Web Push & In-App Offer Card
            </div>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div style={{ backgroundColor: "#ffffff", padding: "24px", borderRadius: "16px", border: "1px solid #e2e8f0", boxShadow: "0 2px 10px rgba(0,0,0,0.04)" }}>
        <h3 style={{ fontSize: "16px", fontWeight: "900", color: "#1e293b", margin: "0 0 16px 0" }}>
          📜 Notifications Broadcast History & Status
        </h3>

        {loading ? (
          <div style={{ padding: "20px", textAlign: "center", color: "#64748b" }}>Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div style={{ padding: "20px", textAlign: "center", color: "#64748b" }}>No broadcasted notifications yet.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
              <thead>
                <tr style={{ backgroundColor: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                  <th style={{ padding: "12px 14px" }}>Status</th>
                  <th style={{ padding: "12px 14px" }}>Title & Offer</th>
                  <th style={{ padding: "12px 14px" }}>Destination Link</th>
                  <th style={{ padding: "12px 14px" }}>Created At</th>
                  <th style={{ padding: "12px 14px", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {notifications.map((n) => (
                  <tr key={n.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "12px 14px" }}>
                      <button
                        onClick={() => handleToggleActive(n.id, n.isActive)}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          padding: "4px 10px",
                          borderRadius: "20px",
                          fontSize: "11px",
                          fontWeight: "800",
                          border: "none",
                          cursor: "pointer",
                          backgroundColor: n.isActive ? "#dcfce7" : "#f1f5f9",
                          color: n.isActive ? "#166534" : "#64748b"
                        }}
                      >
                        <Power size={12} />
                        {n.isActive ? "ACTIVE" : "INACTIVE"}
                      </button>
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <div style={{ fontWeight: "800", color: "#0f172a" }}>{n.title}</div>
                      <div style={{ fontSize: "12px", color: "#64748b", maxWidth: "400px" }}>{n.message}</div>
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <a href={n.linkUrl || "#"} target="_blank" rel="noopener noreferrer" style={{ color: "#e2136e", fontWeight: "700", textDecoration: "none" }}>
                        {n.linkUrl || "/"}
                      </a>
                    </td>
                    <td style={{ padding: "12px 14px", color: "#64748b", fontSize: "12px" }}>
                      {new Date(n.createdAt).toLocaleString()}
                    </td>
                    <td style={{ padding: "12px 14px", textAlign: "right" }}>
                      <button
                        onClick={() => handleDelete(n.id)}
                        style={{
                          backgroundColor: "#fee2e2",
                          color: "#ef4444",
                          border: "none",
                          padding: "6px 10px",
                          borderRadius: "6px",
                          cursor: "pointer",
                          fontSize: "12px",
                          fontWeight: "700"
                        }}
                      >
                        <Trash2 size={14} /> Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
