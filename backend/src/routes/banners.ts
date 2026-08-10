import { Router, Request, Response } from "express";
import db from "../firebase";
import { authenticateJWT, requireRole, AuthenticatedRequest } from "../middleware/auth";


const router = Router();

let isBannersInitialized = false;

async function ensureInitialBanners() {
  if (isBannersInitialized) return;
  try {
    const defaultBanners = [
      { id: "hero-1", title: "Hero Slide 1 - Nirvana Collection", page: "Hero Slides", imageUrl: "/images/sliders/slider-1.png", mobileImageUrl: "/images/sliders/slider-1.png", linkUrl: "/shop?category=skincare", isActive: true, sortOrder: 1 },
      { id: "hero-2", title: "Hero Slide 2 - Prime Web Offer Banner", page: "Hero Slides", imageUrl: "https://bk.shajgoj.com/storage/2026/07/prime-banner-web.png", mobileImageUrl: "https://bk.shajgoj.com/storage/2026/07/prime-banner-web.png", linkUrl: "/shop?category=k-beauty", isActive: true, sortOrder: 2 },
      { id: "wide-1", title: "Homepage Wide Banner - Prime Offer", page: "Homepage Wide Banner", imageUrl: "https://bk.shajgoj.com/storage/2026/07/prime-banner-web.png", mobileImageUrl: "https://bk.shajgoj.com/storage/2026/07/prime-banner-web.png", linkUrl: "/shop?tab=offers", isActive: true, sortOrder: 4 },
      { id: "deal-1", title: "Deal Card 1 - Clearance Sale", page: "Deal Card 1", imageUrl: "/images/deals/deal-1.png", mobileImageUrl: "/images/deals/deal-1.png", linkUrl: "/shop?category=clearance-sale", isActive: true, sortOrder: 5 },
      { id: "deal-2", title: "Deal Card 2 - Skincare Special", page: "Deal Card 2", imageUrl: "/images/deals/deal-2.png", mobileImageUrl: "/images/deals/deal-2.png", linkUrl: "/shop?category=skincare", isActive: true, sortOrder: 6 },
      { id: "deal-3", title: "Deal Card 3 - Combo Deals", page: "Deal Card 3", imageUrl: "/images/deals/deal-3.gif", mobileImageUrl: "/images/deals/deal-3.gif", linkUrl: "/shop?category=combo", isActive: true, sortOrder: 7 },
      { id: "deal-4", title: "Deal Card 4 - Makeup Sale", page: "Deal Card 4", imageUrl: "/images/deals/deal-4.jpg", mobileImageUrl: "/images/deals/deal-4.jpg", linkUrl: "/shop?category=makeup", isActive: true, sortOrder: 8 },
      { id: "bogo-1", title: "Campaign Card - BOGO", page: "BOGO", imageUrl: "https://bk.shajgoj.com/storage/2025/05/bogo-9lad.png", mobileImageUrl: "https://bk.shajgoj.com/storage/2025/05/bogo-9lad.png", linkUrl: "/shop?campaign=BOGO", isActive: true, sortOrder: 9 },
      { id: "combo-1", title: "Campaign Card - COMBO", page: "COMBO", imageUrl: "https://bk.shajgoj.com/storage/2025/05/combo.png", mobileImageUrl: "https://bk.shajgoj.com/storage/2025/05/combo.png", linkUrl: "/shop?campaign=COMBO", isActive: true, sortOrder: 10 },
      { id: "offers-1", title: "Campaign Card - OFFERS", page: "OFFERS", imageUrl: "https://bk.shajgoj.com/storage/2025/05/offers.png", mobileImageUrl: "https://bk.shajgoj.com/storage/2025/05/offers.png", linkUrl: "/shop?campaign=EXCLUSIVE", isActive: true, sortOrder: 11 },
      { id: "clearance-1", title: "Campaign Card - Clearance SALE", page: "Clearance SALE", imageUrl: "https://bk.shajgoj.com/storage/2025/05/clearance-sale.png", mobileImageUrl: "https://bk.shajgoj.com/storage/2025/05/clearance-sale.png", linkUrl: "/shop?campaign=CLEARANCE", isActive: true, sortOrder: 12 },
      // Top Brands & Offers Cards
      { id: "brand-offer-1", title: "Brand Offer 1 - The Ordinary", page: "Brand Offer 1", imageUrl: "/images/brands/brand-offer-1.png", mobileImageUrl: "/images/brands/brand-offer-1.png", linkUrl: "/shop?brand=the-ordinary", isActive: true, sortOrder: 12.1 },
      { id: "brand-offer-2", title: "Brand Offer 2 - Skin Cafe", page: "Brand Offer 2", imageUrl: "/images/brands/brand-offer-2.gif", mobileImageUrl: "/images/brands/brand-offer-2.gif", linkUrl: "/shop?brand=skin-cafe", isActive: true, sortOrder: 12.2 },
      { id: "brand-offer-5", title: "Brand Offer 5 - The Ordinary Special", page: "Brand Offer 5", imageUrl: "/images/brands/brand-offer-5.png", mobileImageUrl: "/images/brands/brand-offer-5.png", linkUrl: "/shop?brand=the-ordinary", isActive: true, sortOrder: 12.3 },
      { id: "brand-offer-6", title: "Brand Offer 6 - Skin Cafe Combo", page: "Brand Offer 6", imageUrl: "/images/brands/brand-offer-6.gif", mobileImageUrl: "/images/brands/brand-offer-6.gif", linkUrl: "/shop?brand=skin-cafe", isActive: true, sortOrder: 12.4 },
      // Main Category Banner Cards
      { id: "cat-makeup", title: "Category Card - Makeup", page: "Category: Makeup", imageUrl: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600", mobileImageUrl: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600", linkUrl: "/shop?category=makeup", isActive: true, sortOrder: 13 },
      { id: "cat-skin", title: "Category Card - Skin", page: "Category: Skin", imageUrl: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600", mobileImageUrl: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600", linkUrl: "/shop?category=skincare", isActive: true, sortOrder: 14 },
      { id: "cat-hair", title: "Category Card - Hair", page: "Category: Hair", imageUrl: "https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=600", mobileImageUrl: "https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=600", linkUrl: "/shop?category=haircare", isActive: true, sortOrder: 15 },
      { id: "cat-personal-care", title: "Category Card - Personal Care", page: "Category: Personal Care", imageUrl: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600", mobileImageUrl: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600", linkUrl: "/shop?category=personal-care", isActive: true, sortOrder: 16 },
      { id: "cat-mom-baby", title: "Category Card - Mom & Baby", page: "Category: Mom & Baby", imageUrl: "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=600", mobileImageUrl: "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=600", linkUrl: "/shop?category=mom-baby", isActive: true, sortOrder: 17 },
      { id: "cat-fragrance", title: "Category Card - Fragrance", page: "Category: Fragrance", imageUrl: "https://images.unsplash.com/photo-1541643600914-78b084683601?w=600", mobileImageUrl: "https://images.unsplash.com/photo-1541643600914-78b084683601?w=600", linkUrl: "/shop?category=fragrance", isActive: true, sortOrder: 18 },
      { id: "cat-undergarments", title: "Category Card - Undergarments", page: "Category: Undergarments", imageUrl: "https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=600", mobileImageUrl: "https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=600", linkUrl: "/shop?category=undergarments", isActive: true, sortOrder: 19 },
      { id: "cat-combo", title: "Category Card - Combo", page: "Category: Combo", imageUrl: "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=600", mobileImageUrl: "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=600", linkUrl: "/shop?category=combo", isActive: true, sortOrder: 20 },
      // Shop By Concern Cards
      { id: "concern-acne", title: "Concern Card - Acne Treatment", page: "Concern: Acne", imageUrl: "https://bk.shajgoj.com/storage/2026/04/acne-treatment.png", mobileImageUrl: "https://bk.shajgoj.com/storage/2026/04/acne-treatment.png", linkUrl: "/shop?category=skincare&sub=Acne%20Treatment", isActive: true, sortOrder: 21 },
      { id: "concern-anti-aging", title: "Concern Card - Anti Aging Treatment", page: "Concern: Anti Aging", imageUrl: "https://bk.shajgoj.com/storage/2026/04/anti-aging-treatment.png", mobileImageUrl: "https://bk.shajgoj.com/storage/2026/04/anti-aging-treatment.png", linkUrl: "/shop?category=skincare&sub=Anti%20Aging", isActive: true, sortOrder: 22 },
      { id: "concern-dandruff", title: "Concern Card - Dandruff Solution", page: "Concern: Dandruff", imageUrl: "https://bk.shajgoj.com/storage/2026/04/dandruff-solution.png", mobileImageUrl: "https://bk.shajgoj.com/storage/2026/04/dandruff-solution.png", linkUrl: "/shop?category=haircare&sub=Dandruff", isActive: true, sortOrder: 23 },
      { id: "concern-dry-skin", title: "Concern Card - Dry Skin Treatment", page: "Concern: Dry Skin", imageUrl: "https://bk.shajgoj.com/storage/2026/04/dry-skin-treatment.png", mobileImageUrl: "https://bk.shajgoj.com/storage/2026/04/dry-skin-treatment.png", linkUrl: "/shop?category=skincare&sub=Dry%20Skin", isActive: true, sortOrder: 24 },
      { id: "concern-hair-fall", title: "Concern Card - Hair Fall Treatment", page: "Concern: Hair Fall", imageUrl: "https://bk.shajgoj.com/storage/2026/04/hair-fall-treatment.png", mobileImageUrl: "https://bk.shajgoj.com/storage/2026/04/hair-fall-treatment.png", linkUrl: "/shop?category=haircare&sub=Hair%20Fall", isActive: true, sortOrder: 25 },
      { id: "concern-oil-control", title: "Concern Card - Oil Control Treatment", page: "Concern: Oil Control", imageUrl: "https://bk.shajgoj.com/storage/2026/04/oil-control-treatment.png", mobileImageUrl: "https://bk.shajgoj.com/storage/2026/04/oil-control-treatment.png", linkUrl: "/shop?category=skincare", isActive: true, sortOrder: 26 },
      { id: "concern-pore-care", title: "Concern Card - Pore Care", page: "Concern: Pore Care", imageUrl: "https://bk.shajgoj.com/storage/2026/04/pore-care.png", mobileImageUrl: "https://bk.shajgoj.com/storage/2026/04/pore-care.png", linkUrl: "/shop?category=skincare&sub=Pore%20Care", isActive: true, sortOrder: 27 },
      { id: "concern-spot", title: "Concern Card - Spot Treatment", page: "Concern: Spot Treatment", imageUrl: "https://bk.shajgoj.com/storage/2026/04/spot-treatment.png", mobileImageUrl: "https://bk.shajgoj.com/storage/2026/04/spot-treatment.png", linkUrl: "/shop?category=skincare", isActive: true, sortOrder: 28 },
      { id: "concern-hair-thinning", title: "Concern Card - Hair Thinning Solution", page: "Concern: Hair Thinning", imageUrl: "https://bk.shajgoj.com/storage/2026/04/hair-thinning-solution.png", mobileImageUrl: "https://bk.shajgoj.com/storage/2026/04/hair-thinning-solution.png", linkUrl: "/shop?category=haircare", isActive: true, sortOrder: 29 },
      { id: "concern-sun-burn", title: "Concern Card - Sun Burn Treatment", page: "Concern: Sun Burn", imageUrl: "https://bk.shajgoj.com/storage/2026/04/sun-burn-treatment.png", mobileImageUrl: "https://bk.shajgoj.com/storage/2026/04/sun-burn-treatment.png", linkUrl: "/shop?category=skincare", isActive: true, sortOrder: 30 }
    ];

    // Fetch deleted banners list
    const deletedDoc = await db.collection("settings").doc("DELETED_BANNERS").get();
    const deletedIds: string[] = deletedDoc.exists ? (deletedDoc.data()?.ids || []) : [];

    for (const b of defaultBanners) {
      if (deletedIds.includes(b.id)) continue;
      const doc = await db.collection("banners").doc(b.id).get();
      if (!doc.exists) {
        await db.collection("banners").doc(b.id).set(b);
      }
    }
    await db.collection("settings").doc("BANNERS_INITIALIZED").set({ key: "BANNERS_INITIALIZED", value: "true", updatedAt: new Date().toISOString() });
  } catch (e) {
    console.error("Error initializing default banners:", e);
  } finally {
    isBannersInitialized = true;
  }
}

