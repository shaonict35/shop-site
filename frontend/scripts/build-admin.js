const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '..', 'src', 'app', 'admin', 'page.tsx');

const content = `"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useApp } from "../../context/AppContext";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Home, ShoppingCart, Users, Package, Star, Image as ImageIcon, Settings, Bell, Search, Grid, Activity, Layout, Layers, Box, Calendar, User, FileText, CheckSquare, MessageSquare, Menu, LogOut, ExternalLink, ChevronDown, Mail } from 'lucide-react';

const salesData = [
  { name: 'Jan', cyan: 0, orange: 0, pink: 0 },
  { name: 'Feb', cyan: 240, orange: 0, pink: 0 },
  { name: 'Mar', cyan: 0, orange: 180, pink: 0 },
  { name: 'Apr', cyan: 0, orange: 0, pink: 80 },
  { name: 'May', cyan: 0, orange: 140, pink: 0 },
  { name: 'Jun', cyan: 80, orange: 0, pink: 0 },
  { name: 'Jul', cyan: 0, orange: 0, pink: 140 },
  { name: 'Aug', cyan: 300, orange: 0, pink: 0 },
  { name: 'Sep', cyan: 0, orange: 0, pink: 0 },
  { name: 'Oct', cyan: 0, orange: 0, pink: 0 },
  { name: 'Nov', cyan: 0, orange: 0, pink: 0 },
  { name: 'Dec', cyan: 0, orange: 0, pink: 0 },
];

const recentBuyers = [
  { name: "Kristopher Candy", tags: [{ label: "Electronics", color: "tag-cyan" }, { label: "Decor", color: "tag-orange" }], amount: "$1,021", img: "https://i.pravatar.cc/150?u=1" },
  { name: "Lawrence Fowler", tags: [{ label: "Appliances", color: "tag-pink" }], amount: "$2,021", img: "https://i.pravatar.cc/150?u=2" },
  { name: "Linda Olson", tags: [{ label: "Electronics", color: "tag-cyan" }, { label: "Office", color: "tag-green" }], amount: "$1,112", img: "https://i.pravatar.cc/150?u=3" },
  { name: "Roy Clark", tags: [{ label: "Decor", color: "tag-orange" }, { label: "Appliances", color: "tag-pink" }], amount: "$2,815", img: "https://i.pravatar.cc/150?u=4" }
];

export default function AdminPage() {
  const { user, token, login, logout } = useApp();
  const [isAdmin, setIsAdmin] = useState(false);

  // Tab State
  const [activeTab, setActiveTab] = useState<"dashboard" | "settings" | "orders" | "reviews" | "products" | "banners">("dashboard");

  // Banner Management States
  const [banners, setBanners] = useState<any[]>([]);
  const [bannerForm, setBannerForm] = useState({ id: "", title: "", imageUrl: "", linkUrl: "", bgColor: "#1a1a2e", isActive: true, sortOrder: "0" });
  const [isEditingBanner, setIsEditingBanner] = useState(false);
  const [bannerMessage, setBannerMessage] = useState("");

  // Products Management States
  const [adminProducts, setAdminProducts] = useState<any[]>([]);
  const [adminCategories, setAdminCategories] = useState<any[]>([]);
  const [adminBrands, setAdminBrands] = useState<any[]>([]);
  const [isEditingProduct, setIsEditingProduct] = useState(false);
  const [productForm, setProductForm] = useState({
    id: "", name: "", description: "", price: "", discountPrice: "", stock: "50", categoryId: "", brandId: "", imageUrl: ""
  });

  // Login Form States
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  // Orders State
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  // Reviews State
  const [pendingReviews, setPendingReviews] = useState<any[]>([]);

  // Integration Settings Form States
  const [settings, setSettings] = useState({
    META_PIXEL_ID: "", META_CAPI_TOKEN: "", GA4_MEASUREMENT_ID: "", GTM_CONTAINER_ID: "", SMS_PROVIDER_URL: "",
    SMS_API_KEY: "", SMS_SENDER_ID: "", SMS_TEMPLATE_ORDER_PLACED: "", SMS_TEMPLATE_ORDER_SHIPPED: "",
    COURIER_PROVIDER: "Steadfast", COURIER_API_SECRET: "", COURIER_CLIENT_ID: "", COURIER_STORE_ID: "",
    PAYMENT_MERCHANT_ID: "", PAYMENT_PASSWORD: "",
  });
  const [settingsMessage, setSettingsMessage] = useState("");

  useEffect(() => {
    if (user && ["SuperAdmin", "Manager", "Salesman"].includes(user.role)) {
      setIsAdmin(true);
    } else {
      setIsAdmin(false);
    }
  }, [user]);

  useEffect(() => {
    if (!isAdmin || !token) return;
    const fetchAdminData = async () => {
      try {
        const settingsRes = await fetch("http://localhost:5000/api/settings", { headers: { Authorization: \`Bearer \${token}\` } });
        if (settingsRes.ok) setSettings((prev) => ({ ...prev, ...await settingsRes.json() }));

        const ordersRes = await fetch("http://localhost:5000/api/orders/all", { headers: { Authorization: \`Bearer \${token}\` } });
        if (ordersRes.ok) setOrders(await ordersRes.json());
      } catch (e) {
        console.error("Error loading admin dashboard details", e);
      }
    };
    fetchAdminData();
  }, [isAdmin, token]);

  const fetchPendingReviews = async () => {
    if (!token) return;
    try {
      const res = await fetch("http://localhost:5000/api/admin/reviews", { headers: { Authorization: \`Bearer \${token}\` } });
      if (res.ok) setPendingReviews(await res.json());
    } catch (e) {}
  };

  useEffect(() => {
    if (isAdmin && token) fetchPendingReviews();
  }, [isAdmin, token]);

  const fetchBanners = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/banners/all");
      if (res.ok) setBanners(await res.json());
    } catch (e) {}
  };

  useEffect(() => { if (isAdmin) fetchBanners(); }, [isAdmin]);

  const fetchProductsList = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/products");
      if (res.ok) setAdminProducts(await res.json());
    } catch (e) {}
  };

  const fetchCategoriesAndBrands = async () => {
    try {
      const [catRes, brandRes] = await Promise.all([ fetch("http://localhost:5000/api/categories"), fetch("http://localhost:5000/api/brands") ]);
      if (catRes.ok) setAdminCategories(await catRes.json());
      if (brandRes.ok) setAdminBrands(await brandRes.json());
    } catch (e) {}
  };

  useEffect(() => {
    if (isAdmin) {
      fetchProductsList();
      fetchCategoriesAndBrands();
    }
  }, [isAdmin]);

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = isEditingProduct ? "PUT" : "POST";
      const endpoint = isEditingProduct ? \`http://localhost:5000/api/products/\${productForm.id}\` : "http://localhost:5000/api/products";
      const res = await fetch(endpoint, { method, headers: { "Content-Type": "application/json", Authorization: \`Bearer \${token}\` }, body: JSON.stringify(productForm) });
      if (res.ok) {
        setProductForm({ id: "", name: "", description: "", price: "", discountPrice: "", stock: "50", categoryId: productForm.categoryId || "", brandId: productForm.brandId || "", imageUrl: "" });
        setIsEditingProduct(false);
        fetchProductsList();
        alert("Product saved successfully.");
      } else {
        const err = await res.json();
        alert(err.error || "Failed to save product.");
      }
    } catch (e) { alert("Error saving product."); }
  };

  const handleDeleteProduct = async (prodId: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      const res = await fetch(\`http://localhost:5000/api/products/\${prodId}\`, { method: "DELETE", headers: { Authorization: \`Bearer \${token}\` } });
      if (res.ok) fetchProductsList();
      else alert("Failed to delete product.");
    } catch (e) { alert("Error deleting product."); }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    try {
      const res = await fetch("http://localhost:5000/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
      const data = await res.json();
      if (res.ok) {
        if (["SuperAdmin", "Manager", "Salesman"].includes(data.user.role)) {
          login(data.user, data.token);
        } else {
          setLoginError("Access denied: You are not authorized to view the admin panel.");
        }
      } else {
        setLoginError(data.error || "Login failed.");
      }
    } catch (e) {
      setLoginError("Connection error. Please verify the backend API is online.");
    }
  };

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsMessage("");
    try {
      const res = await fetch("http://localhost:5000/api/settings/bulk", { method: "POST", headers: { "Content-Type": "application/json", Authorization: \`Bearer \${token}\` }, body: JSON.stringify(settings) });
      if (res.ok) setSettingsMessage("Settings saved successfully. Tracking scripts updated live.");
      else setSettingsMessage("Failed to save settings.");
    } catch (e) { setSettingsMessage("Error saving settings."); }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    try {
      const res = await fetch(\`http://localhost:5000/api/orders/\${orderId}/status\`, { method: "PUT", headers: { "Content-Type": "application/json", Authorization: \`Bearer \${token}\` }, body: JSON.stringify({ status }) });
      if (res.ok) {
        const data = await res.json();
        setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, orderStatus: status, trackingLink: data.order.trackingLink } : o)));
        if (selectedOrder?.id === orderId) {
          setSelectedOrder((prev: any) => ({ ...prev, orderStatus: status, trackingLink: data.order.trackingLink }));
        }
      }
    } catch (e) { console.error("Error updating order status", e); }
  };

  const handleApproveReview = async (reviewId: string) => {
    try {
      const res = await fetch(\`http://localhost:5000/api/admin/reviews/\${reviewId}/approve\`, { method: "PUT", headers: { Authorization: \`Bearer \${token}\` } });
      if (res.ok) setPendingReviews((prev) => prev.filter((r) => r.id !== reviewId));
    } catch (e) { console.error("Error approving review", e); }
  };

  if (!isAdmin) {
    return (
      <main style={{ padding: "100px 20px", display: "flex", justifyContent: "center", minHeight: "100vh", backgroundColor: "#f4f5fa" }}>
        <form onSubmit={handleLogin} style={{ width: "100%", maxWidth: "400px", backgroundColor: "#fff", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "30px", boxShadow: "0 4px 15px rgba(0,0,0,0.05)", display: "flex", flexDirection: "column", gap: "16px", height: "fit-content" }}>
          <h1 style={{ fontSize: "22px", fontWeight: "800", color: "#e63b7a", textAlign: "center", marginBottom: "10px" }}>Stack Admin Access</h1>
          <div>
            <label style={{ fontSize: "12px", fontWeight: "700", display: "block", marginBottom: "5px" }}>Email</label>
            <input type="email" placeholder="admin@glowgoodly.com" value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: "100%", padding: "10px", border: "1.5px solid #e2e8f0", borderRadius: "6px", fontSize: "14px" }} />
          </div>
          <div>
            <label style={{ fontSize: "12px", fontWeight: "700", display: "block", marginBottom: "5px" }}>Password</label>
            <input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: "100%", padding: "10px", border: "1.5px solid #e2e8f0", borderRadius: "6px", fontSize: "14px" }} />
          </div>
          {loginError && <p style={{ color: "#e71d36", fontSize: "13px", fontWeight: "700" }}>{loginError}</p>}
          <button type="submit" style={{ backgroundColor: "#2b3344", color: "#fff", fontWeight: "800", padding: "12px", borderRadius: "6px", cursor: "pointer", textAlign: "center", marginTop: "10px", border: "none" }}>SIGN IN TO DASHBOARD</button>
          <Link href="/" style={{ textDecoration: "underline", color: "#718096", fontSize: "12px", fontWeight: "700", textAlign: "center", marginTop: "10px" }}>Return to Storefront</Link>
        </form>
      </main>
    );
  }

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-logo-area">
          <Layers style={{ color: '#00c6ff' }} />
          <span>Stack</span>
        </div>
        <div className="admin-sidebar-menu">
          <div className={\`admin-nav-item \${activeTab === 'dashboard' ? 'active' : ''}\`} onClick={() => setActiveTab("dashboard")}>
            <Home /> Dashboard
            <span style={{ position: 'absolute', right: '24px', background: '#00c6ff', color: '#fff', fontSize: '10px', padding: '2px 6px', borderRadius: '10px', fontWeight: 'bold' }}>3</span>
          </div>
          
          <div className="admin-sidebar-header">eCommerce</div>
          <div className={\`admin-nav-item \${activeTab === 'orders' ? 'active' : ''}\`} onClick={() => setActiveTab("orders")}><ShoppingCart /> Orders</div>
          <div className={\`admin-nav-item \${activeTab === 'products' ? 'active' : ''}\`} onClick={() => setActiveTab("products")}><Package /> Products</div>
          <div className={\`admin-nav-item \${activeTab === 'reviews' ? 'active' : ''}\`} onClick={() => setActiveTab("reviews")}><Star /> Reviews</div>
          <div className={\`admin-nav-item \${activeTab === 'banners' ? 'active' : ''}\`} onClick={() => { setActiveTab("banners"); fetchBanners(); }}><ImageIcon /> Promo Banners</div>
          <div className={\`admin-nav-item \${activeTab === 'settings' ? 'active' : ''}\`} onClick={() => setActiveTab("settings")}><Settings /> Integrations</div>

          <div className="admin-sidebar-header">Apps (Mockups)</div>
          <div className="admin-nav-item"><Mail /> Email Application</div>
          <div className="admin-nav-item"><MessageSquare /> Chat Application</div>
          <div className="admin-nav-item"><CheckSquare /> Todo Application</div>
          <div className="admin-nav-item"><User /> Contacts</div>
          <div className="admin-nav-item"><FileText /> Project Summary</div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="admin-main">
        <header className="admin-topbar">
          <div className="admin-topbar-left">
            <Menu style={{ cursor: 'pointer', color: '#718096' }} />
            <div className="admin-search">
              <Search size={16} color="#a0aec0" />
              <input type="text" placeholder="Mega search..." />
            </div>
          </div>
          <div className="admin-topbar-right">
            <div className="admin-icon-group">
              <div className="admin-top-icon">
                <Bell size={20} />
                <span className="admin-top-badge" style={{ right: '-2px', top: '-2px' }}>5</span>
              </div>
              <div className="admin-top-icon">
                <Mail size={20} />
                <span className="admin-top-badge" style={{ right: '-2px', top: '-2px', background: '#ffb74d' }}>3</span>
              </div>
            </div>
            <div className="admin-user-profile">
              <img src="https://i.pravatar.cc/150?u=a042581f4e29026704d" alt="Profile" className="admin-user-avatar" />
              <span style={{ fontSize: '13px', fontWeight: '600', color: '#4a5568' }}>John Doe</span>
              <ChevronDown size={14} color="#718096" />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginLeft: '10px', paddingLeft: '15px', borderLeft: '1px solid #edf2f7' }}>
              <ExternalLink size={18} color="#718096" style={{ cursor: 'pointer' }} onClick={() => window.location.href = "/"} />
              <LogOut size={18} color="#e71d36" style={{ cursor: 'pointer' }} onClick={() => { logout(); window.location.href = "/"; }} />
            </div>
          </div>
        </header>

        <div className="admin-content-scroll">
          {activeTab === "dashboard" && (
            <>
              {/* Stat Cards */}
              <div className="admin-stats-grid">
                <div className="admin-stat-card bg-grad-cyan">
                  <div className="icon-bg"><Package size={24} color="#fff" /></div>
                  <div>
                    <h3>Products</h3>
                    <p>+ {adminProducts.length || 28}</p>
                  </div>
                </div>
                <div className="admin-stat-card bg-grad-pink">
                  <div className="icon-bg"><User size={24} color="#fff" /></div>
                  <div>
                    <h3>New Users</h3>
                    <p>↑ 1,238</p>
                  </div>
                </div>
                <div className="admin-stat-card bg-grad-orange">
                  <div className="icon-bg"><ShoppingCart size={24} color="#fff" /></div>
                  <div>
                    <h3>New Orders</h3>
                    <p>↓ {orders.length || 4658}</p>
                  </div>
                </div>
                <div className="admin-stat-card bg-grad-green">
                  <div className="icon-bg"><Box size={24} color="#fff" /></div>
                  <div>
                    <h3>Total Profit</h3>
                    <p>↑ 5.6 M</p>
                  </div>
                </div>
              </div>

              {/* Main Dashboard Grid */}
              <div className="admin-dashboard-grid">
                {/* Area Chart */}
                <div className="admin-panel-card">
                  <div className="admin-panel-title">
                    <span>PRODUCTS SALES</span>
                    <div style={{ display: 'flex', gap: '5px' }}>
                      <Activity size={16} color="#a0aec0" />
                      <Grid size={16} color="#a0aec0" />
                    </div>
                  </div>
                  <div style={{ width: '100%', height: '350px' }}>
                    <ResponsiveContainer>
                      <AreaChart data={salesData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorCyan" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#00c6ff" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#00c6ff" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorOrange" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ff9800" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#ff9800" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorPink" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#e91e63" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#e91e63" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#a0aec0' }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#a0aec0' }} />
                        <RechartsTooltip />
                        <CartesianGrid vertical={false} stroke="#edf2f7" />
                        <Area type="monotone" dataKey="cyan" stroke="#00c6ff" fillOpacity={1} fill="url(#colorCyan)" />
                        <Area type="monotone" dataKey="orange" stroke="#ff9800" fillOpacity={1} fill="url(#colorOrange)" />
                        <Area type="monotone" dataKey="pink" stroke="#e91e63" fillOpacity={1} fill="url(#colorPink)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Recent Buyers List */}
                <div className="admin-panel-card">
                  <div className="admin-panel-title">
                    <span>RECENT BUYERS</span>
                    <Grid size={16} color="#a0aec0" />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    {recentBuyers.map((buyer, idx) => (
                      <div key={idx} className="recent-buyer-item">
                        <div className="recent-buyer-info">
                          <img src={buyer.img} alt={buyer.name} />
                          <div>
                            <div style={{ fontSize: '13px', fontWeight: '600', color: '#2d3748' }}>{buyer.name}</div>
                            <div className="recent-buyer-tags">
                              {buyer.tags.map((tag, i) => (
                                <span key={i} className={\`recent-buyer-tag \${tag.color}\`}>{tag.label}</span>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                          <div className="recent-buyer-amount">{buyer.amount}</div>
                          {idx === 0 && (
                            <div className="settings-box-btn">
                              <Settings size={16} />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom Orders Table */}
              <div className="admin-panel-card">
                <div className="admin-panel-title">
                  <span>RECENT ORDERS</span>
                  <div style={{ display: 'flex', gap: '5px' }}>
                    <Activity size={16} color="#a0aec0" />
                    <Grid size={16} color="#a0aec0" />
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '20px' }}>
                  <p style={{ fontSize: '13px', color: '#718096' }}>Total paid invoices 240, unpaid 150.</p>
                  <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab("orders"); }} style={{ fontSize: '13px', color: '#00c6ff', fontWeight: '700' }}>Invoice Summary →</a>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px' }}>
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>SKU</th>
                        <th>Invoice#</th>
                        <th>Customer Name</th>
                        <th>Status</th>
                        <th>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.slice(0, 5).map((o, i) => (
                        <tr key={o.id || i}>
                          <td>#{o.id ? o.id.substring(0, 6).toUpperCase() : 'SKU891'}</td>
                          <td>{o.orderNumber || 'INV-001'}</td>
                          <td>{o.customerName || 'Test User'}</td>
                          <td>
                            <span className={\`admin-status-badge \${(o.orderStatus === 'Delivered' || o.orderStatus === 'Shipped') ? 'status-paid' : 'status-unpaid'}\`}>
                              {(o.orderStatus === 'Delivered' || o.orderStatus === 'Shipped') ? 'Paid' : 'Unpaid'}
                            </span>
                          </td>
                          <td style={{ fontWeight: '700' }}>BDT {o.total || '0'}</td>
                        </tr>
                      ))}
                      {/* Filler rows if empty */}
                      {orders.length === 0 && [1,2,3].map(i => (
                        <tr key={i}>
                          <td>#SKU10{i}</td>
                          <td>INV-100{i}</td>
                          <td>John Doe</td>
                          <td><span className="admin-status-badge status-paid">Paid</span></td>
                          <td style={{ fontWeight: '700' }}>$1,200</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {/* Small Bar chart (Invoice Summary) */}
                  <div style={{ width: '100%', height: '180px', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ flex: 1 }}>
                      <ResponsiveContainer>
                        <BarChart data={salesData.slice(0, 6)} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                          <XAxis dataKey="name" hide />
                          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#a0aec0' }} />
                          <Bar dataKey="cyan" fill="#9c27b0" radius={[2, 2, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <button style={{ width: '100%', padding: '10px', background: '#9c27b0', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: '700', cursor: 'pointer', marginTop: '10px' }}>
                      Buy Now
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* OTHER TABS */}
          <div style={{ display: activeTab === 'dashboard' ? 'none' : 'block' }}>
            {activeTab === "orders" && (
              <div style={{ display: "flex", gap: "30px", flexWrap: "wrap" }}>
                <div style={{ flex: 1.5, minWidth: "300px", backgroundColor: "#fff", borderRadius: "8px", padding: "20px", boxShadow: "0 2px 10px rgba(0,0,0,0.03)" }}>
                  <h2 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "15px", textTransform: 'uppercase' }}>Orders List</h2>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "500px", overflowY: "auto" }}>
                    {orders.length === 0 ? <p style={{ color: "#718096", padding: "20px" }}>No orders placed yet.</p> : orders.map((o) => (
                      <div key={o.id} onClick={() => setSelectedOrder(o)} style={{ padding: "12px 16px", border: selectedOrder?.id === o.id ? "2px solid #00c6ff" : "1px solid #edf2f7", borderRadius: "6px", cursor: "pointer", backgroundColor: "#f8fafc", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <strong style={{ fontSize: "14px", display: "block", color: '#2d3748' }}>{o.orderNumber}</strong>
                          <span style={{ fontSize: "12px", color: "#718096", fontWeight: "500" }}>{o.customerName} | BDT {o.total}</span>
                        </div>
                        <span style={{ fontSize: "11px", fontWeight: "700", padding: "4px 10px", borderRadius: "20px", backgroundColor: o.orderStatus === "Delivered" ? "rgba(76, 175, 80, 0.15)" : o.orderStatus === "Pending" ? "rgba(255, 152, 0, 0.15)" : "rgba(233, 30, 99, 0.15)", color: o.orderStatus === "Delivered" ? "#4caf50" : o.orderStatus === "Pending" ? "#ff9800" : "#e91e63" }}>{o.orderStatus}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ flex: 2, minWidth: "320px", backgroundColor: "#fff", borderRadius: "8px", padding: "24px", boxShadow: "0 2px 10px rgba(0,0,0,0.03)" }}>
                  {selectedOrder ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #edf2f7", paddingBottom: "10px" }}>
                        <div>
                          <h2 style={{ fontSize: "18px", fontWeight: "700", color: '#2d3748' }}>Order {selectedOrder.orderNumber}</h2>
                          <span style={{ fontSize: "12px", color: "#718096", fontWeight: "500" }}>Placed on: {new Date(selectedOrder.createdAt).toLocaleString()}</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <label style={{ fontSize: "12px", fontWeight: "700" }}>Status:</label>
                          <select value={selectedOrder.orderStatus} onChange={(e) => handleUpdateOrderStatus(selectedOrder.id, e.target.value)} style={{ padding: "6px 12px", border: "1px solid #cbd5e0", borderRadius: "4px", fontSize: "12px", fontWeight: "600" }}>
                            <option value="Pending">Pending</option>
                            <option value="Processing">Processing</option>
                            <option value="Shipped">Shipped</option>
                            <option value="Delivered">Delivered</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <h3 style={{ fontSize: "14px", fontWeight: "700", marginBottom: "8px", color: '#4a5568' }}>Customer Details</h3>
                        <p style={{ fontSize: "13px", fontWeight: "500", color: '#2d3748' }}>Name: {selectedOrder.customerName}</p>
                        <p style={{ fontSize: "13px", fontWeight: "500", color: '#2d3748' }}>Email: {selectedOrder.customerEmail}</p>
                        <p style={{ fontSize: "13px", fontWeight: "500", color: '#2d3748' }}>Phone: {selectedOrder.customerPhone}</p>
                        <p style={{ fontSize: "13px", fontWeight: "500", color: '#2d3748' }}>Address: {selectedOrder.address} ({selectedOrder.zone})</p>
                      </div>
                      <div>
                        <h3 style={{ fontSize: "14px", fontWeight: "700", marginBottom: "8px", color: '#4a5568' }}>Items</h3>
                        <table className="admin-table">
                          <thead><tr><th>Product</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead>
                          <tbody>
                            {selectedOrder.orderItems?.map((item: any, idx: number) => (
                              <tr key={idx}><td>{item.productName}</td><td>{item.quantity}</td><td>BDT {item.price}</td><td style={{ fontWeight: '700', color: '#00c6ff' }}>BDT {item.total}</td></tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <p style={{ color: "#718096", padding: "40px", textAlign: "center" }}>Select an order to manage.</p>
                  )}
                </div>
              </div>
            )}

            {activeTab === "products" && (
              <div style={{ display: "flex", gap: "30px", flexWrap: "wrap", alignItems: "flex-start" }}>
                <form onSubmit={handleSaveProduct} style={{ flex: "1", minWidth: "320px", backgroundColor: "#fff", borderRadius: "8px", padding: "25px", boxShadow: "0 2px 10px rgba(0,0,0,0.03)", display: "flex", flexDirection: "column", gap: "15px" }}>
                  <h2 style={{ fontSize: "16px", fontWeight: "700", color: "#2d3748", textTransform: 'uppercase' }}>{isEditingProduct ? "Edit Product" : "Add Product"}</h2>
                  <input type="text" required placeholder="Product Name" value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} style={{ width: "100%", padding: "10px", border: "1px solid #e2e8f0", borderRadius: "4px", fontSize: "13px" }} />
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <select required value={productForm.categoryId} onChange={(e) => setProductForm({ ...productForm, categoryId: e.target.value })} style={{ width: "100%", padding: "10px", border: "1px solid #e2e8f0", borderRadius: "4px", fontSize: "13px" }}>
                      <option value="">Category</option>{adminCategories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                    </select>
                    <select required value={productForm.brandId} onChange={(e) => setProductForm({ ...productForm, brandId: e.target.value })} style={{ width: "100%", padding: "10px", border: "1px solid #e2e8f0", borderRadius: "4px", fontSize: "13px" }}>
                      <option value="">Brand</option>{adminBrands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
                    <input type="number" required placeholder="Price" value={productForm.price} onChange={(e) => setProductForm({ ...productForm, price: e.target.value })} style={{ width: "100%", padding: "10px", border: "1px solid #e2e8f0", borderRadius: "4px", fontSize: "13px" }} />
                    <input type="number" placeholder="Discount" value={productForm.discountPrice} onChange={(e) => setProductForm({ ...productForm, discountPrice: e.target.value })} style={{ width: "100%", padding: "10px", border: "1px solid #e2e8f0", borderRadius: "4px", fontSize: "13px" }} />
                    <input type="number" required placeholder="Stock" value={productForm.stock} onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })} style={{ width: "100%", padding: "10px", border: "1px solid #e2e8f0", borderRadius: "4px", fontSize: "13px" }} />
                  </div>
                  <input type="text" placeholder="Image URL" value={productForm.imageUrl} onChange={(e) => setProductForm({ ...productForm, imageUrl: e.target.value })} style={{ width: "100%", padding: "10px", border: "1px solid #e2e8f0", borderRadius: "4px", fontSize: "13px" }} />
                  <textarea rows={3} placeholder="Description" value={productForm.description} onChange={(e) => setProductForm({ ...productForm, description: e.target.value })} style={{ width: "100%", padding: "10px", border: "1px solid #e2e8f0", borderRadius: "4px", fontSize: "13px" }} />
                  <div style={{ display: "flex", gap: "10px" }}>
                    <button type="submit" style={{ flex: 1, backgroundColor: "#00c6ff", color: "#fff", fontWeight: "700", padding: "12px", borderRadius: "4px", cursor: "pointer", border: "none" }}>{isEditingProduct ? "UPDATE" : "CREATE"}</button>
                    {isEditingProduct && <button type="button" onClick={() => { setIsEditingProduct(false); setProductForm({ id: "", name: "", description: "", price: "", discountPrice: "", stock: "50", categoryId: "", brandId: "", imageUrl: "" }); }} style={{ backgroundColor: "#e2e8f0", color: "#4a5568", fontWeight: "700", padding: "12px", borderRadius: "4px", cursor: "pointer", border: "none" }}>Cancel</button>}
                  </div>
                </form>
                <div style={{ flex: "2", minWidth: "400px", backgroundColor: "#fff", borderRadius: "8px", padding: "25px", boxShadow: "0 2px 10px rgba(0,0,0,0.03)", maxHeight: "85vh", overflowY: "auto" }}>
                  <h2 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "15px", textTransform: 'uppercase' }}>Catalog</h2>
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {adminProducts.filter((p) => p.status === "Active").map((p) => {
                      const variant = p.variants[0] || { price: 0, discountPrice: null, stock: 0 };
                      const image = p.images[0]?.url || "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&q=80";
                      return (
                        <div key={p.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px", border: "1px solid #edf2f7", borderRadius: "6px", gap: "15px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "15px", flex: 1 }}>
                            <img src={image} alt={p.name} style={{ width: "45px", height: "45px", borderRadius: "4px", objectFit: "cover" }} />
                            <div style={{ minWidth: 0 }}>
                              <h4 style={{ fontSize: "13px", fontWeight: "700", color: "#2d3748", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</h4>
                              <div style={{ fontSize: "12px", fontWeight: "700", marginTop: "4px", color: "#00c6ff" }}>৳ {variant.discountPrice || variant.price}</div>
                            </div>
                          </div>
                          <div style={{ display: "flex", gap: "6px" }}>
                            <button onClick={() => { setIsEditingProduct(true); setProductForm({ id: p.id, name: p.name, description: p.description || "", price: variant.price.toString(), discountPrice: variant.discountPrice ? variant.discountPrice.toString() : "", stock: variant.stock.toString(), categoryId: p.categoryId, brandId: p.brandId, imageUrl: p.images[0]?.url || "" }); }} style={{ padding: "6px 12px", backgroundColor: "#edf2f7", color: "#4a5568", border: "none", borderRadius: "4px", fontWeight: "700", fontSize: "11px", cursor: "pointer" }}>Edit</button>
                            <button onClick={() => handleDeleteProduct(p.id)} style={{ padding: "6px 12px", backgroundColor: "#fee2e2", color: "#e53e3e", border: "none", borderRadius: "4px", fontWeight: "700", fontSize: "11px", cursor: "pointer" }}>Delete</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === "reviews" && (
              <div className="admin-panel-card" style={{ maxWidth: "800px", margin: "0 auto" }}>
                <h2 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "20px", textTransform: 'uppercase' }}>Pending Reviews</h2>
                {pendingReviews.length === 0 ? <p style={{ color: "#718096" }}>No reviews pending approval.</p> : pendingReviews.map((rev) => (
                  <div key={rev.id} style={{ padding: "16px", border: "1px solid #edf2f7", borderRadius: "6px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: '10px' }}>
                    <div>
                      <strong style={{ fontSize: "14px" }}>{rev.customerName}</strong>
                      <span style={{ color: "#ffb74d", fontSize: "11px", fontWeight: "700", marginLeft: '10px' }}>{"★".repeat(rev.rating)}</span>
                      <p style={{ fontSize: "13px", color: "#4a5568", marginTop: '5px' }}>{rev.comment}</p>
                    </div>
                    <button onClick={() => handleApproveReview(rev.id)} style={{ backgroundColor: "#4caf50", color: "#fff", padding: "8px 16px", borderRadius: "4px", fontSize: "12px", fontWeight: "700", cursor: "pointer", border: 'none' }}>APPROVE</button>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "settings" && (
              <div className="admin-panel-card" style={{ maxWidth: "800px", margin: "0 auto" }}>
                <h2 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "20px", textTransform: 'uppercase' }}>Integrations Settings</h2>
                <form onSubmit={handleUpdateSettings} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
                    <input type="text" placeholder="Meta Pixel ID" value={settings.META_PIXEL_ID} onChange={(e) => setSettings({ ...settings, META_PIXEL_ID: e.target.value })} style={{ width: "100%", padding: "10px", border: "1px solid #e2e8f0", borderRadius: "4px", fontSize: "13px" }} />
                    <input type="text" placeholder="GA4 ID" value={settings.GA4_MEASUREMENT_ID} onChange={(e) => setSettings({ ...settings, GA4_MEASUREMENT_ID: e.target.value })} style={{ width: "100%", padding: "10px", border: "1px solid #e2e8f0", borderRadius: "4px", fontSize: "13px" }} />
                    <input type="text" placeholder="SMS Provider URL" value={settings.SMS_PROVIDER_URL} onChange={(e) => setSettings({ ...settings, SMS_PROVIDER_URL: e.target.value })} style={{ width: "100%", padding: "10px", border: "1px solid #e2e8f0", borderRadius: "4px", fontSize: "13px" }} />
                    <input type="password" placeholder="SMS API Key" value={settings.SMS_API_KEY} onChange={(e) => setSettings({ ...settings, SMS_API_KEY: e.target.value })} style={{ width: "100%", padding: "10px", border: "1px solid #e2e8f0", borderRadius: "4px", fontSize: "13px" }} />
                  </div>
                  {settingsMessage && <p style={{ color: "#00c6ff", fontSize: "13px", fontWeight: "700" }}>{settingsMessage}</p>}
                  <button type="submit" style={{ backgroundColor: "#00c6ff", color: "#fff", fontWeight: "700", padding: "14px", borderRadius: "4px", cursor: "pointer", border: 'none' }}>SAVE SETTINGS</button>
                </form>
              </div>
            )}
            
            {activeTab === "banners" && (
              <div className="admin-panel-card" style={{ maxWidth: "800px", margin: "0 auto" }}>
                <h2 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "20px", textTransform: 'uppercase' }}>Promo Banners</h2>
                {bannerMessage && <div style={{ padding: "12px", backgroundColor: "#d1fae5", color: "#065f46", borderRadius: "4px", fontSize: "13px", marginBottom: "15px" }}>{bannerMessage}</div>}
                
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "20px" }}>
                  <input type="text" placeholder="Banner Title" value={bannerForm.title} onChange={(e) => setBannerForm({ ...bannerForm, title: e.target.value })} style={{ width: "100%", padding: "10px", border: "1px solid #e2e8f0", borderRadius: "4px", fontSize: "13px" }} />
                  <input type="text" placeholder="Image URL" value={bannerForm.imageUrl} onChange={(e) => setBannerForm({ ...bannerForm, imageUrl: e.target.value })} style={{ width: "100%", padding: "10px", border: "1px solid #e2e8f0", borderRadius: "4px", fontSize: "13px" }} />
                  <button onClick={async () => {
                    const method = isEditingBanner ? "PATCH" : "POST";
                    const url = isEditingBanner ? \`http://localhost:5000/api/banners/\${bannerForm.id}\` : "http://localhost:5000/api/banners";
                    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...bannerForm, sortOrder: Number(bannerForm.sortOrder) }) });
                    if (res.ok) {
                      setBannerMessage(isEditingBanner ? "Updated!" : "Created!");
                      setBannerForm({ id: "", title: "", imageUrl: "", linkUrl: "", bgColor: "#1a1a2e", isActive: true, sortOrder: "0" });
                      setIsEditingBanner(false);
                      await fetchBanners();
                      setTimeout(() => setBannerMessage(""), 3000);
                    }
                  }} style={{ gridColumn: '1 / -1', padding: "12px", backgroundColor: "#9c27b0", color: "#fff", border: "none", borderRadius: "4px", fontWeight: "700", cursor: "pointer" }}>
                    {isEditingBanner ? "Update Banner" : "Add Banner"}
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {banners.map((b) => (
                    <div key={b.id} style={{ display: 'flex', border: '1px solid #edf2f7', borderRadius: '6px', overflow: 'hidden' }}>
                      <img src={b.imageUrl} alt={b.title} style={{ width: '120px', height: '80px', objectFit: 'cover' }} />
                      <div style={{ padding: '10px', flex: 1 }}>
                        <div style={{ fontWeight: '700', fontSize: '14px' }}>{b.title}</div>
                        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                          <button onClick={async () => { await fetch(\`http://localhost:5000/api/banners/\${b.id}\`, { method: "DELETE" }); fetchBanners(); }} style={{ padding: "4px 8px", backgroundColor: "#fee2e2", color: "#e53e3e", border: "none", borderRadius: "4px", fontSize: "11px", cursor: "pointer" }}>Delete</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
`;

fs.writeFileSync(targetPath, content, 'utf8');
console.log('Successfully generated AdminPage replacement');
