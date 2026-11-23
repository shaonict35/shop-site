import { emitStorefrontUpdate } from "../utils/socketSync";

import { Router, Response } from "express";
import prisma from "../prisma";
import { authenticateJWT, requireRole, AuthenticatedRequest } from "../middleware/auth";
import { invalidatePrismaCache } from "../firebase";

const router = Router();

// Default values for page customizations
const DEFAULT_SEASONAL_OFFER = {
  title: "বিশেষ অফারে অরিজিনাল বিউটি কম্বো প্যাকেজ!",
  subtitle: "সীমিত সময়ের জন্য ছাড়! ১০০% অরিজিনাল প্রোডাক্ট দ্রুত ক্যাশ অন ডেলিভারিতে পান।",
  videoUrl: "",
  productTitle: "প্রিমিয়াম বিউটি ও স্কিনকেয়ার গ্লো সেট",
  productPrice: "1250",
  originalPrice: "1850",
  productImages: [
    "/placeholder-product.svg"
  ],
  description: "আমাদের এই বিশেষ প্যাকেজে রয়েছে ত্বকের যত্ন ও উজ্জ্বলতার জন্য প্রয়োজনীয় প্রিমিয়াম উপাদান। নিয়মিত ব্যবহারে পাবেন দাগহীন, উজ্জ্বল ও সতেজ ত্বক।",
  bulletPoints: "১০০% অরিজিনাল প্রোডাক্ট|ত্বক হবে সতেজ ও উজ্জ্বল|কোনো সাইড ইফেক্ট নেই|সারাদেশে ক্যাশ অন ডেলিভারি",
  insideDhakaShipping: "70",
  subAreaShipping: "100",
  outsideDhakaShipping: "130",
  isActive: true
};

const DEFAULT_PAGES_CONFIG = {
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
      { name: "Acne", subtitle: "TREATMENT", image: "/placeholder-product.svg", link: "/shop?category=skincare&sub=Acne%20Treatment" },
      { name: "Anti Aging", subtitle: "CARE", image: "/placeholder-product.svg", link: "/shop?category=skincare&sub=Anti%20Aging" },
      { name: "Dandruff", subtitle: "SOLUTION", image: "/placeholder-product.svg", link: "/shop?category=haircare&sub=Dandruff" },
      { name: "Dry Skin", subtitle: "HYDRATION", image: "/placeholder-product.svg", link: "/shop?category=skincare&sub=Dry%20Skin" },
      { name: "Hair Fall", subtitle: "DEFENSE", image: "/placeholder-product.svg", link: "/shop?category=haircare&sub=Hair%20Fall" },
      { name: "Oil Control", subtitle: "BALANCE", image: "/placeholder-product.svg", link: "/shop?category=skincare" },
      { name: "Pore Care", subtitle: "REFINING", image: "/placeholder-product.svg", link: "/shop?category=skincare&sub=Pore%20Care" },
      { name: "Spot Treatment", subtitle: "CLEAR GLOW", image: "/placeholder-product.svg", link: "/shop?category=skincare" },
      { name: "Hair Thinning", subtitle: "VOLUME", image: "/placeholder-product.svg", link: "/shop?category=haircare" },
      { name: "Sun Burn", subtitle: "RELIEF", image: "/placeholder-product.svg", link: "/shop?category=skincare" }
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
};

let publicSettingsCache: { data: any; expiry: number } | null = null;
export function invalidatePublicSettingsCache() {
  publicSettingsCache = null;
}