// ─── GET /api/banners — Public: get all ACTIVE banners ───────────────────────
router.get("/banners", async (req: AuthenticatedRequest, res: Response) => {
  try {
    await ensureInitialBanners();
    const deletedDoc = await db.collection("settings").doc("DELETED_BANNERS").get();
    const deletedIds: string[] = deletedDoc.exists ? (deletedDoc.data()?.ids || []) : [];

    const snapshot = await db.collection("banners").get();
    const banners: any[] = [];
    snapshot.forEach(doc => {
      if (deletedIds.includes(doc.id)) return;
      const data = doc.data();
      const active = data.isActive === undefined || data.isActive === true || data.isActive === "true" || String(data.isActive) !== "false";
      if (data && active) {
        banners.push({ id: doc.id, ...data });
      }
    });

    banners.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    res.json(banners);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch banners" });
  }
});

// ─── GET /api/admin/banners — Admin: get ALL banners for admin panel list ───
router.get("/admin/banners", async (req: AuthenticatedRequest, res: Response) => {
  try {
    await ensureInitialBanners();
    const deletedDoc = await db.collection("settings").doc("DELETED_BANNERS").get();
    const deletedIds: string[] = deletedDoc.exists ? (deletedDoc.data()?.ids || []) : [];

    const snapshot = await db.collection("banners").get();
    const banners: any[] = [];
    snapshot.forEach(doc => {
      if (deletedIds.includes(doc.id)) return;
      banners.push({ id: doc.id, ...doc.data() });
    });

    banners.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    res.json(banners);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch admin banners" });
  }
});


