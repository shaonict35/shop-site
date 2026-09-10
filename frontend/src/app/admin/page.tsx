"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useApp } from "../../context/AppContext";
import { API_BASE, clearAllCache, triggerGlobalDataSync } from "../../utils/api";
import ReCaptcha from "../../components/ReCaptcha";
import CloudflareTurnstile from "../../components/CloudflareTurnstile";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar 
} from 'recharts';
import { 
  Home, ShoppingCart, Users, Package, Star, Image as ImageIcon, Settings, Bell, Search, Grid, 
  Activity, Layout, Layers, Box, Calendar, User, FileText, CheckSquare, MessageSquare, Menu, 
  LogOut, ExternalLink, ChevronDown, Mail, Plus, Edit, Trash2, ArrowLeft, RefreshCw, Upload, Eye, Check, X, ShieldCheck
} from 'lucide-react';
import SocketIoPromoBroadcaster from "../../components/SocketIoPromoBroadcaster";

export const DEFAULT_FRONTEND_BANNERS = [
  // Hero Sliders (Frontend Defaults)
  {
    id: "default-hero-1",
    title: "Nirvana Hero Slider Banner",
    page: "Hero Slides",
    imageUrl: "/images/sliders/slider-1.png",
    mobileImageUrl: "/images/sliders/slider-1.png",
    tabletImageUrl: "/images/sliders/slider-1.png",
    linkUrl: "/shop",
    bgColor: "#1a1a2e",
    isActive: true,
    sortOrder: 1,
    source: "frontend"
  },
  {
    id: "default-hero-2",
    title: "Unilever Campaign Banner",
    page: "Hero Slides",
    imageUrl: "/images/sliders/slider-2.png",
    mobileImageUrl: "/images/sliders/slider-2.png",
    tabletImageUrl: "/images/sliders/slider-2.png",
    linkUrl: "/shop",
    bgColor: "#1a1a2e",
    isActive: true,
    sortOrder: 2,
    source: "frontend"
  },
  {
    id: "default-hero-3",
    title: "Treasure of Glow Web Slider",
    page: "Hero Slides",
    imageUrl: "/images/sliders/slider-3.png",
    mobileImageUrl: "/images/sliders/slider-3.png",
    tabletImageUrl: "/images/sliders/slider-3.png",
    linkUrl: "/shop",
    bgColor: "#1a1a2e",
    isActive: true,
    sortOrder: 3,
    source: "frontend"
  },
  // Deals You Cannot Miss (4 Cards)
  {
    id: "default-deal-1",
    title: "Deal Card 1 - Ombre 30% Off",
    page: "Deal Card 1",
    imageUrl: "/images/deals/deal-1.png",
    mobileImageUrl: "/images/deals/deal-1.png",
    tabletImageUrl: "/images/deals/deal-1.png",
    linkUrl: "/shop?deal=ombre",
    bgColor: "#ffffff",
    isActive: true,
    sortOrder: 1,
    source: "frontend"
  },
  {
    id: "default-deal-2",
    title: "Deal Card 2 - Marico Free Delivery",
    page: "Deal Card 2",
    imageUrl: "/images/deals/deal-2.png",
    mobileImageUrl: "/images/deals/deal-2.png",
    tabletImageUrl: "/images/deals/deal-2.png",
    linkUrl: "/shop?deal=marico",
    bgColor: "#ffffff",
    isActive: true,
    sortOrder: 2,
    source: "frontend"
  },
  {
    id: "default-deal-3",
    title: "Deal Card 3 - PNS Campaign",
    page: "Deal Card 3",
    imageUrl: "/images/deals/deal-3.gif",
    mobileImageUrl: "/images/deals/deal-3.gif",
    tabletImageUrl: "/images/deals/deal-3.gif",
    linkUrl: "/shop?deal=pns",
    bgColor: "#ffffff",
    isActive: true,
    sortOrder: 3,
    source: "frontend"
  },
  {
    id: "default-deal-4",
    title: "Deal Card 4 - Senora Deal",
    page: "Deal Card 4",
    imageUrl: "/images/deals/deal-4.jpg",
    mobileImageUrl: "/images/deals/deal-4.jpg",
    tabletImageUrl: "/images/deals/deal-4.jpg",
    linkUrl: "/shop?deal=senora",
    bgColor: "#ffffff",
    isActive: true,
    sortOrder: 4,
    source: "frontend"
  },
  // Top Brands & Offers
  {
    id: "default-brand-1",
    title: "Brand Offer 1 - The Ordinary",
    page: "Brand Offer 1",
    imageUrl: "/images/brands/brand-offer-1.png",
    mobileImageUrl: "/images/brands/brand-offer-1.png",
    tabletImageUrl: "/images/brands/brand-offer-1.png",
    linkUrl: "/shop?brand=the-ordinary",
    bgColor: "#ffffff",
    isActive: true,
    sortOrder: 1,
    source: "frontend"
  },
  {
    id: "default-brand-2",
    title: "Brand Offer 2 - Skin Cafe",
    page: "Brand Offer 2",
    imageUrl: "/images/brands/brand-offer-2.gif",
    mobileImageUrl: "/images/brands/brand-offer-2.gif",
    tabletImageUrl: "/images/brands/brand-offer-2.gif",
    linkUrl: "/shop?brand=skin-cafe",
    bgColor: "#ffffff",
    isActive: true,
    sortOrder: 2,
    source: "frontend"
  },
  {
    id: "default-brand-5",
    title: "Brand Offer 5 - Treasure of Glow",
    page: "Brand Offer 5",
    imageUrl: "/images/brands/brand-offer-5.png",
    mobileImageUrl: "/images/brands/brand-offer-5.png",
    tabletImageUrl: "/images/brands/brand-offer-5.png",
    linkUrl: "/shop?brand=treasure-of-glow",
    bgColor: "#ffffff",
    isActive: true,
    sortOrder: 3,
    source: "frontend"
  },
  {
    id: "default-brand-6",
    title: "Brand Offer 6 - Trimmer Offer",
    page: "Brand Offer 6",
    imageUrl: "/images/brands/brand-offer-6.gif",
    mobileImageUrl: "/images/brands/brand-offer-6.gif",
    tabletImageUrl: "/images/brands/brand-offer-6.gif",
    linkUrl: "/shop?category=trimmer",
    bgColor: "#ffffff",
    isActive: true,
    sortOrder: 4,
    source: "frontend"
  },
  // Campaign Banners
  {
    id: "default-camp-bogo",
    title: "BOGO Offer",
    page: "BOGO",
    imageUrl: "/images/deals/deal-1.png",
    mobileImageUrl: "/images/deals/deal-1.png",
    tabletImageUrl: "/images/deals/deal-1.png",
    linkUrl: "/shop?campaign=bogo",
    bgColor: "#ffffff",
    isActive: true,
    sortOrder: 1,
    source: "frontend"
  },
  {
    id: "default-camp-combo",
    title: "COMBO Offer",
    page: "COMBO",
    imageUrl: "/images/deals/deal-2.png",
    mobileImageUrl: "/images/deals/deal-2.png",
    tabletImageUrl: "/images/deals/deal-2.png",
    linkUrl: "/shop?campaign=combo",
    bgColor: "#ffffff",
    isActive: true,
    sortOrder: 2,
    source: "frontend"
  },
  {
    id: "default-camp-offers",
    title: "OFFERS",
    page: "OFFERS",
    imageUrl: "/images/deals/deal-3.gif",
    mobileImageUrl: "/images/deals/deal-3.gif",
    tabletImageUrl: "/images/deals/deal-3.gif",
    linkUrl: "/shop?campaign=offers",
    bgColor: "#ffffff",
    isActive: true,
    sortOrder: 3,
    source: "frontend"
  },
  {
    id: "default-camp-clearance",
    title: "Clearance SALE Offer",
    page: "Clearance SALE",
    imageUrl: "/images/deals/deal-4.jpg",
    mobileImageUrl: "/images/deals/deal-4.jpg",
    tabletImageUrl: "/images/deals/deal-4.jpg",
    linkUrl: "/shop?campaign=clearance",
    bgColor: "#ffffff",
    isActive: true,
    sortOrder: 4,
    source: "frontend"
  }
];

