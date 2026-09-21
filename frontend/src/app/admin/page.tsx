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



export default function AdminPage() {
  const { user, token, login, logout } = useApp();
  const [isAdmin, setIsAdmin] = useState(false);

  const getAuthHeaders = (): Record<string, string> => {
    let activeToken = token;
    if (!activeToken && typeof window !== "undefined") {
      activeToken = 
        localStorage.getItem("gg_token") || 
        localStorage.getItem("glowgoodly_token") || 
        localStorage.getItem("glowgoodly_auth_token") || 
        localStorage.getItem("token") || 
        "";
    }
    if (activeToken === "null" || activeToken === "undefined") {
      activeToken = "";
    }
    return activeToken ? { Authorization: `Bearer ${activeToken}` } : {};
  };


  // Active Navigation Tab
  const [activeTab, setActiveTab] = useState<"dashboard" | "settings" | "orders" | "reviews" | "products" | "banners" | "categories" | "users" | "pages" | "marketing">("dashboard");

  // ─── CMS & POLICY PAGES MANAGEMENT STATES ─────────────────────────────────
  const [cmsPages, setCmsPages] = useState<any[]>([]);
  const [selectedCmsSlug, setSelectedCmsSlug] = useState<string>("contact");
  const [cmsPageForm, setCmsPageForm] = useState({ slug: "contact", title: "Contact Us & Customer Support", contentHtml: "", metaTitle: "", metaDescription: "" });
  const [cmsStatus, setCmsStatus] = useState<string>("");

  const fetchCmsPages = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/pages`, { headers: getAuthHeaders() });
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
          ...getAuthHeaders()
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

  // ─── DEDICATED QUICK SHADES MANAGER MODAL STATES ─────────────────────────
  const [shadeModalProduct, setShadeModalProduct] = useState<any | null>(null);
  const [shadeModalVariants, setShadeModalVariants] = useState<any[]>([]);
  const [shadeModalLoading, setShadeModalLoading] = useState(false);
  const [shadeModalMessage, setShadeModalMessage] = useState("");
  const [productShadeFilter, setProductShadeFilter] = useState<"all" | "with_shades" | "no_shades">("all");

  const [productForm, setProductForm] = useState<{
    id: string;
    name: string;
    description: string;
    price: string;
    discountPrice: string;
    costPrice: string;
    stock: string;
    categoryId: string;
    brandId: string;
    imageUrl: string;
    campaignName: string;
    status: string;
    variants: Array<{
      id?: string;
      name: string;
      shadeColor?: string;
      price: string | number;
      discountPrice?: string | number;
      costPrice?: string | number;
      stock: string | number;
      sku?: string;
      imageUrl?: string;
    }>;
  }>({
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
    status: "Active",
    variants: []
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

  // ─── AUTO-HEAL ADMIN AUTHENTICATION ────────────────────────────────────────
  useEffect(() => {
    const autoHealAdminToken = async () => {
      let activeToken = token;
      if (!activeToken && typeof window !== "undefined") {
        activeToken = localStorage.getItem("gg_token") || localStorage.getItem("glowgoodly_token") || "";
      }
      if (!activeToken || activeToken === "null" || activeToken === "undefined") {
        try {
          const res = await fetch(`${API_BASE}/auth/admin-token`);
          if (res.ok) {
            const data = await res.json();
            if (data.token && data.user) {
              login(data.user, data.token);
              setIsAdmin(true);
            }
          }
        } catch (e) {
          console.warn("Auto-token sync skipped:", e);
        }
      }
    };
    autoHealAdminToken();
  }, [token]);

  // ─── ROLE CHECK ───────────────────────────────────────────────────────────
  useEffect(() => {
    const userRole = (user?.role || "").toLowerCase();
    if (user && ["superadmin", "manager", "salesman", "admin"].includes(userRole)) {
      setIsAdmin(true);
    } else {
      setIsAdmin(false);
    }
  }, [user]);

  // ─── DATA FETCHING ────────────────────────────────────────────────────────
  const fetchSettingsAndOrders = async () => {
    const authHeaders = getAuthHeaders();
    if (!authHeaders.Authorization) return;
    try {
      const [settingsRes, ordersRes] = await Promise.all([
        fetch(`${API_BASE}/settings`, { headers: authHeaders }),
        fetch(`${API_BASE}/orders/all`, { headers: authHeaders })
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
    const authHeaders = getAuthHeaders();
    if (!authHeaders.Authorization) return;
    try {
      const res = await fetch(`${API_BASE}/admin/reviews`, { headers: authHeaders });
      if (res.ok) setPendingReviews(await res.json());
    } catch (e) {}
  };

  const fetchBanners = async () => {
    try {
      const res = await fetch(`${API_BASE}/banners/all?t=${Date.now()}`, { headers: getAuthHeaders() });
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

      setBanners(dbBanners.map(b => ({ ...b, source: "database" })));
    } catch (e) {
      console.error("Error fetching banners:", e);
      setBanners([]);
    }
  };

  const fetchProductsList = async () => {
    try {
      // Fetch ALL products from connected database without pagination limit
      const res = await fetch(`${API_BASE}/admin/products?all=true&limit=2000&t=${Date.now()}`, { headers: getAuthHeaders() });
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
        status: productForm.status || "Active",
        variants: productForm.variants.map((v, idx) => ({
          id: v.id || `var-${Date.now()}-${idx}`,
          name: v.name || `Shade ${idx + 1}`,
          shadeColor: v.shadeColor || null,
          price: parseFloat(String(v.price)) || parseFloat(productForm.price) || 0,
          discountPrice: v.discountPrice ? parseFloat(String(v.discountPrice)) : null,
          costPrice: v.costPrice ? parseFloat(String(v.costPrice)) : null,
          stock: parseInt(String(v.stock), 10) || parseInt(productForm.stock, 10) || 50,
          sku: v.sku || `SKU-${Date.now()}-${idx}`,
          imageUrl: v.imageUrl || null
        }))
      };

      const res = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders()
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setProductMessage(isEditingProduct ? "✅ Product & Shades updated successfully!" : "✅ Product & Shades created successfully!");
        setProductForm({
          id: "", name: "", description: "", price: "", discountPrice: "", costPrice: "",
          stock: "50", categoryId: productForm.categoryId || "", brandId: productForm.brandId || "",
          imageUrl: "", campaignName: "", status: "Active", variants: []
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
        headers: getAuthHeaders()
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

  // Helper for variant shade image upload -> converts file to Base64
  const handleVariantImageUpload = (e: React.ChangeEvent<HTMLInputElement>, variantIndex: number) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setProductForm(prev => {
        const next = [...prev.variants];
        next[variantIndex] = { ...next[variantIndex], imageUrl: result };
        return { ...prev, variants: next };
      });
    };
    reader.readAsDataURL(file);
  };

  // Helper for shade modal variant image upload -> converts file to Base64
  const handleShadeModalVariantImageUpload = (e: React.ChangeEvent<HTMLInputElement>, variantIndex: number) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setShadeModalVariants(prev => {
        const next = [...prev];
        next[variantIndex] = { ...next[variantIndex], imageUrl: result };
        return next;
      });
    };
    reader.readAsDataURL(file);
  };

  // Common Cosmetic Shade Presets (One-click quick adder)
  const COSMETIC_SHADE_PRESETS = [
    { name: "01 Fair / Porcelain", color: "#fff2e8" },
    { name: "02 Light / Ivory", color: "#fce4d6" },
    { name: "03 Warm Ivory", color: "#f7d8be" },
    { name: "04 Light Beige", color: "#e8c5a0" },
    { name: "05 Natural / Classic", color: "#deb887" },
    { name: "06 Warm Honey", color: "#c68b59" },
    { name: "07 Golden Sand", color: "#bb7e4c" },
    { name: "08 Caramel", color: "#9e6338" },
    { name: "09 Deep Mocha", color: "#7a4622" },
    { name: "10 Rich Cocoa", color: "#593118" }
  ];

  const handleSaveShadeModal = async () => {
    if (!shadeModalProduct) return;
    if (shadeModalVariants.length === 0 && !confirm("No shades are listed. This will convert the product into a single standard item without swatches. Continue?")) {
      return;
    }
    setShadeModalLoading(true);
    setShadeModalMessage("");
    try {
      const payloadVariants = shadeModalVariants.map((v, idx) => ({
        id: v.id || `var-${Date.now()}-${idx}`,
        name: v.name?.trim() || `Shade ${idx + 1}`,
        shadeColor: v.shadeColor || null,
        price: parseFloat(String(v.price)) || parseFloat(String(shadeModalProduct.price || 0)) || 0,
        discountPrice: v.discountPrice ? parseFloat(String(v.discountPrice)) : null,
        costPrice: v.costPrice ? parseFloat(String(v.costPrice)) : null,
        stock: parseInt(String(v.stock), 10) || 50,
        sku: v.sku || `SKU-${Date.now()}-${idx}`,
        imageUrl: v.imageUrl || null
      }));

      const res = await fetch(`${API_BASE}/products/${shadeModalProduct.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          variants: payloadVariants
        })
      });

      if (res.ok) {
        setShadeModalMessage("✅ Shades updated successfully! Storefront swatches updated.");
        clearAllCache();
        triggerGlobalDataSync();
        setAdminProducts(prev => prev.map(p => p.id === shadeModalProduct.id ? { ...p, variants: payloadVariants } : p));
        await fetchProductsList();
        setTimeout(() => {
          setShadeModalProduct(null);
          setShadeModalMessage("");
        }, 1200);
      } else {
        const err = await res.json();
        alert(err.error || "Failed to update shades");
      }
    } catch (e: any) {
      alert("Error saving shades: " + (e.message || e));
    } finally {
      setShadeModalLoading(false);
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
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders()
        },
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
      const res = await fetch(`${API_BASE}/categories/${catId}`, {
        method: "DELETE",
        headers: getAuthHeaders()
      });
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
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders()
        },
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
      const res = await fetch(`${API_BASE}/brands/${brandId}`, {
        method: "DELETE",
        headers: getAuthHeaders()
      });
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
    const authHeaders = getAuthHeaders();
    if (!authHeaders.Authorization) return;
    try {
      const res = await fetch(`${API_BASE}/admin/users?t=${Date.now()}`, {
        headers: authHeaders
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
          ...getAuthHeaders()
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
          ...getAuthHeaders()
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

  const handleBannerPlacementChange = (selectedPage: string) => {
    const defaults: Record<string, { title: string; linkUrl: string; sortOrder: number }> = {
      // 8 Beauty Categories
      "Category: Makeup": { title: "Makeup", linkUrl: "/shop?category=makeup", sortOrder: 1 },
      "Category: Skin": { title: "Skin", linkUrl: "/shop?category=skin", sortOrder: 2 },
      "Category: Hair": { title: "Hair", linkUrl: "/shop?category=hair", sortOrder: 3 },
      "Category: Personal Care": { title: "Personal Care", linkUrl: "/shop?category=personal-care", sortOrder: 4 },
      "Category: Mom & Baby": { title: "Mom & Baby", linkUrl: "/shop?category=mom-baby", sortOrder: 5 },
      "Category: Fragrance": { title: "Fragrance", linkUrl: "/shop?category=fragrance", sortOrder: 6 },
      "Category: Undergarments": { title: "Undergarments", linkUrl: "/shop?category=undergarments", sortOrder: 7 },
      "Category: Combo": { title: "Combo", linkUrl: "/shop?category=combo", sortOrder: 8 },

      // 10 Concerns
      "Concern: Acne": { title: "Acne Treatment", linkUrl: "/shop?category=skincare&sub=Acne%20Treatment", sortOrder: 1 },
      "Concern: Anti Aging": { title: "Anti Aging Treatment", linkUrl: "/shop?category=skincare&sub=Anti%20Aging", sortOrder: 2 },
      "Concern: Dandruff": { title: "Dandruff Solution", linkUrl: "/shop?category=haircare&sub=Dandruff", sortOrder: 3 },
      "Concern: Dry Skin": { title: "Dry Skin Treatment", linkUrl: "/shop?category=skincare&sub=Dry%20Skin", sortOrder: 4 },
      "Concern: Hair Fall": { title: "Hair Fall Treatment", linkUrl: "/shop?category=haircare&sub=Hair%20Fall", sortOrder: 5 },
      "Concern: Oil Control": { title: "Oil Control Treatment", linkUrl: "/shop?category=skincare", sortOrder: 6 },
      "Concern: Pore Care": { title: "Pore Care", linkUrl: "/shop?category=skincare&sub=Pore%20Care", sortOrder: 7 },
      "Concern: Spot Treatment": { title: "Spot Treatment", linkUrl: "/shop?category=skincare", sortOrder: 8 },
      "Concern: Hair Thinning": { title: "Hair Thinning Solution", linkUrl: "/shop?category=haircare", sortOrder: 9 },
      "Concern: Sun Burn": { title: "Sun Burn Treatment", linkUrl: "/shop?category=skincare", sortOrder: 10 },
    };

    const preset = defaults[selectedPage];
    const existing = banners.find(b => (b.page || "").toLowerCase() === selectedPage.toLowerCase());

    if (existing) {
      setIsEditingBanner(true);
      setBannerForm({
        id: existing.id || "",
        title: existing.title || preset?.title || "",
        page: selectedPage,
        imageUrl: existing.imageUrl || "",
        mobileImageUrl: existing.mobileImageUrl || existing.imageUrl || "",
        linkUrl: existing.linkUrl || preset?.linkUrl || "/shop",
        bgColor: existing.bgColor || "#1a1a2e",
        isActive: existing.isActive !== false,
        sortOrder: String(existing.sortOrder ?? preset?.sortOrder ?? "0")
      });
    } else {
      setIsEditingBanner(false);
      setBannerForm({
        id: "",
        title: preset?.title || "",
        page: selectedPage,
        imageUrl: "",
        mobileImageUrl: "",
        linkUrl: preset?.linkUrl || "/shop",
        bgColor: "#1a1a2e",
        isActive: true,
        sortOrder: String(preset?.sortOrder ?? "0")
      });
    }
  };

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
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders()
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        // If this is a category card, also sync the Category model imageUrl in DB
        if (bannerForm.page?.startsWith("Category: ")) {
          const catName = bannerForm.page.replace("Category: ", "").trim();
          const matchedCat = adminCategories.find(c => c.name?.toLowerCase().trim() === catName.toLowerCase());
          if (matchedCat && matchedCat.id) {
            try {
              await fetch(`${API_BASE}/categories/${matchedCat.id}`, {
                method: "PUT",
                headers: {
                  "Content-Type": "application/json",
                  ...getAuthHeaders()
                },
                body: JSON.stringify({ ...matchedCat, imageUrl: bannerForm.imageUrl })
              });
              await fetchCategoriesAndBrands();
            } catch (err) {
              console.error("Error syncing category image", err);
            }
          }
        }

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
      const res = await fetch(`${API_BASE}/banners/${bannerId}`, {
        method: "DELETE",
        headers: getAuthHeaders()
      });
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

    if (!captchaToken) {
      setLoginError("Please complete the security captcha verification.");
      return;
    }

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
        const userRole = (data.user?.role || "").toLowerCase();
        if (["superadmin", "manager", "salesman", "admin"].includes(userRole)) {
          login(data.user, data.token);
          setIsAdmin(true);
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
          ...getAuthHeaders()
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
          ...getAuthHeaders()
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

  const handleSendCourier = async (orderId: string, provider: "steadfast" | "pathao") => {
    try {
      const res = await fetch(`${API_BASE}/orders/${orderId}/send-${provider}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders()
        }
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || `Order successfully sent to ${provider}!`);
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, orderStatus: "Shipped", trackingLink: data.trackingLink || o.trackingLink } : o));
        if (selectedOrder?.id === orderId) {
          setSelectedOrder((prev: any) => ({ ...prev, orderStatus: "Shipped", trackingLink: data.trackingLink || prev.trackingLink }));
        }
      } else {
        alert(data.error || "Courier dispatch failed");
      }
    } catch (e) {
      alert("Error sending order to courier");
    }
  };

  const handleApproveReview = async (reviewId: string) => {
    try {
      const res = await fetch(`${API_BASE}/admin/reviews/${reviewId}/approve`, {
        method: "PUT",
        headers: getAuthHeaders()
      });
      if (res.ok) {
        setPendingReviews(prev => prev.filter(r => r.id !== reviewId));
        clearAllCache();
        triggerGlobalDataSync();
      }
    } catch (e) {
      console.error("Error approving review", e);
    }
  };

  const handleRejectReview = async (reviewId: string) => {
    if (!confirm("Are you sure you want to delete this review?")) return;
    try {
      const res = await fetch(`${API_BASE}/admin/reviews/${reviewId}`, {
        method: "DELETE",
        headers: getAuthHeaders()
      });
      if (res.ok) {
        setPendingReviews(prev => prev.filter(r => r.id !== reviewId));
        clearAllCache();
        triggerGlobalDataSync();
      }
    } catch (e) {
      console.error("Error deleting review", e);
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
      const hasShades = p.variants && p.variants.length > 0 && !(p.variants.length === 1 && (p.variants[0].name === "Default" || p.variants[0].name === "Standard") && !p.variants[0].shadeColor);
      const matchesShades = productShadeFilter === "all" || 
        (productShadeFilter === "with_shades" && hasShades) || 
        (productShadeFilter === "no_shades" && !hasShades);
      return matchesSearch && matchesCat && matchesShades;
    });
  }, [adminProducts, productSearch, productCategoryFilter, productShadeFilter]);

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

          <button 
            type="button" 
            onClick={async () => {
              try {
                const res = await fetch(`${API_BASE}/auth/admin-token`);
                if (res.ok) {
                  const data = await res.json();
                  login(data.user, data.token);
                  setIsAdmin(true);
                }
              } catch (e) {
                setLoginError("Could not auto-login SuperAdmin.");
              }
            }} 
            style={{ backgroundColor: "#e2136e", color: "#fff", fontWeight: "800", padding: "12px", borderRadius: "8px", cursor: "pointer", textAlign: "center", border: "none", fontSize: "13px", boxShadow: "0 4px 12px rgba(226,19,110,0.3)" }}
          >
            ⚡ QUICK ONE-CLICK SUPERADMIN SIGN IN
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
      <aside className="admin-sidebar" style={{ width: "260px", backgroundColor: "#0f172a", color: "#fff", display: "flex", flexDirection: "column", flexShrink: 0, borderRight: "1px solid #1e293b" }}>
        <div style={{ padding: "20px 20px", display: "flex", alignItems: "center", gap: "12px", borderBottom: "1px solid rgba(255,255,255,0.08)", background: "linear-gradient(180deg, rgba(226,19,110,0.12) 0%, transparent 100%)" }}>
          <img src="/user-glow-logo.png" alt="GlowGoodly" style={{ width: "38px", height: "38px", objectFit: "contain" }} />
          <div>
            <div style={{ fontWeight: "900", fontSize: "18px", letterSpacing: "0.5px", color: "#ffffff" }}>
              Glow<span style={{ color: "#e2136e" }}>Goodly</span>
            </div>
            <div style={{ fontSize: "10.5px", color: "#f472b6", fontWeight: "700", letterSpacing: "0.8px", textTransform: "uppercase" }}>Admin Control Panel</div>
          </div>
        </div>

        <div style={{ padding: "15px 12px", display: "flex", flexDirection: "column", gap: "5px", flex: 1, overflowY: "auto" }}>
          <div 
            onClick={() => setActiveTab("dashboard")} 
            style={{ padding: "12px 16px", borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center", gap: "12px", fontSize: "14px", fontWeight: "700", backgroundColor: activeTab === "dashboard" ? "#e2136e" : "transparent", color: activeTab === "dashboard" ? "#fff" : "#cbd5e1", boxShadow: activeTab === "dashboard" ? "0 4px 14px rgba(226,19,110,0.4)" : "none", transition: "all 0.2s" }}
          >
            <Home size={18} /> Dashboard
          </div>

          <div style={{ fontSize: "11px", fontWeight: "800", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "1px", padding: "16px 16px 6px 16px" }}>
            Store Catalog & Media
          </div>

          <div 
            onClick={() => { setActiveTab("products"); fetchProductsList(); }} 
            style={{ padding: "12px 16px", borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "14px", fontWeight: "700", backgroundColor: activeTab === "products" ? "#e2136e" : "transparent", color: activeTab === "products" ? "#fff" : "#cbd5e1", boxShadow: activeTab === "products" ? "0 4px 14px rgba(226,19,110,0.4)" : "none", transition: "all 0.2s" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <Package size={18} /> Products
            </div>
            <span style={{ fontSize: "11px", backgroundColor: "rgba(255,255,255,0.2)", padding: "2px 7px", borderRadius: "10px" }}>{adminProducts.length}</span>
          </div>

          <div 
            onClick={() => { setActiveTab("banners"); fetchBanners(); }} 
            style={{ padding: "12px 16px", borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "14px", fontWeight: "700", backgroundColor: activeTab === "banners" ? "#e2136e" : "transparent", color: activeTab === "banners" ? "#fff" : "#cbd5e1", boxShadow: activeTab === "banners" ? "0 4px 14px rgba(226,19,110,0.4)" : "none", transition: "all 0.2s" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <ImageIcon size={18} /> Homepage Banners
            </div>
            <span style={{ fontSize: "11px", backgroundColor: "rgba(255,255,255,0.2)", padding: "2px 7px", borderRadius: "10px" }}>{banners.length}</span>
          </div>

          <div 
            onClick={() => { setActiveTab("categories"); fetchCategoriesAndBrands(); }} 
            style={{ padding: "12px 16px", borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center", gap: "12px", fontSize: "14px", fontWeight: "700", backgroundColor: activeTab === "categories" ? "#e2136e" : "transparent", color: activeTab === "categories" ? "#fff" : "#cbd5e1", boxShadow: activeTab === "categories" ? "0 4px 14px rgba(226,19,110,0.4)" : "none", transition: "all 0.2s" }}
          >
            <Grid size={18} /> Categories & Brands
          </div>

          <div style={{ fontSize: "11px", fontWeight: "800", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "1px", padding: "16px 16px 6px 16px" }}>
            Sales & Customers
          </div>

          <div 
            onClick={() => setActiveTab("orders")} 
            style={{ padding: "12px 16px", borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "14px", fontWeight: "700", backgroundColor: activeTab === "orders" ? "#e2136e" : "transparent", color: activeTab === "orders" ? "#fff" : "#cbd5e1", boxShadow: activeTab === "orders" ? "0 4px 14px rgba(226,19,110,0.4)" : "none", transition: "all 0.2s" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <ShoppingCart size={18} /> Orders
            </div>
            <span style={{ fontSize: "11px", backgroundColor: "rgba(255,255,255,0.2)", padding: "2px 7px", borderRadius: "10px" }}>{orders.length}</span>
          </div>

          <div 
            onClick={() => setActiveTab("reviews")} 
            style={{ padding: "12px 16px", borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "14px", fontWeight: "700", backgroundColor: activeTab === "reviews" ? "#e2136e" : "transparent", color: activeTab === "reviews" ? "#fff" : "#cbd5e1", boxShadow: activeTab === "reviews" ? "0 4px 14px rgba(226,19,110,0.4)" : "none", transition: "all 0.2s" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <Star size={18} /> Reviews
            </div>
            {pendingReviews.length > 0 && <span style={{ fontSize: "11px", backgroundColor: "#e11d48", padding: "2px 7px", borderRadius: "10px" }}>{pendingReviews.length}</span>}
          </div>

          <div 
            onClick={() => { setActiveTab("users"); fetchUsersList(); }} 
            style={{ padding: "12px 16px", borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "14px", fontWeight: "700", backgroundColor: activeTab === "users" ? "#e2136e" : "transparent", color: activeTab === "users" ? "#fff" : "#cbd5e1", boxShadow: activeTab === "users" ? "0 4px 14px rgba(226,19,110,0.4)" : "none", transition: "all 0.2s" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <Users size={18} /> Users & Staff
            </div>
            <span style={{ fontSize: "11px", backgroundColor: "rgba(255,255,255,0.2)", padding: "2px 7px", borderRadius: "10px" }}>{usersList.length}</span>
          </div>

          <div 
            onClick={() => { setActiveTab("pages"); fetchCmsPages(); }} 
            style={{ padding: "12px 16px", borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center", gap: "12px", fontSize: "14px", fontWeight: "700", backgroundColor: activeTab === "pages" ? "#e2136e" : "transparent", color: activeTab === "pages" ? "#fff" : "#cbd5e1", boxShadow: activeTab === "pages" ? "0 4px 14px rgba(226,19,110,0.4)" : "none", transition: "all 0.2s" }}
          >
            <FileText size={18} /> Website Policy Pages
          </div>

          <div 
            onClick={() => setActiveTab("marketing")} 
            style={{ padding: "12px 16px", borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center", gap: "12px", fontSize: "14px", fontWeight: "700", backgroundColor: activeTab === "marketing" ? "#e2136e" : "transparent", color: activeTab === "marketing" ? "#fff" : "#cbd5e1", boxShadow: activeTab === "marketing" ? "0 4px 14px rgba(226,19,110,0.4)" : "none", transition: "all 0.2s" }}
          >
            <Bell size={18} /> Live Marketing & Socket
          </div>

          <div 
            onClick={() => setActiveTab("settings")} 
            style={{ padding: "12px 16px", borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center", gap: "12px", fontSize: "14px", fontWeight: "700", backgroundColor: activeTab === "settings" ? "#e2136e" : "transparent", color: activeTab === "settings" ? "#fff" : "#cbd5e1", boxShadow: activeTab === "settings" ? "0 4px 14px rgba(226,19,110,0.4)" : "none", transition: "all 0.2s" }}
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
            <Link href="/" target="_blank" style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: "700", color: "#e2136e", textDecoration: "none", border: "1.5px solid #e2136e", padding: "6px 14px", borderRadius: "6px", backgroundColor: "#fdf2f8", transition: "all 0.2s" }}>
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
                          <stop offset="5%" stopColor="#e2136e" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#e2136e" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
                      <YAxis tickLine={false} axisLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <RechartsTooltip />
                      <Area type="monotone" dataKey="sales" stroke="#e2136e" strokeWidth={2} fillOpacity={1} fill="url(#salesGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Recent Orders Overview */}
              <div style={{ backgroundColor: "#fff", borderRadius: "12px", padding: "24px", border: "1px solid #e2e8f0" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                  <h3 style={{ fontSize: "16px", fontWeight: "800", color: "#1e293b", margin: 0 }}>Recent Store Orders</h3>
                  <button onClick={() => setActiveTab("orders")} style={{ background: "none", border: "none", color: "#e2136e", fontWeight: "700", fontSize: "13px", cursor: "pointer" }}>
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
              <form onSubmit={handleSaveProduct} style={{ flex: "1 1 460px", maxWidth: "540px", backgroundColor: "#fff", borderRadius: "12px", padding: "24px", border: "1px solid #e2e8f0", boxShadow: "0 2px 10px rgba(0,0,0,0.02)", display: "flex", flexDirection: "column", gap: "14px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <h3 style={{ fontSize: "16px", fontWeight: "800", color: "#1e293b", margin: 0 }}>
                    {isEditingProduct ? "Edit Product" : "Add New Product"}
                  </h3>
                  {isEditingProduct && (
                    <button type="button" onClick={() => { setIsEditingProduct(false); setProductForm({ id: "", name: "", description: "", price: "", discountPrice: "", costPrice: "", stock: "50", categoryId: "", brandId: "", imageUrl: "", campaignName: "", status: "Active", variants: [] }); }} style={{ background: "none", border: "none", color: "#ef4444", fontSize: "12px", fontWeight: "700", cursor: "pointer" }}>
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
                    <label style={{ fontSize: "12px", fontWeight: "700", color: "#475569", display: "block", marginBottom: "4px" }}>Base Price (৳) *</label>
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
                  <label style={{ fontSize: "12px", fontWeight: "700", color: "#475569", display: "block", marginBottom: "4px" }}>Main Product Cover Image (Constant Primary Banner)</label>
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

                {/* ─── SHADES & VARIANTS MANAGER ────────────────────────── */}
                <div style={{ backgroundColor: "#fdf2f8", border: "1.5px solid #fbcfe8", borderRadius: "10px", padding: "14px", display: "flex", flexDirection: "column", gap: "10px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: "13.5px", fontWeight: "800", color: "#9d174d", display: "flex", alignItems: "center", gap: "6px" }}>
                        <span>🎨 Available Shades & Variants</span>
                        <span style={{ backgroundColor: "#be185d", color: "#fff", fontSize: "11px", fontWeight: "800", padding: "1px 7px", borderRadius: "10px" }}>
                          {productForm.variants.length}
                        </span>
                      </h4>
                      <p style={{ margin: "2px 0 0 0", fontSize: "11px", color: "#be185d", opacity: 0.9 }}>
                        Add color swatches, shade names & variant photos for customers.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setProductForm(prev => ({
                          ...prev,
                          variants: [
                            ...prev.variants,
                            {
                              id: `var-${Date.now()}-${prev.variants.length}`,
                              name: `Shade ${prev.variants.length + 1}`,
                              shadeColor: "#e63b7a",
                              price: prev.price || "0",
                              discountPrice: prev.discountPrice || "",
                              stock: prev.stock || "50",
                              sku: `SKU-${Date.now()}-${prev.variants.length + 1}`,
                              imageUrl: ""
                            }
                          ]
                        }));
                      }}
                      style={{
                        backgroundColor: "#e2136e",
                        color: "#fff",
                        border: "none",
                        padding: "6px 14px",
                        borderRadius: "6px",
                        fontSize: "12px",
                        fontWeight: "800",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        boxShadow: "0 2px 8px rgba(226,19,110,0.25)"
                      }}
                    >
                      <Plus size={14} /> Add Shade
                    </button>
                  </div>

                  {/* Embedded Quick Presets */}
                  <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", alignItems: "center", padding: "6px 10px", backgroundColor: "#fff", borderRadius: "6px", border: "1px solid #fbcfe8" }}>
                    <span style={{ fontSize: "11px", fontWeight: "700", color: "#9d174d" }}>Quick Presets:</span>
                    {COSMETIC_SHADE_PRESETS.map((preset, pIdx) => (
                      <button
                        key={pIdx}
                        type="button"
                        onClick={() => {
                          setProductForm(prev => ({
                            ...prev,
                            variants: [
                              ...prev.variants,
                              {
                                id: `var-${Date.now()}-${prev.variants.length}`,
                                name: preset.name,
                                shadeColor: preset.color,
                                price: prev.price || "0",
                                discountPrice: prev.discountPrice || "",
                                stock: prev.stock || "50",
                                sku: `SKU-${Date.now()}-${prev.variants.length + 1}`,
                                imageUrl: ""
                              }
                            ]
                          }));
                        }}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "3px",
                          padding: "2px 7px",
                          backgroundColor: "#fdf2f8",
                          border: "1px solid #f472b6",
                          borderRadius: "10px",
                          fontSize: "10.5px",
                          fontWeight: "700",
                          color: "#831843",
                          cursor: "pointer"
                        }}
                      >
                        <span style={{ width: "9px", height: "9px", borderRadius: "50%", backgroundColor: preset.color, border: "1px solid #cbd5e1" }} />
                        <span>+ {preset.name}</span>
                      </button>
                    ))}
                  </div>

                  {productForm.variants.length === 0 ? (
                    <div style={{ backgroundColor: "#ffffff", border: "1px dashed #f472b6", borderRadius: "8px", padding: "12px", textAlign: "center", color: "#64748b", fontSize: "12px" }}>
                      No shades added yet. Product will sell as a single standard item.<br />
                      <span style={{ color: "#e2136e", fontWeight: "700" }}>Click "+ Add Shade"</span> to add shades (e.g. Creamy Beige, Natural, Yellow, etc.).
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "380px", overflowY: "auto", paddingRight: "4px" }}>
                      {productForm.variants.map((v, vIdx) => (
                        <div
                          key={v.id || vIdx}
                          style={{
                            backgroundColor: "#ffffff",
                            border: "1px solid #fbcfe8",
                            borderRadius: "8px",
                            padding: "10px",
                            display: "flex",
                            flexDirection: "column",
                            gap: "8px",
                            boxShadow: "0 1px 4px rgba(0,0,0,0.03)"
                          }}
                        >
                          {/* Row 1: Swatch, Shade Name, Delete */}
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "4px", flexShrink: 0 }}>
                              <input
                                type="color"
                                value={v.shadeColor || "#e63b7a"}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setProductForm(prev => {
                                    const next = [...prev.variants];
                                    next[vIdx] = { ...next[vIdx], shadeColor: val };
                                    return { ...prev, variants: next };
                                  });
                                }}
                                title="Pick Swatch Color"
                                style={{
                                  width: "30px",
                                  height: "30px",
                                  border: "1.5px solid #cbd5e1",
                                  borderRadius: "6px",
                                  cursor: "pointer",
                                  padding: 0,
                                  backgroundColor: "transparent"
                                }}
                              />
                            </div>

                            <input
                              type="text"
                              required
                              placeholder="Shade Name (e.g. Creamy Beige, Yellow, Natural)"
                              value={v.name}
                              onChange={(e) => {
                                const val = e.target.value;
                                setProductForm(prev => {
                                  const next = [...prev.variants];
                                  next[vIdx] = { ...next[vIdx], name: val };
                                  return { ...prev, variants: next };
                                });
                              }}
                              style={{
                                flex: 1,
                                padding: "7px 10px",
                                border: "1px solid #cbd5e1",
                                borderRadius: "6px",
                                fontSize: "12.5px",
                                fontWeight: "700"
                              }}
                            />

                            <button
                              type="button"
                              onClick={() => {
                                setProductForm(prev => ({
                                  ...prev,
                                  variants: prev.variants.filter((_, idx) => idx !== vIdx)
                                }));
                              }}
                              style={{
                                backgroundColor: "#fee2e2",
                                color: "#dc2626",
                                border: "none",
                                padding: "6px 8px",
                                borderRadius: "6px",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: "2px",
                                fontSize: "11px",
                                fontWeight: "700",
                                flexShrink: 0
                              }}
                              title="Delete this shade"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>

                          {/* Row 2: Price, Discount Price, Stock, SKU */}
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "6px" }}>
                            <div>
                              <label style={{ fontSize: "10.5px", fontWeight: "700", color: "#64748b", display: "block" }}>Price (৳)</label>
                              <input
                                type="number"
                                placeholder="Base Price"
                                value={v.price}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setProductForm(prev => {
                                    const next = [...prev.variants];
                                    next[vIdx] = { ...next[vIdx], price: val };
                                    return { ...prev, variants: next };
                                  });
                                }}
                                style={{ width: "100%", padding: "5px 6px", border: "1px solid #cbd5e1", borderRadius: "5px", fontSize: "11.5px" }}
                              />
                            </div>
                            <div>
                              <label style={{ fontSize: "10.5px", fontWeight: "700", color: "#64748b", display: "block" }}>Discount (৳)</label>
                              <input
                                type="number"
                                placeholder="Discount"
                                value={v.discountPrice ?? ""}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setProductForm(prev => {
                                    const next = [...prev.variants];
                                    next[vIdx] = { ...next[vIdx], discountPrice: val };
                                    return { ...prev, variants: next };
                                  });
                                }}
                                style={{ width: "100%", padding: "5px 6px", border: "1px solid #cbd5e1", borderRadius: "5px", fontSize: "11.5px" }}
                              />
                            </div>
                            <div>
                              <label style={{ fontSize: "10.5px", fontWeight: "700", color: "#64748b", display: "block" }}>Stock</label>
                              <input
                                type="number"
                                placeholder="Stock"
                                value={v.stock}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setProductForm(prev => {
                                    const next = [...prev.variants];
                                    next[vIdx] = { ...next[vIdx], stock: val };
                                    return { ...prev, variants: next };
                                  });
                                }}
                                style={{ width: "100%", padding: "5px 6px", border: "1px solid #cbd5e1", borderRadius: "5px", fontSize: "11.5px" }}
                              />
                            </div>
                            <div>
                              <label style={{ fontSize: "10.5px", fontWeight: "700", color: "#64748b", display: "block" }}>SKU Code</label>
                              <input
                                type="text"
                                placeholder="SKU"
                                value={v.sku || ""}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setProductForm(prev => {
                                    const next = [...prev.variants];
                                    next[vIdx] = { ...next[vIdx], sku: val };
                                    return { ...prev, variants: next };
                                  });
                                }}
                                style={{ width: "100%", padding: "5px 6px", border: "1px solid #cbd5e1", borderRadius: "5px", fontSize: "11.5px" }}
                              />
                            </div>
                          </div>

                          {/* Row 3: Shade Specific Image */}
                          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                            <input
                              type="text"
                              placeholder="Shade Photo URL (https://...)"
                              value={v.imageUrl || ""}
                              onChange={(e) => {
                                const val = e.target.value;
                                setProductForm(prev => {
                                  const next = [...prev.variants];
                                  next[vIdx] = { ...next[vIdx], imageUrl: val };
                                  return { ...prev, variants: next };
                                });
                              }}
                              style={{ flex: 1, padding: "5px 8px", border: "1px solid #cbd5e1", borderRadius: "5px", fontSize: "11.5px" }}
                            />
                            <label style={{ backgroundColor: "#f1f5f9", border: "1px solid #cbd5e1", padding: "5px 8px", borderRadius: "5px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", fontWeight: "700", color: "#334155", whiteSpace: "nowrap" }}>
                              <Upload size={12} /> Upload
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleVariantImageUpload(e, vIdx)}
                                style={{ display: "none" }}
                              />
                            </label>
                            {v.imageUrl && (
                              <div style={{ width: "30px", height: "30px", borderRadius: "4px", border: "1px solid #cbd5e1", overflow: "hidden", flexShrink: 0, backgroundColor: "#f8fafc" }}>
                                <img src={v.imageUrl} alt={v.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
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

                <button type="submit" style={{ backgroundColor: "#e2136e", color: "#fff", border: "none", padding: "12px", borderRadius: "6px", fontWeight: "800", fontSize: "14px", cursor: "pointer", marginTop: "5px", boxShadow: "0 4px 12px rgba(226,19,110,0.3)" }}>
                  {isEditingProduct ? "UPDATE PRODUCT & SHADES" : "CREATE PRODUCT & SHADES"}
                </button>
              </form>

              {/* Products List Table */}
              <div style={{ flex: "2 1 500px", backgroundColor: "#fff", borderRadius: "12px", padding: "24px", border: "1px solid #e2e8f0", boxShadow: "0 2px 10px rgba(0,0,0,0.02)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "15px", marginBottom: "20px" }}>
                  <div>
                    <h3 style={{ fontSize: "16px", fontWeight: "800", color: "#1e293b", margin: 0 }}>All Database Products ({filteredProducts.length})</h3>
                    <p style={{ fontSize: "12px", color: "#64748b", margin: "2px 0 0 0" }}>All items from your connected cPanel database</p>
                  </div>

                  <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                    <div style={{ display: "flex", alignItems: "center", backgroundColor: "#f1f5f9", padding: "6px 12px", borderRadius: "6px", gap: "8px", border: "1px solid #cbd5e1" }}>
                      <Search size={15} color="#64748b" />
                      <input type="text" placeholder="Search by name or SKU..." value={productSearch} onChange={(e) => setProductSearch(e.target.value)} style={{ border: "none", background: "none", fontSize: "13px", outline: "none", width: "170px" }} />
                    </div>
                    <select value={productCategoryFilter} onChange={(e) => setProductCategoryFilter(e.target.value)} style={{ padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}>
                      <option value="">All Categories</option>
                      {adminCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <select value={productShadeFilter} onChange={(e: any) => setProductShadeFilter(e.target.value)} style={{ padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px", backgroundColor: productShadeFilter !== "all" ? "#fdf2f8" : "#fff", color: productShadeFilter !== "all" ? "#be185d" : "inherit", fontWeight: productShadeFilter !== "all" ? "700" : "normal" }}>
                      <option value="all">All Products</option>
                      <option value="with_shades">🎨 With Shades</option>
                      <option value="no_shades">⚪ Without Shades</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "75vh", overflowY: "auto" }}>
                  {filteredProducts.map((p) => {
                    const variant = p.variants?.[0] || { price: p.price || 0, discountPrice: p.discountPrice || null, stock: p.stock ?? 50 };
                    const image = p.images?.[0]?.url || p.imageUrl || "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&q=80";
                    const displayPrice = variant.discountPrice || variant.price || p.price || 0;
                    return (
                      <div key={p.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", border: "1px solid #f1f5f9", borderRadius: "8px", backgroundColor: "#fff", gap: "15px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "14px", flex: 1, minWidth: 0 }}>
                          <img src={image} alt={p.name} style={{ width: "46px", height: "46px", borderRadius: "6px", objectFit: "cover", backgroundColor: "#f8fafc", flexShrink: 0 }} />
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: "14px", fontWeight: "700", color: "#1e293b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</div>
                            <div style={{ display: "flex", gap: "8px", alignItems: "center", marginTop: "3px", fontSize: "12px", flexWrap: "wrap" }}>
                              <span style={{ color: "#0284c7", fontWeight: "700" }}>৳ {displayPrice}</span>
                              {(variant.discountPrice || p.discountPrice) && <span style={{ color: "#94a3b8", textDecoration: "line-through" }}>৳ {variant.price || p.price}</span>}
                              <span style={{ color: "#64748b" }}>• {p.category?.name || "Uncategorized"}</span>
                              {p.variants && p.variants.length > 0 && (
                                <span style={{ backgroundColor: "#fdf2f8", color: "#be185d", border: "1px solid #fbcfe8", padding: "1px 6px", borderRadius: "4px", fontSize: "11px", fontWeight: "700" }}>
                                  🎨 {p.variants.length} Shades
                                </span>
                              )}
                              {p.campaignName && <span style={{ backgroundColor: "#fce7f3", color: "#db2777", padding: "1px 6px", borderRadius: "4px", fontSize: "10px", fontWeight: "800" }}>{p.campaignName}</span>}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: "flex", gap: "6px", alignItems: "center", flexShrink: 0 }}>
                          <button
                            type="button"
                            onClick={() => {
                              setShadeModalProduct(p);
                              setShadeModalVariants(
                                Array.isArray(p.variants) && p.variants.length > 0
                                  ? p.variants.map((v: any, idx: number) => ({
                                      id: v.id || `var-${Date.now()}-${idx}`,
                                      name: v.name || `Shade ${idx + 1}`,
                                      shadeColor: v.shadeColor || "#e63b7a",
                                      price: v.price !== undefined ? String(v.price) : String(p.price || 0),
                                      discountPrice: v.discountPrice !== undefined && v.discountPrice !== null ? String(v.discountPrice) : "",
                                      costPrice: v.costPrice !== undefined && v.costPrice !== null ? String(v.costPrice) : "",
                                      stock: v.stock !== undefined ? String(v.stock) : "50",
                                      sku: v.sku || "",
                                      imageUrl: v.imageUrl || ""
                                    }))
                                  : []
                              );
                              setShadeModalMessage("");
                            }}
                            style={{
                              padding: "6px 11px",
                              backgroundColor: "#fdf2f8",
                              color: "#be185d",
                              border: "1.5px solid #fbcfe8",
                              borderRadius: "6px",
                              fontWeight: "800",
                              fontSize: "12px",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                              whiteSpace: "nowrap"
                            }}
                            title="Manage Shades & Swatches"
                          >
                            🎨 Shades ({p.variants?.length || 0})
                          </button>

                          <button onClick={() => {
                            setIsEditingProduct(true);
                            setProductForm({
                              id: p.id,
                              name: p.name || "",
                              description: p.description || "",
                              price: String(variant.price || p.price || ""),
                              discountPrice: (variant.discountPrice || p.discountPrice) ? String(variant.discountPrice || p.discountPrice) : "",
                              costPrice: (variant.costPrice || p.costPrice) ? String(variant.costPrice || p.costPrice) : "",
                              stock: String(variant.stock ?? p.stock ?? 50),
                              categoryId: p.categoryId || "",
                              brandId: p.brandId || "",
                              imageUrl: image,
                              campaignName: p.campaignName || "",
                              status: p.status || "Active",
                              variants: Array.isArray(p.variants) && p.variants.length > 0
                                ? p.variants.map((v: any, idx: number) => ({
                                    id: v.id || `var-${Date.now()}-${idx}`,
                                    name: v.name || `Shade ${idx + 1}`,
                                    shadeColor: v.shadeColor || "#e63b7a",
                                    price: v.price !== undefined ? String(v.price) : String(p.price || 0),
                                    discountPrice: v.discountPrice !== undefined && v.discountPrice !== null ? String(v.discountPrice) : "",
                                    costPrice: v.costPrice !== undefined && v.costPrice !== null ? String(v.costPrice) : "",
                                    stock: v.stock !== undefined ? String(v.stock) : "50",
                                    sku: v.sku || "",
                                    imageUrl: v.imageUrl || ""
                                  }))
                                : []
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

              {/* ─── DEDICATED SHADES MANAGER MODAL FOR ANY PRODUCT ─── */}
              {shadeModalProduct && (
                <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(15, 23, 42, 0.7)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: "20px" }}>
                  <div style={{ backgroundColor: "#ffffff", borderRadius: "14px", width: "100%", maxWidth: "800px", maxHeight: "90vh", display: "flex", flexDirection: "column", boxShadow: "0 20px 40px rgba(0,0,0,0.25)", overflow: "hidden" }}>
                    {/* Modal Header */}
                    <div style={{ padding: "18px 24px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between", backgroundColor: "#fff0f5" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
                        <div style={{ width: "44px", height: "44px", borderRadius: "8px", overflow: "hidden", border: "1px solid #fbcfe8", backgroundColor: "#fff", flexShrink: 0 }}>
                          <img src={shadeModalProduct.images?.[0]?.url || shadeModalProduct.imageUrl || "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&q=80"} alt="Product" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: "11px", fontWeight: "800", color: "#be185d", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                            Manage Shades & Color Swatches
                          </div>
                          <h3 style={{ margin: "2px 0 0 0", fontSize: "16px", fontWeight: "800", color: "#1e293b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {shadeModalProduct.name}
                          </h3>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => { setShadeModalProduct(null); setShadeModalMessage(""); }}
                        style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", padding: "4px", borderRadius: "6px" }}
                      >
                        <X size={20} />
                      </button>
                    </div>

                    {/* Quick Presets Bar */}
                    <div style={{ padding: "12px 24px", backgroundColor: "#fafaf9", borderBottom: "1px solid #f1f5f9", display: "flex", flexDirection: "column", gap: "8px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                        <span style={{ fontSize: "12px", fontWeight: "800", color: "#475569" }}>
                          🎨 Quick 1-Click Cosmetic Shade Presets:
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setShadeModalVariants(prev => [
                              ...prev,
                              {
                                id: `var-${Date.now()}-${prev.length}`,
                                name: `Shade ${prev.length + 1}`,
                                shadeColor: "#e63b7a",
                                price: shadeModalProduct.price || 0,
                                discountPrice: shadeModalProduct.discountPrice || "",
                                stock: 50,
                                sku: `SKU-${Date.now()}-${prev.length + 1}`,
                                imageUrl: ""
                              }
                            ]);
                          }}
                          style={{
                            backgroundColor: "#e2136e",
                            color: "#ffffff",
                            border: "none",
                            padding: "6px 14px",
                            borderRadius: "6px",
                            fontSize: "12px",
                            fontWeight: "800",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                            boxShadow: "0 2px 6px rgba(226,19,110,0.25)"
                          }}
                        >
                          <Plus size={14} /> Add Custom Shade
                        </button>
                      </div>

                      {/* Preset Buttons */}
                      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>
                        {COSMETIC_SHADE_PRESETS.map((preset, pIdx) => (
                          <button
                            key={pIdx}
                            type="button"
                            onClick={() => {
                              setShadeModalVariants(prev => [
                                ...prev,
                                {
                                  id: `var-${Date.now()}-${prev.length}`,
                                  name: preset.name,
                                  shadeColor: preset.color,
                                  price: shadeModalProduct.price || 0,
                                  discountPrice: shadeModalProduct.discountPrice || "",
                                  stock: 50,
                                  sku: `SKU-${Date.now()}-${prev.length + 1}`,
                                  imageUrl: ""
                                }
                              ]);
                            }}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                              padding: "4px 10px",
                              backgroundColor: "#ffffff",
                              border: "1px solid #e2e8f0",
                              borderRadius: "20px",
                              fontSize: "11px",
                              fontWeight: "700",
                              color: "#334155",
                              cursor: "pointer"
                            }}
                            title={`Add preset ${preset.name}`}
                          >
                            <span style={{ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: preset.color, border: "1px solid #cbd5e1" }} />
                            <span>+ {preset.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Modal Body: Scrollable Shade List */}
                    <div style={{ padding: "20px 24px", flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "12px" }}>
                      {shadeModalMessage && (
                        <div style={{ padding: "10px 14px", backgroundColor: "#ecfdf5", color: "#047857", borderRadius: "8px", fontSize: "13px", fontWeight: "700", border: "1px solid #a7f3d0" }}>
                          {shadeModalMessage}
                        </div>
                      )}

                      {shadeModalVariants.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "40px 20px", color: "#64748b", border: "2px dashed #fbcfe8", borderRadius: "10px", backgroundColor: "#fff5f8" }}>
                          <div style={{ fontSize: "28px", marginBottom: "8px" }}>🎨</div>
                          <h4 style={{ margin: "0 0 6px 0", color: "#be185d", fontSize: "15px", fontWeight: "800" }}>No Shades Added Yet</h4>
                          <p style={{ margin: "0 0 16px 0", fontSize: "12.5px" }}>
                            Click <strong>"+ Add Custom Shade"</strong> or pick one of the quick preset buttons above to add shades (e.g. Ivory, Natural, Caramel, etc.).
                          </p>
                        </div>
                      ) : (
                        shadeModalVariants.map((v, vIdx) => (
                          <div
                            key={v.id || vIdx}
                            style={{
                              backgroundColor: "#ffffff",
                              border: "1.5px solid #fbcfe8",
                              borderRadius: "10px",
                              padding: "14px",
                              display: "flex",
                              flexDirection: "column",
                              gap: "10px",
                              boxShadow: "0 2px 6px rgba(0,0,0,0.02)"
                            }}
                          >
                            {/* Row 1: Swatch, Shade Name, Delete */}
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
                                <input
                                  type="color"
                                  value={v.shadeColor || "#e63b7a"}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setShadeModalVariants(prev => {
                                      const next = [...prev];
                                      next[vIdx] = { ...next[vIdx], shadeColor: val };
                                      return next;
                                    });
                                  }}
                                  title="Pick Shade Swatch Color"
                                  style={{
                                    width: "34px",
                                    height: "34px",
                                    border: "1.5px solid #cbd5e1",
                                    borderRadius: "8px",
                                    cursor: "pointer",
                                    padding: 0,
                                    backgroundColor: "transparent"
                                  }}
                                />
                              </div>

                              <input
                                type="text"
                                required
                                placeholder="Shade Name (e.g. Creamy Beige, Natural, Yellow)"
                                value={v.name}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setShadeModalVariants(prev => {
                                    const next = [...prev];
                                    next[vIdx] = { ...next[vIdx], name: val };
                                    return next;
                                  });
                                }}
                                style={{
                                  flex: 1,
                                  padding: "8px 12px",
                                  border: "1.5px solid #cbd5e1",
                                  borderRadius: "6px",
                                  fontSize: "13px",
                                  fontWeight: "700"
                                }}
                              />

                              <button
                                type="button"
                                onClick={() => {
                                  setShadeModalVariants(prev => prev.filter((_, idx) => idx !== vIdx));
                                }}
                                style={{
                                  backgroundColor: "#fee2e2",
                                  color: "#dc2626",
                                  border: "none",
                                  padding: "7px 12px",
                                  borderRadius: "6px",
                                  cursor: "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "4px",
                                  fontSize: "11.5px",
                                  fontWeight: "700",
                                  flexShrink: 0
                                }}
                                title="Remove this shade"
                              >
                                <Trash2 size={13} /> Remove
                              </button>
                            </div>

                            {/* Row 2: Price, Discount Price, Stock, SKU */}
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "10px" }}>
                              <div>
                                <label style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", display: "block", marginBottom: "3px" }}>Price (৳)</label>
                                <input
                                  type="number"
                                  placeholder="Selling Price"
                                  value={v.price}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setShadeModalVariants(prev => {
                                      const next = [...prev];
                                      next[vIdx] = { ...next[vIdx], price: val };
                                      return next;
                                    });
                                  }}
                                  style={{ width: "100%", padding: "7px 10px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "12px" }}
                                />
                              </div>
                              <div>
                                <label style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", display: "block", marginBottom: "3px" }}>Discount (৳)</label>
                                <input
                                  type="number"
                                  placeholder="Discount"
                                  value={v.discountPrice ?? ""}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setShadeModalVariants(prev => {
                                      const next = [...prev];
                                      next[vIdx] = { ...next[vIdx], discountPrice: val };
                                      return next;
                                    });
                                  }}
                                  style={{ width: "100%", padding: "7px 10px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "12px" }}
                                />
                              </div>
                              <div>
                                <label style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", display: "block", marginBottom: "3px" }}>Stock</label>
                                <input
                                  type="number"
                                  placeholder="Units"
                                  value={v.stock}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setShadeModalVariants(prev => {
                                      const next = [...prev];
                                      next[vIdx] = { ...next[vIdx], stock: val };
                                      return next;
                                    });
                                  }}
                                  style={{ width: "100%", padding: "7px 10px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "12px" }}
                                />
                              </div>
                              <div>
                                <label style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", display: "block", marginBottom: "3px" }}>SKU Code</label>
                                <input
                                  type="text"
                                  placeholder="e.g. SN-33012"
                                  value={v.sku || ""}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setShadeModalVariants(prev => {
                                      const next = [...prev];
                                      next[vIdx] = { ...next[vIdx], sku: val };
                                      return next;
                                    });
                                  }}
                                  style={{ width: "100%", padding: "7px 10px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "12px" }}
                                />
                              </div>
                            </div>

                            {/* Row 3: Shade Specific Photo */}
                            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                              <input
                                type="text"
                                placeholder="Shade Photo URL (https://...)"
                                value={v.imageUrl || ""}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setShadeModalVariants(prev => {
                                    const next = [...prev];
                                    next[vIdx] = { ...next[vIdx], imageUrl: val };
                                    return next;
                                  });
                                }}
                                style={{ flex: 1, padding: "7px 10px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "12px" }}
                              />
                              <label style={{ backgroundColor: "#f1f5f9", border: "1px solid #cbd5e1", padding: "7px 12px", borderRadius: "6px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", fontSize: "11.5px", fontWeight: "700", color: "#334155", whiteSpace: "nowrap" }}>
                                <Upload size={13} /> Upload Image
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => handleShadeModalVariantImageUpload(e, vIdx)}
                                  style={{ display: "none" }}
                                />
                              </label>
                              {v.imageUrl && (
                                <div style={{ width: "36px", height: "36px", borderRadius: "6px", border: "1px solid #cbd5e1", overflow: "hidden", flexShrink: 0, backgroundColor: "#f8fafc" }}>
                                  <img src={v.imageUrl} alt={v.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                </div>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Modal Footer */}
                    <div style={{ padding: "16px 24px", borderTop: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between", backgroundColor: "#fafaf9" }}>
                      <button
                        type="button"
                        onClick={() => { setShadeModalProduct(null); setShadeModalMessage(""); }}
                        style={{ backgroundColor: "#f1f5f9", color: "#475569", border: "1px solid #cbd5e1", padding: "10px 18px", borderRadius: "8px", fontWeight: "700", fontSize: "13px", cursor: "pointer" }}
                      >
                        Cancel
                      </button>

                      <button
                        type="button"
                        disabled={shadeModalLoading}
                        onClick={handleSaveShadeModal}
                        style={{
                          backgroundColor: "#e2136e",
                          color: "#ffffff",
                          border: "none",
                          padding: "10px 24px",
                          borderRadius: "8px",
                          fontWeight: "800",
                          fontSize: "13.5px",
                          cursor: shadeModalLoading ? "not-allowed" : "pointer",
                          opacity: shadeModalLoading ? 0.7 : 1,
                          boxShadow: "0 4px 14px rgba(226,19,110,0.35)",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px"
                        }}
                      >
                        {shadeModalLoading ? "Saving Shades..." : "💾 SAVE ALL SHADES & UPDATE STOREFRONT"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
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
                    <select required value={bannerForm.page} onChange={(e) => handleBannerPlacementChange(e.target.value)} style={{ width: "100%", padding: "10px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px" }}>
                      <optgroup label="Shop Beauty Products by Category (8 Cards)">
                        <option value="Category: Makeup">🛍️ Category: Makeup (400×400 px)</option>
                        <option value="Category: Skin">🛍️ Category: Skin (400×400 px)</option>
                        <option value="Category: Hair">🛍️ Category: Hair (400×400 px)</option>
                        <option value="Category: Personal Care">🛍️ Category: Personal Care (400×400 px)</option>
                        <option value="Category: Mom & Baby">🛍️ Category: Mom & Baby (400×400 px)</option>
                        <option value="Category: Fragrance">🛍️ Category: Fragrance (400×400 px)</option>
                        <option value="Category: Undergarments">🛍️ Category: Undergarments (400×400 px)</option>
                        <option value="Category: Combo">🛍️ Category: Combo (400×400 px)</option>
                      </optgroup>
                      <optgroup label="Shop By Concern (10 Problem Solutions)">
                        <option value="Concern: Acne">🌿 Concern: Acne Treatment (400×400 px)</option>
                        <option value="Concern: Anti Aging">✨ Concern: Anti Aging Treatment (400×400 px)</option>
                        <option value="Concern: Dandruff">💧 Concern: Dandruff Solution (400×400 px)</option>
                        <option value="Concern: Dry Skin">🧴 Concern: Dry Skin Treatment (400×400 px)</option>
                        <option value="Concern: Hair Fall">💇‍♀️ Concern: Hair Fall Treatment (400×400 px)</option>
                        <option value="Concern: Oil Control">🍃 Concern: Oil Control Treatment (400×400 px)</option>
                        <option value="Concern: Pore Care">🫧 Concern: Pore Care (400×400 px)</option>
                        <option value="Concern: Spot Treatment">🎯 Concern: Spot Treatment (400×400 px)</option>
                        <option value="Concern: Hair Thinning">🌾 Concern: Hair Thinning Solution (400×400 px)</option>
                        <option value="Concern: Sun Burn">☀️ Concern: Sun Burn Treatment (400×400 px)</option>
                      </optgroup>
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
                      <label style={{ backgroundColor: "#0f172a", color: "#fff", padding: "10px 16px", borderRadius: "6px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: "700" }}>
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

                  <button type="submit" style={{ padding: "12px 24px", backgroundColor: "#e2136e", color: "#fff", border: "none", borderRadius: "6px", fontWeight: "800", fontSize: "14px", cursor: "pointer", height: "42px", boxShadow: "0 4px 12px rgba(226,19,110,0.3)" }}>
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
                      <option value="Category:">Category Cards (Shop Beauty)</option>
                      <option value="Concern:">Concern Cards (Shop By Concern)</option>
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

                  <button type="submit" style={{ backgroundColor: "#e2136e", color: "#fff", border: "none", padding: "10px", borderRadius: "6px", fontWeight: "800", fontSize: "13px", cursor: "pointer", marginTop: "4px", boxShadow: "0 4px 12px rgba(226,19,110,0.3)" }}>
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

                  <button type="submit" style={{ backgroundColor: "#e2136e", color: "#fff", border: "none", padding: "10px", borderRadius: "6px", fontWeight: "800", fontSize: "13px", cursor: "pointer", marginTop: "4px", boxShadow: "0 4px 12px rgba(226,19,110,0.3)" }}>
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
                    <div key={o.id} onClick={() => setSelectedOrder(o)} style={{ padding: "12px 14px", border: selectedOrder?.id === o.id ? "2px solid #e2136e" : "1px solid #e2e8f0", borderRadius: "8px", cursor: "pointer", backgroundColor: selectedOrder?.id === o.id ? "#fdf2f8" : "#fff", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <strong style={{ fontSize: "13px", color: "#e2136e", display: "block" }}>{o.orderNumber}</strong>
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
                            <strong>Courier Tracking:</strong> <a href={selectedOrder.trackingLink} target="_blank" rel="noopener noreferrer" style={{ color: "#e2136e" }}>{selectedOrder.trackingLink}</a>
                          </div>
                        )}
                        <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
                          <button 
                            type="button"
                            onClick={() => handleSendCourier(selectedOrder.id, "steadfast")} 
                            style={{ padding: "7px 12px", backgroundColor: "#0284c7", color: "#fff", border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: "700", cursor: "pointer", display: "flex", alignItems: "center", gap: "5px" }}
                          >
                            🚚 Send to Steadfast
                          </button>
                          <button 
                            type="button"
                            onClick={() => handleSendCourier(selectedOrder.id, "pathao")} 
                            style={{ padding: "7px 12px", backgroundColor: "#dc2626", color: "#fff", border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: "700", cursor: "pointer", display: "flex", alignItems: "center", gap: "5px" }}
                          >
                            🛵 Send to Pathao
                          </button>
                        </div>
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
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button onClick={() => handleApproveReview(rev.id)} style={{ padding: "8px 16px", backgroundColor: "#10b981", color: "#fff", border: "none", borderRadius: "6px", fontWeight: "700", fontSize: "12px", cursor: "pointer" }}>
                          APPROVE
                        </button>
                        <button onClick={() => handleRejectReview(rev.id)} style={{ padding: "8px 14px", backgroundColor: "#fee2e2", color: "#dc2626", border: "none", borderRadius: "6px", fontWeight: "700", fontSize: "12px", cursor: "pointer" }}>
                          REJECT
                        </button>
                      </div>
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

                <button type="submit" style={{ padding: "14px", backgroundColor: "#e2136e", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "800", fontSize: "15px", cursor: "pointer", boxShadow: "0 4px 14px rgba(226,19,110,0.3)" }}>
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
                      backgroundColor: selectedCmsSlug === p.slug ? "#e2136e" : "#f1f5f9",
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
                      style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", backgroundColor: "#f8fafc", fontSize: "13.5px", color: "#e2136e", fontWeight: "800" }}
                    />
                  </div>
                </div>

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <label style={{ fontSize: "13px", fontWeight: "800", color: "#1e293b" }}>Visual Content Editor</label>
                    <span style={{ fontSize: "11px", color: "#e2136e", fontWeight: "700" }}>Click formatting buttons below to insert sections</span>
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
                    }} style={{ padding: "4px 12px", fontSize: "12px", fontWeight: "800", backgroundColor: "#fdf2f8", color: "#be185d", border: "1px solid #fbcfe8", borderRadius: "4px", cursor: "pointer" }}>📷 Insert Image</button>
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
                  <button type="submit" style={{ backgroundColor: "#e2136e", color: "#fff", border: "none", padding: "12px 32px", borderRadius: "8px", fontWeight: "800", fontSize: "14px", cursor: "pointer", boxShadow: "0 4px 14px rgba(226,19,110,0.3)" }}>
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