// ─── POST /api/banners — Admin: create new banner ────────────────────────────
router.post("/banners", authenticateJWT as any, requireRole(["SuperAdmin", "Manager"]) as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, imageUrl, mobileImageUrl, tabletImageUrl, linkUrl, bgColor, page, isActive, sortOrder } = req.body;
    if (!title || !imageUrl) {
      res.status(400).json({ error: "title and imageUrl are required" });
      return;
    }
    
    const docRef = db.collection("banners").doc();
    const banner = {
      title,
      imageUrl,
      mobileImageUrl: mobileImageUrl || null,
      tabletImageUrl: tabletImageUrl || null,
      linkUrl: linkUrl || null,
      bgColor: bgColor || "#1a1a2e",
      page: page || "Homepage",
      isActive: isActive !== undefined ? Boolean(isActive) : true,
      sortOrder: sortOrder ? Number(sortOrder) : 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    await docRef.set(banner);
    res.status(201).json({ id: docRef.id, ...banner });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create banner" });
  }
});

// ─── PATCH /api/banners/:id — Admin: update banner ───────────────────────────
router.patch("/banners/:id", authenticateJWT as any, requireRole(["SuperAdmin", "Manager"]) as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { title, imageUrl, mobileImageUrl, tabletImageUrl, linkUrl, bgColor, page, isActive, sortOrder } = req.body;

    const docRef = db.collection("banners").doc(id as string);
    const doc = await docRef.get();
    if (!doc.exists) {
      res.status(404).json({ error: "Banner not found" });
      return;
    }

    const current = doc.data() as any;
    const updated = {
      ...current,
      ...(title !== undefined && { title }),
      ...(imageUrl !== undefined && { imageUrl }),
      ...(mobileImageUrl !== undefined && { mobileImageUrl }),
      ...(tabletImageUrl !== undefined && { tabletImageUrl }),
      ...(linkUrl !== undefined && { linkUrl }),
      ...(bgColor !== undefined && { bgColor }),
      ...(page !== undefined && { page }),
      ...(isActive !== undefined && { isActive: Boolean(isActive) }),
      ...(sortOrder !== undefined && { sortOrder: Number(sortOrder) }),
      updatedAt: new Date().toISOString(),
    };

    await docRef.set(updated);
    res.json({ id, ...updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update banner" });
  }
});

