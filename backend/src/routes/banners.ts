import { Router, Request, Response } from "express";
import db from "../firebase";
import { authenticateJWT, requireRole, AuthenticatedRequest } from "../middleware/auth";


const router = Router();

async function ensureInitialBanners() {
  try {
    const snapshot = await db.collection("banners").get();
    for (const doc of snapshot.docs) {
      const data = doc.data();
      if (!data) continue;
      // Auto-heal old external shajgoj URLs that fail/hang
      if (data.page === "Brand Offer 1" && (data.imageUrl?.includes("shajgoj") || !data.imageUrl)) {
        await doc.ref.update({ imageUrl: "/images/brands/brand-offer-1.png", mobileImageUrl: "/images/brands/brand-offer-1.png", linkUrl: data.linkUrl || "/shop?brand=the-ordinary" });
      }
      if (data.page === "Brand Offer 2" && (data.imageUrl?.includes("shajgoj") || !data.imageUrl)) {
        await doc.ref.update({ imageUrl: "/images/brands/brand-offer-2.gif", mobileImageUrl: "/images/brands/brand-offer-2.gif", linkUrl: data.linkUrl || "/shop?brand=skin-cafe" });
      }
      if (data.page === "Brand Offer 5" && (data.imageUrl?.includes("shajgoj") || !data.imageUrl)) {
        await doc.ref.update({ imageUrl: "/images/brands/brand-offer-5.png", mobileImageUrl: "/images/brands/brand-offer-5.png", linkUrl: data.linkUrl || "/shop?brand=treasure-of-glow" });
      }
      if (data.page === "Brand Offer 6" && (data.imageUrl?.includes("shajgoj") || !data.imageUrl)) {
        await doc.ref.update({ imageUrl: "/images/brands/brand-offer-6.gif", mobileImageUrl: "/images/brands/brand-offer-6.gif", linkUrl: data.linkUrl || "/shop?category=trimmer" });
      }
      // Auto-heal Deal cards
      if (data.page === "Deal Card 1" && (data.imageUrl?.includes("shajgoj") || !data.imageUrl)) {
        await doc.ref.update({ imageUrl: "/images/deals/deal-1.png", mobileImageUrl: "/images/deals/deal-1.png", tabletImageUrl: "/images/deals/deal-1.png" });
      }
      if (data.page === "Deal Card 2" && (data.imageUrl?.includes("shajgoj") || !data.imageUrl)) {
        await doc.ref.update({ imageUrl: "/images/deals/deal-2.png", mobileImageUrl: "/images/deals/deal-2.png", tabletImageUrl: "/images/deals/deal-2.png" });
      }
      if (data.page === "Deal Card 3" && (data.imageUrl?.includes("shajgoj") || !data.imageUrl)) {
        await doc.ref.update({ imageUrl: "/images/deals/deal-3.gif", mobileImageUrl: "/images/deals/deal-3.gif", tabletImageUrl: "/images/deals/deal-3.gif" });
      }
      if (data.page === "Deal Card 4" && (data.imageUrl?.includes("shajgoj") || !data.imageUrl)) {
        await doc.ref.update({ imageUrl: "/images/deals/deal-4.jpg", mobileImageUrl: "/images/deals/deal-4.jpg", tabletImageUrl: "/images/deals/deal-4.jpg" });
      }

      // Auto-heal Campaign cards
      if (data.page === "BOGO" && (data.imageUrl?.includes("shajgoj") || !data.imageUrl)) {
        await doc.ref.update({ imageUrl: "/images/deals/deal-1.png", mobileImageUrl: "/images/deals/deal-1.png", tabletImageUrl: "/images/deals/deal-1.png" });
      }
      if (data.page === "COMBO" && (data.imageUrl?.includes("shajgoj") || !data.imageUrl)) {
        await doc.ref.update({ imageUrl: "/images/deals/deal-2.png", mobileImageUrl: "/images/deals/deal-2.png", tabletImageUrl: "/images/deals/deal-2.png" });
      }
      if (data.page === "OFFERS" && (data.imageUrl?.includes("shajgoj") || !data.imageUrl)) {
        await doc.ref.update({ imageUrl: "/images/deals/deal-3.gif", mobileImageUrl: "/images/deals/deal-3.gif", tabletImageUrl: "/images/deals/deal-3.gif" });
      }
      if (data.page === "Clearance SALE" && (data.imageUrl?.includes("shajgoj") || !data.imageUrl)) {
        await doc.ref.update({ imageUrl: "/images/deals/deal-4.jpg", mobileImageUrl: "/images/deals/deal-4.jpg", tabletImageUrl: "/images/deals/deal-4.jpg" });
      }

      // Universal sanitize for any lingering external broken banner image
      if (data.imageUrl && data.imageUrl.includes("shajgoj")) {
        await doc.ref.update({
          imageUrl: "/images/sliders/slider-1.png",
          mobileImageUrl: "/images/sliders/slider-1.png",
          tabletImageUrl: "/images/sliders/slider-1.png"
        });
      }
    }
  } catch (err) {
    console.error("ensureInitialBanners error:", err);
  }
}

