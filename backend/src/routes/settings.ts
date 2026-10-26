import { Router, Response } from "express";
import fs from "fs";
import path from "path";
import prisma from "../prisma";
import { authenticateJWT, requireRole, AuthenticatedRequest } from "../middleware/auth";
import { saveBase64Image, saveBase64Media } from "../services/imageStorage";

const router = Router();

// Default values for seasonal landing page
const DEFAULT_SEASONAL_OFFER = {
  slug: "seasonal-offer",
  title: "বিশেষ অফারে অরিজিনাল বিউটি কম্বো প্যাকেজ!",
  subtitle: "সীমিত সময়ের জন্য ছাড়! ১০০% অরিজিনাল প্রোডাক্ট দ্রুত ক্যাশ অন ডেলিভারিতে পান।",
  videoUrl: "",
  facebookGroupUrl: "https://www.facebook.com/groups/675430693128442",
  productTitle: "প্রিমিয়াম বিউটি ও স্কিনকেয়ার গ্লো সেট",
  productPrice: "1250",
  originalPrice: "1850",
  productImages: [
    "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&auto=format&fit=crop&q=80"
  ],
  description: "আমাদের এই বিশেষ প্যাকেজে রয়েছে ত্বকের যত্ন ও উজ্জ্বলতার জন্য প্রয়োজনীয় প্রিমিয়াম উপাদান। নিয়মিত ব্যবহারে পাবেন দাগহীন, উজ্জ্বল ও সতেজ ত্বক।",
  bulletPoints: "১০০% অরিজিনাল প্রোডাক্ট|ত্বক হবে সতেজ ও উজ্জ্বল|কোনো সাইড ইফেক্ট নেই|সারাদেশে ক্যাশ অন ডেলিভারি",
  insideDhakaShipping: "70",
  subAreaShipping: "100",
  outsideDhakaShipping: "130",
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

const LANDING_PAGES_FILE = path.join(process.cwd(), "data", "landing_pages.json");

function loadLandingPagesFromDisk(): any[] {
  try {
    if (fs.existsSync(LANDING_PAGES_FILE)) {
      const raw = fs.readFileSync(LANDING_PAGES_FILE, "utf-8");
      const list = JSON.parse(raw);
      if (Array.isArray(list)) return list;
    }
  } catch (e) {}
  return [];
}

function persistLandingPagesToDisk(pages: any[]) {
  try {
    const dir = path.dirname(LANDING_PAGES_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(LANDING_PAGES_FILE, JSON.stringify(pages, null, 2), "utf-8");
  } catch (e) {}
}

function processLandingPageMedia(pageData: any): any {
  const processed = { ...pageData };

  // Process productImages
  if (Array.isArray(processed.productImages)) {
    processed.productImages = processed.productImages.map((img: string) => {
      if (typeof img === "string" && img.startsWith("data:image/")) {
        return saveBase64Image(img, "banners");
      }
      return img;
    });
  } else if (typeof processed.productImages === "string") {
    if (processed.productImages.startsWith("data:image/")) {
      processed.productImages = [saveBase64Image(processed.productImages, "banners")];
    } else if (processed.productImages.includes(",")) {
      processed.productImages = processed.productImages.split(",").map((s: string) => {
        const trimmed = s.trim();
        return trimmed.startsWith("data:image/") ? saveBase64Image(trimmed, "banners") : trimmed;
      }).filter(Boolean);
    } else if (processed.productImages.trim()) {
      processed.productImages = [processed.productImages.trim()];
    } else {
      processed.productImages = [];
    }
  }

  // Process videoUrl if base64 video
  if (processed.videoUrl && typeof processed.videoUrl === "string" && processed.videoUrl.startsWith("data:")) {
    processed.videoUrl = saveBase64Media(processed.videoUrl, "videos");
  }

  return processed;
}

async function getAllLandingPages(): Promise<any[]> {
  let pages: any[] = loadLandingPagesFromDisk();
  
  if (!Array.isArray(pages) || pages.length === 0) {
    try {
      const setting = await prisma.setting.findUnique({
        where: { key: "ALL_LANDING_PAGES_DATA" }
      });
      if (setting && setting.value) {
        pages = JSON.parse(setting.value);
      }
    } catch (e) {}
  }

  if (!Array.isArray(pages) || pages.length === 0) {
    pages = [DEFAULT_SEASONAL_OFFER];
  }

  const seasonalIdx = pages.findIndex((p: any) => p.slug === "seasonal-offer");
  if (seasonalIdx < 0) {
    pages.unshift(DEFAULT_SEASONAL_OFFER);
  }

  return pages;
}

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
};

// GET /api/settings/public (Public access for analytics & UI configurations)
router.get("/public", async (req, res) => {
  try {
    const keys = [
      "META_PIXEL_ID", 
      "GA4_MEASUREMENT_ID", 
      "GTM_CONTAINER_ID",
      "PAGES_CUSTOMIZATION_CONFIG",
      "SEASONAL_OFFER_DATA",
      "ALL_LANDING_PAGES_DATA"
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
    
    res.json(publicSettings);
  } catch (error: any) {
    res.json({
      PAGES_CUSTOMIZATION_CONFIG: DEFAULT_PAGES_CONFIG,
      SEASONAL_OFFER_DATA: DEFAULT_SEASONAL_OFFER
    });
  }
});

// GET /api/settings/landing-pages (Get all landing pages)
router.get("/landing-pages", async (req, res) => {
  try {
    const pages = await getAllLandingPages();
    res.json(pages);
  } catch (error: any) {
    res.json([DEFAULT_SEASONAL_OFFER]);
  }
});

// GET /api/settings/landing-pages/:slug (Get specific landing page)
router.get("/landing-pages/:slug", async (req, res) => {
  try {
    const { slug } = req.params;
    const pages = await getAllLandingPages();
    const found = pages.find((p: any) => p.slug === slug);
    if (found) {
      return res.json(found);
    }
    if (slug === "seasonal-offer") {
      return res.json(DEFAULT_SEASONAL_OFFER);
    }
    return res.status(404).json({ error: "Landing page not found", fallback: DEFAULT_SEASONAL_OFFER });
  } catch (error: any) {
    res.status(500).json({ error: error.message, fallback: DEFAULT_SEASONAL_OFFER });
  }
});

// POST /api/settings/landing-pages (Create or update any landing page)
router.post("/landing-pages", async (req, res) => {
  try {
    let pageData = req.body;
    if (!pageData || typeof pageData !== "object") {
      return res.status(400).json({ error: "Invalid landing page data" });
    }

    // Convert any base64 images/videos to static disk files
    pageData = processLandingPageMedia(pageData);

    let slug = (pageData.slug || "").trim().toLowerCase().replace(/[^a-z0-9_-]/g, "-").replace(/-+/g, "-");
    if (!slug) {
      slug = (pageData.title || "offer").trim().toLowerCase().replace(/[^a-z0-9_-]/g, "-").replace(/-+/g, "-");
    }
    if (!slug) slug = "offer-" + Date.now();

    pageData.slug = slug;
    pageData.updatedAt = new Date().toISOString();
    if (!pageData.createdAt) {
      pageData.createdAt = new Date().toISOString();
    }

    let allPages = await getAllLandingPages();
    const existingIdx = allPages.findIndex((p: any) => p.slug === slug);
    if (existingIdx >= 0) {
      allPages[existingIdx] = { ...allPages[existingIdx], ...pageData };
    } else {
      allPages.push(pageData);
    }

    // Persist to DB (if online) and disk
    try {
      await prisma.setting.upsert({
        where: { key: "ALL_LANDING_PAGES_DATA" },
        update: { value: JSON.stringify(allPages) },
        create: { key: "ALL_LANDING_PAGES_DATA", value: JSON.stringify(allPages) }
      });
    } catch (dbErr: any) {
      console.warn("[settings] MySQL setting write warning:", dbErr.message);
    }
    persistLandingPagesToDisk(allPages);

    // If slug is seasonal-offer, also update SEASONAL_OFFER_DATA for backward compatibility
    if (slug === "seasonal-offer") {
      try {
        await prisma.setting.upsert({
          where: { key: "SEASONAL_OFFER_DATA" },
          update: { value: JSON.stringify(pageData) },
          create: { key: "SEASONAL_OFFER_DATA", value: JSON.stringify(pageData) }
        });
      } catch (dbErr: any) {}
    }

    res.json({ message: "Landing page saved successfully", page: pageData, allPages });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/settings/landing-pages/:slug (Delete landing page)
router.delete("/landing-pages/:slug", async (req, res) => {
  try {
    const { slug } = req.params;
    let allPages = await getAllLandingPages();
    
    // Filter out the requested slug
    allPages = allPages.filter((p: any) => p.slug !== slug);

    // Ensure seasonal-offer always exists
    if (!allPages.some((p: any) => p.slug === "seasonal-offer")) {
      allPages.unshift(DEFAULT_SEASONAL_OFFER);
    }

    try {
      await prisma.setting.upsert({
        where: { key: "ALL_LANDING_PAGES_DATA" },
        update: { value: JSON.stringify(allPages) },
        create: { key: "ALL_LANDING_PAGES_DATA", value: JSON.stringify(allPages) }
      });
    } catch (dbErr: any) {}
    persistLandingPagesToDisk(allPages);

    res.json({ message: "Landing page deleted successfully", allPages });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/settings/seasonal-offer (Backward compatibility for default landing page)
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

    const pages = await getAllLandingPages();
    const seasonal = pages.find((p: any) => p.slug === "seasonal-offer");
    res.json(seasonal || DEFAULT_SEASONAL_OFFER);
  } catch (error: any) {
    res.json(DEFAULT_SEASONAL_OFFER);
  }
});

// POST /api/settings/seasonal-offer (Admin save backward compatibility)
router.post("/seasonal-offer", async (req, res) => {
  try {
    let payload = req.body;
    if (!payload || typeof payload !== "object") {
      return res.status(400).json({ error: "Invalid payload" });
    }

    payload = processLandingPageMedia(payload);
    payload.slug = payload.slug || "seasonal-offer";
    payload.updatedAt = new Date().toISOString();

    try {
      await prisma.setting.upsert({
        where: { key: "SEASONAL_OFFER_DATA" },
        update: { value: JSON.stringify(payload) },
        create: { key: "SEASONAL_OFFER_DATA", value: JSON.stringify(payload) }
      });
    } catch (dbErr: any) {}

    // Also sync into ALL_LANDING_PAGES_DATA
    const allPages = await getAllLandingPages();
    const idx = allPages.findIndex((p: any) => p.slug === (payload.slug || "seasonal-offer"));
    if (idx >= 0) {
      allPages[idx] = { ...allPages[idx], ...payload };
    } else {
      allPages.push(payload);
    }

    try {
      await prisma.setting.upsert({
        where: { key: "ALL_LANDING_PAGES_DATA" },
        update: { value: JSON.stringify(allPages) },
        create: { key: "ALL_LANDING_PAGES_DATA", value: JSON.stringify(allPages) }
      });
    } catch (dbErr: any) {}
    persistLandingPagesToDisk(allPages);

    res.json({ message: "Seasonal offer updated successfully", data: payload, allPages });
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
    res.json(DEFAULT_PAGES_CONFIG);
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

// GET /api/settings (Public / Admin safe settings query)
router.get("/", async (req: AuthenticatedRequest, res: Response) => {
  try {
    let settings: any[] = [];
    try {
      settings = await prisma.setting.findMany();
    } catch (e) {
      settings = [];
    }
    const settingsObj = settings.reduce((acc: any, s) => {
      acc[s.key] = s.value;
      return acc;
    }, {
      STORE_NAME: "GlowGoodly",
      STORE_EMAIL: "support@glowgoodly.com",
      STORE_PHONE: "+8801609013011",
      STORE_ADDRESS: "1162, East Monipur, Mirpur-2, Dhaka-1216, Bangladesh"
    });
    res.json(settingsObj);
  } catch (error: any) {
    res.json({
      STORE_NAME: "GlowGoodly",
      STORE_EMAIL: "support@glowgoodly.com",
      STORE_PHONE: "+8801609013011"
    });
  }
});

// POST /api/settings/bulk (Admin bulk update)
router.post("/bulk", authenticateJWT as any, requireRole(["SuperAdmin", "Manager"]) as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const settings = req.body;

    if (!settings || typeof settings !== "object") {
      return res.status(400).json({ error: "Invalid settings payload" });
    }

    const updatePromises = Object.entries(settings).map(([key, value]) => {
      return prisma.setting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) },
      });
    });

    await Promise.all(updatePromises);

    res.json({ message: "Settings updated successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Facebook Community Routes
const FB_COMMUNITY_FILE = path.join(process.cwd(), "data", "facebook_community.json");

function loadFacebookCommunityFromDisk(): any {
  try {
    if (fs.existsSync(FB_COMMUNITY_FILE)) {
      const raw = fs.readFileSync(FB_COMMUNITY_FILE, "utf-8");
      return JSON.parse(raw);
    }
  } catch (e) {}
  return {
    groupTitle: "Glowgoodly-Review & problem solution",
    groupUrl: "https://www.facebook.com/groups/675430693128442",
    groupCoverImage: "https://lookaside.fbsbx.com/lookaside/crawler/media/?media_id=1392699616200457",
    memberCount: "৮৫০+",
    description: "অনলাইনে বিশ্বস্ত কেনাকাটা করতে জয়েন হয়ে যান আমাদের গ্রুপে।😊 আমাদের পেজ থেকে অর্ডার করা প্রোডাক্টের রিভিউ দিয়ে পেয়ে যান নেক্সট অর্ডার আকর্ষণীয় ডিসকাউন্ট...",
    posts: []
  };
}

function persistFacebookCommunityToDisk(data: any) {
  try {
    const dir = path.dirname(FB_COMMUNITY_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(FB_COMMUNITY_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (e) {}
}

// GET /api/settings/facebook-community (Public)
router.get("/facebook-community", async (req, res) => {
  try {
    let data = loadFacebookCommunityFromDisk();
    try {
      const setting = await prisma.setting.findUnique({
        where: { key: "FACEBOOK_COMMUNITY_DATA" }
      });
      if (setting && setting.value) {
        data = { ...data, ...JSON.parse(setting.value) };
      }
    } catch (e) {}
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/settings/facebook-community (Admin save)
router.post("/facebook-community", async (req, res) => {
  try {
    const payload = req.body;
    if (!payload || typeof payload !== "object") {
      return res.status(400).json({ error: "Invalid payload" });
    }

    const processed = { ...payload };

    // Process posts images if base64
    if (Array.isArray(processed.posts)) {
      processed.posts = processed.posts.map((post: any) => {
        const item = { ...post };
        if (typeof item.image === "string" && item.image.startsWith("data:image/")) {
          item.image = saveBase64Image(item.image, "banners");
        }
        if (typeof item.authorAvatar === "string" && item.authorAvatar.startsWith("data:image/")) {
          item.authorAvatar = saveBase64Image(item.authorAvatar, "banners");
        }
        return item;
      });
    }

    try {
      await prisma.setting.upsert({
        where: { key: "FACEBOOK_COMMUNITY_DATA" },
        update: { value: JSON.stringify(processed) },
        create: { key: "FACEBOOK_COMMUNITY_DATA", value: JSON.stringify(processed) }
      });
    } catch (dbErr: any) {}

    persistFacebookCommunityToDisk(processed);
    res.json({ message: "Facebook community settings saved successfully", data: processed });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
