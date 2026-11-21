import { emitStorefrontUpdate } from "../utils/socketSync";
import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import db from "../firebase";
import { authenticateJWT, requireRole, AuthenticatedRequest } from "../middleware/auth";
import { uploadComboImage } from "../config/multer";
import { deleteUploadedFile } from "../utils/file-cleanup";

const router = Router();
const prisma = new PrismaClient();

async function enrichComboItems(combos: any[]) {
  try {
    const snap = await db.collection("products").get();
    const prodMap = new Map();
    snap.forEach((doc: any) => {
      const d = doc.data();
      prodMap.set(doc.id, d);
      if (d.id) prodMap.set(d.id, d);
    });

    const catSnap = await db.collection("categories").get();
    const catMap = new Map();
    catSnap.forEach((doc: any) => {
      const d = doc.data();
      catMap.set(doc.id, d);
      if (d.id) catMap.set(d.id, d);
    });

    return combos.map(c => ({
      ...c,
      category: c.categoryId ? (catMap.get(c.categoryId) || { id: c.categoryId, name: c.categoryId }) : null,
      items: (c.items || []).map((it: any) => {
        const p = prodMap.get(it.productId);
        return {
          ...it,
          product: p ? {
            id: p.id || it.productId,
            name: p.name || "Product",
            price: p.discountPrice || p.price || 0,
            imageUrl: p.imageUrl || p.images?.[0]?.url || "/placeholder-product.svg",
            images: p.images || []
          } : { id: it.productId, name: "Product", price: 0, imageUrl: "/placeholder-product.svg", images: [] }
        };
      })
    }));
  } catch (e) {
    return combos;
  }
}

function notifyCombosSync(req: Request, action: string, data?: any) {
  try {
    emitStorefrontUpdate(req, "combos", { action, data });
    const io = req.app.get("io");
    if (io) {
      io.emit("combos:updated", { action, data, timestamp: new Date().toISOString() });
      io.emit("data_sync", { module: "combos", action, data, timestamp: new Date().toISOString() });
    }
  } catch (err) {
    console.warn("Socket broadcast error in combos:", err);
  }
}

