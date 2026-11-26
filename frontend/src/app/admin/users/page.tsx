"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useApp } from "../../../context/AppContext";
import {
  Users,
  UserCheck,
  ShieldAlert,
  Shield,
  Search,
  Plus,
  Edit,
  Trash2,
  ChevronLeft,
  RefreshCw,
  Eye,
  EyeOff,
  UserPlus,
  ArrowRight,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Camera,
  Image as ImageIcon
} from "lucide-react";
import { API_BASE } from "../../../utils/api";

const getAuthHeader = (explicitToken?: string | null): Record<string, string> => {
  let activeToken = explicitToken;
  if (!activeToken && typeof window !== "undefined") {
    activeToken =
      localStorage.getItem("glowgoodly_token") ||
      localStorage.getItem("gg_token") ||
      localStorage.getItem("glowgoodly_auth_token") ||
      localStorage.getItem("token") ||
      "";
  }
  if (activeToken === "null" || activeToken === "undefined") {
    activeToken = "";
  }
  const cleanToken = activeToken ? String(activeToken).replace(/^Bearer\s+/i, "").trim() : "";
  return cleanToken ? { Authorization: `Bearer ${cleanToken}` } : {};
};

interface UserItem {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  status: string;
  avatarUrl?: string;
  points?: number;
  createdAt?: string;
}

