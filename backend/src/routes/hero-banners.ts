import { emitStorefrontUpdate } from "../utils/socketSync";
import { Router, Request, Response } from "express";
import fs from "fs";
import path from "path";
import prisma from "../prisma";
import db, { invalidatePrismaCache } from "../firebase";
import { authenticateJWT, requireRole } from "../middleware/auth";

const router = Router();

// Ensure upload directory exists
const uploadDir = path.join(process.cwd(), "uploads", "banners");
try {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
} catch (e) {
  console.warn("Could not create uploads/banners directory:", e);
}

// In-memory cache for ultra-fast hero banner delivery
let heroBannersCache: { data: any[]; expiry: number } | null = null;
export function invalidateHeroBannersCache() {
  heroBannersCache = null;
  invalidatePrismaCache("hero_banners");
}

function notifyRealtimeSync(req: Request, type: string, extra?: any) {
  try {
    emitStorefrontUpdate(req, type || "hero_banners", extra);
    const io = (req.app as any)?.get("io");
    if (io) {
      io.emit("content_updated", { type, timestamp: Date.now(), ...extra });
      io.emit("data_sync", { type, timestamp: Date.now(), ...extra });
    }
  } catch (e) {}
}

// Setup Multer if available
let uploadMiddleware: any = (req: any, res: any, next: any) => next();

try {
  const multer = require("multer");
  const storage = multer.diskStorage({
    destination: (req: any, file: any, cb: any) => {
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: (req: any, file: any, cb: any) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const cleanBase = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, "");
      cb(null, `hero-${Date.now()}-${cleanBase || "media"}${ext}`);
    }
  });

  const fileFilter = (req: any, file: any, cb: any) => {
    const allowedMimes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/gif",
      "video/mp4",
      "video/webm"
    ];
    if (allowedMimes.includes(file.mimetype.toLowerCase())) {
      cb(null, true);
    } else {
      cb(new Error("Unsupported media format. Only JPG, PNG, WEBP, GIF, MP4, and WEBM are allowed."));
    }
  };

  const upload = multer({
    storage,
    fileFilter,
    limits: {
      fileSize: 25 * 1024 * 1024 // 25MB max
    }
  });

  uploadMiddleware = upload.single("mediaFile");
} catch (e) {
  console.log("ℹ️ Multer is not installed yet; falling back to base64 media processor.");
}

// Helper to determine media type from filename or mimetype
function detectMediaType(mimetypeOrFilename: string): "image" | "video" | "gif" {
  const str = (mimetypeOrFilename || "").toLowerCase();
  if (str.includes("video") || str.endsWith(".mp4") || str.endsWith(".webm")) {
    return "video";
  }
  if (str.includes("gif") || str.endsWith(".gif")) {
    return "gif";
  }
  return "image";
}

// Helper to safely delete old banner media file from disk
function deleteMediaFromDisk(mediaUrl?: string | null) {
  if (!mediaUrl || typeof mediaUrl !== "string") return;
  try {
    if (mediaUrl.includes("/uploads/banners/")) {
      const filename = path.basename(mediaUrl.split("?")[0]);
      const possibleLocations = [
        path.join(uploadDir, filename),
        path.join(process.cwd(), "uploads", "banners", filename),
        path.join(process.cwd(), "backend", "uploads", "banners", filename),
        path.join(__dirname, "..", "..", "uploads", "banners", filename)
      ];
      for (const loc of possibleLocations) {
        if (fs.existsSync(loc)) {
          fs.unlinkSync(loc);
          console.log(`[HeroBanner] Cleaned up media file from disk: ${loc}`);
          break;
        }
      }
    }
  } catch (err) {
    console.warn(`[HeroBanner] Could not delete media file: ${mediaUrl}`, err);
  }
}