export default function AdminPage() {
  const { user, token, login, logout } = useApp();
  const [isAdmin, setIsAdmin] = useState(false);

  // Active Navigation Tab
  const [activeTab, setActiveTab] = useState<"dashboard" | "settings" | "orders" | "reviews" | "products" | "banners" | "categories" | "users" | "pages" | "marketing">("dashboard");

  // ─── CMS & POLICY PAGES MANAGEMENT STATES ─────────────────────────────────
  const [cmsPages, setCmsPages] = useState<any[]>([]);
  const [selectedCmsSlug, setSelectedCmsSlug] = useState<string>("contact");
  const [cmsPageForm, setCmsPageForm] = useState({ slug: "contact", title: "Contact Us & Customer Support", contentHtml: "", metaTitle: "", metaDescription: "" });
  const [cmsStatus, setCmsStatus] = useState<string>("");

  const fetchCmsPages = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/pages`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setCmsPages(data);
          const current = data.find((p: any) => p.slug === selectedCmsSlug);
          if (current) setCmsPageForm(current);
        }
      }
    } catch (e) {
      console.error("Error loading CMS pages:", e);
    }
  };

  const handleSaveCmsPage = async (e: React.FormEvent) => {
    e.preventDefault();
    setCmsStatus("Saving page content to database...");
    try {
      const res = await fetch(`${API_BASE}/admin/pages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(cmsPageForm)
      });
      const data = await res.json();
      if (res.ok) {
        setCmsStatus("✅ Page updated successfully! Changes are live across storefront.");
        clearAllCache();
        triggerGlobalDataSync();
        await fetchCmsPages();
        setTimeout(() => setCmsStatus(""), 4000);
      } else {
        setCmsStatus(`❌ Error: ${data.error || "Failed to save page"}`);
      }
    } catch (err: any) {
      setCmsStatus(`❌ Error: ${err.message || "Network error"}`);
    }
  };

  // ─── BANNER / HOMEPAGE IMAGES MANAGEMENT STATES ───────────────────────────
  const [banners, setBanners] = useState<any[]>([]);
  const [bannerForm, setBannerForm] = useState({
    id: "",
    title: "",
    page: "Hero Slides",
    imageUrl: "",
    mobileImageUrl: "",
    linkUrl: "/shop",
    bgColor: "#1a1a2e",
    isActive: true,
    sortOrder: "0"
  });
  const [isEditingBanner, setIsEditingBanner] = useState(false);
  const [bannerMessage, setBannerMessage] = useState("");
  const [bannerFilter, setBannerFilter] = useState("all");

  // ─── CATEGORIES & BRANDS MANAGEMENT STATES ────────────────────────────────
  const [categoryForm, setCategoryForm] = useState({ id: "", name: "", imageUrl: "", parentId: "" });
  const [isEditingCategory, setIsEditingCategory] = useState(false);
  const [categorySearch, setCategorySearch] = useState("");
  const [categoryMessage, setCategoryMessage] = useState("");
  const [brandForm, setBrandForm] = useState({ id: "", name: "", logoUrl: "", originCountry: "International" });
  const [isEditingBrand, setIsEditingBrand] = useState(false);
  const [brandSearch, setBrandSearch] = useState("");
  const [brandMessage, setBrandMessage] = useState("");

  // ─── USERS & STAFF MANAGEMENT STATES ──────────────────────────────────────
  const [usersList, setUsersList] = useState<any[]>([]);
  const [userSearch, setUserSearch] = useState("");

  // ─── PRODUCTS MANAGEMENT STATES ───────────────────────────────────────────
  const [adminProducts, setAdminProducts] = useState<any[]>([]);
  const [adminCategories, setAdminCategories] = useState<any[]>([]);
  const [adminBrands, setAdminBrands] = useState<any[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [productCategoryFilter, setProductCategoryFilter] = useState("");
  const [isEditingProduct, setIsEditingProduct] = useState(false);
  const [productMessage, setProductMessage] = useState("");
  const [productForm, setProductForm] = useState({
    id: "",
    name: "",
    description: "",
    price: "",
    discountPrice: "",
    costPrice: "",
    stock: "50",
    categoryId: "",
    brandId: "",
    imageUrl: "",
    campaignName: "",
    status: "Active"
  });

  // ─── LOGIN STATES ─────────────────────────────────────────────────────────
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  // ─── ORDERS STATES ────────────────────────────────────────────────────────
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [orderSearch, setOrderSearch] = useState("");

  // ─── REVIEWS STATES ───────────────────────────────────────────────────────
  const [pendingReviews, setPendingReviews] = useState<any[]>([]);

  // ─── INTEGRATION & BRANDING SETTINGS ──────────────────────────────────────
  const [settings, setSettings] = useState({
    SITE_TITLE: "",
    SITE_DESCRIPTION: "",
    SITE_FAVICON: "",
    SITE_LOGO: "",
    META_PIXEL_ID: "",
    META_CAPI_TOKEN: "",
    GA4_MEASUREMENT_ID: "",
    GTM_CONTAINER_ID: "",
    SMS_PROVIDER_URL: "",
    SMS_API_KEY: "",
    SMS_SENDER_ID: "",
    SMS_TEMPLATE_ORDER_PLACED: "",
    SMS_TEMPLATE_ORDER_SHIPPED: "",
    COURIER_PROVIDER: "Steadfast",
    COURIER_API_SECRET: "",
    COURIER_CLIENT_ID: "",
    COURIER_STORE_ID: "",
    PAYMENT_MERCHANT_ID: "",
    PAYMENT_PASSWORD: "",
  });
  const [settingsMessage, setSettingsMessage] = useState("");

  // ─── ROLE CHECK ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (user && ["SuperAdmin", "Manager", "Salesman"].includes(user.role)) {
      setIsAdmin(true);
    } else {
      setIsAdmin(false);
    }
  }, [user]);

  // ─── DATA FETCHING ────────────────────────────────────────────────────────
  const fetchSettingsAndOrders = async () => {
    if (!token) return;
    try {
      const [settingsRes, ordersRes] = await Promise.all([
        fetch(`${API_BASE}/settings`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE}/orders/all`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      if (settingsRes.ok) {
        const settingsData = await settingsRes.json();
        setSettings(prev => ({ ...prev, ...settingsData }));
      }
      if (ordersRes.ok) {
        setOrders(await ordersRes.json());
      }
    } catch (e) {
      console.error("Error loading admin dashboard details", e);
    }
  };

  const fetchPendingReviews = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/admin/reviews`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setPendingReviews(await res.json());
    } catch (e) {}
  };

  const fetchBanners = async () => {
    try {
      const res = await fetch(`${API_BASE}/banners/all?t=${Date.now()}`);
      let dbBanners: any[] = [];
      if (res.ok) {
        const data = await res.json();
        dbBanners = Array.isArray(data) ? data : [];
      } else {
        const fbRes = await fetch(`${API_BASE}/banners?t=${Date.now()}`);
        if (fbRes.ok) {
          const fbData = await fbRes.json();
          dbBanners = Array.isArray(fbData) ? fbData : [];
        }
      }

      // Merge frontend defaults with online database records
      const merged: any[] = [];
      const matchedDbIds = new Set<string>();

      for (const def of DEFAULT_FRONTEND_BANNERS) {
        const match = dbBanners.find((b: any) => 
          b.id === def.id || 
          (b.page && def.page && b.page.toLowerCase().trim() === def.page.toLowerCase().trim() && (def.page.includes("Hero") ? b.sortOrder === def.sortOrder : true))
        );
        if (match) {
          merged.push({ ...def, ...match, source: "database" });
          matchedDbIds.add(match.id);
        } else {
          merged.push({ ...def, source: "frontend" });
        }
      }

      // Append any custom database banners
      for (const b of dbBanners) {
        if (!matchedDbIds.has(b.id) && !merged.some(m => m.id === b.id)) {
          merged.push({ ...b, source: "database" });
        }
      }

      setBanners(merged);
    } catch (e) {
      console.error("Error fetching banners:", e);
      setBanners(DEFAULT_FRONTEND_BANNERS);
    }
  };

  const fetchProductsList = async () => {
    try {
      // Fetch ALL products from connected database without pagination limit
      const res = await fetch(`${API_BASE}/admin/products?all=true&limit=2000&t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        setAdminProducts(Array.isArray(data) ? data : []);
      } else {
        const fallbackRes = await fetch(`${API_BASE}/products?all=true&limit=2000&t=${Date.now()}`);
        if (fallbackRes.ok) {
          const fbData = await fallbackRes.json();
          setAdminProducts(Array.isArray(fbData) ? fbData : []);
        }
      }
    } catch (e) {
      console.error("Error fetching products list:", e);
    }
  };

  const fetchCategoriesAndBrands = async () => {
    try {
      const [catRes, brandRes] = await Promise.all([
        fetch(`${API_BASE}/categories?t=${Date.now()}`),
        fetch(`${API_BASE}/brands?t=${Date.now()}`)
      ]);
      if (catRes.ok) setAdminCategories(await catRes.json());
      if (brandRes.ok) setAdminBrands(await brandRes.json());
    } catch (e) {}
  };

  useEffect(() => {
    if (isAdmin) {
      fetchSettingsAndOrders();
      fetchPendingReviews();
      fetchBanners();
      fetchProductsList();
      fetchCategoriesAndBrands();
      fetchUsersList();
      fetchCmsPages();
    }
  }, [isAdmin, token]);

  // ─── PRODUCT ACTIONS ──────────────────────────────────────────────────────
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setProductMessage("");
    try {
      const method = isEditingProduct ? "PUT" : "POST";
      const endpoint = isEditingProduct ? `${API_BASE}/products/${productForm.id}` : `${API_BASE}/products`;
      
      const payload: any = {
        name: productForm.name,
        description: productForm.description,
        categoryId: productForm.categoryId,
        brandId: productForm.brandId,
        imageUrl: productForm.imageUrl,
        price: parseFloat(productForm.price) || 0,
        discountPrice: productForm.discountPrice ? parseFloat(productForm.discountPrice) : null,
        costPrice: productForm.costPrice ? parseFloat(productForm.costPrice) : null,
        stock: parseInt(productForm.stock, 10) || 0,
        campaignName: productForm.campaignName || null,
        status: productForm.status || "Active"
      };

      const res = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setProductMessage(isEditingProduct ? "✅ Product updated successfully!" : "✅ Product created successfully!");
        setProductForm({
          id: "", name: "", description: "", price: "", discountPrice: "", costPrice: "",
          stock: "50", categoryId: productForm.categoryId || "", brandId: productForm.brandId || "",
          imageUrl: "", campaignName: "", status: "Active"
        });
        setIsEditingProduct(false);
        clearAllCache();
        triggerGlobalDataSync();
        await fetchProductsList();
        setTimeout(() => setProductMessage(""), 4000);
      } else {
        const err = await res.json();
        alert(err.error || "Failed to save product.");
      }
    } catch (e: any) {
      alert("Error saving product: " + (e.message || e));
    }
  };

  const handleDeleteProduct = async (prodId: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      const res = await fetch(`${API_BASE}/products/${prodId}`, {
        method: "DELETE",
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
      });
      if (res.ok) {
        clearAllCache();
        triggerGlobalDataSync();
        await fetchProductsList();
      } else {
        alert("Failed to delete product.");
      }
    } catch (e) {
      alert("Error deleting product.");
    }
  };

  // Helper for image upload -> converts file to Base64
  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>, target: "product" | "banner" | "logo" | "favicon" | "category" | "brand") => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      if (target === "product") {
        setProductForm(prev => ({ ...prev, imageUrl: result }));
      } else if (target === "banner") {
        setBannerForm(prev => ({ ...prev, imageUrl: result }));
      } else if (target === "logo") {
        setSettings(prev => ({ ...prev, SITE_LOGO: result }));
      } else if (target === "favicon") {
        setSettings(prev => ({ ...prev, SITE_FAVICON: result }));
      } else if (target === "category") {
        setCategoryForm(prev => ({ ...prev, imageUrl: result }));
      } else if (target === "brand") {
        setBrandForm(prev => ({ ...prev, logoUrl: result }));
      }
    };
    reader.readAsDataURL(file);
  };

  // ─── CATEGORY & BRAND ACTIONS ─────────────────────────────────────────────
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setCategoryMessage("");
    try {
      const res = await fetch(`${API_BASE}/categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(categoryForm)
      });
      if (res.ok) {
        setCategoryMessage(isEditingCategory ? "✅ Category updated successfully!" : "✅ Category saved successfully!");
        setCategoryForm({ id: "", name: "", imageUrl: "", parentId: "" });
        setIsEditingCategory(false);
        clearAllCache();
        triggerGlobalDataSync();
        await fetchCategoriesAndBrands();
        setTimeout(() => setCategoryMessage(""), 4000);
      } else {
        const err = await res.json();
        alert(err.error || "Failed to save category");
      }
    } catch (e: any) {
      alert("Error saving category: " + (e.message || e));
    }
  };

  const handleDeleteCategory = async (catId: string) => {
    if (!confirm("Are you sure you want to delete this category?")) return;
    try {
      const res = await fetch(`${API_BASE}/categories/${catId}`, { method: "DELETE" });
      if (res.ok) {
        clearAllCache();
        triggerGlobalDataSync();
        await fetchCategoriesAndBrands();
      } else {
        alert("Failed to delete category");
      }
    } catch (e) {
      alert("Error deleting category");
    }
  };

  const handleSaveBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    setBrandMessage("");
    try {
      const res = await fetch(`${API_BASE}/brands`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(brandForm)
      });
      if (res.ok) {
        setBrandMessage(isEditingBrand ? "✅ Brand updated successfully in database!" : "✅ Brand saved successfully to database!");
        setBrandForm({ id: "", name: "", logoUrl: "", originCountry: "International" });
        setIsEditingBrand(false);
        clearAllCache();
        triggerGlobalDataSync();
        await fetchCategoriesAndBrands();
        setTimeout(() => setBrandMessage(""), 4000);
      } else {
        const err = await res.json();
        alert(err.error || "Failed to save brand");
      }
    } catch (e: any) {
      alert("Error saving brand: " + (e.message || e));
    }
  };

  const handleDeleteBrand = async (brandId: string) => {
    if (!confirm("Are you sure you want to delete this brand?")) return;
    try {
      const res = await fetch(`${API_BASE}/brands/${brandId}`, { method: "DELETE" });
      if (res.ok) {
        clearAllCache();
        triggerGlobalDataSync();
        await fetchCategoriesAndBrands();
      } else {
        alert("Failed to delete brand");
      }
    } catch (e) {
      alert("Error deleting brand");
    }
  };

  // ─── USER & STAFF ACTIONS ──────────────────────────────────────────────────
  const fetchUsersList = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/admin/users?t=${Date.now()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUsersList(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error("Error fetching users list:", e);
    }
  };

  const handleUpdateUserRole = async (userId: string, newRole: string) => {
    try {
      const res = await fetch(`${API_BASE}/admin/users/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ role: newRole })
      });
      if (res.ok) {
        setUsersList(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
      } else {
        alert("Failed to update user role");
      }
    } catch (e) {
      alert("Error updating user role");
    }
  };

  const handleUpdateUserStatus = async (userId: string, newStatus: string) => {
    try {
      const res = await fetch(`${API_BASE}/admin/users/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        setUsersList(prev => prev.map(u => u.id === userId ? { ...u, status: newStatus } : u));
      } else {
        alert("Failed to update user status");
      }
    } catch (e) {
      alert("Error updating user status");
    }
  };

  // ─── BANNER ACTIONS ───────────────────────────────────────────────────────
  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    setBannerMessage("");
    try {
      const existingInDb = banners.find(b => 
        (bannerForm.id && b.id === bannerForm.id && !b.id.startsWith("default-")) ||
        (b.page && bannerForm.page && b.page.toLowerCase().trim() === bannerForm.page.toLowerCase().trim() && b.id && !b.id.startsWith("default-"))
      );
      const isCustomDbItem = Boolean(existingInDb);
      const targetId = existingInDb ? existingInDb.id : bannerForm.id;
      const method = isCustomDbItem ? "PUT" : "POST";
      const endpoint = isCustomDbItem ? `${API_BASE}/banners/${targetId}` : `${API_BASE}/banners`;
      
      const payload = {
        title: bannerForm.title,
        page: bannerForm.page,
        imageUrl: bannerForm.imageUrl,
        mobileImageUrl: bannerForm.mobileImageUrl || bannerForm.imageUrl,
        linkUrl: bannerForm.linkUrl,
        bgColor: bannerForm.bgColor || "#1a1a2e",
        isActive: bannerForm.isActive,
        sortOrder: Number(bannerForm.sortOrder) || 0
      };

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setBannerMessage(isEditingBanner ? "✅ Banner updated successfully in database!" : "✅ Banner created successfully in database!");
        setBannerForm({
          id: "",
          title: "",
          page: bannerForm.page || "Hero Slides",
          imageUrl: "",
          mobileImageUrl: "",
          linkUrl: "/shop",
          bgColor: "#1a1a2e",
          isActive: true,
          sortOrder: "0"
        });
        setIsEditingBanner(false);
        clearAllCache();
        triggerGlobalDataSync();
        await fetchBanners();
        setTimeout(() => setBannerMessage(""), 4000);
      } else {
        const err = await res.json();
        alert(err.error || "Failed to save banner.");
      }
    } catch (e: any) {
      alert("Error saving banner: " + (e.message || e));
    }
  };

  const handleEditBannerClick = (b: any) => {
    setIsEditingBanner(true);
    setBannerForm({
      id: b.id,
      title: b.title || "",
      page: b.page || "Hero Slides",
      imageUrl: b.imageUrl || "",
      mobileImageUrl: b.mobileImageUrl || "",
      linkUrl: b.linkUrl || "/shop",
      bgColor: b.bgColor || "#1a1a2e",
      isActive: b.isActive !== false,
      sortOrder: String(b.sortOrder ?? "0")
    });
    // Scroll form into view
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeleteBanner = async (bannerId: string) => {
    if (!confirm("Are you sure you want to delete this promotional banner?")) return;
    try {
      if (bannerId.startsWith("default-")) {
        alert("This is a built-in frontend banner template. To hide or change it, click 'Edit / Change Image' and update it.");
        return;
      }
      const res = await fetch(`${API_BASE}/banners/${bannerId}`, { method: "DELETE" });
      if (res.ok) {
        clearAllCache();
        triggerGlobalDataSync();
        await fetchBanners();
      } else {
        alert("Failed to delete banner.");
      }
    } catch (e) {
      alert("Error deleting banner.");
    }
  };

  // ─── LOGIN ACTION ─────────────────────────────────────────────────────────
  const [captchaToken, setCaptchaToken] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email: email.trim(), 
          password, 
          recaptchaToken: captchaToken || "cf_turnstile_verified" 
        })
      });
      const data = await res.json();
      if (res.ok) {
        if (["SuperAdmin", "Manager", "Salesman"].includes(data.user.role)) {
          login(data.user, data.token);
        } else {
          setLoginError("Access denied: You are not authorized to view the admin panel.");
        }
      } else {
        setLoginError(data.error || "Login failed.");
        if (typeof window !== "undefined" && window.grecaptcha) {
          try {
            window.grecaptcha.reset();
            setCaptchaToken("");
          } catch (e) {}
        }
      }
    } catch (e) {
      setLoginError("Connection error. Please verify the backend API is online.");
    }
  };

  // ─── SETTINGS ACTIONS ─────────────────────────────────────────────────────
  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsMessage("");
    try {
      const res = await fetch(`${API_BASE}/settings/bulk`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(settings)
      });
      if (res.ok) {
        clearAllCache();
        triggerGlobalDataSync();
        setSettingsMessage("✅ Settings saved successfully! Changes are live across storefront.");
        setTimeout(() => setSettingsMessage(""), 4000);
      } else {
        setSettingsMessage("❌ Failed to save settings.");
      }
    } catch (e) {
      setSettingsMessage("Error saving settings.");
    }
  };

  // ─── ORDER ACTIONS ────────────────────────────────────────────────────────
  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    try {
      const res = await fetch(`${API_BASE}/orders/${orderId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, orderStatus: status, trackingLink: data.order?.trackingLink || o.trackingLink } : o));
        if (selectedOrder?.id === orderId) {
          setSelectedOrder((prev: any) => ({ ...prev, orderStatus: status, trackingLink: data.order?.trackingLink || prev.trackingLink }));
        }
      }
    } catch (e) {
      console.error("Error updating order status", e);
    }
  };

  const handleApproveReview = async (reviewId: string) => {
    try {
      const res = await fetch(`${API_BASE}/admin/reviews/${reviewId}/approve`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setPendingReviews(prev => prev.filter(r => r.id !== reviewId));
      }
    } catch (e) {
      console.error("Error approving review", e);
    }
  };

  // Filtered Products for Catalog Table
  const filteredProducts = useMemo(() => {
    return adminProducts.filter(p => {
      // Exclude explicitly deleted
      if (p.status && p.status.toLowerCase() === "deleted") return false;
      const matchesSearch = !productSearch || 
        p.name?.toLowerCase().includes(productSearch.toLowerCase()) || 
        p.variants?.some((v: any) => v.sku?.toLowerCase().includes(productSearch.toLowerCase()));
      const matchesCat = !productCategoryFilter || p.categoryId === productCategoryFilter;
      return matchesSearch && matchesCat;
    });
  }, [adminProducts, productSearch, productCategoryFilter]);

  // Filtered Banners
  const filteredBanners = useMemo(() => {
    if (bannerFilter === "all") return banners;
    return banners.filter(b => b.page?.toLowerCase().includes(bannerFilter.toLowerCase()));
  }, [banners, bannerFilter]);

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    if (!orderSearch) return orders;
    const term = orderSearch.toLowerCase();
    return orders.filter(o => 
      o.orderNumber?.toLowerCase().includes(term) ||
      o.customerName?.toLowerCase().includes(term) ||
      o.customerPhone?.toLowerCase().includes(term)
    );
  }, [orders, orderSearch]);

  // Filtered Users
  const filteredUsers = useMemo(() => {
    if (!userSearch) return usersList;
    const term = userSearch.toLowerCase();
    return usersList.filter(u => 
      u.name?.toLowerCase().includes(term) ||
      u.email?.toLowerCase().includes(term) ||
      u.phone?.toLowerCase().includes(term)
    );
  }, [usersList, userSearch]);

  // Sales Chart Data
  const monthlySalesChartData = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months.map((mName, idx) => {
      const monthPrefix = `${currentYear}-${String(idx + 1).padStart(2, '0')}`;
      const mOrders = orders.filter((o: any) => (o.createdAt || '').slice(0, 7) === monthPrefix);
      const total = mOrders.reduce((sum: number, o: any) => sum + (o.total || 0), 0);
      return { name: mName, sales: total };
    });
  }, [orders]);

  // ─── LOGIN SCREEN ─────────────────────────────────────────────────────────
  if (!isAdmin) {
    return (
      <main style={{ padding: "100px 20px", display: "flex", justifyContent: "center", minHeight: "100vh", backgroundColor: "#f4f5fa", fontFamily: "system-ui, sans-serif" }}>
        <form onSubmit={handleLogin} style={{ width: "100%", maxWidth: "420px", backgroundColor: "#fff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "35px", boxShadow: "0 10px 25px rgba(0,0,0,0.06)", display: "flex", flexDirection: "column", gap: "18px", height: "fit-content" }}>
          <div style={{ textAlign: "center", marginBottom: "5px", display: "flex", flexDirection: "column", alignItems: "center" }}>
            <img src="/user-glow-logo.png" alt="GlowGoodly" style={{ width: "56px", height: "56px", objectFit: "contain", marginBottom: "8px" }} />
            <h1 style={{ fontSize: "24px", fontWeight: "800", color: "#e63b7a", margin: 0 }}>GlowGoodly Admin</h1>
            <p style={{ fontSize: "13px", color: "#64748b", marginTop: "6px" }}>Sign in to manage database, products & homepage</p>
          </div>

          <div>
            <label style={{ fontSize: "12px", fontWeight: "700", color: "#334155", display: "block", marginBottom: "6px" }}>Admin Email</label>
            <input type="email" placeholder="admin@glowgoodly.com" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ width: "100%", padding: "11px 14px", border: "1.5px solid #cbd5e1", borderRadius: "8px", fontSize: "14px", outline: "none" }} />
          </div>

          <div>
            <label style={{ fontSize: "12px", fontWeight: "700", color: "#334155", display: "block", marginBottom: "6px" }}>Password</label>
            <input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ width: "100%", padding: "11px 14px", border: "1.5px solid #cbd5e1", borderRadius: "8px", fontSize: "14px", outline: "none" }} />
          </div>

          {/* Cloudflare Turnstile Security Verification Box */}
          <div style={{ display: "flex", justifyContent: "center", margin: "4px 0" }}>
            <CloudflareTurnstile 
              onVerify={(token) => { setCaptchaToken(token); setLoginError(""); }} 
              onExpire={() => setCaptchaToken("")} 
            />
          </div>

          {loginError && <div style={{ color: "#e11d48", backgroundColor: "#ffe4e6", padding: "10px", borderRadius: "6px", fontSize: "13px", fontWeight: "600" }}>{loginError}</div>}

          <button type="submit" style={{ backgroundColor: "#2b3344", color: "#fff", fontWeight: "800", padding: "13px", borderRadius: "8px", cursor: "pointer", textAlign: "center", border: "none", fontSize: "14px", letterSpacing: "0.5px" }}>
            SIGN IN TO DASHBOARD
          </button>
          
          <Link href="/" style={{ textDecoration: "underline", color: "#64748b", fontSize: "13px", fontWeight: "600", textAlign: "center", marginTop: "6px" }}>
            ← Return to Storefront
          </Link>
        </form>
      </main>
    );
  }

  // ─── ADMIN DASHBOARD INTERFACE ────────────────────────────────────────────
  return (
    <div className="admin-layout" style={{ display: "flex", minHeight: "100vh", backgroundColor: "#f8fafc", fontFamily: "system-ui, sans-serif" }}>
      {/* Sidebar */}
      <aside className="admin-sidebar" style={{ width: "260px", backgroundColor: "#1e293b", color: "#fff", display: "flex", flexDirection: "column", flexShrink: 0 }}>
        <div style={{ padding: "24px 20px", display: "flex", alignItems: "center", gap: "10px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
          <Layers style={{ color: "#00c6ff" }} size={24} />
          <div>
            <div style={{ fontWeight: "800", fontSize: "18px", letterSpacing: "0.5px" }}>GlowGoodly</div>
            <div style={{ fontSize: "11px", color: "#94a3b8" }}>Store Manager & CMS</div>
          </div>
        </div>

        <div style={{ padding: "15px 12px", display: "flex", flexDirection: "column", gap: "5px", flex: 1, overflowY: "auto" }}>
          <div 
            onClick={() => setActiveTab("dashboard")} 
            style={{ padding: "12px 16px", borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center", gap: "12px", fontSize: "14px", fontWeight: "600", backgroundColor: activeTab === "dashboard" ? "#00c6ff" : "transparent", color: activeTab === "dashboard" ? "#fff" : "#cbd5e1" }}
          >
            <Home size={18} /> Dashboard
          </div>

          <div style={{ fontSize: "11px", fontWeight: "800", color: "#64748b", textTransform: "uppercase", letterSpacing: "1px", padding: "16px 16px 6px 16px" }}>
            Store Catalog & Media
          </div>

          <div 
            onClick={() => { setActiveTab("products"); fetchProductsList(); }} 
            style={{ padding: "12px 16px", borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "14px", fontWeight: "600", backgroundColor: activeTab === "products" ? "#00c6ff" : "transparent", color: activeTab === "products" ? "#fff" : "#cbd5e1" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <Package size={18} /> Products
            </div>
            <span style={{ fontSize: "11px", backgroundColor: "rgba(255,255,255,0.2)", padding: "2px 7px", borderRadius: "10px" }}>{adminProducts.length}</span>
          </div>

          <div 
            onClick={() => { setActiveTab("banners"); fetchBanners(); }} 
            style={{ padding: "12px 16px", borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "14px", fontWeight: "600", backgroundColor: activeTab === "banners" ? "#00c6ff" : "transparent", color: activeTab === "banners" ? "#fff" : "#cbd5e1" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <ImageIcon size={18} /> Homepage Banners
            </div>
            <span style={{ fontSize: "11px", backgroundColor: "rgba(255,255,255,0.2)", padding: "2px 7px", borderRadius: "10px" }}>{banners.length}</span>
          </div>

          <div 
            onClick={() => { setActiveTab("categories"); fetchCategoriesAndBrands(); }} 
            style={{ padding: "12px 16px", borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center", gap: "12px", fontSize: "14px", fontWeight: "600", backgroundColor: activeTab === "categories" ? "#00c6ff" : "transparent", color: activeTab === "categories" ? "#fff" : "#cbd5e1" }}
          >
            <Grid size={18} /> Categories & Brands
          </div>

          <div style={{ fontSize: "11px", fontWeight: "800", color: "#64748b", textTransform: "uppercase", letterSpacing: "1px", padding: "16px 16px 6px 16px" }}>
            Sales & Customers
          </div>

          <div 
            onClick={() => setActiveTab("orders")} 
            style={{ padding: "12px 16px", borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "14px", fontWeight: "600", backgroundColor: activeTab === "orders" ? "#00c6ff" : "transparent", color: activeTab === "orders" ? "#fff" : "#cbd5e1" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <ShoppingCart size={18} /> Orders
            </div>
            <span style={{ fontSize: "11px", backgroundColor: "rgba(255,255,255,0.2)", padding: "2px 7px", borderRadius: "10px" }}>{orders.length}</span>
          </div>

          <div 
            onClick={() => setActiveTab("reviews")} 
            style={{ padding: "12px 16px", borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "14px", fontWeight: "600", backgroundColor: activeTab === "reviews" ? "#00c6ff" : "transparent", color: activeTab === "reviews" ? "#fff" : "#cbd5e1" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <Star size={18} /> Reviews
            </div>
            {pendingReviews.length > 0 && <span style={{ fontSize: "11px", backgroundColor: "#e11d48", padding: "2px 7px", borderRadius: "10px" }}>{pendingReviews.length}</span>}
          </div>

          <div 
            onClick={() => { setActiveTab("users"); fetchUsersList(); }} 
            style={{ padding: "12px 16px", borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "14px", fontWeight: "600", backgroundColor: activeTab === "users" ? "#00c6ff" : "transparent", color: activeTab === "users" ? "#fff" : "#cbd5e1" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <Users size={18} /> Users & Staff
            </div>
            <span style={{ fontSize: "11px", backgroundColor: "rgba(255,255,255,0.2)", padding: "2px 7px", borderRadius: "10px" }}>{usersList.length}</span>
          </div>

          <div 
            onClick={() => { setActiveTab("pages"); fetchCmsPages(); }} 
            style={{ padding: "12px 16px", borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center", gap: "12px", fontSize: "14px", fontWeight: "600", backgroundColor: activeTab === "pages" ? "#00c6ff" : "transparent", color: activeTab === "pages" ? "#fff" : "#cbd5e1" }}
          >
            <FileText size={18} /> Website Policy Pages
          </div>

          <div 
            onClick={() => setActiveTab("marketing")} 
            style={{ padding: "12px 16px", borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center", gap: "12px", fontSize: "14px", fontWeight: "600", backgroundColor: activeTab === "marketing" ? "#00c6ff" : "transparent", color: activeTab === "marketing" ? "#fff" : "#cbd5e1" }}
          >
            <Bell size={18} /> Live Marketing & Socket
          </div>

          <div 
            onClick={() => setActiveTab("settings")} 
            style={{ padding: "12px 16px", borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center", gap: "12px", fontSize: "14px", fontWeight: "600", backgroundColor: activeTab === "settings" ? "#00c6ff" : "transparent", color: activeTab === "settings" ? "#fff" : "#cbd5e1" }}
          >
            <Settings size={18} /> Settings & SEO
          </div>
        </div>

        <div style={{ padding: "15px 20px", borderTop: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: "12px", color: "#94a3b8" }}>
            Signed in as <strong>{user?.name || "Admin"}</strong>
          </div>
          <button onClick={() => { logout(); window.location.href = "/"; }} title="Log out" style={{ background: "none", border: "none", color: "#f43f5e", cursor: "pointer", padding: "4px" }}>
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflowY: "auto" }}>
        {/* Top Header Bar */}
        <header style={{ height: "64px", backgroundColor: "#fff", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 30px", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: "800", color: "#1e293b", margin: 0, textTransform: "capitalize" }}>
              {activeTab === "banners" ? "Homepage Banners & Media" : activeTab === "users" ? "Store Users & Access" : activeTab}
            </h2>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
            <Link href="/" target="_blank" style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: "700", color: "#00c6ff", textDecoration: "none", border: "1px solid #00c6ff", padding: "6px 14px", borderRadius: "6px" }}>
              <ExternalLink size={15} /> View Storefront
            </Link>
            <button onClick={() => { clearAllCache(); triggerGlobalDataSync(); alert("Storefront cache cleared! Live data synchronized."); }} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: "700", backgroundColor: "#f1f5f9", color: "#475569", border: "1px solid #cbd5e1", padding: "6px 14px", borderRadius: "6px", cursor: "pointer" }}>
              <RefreshCw size={14} /> Clear Cache
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div style={{ padding: "30px", flex: 1 }}>

          {/* ═══════════════════════════════════════════════════════════════════
              TAB: DASHBOARD
          ════════════════════════════════════════════════════════════════════ */}
          {activeTab === "dashboard" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "25px" }}>
              {/* Stat Cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "20px" }}>
                <div style={{ backgroundColor: "#fff", borderRadius: "12px", padding: "20px", border: "1px solid #e2e8f0", boxShadow: "0 2px 8px rgba(0,0,0,0.02)", display: "flex", alignItems: "center", gap: "16px" }}>
                  <div style={{ width: "48px", height: "48px", borderRadius: "10px", backgroundColor: "#eff6ff", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Package size={24} />
                  </div>
                  <div>
                    <div style={{ fontSize: "12px", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>Database Products</div>
                    <div style={{ fontSize: "24px", fontWeight: "800", color: "#1e293b", marginTop: "2px" }}>{adminProducts.length}</div>
                  </div>
                </div>

                <div style={{ backgroundColor: "#fff", borderRadius: "12px", padding: "20px", border: "1px solid #e2e8f0", boxShadow: "0 2px 8px rgba(0,0,0,0.02)", display: "flex", alignItems: "center", gap: "16px" }}>
                  <div style={{ width: "48px", height: "48px", borderRadius: "10px", backgroundColor: "#f0fdf4", color: "#16a34a", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <ShoppingCart size={24} />
                  </div>
                  <div>
                    <div style={{ fontSize: "12px", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>Total Orders</div>
                    <div style={{ fontSize: "24px", fontWeight: "800", color: "#1e293b", marginTop: "2px" }}>{orders.length}</div>
                  </div>
                </div>

                <div style={{ backgroundColor: "#fff", borderRadius: "12px", padding: "20px", border: "1px solid #e2e8f0", boxShadow: "0 2px 8px rgba(0,0,0,0.02)", display: "flex", alignItems: "center", gap: "16px" }}>
                  <div style={{ width: "48px", height: "48px", borderRadius: "10px", backgroundColor: "#fdf2f8", color: "#db2777", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <ImageIcon size={24} />
                  </div>
                  <div>
                    <div style={{ fontSize: "12px", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>Homepage Banners</div>
                    <div style={{ fontSize: "24px", fontWeight: "800", color: "#1e293b", marginTop: "2px" }}>{banners.length}</div>
                  </div>
                </div>

                <div style={{ backgroundColor: "#fff", borderRadius: "12px", padding: "20px", border: "1px solid #e2e8f0", boxShadow: "0 2px 8px rgba(0,0,0,0.02)", display: "flex", alignItems: "center", gap: "16px" }}>
                  <div style={{ width: "48px", height: "48px", borderRadius: "10px", backgroundColor: "#faf5ff", color: "#9333ea", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Grid size={24} />
                  </div>
                  <div>
                    <div style={{ fontSize: "12px", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>Store Categories</div>
                    <div style={{ fontSize: "24px", fontWeight: "800", color: "#1e293b", marginTop: "2px" }}>{adminCategories.length}</div>
                  </div>
                </div>
              </div>

              {/* Monthly Sales Chart */}
              <div style={{ backgroundColor: "#fff", borderRadius: "12px", padding: "24px", border: "1px solid #e2e8f0" }}>
                <h3 style={{ fontSize: "16px", fontWeight: "800", color: "#1e293b", marginBottom: "16px" }}>Sales Overview ({new Date().getFullYear()})</h3>
                <div style={{ width: "100%", height: "280px" }}>
                  <ResponsiveContainer>
                    <AreaChart data={monthlySalesChartData}>
                      <defs>
                        <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#00c6ff" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#00c6ff" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
                      <YAxis tickLine={false} axisLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <RechartsTooltip />
                      <Area type="monotone" dataKey="sales" stroke="#00c6ff" strokeWidth={2} fillOpacity={1} fill="url(#salesGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Recent Orders Overview */}
              <div style={{ backgroundColor: "#fff", borderRadius: "12px", padding: "24px", border: "1px solid #e2e8f0" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                  <h3 style={{ fontSize: "16px", fontWeight: "800", color: "#1e293b", margin: 0 }}>Recent Store Orders</h3>
                  <button onClick={() => setActiveTab("orders")} style={{ background: "none", border: "none", color: "#00c6ff", fontWeight: "700", fontSize: "13px", cursor: "pointer" }}>
                    View All Orders →
                  </button>
                </div>

                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid #e2e8f0", color: "#64748b", fontSize: "12px", textTransform: "uppercase" }}>
                        <th style={{ padding: "10px 12px" }}>Order #</th>
                        <th style={{ padding: "10px 12px" }}>Customer</th>
                        <th style={{ padding: "10px 12px" }}>Phone</th>
                        <th style={{ padding: "10px 12px" }}>Total</th>
                        <th style={{ padding: "10px 12px" }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.slice(0, 6).map(o => (
                        <tr key={o.id} style={{ borderBottom: "1px solid #f1f5f9", fontSize: "13px" }}>
                          <td style={{ padding: "12px", fontWeight: "700", color: "#2563eb" }}>{o.orderNumber}</td>
                          <td style={{ padding: "12px" }}>{o.customerName}</td>
                          <td style={{ padding: "12px", color: "#64748b" }}>{o.customerPhone}</td>
                          <td style={{ padding: "12px", fontWeight: "700" }}>৳ {o.total}</td>
                          <td style={{ padding: "12px" }}>
                            <span style={{ fontSize: "11px", fontWeight: "800", padding: "3px 8px", borderRadius: "12px", backgroundColor: o.orderStatus === "Delivered" ? "#dcfce7" : o.orderStatus === "Shipped" ? "#e0f2fe" : "#fef3c7", color: o.orderStatus === "Delivered" ? "#15803d" : o.orderStatus === "Shipped" ? "#0369a1" : "#b45309" }}>
                              {o.orderStatus}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {orders.length === 0 && (
                        <tr>
                          <td colSpan={5} style={{ padding: "20px", textAlign: "center", color: "#94a3b8" }}>No orders placed yet.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════
              TAB: PRODUCTS (CATALOG MANAGEMENT)
          ════════════════════════════════════════════════════════════════════ */}
          {activeTab === "products" && (
            <div style={{ display: "flex", gap: "30px", flexWrap: "wrap", alignItems: "flex-start" }}>
              {/* Product Create / Edit Form */}
              <form onSubmit={handleSaveProduct} style={{ flex: "1 1 360px", maxWidth: "420px", backgroundColor: "#fff", borderRadius: "12px", padding: "24px", border: "1px solid #e2e8f0", boxShadow: "0 2px 10px rgba(0,0,0,0.02)", display: "flex", flexDirection: "column", gap: "14px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <h3 style={{ fontSize: "16px", fontWeight: "800", color: "#1e293b", margin: 0 }}>
                    {isEditingProduct ? "Edit Product" : "Add New Product"}
                  </h3>
                  {isEditingProduct && (
                    <button type="button" onClick={() => { setIsEditingProduct(false); setProductForm({ id: "", name: "", description: "", price: "", discountPrice: "", costPrice: "", stock: "50", categoryId: "", brandId: "", imageUrl: "", campaignName: "", status: "Active" }); }} style={{ background: "none", border: "none", color: "#ef4444", fontSize: "12px", fontWeight: "700", cursor: "pointer" }}>
                      Cancel
                    </button>
                  )}
                </div>

                {productMessage && <div style={{ padding: "10px", backgroundColor: "#ecfdf5", color: "#047857", borderRadius: "6px", fontSize: "13px", fontWeight: "600" }}>{productMessage}</div>}

                <div>
                  <label style={{ fontSize: "12px", fontWeight: "700", color: "#475569", display: "block", marginBottom: "4px" }}>Product Name *</label>
                  <input type="text" required placeholder="e.g. Maybelline Fit Me Matte Foundation" value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} style={{ width: "100%", padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px" }} />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ fontSize: "12px", fontWeight: "700", color: "#475569", display: "block", marginBottom: "4px" }}>Category *</label>
                    <select required value={productForm.categoryId} onChange={(e) => setProductForm({ ...productForm, categoryId: e.target.value })} style={{ width: "100%", padding: "10px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px" }}>
                      <option value="">Select Category</option>
                      {adminCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: "12px", fontWeight: "700", color: "#475569", display: "block", marginBottom: "4px" }}>Brand *</label>
                    <select required value={productForm.brandId} onChange={(e) => setProductForm({ ...productForm, brandId: e.target.value })} style={{ width: "100%", padding: "10px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px" }}>
                      <option value="">Select Brand</option>
                      {adminBrands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
                  <div>
                    <label style={{ fontSize: "12px", fontWeight: "700", color: "#475569", display: "block", marginBottom: "4px" }}>Price (৳) *</label>
                    <input type="number" required placeholder="1200" value={productForm.price} onChange={(e) => setProductForm({ ...productForm, price: e.target.value })} style={{ width: "100%", padding: "10px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px" }} />
                  </div>
                  <div>
                    <label style={{ fontSize: "12px", fontWeight: "700", color: "#475569", display: "block", marginBottom: "4px" }}>Discount Price</label>
                    <input type="number" placeholder="950" value={productForm.discountPrice} onChange={(e) => setProductForm({ ...productForm, discountPrice: e.target.value })} style={{ width: "100%", padding: "10px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px" }} />
                  </div>
                  <div>
                    <label style={{ fontSize: "12px", fontWeight: "700", color: "#475569", display: "block", marginBottom: "4px" }}>Stock</label>
                    <input type="number" required placeholder="50" value={productForm.stock} onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })} style={{ width: "100%", padding: "10px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px" }} />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: "12px", fontWeight: "700", color: "#475569", display: "block", marginBottom: "4px" }}>Product Image</label>
                  <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                    <input type="text" placeholder="Paste Image URL or select file →" value={productForm.imageUrl} onChange={(e) => setProductForm({ ...productForm, imageUrl: e.target.value })} style={{ flex: 1, padding: "9px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px" }} />
                    <label style={{ backgroundColor: "#f1f5f9", border: "1px solid #cbd5e1", padding: "8px 12px", borderRadius: "6px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", fontWeight: "700", color: "#334155" }}>
                      <Upload size={14} /> Upload
                      <input type="file" accept="image/*" onChange={(e) => handleImageFileUpload(e, "product")} style={{ display: "none" }} />
                    </label>
                  </div>
                  {productForm.imageUrl && (
                    <div style={{ width: "80px", height: "80px", borderRadius: "6px", border: "1px solid #cbd5e1", overflow: "hidden", backgroundColor: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <img src={productForm.imageUrl} alt="Preview" style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }} />
                    </div>
                  )}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ fontSize: "12px", fontWeight: "700", color: "#475569", display: "block", marginBottom: "4px" }}>Campaign</label>
                    <select value={productForm.campaignName} onChange={(e) => setProductForm({ ...productForm, campaignName: e.target.value })} style={{ width: "100%", padding: "10px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px" }}>
                      <option value="">None (Standard)</option>
                      <option value="BOGO">BOGO (Buy 1 Get 1)</option>
                      <option value="COMBO">COMBO Offer</option>
                      <option value="CLEARANCE">Clearance Sale</option>
                      <option value="EXCLUSIVE">Exclusive Deals</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: "12px", fontWeight: "700", color: "#475569", display: "block", marginBottom: "4px" }}>Status</label>
                    <select value={productForm.status} onChange={(e) => setProductForm({ ...productForm, status: e.target.value })} style={{ width: "100%", padding: "10px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px" }}>
                      <option value="Active">Active (Visible)</option>
                      <option value="Inactive">Inactive (Hidden)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: "12px", fontWeight: "700", color: "#475569", display: "block", marginBottom: "4px" }}>Description</label>
                  <textarea rows={3} placeholder="Product description, benefits, directions..." value={productForm.description} onChange={(e) => setProductForm({ ...productForm, description: e.target.value })} style={{ width: "100%", padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px" }} />
                </div>

                <button type="submit" style={{ backgroundColor: "#00c6ff", color: "#fff", border: "none", padding: "12px", borderRadius: "6px", fontWeight: "800", fontSize: "14px", cursor: "pointer", marginTop: "5px" }}>
                  {isEditingProduct ? "UPDATE PRODUCT" : "CREATE PRODUCT"}
                </button>
              </form>

              {/* Products List Table */}
              <div style={{ flex: "2 1 500px", backgroundColor: "#fff", borderRadius: "12px", padding: "24px", border: "1px solid #e2e8f0", boxShadow: "0 2px 10px rgba(0,0,0,0.02)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "15px", marginBottom: "20px" }}>
                  <div>
                    <h3 style={{ fontSize: "16px", fontWeight: "800", color: "#1e293b", margin: 0 }}>All Database Products ({filteredProducts.length})</h3>
                    <p style={{ fontSize: "12px", color: "#64748b", margin: "2px 0 0 0" }}>All items from your connected cPanel database</p>
                  </div>

                  <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", backgroundColor: "#f1f5f9", padding: "6px 12px", borderRadius: "6px", gap: "8px", border: "1px solid #cbd5e1" }}>
                      <Search size={15} color="#64748b" />
                      <input type="text" placeholder="Search by name or SKU..." value={productSearch} onChange={(e) => setProductSearch(e.target.value)} style={{ border: "none", background: "none", fontSize: "13px", outline: "none", width: "170px" }} />
                    </div>
                    <select value={productCategoryFilter} onChange={(e) => setProductCategoryFilter(e.target.value)} style={{ padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}>
                      <option value="">All Categories</option>
                      {adminCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "75vh", overflowY: "auto" }}>
                  {filteredProducts.map((p) => {
                    const variant = p.variants?.[0] || { price: 0, discountPrice: null, stock: 0 };
                    const image = p.images?.[0]?.url || p.imageUrl || "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&q=80";
                    return (
                      <div key={p.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", border: "1px solid #f1f5f9", borderRadius: "8px", backgroundColor: "#fff", gap: "15px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "14px", flex: 1, minWidth: 0 }}>
                          <img src={image} alt={p.name} style={{ width: "46px", height: "46px", borderRadius: "6px", objectFit: "cover", backgroundColor: "#f8fafc", flexShrink: 0 }} />
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: "14px", fontWeight: "700", color: "#1e293b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</div>
                            <div style={{ display: "flex", gap: "8px", alignItems: "center", marginTop: "3px", fontSize: "12px" }}>
                              <span style={{ color: "#0284c7", fontWeight: "700" }}>৳ {variant.discountPrice || variant.price}</span>
                              {variant.discountPrice && <span style={{ color: "#94a3b8", textDecoration: "line-through" }}>৳ {variant.price}</span>}
                              <span style={{ color: "#64748b" }}>• {p.category?.name || "Uncategorized"}</span>
                              {p.campaignName && <span style={{ backgroundColor: "#fce7f3", color: "#db2777", padding: "1px 6px", borderRadius: "4px", fontSize: "10px", fontWeight: "800" }}>{p.campaignName}</span>}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: "flex", gap: "8px", alignItems: "center", flexShrink: 0 }}>
                          <button onClick={() => {
                            setIsEditingProduct(true);
                            setProductForm({
                              id: p.id,
                              name: p.name || "",
                              description: p.description || "",
                              price: String(variant.price || ""),
                              discountPrice: variant.discountPrice ? String(variant.discountPrice) : "",
                              costPrice: variant.costPrice ? String(variant.costPrice) : "",
                              stock: String(variant.stock ?? 50),
                              categoryId: p.categoryId || "",
                              brandId: p.brandId || "",
                              imageUrl: image,
                              campaignName: p.campaignName || "",
                              status: p.status || "Active"
                            });
                          }} style={{ padding: "6px 12px", backgroundColor: "#f1f5f9", color: "#334155", border: "1px solid #cbd5e1", borderRadius: "6px", fontWeight: "700", fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
                            <Edit size={13} /> Edit
                          </button>
                          <button onClick={() => handleDeleteProduct(p.id)} style={{ padding: "6px 10px", backgroundColor: "#fee2e2", color: "#dc2626", border: "none", borderRadius: "6px", fontWeight: "700", fontSize: "12px", cursor: "pointer" }}>
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  {filteredProducts.length === 0 && (
                    <div style={{ textAlign: "center", padding: "40px 20px", color: "#94a3b8" }}>
                      No matching products found in the database.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════
              TAB: HOMEPAGE BANNERS & MEDIA (HERO SLIDERS, DEALS, CAMPAIGNS)
          ════════════════════════════════════════════════════════════════════ */}
          {activeTab === "banners" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "25px" }}>
              {/* Top Banner Control Form */}
              <div style={{ backgroundColor: "#fff", borderRadius: "12px", padding: "24px", border: "1px solid #e2e8f0", boxShadow: "0 2px 10px rgba(0,0,0,0.02)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                  <div>
                    <h3 style={{ fontSize: "16px", fontWeight: "800", color: "#1e293b", margin: 0 }}>
                      {isEditingBanner ? "Edit Homepage Banner / Image" : "Add / Replace Homepage Image"}
                    </h3>
                    <p style={{ fontSize: "12px", color: "#64748b", margin: "2px 0 0 0" }}>
                      Change Hero Sliders, Deals You Cannot Miss, Top Brand Offers, or Campaign Banners directly from here.
                    </p>
                  </div>
                  {isEditingBanner && (
                    <button type="button" onClick={() => { setIsEditingBanner(false); setBannerForm({ id: "", title: "", page: "Hero Slides", imageUrl: "", mobileImageUrl: "", linkUrl: "/shop", bgColor: "#1a1a2e", isActive: true, sortOrder: "0" }); }} style={{ background: "none", border: "none", color: "#ef4444", fontSize: "13px", fontWeight: "700", cursor: "pointer" }}>
                      Cancel Edit
                    </button>
                  )}
                </div>

                {bannerMessage && <div style={{ padding: "10px 14px", backgroundColor: "#ecfdf5", color: "#047857", borderRadius: "6px", fontSize: "13px", fontWeight: "700", marginBottom: "16px" }}>{bannerMessage}</div>}

                <form onSubmit={handleSaveBanner} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "16px", alignItems: "end" }}>
                  <div>
                    <label style={{ fontSize: "12px", fontWeight: "700", color: "#475569", display: "block", marginBottom: "4px" }}>Banner Placement (Where on Homepage) *</label>
                    <select required value={bannerForm.page} onChange={(e) => setBannerForm({ ...bannerForm, page: e.target.value })} style={{ width: "100%", padding: "10px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px" }}>
                      <optgroup label="Hero Sliders (Top of Homepage)">
                        <option value="Hero Slides">Hero Slides (Main Top Carousel Slide)</option>
                      </optgroup>
                      <optgroup label="Deals You Cannot Miss (4 Cards)">
                        <option value="Deal Card 1">Deal Card 1 (Ombre / Clearance Deal)</option>
                        <option value="Deal Card 2">Deal Card 2 (Marico / Skincare Deal)</option>
                        <option value="Deal Card 3">Deal Card 3 (PNS / Combo Deal)</option>
                        <option value="Deal Card 4">Deal Card 4 (Senora / Makeup Deal)</option>
                      </optgroup>
                      <optgroup label="Top Brands & Offers (Middle Section)">
                        <option value="Brand Offer 1">Brand Offer 1 (The Ordinary Offer)</option>
                        <option value="Brand Offer 2">Brand Offer 2 (Skin Cafe Offer)</option>
                        <option value="Brand Offer 5">Brand Offer 5 (Treasure of Glow Offer)</option>
                        <option value="Brand Offer 6">Brand Offer 6 (Trimmer Offer)</option>
                      </optgroup>
                      <optgroup label="Campaign Banners">
                        <option value="BOGO">BOGO (Buy 1 Get 1)</option>
                        <option value="COMBO">COMBO Deals</option>
                        <option value="OFFERS">Exclusive Offers</option>
                        <option value="Clearance SALE">Clearance Sale Banner</option>
                      </optgroup>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: "12px", fontWeight: "700", color: "#475569", display: "block", marginBottom: "4px" }}>Banner Title / Alt Tag *</label>
                    <input type="text" required placeholder="e.g. Nirvana Hero Slider" value={bannerForm.title} onChange={(e) => setBannerForm({ ...bannerForm, title: e.target.value })} style={{ width: "100%", padding: "10px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px" }} />
                  </div>

                  <div style={{ gridColumn: "span 2" }}>
                    <label style={{ fontSize: "12px", fontWeight: "700", color: "#475569", display: "block", marginBottom: "4px" }}>Desktop Image (URL or Upload from PC) *</label>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <input type="text" required placeholder="/images/sliders/slider-1.png or https://..." value={bannerForm.imageUrl} onChange={(e) => setBannerForm({ ...bannerForm, imageUrl: e.target.value })} style={{ flex: 1, padding: "10px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px" }} />
                      <label style={{ backgroundColor: "#0284c7", color: "#fff", padding: "10px 16px", borderRadius: "6px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: "700" }}>
                        <Upload size={16} /> Choose File
                        <input type="file" accept="image/*" onChange={(e) => handleImageFileUpload(e, "banner")} style={{ display: "none" }} />
                      </label>
                    </div>
                    {bannerForm.imageUrl && (
                      <div style={{ marginTop: "10px", padding: "8px", border: "1px solid #e2e8f0", borderRadius: "6px", backgroundColor: "#f8fafc", display: "flex", alignItems: "center", gap: "12px" }}>
                        <img src={bannerForm.imageUrl} alt="Banner Preview" style={{ width: "160px", height: "60px", objectFit: "cover", borderRadius: "4px" }} />
                        <span style={{ fontSize: "12px", color: "#64748b" }}>Live Preview for {bannerForm.page}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label style={{ fontSize: "12px", fontWeight: "700", color: "#475569", display: "block", marginBottom: "4px" }}>Click Link Destination</label>
                    <input type="text" placeholder="/shop?category=skincare" value={bannerForm.linkUrl} onChange={(e) => setBannerForm({ ...bannerForm, linkUrl: e.target.value })} style={{ width: "100%", padding: "10px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px" }} />
                  </div>

                  <div>
                    <label style={{ fontSize: "12px", fontWeight: "700", color: "#475569", display: "block", marginBottom: "4px" }}>Order Index</label>
                    <input type="number" placeholder="0" value={bannerForm.sortOrder} onChange={(e) => setBannerForm({ ...bannerForm, sortOrder: e.target.value })} style={{ width: "100%", padding: "10px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px" }} />
                  </div>

                  <button type="submit" style={{ padding: "12px 24px", backgroundColor: "#e63b7a", color: "#fff", border: "none", borderRadius: "6px", fontWeight: "800", fontSize: "14px", cursor: "pointer", height: "42px" }}>
                    {isEditingBanner ? "UPDATE BANNER" : "SAVE BANNER"}
                  </button>
                </form>
              </div>

              {/* Banners List Section */}
              <div style={{ backgroundColor: "#fff", borderRadius: "12px", padding: "24px", border: "1px solid #e2e8f0", boxShadow: "0 2px 10px rgba(0,0,0,0.02)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "15px", marginBottom: "20px" }}>
                  <div>
                    <h3 style={{ fontSize: "16px", fontWeight: "800", color: "#1e293b", margin: 0 }}>Active Store Banners & Cards ({filteredBanners.length})</h3>
                    <p style={{ fontSize: "12px", color: "#64748b", margin: "2px 0 0 0" }}>Click "Edit" on any banner to update its image or click link</p>
                  </div>

                  <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                    <select value={bannerFilter} onChange={(e) => setBannerFilter(e.target.value)} style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px", fontWeight: "600" }}>
                      <option value="all">All Placements</option>
                      <option value="Hero">Hero Sliders</option>
                      <option value="Deal">Deals You Cannot Miss</option>
                      <option value="Brand Offer">Top Brand Offers</option>
                      <option value="Campaign">Campaign Banners</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "16px" }}>
                  {filteredBanners.map(b => (
                    <div key={b.id} style={{ border: "1px solid #e2e8f0", borderRadius: "8px", overflow: "hidden", display: "flex", flexDirection: "column", backgroundColor: "#fff" }}>
                      <div style={{ width: "100%", height: "140px", backgroundColor: "#f8fafc", position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <img src={b.imageUrl} alt={b.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        <span style={{ position: "absolute", top: "8px", left: "8px", backgroundColor: "rgba(0,0,0,0.75)", color: "#fff", fontSize: "11px", fontWeight: "800", padding: "3px 8px", borderRadius: "4px" }}>
                          {b.page || "Homepage"}
                        </span>
                      </div>

                      <div style={{ padding: "14px", flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                        <div>
                          <div style={{ fontWeight: "700", fontSize: "14px", color: "#1e293b", marginBottom: "4px" }}>{b.title}</div>
                          <div style={{ fontSize: "12px", color: "#64748b", wordBreak: "break-all" }}>Link: {b.linkUrl || "None"}</div>
                        </div>

                        <div style={{ display: "flex", gap: "8px", marginTop: "14px" }}>
                          <button onClick={() => handleEditBannerClick(b)} style={{ flex: 1, padding: "7px", backgroundColor: "#f1f5f9", color: "#334155", border: "1px solid #cbd5e1", borderRadius: "6px", fontWeight: "700", fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
                            <Edit size={13} /> Edit / Change Image
                          </button>
                          <button onClick={() => handleDeleteBanner(b.id)} style={{ padding: "7px 12px", backgroundColor: "#fee2e2", color: "#dc2626", border: "none", borderRadius: "6px", fontWeight: "700", fontSize: "12px", cursor: "pointer" }}>
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {filteredBanners.length === 0 && (
                    <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "40px", color: "#94a3b8" }}>
                      No banners found in this category.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════
              TAB: CATEGORIES & BRANDS
          ════════════════════════════════════════════════════════════════════ */}
          {activeTab === "categories" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
              {/* Category Management */}
              <div style={{ display: "flex", gap: "25px", flexWrap: "wrap", alignItems: "flex-start" }}>
                {/* Add / Edit Category Form */}
                <form onSubmit={handleSaveCategory} style={{ flex: "1 1 320px", maxWidth: "400px", backgroundColor: "#fff", borderRadius: "12px", padding: "22px", border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <h3 style={{ fontSize: "16px", fontWeight: "800", color: "#1e293b", margin: 0 }}>
                      {isEditingCategory ? "Edit Category" : "Add Store Category"}
                    </h3>
                    {isEditingCategory && (
                      <button type="button" onClick={() => { setIsEditingCategory(false); setCategoryForm({ id: "", name: "", imageUrl: "", parentId: "" }); }} style={{ background: "none", border: "none", color: "#ef4444", fontSize: "12px", fontWeight: "700", cursor: "pointer" }}>
                        Cancel
                      </button>
                    )}
                  </div>

                  {categoryMessage && <div style={{ padding: "8px 12px", backgroundColor: "#ecfdf5", color: "#047857", borderRadius: "6px", fontSize: "13px", fontWeight: "600" }}>{categoryMessage}</div>}
                  
                  <div>
                    <label style={{ fontSize: "12px", fontWeight: "700", color: "#475569", display: "block", marginBottom: "4px" }}>Category Name *</label>
                    <input type="text" required placeholder="e.g. Skin Care, Hair Care" value={categoryForm.name} onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })} style={{ width: "100%", padding: "9px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px" }} />
                  </div>

                  <div>
                    <label style={{ fontSize: "12px", fontWeight: "700", color: "#475569", display: "block", marginBottom: "4px" }}>Parent Category (Optional)</label>
                    <select value={categoryForm.parentId} onChange={(e) => setCategoryForm({ ...categoryForm, parentId: e.target.value })} style={{ width: "100%", padding: "9px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px" }}>
                      <option value="">None (Top-level Category)</option>
                      {adminCategories.filter(c => !c.parentId && c.id !== categoryForm.id).map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: "12px", fontWeight: "700", color: "#475569", display: "block", marginBottom: "4px" }}>Category Image</label>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <input type="text" placeholder="URL or upload →" value={categoryForm.imageUrl} onChange={(e) => setCategoryForm({ ...categoryForm, imageUrl: e.target.value })} style={{ flex: 1, padding: "9px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px" }} />
                      <label style={{ backgroundColor: "#f1f5f9", border: "1px solid #cbd5e1", padding: "8px 12px", borderRadius: "6px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", fontWeight: "700", color: "#334155" }}>
                        <Upload size={14} /> Upload
                        <input type="file" accept="image/*" onChange={(e) => handleImageFileUpload(e, "category")} style={{ display: "none" }} />
                      </label>
                    </div>
                  </div>

                  <button type="submit" style={{ backgroundColor: "#00c6ff", color: "#fff", border: "none", padding: "10px", borderRadius: "6px", fontWeight: "800", fontSize: "13px", cursor: "pointer", marginTop: "4px" }}>
                    {isEditingCategory ? "UPDATE CATEGORY" : "ADD CATEGORY"}
                  </button>
                </form>

                {/* Categories List */}
                <div style={{ flex: "2 1 400px", backgroundColor: "#fff", borderRadius: "12px", padding: "22px", border: "1px solid #e2e8f0" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px", flexWrap: "wrap", gap: "10px" }}>
                    <h3 style={{ fontSize: "16px", fontWeight: "800", color: "#1e293b", margin: 0 }}>Active Categories ({adminCategories.length})</h3>
                    <input 
                      type="text" 
                      placeholder="Search categories..." 
                      value={categorySearch} 
                      onChange={(e) => setCategorySearch(e.target.value)} 
                      style={{ padding: "6px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "12px", outline: "none", width: "180px" }} 
                    />
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "60vh", overflowY: "auto" }}>
                    {adminCategories
                      .filter(cat => (cat.name || "").toLowerCase().includes(categorySearch.toLowerCase()))
                      .map(cat => (
                        <div key={cat.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", border: "1px solid #f1f5f9", borderRadius: "6px", backgroundColor: "#fff" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            {cat.imageUrl ? (
                              <img src={cat.imageUrl} alt={cat.name} style={{ width: "36px", height: "36px", borderRadius: "6px", objectFit: "cover" }} />
                            ) : (
                              <div style={{ width: "36px", height: "36px", borderRadius: "6px", backgroundColor: "#eff6ff", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <Grid size={16} />
                              </div>
                            )}
                            <div>
                              <div style={{ fontWeight: "700", fontSize: "13px", color: "#1e293b" }}>{cat.name}</div>
                              {cat.subCategories?.length > 0 && (
                                <div style={{ fontSize: "11px", color: "#64748b" }}>{cat.subCategories.length} Subcategories: {cat.subCategories.map((s: any) => s.name).join(", ")}</div>
                              )}
                            </div>
                          </div>
                          <div style={{ display: "flex", gap: "6px" }}>
                            <button 
                              type="button" 
                              onClick={() => { 
                                setCategoryForm({ id: cat.id, name: cat.name, imageUrl: cat.imageUrl || "", parentId: cat.parentId || "" }); 
                                setIsEditingCategory(true); 
                              }} 
                              style={{ padding: "5px 10px", backgroundColor: "#f1f5f9", color: "#334155", border: "1px solid #cbd5e1", borderRadius: "4px", cursor: "pointer", fontSize: "12px", fontWeight: "700", display: "flex", alignItems: "center", gap: "3px" }}
                            >
                              <Edit size={12} /> Edit
                            </button>
                            <button onClick={() => handleDeleteCategory(cat.id)} style={{ padding: "5px 8px", backgroundColor: "#fee2e2", color: "#dc2626", border: "none", borderRadius: "4px", cursor: "pointer" }} title="Delete category">
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>

              {/* Brand Management */}
              <div style={{ display: "flex", gap: "25px", flexWrap: "wrap", alignItems: "flex-start" }}>
                {/* Add / Edit Brand Form */}
                <form onSubmit={handleSaveBrand} style={{ flex: "1 1 320px", maxWidth: "400px", backgroundColor: "#fff", borderRadius: "12px", padding: "22px", border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <h3 style={{ fontSize: "16px", fontWeight: "800", color: "#1e293b", margin: 0 }}>
                      {isEditingBrand ? "Edit Store Brand" : "Add Store Brand"}
                    </h3>
                    {isEditingBrand && (
                      <button type="button" onClick={() => { setIsEditingBrand(false); setBrandForm({ id: "", name: "", logoUrl: "", originCountry: "International" }); }} style={{ background: "none", border: "none", color: "#ef4444", fontSize: "12px", fontWeight: "700", cursor: "pointer" }}>
                        Cancel
                      </button>
                    )}
                  </div>

                  {brandMessage && <div style={{ padding: "8px 12px", backgroundColor: "#ecfdf5", color: "#047857", borderRadius: "6px", fontSize: "13px", fontWeight: "600" }}>{brandMessage}</div>}
                  
                  <div>
                    <label style={{ fontSize: "12px", fontWeight: "700", color: "#475569", display: "block", marginBottom: "4px" }}>Brand Name *</label>
                    <input type="text" required placeholder="e.g. CeraVe, The Ordinary" value={brandForm.name} onChange={(e) => setBrandForm({ ...brandForm, name: e.target.value })} style={{ width: "100%", padding: "9px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px" }} />
                  </div>

                  <div>
                    <label style={{ fontSize: "12px", fontWeight: "700", color: "#475569", display: "block", marginBottom: "4px" }}>Origin Country</label>
                    <input type="text" placeholder="e.g. USA, South Korea, UK" value={brandForm.originCountry} onChange={(e) => setBrandForm({ ...brandForm, originCountry: e.target.value })} style={{ width: "100%", padding: "9px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px" }} />
                  </div>

                  <div>
                    <label style={{ fontSize: "12px", fontWeight: "700", color: "#475569", display: "block", marginBottom: "4px" }}>Brand Logo</label>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <input type="text" placeholder="URL or upload →" value={brandForm.logoUrl} onChange={(e) => setBrandForm({ ...brandForm, logoUrl: e.target.value })} style={{ flex: 1, padding: "9px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px" }} />
                      <label style={{ backgroundColor: "#f1f5f9", border: "1px solid #cbd5e1", padding: "8px 12px", borderRadius: "6px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", fontWeight: "700", color: "#334155" }}>
                        <Upload size={14} /> Upload
                        <input type="file" accept="image/*" onChange={(e) => handleImageFileUpload(e, "brand")} style={{ display: "none" }} />
                      </label>
                    </div>
                  </div>

                  <button type="submit" style={{ backgroundColor: "#00c6ff", color: "#fff", border: "none", padding: "10px", borderRadius: "6px", fontWeight: "800", fontSize: "13px", cursor: "pointer", marginTop: "4px" }}>
                    {isEditingBrand ? "UPDATE BRAND IN DATABASE" : "ADD BRAND TO DATABASE"}
                  </button>
                </form>

                {/* Brands List */}
                <div style={{ flex: "2 1 400px", backgroundColor: "#fff", borderRadius: "12px", padding: "22px", border: "1px solid #e2e8f0" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px", flexWrap: "wrap", gap: "10px" }}>
                    <h3 style={{ fontSize: "16px", fontWeight: "800", color: "#1e293b", margin: 0 }}>Active Brands ({adminBrands.length})</h3>
                    <input 
                      type="text" 
                      placeholder="Search brands in database..." 
                      value={brandSearch} 
                      onChange={(e) => setBrandSearch(e.target.value)} 
                      style={{ padding: "6px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "12px", outline: "none", width: "200px" }} 
                    />
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "60vh", overflowY: "auto" }}>
                    {adminBrands
                      .filter(b => 
                        (b.name || "").toLowerCase().includes(brandSearch.toLowerCase()) || 
                        (b.originCountry || "").toLowerCase().includes(brandSearch.toLowerCase())
                      )
                      .map(b => (
                        <div key={b.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", border: "1px solid #f1f5f9", borderRadius: "6px", backgroundColor: "#fff" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            {b.logoUrl ? (
                              <img src={b.logoUrl} alt={b.name} style={{ width: "40px", height: "26px", objectFit: "contain" }} />
                            ) : (
                              <div style={{ width: "36px", height: "36px", borderRadius: "6px", backgroundColor: "#fdf2f8", color: "#db2777", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <Star size={16} />
                              </div>
                            )}
                            <div>
                              <div style={{ fontWeight: "700", fontSize: "13px", color: "#1e293b" }}>{b.name}</div>
                              {b.originCountry && (
                                <div style={{ fontSize: "11px", color: "#64748b" }}>Origin: {b.originCountry}</div>
                              )}
                            </div>
                          </div>
                          <div style={{ display: "flex", gap: "6px" }}>
                            <button 
                              type="button" 
                              onClick={() => { 
                                setBrandForm({ id: b.id, name: b.name, logoUrl: b.logoUrl || "", originCountry: b.originCountry || "International" }); 
                                setIsEditingBrand(true); 
                              }} 
                              style={{ padding: "5px 10px", backgroundColor: "#f1f5f9", color: "#334155", border: "1px solid #cbd5e1", borderRadius: "4px", cursor: "pointer", fontSize: "12px", fontWeight: "700", display: "flex", alignItems: "center", gap: "3px" }}
                            >
                              <Edit size={12} /> Edit
                            </button>
                            <button onClick={() => handleDeleteBrand(b.id)} style={{ padding: "5px 8px", backgroundColor: "#fee2e2", color: "#dc2626", border: "none", borderRadius: "4px", cursor: "pointer" }} title="Delete brand">
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      ))}
                    {adminBrands.length === 0 && (
                      <div style={{ textAlign: "center", padding: "30px", color: "#94a3b8" }}>No brands found in database.</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════
              TAB: USERS & STAFF MANAGEMENT
          ════════════════════════════════════════════════════════════════════ */}
          {activeTab === "users" && (
            <div style={{ backgroundColor: "#fff", borderRadius: "12px", padding: "24px", border: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "15px", marginBottom: "20px" }}>
                <div>
                  <h3 style={{ fontSize: "16px", fontWeight: "800", color: "#1e293b", margin: 0 }}>Registered Users & Staff ({filteredUsers.length})</h3>
                  <p style={{ fontSize: "12px", color: "#64748b", margin: "2px 0 0 0" }}>Manage customer accounts, assign manager/admin roles, and monitor status</p>
                </div>

                <div style={{ display: "flex", alignItems: "center", backgroundColor: "#f1f5f9", padding: "6px 12px", borderRadius: "6px", gap: "8px", border: "1px solid #cbd5e1" }}>
                  <Search size={15} color="#64748b" />
                  <input type="text" placeholder="Search by name, email, phone..." value={userSearch} onChange={(e) => setUserSearch(e.target.value)} style={{ border: "none", background: "none", fontSize: "13px", outline: "none", width: "220px" }} />
                </div>
              </div>

              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #e2e8f0", color: "#64748b", fontSize: "12px", textTransform: "uppercase" }}>
                      <th style={{ padding: "10px 12px" }}>User</th>
                      <th style={{ padding: "10px 12px" }}>Contact</th>
                      <th style={{ padding: "10px 12px" }}>Role</th>
                      <th style={{ padding: "10px 12px" }}>Status</th>
                      <th style={{ padding: "10px 12px" }}>Points</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map(u => (
                      <tr key={u.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "12px" }}>
                          <div style={{ fontWeight: "700", color: "#1e293b" }}>{u.name || "Customer"}</div>
                          <div style={{ fontSize: "11px", color: "#94a3b8" }}>ID: {u.id}</div>
                        </td>
                        <td style={{ padding: "12px" }}>
                          <div style={{ color: "#334155" }}>{u.email}</div>
                          {u.phone && <div style={{ fontSize: "12px", color: "#64748b" }}>{u.phone}</div>}
                        </td>
                        <td style={{ padding: "12px" }}>
                          <select 
                            value={u.role || "Customer"} 
                            onChange={(e) => handleUpdateUserRole(u.id, e.target.value)}
                            style={{ padding: "5px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px", fontWeight: "700", backgroundColor: u.role === "SuperAdmin" ? "#fef3c7" : u.role === "Manager" ? "#e0f2fe" : "#fff", color: u.role === "SuperAdmin" ? "#b45309" : u.role === "Manager" ? "#0369a1" : "#334155" }}
                          >
                            <option value="Customer">Customer</option>
                            <option value="Salesman">Salesman</option>
                            <option value="Manager">Manager</option>
                            <option value="SuperAdmin">SuperAdmin</option>
                            <option value="Rider">Rider</option>
                          </select>
                        </td>
                        <td style={{ padding: "12px" }}>
                          <select 
                            value={u.status || "Active"} 
                            onChange={(e) => handleUpdateUserStatus(u.id, e.target.value)}
                            style={{ padding: "5px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px", fontWeight: "700", backgroundColor: u.status === "Active" ? "#dcfce7" : "#fee2e2", color: u.status === "Active" ? "#15803d" : "#dc2626" }}
                          >
                            <option value="Active">Active</option>
                            <option value="Suspicious">Suspicious</option>
                            <option value="Fraud">Fraud (Banned)</option>
                          </select>
                        </td>
                        <td style={{ padding: "12px", fontWeight: "700", color: "#0284c7" }}>
                          {u.points || 0} pts
                        </td>
                      </tr>
                    ))}
                    {filteredUsers.length === 0 && (
                      <tr>
                        <td colSpan={5} style={{ padding: "30px", textAlign: "center", color: "#94a3b8" }}>No users found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════
              TAB: ORDERS
          ════════════════════════════════════════════════════════════════════ */}
          {activeTab === "orders" && (
            <div style={{ display: "flex", gap: "30px", flexWrap: "wrap" }}>
              <div style={{ flex: "1.2 1 340px", backgroundColor: "#fff", borderRadius: "12px", padding: "24px", border: "1px solid #e2e8f0" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                  <h3 style={{ fontSize: "16px", fontWeight: "800", color: "#1e293b", margin: 0 }}>Orders ({filteredOrders.length})</h3>
                  <input type="text" placeholder="Search orders..." value={orderSearch} onChange={(e) => setOrderSearch(e.target.value)} style={{ padding: "6px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px" }} />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "75vh", overflowY: "auto" }}>
                  {filteredOrders.map(o => (
                    <div key={o.id} onClick={() => setSelectedOrder(o)} style={{ padding: "12px 14px", border: selectedOrder?.id === o.id ? "2px solid #00c6ff" : "1px solid #e2e8f0", borderRadius: "8px", cursor: "pointer", backgroundColor: selectedOrder?.id === o.id ? "#f0fdfa" : "#fff", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <strong style={{ fontSize: "13px", color: "#0369a1", display: "block" }}>{o.orderNumber}</strong>
                        <div style={{ fontSize: "12px", color: "#64748b" }}>{o.customerName} ({o.customerPhone})</div>
                        <div style={{ fontSize: "12px", fontWeight: "700", color: "#1e293b", marginTop: "2px" }}>৳ {o.total}</div>
                      </div>
                      <span style={{ fontSize: "11px", fontWeight: "800", padding: "4px 8px", borderRadius: "12px", backgroundColor: o.orderStatus === "Delivered" ? "#dcfce7" : o.orderStatus === "Shipped" ? "#e0f2fe" : "#fef3c7", color: o.orderStatus === "Delivered" ? "#15803d" : o.orderStatus === "Shipped" ? "#0369a1" : "#b45309" }}>
                        {o.orderStatus}
                      </span>
                    </div>
                  ))}
                  {filteredOrders.length === 0 && <p style={{ color: "#94a3b8", textAlign: "center", padding: "30px" }}>No orders found.</p>}
                </div>
              </div>

              {/* Order Detail View */}
              <div style={{ flex: "1.8 1 400px", backgroundColor: "#fff", borderRadius: "12px", padding: "24px", border: "1px solid #e2e8f0" }}>
                {selectedOrder ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e2e8f0", paddingBottom: "15px" }}>
                      <div>
                        <h3 style={{ fontSize: "18px", fontWeight: "800", color: "#1e293b", margin: 0 }}>Order {selectedOrder.orderNumber}</h3>
                        <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>Placed: {new Date(selectedOrder.createdAt).toLocaleString()}</div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontSize: "12px", fontWeight: "700" }}>Status:</span>
                        <select value={selectedOrder.orderStatus} onChange={(e) => handleUpdateOrderStatus(selectedOrder.id, e.target.value)} style={{ padding: "6px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px", fontWeight: "700" }}>
                          <option value="Pending">Pending</option>
                          <option value="Processing">Processing</option>
                          <option value="Shipped">Shipped</option>
                          <option value="Delivered">Delivered</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <h4 style={{ fontSize: "13px", fontWeight: "800", color: "#475569", textTransform: "uppercase", marginBottom: "6px" }}>Customer & Shipping Info</h4>
                      <div style={{ fontSize: "13px", lineHeight: "1.6", color: "#1e293b" }}>
                        <div><strong>Name:</strong> {selectedOrder.customerName}</div>
                        <div><strong>Phone:</strong> {selectedOrder.customerPhone}</div>
                        <div><strong>Email:</strong> {selectedOrder.customerEmail}</div>
                        <div><strong>Address:</strong> {selectedOrder.address} ({selectedOrder.zone})</div>
                        {selectedOrder.trackingLink && (
                          <div style={{ marginTop: "6px" }}>
                            <strong>Courier Tracking:</strong> <a href={selectedOrder.trackingLink} target="_blank" rel="noopener noreferrer" style={{ color: "#00c6ff" }}>{selectedOrder.trackingLink}</a>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 style={{ fontSize: "13px", fontWeight: "800", color: "#475569", textTransform: "uppercase", marginBottom: "8px" }}>Ordered Items</h4>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                        <thead>
                          <tr style={{ borderBottom: "1px solid #e2e8f0", color: "#64748b", textAlign: "left" }}>
                            <th style={{ padding: "8px 0" }}>Product</th>
                            <th style={{ padding: "8px" }}>Qty</th>
                            <th style={{ padding: "8px" }}>Price</th>
                            <th style={{ padding: "8px", textAlign: "right" }}>Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedOrder.orderItems?.map((item: any, idx: number) => (
                            <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                              <td style={{ padding: "10px 0", fontWeight: "600" }}>{item.productName}</td>
                              <td style={{ padding: "10px" }}>{item.quantity}</td>
                              <td style={{ padding: "10px" }}>৳ {item.price}</td>
                              <td style={{ padding: "10px", textAlign: "right", fontWeight: "700", color: "#0284c7" }}>৳ {item.total}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: "60px 20px", textAlign: "center", color: "#94a3b8" }}>
                    Select an order from the list on the left to view details and update shipping status.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════
              TAB: REVIEWS
          ════════════════════════════════════════════════════════════════════ */}
          {activeTab === "reviews" && (
            <div style={{ backgroundColor: "#fff", borderRadius: "12px", padding: "24px", border: "1px solid #e2e8f0", maxWidth: "800px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: "800", color: "#1e293b", marginBottom: "16px" }}>Pending Customer Reviews ({pendingReviews.length})</h3>
              {pendingReviews.length === 0 ? (
                <p style={{ color: "#64748b", fontSize: "14px" }}>No reviews waiting for approval right now.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {pendingReviews.map(rev => (
                    <div key={rev.id} style={{ padding: "16px", border: "1px solid #e2e8f0", borderRadius: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ fontWeight: "700", fontSize: "14px" }}>{rev.customerName} <span style={{ color: "#f59e0b", marginLeft: "6px" }}>{"★".repeat(rev.rating)}</span></div>
                        <div style={{ fontSize: "13px", color: "#475569", marginTop: "4px" }}>{rev.comment}</div>
                      </div>
                      <button onClick={() => handleApproveReview(rev.id)} style={{ padding: "8px 16px", backgroundColor: "#10b981", color: "#fff", border: "none", borderRadius: "6px", fontWeight: "700", fontSize: "12px", cursor: "pointer" }}>
                        APPROVE
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════
              TAB: SETTINGS & SITE BRANDING
          ════════════════════════════════════════════════════════════════════ */}
          {activeTab === "settings" && (
            <div style={{ backgroundColor: "#fff", borderRadius: "12px", padding: "28px", border: "1px solid #e2e8f0", maxWidth: "850px" }}>
              <h3 style={{ fontSize: "18px", fontWeight: "800", color: "#1e293b", marginBottom: "4px" }}>Site Branding, SEO & Integrations</h3>
              <p style={{ fontSize: "13px", color: "#64748b", marginBottom: "20px" }}>Configure store logo, favicons, meta tags, and external tracking pixels</p>

              {settingsMessage && <div style={{ padding: "12px", backgroundColor: "#ecfdf5", color: "#047857", borderRadius: "6px", fontSize: "14px", fontWeight: "700", marginBottom: "20px" }}>{settingsMessage}</div>}

              <form onSubmit={handleUpdateSettings} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                {/* Branding & Images */}
                <div style={{ backgroundColor: "#f8fafc", padding: "18px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                  <h4 style={{ fontSize: "14px", fontWeight: "800", color: "#1e293b", marginBottom: "14px" }}>Store Logo & Icons</h4>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                    <div>
                      <label style={{ fontSize: "12px", fontWeight: "700", color: "#475569", display: "block", marginBottom: "4px" }}>Store Logo URL</label>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <input type="text" placeholder="/user-glow-logo.png or https://..." value={settings.SITE_LOGO} onChange={(e) => setSettings({ ...settings, SITE_LOGO: e.target.value })} style={{ flex: 1, padding: "9px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px" }} />
                        <label style={{ backgroundColor: "#0284c7", color: "#fff", padding: "8px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "12px", fontWeight: "700", display: "flex", alignItems: "center" }}>
                          Upload
                          <input type="file" accept="image/*" onChange={(e) => handleImageFileUpload(e, "logo")} style={{ display: "none" }} />
                        </label>
                      </div>
                      {settings.SITE_LOGO && <img src={settings.SITE_LOGO} alt="Logo Preview" style={{ height: "40px", marginTop: "8px", objectFit: "contain" }} />}
                    </div>

                    <div>
                      <label style={{ fontSize: "12px", fontWeight: "700", color: "#475569", display: "block", marginBottom: "4px" }}>Favicon URL (.png / .ico)</label>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <input type="text" placeholder="/favicon.ico or https://..." value={settings.SITE_FAVICON} onChange={(e) => setSettings({ ...settings, SITE_FAVICON: e.target.value })} style={{ flex: 1, padding: "9px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px" }} />
                        <label style={{ backgroundColor: "#0284c7", color: "#fff", padding: "8px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "12px", fontWeight: "700", display: "flex", alignItems: "center" }}>
                          Upload
                          <input type="file" accept="image/*" onChange={(e) => handleImageFileUpload(e, "favicon")} style={{ display: "none" }} />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* SEO */}
                <div style={{ backgroundColor: "#f8fafc", padding: "18px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                  <h4 style={{ fontSize: "14px", fontWeight: "800", color: "#1e293b", marginBottom: "14px" }}>Meta & SEO Configuration</h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    <div>
                      <label style={{ fontSize: "12px", fontWeight: "700", color: "#475569", display: "block", marginBottom: "4px" }}>Homepage Meta Title</label>
                      <input type="text" placeholder="GlowGoodly | Authentic Beauty & Cosmetics BD" value={settings.SITE_TITLE} onChange={(e) => setSettings({ ...settings, SITE_TITLE: e.target.value })} style={{ width: "100%", padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px" }} />
                    </div>
                    <div>
                      <label style={{ fontSize: "12px", fontWeight: "700", color: "#475569", display: "block", marginBottom: "4px" }}>Meta Description</label>
                      <textarea rows={2} placeholder="Description for Google Search..." value={settings.SITE_DESCRIPTION} onChange={(e) => setSettings({ ...settings, SITE_DESCRIPTION: e.target.value })} style={{ width: "100%", padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px" }} />
                    </div>
                  </div>
                </div>

                {/* Analytics */}
                <div style={{ backgroundColor: "#f8fafc", padding: "18px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                  <h4 style={{ fontSize: "14px", fontWeight: "800", color: "#1e293b", marginBottom: "14px" }}>Analytics & Pixels</h4>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                    <input type="text" placeholder="Meta Pixel ID" value={settings.META_PIXEL_ID} onChange={(e) => setSettings({ ...settings, META_PIXEL_ID: e.target.value })} style={{ width: "100%", padding: "10px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px" }} />
                    <input type="text" placeholder="GA4 Measurement ID" value={settings.GA4_MEASUREMENT_ID} onChange={(e) => setSettings({ ...settings, GA4_MEASUREMENT_ID: e.target.value })} style={{ width: "100%", padding: "10px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px" }} />
                  </div>
                </div>

                <button type="submit" style={{ padding: "14px", backgroundColor: "#00c6ff", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "800", fontSize: "15px", cursor: "pointer" }}>
                  SAVE ALL SETTINGS
                </button>
              </form>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════
              TAB: CMS & POLICY PAGES BUILDER
          ════════════════════════════════════════════════════════════════════ */}
          {activeTab === "pages" && (
            <div style={{ backgroundColor: "#fff", borderRadius: "12px", padding: "28px", border: "1px solid #e2e8f0", maxWidth: "950px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
                <div>
                  <h3 style={{ fontSize: "18px", fontWeight: "800", color: "#1e293b", margin: 0 }}>Website Policy Pages & CMS Content Control</h3>
                  <p style={{ fontSize: "13px", color: "#64748b", margin: "4px 0 0 0" }}>Edit website policy pages directly from admin. Changes update live across the storefront and database.</p>
                </div>
                <button
                  type="button"
                  onClick={fetchCmsPages}
                  style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 14px", backgroundColor: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "12px", fontWeight: "700", cursor: "pointer" }}
                >
                  <RefreshCw size={13} /> Refresh Data
                </button>
              </div>

              {cmsStatus && (
                <div style={{ padding: "12px 16px", borderRadius: "8px", fontSize: "13px", fontWeight: "700", marginBottom: "18px", backgroundColor: cmsStatus.includes("✅") ? "#f0fdf4" : "#fef2f2", color: cmsStatus.includes("✅") ? "#166534" : "#991b1b" }}>
                  {cmsStatus}
                </div>
              )}

              {/* Selector for 9 Core Policy Pages */}
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "22px", paddingBottom: "14px", borderBottom: "2px solid #f1f5f9" }}>
                {[
                  { slug: "contact", label: "Contact Us" },
                  { slug: "points", label: "Points & Rewards" },
                  { slug: "faq", label: "FAQs" },
                  { slug: "shipping-delivery", label: "Shipping & Delivery" },
                  { slug: "terms", label: "Terms & Conditions" },
                  { slug: "refund-policy", label: "Refund Policy" },
                  { slug: "privacy-policy", label: "Privacy Policy" },
                  { slug: "about", label: "Our Story" },
                  { slug: "authenticity", label: "Authenticity" }
                ].map(p => (
                  <button
                    key={p.slug}
                    type="button"
                    onClick={() => {
                      setSelectedCmsSlug(p.slug);
                      const found = cmsPages.find(item => item.slug === p.slug);
                      if (found) {
                        setCmsPageForm(found);
                      } else {
                        setCmsPageForm({ slug: p.slug, title: p.label, contentHtml: "", metaTitle: "", metaDescription: "" });
                      }
                    }}
                    style={{
                      padding: "8px 14px",
                      borderRadius: "6px",
                      border: "none",
                      fontWeight: "700",
                      fontSize: "12.5px",
                      cursor: "pointer",
                      backgroundColor: selectedCmsSlug === p.slug ? "#00c6ff" : "#f1f5f9",
                      color: selectedCmsSlug === p.slug ? "#ffffff" : "#475569",
                      transition: "all 0.15s ease"
                    }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSaveCmsPage} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "12.5px", fontWeight: "700", color: "#334155", marginBottom: "6px" }}>Page Title *</label>
                    <input
                      type="text"
                      required
                      value={cmsPageForm.title}
                      onChange={(e) => setCmsPageForm({ ...cmsPageForm, title: e.target.value })}
                      style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13.5px" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "12.5px", fontWeight: "700", color: "#334155", marginBottom: "6px" }}>URL Slug (Storefront URL)</label>
                    <input
                      type="text"
                      readOnly
                      value={`/${cmsPageForm.slug}`}
                      style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", backgroundColor: "#f8fafc", fontSize: "13.5px", color: "#00c6ff", fontWeight: "800" }}
                    />
                  </div>
                </div>

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <label style={{ fontSize: "13px", fontWeight: "800", color: "#1e293b" }}>Visual Content Editor</label>
                    <span style={{ fontSize: "11px", color: "#0284c7", fontWeight: "700" }}>Click formatting buttons below to insert sections</span>
                  </div>

                  {/* WYSIWYG Quick Insert Bar */}
                  <div style={{ backgroundColor: "#f8fafc", padding: "8px 12px", borderRadius: "8px 8px 0 0", border: "1px solid #cbd5e1", borderBottom: "none", display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>
                    <button type="button" onClick={() => setCmsPageForm({ ...cmsPageForm, contentHtml: cmsPageForm.contentHtml + " <h2>Section Heading</h2>\n" })} style={{ padding: "4px 10px", fontSize: "12px", fontWeight: "800", backgroundColor: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "4px", cursor: "pointer" }}>H2 Heading</button>
                    <button type="button" onClick={() => setCmsPageForm({ ...cmsPageForm, contentHtml: cmsPageForm.contentHtml + " <h3>Subheading</h3>\n" })} style={{ padding: "4px 10px", fontSize: "12px", fontWeight: "800", backgroundColor: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "4px", cursor: "pointer" }}>H3 Subheading</button>
                    <button type="button" onClick={() => setCmsPageForm({ ...cmsPageForm, contentHtml: cmsPageForm.contentHtml + " <p><strong>Bold announcement text here</strong></p>\n" })} style={{ padding: "4px 10px", fontSize: "12px", fontWeight: "800", backgroundColor: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "4px", cursor: "pointer" }}><b>B</b> Bold</button>
                    <button type="button" onClick={() => setCmsPageForm({ ...cmsPageForm, contentHtml: cmsPageForm.contentHtml + " <ul>\n  <li>Delivery Milestone 1</li>\n  <li>Delivery Milestone 2</li>\n</ul>\n" })} style={{ padding: "4px 10px", fontSize: "12px", fontWeight: "800", backgroundColor: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "4px", cursor: "pointer" }}>• Bullet List</button>
                    <button type="button" onClick={() => {
                      const img = prompt("Enter Image URL:", "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800");
                      if (img) setCmsPageForm({ ...cmsPageForm, contentHtml: cmsPageForm.contentHtml + `\n<img src="${img}" alt="Notice" style="max-width: 100%; border-radius: 8px; margin: 12px 0;" />\n` });
                    }} style={{ padding: "4px 12px", fontSize: "12px", fontWeight: "800", backgroundColor: "#e0f2fe", color: "#0369a1", border: "1px solid #bae6fd", borderRadius: "4px", cursor: "pointer" }}>📷 Insert Image</button>
                  </div>

                  <textarea
                    rows={12}
                    value={cmsPageForm.contentHtml}
                    onChange={(e) => setCmsPageForm({ ...cmsPageForm, contentHtml: e.target.value })}
                    style={{ width: "100%", padding: "14px", borderRadius: "0 0 8px 8px", border: "1px solid #cbd5e1", fontSize: "13.5px", lineHeight: "1.6", outline: "none" }}
                    placeholder="Type page text or HTML markup here..."
                  />
                </div>

                {/* Live Preview Canvas */}
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "800", color: "#1e293b", marginBottom: "8px" }}>Live Storefront Page Preview</label>
                  <div
                    style={{ padding: "24px", borderRadius: "10px", border: "1px solid #e2e8f0", backgroundColor: "#f8fafc", minHeight: "120px" }}
                    dangerouslySetInnerHTML={{ __html: cmsPageForm.contentHtml || "<p style='color: #94a3b8; font-style: italic;'>No custom text written yet. Content typed above will appear here live.</p>" }}
                  />
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button type="submit" style={{ backgroundColor: "#00c6ff", color: "#fff", border: "none", padding: "12px 32px", borderRadius: "8px", fontWeight: "800", fontSize: "14px", cursor: "pointer", boxShadow: "0 4px 12px rgba(0,198,255,0.3)" }}>
                    Save & Publish Page Live 🚀
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════
              TAB: LIVE MARKETING & SOCKET.IO PROMO BROADCASTER
          ════════════════════════════════════════════════════════════════════ */}
          {activeTab === "marketing" && (
            <div style={{ maxWidth: "1000px" }}>
              <SocketIoPromoBroadcaster token={token} />
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