function generateSlug(text: string): string {
  const base = text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${base}-${Date.now().toString().slice(-4)}`;
}

// ─── 1. PUBLIC: GET ALL ACTIVE COMBOS (WITH CATEGORY / SUBCATEGORY FILTER) ─────
router.get("/", async (req: Request, res: Response) => {
  try {
    const { categoryId, subcategoryId, search, activeOnly } = req.query;
    const where: any = {};

    if (activeOnly !== "false") {
      where.isActive = true;
    }
    if (categoryId && typeof categoryId === "string" && categoryId !== "ALL" && categoryId !== "all") {
      where.categoryId = categoryId;
    }
    if (subcategoryId && typeof subcategoryId === "string" && subcategoryId !== "ALL" && subcategoryId !== "all") {
      where.subcategoryId = subcategoryId;
    }
    if (search && typeof search === "string" && search.trim()) {
      where.OR = [
        { title: { contains: search.trim() } },
        { description: { contains: search.trim() } }
      ];
    }

    const combos = await prisma.combo.findMany({
      where,
      include: {
        items: true
      },
      orderBy: { createdAt: "desc" }
    });

    const enriched = await enrichComboItems(combos);
    res.json(enriched);
  } catch (error: any) {
    console.error("Get combos error:", error);
    res.status(500).json({ error: error.message || "Failed to fetch combos" });
  }
});

// ─── 2. ADMIN: GET ALL COMBOS (ACTIVE & INACTIVE) ─────────────────────────────
router.get("/admin", authenticateJWT as any, requireRole(["SUPER_ADMIN", "ADMIN", "SuperAdmin", "Admin", "Manager"]) as any, async (req: Request, res: Response) => {
  try {
    const combos = await prisma.combo.findMany({
      include: {
        items: true
      },
      orderBy: { createdAt: "desc" }
    });
    const enriched = await enrichComboItems(combos);
    res.json(enriched);
  } catch (error: any) {
    console.error("Admin get combos error:", error);
    res.status(500).json({ error: error.message || "Failed to fetch combos" });
  }
});

// ─── 3. PUBLIC: GET SINGLE COMBO BY ID OR SLUG ────────────────────────────────
router.get("/:idOrSlug", async (req: Request, res: Response) => {
  try {
    const { idOrSlug } = req.params;
    const combo = await prisma.combo.findFirst({
      where: {
        OR: [
          { id: idOrSlug as string },
          { slug: idOrSlug as string }
        ]
      },
      include: {
        items: true
      }
    });

    if (!combo) {
      return res.status(404).json({ error: "Combo not found" });
    }

    const [enriched] = await enrichComboItems([combo]);
    res.json(enriched);
  } catch (error: any) {
    console.error("Get combo error:", error);
    res.status(500).json({ error: error.message || "Failed to fetch combo" });
  }
});

// ─── 4. ADMIN: CREATE COMBO ───────────────────────────────────────────────────
router.post("/", authenticateJWT as any, requireRole(["SUPER_ADMIN", "ADMIN", "SuperAdmin", "Admin", "Manager"]) as any, uploadComboImage.any(), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      title,
      slug,
      description,
      categoryId,
      subcategoryId,
      regularPrice,
      comboPrice,
      isActive,
      items: rawItems
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: "Combo title is required" });
    }

    let bannerImage = req.body.bannerImage || "";
    if (req.files) {
      const fileList = Array.isArray(req.files) ? req.files : Object.values(req.files).flat();
      const imgFile = (fileList as Express.Multer.File[]).find(
        (f) => f.fieldname === "bannerImage" || f.fieldname === "image" || f.fieldname === "file"
      );
      if (imgFile) {
        bannerImage = `/uploads/combos/${imgFile.filename}`;
      }
    }

    let parsedItems: any[] = [];
    if (rawItems) {
      if (typeof rawItems === "string") {
        try {
          parsedItems = JSON.parse(rawItems);
        } catch (e) {
          parsedItems = [];
        }
      } else if (Array.isArray(rawItems)) {
        parsedItems = rawItems;
      }
    }

    const finalSlug = (slug && slug.trim()) ? slug.trim() : generateSlug(title);

    const combo = await prisma.combo.create({
      data: {
        title: title.trim(),
        slug: finalSlug,
        description: description ? description.trim() : null,
        bannerImage: bannerImage || null,
        categoryId: (categoryId && categoryId !== "ALL" && categoryId !== "none") ? categoryId : null,
        subcategoryId: (subcategoryId && subcategoryId !== "ALL" && subcategoryId !== "none") ? subcategoryId : null,
        regularPrice: regularPrice ? Number(regularPrice) : 0,
        comboPrice: comboPrice ? Number(comboPrice) : 0,
        isActive: isActive !== undefined ? Boolean(isActive === true || isActive === "true") : true,
        items: {
          create: parsedItems.map((item: any) => ({
            productId: item.productId,
            variantId: item.variantId || null,
            shadeName: item.shadeName || null,
            quantity: item.quantity ? Number(item.quantity) : 1,
            isFreeGift: Boolean(item.isFreeGift === true || item.isFreeGift === "true")
          }))
        }
      },
      include: {
        items: true
      }
    });

    notifyCombosSync(req, "create", { id: combo.id, title: combo.title });
    const [enriched] = await enrichComboItems([combo]);

    res.status(201).json({
      success: true,
      message: "Combo created successfully!",
      combo: enriched
    });
  } catch (error: any) {
    console.error("Create combo error:", error);
    res.status(500).json({ error: error.message || "Failed to create combo" });
  }
});

// ─── 5. ADMIN: UPDATE COMBO ───────────────────────────────────────────────────
router.put("/:id", authenticateJWT as any, requireRole(["SUPER_ADMIN", "ADMIN", "SuperAdmin", "Admin", "Manager"]) as any, uploadComboImage.any(), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      title,
      slug,
      description,
      categoryId,
      subcategoryId,
      regularPrice,
      comboPrice,
      isActive,
      items: rawItems
    } = req.body;

    const existing = await prisma.combo.findUnique({
      where: { id: id as string },
      include: { items: true }
    });

    if (!existing) {
      return res.status(404).json({ error: "Combo not found" });
    }

    let bannerImage = existing.bannerImage;
    if (req.files) {
      const fileList = Array.isArray(req.files) ? req.files : Object.values(req.files).flat();
      const imgFile = (fileList as Express.Multer.File[]).find(
        (f) => f.fieldname === "bannerImage" || f.fieldname === "image" || f.fieldname === "file"
      );
      if (imgFile) {
        if (existing.bannerImage) {
          deleteUploadedFile(existing.bannerImage);
        }
        bannerImage = `/uploads/combos/${imgFile.filename}`;
      }
    } else if (req.body.bannerImage !== undefined) {
      bannerImage = req.body.bannerImage;
    }

    const updateData: any = {
      ...(title !== undefined && { title: title.trim() }),
      ...(slug !== undefined && { slug: slug.trim() }),
      ...(description !== undefined && { description: description ? description.trim() : null }),
      ...(bannerImage !== undefined && { bannerImage: bannerImage || null }),
      ...(categoryId !== undefined && { categoryId: (categoryId && categoryId !== "ALL" && categoryId !== "none") ? categoryId : null }),
      ...(subcategoryId !== undefined && { subcategoryId: (subcategoryId && subcategoryId !== "ALL" && subcategoryId !== "none") ? subcategoryId : null }),
      ...(regularPrice !== undefined && { regularPrice: Number(regularPrice) }),
      ...(comboPrice !== undefined && { comboPrice: Number(comboPrice) }),
      ...(isActive !== undefined && { isActive: Boolean(isActive === true || isActive === "true") })
    };

    // If items were sent, replace existing items
    if (rawItems !== undefined) {
      let parsedItems: any[] = [];
      if (typeof rawItems === "string") {
        try { parsedItems = JSON.parse(rawItems); } catch (e) { parsedItems = []; }
      } else if (Array.isArray(rawItems)) {
        parsedItems = rawItems;
      }

      await prisma.comboItem.deleteMany({
        where: { comboId: id as string }
      });

      if (parsedItems.length > 0) {
        updateData.items = {
          create: parsedItems.map((item: any) => ({
            productId: item.productId,
            variantId: item.variantId || null,
            shadeName: item.shadeName || null,
            quantity: item.quantity ? Number(item.quantity) : 1,
            isFreeGift: Boolean(item.isFreeGift === true || item.isFreeGift === "true")
          }))
        };
      }
    }

    const updated = await prisma.combo.update({
      where: { id: id as string },
      data: updateData,
      include: {
        items: true
      }
    });

    notifyCombosSync(req, "update", { id: updated.id, title: updated.title });
    const [enriched] = await enrichComboItems([updated]);

    res.json({
      success: true,
      message: "Combo updated successfully!",
      combo: enriched
    });
  } catch (error: any) {
    console.error("Update combo error:", error);
    res.status(500).json({ error: error.message || "Failed to update combo" });
  }
});

router.patch("/:id", authenticateJWT as any, requireRole(["SUPER_ADMIN", "ADMIN", "SuperAdmin", "Admin", "Manager"]) as any, uploadComboImage.any(), async (req: AuthenticatedRequest, res: Response) => {
  // Delegate to PUT handler
  req.method = "PUT";
  (router as any).handle(req, res, () => {});
});

// ─── 6. ADMIN: DELETE SINGLE COMBO ────────────────────────────────────────────
router.delete("/:id", authenticateJWT as any, requireRole(["SUPER_ADMIN", "ADMIN", "SuperAdmin", "Admin"]) as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const existing = await prisma.combo.findUnique({ where: { id: id as string } });
    if (!existing) {
      return res.status(404).json({ error: "Combo not found" });
    }

    if (existing.bannerImage) {
      deleteUploadedFile(existing.bannerImage);
    }

    await prisma.combo.delete({ where: { id: id as string } });

    notifyCombosSync(req, "delete", { id });

    res.json({
      success: true,
      message: "Combo deleted successfully"
    });
  } catch (error: any) {
    console.error("Delete combo error:", error);
    res.status(500).json({ error: error.message || "Failed to delete combo" });
  }
});

// ─── 7. ADMIN: BULK DELETE COMBOS ─────────────────────────────────────────────
router.post("/bulk-delete", authenticateJWT as any, requireRole(["SUPER_ADMIN", "ADMIN", "SuperAdmin", "Admin"]) as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: "ids array is required" });
    }

    const combos = await prisma.combo.findMany({
      where: { id: { in: ids } }
    });

    for (const c of combos) {
      if (c.bannerImage) {
        deleteUploadedFile(c.bannerImage);
      }
    }

    await prisma.combo.deleteMany({
      where: { id: { in: ids } }
    });

    notifyCombosSync(req, "bulk_delete", { count: ids.length });

    res.json({
      success: true,
      message: `Successfully deleted ${ids.length} combos`
    });
  } catch (error: any) {
    console.error("Bulk delete combos error:", error);
    res.status(500).json({ error: error.message || "Failed to bulk delete combos" });
  }
});

export default router;
