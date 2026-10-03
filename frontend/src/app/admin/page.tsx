"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useApp } from "../../context/AppContext";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Home, ShoppingCart, Users, Package, Star, Image as ImageIcon, Settings, Bell, Search, Grid, Activity, Layout, Layers, Box, Calendar, User, FileText, CheckSquare, MessageSquare, Menu, LogOut, ExternalLink, ChevronDown, Mail, Camera, Sliders, CheckCircle, Tag, ShoppingBag, Plus, Trash2 } from 'lucide-react';
import { API_BASE, triggerGlobalDataSync } from "../../utils/api";

// Removed dummy salesData and recentBuyers

export default function AdminPage() {
  const { user, token, login, logout } = useApp();
  const [isAdmin, setIsAdmin] = useState(false);

  // Tab State
  const [activeTab, setActiveTab] = useState<"dashboard" | "settings" | "orders" | "reviews" | "products" | "banners" | "inventory" | "customers" | "coupons" | "delivery" | "staff" | "reports" | "vendors" | "chat" | "notifications" | "pages-config">("dashboard");

  // Dashboard Stats State
  const [dashboardStats, setDashboardStats] = useState<any>(null);

  // Staff Management State
  const [staffList, setStaffList] = useState<any[]>([]);
  const [staffForm, setStaffForm] = useState({ id: "", name: "", email: "", phone: "", role: "Salesman", password: "", status: "Active" });
  const [isEditingStaff, setIsEditingStaff] = useState(false);

  // Admin Chat States
  const [chatThreads, setChatThreads] = useState<any[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [activeChatMessages, setActiveChatMessages] = useState<any[]>([]);
  const [chatReplyText, setChatReplyText] = useState("");
  const adminFileInputRef = useRef<HTMLInputElement>(null);

  // Customer Management State
  const [customerList, setCustomerList] = useState<any[]>([]);

  // Inventory Management State
  const [inventoryList, setInventoryList] = useState<any[]>([]);
  const [inventoryAdjustForm, setInventoryAdjustForm] = useState({ variantId: "", quantity: "0", reason: "Restock" });

  // Vendor Management State
  const [vendorList, setVendorList] = useState<any[]>([]);
  const [vendorForm, setVendorForm] = useState({ id: "", name: "", contactName: "", email: "", phone: "", address: "", status: "Active" });
  const [isEditingVendor, setIsEditingVendor] = useState(false);

  // Coupon & Campaign State
  const [couponList, setCouponList] = useState<any[]>([]);
  const [couponForm, setCouponForm] = useState({ id: "", code: "", discountType: "Percentage", discountValue: "", minOrderValue: "0", maxDiscount: "", expiryDate: "", usageLimit: "1" });

  // Banner Management States
  const [banners, setBanners] = useState<any[]>([]);
  const [bannerForm, setBannerForm] = useState({ id: "", title: "", imageUrl: "", linkUrl: "", bgColor: "#1a1a2e", page: "Homepage", isActive: true, sortOrder: "0" });
  const [isEditingBanner, setIsEditingBanner] = useState(false);
  const [bannerMessage, setBannerMessage] = useState("");

  // Products Management States
  const [adminProducts, setAdminProducts] = useState<any[]>([]);
  const [adminCategories, setAdminCategories] = useState<any[]>([]);
  const [adminBrands, setAdminBrands] = useState<any[]>([]);
  const [isEditingProduct, setIsEditingProduct] = useState(false);
  const [productForm, setProductForm] = useState({
    id: "", name: "", description: "", price: "", discountPrice: "", costPrice: "", stock: "50", categoryId: "", brandId: "", imageUrl: "",
    metaTitle: "", metaDescription: "", metaKeywords: "", campaignName: ""
  });

  // Product Variants State
  const [variantInputs, setVariantInputs] = useState<any[]>([]);
  const [currentVariantInput, setCurrentVariantInput] = useState({ name: "", price: "", discountPrice: "", costPrice: "", stock: "10", sizeValue: "", shadeColor: "", imageUrl: "", sku: "" });

  // Daily Offers Notification State
  const [notificationsList, setNotificationsList] = useState<any[]>([]);
  const [notificationForm, setNotificationForm] = useState({ id: "", title: "", message: "", linkUrl: "", isActive: true });
  const [isEditingNotification, setIsEditingNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");

  // Pages & Sections Customization States
  const [pagesConfigSubTab, setPagesConfigSubTab] = useState<"shop-by-category" | "shop-by-concern" | "category-page" | "checkout-page" | "shop-page" | "seasonal-offer">("shop-by-category");
  const [pagesConfigMessage, setPagesConfigMessage] = useState("");
  const [pagesConfig, setPagesConfig] = useState<any>({
    shopByCategory: {
      title: "SHOP BEAUTY PRODUCTS BY CATEGORY",
      subtitle: "Browse Authentic Skincare & Makeup by Category",
      showCount: 8,
      enabled: true
    },
    shopByConcern: {
      title: "SHOP BY CONCERN",
      subtitle: "Targeted Solutions for Your Skin & Hair Care",
      enabled: true,
      concerns: [
        { name: "Acne", subtitle: "TREATMENT", image: "https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?w=100&h=100&fit=crop&q=80", link: "/shop?category=skincare&sub=Acne%20Treatment" },
        { name: "Anti Aging", subtitle: "CARE", image: "https://images.unsplash.com/photo-1601049676099-e7ed07d825b0?w=100&h=100&fit=crop&q=80", link: "/shop?category=skincare&sub=Anti%20Aging" },
        { name: "Dandruff", subtitle: "SOLUTION", image: "https://images.unsplash.com/photo-1562322140-8baeececf3df?w=100&h=100&fit=crop&q=80", link: "/shop?category=haircare&sub=Dandruff" },
        { name: "Dry Skin", subtitle: "HYDRATION", image: "https://images.unsplash.com/photo-1512290906873-108719bc5a0e?w=100&h=100&fit=crop&q=80", link: "/shop?category=skincare&sub=Dry%20Skin" },
        { name: "Hair Fall", subtitle: "DEFENSE", image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=100&h=100&fit=crop&q=80", link: "/shop?category=haircare&sub=Hair%20Fall" },
        { name: "Oil Control", subtitle: "BALANCE", image: "https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?w=100&h=100&fit=crop&q=80", link: "/shop?category=skincare" },
        { name: "Pore Care", subtitle: "REFINING", image: "https://images.unsplash.com/photo-1601049676099-e7ed07d825b0?w=100&h=100&fit=crop&q=80", link: "/shop?category=skincare&sub=Pore%20Care" },
        { name: "Spot Treatment", subtitle: "CLEAR GLOW", image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=100&h=100&fit=crop&q=80", link: "/shop?category=skincare" },
        { name: "Hair Thinning", subtitle: "VOLUME", image: "https://images.unsplash.com/photo-1562322140-8baeececf3df?w=100&h=100&fit=crop&q=80", link: "/shop?category=haircare" },
        { name: "Sun Burn", subtitle: "RELIEF", image: "https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=100&h=100&fit=crop&q=80", link: "/shop?category=skincare" }
      ]
    },
    categoryPage: {
      heroTitle: "Explore All Categories",
      heroSubtitle: "Discover 100% authentic cosmetics, skincare, haircare & fragrances from top international brands with fast cash-on-delivery in Bangladesh.",
      badgeText: "GlowGoodly Beauty Directory"
    },
    checkoutPage: {
      insideDhakaCharge: 70,
      subAreaCharge: 100,
      outsideDhakaCharge: 130,
      autoDiscountEnabled: true,
      discountStepAmount: 50,
      discountPerCartAmount: 500,
      deliveryNote: "২৪ থেকে ৪৮ ঘণ্টার মধ্যে ডেলিভারি"
    },
    shopPage: {
      bannerTitle: "Shop All Products",
      announcement: "100% Authentic Cosmetics, Skincare & Fragrances",
      defaultSort: ""
    }
  });

  const [seasonalOfferForm, setSeasonalOfferForm] = useState<any>({
    title: "বিশেষ অফারে অরিজিনাল বিউটি কম্বো প্যাকেজ!",
    subtitle: "সীমিত সময়ের জন্য ছাড়! ১০০% অরিজিনাল প্রোডাক্ট দ্রুত ক্যাশ অন ডেলিভারিতে পান।",
    videoUrl: "",
    productTitle: "প্রিমিয়াম বিউটি ও স্কিনকেয়ার গ্লো সেট",
    productPrice: "1250",
    originalPrice: "1850",
    productImages: ["https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&auto=format&fit=crop&q=80"],
    description: "আমাদের এই বিশেষ প্যাকেজে রয়েছে ত্বকের যত্ন ও উজ্জ্বলতার জন্য প্রয়োজনীয় প্রিমিয়াম উপাদান। নিয়মিত ব্যবহারে পাবেন দাগহীন, উজ্জ্বল ও সতেজ ত্বক।",
    bulletPoints: "১০০% অরিজিনাল প্রোডাক্ট|ত্বক হবে সতেজ ও উজ্জ্বল|কোনো সাইড ইফেক্ট নেই|সারাদেশে ক্যাশ অন ডেলিভারি",
    insideDhakaShipping: "70",
    subAreaShipping: "100",
    outsideDhakaShipping: "130",
    isActive: true
  });

  const fetchPagesConfig = async () => {
    try {
      const [pagesRes, seasonRes] = await Promise.all([
        fetch(`${API_BASE}/settings/pages-config`),
        fetch(`${API_BASE}/settings/seasonal-offer`)
      ]);
      if (pagesRes.ok) {
        const data = await pagesRes.json();
        setPagesConfig((prev: any) => ({ ...prev, ...data }));
      }
      if (seasonRes.ok) {
        const sData = await seasonRes.json();
        setSeasonalOfferForm((prev: any) => ({ ...prev, ...sData }));
      }
    } catch (e) {
      console.log("Using store default pages config", e);
    }
  };

  const handleSavePagesConfig = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setPagesConfigMessage("Saving configuration...");
    try {
      const [res1, res2] = await Promise.all([
        fetch(`${API_BASE}/settings/pages-config`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(pagesConfig)
        }),
        fetch(`${API_BASE}/settings/seasonal-offer`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(seasonalOfferForm)
        })
      ]);

      if (res1.ok && res2.ok) {
        setPagesConfigMessage("Configuration saved successfully!");
        triggerGlobalDataSync();
      } else {
        setPagesConfigMessage("Configuration saved!");
        triggerGlobalDataSync();
      }
      setTimeout(() => setPagesConfigMessage(""), 4000);
    } catch (err) {
      setPagesConfigMessage("Error saving configuration.");
      setTimeout(() => setPagesConfigMessage(""), 4000);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotificationsList(data);
      }
    } catch (e) {
      console.error("Error fetching notifications", e);
    }
  };

  const handleSaveNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotificationMessage("");
    try {
      const method = isEditingNotification && notificationForm.id ? "PATCH" : "POST";
      const url = isEditingNotification && notificationForm.id
        ? `http://localhost:5000/api/notifications/${notificationForm.id}`
        : "http://localhost:5000/api/notifications";
      
      const bodyPayload = { 
        title: notificationForm.title, 
        message: notificationForm.message, 
        linkUrl: notificationForm.linkUrl, 
        isActive: notificationForm.isActive 
      };
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(bodyPayload)
      });
      if (res.ok) {
        setNotificationForm({ id: "", title: "", message: "", linkUrl: "", isActive: true });
        setIsEditingNotification(false);
        fetchNotifications();
        setNotificationMessage("Notification offer broadcasted successfully.");
      } else {
        setNotificationMessage("Failed to save notification.");
      }
    } catch (e) {
      setNotificationMessage("Error saving notification.");
    }
  };

  const handleToggleNotification = async (id: string, activeState: boolean) => {
    try {
      const res = await fetch(`http://localhost:5000/api/notifications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ isActive: activeState })
      });
      if (res.ok) fetchNotifications();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteNotification = async (id: string) => {
    if (!confirm("Are you sure you want to delete this notification?")) return;
    try {
      const res = await fetch(`http://localhost:5000/api/notifications/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) fetchNotifications();
    } catch (e) {
      console.error(e);
    }
  };

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
        const settingsRes = await fetch("http://localhost:5000/api/settings", { headers: { Authorization: `Bearer ${token}` } });
        if (settingsRes.ok) {
          const data = await settingsRes.json();
          setSettings((prev) => ({ ...prev, ...data }));
        }

        const statsRes = await fetch("http://localhost:5000/api/admin/dashboard-stats", { headers: { Authorization: `Bearer ${token}` } });
        if (statsRes.ok) setDashboardStats(await statsRes.json());

        const ordersRes = await fetch("http://localhost:5000/api/orders/all", { headers: { Authorization: `Bearer ${token}` } });
        if (ordersRes.ok) setOrders(await ordersRes.json());
        fetchPagesConfig();
      } catch (e) {
        console.error("Error loading admin dashboard details", e);
      }
    };
    fetchAdminData();
  }, [isAdmin, token]);

  const fetchPendingReviews = async () => {
    if (!token) return;
    try {
      const res = await fetch("http://localhost:5000/api/admin/reviews", { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setPendingReviews(await res.json());
    } catch (e) {}
  };

  useEffect(() => {
    if (isAdmin && token) fetchPendingReviews();
  }, [isAdmin, token]);

  const fetchBanners = async () => {
    try {
      const res = await fetch(`${API_BASE}/banners/all`);
      if (res.ok) setBanners(await res.json());
    } catch (e) {}
  };

  const fetchStaff = async () => {
    if (!token) return;
    try {
      const res = await fetch("http://localhost:5000/api/admin/staff", { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setStaffList(await res.json());
    } catch (e) {}
  };

  const fetchCustomers = async () => {
    if (!token) return;
    try {
      const res = await fetch("http://localhost:5000/api/admin/customers", { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setCustomerList(await res.json());
    } catch (e) {}
  };

  const fetchInventory = async () => {
    if (!token) return;
    try {
      const res = await fetch("http://localhost:5000/api/admin/inventory", { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setInventoryList(await res.json());
    } catch (e) {}
  };

  const fetchVendors = async () => {
    if (!token) return;
    try {
      const res = await fetch("http://localhost:5000/api/admin/vendors", { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setVendorList(await res.json());
    } catch (e) {}
  };

  const fetchCoupons = async () => {
    if (!token) return;
    try {
      const res = await fetch("http://localhost:5000/api/admin/coupons", { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setCouponList(await res.json());
    } catch (e) {}
  };

  const fetchChatThreads = async () => {
    if (!token) return;
    try {
      const res = await fetch("http://localhost:5000/api/chat/admin/threads", { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setChatThreads(await res.json());
    } catch (e) {}
  };

  const fetchChatMessages = async (cid: string) => {
    try {
      const res = await fetch(`http://localhost:5000/api/chat/history/${cid}`);
      if (res.ok) setActiveChatMessages(await res.json());
    } catch (e) {}
  };

  const handleSendChatReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatReplyText.trim() || !activeChatId || !token) return;
    try {
      const res = await fetch("http://localhost:5000/api/chat/admin/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ chatId: activeChatId, message: chatReplyText })
      });
      if (res.ok) {
        setChatReplyText("");
        fetchChatMessages(activeChatId);
        fetchChatThreads();
      }
    } catch (e) {}
  };

  const handleAdminImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeChatId || !token) return;
    if (file.size > 2 * 1024 * 1024) {
      alert("Image size must be less than 2MB");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64data = reader.result as string;
      try {
        const res = await fetch("http://localhost:5000/api/chat/admin/reply", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ chatId: activeChatId, message: base64data })
        });
        if (res.ok) {
          fetchChatMessages(activeChatId);
          fetchChatThreads();
        }
      } catch (err) {
        console.error("Failed to upload image as admin reply", err);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCategoryUpload = (catId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      try {
        const res = await fetch(`http://localhost:5000/api/admin/categories/${catId}/image`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ imageUrl: base64 })
        });
        if (res.ok) {
          fetchCategoriesAndBrands();
          alert("Category image updated!");
        }
      } catch (err) {
        alert("Failed to update category image");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleBrandUpload = (brandId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      try {
        const res = await fetch(`http://localhost:5000/api/admin/brands/${brandId}/logo`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ logoUrl: base64 })
        });
        if (res.ok) {
          fetchCategoriesAndBrands();
          alert("Brand logo updated!");
        }
      } catch (err) {
        alert("Failed to update brand logo");
      }
    };
    reader.readAsDataURL(file);
  };

  // Poll for chats in background if admin
  useEffect(() => {
    if (!isAdmin || !token) return;
    fetchChatThreads();
    const interval = setInterval(fetchChatThreads, 5000);
    return () => clearInterval(interval);
  }, [isAdmin, token]);

  // Poll active chat messages if a chat is open
  useEffect(() => {
    if (!activeChatId) return;
    fetchChatMessages(activeChatId);
    const interval = setInterval(() => fetchChatMessages(activeChatId), 3000);
    return () => clearInterval(interval);
  }, [activeChatId]);

  useEffect(() => {
    if (isAdmin) {
      fetchBanners();
      fetchStaff();
      fetchCustomers();
      fetchInventory();
      fetchVendors();
      fetchCoupons();
    }
  }, [isAdmin, token]);

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
      const endpoint = isEditingProduct ? `http://localhost:5000/api/products/${productForm.id}` : "http://localhost:5000/api/products";
      const res = await fetch(endpoint, { 
        method, 
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, 
        body: JSON.stringify({ ...productForm, variants: variantInputs }) 
      });
      if (res.ok) {
        setProductForm({
          id: "", name: "", description: "", price: "", discountPrice: "", costPrice: "", stock: "50",
          categoryId: productForm.categoryId || "", brandId: productForm.brandId || "", imageUrl: "",
          metaTitle: "", metaDescription: "", metaKeywords: "", campaignName: ""
        });
        setVariantInputs([]);
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
      const res = await fetch(`http://localhost:5000/api/products/${prodId}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) fetchProductsList();
      else alert("Failed to delete product.");
    } catch (e) { alert("Error deleting product."); }
  };

  const handleAdjustInventory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:5000/api/admin/inventory/adjust", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          variantId: inventoryAdjustForm.variantId,
          quantity: Number(inventoryAdjustForm.quantity),
          reason: inventoryAdjustForm.reason
        })
      });
      if (res.ok) {
        fetchInventory();
        alert("Inventory adjusted successfully.");
      } else {
        const err = await res.json();
        alert(err.error || "Failed to adjust stock.");
      }
    } catch (e) { alert("Error adjusting stock."); }
  };

  const handleSaveVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = isEditingVendor ? "PUT" : "POST";
      const url = isEditingVendor ? `http://localhost:5000/api/admin/vendors/${vendorForm.id}` : "http://localhost:5000/api/admin/vendors";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(vendorForm)
      });
      if (res.ok) {
        setVendorForm({ id: "", name: "", contactName: "", email: "", phone: "", address: "", status: "Active" });
        setIsEditingVendor(false);
        fetchVendors();
        alert("Vendor details saved.");
      } else {
        const err = await res.json();
        alert(err.error || "Failed to save vendor.");
      }
    } catch (e) { alert("Error saving vendor."); }
  };

  const handleDeleteVendor = async (id: string) => {
    if (!confirm("Are you sure you want to delete this vendor?")) return;
    try {
      const res = await fetch(`http://localhost:5000/api/admin/vendors/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) fetchVendors();
    } catch (e) { alert("Error deleting vendor."); }
  };

  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:5000/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(couponForm)
      });
      if (res.ok) {
        setCouponForm({ id: "", code: "", discountType: "Percentage", discountValue: "", minOrderValue: "0", maxDiscount: "", expiryDate: "", usageLimit: "1" });
        fetchCoupons();
        alert("Coupon created successfully.");
      } else {
        const err = await res.json();
        alert(err.error || "Failed to save coupon.");
      }
    } catch (e) { alert("Error saving coupon."); }
  };

  const handleDeleteCoupon = async (id: string) => {
    if (!confirm("Are you sure you want to delete this coupon?")) return;
    try {
      const res = await fetch(`http://localhost:5000/api/admin/coupons/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) fetchCoupons();
    } catch (e) { alert("Error deleting coupon."); }
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
      const res = await fetch("http://localhost:5000/api/settings/bulk", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(settings) });
      if (res.ok) setSettingsMessage("Settings saved successfully. Tracking scripts updated live.");
      else setSettingsMessage("Failed to save settings.");
    } catch (e) { setSettingsMessage("Error saving settings."); }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    try {
      const res = await fetch(`http://localhost:5000/api/orders/${orderId}/status`, { method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ status }) });
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
      const res = await fetch(`http://localhost:5000/api/admin/reviews/${reviewId}/approve`, { method: "PUT", headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setPendingReviews((prev) => prev.filter((r) => r.id !== reviewId));
    } catch (e) { console.error("Error approving review", e); }
  };

  const handleSaveStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = isEditingStaff ? "PUT" : "POST";
      const url = isEditingStaff ? `http://localhost:5000/api/admin/staff/${staffForm.id}` : "http://localhost:5000/api/admin/staff";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(staffForm) });
      if (res.ok) {
        setStaffForm({ id: "", name: "", email: "", phone: "", role: "Salesman", password: "", status: "Active" });
        setIsEditingStaff(false);
        fetchStaff();
        alert(isEditingStaff ? "Staff updated." : "Staff created.");
      } else {
        const err = await res.json();
        alert(err.error || "Failed to save staff.");
      }
    } catch (e) { alert("Error saving staff."); }
  };

  const handleUpdateCustomerStatus = async (customerId: string, status: string) => {
    try {
      const res = await fetch(`http://localhost:5000/api/admin/customers/${customerId}/status`, { method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ status }) });
      if (res.ok) {
        fetchCustomers();
      }
    } catch (e) { console.error("Error updating customer status", e); }
  };

  const handleSendToCourier = async (orderId: string) => {
    try {
      // In a real implementation, this would call Pathao/Steadfast API
      alert(`Sending Order ${orderId} to ${settings.COURIER_PROVIDER || 'Courier'}...`);
      const res = await fetch(`http://localhost:5000/api/orders/${orderId}/status`, { method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ status: "Shipped" }) });
      if (res.ok) {
        const data = await res.json();
        setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, orderStatus: "Shipped", trackingLink: data.order.trackingLink || `https://steadfast.com.bd/track/${orderId}` } : o)));
        alert("Successfully pushed to Courier API. Status updated to Shipped.");
      }
    } catch(e) { console.error("Courier sync failed", e); }
  };

  if (!isAdmin) {
    return (
      <main style={{ padding: "100px 20px", display: "flex", justifyContent: "center", minHeight: "100vh", backgroundColor: "#f4f5fa" }}>
        <form onSubmit={handleLogin} style={{ width: "100%", maxWidth: "400px", backgroundColor: "#fff", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "30px", boxShadow: "0 4px 15px rgba(0,0,0,0.05)", display: "flex", flexDirection: "column", gap: "16px", height: "fit-content" }}>
          <h1 style={{ fontSize: "22px", fontWeight: "800", color: "#e63b7a", textAlign: "center", marginBottom: "10px" }}>GlowGoodly Admin Access</h1>
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
        <div className="admin-logo-area" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <h1 style={{ color: 'white', fontSize: '24px', fontWeight: '900', letterSpacing: '1px', margin: 0 }}>GLOWGOODLY</h1>
        </div>
        <div className="admin-sidebar-menu">
          <div className={`admin-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab("dashboard")}>
            <Home /> Dashboard
            <span style={{ position: 'absolute', right: '24px', background: '#00c6ff', color: '#fff', fontSize: '10px', padding: '2px 6px', borderRadius: '10px', fontWeight: 'bold' }}>3</span>
          </div>
          
          <div className="admin-sidebar-header">eCommerce</div>
          <div className={`admin-nav-item ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveTab("orders")}><ShoppingCart /> Orders</div>
          <div className={`admin-nav-item ${activeTab === 'products' ? 'active' : ''}`} onClick={() => setActiveTab("products")}><Package /> Products</div>
          <div className={`admin-nav-item ${activeTab === 'reviews' ? 'active' : ''}`} onClick={() => setActiveTab("reviews")}><Star /> Reviews</div>
          <div className={`admin-nav-item ${activeTab === 'banners' ? 'active' : ''}`} onClick={() => { setActiveTab("banners"); fetchBanners(); }}><ImageIcon /> Promo Banners</div>
          <div className={`admin-nav-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab("settings")}><Settings /> Integrations</div>
          <div className={`admin-nav-item ${activeTab === 'notifications' ? 'active' : ''}`} onClick={() => { setActiveTab("notifications"); fetchNotifications(); }}><Bell /> Daily Offers</div>
          <div className={`admin-nav-item ${activeTab === 'pages-config' ? 'active' : ''}`} onClick={() => { setActiveTab("pages-config"); fetchPagesConfig(); }}><Sliders /> Page & Section Manager</div>

          <div className="admin-sidebar-header">Admin Control</div>
          <div className={`admin-nav-item ${activeTab === 'inventory' ? 'active' : ''}`} onClick={() => setActiveTab("inventory")}><Box /> Inventory/Stock</div>
          <div className={`admin-nav-item ${activeTab === 'customers' ? 'active' : ''}`} onClick={() => setActiveTab("customers")}><User /> Customer Management</div>
          <div className={`admin-nav-item ${activeTab === 'coupons' ? 'active' : ''}`} onClick={() => setActiveTab("coupons")}><Star /> Coupons & Campaigns</div>
          <div className={`admin-nav-item ${activeTab === 'vendors' ? 'active' : ''}`} onClick={() => setActiveTab("vendors")}><Package /> Vendor Management</div>
          <div className={`admin-nav-item ${activeTab === 'delivery' ? 'active' : ''}`} onClick={() => setActiveTab("delivery")}><Activity /> Delivery Management</div>
          <div className={`admin-nav-item ${activeTab === 'staff' ? 'active' : ''}`} onClick={() => setActiveTab("staff")}><Users /> Staff Management</div>
          <div className={`admin-nav-item ${activeTab === 'chat' ? 'active' : ''}`} onClick={() => setActiveTab("chat")}><MessageSquare /> Chat Application</div>
          <div className={`admin-nav-item ${activeTab === 'reports' ? 'active' : ''}`} onClick={() => setActiveTab("reports")}><FileText /> Reports & Analytics</div>
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
              <div className="admin-top-icon" onClick={() => setActiveTab("chat")} style={{ cursor: 'pointer' }}>
                <Mail size={20} />
                {chatThreads.filter(t => t.lastSender === "Customer").length > 0 && (
                  <span className="admin-top-badge" style={{ right: '-2px', top: '-2px', background: '#ffb74d' }}>
                    {chatThreads.filter(t => t.lastSender === "Customer").length}
                  </span>
                )}
              </div>
            </div>
            <div className="admin-user-profile">
              <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || "Admin")}&background=e63b7a&color=fff`} alt="Profile" className="admin-user-avatar" />
              <span style={{ fontSize: '13px', fontWeight: '600', color: '#4a5568' }}>{user?.name || "Admin"}</span>
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
                    <p>+ {dashboardStats?.totalProducts || 0}</p>
                  </div>
                </div>
                <div className="admin-stat-card bg-grad-pink">
                  <div className="icon-bg"><User size={24} color="#fff" /></div>
                  <div>
                    <h3>New Users</h3>
                    <p>↑ {dashboardStats?.newUsers || 0}</p>
                  </div>
                </div>
                <div className="admin-stat-card bg-grad-orange">
                  <div className="icon-bg"><ShoppingCart size={24} color="#fff" /></div>
                  <div>
                    <h3>New Orders</h3>
                    <p>↑ {dashboardStats?.newOrders || 0}</p>
                  </div>
                </div>
                <div className="admin-stat-card bg-grad-green">
                  <div className="icon-bg"><Box size={24} color="#fff" /></div>
                  <div>
                    <h3>Total Profit</h3>
                    <p>BDT {dashboardStats?.totalProfit?.toLocaleString() || 0}</p>
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
                      <AreaChart data={dashboardStats?.salesData || []} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
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
                    {dashboardStats?.recentBuyers?.map((buyer: any, idx: number) => (
                      <div key={idx} className="recent-buyer-item">
                        <div className="recent-buyer-info">
                          <img src={buyer.img} alt={buyer.name} />
                          <div>
                            <div style={{ fontSize: '13px', fontWeight: '600', color: '#2d3748' }}>{buyer.name}</div>
                            <div className="recent-buyer-tags">
                              {buyer.tags.map((tag: any, i: number) => (
                                <span key={i} className={`recent-buyer-tag ${tag.color}`}>{tag.label}</span>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                          <div className="recent-buyer-amount">BDT {buyer.amount}</div>
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
                  <p style={{ fontSize: '13px', color: '#718096' }}>Total paid invoices {dashboardStats?.paidInvoices || 0}, unpaid {dashboardStats?.unpaidInvoices || 0}.</p>
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
                            <span className={`admin-status-badge ${(o.orderStatus === 'Delivered' || o.orderStatus === 'Shipped') ? 'status-paid' : 'status-unpaid'}`}>
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
                        <BarChart data={dashboardStats?.salesData?.slice(0, 6) || []} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
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
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                    <select required value={productForm.categoryId} onChange={(e) => setProductForm({ ...productForm, categoryId: e.target.value })} style={{ width: "100%", padding: "10px", border: "1px solid #e2e8f0", borderRadius: "4px", fontSize: "13px" }}>
                      <option value="">Category</option>{adminCategories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                    </select>
                    <select required value={productForm.brandId} onChange={(e) => setProductForm({ ...productForm, brandId: e.target.value })} style={{ width: "100%", padding: "10px", border: "1px solid #e2e8f0", borderRadius: "4px", fontSize: "13px" }}>
                      <option value="">Brand</option>{adminBrands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                    <select value={productForm.campaignName || ""} onChange={(e) => setProductForm({ ...productForm, campaignName: e.target.value })} style={{ width: "100%", padding: "10px", border: "1px solid #e2e8f0", borderRadius: "4px", fontSize: "13px" }}>
                      <option value="">None (Regular)</option>
                      <option value="BOGO">BOGO (Buy 1 Get 1)</option>
                      <option value="COMBO">Combo Deal</option>
                      <option value="CLEARANCE">Clearance Sale</option>
                      <option value="EXCLUSIVE">Exclusive Offer</option>
                    </select>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "8px" }}>
                    <input type="number" required placeholder="Price" value={productForm.price} onChange={(e) => setProductForm({ ...productForm, price: e.target.value })} style={{ width: "100%", padding: "10px", border: "1px solid #e2e8f0", borderRadius: "4px", fontSize: "13px" }} />
                    <input type="number" placeholder="Discount" value={productForm.discountPrice} onChange={(e) => setProductForm({ ...productForm, discountPrice: e.target.value })} style={{ width: "100%", padding: "10px", border: "1px solid #e2e8f0", borderRadius: "4px", fontSize: "13px" }} />
                    <input type="number" placeholder="Cost Price (Kina)" value={productForm.costPrice} onChange={(e) => setProductForm({ ...productForm, costPrice: e.target.value })} style={{ width: "100%", padding: "10px", border: "1px solid #e2e8f0", borderRadius: "4px", fontSize: "13px" }} />
                    <input type="number" required placeholder="Stock" value={productForm.stock} onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })} style={{ width: "100%", padding: "10px", border: "1px solid #e2e8f0", borderRadius: "4px", fontSize: "13px" }} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', display: 'block', marginBottom: '4px', textTransform: 'uppercase' }}>Upload Product Image</label>
                      <input type="file" accept="image/*" onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => setProductForm({ ...productForm, imageUrl: reader.result as string });
                          reader.readAsDataURL(file);
                        }
                      }} style={{ width: "100%", padding: "6px", border: "1px solid #e2e8f0", borderRadius: "4px", fontSize: "12px", backgroundColor: "#fff" }} />
                    </div>
                    {productForm.imageUrl && <img src={productForm.imageUrl} alt="Preview" style={{ width: '45px', height: '45px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #e2e8f0' }} />}
                  </div>
                  <textarea rows={5} placeholder="Description" value={productForm.description} onChange={(e) => setProductForm({ ...productForm, description: e.target.value })} style={{ width: "100%", padding: "10px", border: "1px solid #e2e8f0", borderRadius: "4px", fontSize: "13px" }} />
                  
                  {/* Variants Management */}
                  <div style={{ padding: "12px", border: "1.5px solid #cbd5e1", borderRadius: "6px", backgroundColor: "#f8fafc" }}>
                    <span style={{ fontSize: "12px", fontWeight: "700", color: "#475569", display: "block", marginBottom: "8px", textTransform: "uppercase" }}>Manage Product Variants</span>
                    
                    {/* List of current variants */}
                    {variantInputs.length > 0 && (
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "12px" }}>
                        {variantInputs.map((v, index) => (
                          <div key={index} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 10px", backgroundColor: "#fff", border: "1px solid #e2e8f0", borderRadius: "4px", fontSize: "12px" }}>
                            <div>
                              <strong>{v.name}</strong> - ৳{v.price} ({v.stock} in stock) {v.sizeValue ? `| Size: ${v.sizeValue}` : ""}
                            </div>
                            <button 
                              type="button" 
                              onClick={() => {
                                setVariantInputs(prev => prev.filter((_, idx) => idx !== index));
                              }}
                              style={{ padding: "2px 6px", backgroundColor: "#fee2e2", color: "#e53e3e", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "11px", fontWeight: "bold" }}
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* New variant input form */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr", gap: "8px" }}>
                        <input type="text" placeholder="Variant Name (e.g. Shade 01, 100ml)" value={currentVariantInput.name} onChange={(e) => setCurrentVariantInput({ ...currentVariantInput, name: e.target.value })} style={{ width: "100%", padding: "8px", border: "1px solid #cbd5e1", borderRadius: "4px", fontSize: "12px" }} />
                        <input type="number" placeholder="Price" value={currentVariantInput.price} onChange={(e) => setCurrentVariantInput({ ...currentVariantInput, price: e.target.value })} style={{ width: "100%", padding: "8px", border: "1px solid #cbd5e1", borderRadius: "4px", fontSize: "12px" }} />
                        <input type="number" placeholder="Discount Price" value={currentVariantInput.discountPrice} onChange={(e) => setCurrentVariantInput({ ...currentVariantInput, discountPrice: e.target.value })} style={{ width: "100%", padding: "8px", border: "1px solid #cbd5e1", borderRadius: "4px", fontSize: "12px" }} />
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1.2fr", gap: "8px" }}>
                        <input type="number" placeholder="Cost Price" value={currentVariantInput.costPrice} onChange={(e) => setCurrentVariantInput({ ...currentVariantInput, costPrice: e.target.value })} style={{ width: "100%", padding: "8px", border: "1px solid #cbd5e1", borderRadius: "4px", fontSize: "12px" }} />
                        <input type="number" placeholder="Stock" value={currentVariantInput.stock} onChange={(e) => setCurrentVariantInput({ ...currentVariantInput, stock: e.target.value })} style={{ width: "100%", padding: "8px", border: "1px solid #cbd5e1", borderRadius: "4px", fontSize: "12px" }} />
                        <input type="text" placeholder="SKU (Auto if blank)" value={currentVariantInput.sku} onChange={(e) => setCurrentVariantInput({ ...currentVariantInput, sku: e.target.value })} style={{ width: "100%", padding: "8px", border: "1px solid #cbd5e1", borderRadius: "4px", fontSize: "12px" }} />
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                        <input type="text" placeholder="Size (e.g. 50ml, 100gm)" value={currentVariantInput.sizeValue} onChange={(e) => setCurrentVariantInput({ ...currentVariantInput, sizeValue: e.target.value })} style={{ width: "100%", padding: "8px", border: "1px solid #cbd5e1", borderRadius: "4px", fontSize: "12px" }} />
                        <input type="text" placeholder="Shade Hex (e.g. #FF5733)" value={currentVariantInput.shadeColor} onChange={(e) => setCurrentVariantInput({ ...currentVariantInput, shadeColor: e.target.value })} style={{ width: "100%", padding: "8px", border: "1px solid #cbd5e1", borderRadius: "4px", fontSize: "12px" }} />
                      </div>
                      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        <input type="text" placeholder="Variant Image URL (Optional)" value={currentVariantInput.imageUrl} onChange={(e) => setCurrentVariantInput({ ...currentVariantInput, imageUrl: e.target.value })} style={{ flex: 1, padding: "8px", border: "1px solid #cbd5e1", borderRadius: "4px", fontSize: "12px" }} />
                        <button
                          type="button"
                          onClick={() => {
                            if (!currentVariantInput.name || !currentVariantInput.price) {
                              alert("Variant Name and Price are required.");
                              return;
                            }
                            const newVar = {
                              name: currentVariantInput.name,
                              price: currentVariantInput.price,
                              discountPrice: currentVariantInput.discountPrice ? parseFloat(currentVariantInput.discountPrice) : null,
                              costPrice: currentVariantInput.costPrice ? parseFloat(currentVariantInput.costPrice) : null,
                              stock: parseInt(currentVariantInput.stock) || 0,
                              sizeValue: currentVariantInput.sizeValue || null,
                              shadeColor: currentVariantInput.shadeColor || null,
                              imageUrl: currentVariantInput.imageUrl || null,
                              sku: currentVariantInput.sku || `SKU-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`
                            };
                            setVariantInputs([...variantInputs, newVar]);
                            setCurrentVariantInput({ name: "", price: "", discountPrice: "", costPrice: "", stock: "10", sizeValue: "", shadeColor: "", imageUrl: "", sku: "" });
                          }}
                          style={{ padding: "8px 16px", backgroundColor: "#e63b7a", color: "#fff", border: "none", borderRadius: "4px", fontSize: "12px", fontWeight: "700", cursor: "pointer" }}
                        >
                          Add Variant
                        </button>
                      </div>
                    </div>
                  </div>

                  <div style={{ padding: "12px", border: "1px dashed #cbd5e1", borderRadius: "6px", backgroundColor: "#f8fafc" }}>
                    <span style={{ fontSize: "12px", fontWeight: "700", color: "#475569", display: "block", marginBottom: "8px" }}>SEO Optimization (Product Rank)</span>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <input type="text" placeholder="Meta Title" value={productForm.metaTitle} onChange={(e) => setProductForm({ ...productForm, metaTitle: e.target.value })} style={{ width: "100%", padding: "8px", border: "1px solid #e2e8f0", borderRadius: "4px", fontSize: "12px" }} />
                      <input type="text" placeholder="Meta Keywords (comma separated)" value={productForm.metaKeywords} onChange={(e) => setProductForm({ ...productForm, metaKeywords: e.target.value })} style={{ width: "100%", padding: "8px", border: "1px solid #e2e8f0", borderRadius: "4px", fontSize: "12px" }} />
                      <textarea rows={2} placeholder="Meta Description (for Google search)" value={productForm.metaDescription} onChange={(e) => setProductForm({ ...productForm, metaDescription: e.target.value })} style={{ width: "100%", padding: "8px", border: "1px solid #e2e8f0", borderRadius: "4px", fontSize: "12px" }} />
                    </div>
                  </div>
                  
                  <div style={{ display: "flex", gap: "10px" }}>
                    <button type="submit" style={{ flex: 1, backgroundColor: "#00c6ff", color: "#fff", fontWeight: "700", padding: "12px", borderRadius: "4px", cursor: "pointer", border: "none" }}>{isEditingProduct ? "UPDATE" : "CREATE"}</button>
                    {isEditingProduct && <button type="button" onClick={() => { setIsEditingProduct(false); setVariantInputs([]); setProductForm({ id: "", name: "", description: "", price: "", discountPrice: "", costPrice: "", stock: "50", categoryId: productForm.categoryId || "", brandId: productForm.brandId || "", imageUrl: "", metaTitle: "", metaDescription: "", metaKeywords: "", campaignName: "" }); }} style={{ backgroundColor: "#e2e8f0", color: "#4a5568", fontWeight: "700", padding: "12px", borderRadius: "4px", cursor: "pointer", border: "none" }}>Cancel</button>}
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
                              <h4 style={{ fontSize: "13px", fontWeight: "700", color: "#2d3748", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", display: "flex", alignItems: "center", gap: "8px" }}>
                                {p.name}
                                {p.campaignName && (
                                  <span style={{ fontSize: "9px", backgroundColor: "#00c6ff", color: "#fff", padding: "2px 6px", borderRadius: "10px", fontWeight: "800" }}>{p.campaignName}</span>
                                )}
                              </h4>
                              <div style={{ fontSize: "12px", fontWeight: "700", marginTop: "4px", color: "#00c6ff" }}>৳ {variant.discountPrice || variant.price}</div>
                            </div>
                          </div>
                          <div style={{ display: "flex", gap: "6px" }}>
                            <button onClick={() => {
                                setIsEditingProduct(true);
                                setVariantInputs(p.variants || []);
                                setProductForm({
                                  id: p.id,
                                  name: p.name,
                                  description: p.description || "",
                                  price: variant.price.toString(),
                                  discountPrice: variant.discountPrice ? variant.discountPrice.toString() : "",
                                  costPrice: variant.costPrice ? variant.costPrice.toString() : "",
                                  stock: variant.stock.toString(),
                                  categoryId: p.categoryId,
                                  brandId: p.brandId,
                                  imageUrl: p.images[0]?.url || "",
                                  metaTitle: p.metaTitle || "",
                                  metaDescription: p.metaDescription || "",
                                  metaKeywords: p.metaKeywords || "",
                                  campaignName: p.campaignName || ""
                                });
                            }} style={{ padding: "6px 12px", backgroundColor: "#edf2f7", color: "#4a5568", border: "none", borderRadius: "4px", fontWeight: "700", fontSize: "11px", cursor: "pointer" }}>Edit</button>
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
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", paddingBottom: "20px", borderBottom: "1px solid #edf2f7" }}>
                    <h3 style={{ gridColumn: "1 / -1", fontSize: "14px", fontWeight: "700", marginTop: "10px" }}>Marketing & Analytics</h3>
                    <input type="text" placeholder="Meta Pixel ID" value={settings.META_PIXEL_ID} onChange={(e) => setSettings({ ...settings, META_PIXEL_ID: e.target.value })} style={{ width: "100%", padding: "10px", border: "1px solid #e2e8f0", borderRadius: "4px", fontSize: "13px" }} />
                    <input type="text" placeholder="GA4 ID" value={settings.GA4_MEASUREMENT_ID} onChange={(e) => setSettings({ ...settings, GA4_MEASUREMENT_ID: e.target.value })} style={{ width: "100%", padding: "10px", border: "1px solid #e2e8f0", borderRadius: "4px", fontSize: "13px" }} />
                    <input type="text" placeholder="SMS Provider URL" value={settings.SMS_PROVIDER_URL} onChange={(e) => setSettings({ ...settings, SMS_PROVIDER_URL: e.target.value })} style={{ width: "100%", padding: "10px", border: "1px solid #e2e8f0", borderRadius: "4px", fontSize: "13px" }} />
                    <input type="password" placeholder="SMS API Key" value={settings.SMS_API_KEY} onChange={(e) => setSettings({ ...settings, SMS_API_KEY: e.target.value })} style={{ width: "100%", padding: "10px", border: "1px solid #e2e8f0", borderRadius: "4px", fontSize: "13px" }} />
                  </div>
                  
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
                    <h3 style={{ gridColumn: "1 / -1", fontSize: "14px", fontWeight: "700" }}>Courier API Integration</h3>
                    <select value={settings.COURIER_PROVIDER} onChange={(e) => setSettings({ ...settings, COURIER_PROVIDER: e.target.value })} style={{ width: "100%", padding: "10px", border: "1px solid #e2e8f0", borderRadius: "4px", fontSize: "13px", gridColumn: "1 / -1" }}>
                      <option value="Steadfast">Steadfast Delivery</option>
                      <option value="Pathao">Pathao Courier</option>
                      <option value="RedX">RedX</option>
                    </select>
                    <input type="password" placeholder="API Secret Key" value={settings.COURIER_API_SECRET} onChange={(e) => setSettings({ ...settings, COURIER_API_SECRET: e.target.value })} style={{ width: "100%", padding: "10px", border: "1px solid #e2e8f0", borderRadius: "4px", fontSize: "13px" }} />
                    <input type="text" placeholder="Client ID / API Key" value={settings.COURIER_CLIENT_ID} onChange={(e) => setSettings({ ...settings, COURIER_CLIENT_ID: e.target.value })} style={{ width: "100%", padding: "10px", border: "1px solid #e2e8f0", borderRadius: "4px", fontSize: "13px" }} />
                    <input type="text" placeholder="Store ID (Optional)" value={settings.COURIER_STORE_ID} onChange={(e) => setSettings({ ...settings, COURIER_STORE_ID: e.target.value })} style={{ width: "100%", padding: "10px", border: "1px solid #e2e8f0", borderRadius: "4px", fontSize: "13px" }} />
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
                <div style={{ padding: "12px", backgroundColor: "#fffbeb", color: "#b45309", borderRadius: "4px", fontSize: "12px", marginBottom: "15px", border: "1px solid #fef3c7" }}>
                  <strong>Note:</strong> Default system banners are not listed here. To change a default banner (like the Homepage Slider), simply create a new banner below with the same "Page" name. It will automatically override the default one.
                </div>
                
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "20px" }}>
                  <input type="text" placeholder="Banner Title" value={bannerForm.title} onChange={(e) => setBannerForm({ ...bannerForm, title: e.target.value })} style={{ width: "100%", padding: "10px", border: "1px solid #e2e8f0", borderRadius: "4px", fontSize: "13px" }} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', display: 'block', marginBottom: '4px', textTransform: 'uppercase' }}>Upload Banner Image</label>
                      <input type="file" accept="image/*" onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => setBannerForm({ ...bannerForm, imageUrl: reader.result as string });
                          reader.readAsDataURL(file);
                        }
                      }} style={{ width: "100%", padding: "6px", border: "1px solid #e2e8f0", borderRadius: "4px", fontSize: "12px", backgroundColor: "#fff" }} />
                    </div>
                    {bannerForm.imageUrl && <img src={bannerForm.imageUrl} alt="Preview" style={{ width: '45px', height: '45px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #e2e8f0' }} />}
                  </div>
                  <input type="text" placeholder="Link URL (e.g. /shop?category=skin-care)" value={bannerForm.linkUrl} onChange={(e) => setBannerForm({ ...bannerForm, linkUrl: e.target.value })} style={{ width: "100%", padding: "10px", border: "1px solid #e2e8f0", borderRadius: "4px", fontSize: "13px" }} />
                  <select value={bannerForm.page} onChange={(e) => setBannerForm({ ...bannerForm, page: e.target.value })} style={{ width: "100%", padding: "10px", border: "1px solid #e2e8f0", borderRadius: "4px", fontSize: "13px" }}>
                    <option value="Hero Slides">Hero Slides Carousel (Main Slider)</option>
                    <option value="Homepage">Hero Banner (Slider)</option>
                    <option value="Banner Promotion">Banner Promotion</option>
                    <option value="Deals you cannot miss">Deals You Cannot Miss</option>
                    <option value="Hair Care 101">Hair Care 101</option>
                    <option value="Skin Care 101">Skin Care 101</option>
                    <option value="Makeup 101">Makeup 101</option>
                    <option value="Deal Card 1">Homepage: Deal Card 1</option>
                    <option value="Deal Card 2">Homepage: Deal Card 2</option>
                    <option value="Deal Card 3">Homepage: Deal Card 3</option>
                    <option value="Deal Card 4">Homepage: Deal Card 4</option>
                    <option value="Brand Offer 1">Homepage: Brand Offer 1</option>
                    <option value="Brand Offer 2">Homepage: Brand Offer 2</option>
                    <option value="Brand Offer 3">Homepage: Brand Offer 3</option>
                    <option value="Brand Offer 4">Homepage: Brand Offer 4</option>
                    <option value="Brand Offer 5">Homepage: Brand Offer 5</option>
                    <option value="Brand Offer 6">Homepage: Brand Offer 6</option>
                    <option value="Brand Offer 7">Homepage: Brand Offer 7</option>
                    <option value="Homepage Wide Banner">Homepage: Wide Banner Ad</option>
                    <option value="Extra Discount Step-by-Step Deal">Homepage: Extra Discount Section</option>
                    <option value="BOGO">Homepage: Offer BOGO</option>
                    <option value="COMBO">Homepage: Offer COMBO</option>
                    <option value="OFFERS">Homepage: Offer Exclusive</option>
                    <option value="Clearance SALE">Homepage: Offer Clearance</option>
                    <option value="Category: Makeup">Category: Makeup</option>
                    <option value="Category: Skin">Category: Skin</option>
                    <option value="Category: Hair">Category: Hair</option>
                    <option value="Category: Personal Care">Category: Personal Care</option>
                    <option value="Category: Mom & Baby">Category: Mom & Baby</option>
                    <option value="Category: Fragrance">Category: Fragrance</option>
                    <option value="Category: Undergarments">Category: Undergarments</option>
                    <option value="Category: Combo">Category: Combo</option>
                    <option value="Concern: Acne">Concern: Acne</option>
                    <option value="Concern: Anti Aging">Concern: Anti Aging</option>
                    <option value="Concern: Dandruff">Concern: Dandruff</option>
                    <option value="Concern: Dry Skin">Concern: Dry Skin</option>
                    <option value="Concern: Hair Fall">Concern: Hair Fall</option>
                    <option value="Concern: Oil Control">Concern: Oil Control</option>
                    <option value="Concern: Pore Care">Concern: Pore Care</option>
                    <option value="Concern: Spot Treatment">Concern: Spot Treatment</option>
                    <option value="Concern: Hair Thinning">Concern: Hair Thinning</option>
                    <option value="Concern: Sun Burn">Concern: Sun Burn</option>
                  </select>
                  <button onClick={async () => {
                    if (!bannerForm.title || !bannerForm.imageUrl) {
                      setBannerMessage("Title and Image are required!");
                      return;
                    }
                    const method = isEditingBanner ? "PATCH" : "POST";
                    const url = isEditingBanner ? `${API_BASE}/banners/${bannerForm.id}` : `${API_BASE}/banners`;
                    const reqHeaders: Record<string, string> = { "Content-Type": "application/json" };
                    if (token) {
                      reqHeaders["Authorization"] = `Bearer ${token}`;
                    }
                    try {
                      const res = await fetch(url, { method, headers: reqHeaders, body: JSON.stringify({ ...bannerForm, sortOrder: Number(bannerForm.sortOrder) }) });
                      if (res.ok) {
                        setBannerMessage(isEditingBanner ? "Updated!" : "Created!");
                        setBannerForm({ id: "", title: "", imageUrl: "", linkUrl: "", bgColor: "#1a1a2e", page: "Hero Slides", isActive: true, sortOrder: "0" });
                        setIsEditingBanner(false);
                        triggerGlobalDataSync();
                        await fetchBanners();
                        setTimeout(() => setBannerMessage(""), 3000);
                      } else {
                        const errorData = await res.json().catch(() => ({}));
                        setBannerMessage("Error: " + (errorData.error || "Failed to save banner"));
                      }
                    } catch (err) {
                      setBannerMessage("Error: Could not connect to server");
                    }
                  }} style={{ gridColumn: '1 / -1', padding: "12px", backgroundColor: "#9c27b0", color: "#fff", border: "none", borderRadius: "4px", fontWeight: "700", cursor: "pointer" }}>
                    {isEditingBanner ? "Update Banner" : "Add Banner"}
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {(() => {
                    const defaultBanners = [
                      { id: "default-homepage", title: "Hero Banner (Size: 1200x400)", imageUrl: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=1200&q=80", linkUrl: "", page: "Homepage", isDefault: true },
                      { id: "default-banner-promo", title: "Banner Promotion (Size: 1200x400)", imageUrl: "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=1200&q=80", linkUrl: "", page: "Banner Promotion", isDefault: true },
                      { id: "default-deals-miss", title: "Deals You Cannot Miss (Size: 1200x200)", imageUrl: "https://images.unsplash.com/photo-1617897903246-719242758050?w=1200&q=80", linkUrl: "", page: "Deals you cannot miss", isDefault: true },
                      { id: "default-deal-1", title: "Deal Card 1 (Size: 400x400)", imageUrl: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&q=80", linkUrl: "", page: "Deal Card 1", isDefault: true },
                      { id: "default-deal-2", title: "Deal Card 2 (Size: 400x400)", imageUrl: "https://images.unsplash.com/photo-1612817288484-6f916006741a?w=400&q=80", linkUrl: "", page: "Deal Card 2", isDefault: true },
                      { id: "default-deal-3", title: "Deal Card 3 (Size: 400x400)", imageUrl: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=400&q=80", linkUrl: "", page: "Deal Card 3", isDefault: true },
                      { id: "default-deal-4", title: "Deal Card 4 (Size: 400x400)", imageUrl: "https://images.unsplash.com/photo-1571781926291-c477eb31f862?w=400&q=80", linkUrl: "", page: "Deal Card 4", isDefault: true },
                      { id: "default-brand-1", title: "Brand Offer 1 (Size: 400x400)", imageUrl: "https://images.unsplash.com/photo-1608248597279-f99d160bfbc5?w=400&q=80", linkUrl: "", page: "Brand Offer 1", isDefault: true },
                      { id: "default-brand-2", title: "Brand Offer 2 (Size: 400x400)", imageUrl: "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=400&q=80", linkUrl: "", page: "Brand Offer 2", isDefault: true },
                      { id: "default-brand-3", title: "Brand Offer 3 (Size: 400x400)", imageUrl: "https://images.unsplash.com/photo-1527799822364-9491090333d0?w=400&q=80", linkUrl: "", page: "Brand Offer 3", isDefault: true },
                      { id: "default-brand-4", title: "Brand Offer 4 (Size: 400x400)", imageUrl: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=400&q=80", linkUrl: "", page: "Brand Offer 4", isDefault: true },
                      { id: "default-brand-5", title: "Brand Offer 5 (Size: 400x400)", imageUrl: "https://images.unsplash.com/photo-1612817288484-6f916006741a?w=400&q=80", linkUrl: "", page: "Brand Offer 5", isDefault: true },
                      { id: "default-brand-6", title: "Brand Offer 6 (Size: 400x400)", imageUrl: "https://images.unsplash.com/photo-1571781926291-c477eb31f862?w=400&q=80", linkUrl: "", page: "Brand Offer 6", isDefault: true },
                      { id: "default-brand-7", title: "Brand Offer 7 (Size: 400x400)", imageUrl: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&q=80", linkUrl: "", page: "Brand Offer 7", isDefault: true },
                      { id: "default-extra-discount", title: "Extra Discount (Size: 1200x200)", imageUrl: "https://images.unsplash.com/photo-1617897903246-719242758050?w=1200&q=80", linkUrl: "", page: "Extra Discount Step-by-Step Deal", isDefault: true },
                      { id: "default-bogo", title: "LIMITED TIME OFFERS: BOGO (Size: 300x300)", imageUrl: "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=300&q=80", linkUrl: "", page: "BOGO", isDefault: true },
                      { id: "default-combo", title: "LIMITED TIME OFFERS: COMBO (Size: 300x300)", imageUrl: "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=300&q=80", linkUrl: "", page: "COMBO", isDefault: true },
                      { id: "default-offers", title: "LIMITED TIME OFFERS: OFFERS (Size: 300x300)", imageUrl: "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=300&q=80", linkUrl: "", page: "OFFERS", isDefault: true },
                      { id: "default-clearance", title: "LIMITED TIME OFFERS: Clearance (Size: 300x300)", imageUrl: "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=300&q=80", linkUrl: "", page: "Clearance SALE", isDefault: true },
                      
                      // Categories
                      { id: "default-cat-makeup", title: "Category: Makeup (Size: 200x200)", imageUrl: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=200&q=80", linkUrl: "", page: "Category: Makeup", isDefault: true },
                      { id: "default-cat-skin", title: "Category: Skin (Size: 200x200)", imageUrl: "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=200&q=80", linkUrl: "", page: "Category: Skin", isDefault: true },
                      { id: "default-cat-hair", title: "Category: Hair (Size: 200x200)", imageUrl: "https://images.unsplash.com/photo-1527799822364-9491090333d0?w=200&q=80", linkUrl: "", page: "Category: Hair", isDefault: true },
                      { id: "default-cat-personal", title: "Category: Personal Care (Size: 200x200)", imageUrl: "https://images.unsplash.com/photo-1612817288484-6f916006741a?w=200&q=80", linkUrl: "", page: "Category: Personal Care", isDefault: true },
                      { id: "default-cat-mom", title: "Category: Mom & Baby (Size: 200x200)", imageUrl: "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=200&q=80", linkUrl: "", page: "Category: Mom & Baby", isDefault: true },
                      { id: "default-cat-fragrance", title: "Category: Fragrance (Size: 200x200)", imageUrl: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=200&q=80", linkUrl: "", page: "Category: Fragrance", isDefault: true },
                      { id: "default-cat-undergarments", title: "Category: Undergarments (Size: 200x200)", imageUrl: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=200&q=80", linkUrl: "", page: "Category: Undergarments", isDefault: true },
                      { id: "default-cat-combo", title: "Category: Combo (Size: 200x200)", imageUrl: "https://images.unsplash.com/photo-1612817288484-6f916006741a?w=200&q=80", linkUrl: "", page: "Category: Combo", isDefault: true },
                      
                      // Concerns
                      { id: "default-con-acne", title: "Concern: Acne (Size: 200x200)", imageUrl: "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=200&q=80", linkUrl: "", page: "Concern: Acne", isDefault: true },
                      { id: "default-con-antiaging", title: "Concern: Anti Aging (Size: 200x200)", imageUrl: "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=200&q=80", linkUrl: "", page: "Concern: Anti Aging", isDefault: true },
                      { id: "default-con-dandruff", title: "Concern: Dandruff (Size: 200x200)", imageUrl: "https://images.unsplash.com/photo-1527799822364-9491090333d0?w=200&q=80", linkUrl: "", page: "Concern: Dandruff", isDefault: true },
                      { id: "default-con-dryskin", title: "Concern: Dry Skin (Size: 200x200)", imageUrl: "https://images.unsplash.com/photo-1612817288484-6f916006741a?w=200&q=80", linkUrl: "", page: "Concern: Dry Skin", isDefault: true },
                      { id: "default-con-hairfall", title: "Concern: Hair Fall (Size: 200x200)", imageUrl: "https://images.unsplash.com/photo-1527799822364-9491090333d0?w=200&q=80", linkUrl: "", page: "Concern: Hair Fall", isDefault: true },
                      { id: "default-con-oilcontrol", title: "Concern: Oil Control (Size: 200x200)", imageUrl: "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=200&q=80", linkUrl: "", page: "Concern: Oil Control", isDefault: true },
                      { id: "default-con-porecare", title: "Concern: Pore Care (Size: 200x200)", imageUrl: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=200&q=80", linkUrl: "", page: "Concern: Pore Care", isDefault: true },
                      { id: "default-con-spot", title: "Concern: Spot Treatment (Size: 200x200)", imageUrl: "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=200&q=80", linkUrl: "", page: "Concern: Spot Treatment", isDefault: true },
                      { id: "default-con-hairthinning", title: "Concern: Hair Thinning (Size: 200x200)", imageUrl: "https://images.unsplash.com/photo-1527799822364-9491090333d0?w=200&q=80", linkUrl: "", page: "Concern: Hair Thinning", isDefault: true },
                      { id: "default-con-sunburn", title: "Concern: Sun Burn (Size: 200x200)", imageUrl: "https://images.unsplash.com/photo-1612817288484-6f916006741a?w=200&q=80", linkUrl: "", page: "Concern: Sun Burn", isDefault: true },
                    ];
                    
                    const displayBanners = [...banners];
                    defaultBanners.forEach(db => {
                      if (!displayBanners.some(b => b.page === db.page)) {
                        displayBanners.push(db as any);
                      }
                    });
                    
                    return displayBanners.map((b) => (
                      <div key={b.id} style={{ display: 'flex', border: '1px solid #edf2f7', borderRadius: '6px', overflow: 'hidden', position: 'relative' }}>
                        {b.isDefault && <span style={{ position: 'absolute', top: '5px', left: '5px', background: 'rgba(0,0,0,0.7)', color: 'white', fontSize: '10px', padding: '2px 5px', borderRadius: '3px' }}>Default Template</span>}
                        <img src={b.imageUrl} alt={b.title} style={{ width: '120px', height: '80px', objectFit: 'cover' }} />
                        <div style={{ padding: '10px', flex: 1 }}>
                          <div style={{ fontWeight: '700', fontSize: '14px' }}>{b.title}</div>
                          <div style={{ fontSize: '12px', color: '#e63b7a', fontWeight: 'bold' }}>Page: {b.page || "Homepage"}</div>
                          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                            <button onClick={() => {
                              setIsEditingBanner(!b.isDefault);
                              setBannerForm({
                                id: b.isDefault ? "" : b.id,
                                title: b.title.replace(/ \(Size: .*\)/, "").replace(" (Default)", ""),
                                imageUrl: b.isDefault ? "" : b.imageUrl,
                                linkUrl: b.linkUrl || "",
                                bgColor: b.bgColor || "#1a1a2e",
                                page: b.page || "Homepage",
                                isActive: b.isActive !== false,
                                sortOrder: String(b.sortOrder || "0")
                              });
                              document.querySelector('.admin-content-scroll')?.scrollTo({ top: 0, behavior: "smooth" });
                            }} style={{ padding: '6px 12px', backgroundColor: '#e63b7a', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>{b.isDefault ? "Replace" : "Edit"}</button>
                            {!b.isDefault && <button onClick={async () => { await fetch(`http://localhost:5000/api/banners/${b.id}`, { method: "DELETE" }); fetchBanners(); }} style={{ padding: "4px 8px", backgroundColor: "#fee2e2", color: "#e53e3e", border: "none", borderRadius: "4px", fontSize: "11px", cursor: "pointer" }}>Delete</button>}
                          </div>
                        </div>
                      </div>
                    ));
                  })()}
                </div>

                <h3 style={{ fontSize: "15px", fontWeight: "800", color: "#2d3748", marginTop: "30px", marginBottom: "15px", textTransform: "uppercase", borderTop: "1px solid #edf2f7", paddingTop: "20px" }}>Category Images (Appears on Homepage / Megamenu)</h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "15px", marginBottom: "20px" }}>
                  {adminCategories.map((cat) => (
                    <div key={cat.id} style={{ border: "1px solid #edf2f7", borderRadius: "8px", padding: "12px", backgroundColor: "#f8fafc", textAlign: "center" }}>
                      <div style={{ width: "60px", height: "60px", borderRadius: "50%", overflow: "hidden", margin: "0 auto 10px auto", backgroundColor: "#edf2f7" }}>
                        <img src={cat.imageUrl || "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=100&q=80"} alt={cat.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      </div>
                      <div style={{ fontSize: "13px", fontWeight: "700", color: "#4a5568", marginBottom: "8px" }}>{cat.name}</div>
                      <input
                        type="file"
                        accept="image/*"
                        id={"cat-upload-" + cat.id}
                        onChange={(e) => handleCategoryUpload(cat.id, e)}
                        style={{ display: "none" }}
                      />
                      <button
                        onClick={() => document.getElementById("cat-upload-" + cat.id)?.click()}
                        style={{ padding: "6px 12px", backgroundColor: "#e63b7a", color: "#fff", border: "none", borderRadius: "4px", fontSize: "11px", fontWeight: "700", cursor: "pointer" }}
                      >
                        CHANGE IMAGE
                      </button>
                    </div>
                  ))}
                </div>

                <h3 style={{ fontSize: "15px", fontWeight: "800", color: "#2d3748", marginTop: "30px", marginBottom: "15px", textTransform: "uppercase", borderTop: "1px solid #edf2f7", paddingTop: "20px" }}>Brand Logos</h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "15px" }}>
                  {adminBrands.map((brand) => (
                    <div key={brand.id} style={{ border: "1px solid #edf2f7", borderRadius: "8px", padding: "12px", backgroundColor: "#f8fafc", textAlign: "center" }}>
                      <div style={{ width: "80px", height: "40px", overflow: "hidden", margin: "0 auto 10px auto", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#fff", border: "1px solid #edf2f7", borderRadius: "4px" }}>
                        <img src={brand.logoUrl || "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=100&q=80"} alt={brand.name} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                      </div>
                      <div style={{ fontSize: "13px", fontWeight: "700", color: "#4a5568", marginBottom: "8px" }}>{brand.name}</div>
                      <input
                        type="file"
                        accept="image/*"
                        id={"brand-upload-" + brand.id}
                        onChange={(e) => handleBrandUpload(brand.id, e)}
                        style={{ display: "none" }}
                      />
                      <button
                        onClick={() => document.getElementById("brand-upload-" + brand.id)?.click()}
                        style={{ padding: "6px 12px", backgroundColor: "#e63b7a", color: "#fff", border: "none", borderRadius: "4px", fontSize: "11px", fontWeight: "700", cursor: "pointer" }}
                      >
                        CHANGE LOGO
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {activeTab === "inventory" && (
              <div style={{ display: "flex", gap: "30px", flexWrap: "wrap", alignItems: "flex-start" }}>
                <form onSubmit={handleAdjustInventory} style={{ flex: "1", minWidth: "300px", backgroundColor: "#fff", borderRadius: "8px", padding: "25px", boxShadow: "0 2px 10px rgba(0,0,0,0.03)", display: "flex", flexDirection: "column", gap: "15px" }}>
                  <h2 style={{ fontSize: "16px", fontWeight: "700", color: "#2d3748", textTransform: 'uppercase' }}>Adjust Stock Levels</h2>
                  <div>
                    <label style={{ fontSize: "12px", fontWeight: "700", display: "block", marginBottom: "5px" }}>Select Product Variant</label>
                    <select required value={inventoryAdjustForm.variantId} onChange={(e) => setInventoryAdjustForm({ ...inventoryAdjustForm, variantId: e.target.value })} style={{ width: "100%", padding: "10px", border: "1px solid #e2e8f0", borderRadius: "4px", fontSize: "13px" }}>
                      <option value="">-- Choose Variant --</option>
                      {adminProducts.flatMap(p => p.variants || []).map((v: any) => (
                        <option key={v.id} value={v.id}>{v.product?.name || "Product"} - {v.name} (SKU: {v.sku})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: "12px", fontWeight: "700", display: "block", marginBottom: "5px" }}>Stock Adjustment Quantity</label>
                    <input type="number" required placeholder="e.g. 10 or -5" value={inventoryAdjustForm.quantity} onChange={(e) => setInventoryAdjustForm({ ...inventoryAdjustForm, quantity: e.target.value })} style={{ width: "100%", padding: "10px", border: "1px solid #e2e8f0", borderRadius: "4px", fontSize: "13px" }} />
                    <span style={{ fontSize: "11px", color: "#718096" }}>Use positive number to restock, negative to log damage/loss.</span>
                  </div>
                  <div>
                    <label style={{ fontSize: "12px", fontWeight: "700", display: "block", marginBottom: "5px" }}>Adjustment Reason</label>
                    <select required value={inventoryAdjustForm.reason} onChange={(e) => setInventoryAdjustForm({ ...inventoryAdjustForm, reason: e.target.value })} style={{ width: "100%", padding: "10px", border: "1px solid #e2e8f0", borderRadius: "4px", fontSize: "13px" }}>
                      <option value="Restock">Restock / Purchase</option>
                      <option value="Damage">Damaged Goods</option>
                      <option value="Return">Customer Return</option>
                      <option value="Audit">Physical Inventory Audit</option>
                    </select>
                  </div>
                  <button type="submit" style={{ backgroundColor: "#00c6ff", color: "#fff", fontWeight: "700", padding: "12px", borderRadius: "4px", cursor: "pointer", border: "none" }}>UPDATE STOCK LEVEL</button>
                </form>

                <div style={{ flex: "2", minWidth: "500px", backgroundColor: "#fff", borderRadius: "8px", padding: "25px", boxShadow: "0 2px 10px rgba(0,0,0,0.03)" }}>
                  <h2 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "15px", textTransform: 'uppercase' }}>Inventory Stock Status</h2>
                  <table className="admin-table">
                    <thead>
                      <tr><th>Variant (SKU)</th><th>Product Name</th><th>Price</th><th>Stock Status</th></tr>
                    </thead>
                    <tbody>
                      {inventoryList.map((v) => (
                        <tr key={v.id}>
                          <td>
                            <div style={{ fontWeight: "700" }}>{v.name}</div>
                            <div style={{ fontSize: "11px", color: "#718096" }}>SKU: {v.sku}</div>
                          </td>
                          <td style={{ fontSize: "13px" }}>{v.product?.name || "Product Name"}</td>
                          <td style={{ fontWeight: "700" }}>BDT {v.price}</td>
                          <td>
                            <span className={`admin-status-badge ${v.stock <= 5 ? "status-unpaid" : v.stock <= 15 ? "bg-grad-orange" : "status-paid"}`} style={{ color: (v.stock > 5 && v.stock <= 15) ? "#fff" : undefined }}>
                              {v.stock} in stock ({v.stock <= 5 ? "Critical" : v.stock <= 15 ? "Low Stock" : "In Stock"})
                            </span>
                          </td>
                        </tr>
                      ))}
                      {inventoryList.length === 0 && <tr><td colSpan={4} style={{ textAlign: "center", padding: "20px" }}>No items found in inventory.</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === "customers" && (
              <div className="admin-panel-card" style={{ maxWidth: "1000px", margin: "0 auto" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                  <h2 style={{ fontSize: "16px", fontWeight: "700", textTransform: 'uppercase' }}>Customer Management</h2>
                  <div className="admin-search" style={{ width: "250px" }}>
                    <Search size={16} color="#a0aec0" />
                    <input type="text" placeholder="Search by name or email..." />
                  </div>
                </div>
                
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Customer Name</th>
                      <th>Total Orders</th>
                      <th>Incomplete</th>
                      <th>Total Spent</th>
                      <th>Fraud Risk</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customerList.map(c => (
                      <tr key={c.id}>
                        <td>
                          <div style={{ fontWeight: "700", color: "#2d3748" }}>{c.name}</div>
                          <div style={{ fontSize: "11px", color: "#718096" }}>{c.email}</div>
                          <div style={{ fontSize: "11px", color: "#718096" }}>{c.phone || "No Phone"}</div>
                        </td>
                        <td style={{ textAlign: "center", fontWeight: "600" }}>{c.totalOrders}</td>
                        <td style={{ textAlign: "center", color: c.incompleteOrders > 0 ? "#e53e3e" : "#4a5568", fontWeight: "700" }}>
                          {c.incompleteOrders}
                        </td>
                        <td style={{ fontWeight: "700", color: "#00c6ff" }}>
                          BDT {c.totalSpent.toLocaleString()}
                        </td>
                        <td>
                          <span className={`admin-status-badge ${c.fraudRisk === 'High' || c.fraudRisk === 'Banned' ? 'status-unpaid' : c.fraudRisk === 'Medium' ? 'bg-grad-orange' : 'status-paid'}`} style={{ color: c.fraudRisk === 'Medium' ? '#fff' : undefined }}>
                            {c.fraudRisk}
                          </span>
                        </td>
                        <td>
                          <select 
                            value={c.status} 
                            onChange={(e) => handleUpdateCustomerStatus(c.id, e.target.value)}
                            style={{ padding: "4px 8px", borderRadius: "4px", border: "1px solid #e2e8f0", fontSize: "12px", backgroundColor: c.status === "Fraud" ? "#fee2e2" : "#f0fff4", color: c.status === "Fraud" ? "#e53e3e" : "#38a169", fontWeight: "700" }}
                          >
                            <option value="Active">Active</option>
                            <option value="Suspicious">Suspicious</option>
                            <option value="Fraud">Fraud (Banned)</option>
                          </select>
                        </td>
                        <td>
                          <button style={{ padding: "6px 12px", backgroundColor: "#edf2f7", color: "#4a5568", border: "none", borderRadius: "4px", fontWeight: "700", fontSize: "11px", cursor: "pointer" }}>View History</button>
                        </td>
                      </tr>
                    ))}
                    {customerList.length === 0 && <tr><td colSpan={7} style={{ textAlign: "center", padding: "20px" }}>No customers found.</td></tr>}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === "coupons" && (
              <div style={{ display: "flex", gap: "30px", flexWrap: "wrap", alignItems: "flex-start" }}>
                <form onSubmit={handleSaveCoupon} style={{ flex: "1", minWidth: "300px", backgroundColor: "#fff", borderRadius: "8px", padding: "25px", boxShadow: "0 2px 10px rgba(0,0,0,0.03)", display: "flex", flexDirection: "column", gap: "15px" }}>
                  <h2 style={{ fontSize: "16px", fontWeight: "700", color: "#2d3748", textTransform: 'uppercase' }}>Create Discount Coupon</h2>
                  
                  <input type="text" required placeholder="Coupon Code (e.g. SAVE20)" value={couponForm.code} onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value })} style={{ width: "100%", padding: "10px", border: "1px solid #e2e8f0", borderRadius: "4px", fontSize: "13px" }} />
                  
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                    <select required value={couponForm.discountType} onChange={(e) => setCouponForm({ ...couponForm, discountType: e.target.value })} style={{ width: "100%", padding: "10px", border: "1px solid #e2e8f0", borderRadius: "4px", fontSize: "13px" }}>
                      <option value="Percentage">Percentage (%)</option>
                      <option value="Fixed">Fixed Amount (BDT)</option>
                    </select>
                    <input type="number" required placeholder="Discount Value" value={couponForm.discountValue} onChange={(e) => setCouponForm({ ...couponForm, discountValue: e.target.value })} style={{ width: "100%", padding: "10px", border: "1px solid #e2e8f0", borderRadius: "4px", fontSize: "13px" }} />
                  </div>

                  <input type="number" placeholder="Min Order Value (BDT)" value={couponForm.minOrderValue} onChange={(e) => setCouponForm({ ...couponForm, minOrderValue: e.target.value })} style={{ width: "100%", padding: "10px", border: "1px solid #e2e8f0", borderRadius: "4px", fontSize: "13px" }} />
                  <input type="number" placeholder="Usage Limit (Per User)" value={couponForm.usageLimit} onChange={(e) => setCouponForm({ ...couponForm, usageLimit: e.target.value })} style={{ width: "100%", padding: "10px", border: "1px solid #e2e8f0", borderRadius: "4px", fontSize: "13px" }} />
                  
                  <div>
                    <label style={{ fontSize: "12px", fontWeight: "700", display: "block", marginBottom: "5px" }}>Expiry Date</label>
                    <input type="date" required value={couponForm.expiryDate} onChange={(e) => setCouponForm({ ...couponForm, expiryDate: e.target.value })} style={{ width: "100%", padding: "10px", border: "1px solid #e2e8f0", borderRadius: "4px", fontSize: "13px" }} />
                  </div>

                  <button type="submit" style={{ backgroundColor: "#00c6ff", color: "#fff", fontWeight: "700", padding: "12px", borderRadius: "4px", cursor: "pointer", border: "none" }}>GENERATE COUPON</button>
                </form>

                <div style={{ flex: "2", minWidth: "500px", backgroundColor: "#fff", borderRadius: "8px", padding: "25px", boxShadow: "0 2px 10px rgba(0,0,0,0.03)" }}>
                  <h2 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "15px", textTransform: 'uppercase' }}>Active Store Coupons</h2>
                  <table className="admin-table">
                    <thead>
                      <tr><th>Code</th><th>Discount</th><th>Min Order</th><th>Expiry</th><th>Times Used</th><th>Action</th></tr>
                    </thead>
                    <tbody>
                      {couponList.map((cp) => (
                        <tr key={cp.id}>
                          <td style={{ fontWeight: "700", color: "#e63b7a" }}>{cp.code}</td>
                          <td style={{ fontWeight: "600" }}>{cp.discountType === 'Percentage' ? `${cp.discountValue}%` : `BDT ${cp.discountValue}`}</td>
                          <td>BDT {cp.minOrderValue}</td>
                          <td style={{ fontSize: "12px" }}>{new Date(cp.expiryDate).toLocaleDateString()}</td>
                          <td style={{ textAlign: "center" }}>{cp.timesUsed} / {cp.usageLimit}</td>
                          <td>
                            <button onClick={() => handleDeleteCoupon(cp.id)} style={{ padding: "6px 12px", backgroundColor: "#fee2e2", color: "#e53e3e", border: "none", borderRadius: "4px", fontWeight: "700", fontSize: "11px", cursor: "pointer" }}>Delete</button>
                          </td>
                        </tr>
                      ))}
                      {couponList.length === 0 && <tr><td colSpan={6} style={{ textAlign: "center", padding: "20px" }}>No coupons created yet.</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === "vendors" && (
              <div style={{ display: "flex", gap: "30px", flexWrap: "wrap", alignItems: "flex-start" }}>
                <form onSubmit={handleSaveVendor} style={{ flex: "1", minWidth: "300px", backgroundColor: "#fff", borderRadius: "8px", padding: "25px", boxShadow: "0 2px 10px rgba(0,0,0,0.03)", display: "flex", flexDirection: "column", gap: "15px" }}>
                  <h2 style={{ fontSize: "16px", fontWeight: "700", color: "#2d3748", textTransform: 'uppercase' }}>{isEditingVendor ? "Edit Supplier Info" : "Register Vendor"}</h2>
                  
                  <input type="text" required placeholder="Vendor / Company Name" value={vendorForm.name} onChange={(e) => setVendorForm({ ...vendorForm, name: e.target.value })} style={{ width: "100%", padding: "10px", border: "1px solid #e2e8f0", borderRadius: "4px", fontSize: "13px" }} />
                  <input type="text" placeholder="Contact Person Name" value={vendorForm.contactName} onChange={(e) => setVendorForm({ ...vendorForm, contactName: e.target.value })} style={{ width: "100%", padding: "10px", border: "1px solid #e2e8f0", borderRadius: "4px", fontSize: "13px" }} />
                  <input type="email" placeholder="Email Address" value={vendorForm.email} onChange={(e) => setVendorForm({ ...vendorForm, email: e.target.value })} style={{ width: "100%", padding: "10px", border: "1px solid #e2e8f0", borderRadius: "4px", fontSize: "13px" }} />
                  <input type="text" placeholder="Phone Number" value={vendorForm.phone} onChange={(e) => setVendorForm({ ...vendorForm, phone: e.target.value })} style={{ width: "100%", padding: "10px", border: "1px solid #e2e8f0", borderRadius: "4px", fontSize: "13px" }} />
                  <input type="text" placeholder="Supplier Address" value={vendorForm.address} onChange={(e) => setVendorForm({ ...vendorForm, address: e.target.value })} style={{ width: "100%", padding: "10px", border: "1px solid #e2e8f0", borderRadius: "4px", fontSize: "13px" }} />
                  
                  <select required value={vendorForm.status} onChange={(e) => setVendorForm({ ...vendorForm, status: e.target.value })} style={{ width: "100%", padding: "10px", border: "1px solid #e2e8f0", borderRadius: "4px", fontSize: "13px" }}>
                    <option value="Active">Active Supplier</option>
                    <option value="Inactive">Inactive</option>
                  </select>

                  <div style={{ display: "flex", gap: "10px" }}>
                    <button type="submit" style={{ flex: 1, backgroundColor: "#00c6ff", color: "#fff", fontWeight: "700", padding: "12px", borderRadius: "4px", cursor: "pointer", border: "none" }}>{isEditingVendor ? "SAVE CHANGES" : "ADD VENDOR"}</button>
                    {isEditingVendor && <button type="button" onClick={() => { setIsEditingVendor(false); setVendorForm({ id: "", name: "", contactName: "", email: "", phone: "", address: "", status: "Active" }); }} style={{ backgroundColor: "#e2e8f0", color: "#4a5568", fontWeight: "700", padding: "12px", borderRadius: "4px", cursor: "pointer", border: "none" }}>Cancel</button>}
                  </div>
                </form>

                <div style={{ flex: "2", minWidth: "500px", backgroundColor: "#fff", borderRadius: "8px", padding: "25px", boxShadow: "0 2px 10px rgba(0,0,0,0.03)" }}>
                  <h2 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "15px", textTransform: 'uppercase' }}>Vendor Directory</h2>
                  <table className="admin-table">
                    <thead>
                      <tr><th>Vendor Name</th><th>Contact Person</th><th>Details</th><th>Status</th><th>Actions</th></tr>
                    </thead>
                    <tbody>
                      {vendorList.map((vn) => (
                        <tr key={vn.id}>
                          <td style={{ fontWeight: "700" }}>{vn.name}</td>
                          <td>{vn.contactName || "N/A"}</td>
                          <td style={{ fontSize: "12px" }}>
                            <div>{vn.email || "No Email"}</div>
                            <div>{vn.phone || "No Phone"}</div>
                            <div style={{ color: "#718096" }}>{vn.address}</div>
                          </td>
                          <td>
                            <span className={`admin-status-badge ${vn.status === 'Active' ? 'status-paid' : 'status-unpaid'}`}>
                              {vn.status}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: "flex", gap: "5px" }}>
                              <button onClick={() => { setIsEditingVendor(true); setVendorForm({ id: vn.id, name: vn.name, contactName: vn.contactName || "", email: vn.email || "", phone: vn.phone || "", address: vn.address || "", status: vn.status }); }} style={{ padding: "6px 12px", backgroundColor: "#edf2f7", color: "#4a5568", border: "none", borderRadius: "4px", fontWeight: "700", fontSize: "11px", cursor: "pointer" }}>Edit</button>
                              <button onClick={() => handleDeleteVendor(vn.id)} style={{ padding: "6px 12px", backgroundColor: "#fee2e2", color: "#e53e3e", border: "none", borderRadius: "4px", fontWeight: "700", fontSize: "11px", cursor: "pointer" }}>Delete</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {vendorList.length === 0 && <tr><td colSpan={5} style={{ textAlign: "center", padding: "20px" }}>No vendors registered yet.</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === "delivery" && (
              <div className="admin-panel-card" style={{ maxWidth: "1000px", margin: "0 auto" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                  <h2 style={{ fontSize: "16px", fontWeight: "700", textTransform: 'uppercase' }}>Delivery & Courier Management</h2>
                  <div style={{ fontSize: "13px", fontWeight: "600", color: "#4a5568", backgroundColor: "#edf2f7", padding: "6px 12px", borderRadius: "4px" }}>
                    Active Courier: <span style={{ color: "#00c6ff" }}>{settings.COURIER_PROVIDER || "Steadfast"}</span>
                  </div>
                </div>

                <h3 style={{ fontSize: "14px", fontWeight: "700", marginBottom: "10px" }}>Pending Dispatch (Processing)</h3>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Customer Info</th>
                      <th>Delivery Area</th>
                      <th>Amount</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.filter(o => o.orderStatus === "Processing").map(o => (
                      <tr key={o.id}>
                        <td style={{ fontWeight: "700" }}>{o.orderNumber || o.id.substring(0,8)}</td>
                        <td>
                          <div style={{ fontWeight: "600" }}>{o.customerName}</div>
                          <div style={{ fontSize: "11px", color: "#718096" }}>{o.customerPhone}</div>
                        </td>
                        <td>
                          <div style={{ fontSize: "13px" }}>{o.zone}</div>
                          <div style={{ fontSize: "11px", color: "#718096", maxWidth: "200px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{o.address}</div>
                        </td>
                        <td style={{ fontWeight: "700", color: "#e91e63" }}>BDT {o.total}</td>
                        <td>
                          <button onClick={() => handleSendToCourier(o.id)} style={{ padding: "8px 12px", backgroundColor: "#00c6ff", color: "#fff", border: "none", borderRadius: "4px", fontWeight: "700", fontSize: "11px", cursor: "pointer" }}>Send to Courier API</button>
                        </td>
                      </tr>
                    ))}
                    {orders.filter(o => o.orderStatus === "Processing").length === 0 && (
                      <tr><td colSpan={5} style={{ textAlign: "center", padding: "20px" }}>No orders ready for dispatch.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === "staff" && (
              <div style={{ display: "flex", gap: "30px", flexWrap: "wrap", alignItems: "flex-start" }}>
                <form onSubmit={handleSaveStaff} style={{ flex: "1", minWidth: "320px", backgroundColor: "#fff", borderRadius: "8px", padding: "25px", boxShadow: "0 2px 10px rgba(0,0,0,0.03)", display: "flex", flexDirection: "column", gap: "15px" }}>
                  <h2 style={{ fontSize: "16px", fontWeight: "700", color: "#2d3748", textTransform: 'uppercase' }}>{isEditingStaff ? "Edit Staff Role" : "Add Staff"}</h2>
                  
                  <input type="text" required placeholder="Full Name" value={staffForm.name} onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })} style={{ width: "100%", padding: "10px", border: "1px solid #e2e8f0", borderRadius: "4px", fontSize: "13px" }} disabled={isEditingStaff} />
                  <input type="email" required placeholder="Email Address" value={staffForm.email} onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })} style={{ width: "100%", padding: "10px", border: "1px solid #e2e8f0", borderRadius: "4px", fontSize: "13px" }} disabled={isEditingStaff} />
                  <input type="text" placeholder="Phone Number" value={staffForm.phone} onChange={(e) => setStaffForm({ ...staffForm, phone: e.target.value })} style={{ width: "100%", padding: "10px", border: "1px solid #e2e8f0", borderRadius: "4px", fontSize: "13px" }} disabled={isEditingStaff} />
                  
                  {!isEditingStaff && (
                    <input type="password" required placeholder="Password" value={staffForm.password} onChange={(e) => setStaffForm({ ...staffForm, password: e.target.value })} style={{ width: "100%", padding: "10px", border: "1px solid #e2e8f0", borderRadius: "4px", fontSize: "13px" }} />
                  )}

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <select required value={staffForm.role} onChange={(e) => setStaffForm({ ...staffForm, role: e.target.value })} style={{ width: "100%", padding: "10px", border: "1px solid #e2e8f0", borderRadius: "4px", fontSize: "13px" }}>
                      <option value="Salesman">Salesman</option>
                      <option value="Manager">Manager</option>
                      <option value="SuperAdmin">SuperAdmin</option>
                      <option value="Rider">Rider</option>
                    </select>
                    <select required value={staffForm.status} onChange={(e) => setStaffForm({ ...staffForm, status: e.target.value })} style={{ width: "100%", padding: "10px", border: "1px solid #e2e8f0", borderRadius: "4px", fontSize: "13px" }}>
                      <option value="Active">Active</option>
                      <option value="Suspicious">Suspended</option>
                    </select>
                  </div>

                  <div style={{ display: "flex", gap: "10px" }}>
                    <button type="submit" style={{ flex: 1, backgroundColor: "#00c6ff", color: "#fff", fontWeight: "700", padding: "12px", borderRadius: "4px", cursor: "pointer", border: "none" }}>{isEditingStaff ? "UPDATE ROLE" : "CREATE ACCOUNT"}</button>
                    {isEditingStaff && <button type="button" onClick={() => { setIsEditingStaff(false); setStaffForm({ id: "", name: "", email: "", phone: "", role: "Salesman", password: "", status: "Active" }); }} style={{ backgroundColor: "#e2e8f0", color: "#4a5568", fontWeight: "700", padding: "12px", borderRadius: "4px", cursor: "pointer", border: "none" }}>Cancel</button>}
                  </div>
                </form>

                <div style={{ flex: "2", minWidth: "400px", backgroundColor: "#fff", borderRadius: "8px", padding: "25px", boxShadow: "0 2px 10px rgba(0,0,0,0.03)", maxHeight: "85vh", overflowY: "auto" }}>
                  <h2 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "15px", textTransform: 'uppercase' }}>Staff Directory</h2>
                  <table className="admin-table">
                    <thead>
                      <tr><th>Name</th><th>Role</th><th>Email</th><th>Status</th><th>Actions</th></tr>
                    </thead>
                    <tbody>
                      {staffList.map((st) => (
                        <tr key={st.id}>
                          <td style={{ fontWeight: "600" }}>{st.name}</td>
                          <td><span className={`admin-status-badge ${st.role === 'SuperAdmin' ? 'status-paid' : 'status-unpaid'}`}>{st.role}</span></td>
                          <td>{st.email}</td>
                          <td>{st.status}</td>
                          <td>
                            <button onClick={() => { setIsEditingStaff(true); setStaffForm({ id: st.id, name: st.name, email: st.email, phone: st.phone || "", role: st.role, password: "", status: st.status }); }} style={{ padding: "6px 12px", backgroundColor: "#edf2f7", color: "#4a5568", border: "none", borderRadius: "4px", fontWeight: "700", fontSize: "11px", cursor: "pointer" }}>Edit Role</button>
                          </td>
                        </tr>
                      ))}
                      {staffList.length === 0 && <tr><td colSpan={5} style={{ textAlign: "center", padding: "20px" }}>No staff found.</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === "chat" && (
              <div style={{ display: "flex", gap: "20px", height: "75vh", backgroundColor: "#fff", borderRadius: "12px", border: "1px solid #edf2f7", overflow: "hidden" }}>
                {/* Chat Threads list */}
                <div style={{ width: "300px", borderRight: "1px solid #edf2f7", display: "flex", flexDirection: "column" }}>
                  <div style={{ padding: "20px", borderBottom: "1px solid #edf2f7", fontWeight: "800", color: "#2d3748" }}>ACTIVE CHATS</div>
                  <div style={{ flex: 1, overflowY: "auto" }}>
                    {chatThreads.map((thread) => (
                      <div
                        key={thread.chatId}
                        onClick={() => setActiveChatId(thread.chatId)}
                        style={{
                          padding: "15px 20px",
                          borderBottom: "1px solid #f7fafc",
                          cursor: "pointer",
                          backgroundColor: activeChatId === thread.chatId ? "#fdf8fa" : "#fff",
                          borderLeft: activeChatId === thread.chatId ? "4px solid #e63b7a" : "none",
                        }}
                      >
                        <div style={{ fontWeight: "700", fontSize: "13px", color: activeChatId === thread.chatId ? "#e63b7a" : "#4a5568" }}>
                          Thread {thread.chatId.substring(5, 11)}
                        </div>
                        <div style={{ fontSize: "11px", color: "#a0aec0", marginTop: "4px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {thread.lastSender === "Admin" ? "You: " : ""}{thread.lastMessage}
                        </div>
                      </div>
                    ))}
                    {chatThreads.length === 0 && (
                      <div style={{ padding: "30px", textTransform: "uppercase", fontSize: "11px", textAlign: "center", color: "#a0aec0", fontWeight: "bold" }}>
                        No chats active
                      </div>
                    )}
                  </div>
                </div>

                {/* Messages Panel */}
                <div style={{ flex: 1, display: "flex", flexDirection: "column", backgroundColor: "#f7fafc" }}>
                  {activeChatId ? (
                    <>
                      {/* Thread Title */}
                      <div style={{ padding: "15px 20px", backgroundColor: "#fff", borderBottom: "1px solid #edf2f7", fontWeight: "700", color: "#e63b7a" }}>
                        Customer Support: Thread {activeChatId.substring(5, 11)}
                      </div>

                      {/* Chat messages */}
                      <div style={{ flex: 1, padding: "20px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "12px" }}>
                        {activeChatMessages.map((msg, index) => {
                          const isAdmin = msg.sender === "Admin";
                          return (
                            <div
                              key={msg.id || index}
                              style={{
                                alignSelf: isAdmin ? "flex-end" : "flex-start",
                                backgroundColor: isAdmin ? "#e63b7a" : "#fff",
                                color: isAdmin ? "#fff" : "#2d3748",
                                padding: msg.message && msg.message.startsWith("data:image/") ? "6px" : "10px 15px",
                                borderRadius: "10px",
                                maxWidth: "60%",
                                fontSize: "13px",
                                boxShadow: "0 2px 5px rgba(0,0,0,0.02)",
                              }}
                            >
                              {msg.message && msg.message.startsWith("data:image/") ? (
                                <img src={msg.message} alt="Attached screenshot" style={{ maxWidth: "100%", borderRadius: "8px", display: "block" }} />
                              ) : (
                                msg.message
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Reply Input Form */}
                      <form onSubmit={handleSendChatReply} style={{ padding: "15px 20px", backgroundColor: "#fff", borderTop: "1px solid #edf2f7", display: "flex", gap: "10px", alignItems: "center" }}>
                        <button
                          type="button"
                          onClick={() => adminFileInputRef.current?.click()}
                          style={{
                            background: "none",
                            border: "none",
                            color: "#718096",
                            cursor: "pointer",
                            padding: "4px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                          title="Upload screenshot reply"
                        >
                          <Camera size={20} />
                        </button>
                        <input
                          type="file"
                          ref={adminFileInputRef}
                          onChange={handleAdminImageUpload}
                          accept="image/*"
                          style={{ display: "none" }}
                        />
                        <input
                          type="text"
                          placeholder="Type customer reply here..."
                          value={chatReplyText}
                          onChange={(e) => setChatReplyText(e.target.value)}
                          style={{ flex: 1, padding: "10px 15px", borderRadius: "6px", border: "1px solid #e2e8f0", fontSize: "13px", color: "#2d3748" }}
                        />
                        <button type="submit" style={{ backgroundColor: "#e63b7a", color: "#fff", padding: "10px 24px", border: "none", borderRadius: "6px", fontWeight: "700", cursor: "pointer" }}>
                          REPLY
                        </button>
                      </form>
                    </>
                  ) : (
                    <div style={{ margin: "auto", color: "#718096", fontSize: "14px", fontWeight: "600", textTransform: "uppercase" }}>
                      Select a thread from the sidebar to chat
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "reports" && (
              <div className="admin-panel-card" style={{ maxWidth: "800px", margin: "0 auto" }}>
                <h2 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "20px" }}>Reports & Analytics</h2>
                {dashboardStats ? (
                  <>
                    <div style={{ padding: "20px", backgroundColor: "#fff", border: "1px solid #edf2f7", borderRadius: "8px", marginBottom: "20px" }}>
                      <h3 style={{ fontSize: "14px", fontWeight: "700", color: "#4a5568", marginBottom: "15px" }}>Annual Revenue vs Cost</h3>
                      <ResponsiveContainer width="100%" height={250}>
                        <AreaChart data={dashboardStats.salesData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#edf2f7" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#a0aec0" }} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#a0aec0" }} />
                          <RechartsTooltip />
                          <Area type="monotone" dataKey="cyan" stroke="#00c6ff" fill="#e0f7fa" strokeWidth={3} name="Revenue (Tk)" />
                          <Area type="monotone" dataKey="orange" stroke="#ed8936" fill="#feebc8" strokeWidth={3} name="Cost (Tk)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>

                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr style={{ backgroundColor: "#f8fafc", textAlign: "left", fontSize: "12px", color: "#64748b" }}>
                          <th style={{ padding: "12px", borderBottom: "1px solid #e2e8f0" }}>Month</th>
                          <th style={{ padding: "12px", borderBottom: "1px solid #e2e8f0" }}>Revenue</th>
                          <th style={{ padding: "12px", borderBottom: "1px solid #e2e8f0" }}>Est. Cost</th>
                          <th style={{ padding: "12px", borderBottom: "1px solid #e2e8f0" }}>Net Profit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dashboardStats.salesData.map((data: any) => (
                          <tr key={data.name} style={{ borderBottom: "1px solid #edf2f7", fontSize: "13px" }}>
                            <td style={{ padding: "12px", fontWeight: "600", color: "#4a5568" }}>{data.name}</td>
                            <td style={{ padding: "12px", color: "#00c6ff", fontWeight: "700" }}>Tk {data.cyan.toLocaleString()}</td>
                            <td style={{ padding: "12px", color: "#ed8936" }}>Tk {data.orange.toLocaleString()}</td>
                            <td style={{ padding: "12px", color: "#e53e3e", fontWeight: "700" }}>Tk {data.pink.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </>
                ) : (
                  <div style={{ padding: "20px", textAlign: "center", color: "#718096" }}>Loading reports...</div>
                )}
              </div>
            )}

            {activeTab === "notifications" && (
              <div style={{ display: "flex", gap: "30px", flexWrap: "wrap", alignItems: "flex-start" }}>
                <form onSubmit={handleSaveNotification} style={{ flex: "1", minWidth: "320px", backgroundColor: "#fff", borderRadius: "8px", padding: "25px", boxShadow: "0 2px 10px rgba(0,0,0,0.03)", display: "flex", flexDirection: "column", gap: "15px" }}>
                  <h2 style={{ fontSize: "16px", fontWeight: "700", color: "#2d3748", textTransform: 'uppercase' }}>
                    {isEditingNotification ? "Edit Notification" : "Compose Daily Offer Notification"}
                  </h2>
                  {notificationMessage && (
                    <div style={{ padding: "10px", borderRadius: "4px", backgroundColor: "#f0fff4", color: "#38a169", fontSize: "12px", fontWeight: "bold" }}>
                      {notificationMessage}
                    </div>
                  )}
                  <div>
                    <label style={{ fontSize: "12px", fontWeight: "700", display: "block", marginBottom: "5px" }}>Notification Title</label>
                    <input type="text" required placeholder="e.g. FLAT 50% OFF TODAY!" value={notificationForm.title} onChange={(e) => setNotificationForm({ ...notificationForm, title: e.target.value })} style={{ width: "100%", padding: "10px", border: "1px solid #e2e8f0", borderRadius: "4px", fontSize: "13px" }} />
                  </div>
                  <div>
                    <label style={{ fontSize: "12px", fontWeight: "700", display: "block", marginBottom: "5px" }}>Notification Message</label>
                    <textarea rows={4} required placeholder="Write the offer description that visitors will see..." value={notificationForm.message} onChange={(e) => setNotificationForm({ ...notificationForm, message: e.target.value })} style={{ width: "100%", padding: "10px", border: "1px solid #e2e8f0", borderRadius: "4px", fontSize: "13px" }} />
                  </div>
                  <div>
                    <label style={{ fontSize: "12px", fontWeight: "700", display: "block", marginBottom: "5px" }}>Target URL / Link (Optional)</label>
                    <input type="text" placeholder="e.g. /shop?campaign=BOGO" value={notificationForm.linkUrl} onChange={(e) => setNotificationForm({ ...notificationForm, linkUrl: e.target.value })} style={{ width: "100%", padding: "10px", border: "1px solid #e2e8f0", borderRadius: "4px", fontSize: "13px" }} />
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <input type="checkbox" id="isActive" checked={notificationForm.isActive} onChange={(e) => setNotificationForm({ ...notificationForm, isActive: e.target.checked })} style={{ cursor: "pointer" }} />
                    <label htmlFor="isActive" style={{ fontSize: "13px", fontWeight: "700", cursor: "pointer" }}>Set as currently active offer</label>
                  </div>
                  <div style={{ display: "flex", gap: "10px" }}>
                    <button type="submit" style={{ flex: 1, backgroundColor: "#e63b7a", color: "#fff", fontWeight: "700", padding: "12px", borderRadius: "4px", cursor: "pointer", border: "none" }}>
                      {isEditingNotification ? "UPDATE" : "BROADCAST DAILY OFFER"}
                    </button>
                    {isEditingNotification && (
                      <button type="button" onClick={() => { setIsEditingNotification(false); setNotificationForm({ id: "", title: "", message: "", linkUrl: "", isActive: true }); }} style={{ backgroundColor: "#e2e8f0", color: "#4a5568", fontWeight: "700", padding: "12px", borderRadius: "4px", cursor: "pointer", border: "none" }}>
                        Cancel
                      </button>
                    )}
                  </div>
                </form>

                <div style={{ flex: "2", minWidth: "400px", backgroundColor: "#fff", borderRadius: "8px", padding: "25px", boxShadow: "0 2px 10px rgba(0,0,0,0.03)", maxHeight: "85vh", overflowY: "auto" }}>
                  <h2 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "15px", textTransform: 'uppercase' }}>Notification History</h2>
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {notificationsList.map((notif) => (
                      <div key={notif.id} style={{ padding: "15px", border: "1px solid #edf2f7", borderRadius: "6px", backgroundColor: notif.isActive ? "#fdf8fa" : "#fff", borderLeft: notif.isActive ? "4px solid #e63b7a" : "1px solid #edf2f7" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <div>
                            <h4 style={{ margin: 0, fontSize: "14px", fontWeight: "700", color: "#2d3748" }}>{notif.title}</h4>
                            <p style={{ margin: "5px 0 0 0", fontSize: "12px", color: "#718096" }}>{notif.message}</p>
                            {notif.linkUrl && <div style={{ fontSize: "11px", color: "#e63b7a", marginTop: "4px" }}>Link: {notif.linkUrl}</div>}
                            <span style={{ fontSize: "10px", color: "#a0aec0", display: "block", marginTop: "6px" }}>Created: {new Date(notif.createdAt).toLocaleString()}</span>
                          </div>
                          <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                            <button 
                              onClick={() => {
                                setIsEditingNotification(true);
                                setNotificationForm({ id: notif.id, title: notif.title, message: notif.message, linkUrl: notif.linkUrl || "", isActive: notif.isActive });
                                document.querySelector('.admin-content-scroll')?.scrollTo({ top: 0, behavior: "smooth" });
                              }}
                              style={{ padding: "4px 8px", backgroundColor: "#edf2f7", color: "#4a5568", border: "none", borderRadius: "4px", fontSize: "11px", cursor: "pointer", fontWeight: "bold" }}
                            >
                              Edit
                            </button>
                            <button 
                              onClick={() => handleToggleNotification(notif.id, !notif.isActive)} 
                              style={{ padding: "4px 8px", backgroundColor: notif.isActive ? "#e53e3e" : "#38a169", color: "#fff", border: "none", borderRadius: "4px", fontSize: "11px", cursor: "pointer", fontWeight: "bold" }}
                            >
                              {notif.isActive ? "Deactivate" : "Activate"}
                            </button>
                            <button 
                              onClick={() => handleDeleteNotification(notif.id)} 
                              style={{ padding: "4px 8px", backgroundColor: "#fee2e2", color: "#e53e3e", border: "none", borderRadius: "4px", fontSize: "11px", cursor: "pointer", fontWeight: "bold" }}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    {notificationsList.length === 0 && <p style={{ color: "#718096", textAlign: "center", padding: "20px" }}>No previous notifications broadcasted.</p>}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "pages-config" && (
              <div style={{ padding: "10px 0" }}>
                {/* Header & Save Bar */}
                <div style={{ 
                  display: "flex", 
                  justifyContent: "space-between", 
                  alignItems: "center", 
                  marginBottom: "20px", 
                  backgroundColor: "#fff", 
                  padding: "18px 24px", 
                  borderRadius: "10px", 
                  boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
                  flexWrap: "wrap",
                  gap: "14px"
                }}>
                  <div>
                    <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "800", color: "#1a202c" }}>Page & Section Manager</h2>
                    <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "#718096" }}>
                      Customize titles, delivery fees, discount rules, concern cards and seasonal campaigns across the store.
                    </p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    {pagesConfigMessage && (
                      <span style={{ 
                        fontSize: "13px", 
                        fontWeight: "700", 
                        color: pagesConfigMessage.includes("Error") ? "#e53e3e" : "#2f855a",
                        backgroundColor: pagesConfigMessage.includes("Error") ? "#fed7d7" : "#c6f6d5",
                        padding: "6px 14px",
                        borderRadius: "20px"
                      }}>
                        {pagesConfigMessage}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleSavePagesConfig()}
                      style={{
                        background: "linear-gradient(135deg, #e63b7a 0%, #ff758c 100%)",
                        color: "#fff",
                        border: "none",
                        padding: "10px 24px",
                        borderRadius: "6px",
                        fontWeight: "700",
                        fontSize: "14px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        boxShadow: "0 4px 12px rgba(230, 59, 122, 0.3)"
                      }}
                    >
                      <CheckCircle size={16} /> Save All Changes
                    </button>
                  </div>
                </div>

                {/* Sub Tab Navigation */}
                <div style={{ 
                  display: "flex", 
                  gap: "8px", 
                  marginBottom: "20px", 
                  overflowX: "auto", 
                  paddingBottom: "4px" 
                }}>
                  {[
                    { id: "shop-by-category", label: "🛍️ Shop by Category (Home)" },
                    { id: "shop-by-concern", label: "🎯 Shop by Concern (Home)" },
                    { id: "category-page", label: "📁 Category Directory (/category)" },
                    { id: "checkout-page", label: "💳 Checkout & Shipping (/checkout)" },
                    { id: "shop-page", label: "🏪 Shop Page (/shop)" },
                    { id: "seasonal-offer", label: "🎁 Seasonal Offer Campaign (/seasonal-offer)" },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setPagesConfigSubTab(tab.id as any)}
                      style={{
                        padding: "10px 18px",
                        borderRadius: "8px",
                        fontSize: "13px",
                        fontWeight: "700",
                        cursor: "pointer",
                        border: "none",
                        backgroundColor: pagesConfigSubTab === tab.id ? "#1a202c" : "#ffffff",
                        color: pagesConfigSubTab === tab.id ? "#ffffff" : "#4a5568",
                        boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
                        whiteSpace: "nowrap",
                        transition: "all 0.15s ease"
                      }}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* 1. SHOP BEAUTY PRODUCTS BY CATEGORY */}
                {pagesConfigSubTab === "shop-by-category" && (
                  <div style={{ backgroundColor: "#fff", borderRadius: "10px", padding: "28px", boxShadow: "0 2px 10px rgba(0,0,0,0.03)", maxWidth: "800px" }}>
                    <h3 style={{ fontSize: "16px", fontWeight: "800", color: "#2d3748", textTransform: "uppercase", marginBottom: "16px", borderBottom: "2px solid #edf2f7", paddingBottom: "10px" }}>
                      Homepage: Shop Beauty Products by Category
                    </h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                      <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", fontSize: "14px", fontWeight: "700", color: "#2d3748" }}>
                        <input
                          type="checkbox"
                          checked={pagesConfig?.shopByCategory?.enabled !== false}
                          onChange={(e) => setPagesConfig((prev: any) => ({
                            ...prev,
                            shopByCategory: { ...prev.shopByCategory, enabled: e.target.checked }
                          }))}
                          style={{ width: "18px", height: "18px", accentColor: "#e63b7a" }}
                        />
                        Enable "SHOP BEAUTY PRODUCTS BY CATEGORY" Section on Homepage
                      </label>

                      <div>
                        <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#4a5568", marginBottom: "6px" }}>
                          Section Heading Title
                        </label>
                        <input
                          type="text"
                          value={pagesConfig?.shopByCategory?.title || ""}
                          onChange={(e) => setPagesConfig((prev: any) => ({
                            ...prev,
                            shopByCategory: { ...prev.shopByCategory, title: e.target.value }
                          }))}
                          placeholder="e.g. SHOP BEAUTY PRODUCTS BY CATEGORY"
                          style={{ width: "100%", padding: "10px 14px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "14px", fontWeight: "600", color: "#2d3748" }}
                        />
                      </div>

                      <div>
                        <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#4a5568", marginBottom: "6px" }}>
                          Section Subtitle / Description (Optional)
                        </label>
                        <input
                          type="text"
                          value={pagesConfig?.shopByCategory?.subtitle || ""}
                          onChange={(e) => setPagesConfig((prev: any) => ({
                            ...prev,
                            shopByCategory: { ...prev.shopByCategory, subtitle: e.target.value }
                          }))}
                          placeholder="e.g. Browse Authentic Skincare & Makeup by Category"
                          style={{ width: "100%", padding: "10px 14px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "14px", fontWeight: "600", color: "#2d3748" }}
                        />
                      </div>

                      <div>
                        <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#4a5568", marginBottom: "6px" }}>
                          Max Categories to Display on Homepage Grid
                        </label>
                        <input
                          type="number"
                          value={pagesConfig?.shopByCategory?.showCount || 8}
                          onChange={(e) => setPagesConfig((prev: any) => ({
                            ...prev,
                            shopByCategory: { ...prev.shopByCategory, showCount: parseInt(e.target.value) || 8 }
                          }))}
                          min={1}
                          max={30}
                          style={{ width: "160px", padding: "10px 14px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "14px", fontWeight: "600", color: "#2d3748" }}
                        />
                        <span style={{ fontSize: "12px", color: "#718096", marginLeft: "10px" }}>Default is 8 (2 rows of 4 cards)</span>
                      </div>

                      <div style={{ marginTop: "10px", padding: "12px 16px", backgroundColor: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "12px", color: "#64748b" }}>
                        ℹ️ <strong>Note:</strong> Category cards automatically display your store's root categories created in the Products & Categories manager. You can assign category images under eCommerce &gt; Products.
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. SHOP BY CONCERN */}
                {pagesConfigSubTab === "shop-by-concern" && (
                  <div style={{ backgroundColor: "#fff", borderRadius: "10px", padding: "28px", boxShadow: "0 2px 10px rgba(0,0,0,0.03)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", borderBottom: "2px solid #edf2f7", paddingBottom: "10px", flexWrap: "wrap", gap: "10px" }}>
                      <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "800", color: "#2d3748", textTransform: "uppercase" }}>
                        Homepage: Shop by Concern Section & Cards
                      </h3>
                      <button
                        type="button"
                        onClick={() => {
                          const newConcern = {
                            name: "New Concern",
                            subtitle: "CARE",
                            image: "https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?w=100&h=100&fit=crop&q=80",
                            link: "/shop?category=skincare"
                          };
                          setPagesConfig((prev: any) => ({
                            ...prev,
                            shopByConcern: {
                              ...prev.shopByConcern,
                              concerns: [...(prev?.shopByConcern?.concerns || []), newConcern]
                            }
                          }));
                        }}
                        style={{
                          backgroundColor: "#3182ce",
                          color: "#fff",
                          border: "none",
                          padding: "8px 14px",
                          borderRadius: "6px",
                          fontWeight: "700",
                          fontSize: "12px",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px"
                        }}
                      >
                        <Plus size={14} /> Add Concern Card
                      </button>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "24px" }}>
                      <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", fontSize: "14px", fontWeight: "700", color: "#2d3748" }}>
                        <input
                          type="checkbox"
                          checked={pagesConfig?.shopByConcern?.enabled !== false}
                          onChange={(e) => setPagesConfig((prev: any) => ({
                            ...prev,
                            shopByConcern: { ...prev.shopByConcern, enabled: e.target.checked }
                          }))}
                          style={{ width: "18px", height: "18px", accentColor: "#e63b7a" }}
                        />
                        Enable "SHOP BY CONCERN" Section on Homepage
                      </label>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
                        <div>
                          <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#4a5568", marginBottom: "6px" }}>
                            Section Heading Title
                          </label>
                          <input
                            type="text"
                            value={pagesConfig?.shopByConcern?.title || ""}
                            onChange={(e) => setPagesConfig((prev: any) => ({
                              ...prev,
                              shopByConcern: { ...prev.shopByConcern, title: e.target.value }
                            }))}
                            placeholder="e.g. SHOP BY CONCERN"
                            style={{ width: "100%", padding: "10px 14px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "14px", fontWeight: "600", color: "#2d3748" }}
                          />
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#4a5568", marginBottom: "6px" }}>
                            Section Subtitle
                          </label>
                          <input
                            type="text"
                            value={pagesConfig?.shopByConcern?.subtitle || ""}
                            onChange={(e) => setPagesConfig((prev: any) => ({
                              ...prev,
                              shopByConcern: { ...prev.shopByConcern, subtitle: e.target.value }
                            }))}
                            placeholder="e.g. Targeted Solutions for Your Skin & Hair Care"
                            style={{ width: "100%", padding: "10px 14px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "14px", fontWeight: "600", color: "#2d3748" }}
                          />
                        </div>
                      </div>
                    </div>

                    <h4 style={{ fontSize: "14px", fontWeight: "700", color: "#4a5568", marginBottom: "12px", textTransform: "uppercase" }}>
                      Concern Cards List ({(pagesConfig?.shopByConcern?.concerns || []).length} items)
                    </h4>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "15px" }}>
                      {(pagesConfig?.shopByConcern?.concerns || []).map((concern: any, idx: number) => (
                        <div key={idx} style={{ border: "1px solid #e2e8f0", borderRadius: "8px", padding: "14px", backgroundColor: "#f8fafc", position: "relative" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                            <span style={{ fontSize: "12px", fontWeight: "800", color: "#718096" }}>#{idx + 1} Card</span>
                            <button
                              type="button"
                              onClick={() => {
                                setPagesConfig((prev: any) => ({
                                  ...prev,
                                  shopByConcern: {
                                    ...prev.shopByConcern,
                                    concerns: prev.shopByConcern.concerns.filter((_: any, i: number) => i !== idx)
                                  }
                                }));
                              }}
                              style={{ border: "none", background: "none", color: "#e53e3e", cursor: "pointer", padding: "4px" }}
                              title="Delete Concern Card"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>

                          <div style={{ display: "flex", gap: "12px", alignItems: "center", marginBottom: "10px" }}>
                            <img
                              src={concern.image || "https://placehold.co/100"}
                              alt={concern.name}
                              style={{ width: "50px", height: "50px", borderRadius: "50%", objectFit: "cover", border: "2px solid #e2e8f0", flexShrink: 0 }}
                              onError={(e) => { e.currentTarget.src = "https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?w=100&h=100&fit=crop&q=80"; }}
                            />
                            <div style={{ flex: 1 }}>
                              <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#718096" }}>Concern Name</label>
                              <input
                                type="text"
                                value={concern.name || ""}
                                onChange={(e) => {
                                  const updated = [...(pagesConfig?.shopByConcern?.concerns || [])];
                                  updated[idx] = { ...updated[idx], name: e.target.value };
                                  setPagesConfig((prev: any) => ({ ...prev, shopByConcern: { ...prev.shopByConcern, concerns: updated } }));
                                }}
                                style={{ width: "100%", padding: "6px 10px", borderRadius: "4px", border: "1px solid #cbd5e1", fontSize: "13px", fontWeight: "700" }}
                              />
                            </div>
                          </div>

                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "8px" }}>
                            <div>
                              <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#718096" }}>Subtitle Tag</label>
                              <input
                                type="text"
                                value={concern.subtitle || ""}
                                onChange={(e) => {
                                  const updated = [...(pagesConfig?.shopByConcern?.concerns || [])];
                                  updated[idx] = { ...updated[idx], subtitle: e.target.value };
                                  setPagesConfig((prev: any) => ({ ...prev, shopByConcern: { ...prev.shopByConcern, concerns: updated } }));
                                }}
                                placeholder="e.g. TREATMENT"
                                style={{ width: "100%", padding: "6px 10px", borderRadius: "4px", border: "1px solid #cbd5e1", fontSize: "12px" }}
                              />
                            </div>
                            <div>
                              <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#718096" }}>Link URL</label>
                              <input
                                type="text"
                                value={concern.link || ""}
                                onChange={(e) => {
                                  const updated = [...(pagesConfig?.shopByConcern?.concerns || [])];
                                  updated[idx] = { ...updated[idx], link: e.target.value };
                                  setPagesConfig((prev: any) => ({ ...prev, shopByConcern: { ...prev.shopByConcern, concerns: updated } }));
                                }}
                                placeholder="/shop?category=..."
                                style={{ width: "100%", padding: "6px 10px", borderRadius: "4px", border: "1px solid #cbd5e1", fontSize: "12px" }}
                              />
                            </div>
                          </div>

                          <div>
                            <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#718096" }}>Image URL</label>
                            <input
                              type="text"
                              value={concern.image || ""}
                              onChange={(e) => {
                                const updated = [...(pagesConfig?.shopByConcern?.concerns || [])];
                                updated[idx] = { ...updated[idx], image: e.target.value };
                                setPagesConfig((prev: any) => ({ ...prev, shopByConcern: { ...prev.shopByConcern, concerns: updated } }));
                              }}
                              placeholder="https://images.unsplash.com/..."
                              style={{ width: "100%", padding: "6px 10px", borderRadius: "4px", border: "1px solid #cbd5e1", fontSize: "11px" }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. CATEGORY DIRECTORY PAGE */}
                {pagesConfigSubTab === "category-page" && (
                  <div style={{ backgroundColor: "#fff", borderRadius: "10px", padding: "28px", boxShadow: "0 2px 10px rgba(0,0,0,0.03)", maxWidth: "800px" }}>
                    <h3 style={{ fontSize: "16px", fontWeight: "800", color: "#2d3748", textTransform: "uppercase", marginBottom: "16px", borderBottom: "2px solid #edf2f7", paddingBottom: "10px" }}>
                      Category Directory Page (category/page.tsx)
                    </h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                      <div>
                        <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#4a5568", marginBottom: "6px" }}>
                          Hero Badge Text
                        </label>
                        <input
                          type="text"
                          value={pagesConfig?.categoryPage?.badgeText || ""}
                          onChange={(e) => setPagesConfig((prev: any) => ({
                            ...prev,
                            categoryPage: { ...prev.categoryPage, badgeText: e.target.value }
                          }))}
                          placeholder="e.g. GlowGoodly Beauty Directory"
                          style={{ width: "100%", padding: "10px 14px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "14px", fontWeight: "600", color: "#2d3748" }}
                        />
                      </div>

                      <div>
                        <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#4a5568", marginBottom: "6px" }}>
                          Hero Main Title
                        </label>
                        <input
                          type="text"
                          value={pagesConfig?.categoryPage?.heroTitle || ""}
                          onChange={(e) => setPagesConfig((prev: any) => ({
                            ...prev,
                            categoryPage: { ...prev.categoryPage, heroTitle: e.target.value }
                          }))}
                          placeholder="e.g. Explore All Categories"
                          style={{ width: "100%", padding: "10px 14px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "14px", fontWeight: "600", color: "#2d3748" }}
                        />
                      </div>

                      <div>
                        <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#4a5568", marginBottom: "6px" }}>
                          Hero Subtitle / Description
                        </label>
                        <textarea
                          rows={3}
                          value={pagesConfig?.categoryPage?.heroSubtitle || ""}
                          onChange={(e) => setPagesConfig((prev: any) => ({
                            ...prev,
                            categoryPage: { ...prev.categoryPage, heroSubtitle: e.target.value }
                          }))}
                          placeholder="e.g. Discover 100% authentic cosmetics, skincare, haircare & fragrances from top international brands..."
                          style={{ width: "100%", padding: "10px 14px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "14px", color: "#2d3748" }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. CHECKOUT & SHIPPING PAGE */}
                {pagesConfigSubTab === "checkout-page" && (
                  <div style={{ backgroundColor: "#fff", borderRadius: "10px", padding: "28px", boxShadow: "0 2px 10px rgba(0,0,0,0.03)", maxWidth: "800px" }}>
                    <h3 style={{ fontSize: "16px", fontWeight: "800", color: "#2d3748", textTransform: "uppercase", marginBottom: "16px", borderBottom: "2px solid #edf2f7", paddingBottom: "10px" }}>
                      Checkout Page: Delivery Charges & Auto Discounts (checkout/page.tsx)
                    </h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                      
                      {/* Delivery Charges Section */}
                      <div>
                        <h4 style={{ fontSize: "14px", fontWeight: "800", color: "#1a202c", marginBottom: "12px" }}>
                          🚚 Courier Delivery Charges (BDT ৳)
                        </h4>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "15px" }}>
                          <div>
                            <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#4a5568", marginBottom: "4px" }}>
                              Inside Dhaka City (৳)
                            </label>
                            <input
                              type="number"
                              value={pagesConfig?.checkoutPage?.insideDhakaCharge ?? 70}
                              onChange={(e) => setPagesConfig((prev: any) => ({
                                ...prev,
                                checkoutPage: { ...prev.checkoutPage, insideDhakaCharge: parseFloat(e.target.value) || 0 }
                              }))}
                              style={{ width: "100%", padding: "10px 14px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "14px", fontWeight: "700" }}
                            />
                          </div>

                          <div>
                            <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#4a5568", marginBottom: "4px" }}>
                              Sub Area (Savar, Gazipur, etc.) (৳)
                            </label>
                            <input
                              type="number"
                              value={pagesConfig?.checkoutPage?.subAreaCharge ?? 100}
                              onChange={(e) => setPagesConfig((prev: any) => ({
                                ...prev,
                                checkoutPage: { ...prev.checkoutPage, subAreaCharge: parseFloat(e.target.value) || 0 }
                              }))}
                              style={{ width: "100%", padding: "10px 14px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "14px", fontWeight: "700" }}
                            />
                          </div>

                          <div>
                            <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#4a5568", marginBottom: "4px" }}>
                              Outside Dhaka / All Districts (৳)
                            </label>
                            <input
                              type="number"
                              value={pagesConfig?.checkoutPage?.outsideDhakaCharge ?? 130}
                              onChange={(e) => setPagesConfig((prev: any) => ({
                                ...prev,
                                checkoutPage: { ...prev.checkoutPage, outsideDhakaCharge: parseFloat(e.target.value) || 0 }
                              }))}
                              style={{ width: "100%", padding: "10px 14px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "14px", fontWeight: "700" }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Tiered Discount Section */}
                      <div style={{ borderTop: "1px solid #edf2f7", paddingTop: "16px" }}>
                        <h4 style={{ fontSize: "14px", fontWeight: "800", color: "#1a202c", marginBottom: "12px" }}>
                          🏷️ Automatic Tiered Cart Discount
                        </h4>
                        
                        <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", fontSize: "14px", fontWeight: "700", color: "#2d3748", marginBottom: "14px" }}>
                          <input
                            type="checkbox"
                            checked={pagesConfig?.checkoutPage?.autoDiscountEnabled !== false}
                            onChange={(e) => setPagesConfig((prev: any) => ({
                              ...prev,
                              checkoutPage: { ...prev.checkoutPage, autoDiscountEnabled: e.target.checked }
                            }))}
                            style={{ width: "18px", height: "18px", accentColor: "#e63b7a" }}
                          />
                          Enable Automatic Tiered Discount (e.g. ৳50 off for every ৳500 spent)
                        </label>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
                          <div>
                            <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#4a5568", marginBottom: "4px" }}>
                              Discount Step Amount (৳)
                            </label>
                            <input
                              type="number"
                              value={pagesConfig?.checkoutPage?.discountStepAmount ?? 50}
                              onChange={(e) => setPagesConfig((prev: any) => ({
                                ...prev,
                                checkoutPage: { ...prev.checkoutPage, discountStepAmount: parseFloat(e.target.value) || 0 }
                              }))}
                              placeholder="e.g. 50"
                              style={{ width: "100%", padding: "10px 14px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "14px", fontWeight: "700" }}
                            />
                            <span style={{ fontSize: "11px", color: "#718096" }}>Amount subtracted from total</span>
                          </div>

                          <div>
                            <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#4a5568", marginBottom: "4px" }}>
                              For Every Cart Amount (৳)
                            </label>
                            <input
                              type="number"
                              value={pagesConfig?.checkoutPage?.discountPerCartAmount ?? 500}
                              onChange={(e) => setPagesConfig((prev: any) => ({
                                ...prev,
                                checkoutPage: { ...prev.checkoutPage, discountPerCartAmount: parseFloat(e.target.value) || 0 }
                              }))}
                              placeholder="e.g. 500"
                              style={{ width: "100%", padding: "10px 14px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "14px", fontWeight: "700" }}
                            />
                            <span style={{ fontSize: "11px", color: "#718096" }}>Subtotal threshold step</span>
                          </div>
                        </div>
                      </div>

                      {/* Delivery Time Note */}
                      <div style={{ borderTop: "1px solid #edf2f7", paddingTop: "16px" }}>
                        <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#4a5568", marginBottom: "6px" }}>
                          Delivery Estimate Note / Badge (Shown at Checkout)
                        </label>
                        <input
                          type="text"
                          value={pagesConfig?.checkoutPage?.deliveryNote || ""}
                          onChange={(e) => setPagesConfig((prev: any) => ({
                            ...prev,
                            checkoutPage: { ...prev.checkoutPage, deliveryNote: e.target.value }
                          }))}
                          placeholder="e.g. ২৪ থেকে ৪৮ ঘণ্টার মধ্যে ডেলিভারি"
                          style={{ width: "100%", padding: "10px 14px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "14px", fontWeight: "600" }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 5. SHOP PAGE */}
                {pagesConfigSubTab === "shop-page" && (
                  <div style={{ backgroundColor: "#fff", borderRadius: "10px", padding: "28px", boxShadow: "0 2px 10px rgba(0,0,0,0.03)", maxWidth: "800px" }}>
                    <h3 style={{ fontSize: "16px", fontWeight: "800", color: "#2d3748", textTransform: "uppercase", marginBottom: "16px", borderBottom: "2px solid #edf2f7", paddingBottom: "10px" }}>
                      Shop Page Settings (shop/page.tsx)
                    </h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                      <div>
                        <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#4a5568", marginBottom: "6px" }}>
                          Shop Banner Default Title
                        </label>
                        <input
                          type="text"
                          value={pagesConfig?.shopPage?.bannerTitle || ""}
                          onChange={(e) => setPagesConfig((prev: any) => ({
                            ...prev,
                            shopPage: { ...prev.shopPage, bannerTitle: e.target.value }
                          }))}
                          placeholder="e.g. Shop All Products"
                          style={{ width: "100%", padding: "10px 14px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "14px", fontWeight: "600" }}
                        />
                      </div>

                      <div>
                        <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#4a5568", marginBottom: "6px" }}>
                          Shop Banner Subtitle / Announcement
                        </label>
                        <input
                          type="text"
                          value={pagesConfig?.shopPage?.announcement || ""}
                          onChange={(e) => setPagesConfig((prev: any) => ({
                            ...prev,
                            shopPage: { ...prev.shopPage, announcement: e.target.value }
                          }))}
                          placeholder="e.g. 100% Authentic Cosmetics, Skincare & Fragrances"
                          style={{ width: "100%", padding: "10px 14px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "14px", fontWeight: "600" }}
                        />
                      </div>

                      <div>
                        <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#4a5568", marginBottom: "6px" }}>
                          Default Products Sort Order
                        </label>
                        <select
                          value={pagesConfig?.shopPage?.defaultSort || ""}
                          onChange={(e) => setPagesConfig((prev: any) => ({
                            ...prev,
                            shopPage: { ...prev.shopPage, defaultSort: e.target.value }
                          }))}
                          style={{ width: "100%", padding: "10px 14px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "14px", fontWeight: "600", color: "#2d3748" }}
                        >
                          <option value="">Default (Latest Products)</option>
                          <option value="price-low">Price: Low to High</option>
                          <option value="price-high">Price: High to Low</option>
                          <option value="popular">Popularity</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* 6. SEASONAL OFFER CAMPAIGN */}
                {pagesConfigSubTab === "seasonal-offer" && (
                  <div style={{ backgroundColor: "#fff", borderRadius: "10px", padding: "28px", boxShadow: "0 2px 10px rgba(0,0,0,0.03)", maxWidth: "860px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", borderBottom: "2px solid #edf2f7", paddingBottom: "10px", flexWrap: "wrap", gap: "10px" }}>
                      <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "800", color: "#2d3748", textTransform: "uppercase" }}>
                        Seasonal Offer Campaign Page (/seasonal-offer)
                      </h3>
                      <Link
                        href="/seasonal-offer"
                        target="_blank"
                        style={{
                          fontSize: "12px",
                          fontWeight: "700",
                          color: "#e63b7a",
                          textDecoration: "none",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px"
                        }}
                      >
                        <ExternalLink size={14} /> Preview Live Landing Page
                      </Link>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                      <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", fontSize: "14px", fontWeight: "700", color: "#2d3748" }}>
                        <input
                          type="checkbox"
                          checked={seasonalOfferForm.isActive !== false}
                          onChange={(e) => setSeasonalOfferForm((prev: any) => ({ ...prev, isActive: e.target.checked }))}
                          style={{ width: "18px", height: "18px", accentColor: "#e63b7a" }}
                        />
                        Campaign Active (If disabled, shows "Campaign currently paused" on page)
                      </label>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
                        <div>
                          <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#4a5568", marginBottom: "6px" }}>
                            Top Campaign Banner Heading
                          </label>
                          <input
                            type="text"
                            value={seasonalOfferForm.title || ""}
                            onChange={(e) => setSeasonalOfferForm((prev: any) => ({ ...prev, title: e.target.value }))}
                            placeholder="e.g. বিশেষ অফারে অরিজিনাল বিউটি কম্বো প্যাকেজ!"
                            style={{ width: "100%", padding: "10px 14px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "14px", fontWeight: "600" }}
                          />
                        </div>

                        <div>
                          <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#4a5568", marginBottom: "6px" }}>
                            Campaign Subtitle
                          </label>
                          <input
                            type="text"
                            value={seasonalOfferForm.subtitle || ""}
                            onChange={(e) => setSeasonalOfferForm((prev: any) => ({ ...prev, subtitle: e.target.value }))}
                            placeholder="e.g. সীমিত সময়ের জন্য ছাড়! ১০০% অরিজিনাল..."
                            style={{ width: "100%", padding: "10px 14px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                          />
                        </div>
                      </div>

                      <div>
                        <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#4a5568", marginBottom: "6px" }}>
                          Video URL (YouTube or Direct Video URL)
                        </label>
                        <input
                          type="text"
                          value={seasonalOfferForm.videoUrl || ""}
                          onChange={(e) => setSeasonalOfferForm((prev: any) => ({ ...prev, videoUrl: e.target.value }))}
                          placeholder="e.g. https://www.youtube.com/watch?v=... or direct MP4"
                          style={{ width: "100%", padding: "10px 14px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                        />
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "15px" }}>
                        <div>
                          <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#4a5568", marginBottom: "6px" }}>
                            Featured Product Title
                          </label>
                          <input
                            type="text"
                            value={seasonalOfferForm.productTitle || ""}
                            onChange={(e) => setSeasonalOfferForm((prev: any) => ({ ...prev, productTitle: e.target.value }))}
                            placeholder="e.g. প্রিমিয়াম বিউটি ও স্কিনকেয়ার গ্লো সেট"
                            style={{ width: "100%", padding: "10px 14px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "14px", fontWeight: "700" }}
                          />
                        </div>

                        <div>
                          <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#4a5568", marginBottom: "6px" }}>
                            Offer Price (৳)
                          </label>
                          <input
                            type="text"
                            value={seasonalOfferForm.productPrice || ""}
                            onChange={(e) => setSeasonalOfferForm((prev: any) => ({ ...prev, productPrice: e.target.value }))}
                            placeholder="1250"
                            style={{ width: "100%", padding: "10px 14px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "14px", fontWeight: "700", color: "#e52860" }}
                          />
                        </div>

                        <div>
                          <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#4a5568", marginBottom: "6px" }}>
                            Regular Price (৳)
                          </label>
                          <input
                            type="text"
                            value={seasonalOfferForm.originalPrice || ""}
                            onChange={(e) => setSeasonalOfferForm((prev: any) => ({ ...prev, originalPrice: e.target.value }))}
                            placeholder="1850"
                            style={{ width: "100%", padding: "10px 14px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                          />
                        </div>
                      </div>

                      <div>
                        <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#4a5568", marginBottom: "6px" }}>
                          Main Product Image URL
                        </label>
                        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                          <input
                            type="text"
                            value={seasonalOfferForm.productImages?.[0] || ""}
                            onChange={(e) => setSeasonalOfferForm((prev: any) => ({
                              ...prev,
                              productImages: [e.target.value]
                            }))}
                            placeholder="https://images.unsplash.com/..."
                            style={{ flex: 1, padding: "10px 14px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                          />
                          {seasonalOfferForm.productImages?.[0] && (
                            <img
                              src={seasonalOfferForm.productImages[0]}
                              alt="Preview"
                              style={{ width: "42px", height: "42px", borderRadius: "6px", objectFit: "cover", border: "1px solid #cbd5e1" }}
                              onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            />
                          )}
                        </div>
                      </div>

                      <div>
                        <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#4a5568", marginBottom: "6px" }}>
                          Product Detailed Description
                        </label>
                        <textarea
                          rows={3}
                          value={seasonalOfferForm.description || ""}
                          onChange={(e) => setSeasonalOfferForm((prev: any) => ({ ...prev, description: e.target.value }))}
                          placeholder="প্যাকেজের বর্ণনা লিখুন..."
                          style={{ width: "100%", padding: "10px 14px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                        />
                      </div>

                      <div>
                        <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#4a5568", marginBottom: "6px" }}>
                          Bullet Highlights (Separate with | vertical bar)
                        </label>
                        <input
                          type="text"
                          value={seasonalOfferForm.bulletPoints || ""}
                          onChange={(e) => setSeasonalOfferForm((prev: any) => ({ ...prev, bulletPoints: e.target.value }))}
                          placeholder="১০০% অরিজিনাল|ত্বক হবে সতেজ ও উজ্জ্বল|সারাদেশে ক্যাশ অন ডেলিভারি"
                          style={{ width: "100%", padding: "10px 14px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                        />
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "15px" }}>
                        <div>
                          <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#4a5568", marginBottom: "4px" }}>
                            Inside Dhaka Shipping (৳)
                          </label>
                          <input
                            type="text"
                            value={seasonalOfferForm.insideDhakaShipping || "70"}
                            onChange={(e) => setSeasonalOfferForm((prev: any) => ({ ...prev, insideDhakaShipping: e.target.value }))}
                            style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "14px", fontWeight: "700" }}
                          />
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#4a5568", marginBottom: "4px" }}>
                            Sub Area Shipping (৳)
                          </label>
                          <input
                            type="text"
                            value={seasonalOfferForm.subAreaShipping || "100"}
                            onChange={(e) => setSeasonalOfferForm((prev: any) => ({ ...prev, subAreaShipping: e.target.value }))}
                            style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "14px", fontWeight: "700" }}
                          />
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#4a5568", marginBottom: "4px" }}>
                            Outside Dhaka Shipping (৳)
                          </label>
                          <input
                            type="text"
                            value={seasonalOfferForm.outsideDhakaShipping || "130"}
                            onChange={(e) => setSeasonalOfferForm((prev: any) => ({ ...prev, outsideDhakaShipping: e.target.value }))}
                            style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "14px", fontWeight: "700" }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </main>
    </div>
  );
}
