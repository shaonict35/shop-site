import { Router, Request, Response } from "express";
import db from "../firebase";
import { authenticateJWT, requireRole, AuthenticatedRequest } from "../middleware/auth";
import { saveBase64Image } from "../services/imageStorage";

const router = Router();

// Slot mapping for single card positions on homepage
const SINGLE_SLOT_MAP: Record<string, string> = {
  "homepage wide banner": "homepage-wide-banner",
  "deal card 1": "deal-card-1",
  "deal card 2": "deal-card-2",
  "deal card 3": "deal-card-3",
  "deal card 4": "deal-card-4",
  "brand offer 1": "brand-offer-1",
  "brand offer 2": "brand-offer-2",
  "brand offer 5": "brand-offer-5",
  "brand offer 6": "brand-offer-6",
  "bogo": "bogo-banner",
  "combo": "combo-banner",
  "offers": "offers-banner",
  "clearance sale": "clearance-banner"
};

function resolveSlotTargetId(id?: string, page?: string): string {
  if (id && id.trim()) {
    // Standardize legacy id aliases
    if (id === "banner-hero-1") return "hero-slide-1";
    if (id === "banner-hero-2") return "hero-slide-2";
    if (id === "banner-hero-3") return "hero-slide-3";
    if (id === "banner-deal-1") return "deal-card-1";
    if (id === "banner-deal-2") return "deal-card-2";
    if (id === "banner-deal-3") return "deal-card-3";
    if (id === "banner-deal-4") return "deal-card-4";
    return id.trim();
  }
  const p = (page || "").toLowerCase().trim();
  if (SINGLE_SLOT_MAP[p]) {
    return SINGLE_SLOT_MAP[p];
  }
  if (p.startsWith("category:")) {
    const slug = p.replace("category:", "").trim().replace(/\s+/g, "-");
    return `cat-card-${slug}`;
  }
  if (p.startsWith("concern:")) {
    const slug = p.replace("concern:", "").trim().replace(/\s+/g, "-");
    return `concern-card-${slug}`;
  }
  return `banner-${Date.now()}-${Math.random().toString(36).substr(2, 7)}`;
}

async function ensureInitialBanners() {
  try {
    const snapshot = await db.collection("banners").get();
    for (const doc of snapshot.docs) {
      const data = doc.data();
      if (!data) continue;
      // Sanitize only lingering external shajgoj URLs that hang or fail
      if (data.imageUrl && data.imageUrl.includes("shajgoj")) {
        if (data.page === "Brand Offer 1") {
          await doc.ref.update({ imageUrl: "/images/brands/brand-offer-1.png", mobileImageUrl: "/images/brands/brand-offer-1.png" });
        } else if (data.page === "Brand Offer 2") {
          await doc.ref.update({ imageUrl: "/images/brands/brand-offer-2.gif", mobileImageUrl: "/images/brands/brand-offer-2.gif" });
        } else if (data.page === "Brand Offer 5") {
          await doc.ref.update({ imageUrl: "/images/brands/brand-offer-5.png", mobileImageUrl: "/images/brands/brand-offer-5.png" });
        } else if (data.page === "Brand Offer 6") {
          await doc.ref.update({ imageUrl: "/images/brands/brand-offer-6.gif", mobileImageUrl: "/images/brands/brand-offer-6.gif" });
        } else if (data.page === "Hero Slides" || data.page === "Hero Slides Carousel") {
          await doc.ref.update({ imageUrl: "/images/sliders/slider-1.png", mobileImageUrl: "/images/sliders/slider-1.png", tabletImageUrl: "/images/sliders/slider-1.png" });
        } else {
          await doc.ref.delete();
        }
      }
    }
  } catch (err) {
    console.error("ensureInitialBanners error:", err);
  }
}

function cleanBannerData(data: any): any {
  if (!data) return data;
  const cleaned = { ...data };
  if (cleaned.imageUrl && cleaned.imageUrl.includes("shajgoj")) {
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
    else if (cleaned.page === "Hero Slides" || cleaned.page === "Hero Slides Carousel") cleaned.imageUrl = "/images/sliders/slider-1.png";
  }
  if (!cleaned.mobileImageUrl) {
    cleaned.mobileImageUrl = cleaned.imageUrl;
  }
  if (!cleaned.tabletImageUrl) {
    cleaned.tabletImageUrl = cleaned.imageUrl;
  }
  return cleaned;
}