export default function UserManagementPage() {
  const { user: currentUser, token, logout } = useApp();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [modalAccountType, setModalAccountType] = useState<"admin" | "customer">("customer");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  const initialForm = {
    id: "",
    name: "",
    email: "",
    phone: "",
    role: "Customer",
    status: "Active",
    password: "",
    avatarUrl: "",
    points: 0
  };

  const [formData, setFormData] = useState(initialForm);

  // Avatar presets for quick one-click avatar selection
  const avatarPresets = [
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80"
  ];

  // Fetch all users
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const headers: any = { ...getAuthHeader(token) };
      const res = await fetch(`${API_BASE}/admin/users`, { headers });
      if (res.ok) {
        const data = await res.json();
        setUsers(Array.isArray(data) ? data : []);
      } else {
        console.error("Failed to fetch users");
      }
    } catch (err) {
      console.error("Error fetching users:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [token]);

  // Statistics
  const stats = useMemo(() => {
    const total = users.length;
    const admins = users.filter(u =>
      ["superadmin", "admin", "manager", "salesman"].includes((u.role || "").toLowerCase())
    ).length;
    const customers = users.filter(u => (u.role || "").toLowerCase() === "customer").length;
    const flagged = users.filter(u =>
      ["fraud", "suspicious", "blocked"].includes((u.status || "").toLowerCase())
    ).length;
    return { total, admins, customers, flagged };
  }, [users]);

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        (u.name || "").toLowerCase().includes(q) ||
        (u.email || "").toLowerCase().includes(q) ||
        (u.phone || "").toLowerCase().includes(q);

      const matchRole =
        selectedRole === "ALL" || (u.role || "").toLowerCase() === selectedRole.toLowerCase();

      const matchStatus =
        selectedStatus === "ALL" || (u.status || "active").toLowerCase() === selectedStatus.toLowerCase();

      return matchSearch && matchRole && matchStatus;
    });
  }, [users, searchQuery, selectedRole, selectedStatus]);

  // Open Create Modal
  const openCreateModal = (type: "admin" | "customer") => {
    setModalMode("create");
    setModalAccountType(type);
    setFormError("");
    setFormSuccess("");
    setShowPassword(false);
    setFormData({
      ...initialForm,
      role: type === "admin" ? "Admin" : "Customer",
      avatarUrl: `https://ui-avatars.com/api/?name=${type === "admin" ? "Admin" : "User"}&background=${type === "admin" ? "7c3aed" : "e63b7a"}&color=fff&bold=true`
    });
    setShowModal(true);
  };

  // Open Edit Modal
  const openEditModal = (u: UserItem) => {
    setModalMode("edit");
    const isAdminType = ["superadmin", "admin", "manager", "salesman"].includes((u.role || "").toLowerCase());
    setModalAccountType(isAdminType ? "admin" : "customer");
    setFormError("");
    setFormSuccess("");
    setShowPassword(false);
    setFormData({
      id: u.id,
      name: u.name || "",
      email: u.email || "",
      phone: u.phone || "",
      role: u.role || "Customer",
      status: u.status || "Active",
      password: "",
      avatarUrl: u.avatarUrl || "",
      points: u.points || 0
    });
    setShowModal(true);
  };

  // Submit Modal
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");

    if (!formData.name.trim()) {
      setFormError("Full Name is required.");
      return;
    }
    if (!formData.email.trim()) {
      setFormError("Email Address is required.");
      return;
    }
    if (modalMode === "create" && !formData.password.trim()) {
      setFormError("Password is required for new accounts.");
      return;
    }

    setSubmitting(true);
    try {
      const isEdit = modalMode === "edit" && formData.id;
      const url = isEdit ? `${API_BASE}/admin/users/${formData.id}` : `${API_BASE}/admin/users`;
      const method = isEdit ? "PUT" : "POST";

      const payload: any = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || null,
        role: formData.role,
        status: formData.status,
        avatarUrl: formData.avatarUrl.trim() || undefined,
        points: Number(formData.points || 0)
      };

      if (formData.password.trim()) {
        payload.password = formData.password.trim();
      }

      const headers: any = { "Content-Type": "application/json", ...getAuthHeader(token) };

      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(payload)
      });

      const resData = await res.json().catch(() => ({}));

      if (res.ok) {
        setFormSuccess(isEdit ? "User account updated successfully!" : "User account created successfully!");
        setTimeout(() => {
          setShowModal(false);
          fetchUsers();
        }, 800);
      } else {
        setFormError(resData.error || "Failed to save user account.");
      }
    } catch (err: any) {
      setFormError(err.message || "Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete User
  const handleDelete = async (u: UserItem) => {
    if (!confirm(`Are you sure you want to permanently delete user "${u.name || u.email}"?`)) return;

    try {
      const headers: any = { ...getAuthHeader(token) };
      const res = await fetch(`${API_BASE}/admin/users/${u.id}`, {
        method: "DELETE",
        headers
      });

      if (res.ok) {
        alert("User deleted successfully.");
        fetchUsers();
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Failed to delete user.");
      }
    } catch (err) {
      alert("Error deleting user.");
    }
  };

  // Helper for role color
  const getRoleBadgeStyle = (role: string) => {
    const r = (role || "").toLowerCase();
    if (r === "superadmin") return { bg: "#f3e8ff", color: "#7c3aed", border: "#d8b4fe" };
    if (r === "admin") return { bg: "#e0e7ff", color: "#4338ca", border: "#a5b4fc" };
    if (r === "manager") return { bg: "#dbeafe", color: "#1d4ed8", border: "#93c5fd" };
    if (r === "salesman" || r === "staff") return { bg: "#fef3c7", color: "#b45309", border: "#fde68a" };
    if (r === "rider") return { bg: "#ccfbf1", color: "#0f766e", border: "#99f6e4" };
    return { bg: "#ecfdf5", color: "#047857", border: "#a7f3d0" };
  };

  // Helper for status badge
  const getStatusBadgeStyle = (status: string) => {
    const s = (status || "").toLowerCase();
    if (s === "fraud" || s === "blocked") return { bg: "#fee2e2", color: "#dc2626", border: "#fca5a5" };
    if (s === "suspicious") return { bg: "#fef3c7", color: "#d97706", border: "#fcd34d" };
    return { bg: "#dcfce7", color: "#15803d", border: "#86efac" };
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8fafc", color: "#1e293b", fontFamily: "'Inter', sans-serif" }}>
      {/* Top Banner Navigation */}
      <header
        style={{
          backgroundColor: "#1e293b",
          color: "#ffffff",
          padding: "16px 28px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          boxShadow: "0 2px 8px rgba(0,0,0,0.15)"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <Link
            href="/admin"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              color: "#94a3b8",
              textDecoration: "none",
              fontSize: "13px",
              fontWeight: "700",
              padding: "6px 12px",
              backgroundColor: "rgba(255,255,255,0.08)",
              borderRadius: "6px"
            }}
          >
            <ChevronLeft size={16} /> Back to Dashboard
          </Link>
          <div style={{ height: "20px", width: "1px", backgroundColor: "#334155" }} />
          <div>
            <h1 style={{ margin: 0, fontSize: "20px", fontWeight: "900", letterSpacing: "0.5px" }}>
              USER MANAGEMENT
            </h1>
            <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "#94a3b8" }}>
              GlowGoodly Admin Panel &bull; Admins, Staff &amp; Customer Directory
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          {/* Action Buttons */}
          <button
            onClick={() => openCreateModal("admin")}
            style={{
              backgroundColor: "#7c3aed",
              color: "#fff",
              border: "none",
              padding: "9px 16px",
              borderRadius: "8px",
              fontWeight: "800",
              fontSize: "13px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              boxShadow: "0 4px 12px rgba(124, 58, 237, 0.3)"
            }}
          >
            <Shield size={16} /> + Add Admin
          </button>

          <button
            onClick={() => openCreateModal("customer")}
            style={{
              backgroundColor: "#e63b7a",
              color: "#fff",
              border: "none",
              padding: "9px 16px",
              borderRadius: "8px",
              fontWeight: "800",
              fontSize: "13px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              boxShadow: "0 4px 12px rgba(230, 59, 122, 0.3)"
            }}
          >
            <UserPlus size={16} /> + Add User
          </button>

          <button
            onClick={fetchUsers}
            title="Refresh Users"
            style={{
              backgroundColor: "rgba(255,255,255,0.1)",
              color: "#fff",
              border: "none",
              padding: "9px",
              borderRadius: "8px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center"
            }}
          >
            <RefreshCw size={16} className={loading ? "spin" : ""} />
          </button>
        </div>
      </header>

      {/* Main Content Container */}
      <main style={{ maxWidth: "1400px", margin: "0 auto", padding: "28px 24px" }}>
        {/* Metric Summary Cards */}
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "20px",
            marginBottom: "28px"
          }}
        >
          {/* Card 1: Total Users */}
          <div
            style={{
              backgroundColor: "#ffffff",
              padding: "20px 24px",
              borderRadius: "14px",
              border: "1px solid #e2e8f0",
              boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
              display: "flex",
              alignItems: "center",
              gap: "18px"
            }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                backgroundColor: "#eff6ff",
                color: "#2563eb",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <Users size={24} />
            </div>
            <div>
              <div style={{ fontSize: "12px", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>
                Total Accounts
              </div>
              <div style={{ fontSize: "28px", fontWeight: "900", color: "#0f172a" }}>{stats.total}</div>
            </div>
          </div>

          {/* Card 2: Admins & Staff */}
          <div
            style={{
              backgroundColor: "#ffffff",
              padding: "20px 24px",
              borderRadius: "14px",
              border: "1px solid #e2e8f0",
              boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
              display: "flex",
              alignItems: "center",
              gap: "18px"
            }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                backgroundColor: "#f5f3ff",
                color: "#7c3aed",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <Shield size={24} />
            </div>
            <div>
              <div style={{ fontSize: "12px", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>
                Admins &amp; Staff
              </div>
              <div style={{ fontSize: "28px", fontWeight: "900", color: "#7c3aed" }}>{stats.admins}</div>
            </div>
          </div>

          {/* Card 3: Customers */}
          <div
            style={{
              backgroundColor: "#ffffff",
              padding: "20px 24px",
              borderRadius: "14px",
              border: "1px solid #e2e8f0",
              boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
              display: "flex",
              alignItems: "center",
              gap: "18px"
            }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                backgroundColor: "#fdf2f8",
                color: "#e63b7a",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <UserCheck size={24} />
            </div>
            <div>
              <div style={{ fontSize: "12px", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>
                Customers
              </div>
              <div style={{ fontSize: "28px", fontWeight: "900", color: "#e63b7a" }}>{stats.customers}</div>
            </div>
          </div>

          {/* Card 4: Blocked / Flagged */}
          <div
            style={{
              backgroundColor: "#ffffff",
              padding: "20px 24px",
              borderRadius: "14px",
              border: "1px solid #e2e8f0",
              boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
              display: "flex",
              alignItems: "center",
              gap: "18px"
            }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                backgroundColor: "#fee2e2",
                color: "#dc2626",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <ShieldAlert size={24} />
            </div>
            <div>
              <div style={{ fontSize: "12px", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>
                Flagged / Blocked
              </div>
              <div style={{ fontSize: "28px", fontWeight: "900", color: "#dc2626" }}>{stats.flagged}</div>
            </div>
          </div>
        </section>

        {/* Filter and Search Bar */}
        <section
          style={{
            backgroundColor: "#ffffff",
            padding: "18px 24px",
            borderRadius: "14px",
            border: "1px solid #e2e8f0",
            marginBottom: "24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "16px"
          }}
        >
          {/* Search Input */}
          <div style={{ position: "relative", flex: 1, minWidth: "260px" }}>
            <Search
              size={18}
              color="#94a3b8"
              style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)" }}
            />
            <input
              type="text"
              placeholder="Search by name, email address, or phone number..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "11px 14px 11px 40px",
                borderRadius: "8px",
                border: "1.5px solid #e2e8f0",
                fontSize: "14px",
                outline: "none",
                color: "#1e293b",
                backgroundColor: "#f8fafc"
              }}
            />
          </div>

          {/* Quick Filters */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            {/* Role Filter */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "13px", fontWeight: "700", color: "#64748b" }}>Role:</span>
              <select
                value={selectedRole}
                onChange={e => setSelectedRole(e.target.value)}
                style={{
                  padding: "9px 14px",
                  borderRadius: "8px",
                  border: "1.5px solid #cbd5e1",
                  fontSize: "13px",
                  fontWeight: "700",
                  backgroundColor: "#ffffff",
                  color: "#334155",
                  outline: "none"
                }}
              >
                <option value="ALL">All Roles</option>
                <option value="SuperAdmin">SuperAdmin</option>
                <option value="Admin">Admin</option>
                <option value="Manager">Manager</option>
                <option value="Salesman">Salesman / Staff</option>
                <option value="Customer">Customer</option>
                <option value="Rider">Delivery Rider</option>
              </select>
            </div>

            {/* Status Filter */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "13px", fontWeight: "700", color: "#64748b" }}>Status:</span>
              <select
                value={selectedStatus}
                onChange={e => setSelectedStatus(e.target.value)}
                style={{
                  padding: "9px 14px",
                  borderRadius: "8px",
                  border: "1.5px solid #cbd5e1",
                  fontSize: "13px",
                  fontWeight: "700",
                  backgroundColor: "#ffffff",
                  color: "#334155",
                  outline: "none"
                }}
              >
                <option value="ALL">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Suspicious">Suspicious</option>
                <option value="Fraud">Fraud</option>
                <option value="Blocked">Blocked</option>
              </select>
            </div>

            {(searchQuery || selectedRole !== "ALL" || selectedStatus !== "ALL") && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedRole("ALL");
                  setSelectedStatus("ALL");
                }}
                style={{
                  backgroundColor: "transparent",
                  border: "none",
                  color: "#e63b7a",
                  fontSize: "13px",
                  fontWeight: "700",
                  cursor: "pointer",
                  textDecoration: "underline"
                }}
              >
                Reset Filters
              </button>
            )}
          </div>
        </section>

        {/* Users Table Card */}
        <section
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "14px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
            overflow: "hidden"
          }}
        >
          <div
            style={{
              padding: "16px 24px",
              borderBottom: "1px solid #e2e8f0",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}
          >
            <div>
              <span style={{ fontSize: "15px", fontWeight: "800", color: "#0f172a" }}>
                Registered Accounts Directory
              </span>
              <span
                style={{
                  marginLeft: "10px",
                  padding: "2px 8px",
                  borderRadius: "12px",
                  backgroundColor: "#f1f5f9",
                  fontSize: "12px",
                  fontWeight: "800",
                  color: "#64748b"
                }}
              >
                {filteredUsers.length} shown
              </span>
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={() => openCreateModal("admin")}
                style={{
                  fontSize: "12px",
                  fontWeight: "700",
                  color: "#7c3aed",
                  backgroundColor: "#f5f3ff",
                  border: "1px solid #d8b4fe",
                  padding: "6px 12px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px"
                }}
              >
                <Plus size={14} /> Add Admin
              </button>
              <button
                onClick={() => openCreateModal("customer")}
                style={{
                  fontSize: "12px",
                  fontWeight: "700",
                  color: "#e63b7a",
                  backgroundColor: "#fdf2f8",
                  border: "1px solid #fbcfe8",
                  padding: "6px 12px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px"
                }}
              >
                <Plus size={14} /> Add User
              </button>
            </div>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ backgroundColor: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                  <th style={{ padding: "14px 20px", fontSize: "12px", fontWeight: "800", color: "#475569" }}>
                    USER PROFILE / AVATAR
                  </th>
                  <th style={{ padding: "14px 20px", fontSize: "12px", fontWeight: "800", color: "#475569" }}>
                    EMAIL ADDRESS
                  </th>
                  <th style={{ padding: "14px 20px", fontSize: "12px", fontWeight: "800", color: "#475569" }}>
                    PHONE
                  </th>
                  <th style={{ padding: "14px 20px", fontSize: "12px", fontWeight: "800", color: "#475569" }}>
                    ROLE
                  </th>
                  <th style={{ padding: "14px 20px", fontSize: "12px", fontWeight: "800", color: "#475569" }}>
                    STATUS
                  </th>
                  <th style={{ padding: "14px 20px", fontSize: "12px", fontWeight: "800", color: "#475569" }}>
                    POINTS
                  </th>
                  <th style={{ padding: "14px 20px", fontSize: "12px", fontWeight: "800", color: "#475569" }}>
                    JOINED
                  </th>
                  <th
                    style={{
                      padding: "14px 20px",
                      fontSize: "12px",
                      fontWeight: "800",
                      color: "#475569",
                      textAlign: "center"
                    }}
                  >
                    ACTIONS
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
                      <RefreshCw size={24} className="spin" style={{ margin: "0 auto 10px" }} />
                      <div>Loading users directory...</div>
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ padding: "48px 20px", textAlign: "center", color: "#94a3b8" }}>
                      <Users size={36} color="#cbd5e1" style={{ margin: "0 auto 10px" }} />
                      <div style={{ fontSize: "15px", fontWeight: "700", color: "#475569" }}>No users found</div>
                      <div style={{ fontSize: "13px", marginTop: "4px" }}>
                        Try changing your search terms or filters.
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map(u => {
                    const roleBadge = getRoleBadgeStyle(u.role);
                    const statusBadge = getStatusBadgeStyle(u.status);
                    const initials = (u.name || "U")
                      .split(" ")
                      .map(w => w[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase();

                    return (
                      <tr
                        key={u.id}
                        style={{
                          borderBottom: "1px solid #f1f5f9",
                          transition: "background-color 0.15s ease"
                        }}
                        onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#fafafa")}
                        onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
                      >
                        {/* Round User Avatar + Name */}
                        <td style={{ padding: "14px 20px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            {u.avatarUrl ? (
                              <img
                                src={u.avatarUrl}
                                alt={u.name}
                                style={{
                                  width: "42px",
                                  height: "42px",
                                  borderRadius: "50%",
                                  objectFit: "cover",
                                  border: "2px solid #e2e8f0",
                                  boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
                                  flexShrink: 0
                                }}
                                onError={e => {
                                  (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                    u.name || "User"
                                  )}&background=e63b7a&color=fff&bold=true`;
                                }}
                              />
                            ) : (
                              <div
                                style={{
                                  width: "42px",
                                  height: "42px",
                                  borderRadius: "50%",
                                  background:
                                    u.role === "SuperAdmin"
                                      ? "linear-gradient(135deg, #7c3aed, #a855f7)"
                                      : u.role === "Admin"
                                        ? "linear-gradient(135deg, #4338ca, #6366f1)"
                                        : "linear-gradient(135deg, #e63b7a, #f43f5e)",
                                  color: "#ffffff",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontWeight: "800",
                                  fontSize: "14px",
                                  boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
                                  flexShrink: 0
                                }}
                              >
                                {initials}
                              </div>
                            )}
                            <div>
                              <div style={{ fontWeight: "800", color: "#0f172a", fontSize: "14px" }}>
                                {u.name || "Unnamed User"}
                              </div>
                              <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "1px" }}>
                                ID: {u.id?.slice(0, 10)}...
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Email */}
                        <td style={{ padding: "14px 20px", fontSize: "13px", fontWeight: "600", color: "#334155" }}>
                          {u.email}
                        </td>

                        {/* Phone */}
                        <td style={{ padding: "14px 20px", fontSize: "13px", color: "#64748b" }}>
                          {u.phone || "—"}
                        </td>

                        {/* Role Badge */}
                        <td style={{ padding: "14px 20px" }}>
                          <span
                            style={{
                              padding: "4px 10px",
                              borderRadius: "12px",
                              fontSize: "11px",
                              fontWeight: "800",
                              backgroundColor: roleBadge.bg,
                              color: roleBadge.color,
                              border: `1px solid ${roleBadge.border}`,
                              display: "inline-block"
                            }}
                          >
                            {u.role || "Customer"}
                          </span>
                        </td>

                        {/* Status Badge */}
                        <td style={{ padding: "14px 20px" }}>
                          <span
                            style={{
                              padding: "4px 10px",
                              borderRadius: "12px",
                              fontSize: "11px",
                              fontWeight: "800",
                              backgroundColor: statusBadge.bg,
                              color: statusBadge.color,
                              border: `1px solid ${statusBadge.border}`,
                              display: "inline-block"
                            }}
                          >
                            {u.status || "Active"}
                          </span>
                        </td>

                        {/* Loyalty Points */}
                        <td style={{ padding: "14px 20px", fontSize: "13px", fontWeight: "700", color: "#e63b7a" }}>
                          {u.points || 0} pts
                        </td>

                        {/* Joined Date */}
                        <td style={{ padding: "14px 20px", fontSize: "12px", color: "#64748b" }}>
                          {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—"}
                        </td>

                        {/* Actions */}
                        <td style={{ padding: "14px 20px", textAlign: "center" }}>
                          <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
                            <button
                              onClick={() => openEditModal(u)}
                              title="Edit User"
                              style={{
                                backgroundColor: "#f1f5f9",
                                border: "1px solid #cbd5e1",
                                padding: "6px 10px",
                                borderRadius: "6px",
                                fontSize: "12px",
                                fontWeight: "700",
                                cursor: "pointer",
                                color: "#1e293b",
                                display: "flex",
                                alignItems: "center",
                                gap: "4px"
                              }}
                            >
                              <Edit size={13} /> Edit
                            </button>
                            <button
                              onClick={() => handleDelete(u)}
                              title="Delete User"
                              style={{
                                backgroundColor: "#fee2e2",
                                border: "none",
                                padding: "6px 10px",
                                borderRadius: "6px",
                                fontSize: "12px",
                                fontWeight: "700",
                                cursor: "pointer",
                                color: "#dc2626",
                                display: "flex",
                                alignItems: "center",
                                gap: "4px"
                              }}
                            >
                              <Trash2 size={13} /> Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {/* ADD / EDIT USER MODAL */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(15, 23, 42, 0.65)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "20px"
          }}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "16px",
              padding: "28px",
              width: "100%",
              maxWidth: "540px",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              maxHeight: "90vh",
              overflowY: "auto"
            }}
          >
            {/* Modal Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
              <div>
                <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "900", color: "#0f172a" }}>
                  {modalMode === "edit"
                    ? `Edit User: ${formData.name || formData.email}`
                    : modalAccountType === "admin"
                      ? "Add New Administrator / Staff"
                      : "Add New Customer / User"}
                </h2>
                <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "#64748b" }}>
                  {modalMode === "edit"
                    ? "Update account credentials, system role, and profile image."
                    : "Create a verified account with complete access controls."}
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "20px",
                  cursor: "pointer",
                  color: "#94a3b8"
                }}
              >
                &times;
              </button>
            </div>

            {/* Account Type Selector (for Create mode) */}
            {modalMode === "create" && (
              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  padding: "4px",
                  backgroundColor: "#f1f5f9",
                  borderRadius: "10px",
                  marginBottom: "20px"
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setModalAccountType("customer");
                    setFormData(prev => ({
                      ...prev,
                      role: "Customer",
                      avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        prev.name || "Customer"
                      )}&background=e63b7a&color=fff&bold=true`
                    }));
                  }}
                  style={{
                    flex: 1,
                    padding: "9px 12px",
                    borderRadius: "8px",
                    border: "none",
                    fontWeight: "800",
                    fontSize: "13px",
                    cursor: "pointer",
                    backgroundColor: modalAccountType === "customer" ? "#ffffff" : "transparent",
                    color: modalAccountType === "customer" ? "#e63b7a" : "#64748b",
                    boxShadow: modalAccountType === "customer" ? "0 2px 6px rgba(0,0,0,0.06)" : "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px"
                  }}
                >
                  <UserPlus size={15} /> Regular User / Customer
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setModalAccountType("admin");
                    setFormData(prev => ({
                      ...prev,
                      role: "Admin",
                      avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        prev.name || "Admin"
                      )}&background=7c3aed&color=fff&bold=true`
                    }));
                  }}
                  style={{
                    flex: 1,
                    padding: "9px 12px",
                    borderRadius: "8px",
                    border: "none",
                    fontWeight: "800",
                    fontSize: "13px",
                    cursor: "pointer",
                    backgroundColor: modalAccountType === "admin" ? "#ffffff" : "transparent",
                    color: modalAccountType === "admin" ? "#7c3aed" : "#64748b",
                    boxShadow: modalAccountType === "admin" ? "0 2px 6px rgba(0,0,0,0.06)" : "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px"
                  }}
                >
                  <Shield size={15} /> Administrator / Staff
                </button>
              </div>
            )}

            {/* Error & Success Messages */}
            {formError && (
              <div
                style={{
                  backgroundColor: "#fef2f2",
                  border: "1px solid #fecaca",
                  color: "#dc2626",
                  padding: "10px 14px",
                  borderRadius: "8px",
                  fontSize: "13px",
                  fontWeight: "600",
                  marginBottom: "16px"
                }}
              >
                {formError}
              </div>
            )}
            {formSuccess && (
              <div
                style={{
                  backgroundColor: "#f0fdf4",
                  border: "1px solid #bbf7d0",
                  color: "#16a34a",
                  padding: "10px 14px",
                  borderRadius: "8px",
                  fontSize: "13px",
                  fontWeight: "600",
                  marginBottom: "16px"
                }}
              >
                {formSuccess}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Round Avatar Preview & Image URL */}
              <div
                style={{
                  backgroundColor: "#f8fafc",
                  padding: "14px 16px",
                  borderRadius: "12px",
                  border: "1px solid #e2e8f0",
                  display: "flex",
                  alignItems: "center",
                  gap: "16px"
                }}
              >
                <div style={{ position: "relative" }}>
                  <img
                    src={
                      formData.avatarUrl ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        formData.name || "User"
                      )}&background=7c3aed&color=fff&bold=true`
                    }
                    alt="Preview"
                    style={{
                      width: "60px",
                      height: "60px",
                      borderRadius: "50%",
                      objectFit: "cover",
                      border: "3px solid #7c3aed",
                      boxShadow: "0 4px 10px rgba(0,0,0,0.1)"
                    }}
                    onError={e => {
                      (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        formData.name || "User"
                      )}&background=e63b7a&color=fff&bold=true`;
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      bottom: "-2px",
                      right: "-2px",
                      backgroundColor: "#7c3aed",
                      color: "#fff",
                      borderRadius: "50%",
                      width: "20px",
                      height: "20px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "10px"
                    }}
                  >
                    <Camera size={11} />
                  </div>
                </div>

                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: "12px", fontWeight: "700", color: "#334155", display: "block", marginBottom: "4px" }}>
                    User Profile Image URL (Round Circular Preview)
                  </label>
                  <input
                    type="url"
                    placeholder="https://example.com/avatar.jpg"
                    value={formData.avatarUrl}
                    onChange={e => setFormData({ ...formData, avatarUrl: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: "6px",
                      border: "1.5px solid #cbd5e1",
                      fontSize: "12px"
                    }}
                  />
                  <div style={{ display: "flex", gap: "6px", marginTop: "6px" }}>
                    <span style={{ fontSize: "11px", color: "#64748b" }}>Quick sample:</span>
                    {avatarPresets.slice(0, 3).map((url, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setFormData({ ...formData, avatarUrl: url })}
                        style={{
                          fontSize: "10px",
                          padding: "2px 6px",
                          borderRadius: "4px",
                          border: "1px solid #cbd5e1",
                          background: "#fff",
                          cursor: "pointer"
                        }}
                      >
                        Avatar {i + 1}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Full Name */}
              <div>
                <label style={{ fontSize: "12px", fontWeight: "700", color: "#334155", display: "block", marginBottom: "4px" }}>
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Shaon Khan"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    border: "1.5px solid #cbd5e1",
                    fontSize: "13px"
                  }}
                />
              </div>

              {/* Email & Phone */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "700", color: "#334155", display: "block", marginBottom: "4px" }}>
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="user@glowgoodly.com"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: "8px",
                      border: "1.5px solid #cbd5e1",
                      fontSize: "13px"
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "700", color: "#334155", display: "block", marginBottom: "4px" }}>
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="017XXXXXXXX"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: "8px",
                      border: "1.5px solid #cbd5e1",
                      fontSize: "13px"
                    }}
                  />
                </div>
              </div>

              {/* Role & Status */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "700", color: "#334155", display: "block", marginBottom: "4px" }}>
                    System Role *
                  </label>
                  <select
                    value={formData.role}
                    onChange={e => setFormData({ ...formData, role: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: "8px",
                      border: "1.5px solid #cbd5e1",
                      fontSize: "13px",
                      fontWeight: "700",
                      backgroundColor: "#fff"
                    }}
                  >
                    <option value="Customer">👤 Customer (Regular User)</option>
                    <option value="Admin">🛡️ Admin</option>
                    <option value="SuperAdmin">⚡ SuperAdmin</option>
                    <option value="Manager">💼 Manager</option>
                    <option value="Salesman">🏷️ Salesman / Staff</option>
                    <option value="Rider">🚚 Delivery Rider</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: "12px", fontWeight: "700", color: "#334155", display: "block", marginBottom: "4px" }}>
                    Account Status *
                  </label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: "8px",
                      border: "1.5px solid #cbd5e1",
                      fontSize: "13px",
                      fontWeight: "700",
                      backgroundColor: "#fff"
                    }}
                  >
                    <option value="Active">🟢 Active</option>
                    <option value="Suspicious">🟡 Suspicious</option>
                    <option value="Fraud">🔴 Fraud</option>
                    <option value="Blocked">⛔ Blocked</option>
                  </select>
                </div>
              </div>

              {/* Password & Points */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "700", color: "#334155", display: "block", marginBottom: "4px" }}>
                    {modalMode === "edit" ? "Reset Password (leave empty to keep)" : "Password *"}
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showPassword ? "text" : "password"}
                      required={modalMode === "create"}
                      placeholder={modalMode === "edit" ? "New password..." : "Enter strong password"}
                      value={formData.password}
                      onChange={e => setFormData({ ...formData, password: e.target.value })}
                      style={{
                        width: "100%",
                        padding: "10px 36px 10px 12px",
                        borderRadius: "8px",
                        border: "1.5px solid #cbd5e1",
                        fontSize: "13px"
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: "absolute",
                        right: "10px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "#94a3b8"
                      }}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: "12px", fontWeight: "700", color: "#334155", display: "block", marginBottom: "4px" }}>
                    Loyalty Reward Points
                  </label>
                  <input
                    type="number"
                    value={formData.points}
                    onChange={e => setFormData({ ...formData, points: Number(e.target.value) || 0 })}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: "8px",
                      border: "1.5px solid #cbd5e1",
                      fontSize: "13px"
                    }}
                  />
                </div>
              </div>

              {/* Form Buttons */}
              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "12px" }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    padding: "10px 20px",
                    borderRadius: "8px",
                    border: "1.5px solid #cbd5e1",
                    backgroundColor: "#f8fafc",
                    fontSize: "13px",
                    fontWeight: "700",
                    cursor: "pointer",
                    color: "#475569"
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    padding: "10px 24px",
                    borderRadius: "8px",
                    border: "none",
                    backgroundColor: modalAccountType === "admin" ? "#7c3aed" : "#e63b7a",
                    color: "#ffffff",
                    fontSize: "13px",
                    fontWeight: "800",
                    cursor: submitting ? "not-allowed" : "pointer",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                    opacity: submitting ? 0.7 : 1
                  }}
                >
                  {submitting
                    ? "Saving..."
                    : modalMode === "edit"
                      ? "Update User"
                      : modalAccountType === "admin"
                        ? "Create Admin Account"
                        : "Create Customer Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