// Helper to save base64 media fallback to file
function saveBase64MediaToFile(base64Data: string, originalFilename?: string): { url: string; mediaType: "image" | "video" | "gif" } | null {
  try {
    const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return null;
    }
    const mime = matches[1].toLowerCase();
    const buffer = Buffer.from(matches[2], "base64");

    // Size limit verification: 5MB for images, 25MB for videos/GIFs
    const isVid = mime.startsWith("video/");
    const isGif = mime === "image/gif";
    const maxAllowed = isVid || isGif ? 25 * 1024 * 1024 : 5 * 1024 * 1024;
    if (buffer.length > maxAllowed) {
      throw new Error(`File size exceeds limit (${isVid ? "25MB for videos" : "5MB for images"})`);
    }

    let ext = ".jpg";
    if (mime.includes("png")) ext = ".png";
    else if (mime.includes("webp")) ext = ".webp";
    else if (mime.includes("gif")) ext = ".gif";
    else if (mime.includes("mp4")) ext = ".mp4";
    else if (mime.includes("webm")) ext = ".webm";

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const cleanName = originalFilename ? path.basename(originalFilename, path.extname(originalFilename)).replace(/[^a-zA-Z0-9_-]/g, "") : "media";
    const filename = `hero-${Date.now()}-${cleanBase64(cleanName)}${ext}`;
    const filePath = path.join(uploadDir, filename);

    fs.writeFileSync(filePath, buffer);
    return {
      url: `/uploads/banners/${filename}`,
      mediaType: isVid ? "video" : isGif ? "gif" : "image"
    };
  } catch (err: any) {
    console.error("Failed to save base64 media:", err);
    throw err;
  }
}

function cleanBase64(str: string): string {
  return str.slice(0, 30);
}

function resolveFullUrl(req: Request, url?: string | null): string {
  if (!url || typeof url !== "string") return "";
  const clean = url.trim();
  if (clean.startsWith("http://") || clean.startsWith("https://") || clean.startsWith("data:")) return clean;
  const pathPart = clean.startsWith("/") ? clean : `/${clean}`;
  const host = req.get("host") || "localhost:5000";
  const proto = req.protocol === "https" || req.get("x-forwarded-proto") === "https" ? "https" : "http";
  return `${proto}://${host}${pathPart}`;
}

// ─── 1. GET /api/hero-banners — Public: Get all active hero banners ──────────
const getHeroBannersHandler = async (req: Request, res: Response) => {
  try {
    const isAll = req.query.all === "true" || req.path.includes("/admin");
    const isBypass = req.query.bypass === "true" || Boolean(req.query.t);

    let bannersList: any[] = [];

    // Attempt Prisma query first
    try {
      if ((prisma as any).heroBanner) {
        const whereClause = isAll ? {} : { isActive: true };
        bannersList = await (prisma as any).heroBanner.findMany({
          where: whereClause,
          orderBy: { order: "asc" }
        });
      }
    } catch (prismaErr) {
      // Fallback to Firestore / In-memory bridge
      bannersList = [];
    }

    if (!bannersList || bannersList.length === 0) {
      try {
        const snapshot = await db.collection("hero_banners").get();
        snapshot.forEach((doc: any) => {
          const d = doc.data();
          if (isAll || d.isActive !== false) {
            bannersList.push({ id: doc.id, ...d });
          }
        });
        bannersList.sort((a, b) => (a.order || 0) - (b.order || 0));
      } catch (dbErr) {}
    }

    const formattedBanners = bannersList.map((b: any) => ({
      ...b,
      isActive: b.isActive !== undefined ? Boolean(b.isActive) : true,
      mediaUrl: resolveFullUrl(req, b.mediaUrl),
      imageUrl: resolveFullUrl(req, b.mediaUrl || b.imageUrl),
    }));

    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.json(formattedBanners);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to fetch hero banners" });
  }
};

router.get("/hero-banners", getHeroBannersHandler);
router.get("/admin/hero-banners", authenticateJWT as any, requireRole(["SuperAdmin", "Manager", "Admin"]) as any, getHeroBannersHandler);