// Deduplicate banners list ensuring user customized / updated banners take priority
function deduplicateBanners(banners: any[]): any[] {
  const map = new Map<string, any>();
  for (const b of banners) {
    if (!b || !b.id) continue;
    const p = (b.page || "").toLowerCase().trim();
    // For single card slots, use the slot key so multiple conflicting banners collapse into the best one
    const isSingleSlot = Boolean(SINGLE_SLOT_MAP[p] || p.startsWith("category:") || p.startsWith("concern:"));
    const key = isSingleSlot ? `slot:${p}` : b.id;

    if (map.has(key)) {
      const existing = map.get(key);
      const isCustomB = b.imageUrl?.startsWith("/uploads/") || b.imageUrl?.startsWith("data:") || String(b.updatedAt || "") > String(existing.updatedAt || "");
      if (isCustomB) {
        map.set(key, b);
      }
    } else {
      map.set(key, b);
    }
  }
  return Array.from(map.values());
}

// ─── GET /api/banners — Public: get all ACTIVE banners ───────────────────────
router.get("/banners", async (req: AuthenticatedRequest, res: Response) => {
  try {
    await ensureInitialBanners();
    const deletedDoc = await db.collection("settings").doc("DELETED_BANNERS").get();
    const deletedIds: string[] = deletedDoc.exists ? (deletedDoc.data()?.ids || []) : [];

    const snapshot = await db.collection("banners").get();
    let banners: any[] = [];
    snapshot.forEach((doc: any) => {
      if (deletedIds.includes(doc.id)) return;
      const data = cleanBannerData(doc.data());
      const active = data.isActive === undefined || data.isActive === true || data.isActive === "true" || String(data.isActive) !== "false";
      if (data && active) {
        banners.push({ id: doc.id, ...data });
      }
    });

    banners = deduplicateBanners(banners);
    banners.sort((a, b) => (Number(a.sortOrder) || 0) - (Number(b.sortOrder) || 0));
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
    let banners: any[] = [];
    snapshot.forEach((doc: any) => {
      if (deletedIds.includes(doc.id)) return;
      const data = cleanBannerData(doc.data());
      banners.push({ id: doc.id, ...data });
    });

    banners = deduplicateBanners(banners);
    banners.sort((a, b) => (Number(a.sortOrder) || 0) - (Number(b.sortOrder) || 0));
    res.json(banners);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch admin banners" });
  }
};

router.get("/admin/banners", getAllBannersHandler as any);
router.get("/banners/all", getAllBannersHandler as any);

// ─── SHARED SAVE / CREATE / REPLACE BANNER HANDLER ────────────────────────────
async function handleCreateOrReplaceBanner(req: Request, res: Response, targetIdOverride?: string) {
  try {
    let { id, title, imageUrl, mobileImageUrl, tabletImageUrl, linkUrl, bgColor, page, isActive, sortOrder } = req.body || {};

    if (!title || !imageUrl) {
      return res.status(400).json({ error: "Title and Image URL are required" });
    }

    // Convert any uploaded base64 data URLs into physical image files on disk
    const savedImageUrl = saveBase64Image(imageUrl, "banners");
    const savedMobileUrl = mobileImageUrl ? saveBase64Image(mobileImageUrl, "banners") : savedImageUrl;
    const savedTabletUrl = tabletImageUrl ? saveBase64Image(tabletImageUrl, "banners") : savedImageUrl;

    const finalId = resolveSlotTargetId(targetIdOverride || id, page);

    const docRef = db.collection("banners").doc(finalId);
    const existingDoc = await docRef.get();
    const current = existingDoc.exists ? existingDoc.data() : {};

    const banner = {
      ...current,
      id: finalId,
      title: title.trim(),
      imageUrl: savedImageUrl,
      mobileImageUrl: savedMobileUrl || savedImageUrl,
      tabletImageUrl: savedTabletUrl || savedImageUrl,
      linkUrl: linkUrl ? linkUrl.trim() : (current.linkUrl || "/shop"),
      bgColor: bgColor || current.bgColor || "#1a1a2e",
      page: page || current.page || "Homepage",
      isActive: isActive !== undefined ? Boolean(isActive) : true,
      sortOrder: sortOrder !== undefined ? Number(sortOrder) : (current.sortOrder !== undefined ? current.sortOrder : 0),
      createdAt: current.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await docRef.set(banner);
    await unmarkBannerAsDeleted(finalId);

    // Also unmark legacy aliases
    if (finalId === "hero-slide-1") await unmarkBannerAsDeleted("banner-hero-1");
    if (finalId === "hero-slide-2") await unmarkBannerAsDeleted("banner-hero-2");
    if (finalId === "hero-slide-3") await unmarkBannerAsDeleted("banner-hero-3");
    if (finalId === "deal-card-1") await unmarkBannerAsDeleted("banner-deal-1");
    if (finalId === "deal-card-2") await unmarkBannerAsDeleted("banner-deal-2");
    if (finalId === "deal-card-3") await unmarkBannerAsDeleted("banner-deal-3");
    if (finalId === "deal-card-4") await unmarkBannerAsDeleted("banner-deal-4");

    return res.status(200).json(banner);
  } catch (err: any) {
    console.error("handleCreateOrReplaceBanner error:", err);
    return res.status(500).json({ error: err.message || "Failed to save banner" });
  }
}

// ─── POST /api/banners & /api/admin/banners — Admin: create / publish new banner ─
router.post("/banners", authenticateJWT as any, requireRole(["SuperAdmin", "Manager", "Admin"]) as any, async (req: Request, res: Response) => {
  return handleCreateOrReplaceBanner(req, res);
});

router.post("/admin/banners", authenticateJWT as any, requireRole(["SuperAdmin", "Manager", "Admin"]) as any, async (req: Request, res: Response) => {
  return handleCreateOrReplaceBanner(req, res);
});

// ─── PATCH /api/banners/:id & /api/admin/banners/:id — Admin: update / replace banner ──
const patchBannerHandler = async (req: Request, res: Response) => {
  const { id } = req.params;
  const resolvedId = resolveSlotTargetId(id as string, req.body?.page);
  return handleCreateOrReplaceBanner(req, res, resolvedId);
};

router.patch("/banners/:id", authenticateJWT as any, requireRole(["SuperAdmin", "Manager", "Admin"]) as any, patchBannerHandler);
router.patch("/admin/banners/:id", authenticateJWT as any, requireRole(["SuperAdmin", "Manager", "Admin"]) as any, patchBannerHandler);

// ─── PUT /api/banners/:id & /api/admin/banners/:id — Admin: update / replace banner ───
const putBannerHandler = async (req: Request, res: Response) => {
  const { id } = req.params;
  const resolvedId = resolveSlotTargetId(id as string, req.body?.page);
  return handleCreateOrReplaceBanner(req, res, resolvedId);
};

router.put("/banners/:id", authenticateJWT as any, requireRole(["SuperAdmin", "Manager", "Admin"]) as any, putBannerHandler);
router.put("/admin/banners/:id", authenticateJWT as any, requireRole(["SuperAdmin", "Manager", "Admin"]) as any, putBannerHandler);

// ─── DELETE SETTINGS HELPERS ──────────────────────────────────────────────────
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

const unmarkBannerAsDeleted = async (id: string) => {
  try {
    const deletedDoc = await db.collection("settings").doc("DELETED_BANNERS").get();
    if (deletedDoc.exists && deletedDoc.data()?.ids) {
      const currentIds: string[] = deletedDoc.data().ids.filter((deletedId: string) => deletedId !== id && deletedId !== "all-cleared-flag");
      await db.collection("settings").doc("DELETED_BANNERS").set({ key: "DELETED_BANNERS", ids: currentIds, updatedAt: new Date().toISOString() });
    }
  } catch (e) {
    console.error("Error unmarking banner from DELETED_BANNERS:", e);
  }
};

// ─── DELETE /api/admin/banners/all & /api/banners/all — Delete all banners ────
const deleteAllBannersHandler = async (req: Request, res: Response) => {
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
};

router.delete("/admin/banners/all", authenticateJWT as any, requireRole(["SuperAdmin", "Manager", "Admin"]) as any, deleteAllBannersHandler);
router.delete("/banners/all", authenticateJWT as any, requireRole(["SuperAdmin", "Manager", "Admin"]) as any, deleteAllBannersHandler);

// ─── DELETE /api/banners/:id & /api/admin/banners/:id — Admin: delete banner ───
const deleteSingleBannerHandler = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: "Banner ID is required" });
    const targetId = String(id).trim();
    const resolvedId = resolveSlotTargetId(targetId);

    // 1. Delete from Firestore / mock database
    await db.collection("banners").doc(targetId).delete();
    if (resolvedId !== targetId) {
      await db.collection("banners").doc(resolvedId).delete();
    }

    // 2. Mark in DELETED_BANNERS settings so default banners or fallback templates don't reappear
    await markBannerAsDeleted(targetId);
    await markBannerAsDeleted(resolvedId);

    // If default template ID, also mark mapped ID
    if (targetId.startsWith("default-")) {
      const mapped = targetId.replace("default-", "");
      await markBannerAsDeleted(mapped);
    }

    res.json({ success: true, message: `Banner '${targetId}' deleted successfully` });
  } catch (err: any) {
    console.error("deleteSingleBannerHandler error:", err);
    res.status(500).json({ error: err.message || "Failed to delete banner" });
  }
};

router.delete("/banners/:id", authenticateJWT as any, requireRole(["SuperAdmin", "Manager", "Admin"]) as any, deleteSingleBannerHandler);
router.delete("/admin/banners/:id", authenticateJWT as any, requireRole(["SuperAdmin", "Manager", "Admin"]) as any, deleteSingleBannerHandler);


export default router;
