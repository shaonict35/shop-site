
import { Router, Request, Response } from "express";
import fs from "fs";
import path from "path";
import prisma from "../prisma";
import db, { invalidatePrismaCache } from "../firebase";
import { authenticateJWT, requireRole, AuthenticatedRequest } from "../middleware/auth";

const router = Router();

const uploadBannersDir = path.join(process.cwd(), "uploads", "banners");
try {
  if (!fs.existsSync(uploadBannersDir)) {
    fs.mkdirSync(uploadBannersDir, { recursive: true });
  }
} catch (e) {
  console.warn("Could not create uploads/banners folder:", e);
}

function saveBase64ToFile(base64Data?: string | null, prefix = "banner"): string {
  if (!base64Data || typeof base64Data !== "string") return "";
  const clean = base64Data.trim();
  if (!clean.startsWith("data:")) return clean;
  try {
    const matches = clean.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) return clean;
    const mime = matches[1].toLowerCase();
    const buffer = Buffer.from(matches[2], "base64");
    let ext = ".jpg";
    if (mime.includes("png")) ext = ".png";
    else if (mime.includes("webp")) ext = ".webp";
    else if (mime.includes("gif")) ext = ".gif";

    const filename = `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 6)}${ext}`;
    const filePath = path.join(uploadBannersDir, filename);
    fs.writeFileSync(filePath, buffer);
    return `/uploads/banners/${filename}`;
  } catch (err) {
    console.error("Failed saving base64 to file:", err);
    return clean;
  }
}

function notifyRealtimeSync(req: Request, type: string, extra?: any) {
  try {
    const io = (req.app as any)?.get("io");
    if (io) {
      io.emit("content_updated", { type, timestamp: Date.now(), ...extra });
      io.emit("data_sync", { type, timestamp: Date.now(), ...extra });
    }
  } catch (e) {}
}