// GET /api/settings/public (Public access for analytics & UI configurations)
router.get("/public", async (req, res) => {
  try {
    const isBypass = req.query.bypass === "true" || req.query.t;
    if (!isBypass && publicSettingsCache && publicSettingsCache.expiry > Date.now()) {
      return res.json(publicSettingsCache.data);
    }

    const keys = [
      "META_PIXEL_ID",
      "GA4_MEASUREMENT_ID",
      "GTM_CONTAINER_ID",
      "PAGES_CUSTOMIZATION_CONFIG",
      "SEASONAL_OFFER_DATA",
      "AVAILABLE_OFFERS"
    ];
    const settings = await prisma.setting.findMany({
      where: { key: { in: keys } }
    });

    const publicSettings = settings.reduce((acc: any, s) => {
      try {
        acc[s.key] = JSON.parse(s.value);
      } catch (e) {
        acc[s.key] = s.value;
      }
      return acc;
    }, {});

    // Provide fallback defaults if not yet set in DB
    if (!publicSettings.PAGES_CUSTOMIZATION_CONFIG) {
      publicSettings.PAGES_CUSTOMIZATION_CONFIG = DEFAULT_PAGES_CONFIG;
    }
    if (!publicSettings.SEASONAL_OFFER_DATA) {
      publicSettings.SEASONAL_OFFER_DATA = DEFAULT_SEASONAL_OFFER;
    }

    if (!isBypass) {
      publicSettingsCache = { data: publicSettings, expiry: Date.now() + 120000 };
    }

    res.json(publicSettings);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/settings/seasonal-offer (Public access for seasonal landing page)
router.get("/seasonal-offer", async (req, res) => {
  try {
    const setting = await prisma.setting.findUnique({
      where: { key: "SEASONAL_OFFER_DATA" }
    });

    if (setting && setting.value) {
      try {
        return res.json(JSON.parse(setting.value));
      } catch (e) {
        return res.json(DEFAULT_SEASONAL_OFFER);
      }
    }

    res.json(DEFAULT_SEASONAL_OFFER);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/settings/seasonal-offer (Admin save)
router.post("/seasonal-offer", async (req, res) => {
  try {
    const payload = req.body;
    if (!payload || typeof payload !== "object") {
      return res.status(400).json({ error: "Invalid payload" });
    }

    await prisma.setting.upsert({
      where: { key: "SEASONAL_OFFER_DATA" },
      update: { value: JSON.stringify(payload) },
      create: { key: "SEASONAL_OFFER_DATA", value: JSON.stringify(payload) }
    });

    emitStorefrontUpdate(req, "seasonal-offer", payload);
    res.json({ message: "Seasonal offer updated successfully", data: payload });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/settings/pages-config (Public / Admin read for all 5 page/section controls)
router.get("/pages-config", async (req, res) => {
  try {
    const setting = await prisma.setting.findUnique({
      where: { key: "PAGES_CUSTOMIZATION_CONFIG" }
    });

    if (setting && setting.value) {
      try {
        const parsed = JSON.parse(setting.value);
        return res.json({ ...DEFAULT_PAGES_CONFIG, ...parsed });
      } catch (e) {
        return res.json(DEFAULT_PAGES_CONFIG);
      }
    }

    res.json(DEFAULT_PAGES_CONFIG);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/settings/pages-config (Admin save for all 5 page/section controls)
router.post("/pages-config", async (req, res) => {
  try {
    const payload = req.body;
    if (!payload || typeof payload !== "object") {
      return res.status(400).json({ error: "Invalid payload" });
    }

    await prisma.setting.upsert({
      where: { key: "PAGES_CUSTOMIZATION_CONFIG" },
      update: { value: JSON.stringify(payload) },
      create: { key: "PAGES_CUSTOMIZATION_CONFIG", value: JSON.stringify(payload) }
    });

    res.json({ message: "Pages configuration updated successfully", data: payload });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/settings (Admin only)
router.get("/", authenticateJWT as any, requireRole(["SuperAdmin", "Manager", "Admin"]) as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const settings = await prisma.setting.findMany();
    const settingsObj = settings.reduce((acc: any, s) => {
      acc[s.key] = s.value;
      return acc;
    }, {});

    const siteSettings = await prisma.siteSettings.findFirst().catch(() => null);

    // Provide default fallbacks for Pathao
    if (!settingsObj.PATHAO_MODE) settingsObj.PATHAO_MODE = siteSettings?.pathaoMode || process.env.PATHAO_MODE || "sandbox";
    if (!settingsObj.PATHAO_BASE_URL) settingsObj.PATHAO_BASE_URL = siteSettings?.pathaoBaseUrl || process.env.PATHAO_BASE_URL || (settingsObj.PATHAO_MODE === "live" ? "https://api-hermes.pathao.com" : "https://courier-api-sandbox.pathao.com");
    if (!settingsObj.PATHAO_CLIENT_ID) settingsObj.PATHAO_CLIENT_ID = siteSettings?.pathaoClientId || process.env.PATHAO_CLIENT_ID || "7N1aMJQbWm";
    if (!settingsObj.PATHAO_CLIENT_SECRET) settingsObj.PATHAO_CLIENT_SECRET = siteSettings?.pathaoClientSecret || process.env.PATHAO_CLIENT_SECRET || "wRcaibZkUdSNz2EI9ZyuXLlNrnAv0TdPUPXMnD39";
    if (!settingsObj.PATHAO_USERNAME) settingsObj.PATHAO_USERNAME = siteSettings?.pathaoUsername || process.env.PATHAO_USERNAME || "test@pathao.com";
    if (!settingsObj.PATHAO_PASSWORD) settingsObj.PATHAO_PASSWORD = siteSettings?.pathaoPassword || process.env.PATHAO_PASSWORD || "lovePathao";
    if (!settingsObj.PATHAO_STORE_ID) settingsObj.PATHAO_STORE_ID = siteSettings?.pathaoStoreId ? String(siteSettings.pathaoStoreId) : (process.env.PATHAO_STORE_ID || "");

    // Provide default fallbacks for bKash
    if (!settingsObj.BKASH_MODE) settingsObj.BKASH_MODE = siteSettings?.bkashMode || process.env.BKASH_MODE || "sandbox";
    if (!settingsObj.BKASH_BASE_URL) settingsObj.BKASH_BASE_URL = siteSettings?.bkashBaseUrl || process.env.BKASH_BASE_URL || (settingsObj.BKASH_MODE === "live" ? "https://tokenized.pay.bka.sh" : "https://tokenized.sandbox.bka.sh");
    if (!settingsObj.BKASH_APP_KEY) settingsObj.BKASH_APP_KEY = siteSettings?.bkashAppKey || process.env.BKASH_APP_KEY || "sandbox_bkash_app_key";
    if (!settingsObj.BKASH_APP_SECRET) settingsObj.BKASH_APP_SECRET = siteSettings?.bkashAppSecret || process.env.BKASH_APP_SECRET || "sandbox_bkash_app_secret";
    if (!settingsObj.BKASH_USERNAME) settingsObj.BKASH_USERNAME = siteSettings?.bkashUsername || process.env.BKASH_USERNAME || "sandbox_bkash_username";
    if (!settingsObj.BKASH_PASSWORD) settingsObj.BKASH_PASSWORD = siteSettings?.bkashPassword || process.env.BKASH_PASSWORD || "sandbox_bkash_password";
    if (!settingsObj.BKASH_MERCHANT_NO && !settingsObj.BKASH_MERCHANT_NUMBER) {
      settingsObj.BKASH_MERCHANT_NO = siteSettings?.bkashMerchantNumber || process.env.BKASH_MERCHANT_NUMBER || "01700000000";
      settingsObj.BKASH_MERCHANT_NUMBER = settingsObj.BKASH_MERCHANT_NO;
    }

    res.json(settingsObj);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/settings/bulk (Admin bulk update)
router.post("/bulk", authenticateJWT as any, requireRole(["SuperAdmin", "Admin", "Manager"]) as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const settings = req.body;

    if (!settings || typeof settings !== "object") {
      return res.status(400).json({ error: "Invalid settings payload" });
    }

    const updatePromises = Object.entries(settings).map(([key, value]) => {
      const stringVal = typeof value === "object" ? JSON.stringify(value) : String(value ?? "");
      return prisma.setting.upsert({
        where: { key },
        update: { value: stringVal },
        create: { id: `set-${key}`, key, value: stringVal },
      });
    });

    await Promise.all(updatePromises);

    // Sync to Prisma SiteSettings model as well
    try {
      const siteSettingsUpdate: any = {};
      if (settings.PATHAO_MODE) siteSettingsUpdate.pathaoMode = settings.PATHAO_MODE;
      if (settings.PATHAO_BASE_URL) siteSettingsUpdate.pathaoBaseUrl = settings.PATHAO_BASE_URL;
      if (settings.PATHAO_CLIENT_ID) siteSettingsUpdate.pathaoClientId = settings.PATHAO_CLIENT_ID;
      if (settings.PATHAO_CLIENT_SECRET) siteSettingsUpdate.pathaoClientSecret = settings.PATHAO_CLIENT_SECRET;
      if (settings.PATHAO_USERNAME) siteSettingsUpdate.pathaoUsername = settings.PATHAO_USERNAME;
      if (settings.PATHAO_PASSWORD) siteSettingsUpdate.pathaoPassword = settings.PATHAO_PASSWORD;
      if (settings.PATHAO_STORE_ID !== undefined) siteSettingsUpdate.pathaoStoreId = settings.PATHAO_STORE_ID ? parseInt(String(settings.PATHAO_STORE_ID), 10) : null;

      if (settings.BKASH_MODE) siteSettingsUpdate.bkashMode = settings.BKASH_MODE;
      if (settings.BKASH_BASE_URL) siteSettingsUpdate.bkashBaseUrl = settings.BKASH_BASE_URL;
      if (settings.BKASH_APP_KEY) siteSettingsUpdate.bkashAppKey = settings.BKASH_APP_KEY;
      if (settings.BKASH_APP_SECRET) siteSettingsUpdate.bkashAppSecret = settings.BKASH_APP_SECRET;
      if (settings.BKASH_USERNAME) siteSettingsUpdate.bkashUsername = settings.BKASH_USERNAME;
      if (settings.BKASH_PASSWORD) siteSettingsUpdate.bkashPassword = settings.BKASH_PASSWORD;
      if (settings.BKASH_MERCHANT_NO || settings.BKASH_MERCHANT_NUMBER) {
        siteSettingsUpdate.bkashMerchantNumber = settings.BKASH_MERCHANT_NO || settings.BKASH_MERCHANT_NUMBER;
      }

      if (Object.keys(siteSettingsUpdate).length > 0) {
        await prisma.siteSettings.upsert({
          where: { id: "default" },
          update: siteSettingsUpdate,
          create: { id: "default", ...siteSettingsUpdate }
        });
      }
    } catch (siteErr) {
      console.warn("Failed to sync SiteSettings model:", siteErr);
    }

    invalidatePrismaCache("settings");

    emitStorefrontUpdate(req, "settings", settings);
    res.json({ message: "Settings updated successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Helper to get custom APIs from DB
const DEFAULT_CUSTOM_APIS = [
  {
    id: "api-steadfast-default",
    name: "Steadfast Courier API",
    provider: "Courier",
    endpointUrl: "https://portal.packzy.com/api/v1",
    apiKey: "YOUR_STEADFAST_API_KEY",
    secretKey: "YOUR_STEADFAST_SECRET_KEY",
    clientId: "glowgoodly-sf",
    method: "POST",
    customHeaders: '{"Content-Type": "application/json"}',
    isActive: true,
    notes: "Automated parcel creation and live tracking integration",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "api-bkash-default",
    name: "bKash Tokenized Checkout API",
    provider: "Payment",
    endpointUrl: "https://tokenized.pay.bka.sh/v1.2.0-beta",
    apiKey: "YOUR_BKASH_APP_KEY",
    secretKey: "YOUR_BKASH_APP_SECRET",
    clientId: "017XXXXXXXX",
    method: "POST",
    customHeaders: '{"Content-Type": "application/json"}',
    isActive: true,
    notes: "Direct bKash online merchant payment gateway",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "api-bulksms-default",
    name: "Greenweb / BulkSMS BD Gateway",
    provider: "SMS",
    endpointUrl: "http://api.greenweb.com.bd/api.php",
    apiKey: "YOUR_SMS_API_KEY",
    secretKey: "",
    clientId: "GlowGoodly",
    method: "POST",
    customHeaders: '{"Content-Type": "application/x-www-form-urlencoded"}',
    isActive: true,
    notes: "Order confirmation and OTP SMS notifications",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// GET /api/settings/custom-apis
router.get("/custom-apis", async (req, res) => {
  try {
    let setting: any = null;
    try {
      setting = await prisma.setting.findUnique({
        where: { key: "DYNAMIC_CUSTOM_APIS" }
      });
    } catch (_) { }

    if (setting && setting.value) {
      try {
        const parsed = JSON.parse(setting.value);
        if (Array.isArray(parsed)) {
          return res.json(parsed);
        }
      } catch (_) { }
    }

    res.json(DEFAULT_CUSTOM_APIS);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/settings/custom-apis (Add or update an API)
router.post("/custom-apis", authenticateJWT as any, requireRole(["SuperAdmin", "Admin", "Manager"]) as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id, name, provider, endpointUrl, apiKey, secretKey, clientId, method, customHeaders, isActive, notes } = req.body;

    if (!name || !endpointUrl) {
      return res.status(400).json({ error: "API Name and Endpoint URL are required" });
    }

    // Get current list
    let list: any[] = [];
    try {
      const setting = await prisma.setting.findUnique({ where: { key: "DYNAMIC_CUSTOM_APIS" } });
      if (setting && setting.value) {
        list = JSON.parse(setting.value);
      } else {
        list = [...DEFAULT_CUSTOM_APIS];
      }
    } catch (_) {
      list = [...DEFAULT_CUSTOM_APIS];
    }

    const apiId = id || `api_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const existingIndex = list.findIndex(a => a.id === apiId);

    const apiItem = {
      id: apiId,
      name: name.trim(),
      provider: provider || "Custom",
      endpointUrl: endpointUrl.trim(),
      apiKey: apiKey || "",
      secretKey: secretKey || "",
      clientId: clientId || "",
      method: method || "POST",
      customHeaders: customHeaders || "",
      isActive: isActive !== false,
      notes: notes || "",
      createdAt: existingIndex >= 0 ? list[existingIndex].createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (existingIndex >= 0) {
      list[existingIndex] = apiItem;
    } else {
      list.unshift(apiItem);
    }

    try {
      await prisma.setting.upsert({
        where: { key: "DYNAMIC_CUSTOM_APIS" },
        update: { value: JSON.stringify(list) },
        create: { key: "DYNAMIC_CUSTOM_APIS", value: JSON.stringify(list) }
      });
    } catch (_) { }

    res.status(200).json({
      message: existingIndex >= 0 ? "API configuration updated successfully" : "New API added successfully",
      api: apiItem,
      allApis: list
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/settings/custom-apis/:id
router.delete("/custom-apis/:id", authenticateJWT as any, requireRole(["SuperAdmin", "Admin", "Manager"]) as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    let list: any[] = [];
    try {
      const setting = await prisma.setting.findUnique({ where: { key: "DYNAMIC_CUSTOM_APIS" } });
      if (setting && setting.value) {
        list = JSON.parse(setting.value);
      } else {
        list = [...DEFAULT_CUSTOM_APIS];
      }
    } catch (_) {
      list = [...DEFAULT_CUSTOM_APIS];
    }

    const updatedList = list.filter(a => a.id !== id);

    try {
      await prisma.setting.upsert({
        where: { key: "DYNAMIC_CUSTOM_APIS" },
        update: { value: JSON.stringify(updatedList) },
        create: { key: "DYNAMIC_CUSTOM_APIS", value: JSON.stringify(updatedList) }
      });
    } catch (_) { }

    res.json({ message: "API removed successfully", allApis: updatedList });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/settings/custom-apis/test (Test connection/ping)
router.post("/custom-apis/test", authenticateJWT as any, requireRole(["SuperAdmin", "Admin", "Manager"]) as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { endpointUrl, method, apiKey, secretKey, customHeaders } = req.body;
    if (!endpointUrl) {
      return res.status(400).json({ error: "Endpoint URL is required to test connection" });
    }

    const headers: Record<string, string> = {
      "User-Agent": "GlowGoodly-API-Tester/1.0",
      "Accept": "application/json"
    };

    if (apiKey) {
      headers["Authorization"] = apiKey.startsWith("Bearer ") ? apiKey : `Bearer ${apiKey}`;
      headers["Api-Key"] = apiKey;
    }
    if (secretKey) {
      headers["Secret-Key"] = secretKey;
    }

    if (customHeaders) {
      try {
        const parsed = JSON.parse(customHeaders);
        Object.assign(headers, parsed);
      } catch (_) { }
    }

    const startTime = Date.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    try {
      const testMethod = (method || "GET").toUpperCase();
      const response = await fetch(endpointUrl, {
        method: testMethod === "GET" || testMethod === "HEAD" ? testMethod : "GET",
        headers,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      const latencyMs = Date.now() - startTime;

      return res.json({
        success: response.ok,
        status: response.status,
        statusText: response.statusText,
        latencyMs,
        message: response.ok
          ? `Connection verified! Status: ${response.status} (${latencyMs}ms)`
          : `Endpoint responded with HTTP ${response.status}: ${response.statusText}`
      });
    } catch (fetchErr: any) {
      clearTimeout(timeoutId);
      const latencyMs = Date.now() - startTime;
      return res.json({
        success: false,
        latencyMs,
        message: fetchErr.name === "AbortError"
          ? "Connection timed out after 6 seconds"
          : `Network error: ${fetchErr.message}`
      });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/settings/available-offers
router.get("/available-offers", async (req, res) => {
  try {
    const setting = await prisma.setting.findUnique({
      where: { key: "AVAILABLE_OFFERS" }
    });
    if (!setting) return res.json([]);
    res.json(JSON.parse(setting.value));
  } catch (e: any) {
    res.json([]);
  }
});

// POST /api/settings/available-offers
router.post("/available-offers", async (req, res) => {
  try {
    const offers = req.body;
    await prisma.setting.upsert({
      where: { key: "AVAILABLE_OFFERS" },
      update: { value: JSON.stringify(offers) },
      create: { key: "AVAILABLE_OFFERS", value: JSON.stringify(offers) }
    });
    invalidatePrismaCache();
    invalidatePublicSettingsCache();
    emitStorefrontUpdate(req, "settings", { key: "AVAILABLE_OFFERS" });
    res.json({ success: true, offers });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