// ─── PUT /api/admin/banners/:id — Admin: update banner alias ───────────────────
router.put("/admin/banners/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, imageUrl, mobileImageUrl, tabletImageUrl, linkUrl, bgColor, page, isActive, sortOrder } = req.body;

    const docRef = db.collection("banners").doc(id as string);
    const doc = await docRef.get();
    const current = doc.exists ? doc.data() as any : {};

    const updated = {
      ...current,
      ...(title !== undefined && { title }),
      ...(imageUrl !== undefined && { imageUrl }),
      ...(mobileImageUrl !== undefined && { mobileImageUrl }),
      ...(tabletImageUrl !== undefined && { tabletImageUrl }),
      ...(linkUrl !== undefined && { linkUrl }),
      ...(bgColor !== undefined && { bgColor }),
      ...(page !== undefined && { page }),
      ...(isActive !== undefined && { isActive: Boolean(isActive) }),
      ...(sortOrder !== undefined && { sortOrder: Number(sortOrder) }),
      updatedAt: new Date().toISOString(),
    };

    await docRef.set(updated);
    res.json({ id, ...updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});


const markBannerAsDeleted = async (id: string) => {
  try {
    const deletedDoc = await db.collection("settings").doc("DELETED_BANNERS").get();
    const currentIds: string[] = deletedDoc.exists ? (deletedDoc.data()?.ids || []) : [];
    if (!currentIds.includes(id)) {
      currentIds.push(id);
      await db.collection("settings").doc("DELETED_BANNERS").set({ key: "DELETED_BANNERS", ids: currentIds, updatedAt: new Date().toISOString() });
    }
  } catch (e) {
    console.error("Error updating DELETED_BANNERS setting:", e);
  }
};

// ─── DELETE /api/banners/:id — Admin: delete banner ──────────────────────────
router.delete("/banners/:id", authenticateJWT as any, requireRole(["SuperAdmin", "Manager"]) as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const docRef = db.collection("banners").doc(id as string);
    await docRef.delete();
    await markBannerAsDeleted(id as string);
    res.json({ success: true, message: "Banner deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete banner" });
  }
});

// ─── DELETE /api/admin/banners/:id — Admin alias delete banner ──────────────────
router.delete("/admin/banners/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const docRef = db.collection("banners").doc(id as string);
    await docRef.delete();
    await markBannerAsDeleted(id as string);
    res.json({ success: true, message: "Banner deleted successfully" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