async function ensureInitialBanners() {
  try {
    const deletedDoc = await db.collection("settings").doc("DELETED_BANNERS").get();
    const deletedIds: string[] = deletedDoc.exists ? (deletedDoc.data()?.ids || []) : [];

    const snapshot = await db.collection("banners").get();
    for (const doc of snapshot.docs) {
      const data = doc.data();
      if (!data) continue;
      // If user deliberately deleted this banner, do not re-populate
      if (deletedIds.includes(doc.id)) continue;

      // Only sanitize old broken shajgoj URLs, NEVER resurrect deleted/empty images
      if (data.imageUrl && data.imageUrl.includes("shajgoj")) {
        await doc.ref.update({ imageUrl: "", mobileImageUrl: "", tabletImageUrl: "" });
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
    cleaned.imageUrl = "";
  }
  if (cleaned.mobileImageUrl && cleaned.mobileImageUrl.includes("shajgoj")) {
    cleaned.mobileImageUrl = cleaned.imageUrl || "";
  }
  if (cleaned.tabletImageUrl && cleaned.tabletImageUrl.includes("shajgoj")) {
    cleaned.tabletImageUrl = cleaned.imageUrl || "";
  }
  return cleaned;
}

  let publicBannersCache: { data: any[]; expiry: number } | null = null;
  let hasEnsuredBanners = false;

  function resolveFullUrl(req: Request, url?: string | null): string {
    if (!url || typeof url !== "string") return "";
    const clean = url.trim();
    if (clean.startsWith("http://") || clean.startsWith("https://") || clean.startsWith("data:")) return clean;
    const pathPart = clean.startsWith("/") ? clean : `/${clean}`;
    const host = req.get("host") || "localhost:5000";
    const proto = req.protocol === "https" || req.get("x-forwarded-proto") === "https" ? "https" : "http";
    return `${proto}://${host}${pathPart}`;
  }

  export function invalidateBannersCache() {
    publicBannersCache = null;
  }

  // ─── GET /api/banners — Public: get all ACTIVE banners ───────────────────────
  router.get("/banners", async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!hasEnsuredBanners) {
        await ensureInitialBanners();
        hasEnsuredBanners = true;
      }
      const deletedDoc = await db.collection("settings").doc("DELETED_BANNERS").get();
      const deletedIds: string[] = deletedDoc.exists ? (deletedDoc.data()?.ids || []) : [];

      const snapshot = await db.collection("banners").get();
      const banners: any[] = [];
      snapshot.forEach(doc => {
        if (deletedIds.includes(doc.id)) return;
        const data = cleanBannerData(doc.data());
        const active = data.isActive === undefined || data.isActive === true || data.isActive === "true" || String(data.isActive) !== "false";
        if (data && active) {
          banners.push({
            id: doc.id,
            ...data,
            imageUrl: resolveFullUrl(req, data.imageUrl),
            mobileImageUrl: resolveFullUrl(req, data.mobileImageUrl || data.imageUrl),
            tabletImageUrl: resolveFullUrl(req, data.tabletImageUrl || data.imageUrl),
          });
        }
      });

      banners.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
      res.json(banners);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to fetch banners" });
    }
  });

  // ─── GET /api/admin/banners & /api/banners/all — Admin: get ALL banners for admin panel list ───
  const getAllBannersHandler = async (req: Request, res: Response) => {
    try {
      if (!hasEnsuredBanners) {
        await ensureInitialBanners();
        hasEnsuredBanners = true;
      }
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
  router.post("/banners", authenticateJWT as any, requireRole(["SuperAdmin", "Manager", "Admin"]) as any, async (req: Request, res: Response) => {
    try {
      const { title, imageUrl, mobileImageUrl, tabletImageUrl, linkUrl, bgColor, page, isActive, sortOrder } = req.body;
      if (!title || !imageUrl) {
        res.status(400).json({ error: "title and imageUrl are required" });
        return;
      }

      const finalImg = saveBase64ToFile(imageUrl, "banner");
      const finalMobileImg = saveBase64ToFile(mobileImageUrl || imageUrl, "banner-mob");
      const finalTabletImg = saveBase64ToFile(tabletImageUrl || imageUrl, "banner-tab");

      const docRef = db.collection("banners").doc();
      const banner = {
        id: docRef.id,
        title,
        imageUrl: finalImg,
        mobileImageUrl: finalMobileImg || null,
        tabletImageUrl: finalTabletImg || null,
        linkUrl: linkUrl || null,
        bgColor: bgColor || "#1a1a2e",
        page: page || "Homepage",
        isActive: isActive !== undefined ? Boolean(isActive) : true,
        sortOrder: sortOrder ? Number(sortOrder) : 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // 1. Save to Prisma
      try {
        await prisma.promoBanner.create({
          data: {
            id: banner.id,
            title: banner.title,
            imageUrl: banner.imageUrl,
            mobileImageUrl: banner.mobileImageUrl,
            tabletImageUrl: banner.tabletImageUrl,
            linkUrl: banner.linkUrl,
            bgColor: banner.bgColor,
            page: banner.page,
            isActive: banner.isActive,
            sortOrder: banner.sortOrder,
          }
        });
      } catch (prismaErr) {
        console.warn("Prisma banner create fallback:", prismaErr);
      }

      // 2. Save to Firestore bridge
      await docRef.set(banner);
      await unmarkBannerAsDeleted(docRef.id);

      invalidateBannersCache();
      invalidatePrismaCache("banners");
      notifyRealtimeSync(req, "banners", { id: docRef.id, action: "create" });

      res.status(201).json(banner);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to create banner" });
    }
  });

  // ─── PATCH & PUT /api/banners/:id & /api/admin/banners/:id — Admin: update banner ───
  const handleUpdateBanner = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { title, imageUrl, mobileImageUrl, tabletImageUrl, linkUrl, bgColor, page, isActive, sortOrder } = req.body;

      const docRef = db.collection("banners").doc(id as string);
      const doc = await docRef.get();

      const current = doc.exists ? doc.data() as any : {};
      const finalImg = imageUrl !== undefined ? saveBase64ToFile(imageUrl, "banner") : current.imageUrl;
      const finalMobileImg = mobileImageUrl !== undefined ? saveBase64ToFile(mobileImageUrl, "banner-mob") : current.mobileImageUrl;
      const finalTabletImg = tabletImageUrl !== undefined ? saveBase64ToFile(tabletImageUrl, "banner-tab") : current.tabletImageUrl;

      const updated = {
        ...current,
        id: id as string,
        ...(title !== undefined && { title }),
        imageUrl: finalImg,
        mobileImageUrl: finalMobileImg || null,
        tabletImageUrl: finalTabletImg || null,
        ...(linkUrl !== undefined && { linkUrl }),
        ...(bgColor !== undefined && { bgColor }),
        ...(page !== undefined && { page }),
        ...(isActive !== undefined && { isActive: Boolean(isActive) }),
        ...(sortOrder !== undefined && { sortOrder: Number(sortOrder) }),
        updatedAt: new Date().toISOString(),
      };

      // 1. Save to Prisma
      try {
        await prisma.promoBanner.upsert({
          where: { id: id as string },
          update: {
            ...(title !== undefined && { title }),
            imageUrl: finalImg,
            mobileImageUrl: finalMobileImg || null,
            tabletImageUrl: finalTabletImg || null,
            ...(linkUrl !== undefined && { linkUrl }),
            ...(bgColor !== undefined && { bgColor }),
            ...(page !== undefined && { page }),
            ...(isActive !== undefined && { isActive: Boolean(isActive) }),
            ...(sortOrder !== undefined && { sortOrder: Number(sortOrder) }),
          },
          create: {
            id: id as string,
            title: updated.title || "Homepage Banner",
            imageUrl: finalImg,
            mobileImageUrl: finalMobileImg || null,
            tabletImageUrl: finalTabletImg || null,
            linkUrl: updated.linkUrl || null,
            bgColor: updated.bgColor || "#1a1a2e",
            page: updated.page || "Homepage",
            isActive: updated.isActive !== undefined ? updated.isActive : true,
            sortOrder: updated.sortOrder || 0,
          }
        });
      } catch (prismaErr) {
        console.warn("Prisma banner update fallback:", prismaErr);
      }

      // 2. Save to Firestore bridge
      await docRef.set(updated, { merge: true });
      await unmarkBannerAsDeleted(id as string);

      invalidateBannersCache();
      invalidatePrismaCache("banners");
      notifyRealtimeSync(req, "banners", { id, action: "update" });

      res.json({ id, ...updated });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  };

  router.patch("/banners/:id", authenticateJWT as any, requireRole(["SuperAdmin", "Manager", "Admin"]) as any, handleUpdateBanner);
  router.put("/banners/:id", authenticateJWT as any, requireRole(["SuperAdmin", "Manager", "Admin"]) as any, handleUpdateBanner);
  router.patch("/admin/banners/:id", authenticateJWT as any, requireRole(["SuperAdmin", "Manager", "Admin"]) as any, handleUpdateBanner);
  router.put("/admin/banners/:id", authenticateJWT as any, requireRole(["SuperAdmin", "Manager", "Admin"]) as any, handleUpdateBanner);

  // ─── POST /api/admin/banners — Admin alias ──────────────────────────────────
  router.post("/admin/banners", authenticateJWT as any, requireRole(["SuperAdmin", "Manager", "Admin"]) as any, async (req: Request, res: Response) => {
    try {
      const { title, imageUrl, mobileImageUrl, tabletImageUrl, linkUrl, bgColor, page, isActive, sortOrder } = req.body;
      if (!title || !imageUrl) {
        res.status(400).json({ error: "title and imageUrl are required" });
        return;
      }

      const finalImg = saveBase64ToFile(imageUrl, "banner");
      const finalMobileImg = saveBase64ToFile(mobileImageUrl || imageUrl, "banner-mob");
      const finalTabletImg = saveBase64ToFile(tabletImageUrl || imageUrl, "banner-tab");

      const docRef = db.collection("banners").doc();
      const banner = {
        id: docRef.id,
        title,
        imageUrl: finalImg,
        mobileImageUrl: finalMobileImg || null,
        tabletImageUrl: finalTabletImg || null,
        linkUrl: linkUrl || null,
        bgColor: bgColor || "#1a1a2e",
        page: page || "Homepage",
        isActive: isActive !== undefined ? Boolean(isActive) : true,
        sortOrder: sortOrder ? Number(sortOrder) : 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      try {
        await prisma.promoBanner.create({
          data: {
            id: banner.id,
            title: banner.title,
            imageUrl: banner.imageUrl,
            mobileImageUrl: banner.mobileImageUrl,
            tabletImageUrl: banner.tabletImageUrl,
            linkUrl: banner.linkUrl,
            bgColor: banner.bgColor,
            page: banner.page,
            isActive: banner.isActive,
            sortOrder: banner.sortOrder,
          }
        });
      } catch (prismaErr) {
        console.warn("Prisma admin banner create fallback:", prismaErr);
      }

      await docRef.set(banner);
      invalidateBannersCache();
      invalidatePrismaCache("banners");
      notifyRealtimeSync(req, "banners", { id: docRef.id, action: "create" });

      res.status(201).json(banner);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to create banner" });
    }
  const markBannerAsDeleted = async (id: string) => {
    try {
      invalidateBannersCache();
      invalidatePrismaCache("banners");
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

  // ─── DELETE /api/banners/all & /api/admin/banners/all — Delete all banners ───
  const handleDeleteAllBanners = async (req: Request, res: Response) => {
    try {
      const snapshot = await db.collection("banners").get();
      const ids: string[] = [];
      snapshot.forEach((doc: any) => ids.push(doc.id));
      for (const id of ids) {
        await db.collection("banners").doc(id).delete();
        await markBannerAsDeleted(id);
      }
      try {
        await prisma.promoBanner.deleteMany({});
      } catch (_) {}
      invalidateBannersCache();
      invalidatePrismaCache("banners");
      notifyRealtimeSync(req, "banners", { action: "delete_all" });
      res.json({ success: true, message: "All banners deleted successfully" });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  };

  router.delete("/admin/banners/all", authenticateJWT as any, requireRole(["SuperAdmin", "Manager", "Admin"]) as any, handleDeleteAllBanners);
  router.delete("/banners/all", authenticateJWT as any, requireRole(["SuperAdmin", "Manager", "Admin"]) as any, handleDeleteAllBanners);

  // ─── DELETE /api/banners/:id & /api/admin/banners/:id — Admin: delete banner ───
  const handleDeleteSingleBanner = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const docRef = db.collection("banners").doc(id as string);
      await docRef.delete();
      await markBannerAsDeleted(id as string);
      try {
        await prisma.promoBanner.delete({ where: { id: id as string } });
      } catch (_) {}
      invalidateBannersCache();
      invalidatePrismaCache("banners");
      notifyRealtimeSync(req, "banners", { id, action: "delete" });
      res.json({ success: true, message: "Banner deleted successfully" });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err?.message || "Failed to delete banner" });
    }
  };

  router.delete("/banners/:id", authenticateJWT as any, requireRole(["SuperAdmin", "Manager", "Admin"]) as any, handleDeleteSingleBanner);
  router.delete("/admin/banners/:id", authenticateJWT as any, requireRole(["SuperAdmin", "Manager", "Admin"]) as any, handleDeleteSingleBanner);

  export default router;
