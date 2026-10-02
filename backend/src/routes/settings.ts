import { Router, Response } from "express";
import prisma from "../prisma";
import { authenticateJWT, requireRole, AuthenticatedRequest } from "../middleware/auth";

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
    "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&auto=format&fit=crop&q=80"
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
      "SEASONAL_OFFER_DATA"
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
router.get("/", authenticateJWT as any, requireRole(["SuperAdmin", "Manager"]) as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const settings = await prisma.setting.findMany();
    const settingsObj = settings.reduce((acc: any, s) => {
      acc[s.key] = s.value;
      return acc;
    }, {});
    res.json(settingsObj);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
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

export default router;