function cleanBannerData(data: any): any {
  if (!data) return data;
  const cleaned = { ...data };
  if (cleaned.imageUrl && (cleaned.imageUrl.includes("shajgoj") || !cleaned.imageUrl)) {
    if (cleaned.page === "BOGO") cleaned.imageUrl = "/images/deals/deal-1.png";
    else if (cleaned.page === "COMBO") cleaned.imageUrl = "/images/deals/deal-2.png";
    else if (cleaned.page === "OFFERS") cleaned.imageUrl = "/images/deals/deal-3.gif";
    else if (cleaned.page === "Clearance SALE") cleaned.imageUrl = "/images/deals/deal-4.jpg";
    else if (cleaned.page === "Brand Offer 1") cleaned.imageUrl = "/images/brands/brand-offer-1.png";
    else if (cleaned.page === "Brand Offer 2") cleaned.imageUrl = "/images/brands/brand-offer-2.gif";
    else if (cleaned.page === "Brand Offer 5") cleaned.imageUrl = "/images/brands/brand-offer-5.png";
    else if (cleaned.page === "Brand Offer 6") cleaned.imageUrl = "/images/brands/brand-offer-6.gif";
    else if (cleaned.page === "Deal Card 1") cleaned.imageUrl = "/images/deals/deal-1.png";
    else if (cleaned.page === "Deal Card 2") cleaned.imageUrl = "/images/deals/deal-2.png";
    else if (cleaned.page === "Deal Card 3") cleaned.imageUrl = "/images/deals/deal-3.gif";
    else if (cleaned.page === "Deal Card 4") cleaned.imageUrl = "/images/deals/deal-4.jpg";
    else cleaned.imageUrl = "/images/sliders/slider-1.png";
  }
  if (!cleaned.mobileImageUrl || cleaned.mobileImageUrl.includes("shajgoj")) {
    cleaned.mobileImageUrl = cleaned.imageUrl;
  }
  if (!cleaned.tabletImageUrl || cleaned.tabletImageUrl.includes("shajgoj")) {
    cleaned.tabletImageUrl = cleaned.imageUrl;
  }
  return cleaned;
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
      const data = cleanBannerData(doc.data());
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

// ─── GET /api/admin/banners & /api/banners/all — Admin: get ALL banners for admin panel list ───
const getAllBannersHandler = async (req: Request, res: Response) => {
  try {
    await ensureInitialBanners();
    const deletedDoc = await db.collection("settings").doc("DELETED_BANNERS").get();
    const deletedIds: string[] = deletedDoc.exists ? (deletedDoc.data()?.ids || []) : [];

    const snapshot = await db.collection("banners").get();
    const banners: any[] = [];
    snapshot.forEach(doc => {
      if (deletedIds.includes(doc.id)) return;
      const data = cleanBannerData(doc.data());
      banners.push({ id: doc.id, ...data });
    });

    banners.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    res.json(banners);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch admin banners" });
  }
};

router.get("/admin/banners", getAllBannersHandler as any);
router.get("/banners/all", getAllBannersHandler as any);


// ─── POST /api/banners — Admin: create new banner ────────────────────────────
router.post("/banners", async (req: Request, res: Response) => {
  try {
    const { title, imageUrl, mobileImageUrl, tabletImageUrl, linkUrl, bgColor, page, isActive, sortOrder } = req.body;
    if (!title || !imageUrl) {
      res.status(400).json({ error: "title and imageUrl are required" });
      return;
    }
    
    const docRef = db.collection("banners").doc();
    const banner = {
      id: docRef.id,
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
    res.status(201).json(banner);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create banner" });
  }
});

// ─── PATCH /api/banners/:id — Admin: update banner ───────────────────────────
router.patch("/banners/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, imageUrl, mobileImageUrl, tabletImageUrl, linkUrl, bgColor, page, isActive, sortOrder } = req.body;

    const docRef = db.collection("banners").doc(id as string);
    const doc = await docRef.get();

    const current = doc.exists ? doc.data() as any : {};
    const updated = {
      ...current,
      id: id as string,
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

    await docRef.set(updated, { merge: true });
    res.json({ id, ...updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update banner" });
  }
});

// ─── PUT /api/admin/banners/:id & /api/banners/:id — Admin: update banner alias ───────────────────
const updateBannerPutHandler = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, imageUrl, mobileImageUrl, tabletImageUrl, linkUrl, bgColor, page, isActive, sortOrder } = req.body;

    const docRef = db.collection("banners").doc(id as string);
    const doc = await docRef.get();
    const current = doc.exists ? doc.data() as any : {};

    const updated = {
      ...current,
      id: id as string,
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

    await docRef.set(updated, { merge: true });
    res.json({ id, ...updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

router.put("/admin/banners/:id", updateBannerPutHandler);
router.put("/banners/:id", updateBannerPutHandler);

// ─── PATCH /api/admin/banners/:id — Admin: patch banner alias ─────────────────
router.patch("/admin/banners/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, imageUrl, mobileImageUrl, tabletImageUrl, linkUrl, bgColor, page, isActive, sortOrder } = req.body;

    const docRef = db.collection("banners").doc(id as string);
    const doc = await docRef.get();
    const current = doc.exists ? doc.data() as any : {};

    const updated = {
      ...current,
      id: id as string,
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

    await docRef.set(updated, { merge: true });
    res.json({ id, ...updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/admin/banners — Admin: create banner alias ─────────────────────
router.post("/admin/banners", async (req: Request, res: Response) => {
  try {
    const { title, imageUrl, mobileImageUrl, tabletImageUrl, linkUrl, bgColor, page, isActive, sortOrder } = req.body;
    if (!title || !imageUrl) {
      res.status(400).json({ error: "title and imageUrl are required" });
      return;
    }
    
    const docRef = db.collection("banners").doc();
    const banner = {
      id: docRef.id,
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
    res.status(201).json(banner);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create banner" });
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

// ─── DELETE /api/admin/banners/all — Delete all banners ─────────────────────
router.delete("/admin/banners/all", async (req: Request, res: Response) => {
  try {
    const snapshot = await db.collection("banners").get();
    const ids: string[] = [];
    snapshot.forEach((doc: any) => ids.push(doc.id));
    for (const id of ids) {
      await db.collection("banners").doc(id).delete();
      await markBannerAsDeleted(id);
    }
    res.json({ success: true, message: "All banners deleted successfully" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── DELETE /api/banners/all — Delete all banners alias ─────────────────────
router.delete("/banners/all", async (req: Request, res: Response) => {
  try {
    const snapshot = await db.collection("banners").get();
    const ids: string[] = [];
    snapshot.forEach((doc: any) => ids.push(doc.id));
    for (const id of ids) {
      await db.collection("banners").doc(id).delete();
      await markBannerAsDeleted(id);
    }
    res.json({ success: true, message: "All banners deleted successfully" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── DELETE /api/banners/:id — Admin: delete banner ──────────────────────────
router.delete("/banners/:id", async (req: Request, res: Response) => {
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