// ─── 2. POST /api/hero-banners — Admin: Upload & Create Hero Banner ──────────
const createHeroBannerHandler = async (req: any, res: Response) => {
  try {
    const { title, subtitle, ctaLink, order } = req.body || {};
    const isActive = req.body.isActive === undefined ? true : (req.body.isActive === true || req.body.isActive === "true");
    const numOrder = order !== undefined ? parseInt(order, 10) || 0 : 0;

    let finalMediaUrl = "";
    let finalMediaType: "image" | "video" | "gif" = "image";

    // 1. Process uploaded file from multer
    if (req.file) {
      const mime = req.file.mimetype.toLowerCase();
      const isVideo = mime.startsWith("video/");
      const isGif = mime === "image/gif";

      // Enforce 5MB limit for static images, 25MB for videos/GIFs
      if (!isVideo && !isGif && req.file.size > 5 * 1024 * 1024) {
        fs.unlinkSync(req.file.path);
        return res.status(400).json({ error: "Image size must not exceed 5MB." });
      }

      finalMediaUrl = `/uploads/banners/${req.file.filename}`;
      finalMediaType = isVideo ? "video" : isGif ? "gif" : "image";
    } 
    // 2. Process base64 data URL payload
    else if (req.body.mediaBase64 && req.body.mediaBase64.startsWith("data:")) {
      try {
        const saved = saveBase64MediaToFile(req.body.mediaBase64, req.body.originalFilename || title);
        if (saved) {
          finalMediaUrl = saved.url;
          finalMediaType = saved.mediaType;
        }
      } catch (err: any) {
        return res.status(400).json({ error: err.message || "Invalid media upload" });
      }
    } 
    // 3. Fallback direct media URL
    else if (req.body.mediaUrl) {
      finalMediaUrl = req.body.mediaUrl.trim();
      finalMediaType = (req.body.mediaType as any) || detectMediaType(finalMediaUrl);
    }

    if (!finalMediaUrl) {
      return res.status(400).json({ error: "Please upload an image, animated GIF, or video for the Hero Banner." });
    }

    const docId = `hero-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const bannerData = {
      id: docId,
      title: title || "GlowGoodly Hero Banner",
      subtitle: subtitle || null,
      mediaUrl: finalMediaUrl,
      mediaType: finalMediaType,
      ctaLink: ctaLink || "/shop",
      isActive: Boolean(isActive),
      order: numOrder,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Save to Prisma ORM
    let savedBanner = null;
    try {
      if ((prisma as any).heroBanner) {
        savedBanner = await (prisma as any).heroBanner.create({
          data: bannerData
        });
      }
    } catch (e) {
      console.warn("Prisma heroBanner save fallback:", e);
    }

    // Save to Firestore / In-memory bridge for instant sync
    try {
      const docRef = db.collection("hero_banners").doc(docId);
      await docRef.set({
        ...bannerData,
        createdAt: bannerData.createdAt.toISOString(),
        updatedAt: bannerData.updatedAt.toISOString()
      });
    } catch (e) {}

    invalidateHeroBannersCache();
    notifyRealtimeSync(req, "hero_banners", { id: docId, action: "create" });
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
    res.status(201).json({
      ...(savedBanner || bannerData),
      mediaUrl: resolveFullUrl(req, bannerData.mediaUrl),
      imageUrl: resolveFullUrl(req, bannerData.mediaUrl)
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to create hero banner" });
  }
};

router.post(
  "/hero-banners",
  authenticateJWT as any,
  requireRole(["SuperAdmin", "Manager", "Admin"]) as any,
  uploadMiddleware,
  createHeroBannerHandler
);

router.post(
  "/admin/hero-banners",
  authenticateJWT as any,
  requireRole(["SuperAdmin", "Manager", "Admin"]) as any,
  uploadMiddleware,
  createHeroBannerHandler
);

// ─── 3. PUT /api/hero-banners/:id — Admin: Update Hero Banner ────────────────
const updateHeroBannerHandler = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { title, subtitle, ctaLink, order, isActive } = req.body || {};

    // Retrieve existing banner
    let currentBanner: any = null;
    try {
      if ((prisma as any).heroBanner) {
        currentBanner = await (prisma as any).heroBanner.findUnique({ where: { id } });
      }
    } catch (e) {}

    if (!currentBanner) {
      const doc = await db.collection("hero_banners").doc(id).get();
      if (doc.exists) {
        currentBanner = doc.data();
      }
    }

    if (!currentBanner) {
      return res.status(404).json({ error: "Hero Banner not found" });
    }

    let finalMediaUrl = currentBanner.mediaUrl;
    let finalMediaType = currentBanner.mediaType || "image";

    // If new file uploaded, delete old file and update URL
    if (req.file) {
      const mime = req.file.mimetype.toLowerCase();
      const isVideo = mime.startsWith("video/");
      const isGif = mime === "image/gif";

      if (!isVideo && !isGif && req.file.size > 5 * 1024 * 1024) {
        fs.unlinkSync(req.file.path);
        return res.status(400).json({ error: "Image size must not exceed 5MB." });
      }

      deleteMediaFromDisk(currentBanner.mediaUrl);
      finalMediaUrl = `/uploads/banners/${req.file.filename}`;
      finalMediaType = isVideo ? "video" : isGif ? "gif" : "image";
    } else if (req.body.mediaBase64 && req.body.mediaBase64.startsWith("data:")) {
      try {
        const saved = saveBase64MediaToFile(req.body.mediaBase64, req.body.originalFilename || title);
        if (saved) {
          deleteMediaFromDisk(currentBanner.mediaUrl);
          finalMediaUrl = saved.url;
          finalMediaType = saved.mediaType;
        }
      } catch (err: any) {
        return res.status(400).json({ error: err.message || "Invalid media upload" });
      }
    } else if (req.body.mediaUrl && req.body.mediaUrl !== currentBanner.mediaUrl) {
      deleteMediaFromDisk(currentBanner.mediaUrl);
      finalMediaUrl = req.body.mediaUrl.trim();
      finalMediaType = (req.body.mediaType as any) || detectMediaType(finalMediaUrl);
    }

    const updatePayload: any = {
      ...(title !== undefined && { title }),
      ...(subtitle !== undefined && { subtitle: subtitle || null }),
      ...(ctaLink !== undefined && { ctaLink: ctaLink || null }),
      ...(order !== undefined && { order: parseInt(order, 10) || 0 }),
      ...(isActive !== undefined && { isActive: Boolean(isActive === true || isActive === "true") }),
      mediaUrl: finalMediaUrl,
      mediaType: finalMediaType,
      updatedAt: new Date()
    };

    let updated = null;
    try {
      if ((prisma as any).heroBanner) {
        updated = await (prisma as any).heroBanner.update({
          where: { id },
          data: updatePayload
        });
      }
    } catch (e) {}

    try {
      const docRef = db.collection("hero_banners").doc(id);
      await docRef.set({ ...currentBanner, ...updatePayload, updatedAt: new Date().toISOString() }, { merge: true });
    } catch (e) {}

    invalidateHeroBannersCache();
    notifyRealtimeSync(req, "hero_banners", { id, action: "update" });
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
    res.json(updated || { id, ...currentBanner, ...updatePayload });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to update hero banner" });
  }
};

router.put(
  "/hero-banners/:id",
  authenticateJWT as any,
  requireRole(["SuperAdmin", "Manager", "Admin"]) as any,
  uploadMiddleware,
  updateHeroBannerHandler
);

router.put(
  "/admin/hero-banners/:id",
  authenticateJWT as any,
  requireRole(["SuperAdmin", "Manager", "Admin"]) as any,
  uploadMiddleware,
  updateHeroBannerHandler
);

// ─── 4. DELETE /api/hero-banners/:id — Admin: Delete Hero Banner & Clean Disk ─
const deleteHeroBannerHandler = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    let bannerToDelete: any = null;
    try {
      if ((prisma as any).heroBanner) {
        bannerToDelete = await (prisma as any).heroBanner.findUnique({ where: { id } });
      }
    } catch (e) {}

    if (!bannerToDelete) {
      const doc = await db.collection("hero_banners").doc(id).get();
      if (doc.exists) {
        bannerToDelete = doc.data();
      }
    }

    if (!bannerToDelete) {
      return res.status(404).json({ error: "Hero Banner not found" });
    }

    // 1. Delete media file from disk
    if (bannerToDelete.mediaUrl) {
      deleteMediaFromDisk(bannerToDelete.mediaUrl);
    }

    // 2. Delete from database
    try {
      if ((prisma as any).heroBanner) {
        await (prisma as any).heroBanner.delete({ where: { id } });
      }
    } catch (e) {}

    try {
      await db.collection("hero_banners").doc(id).delete();
    } catch (e) {}

    invalidateHeroBannersCache();
    notifyRealtimeSync(req, "hero_banners", { id, action: "delete" });
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
    res.json({ success: true, message: "Hero Banner and media file deleted successfully", id });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to delete hero banner" });
  }
};

router.delete(
  "/hero-banners/:id",
  authenticateJWT as any,
  requireRole(["SuperAdmin", "Manager", "Admin"]) as any,
  deleteHeroBannerHandler
);

router.delete(
  "/admin/hero-banners/:id",
  authenticateJWT as any,
  requireRole(["SuperAdmin", "Manager", "Admin"]) as any,
  deleteHeroBannerHandler
);

// ─── 5. POST /api/admin/hero-banners/bulk-delete — Bulk Delete Hero Banners ─
const bulkDeleteHeroBannersHandler = async (req: Request, res: Response) => {
  try {
    const { ids } = req.body || {};
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, error: "Please provide an array of banner IDs to delete" });
    }

    let deletedCount = 0;
    for (const id of ids) {
      try {
        let bannerToDelete: any = null;
        if ((prisma as any).heroBanner) {
          bannerToDelete = await (prisma as any).heroBanner.findUnique({ where: { id } }).catch(() => null);
        }
        if (!bannerToDelete) {
          const doc = await db.collection("hero_banners").doc(id).get().catch(() => null);
          if (doc && doc.exists) bannerToDelete = doc.data();
        }

        if (bannerToDelete?.mediaUrl) {
          deleteMediaFromDisk(bannerToDelete.mediaUrl);
        }

        if ((prisma as any).heroBanner) {
          await (prisma as any).heroBanner.delete({ where: { id } }).catch(() => null);
        }
        await db.collection("hero_banners").doc(id).delete().catch(() => null);
        deletedCount++;
      } catch (itemErr) {
        console.warn(`Failed to delete hero banner ${id}:`, itemErr);
      }
    }

    invalidateHeroBannersCache();
    notifyRealtimeSync(req, "hero_banners", { action: "bulk-delete", count: deletedCount });
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
    res.json({ success: true, message: `Successfully deleted ${deletedCount} hero banner(s)`, count: deletedCount });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || "Failed to bulk delete hero banners" });
  }
};

router.post(
  "/hero-banners/bulk-delete",
  authenticateJWT as any,
  requireRole(["SuperAdmin", "Manager", "Admin"]) as any,
  bulkDeleteHeroBannersHandler
);

router.post(
  "/admin/hero-banners/bulk-delete",
  authenticateJWT as any,
  requireRole(["SuperAdmin", "Manager", "Admin"]) as any,
  bulkDeleteHeroBannersHandler
);

export default router;

