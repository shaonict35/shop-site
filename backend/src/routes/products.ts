import { emitStorefrontUpdate } from "../utils/socketSync";
import { Router, Request, Response } from "express";
import fs from "fs";
import path from "path";
import db, { invalidatePrismaCache } from "../firebase";
import prisma from "../prisma";
import { authenticateJWT, requireRole } from "../middleware/auth";
import { deleteUploadedFile } from "../utils/file-cleanup";
import { uploadCategoryImage, uploadBrandingImage, uploadProductImage } from "../config/multer";

const router = Router();

// Helper to decode Base64 data URIs and save directly to backend/uploads/<subfolder>
function saveBase64Image(dataUri: string, subfolder: string, prefix: string): string {
  if (!dataUri || typeof dataUri !== "string" || !dataUri.startsWith("data:image/")) return dataUri;
  try {
    const matches = dataUri.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) return dataUri;
    const rawExt = matches[1].toLowerCase().replace("jpeg", "jpg").replace("svg+xml", "svg");
    const ext = rawExt.split("+")[0] || "png";
    const buffer = Buffer.from(matches[2], "base64");
    const filename = `${prefix}-${Date.now()}-${Math.round(Math.random() * 1e9)}.${ext}`;
    const targetDir = path.join(process.cwd(), "uploads", subfolder);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    fs.writeFileSync(path.join(targetDir, filename), buffer);
    return `/uploads/${subfolder}/${filename}`;
  } catch (err) {
    console.error(`[saveBase64Image] Failed to decode image for ${subfolder}:`, err);
    return dataUri;
  }
}

// Memory cache for products queries to maximize performance
export const productsCache = new Map<string, { data: any; expiry: number }>();
export const productDetailsCache = new Map<string, { data: any; expiry: number }>();
export const categoriesCache = { data: null as any, expiry: 0 };
export const brandsCache = { data: null as any, expiry: 0 };

export const clearProductsCache = () => {
  productsCache.clear();
  productDetailsCache.clear();
  categoriesCache.data = null;
  brandsCache.data = null;
};
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes fast high-speed cache

export function generateSlug(text: string): string {
  if (!text) return "";
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// GET /api/categories
router.get("/categories", async (req: Request, res: Response) => {
  try {
    const isBypass = req.query.bypass === "true" || req.query.t;
    if (!isBypass && categoriesCache.data && categoriesCache.expiry > Date.now()) {
      return res.json(categoriesCache.data);
    }

    const snapshot = await db.collection("categories").get();
    const categoriesList: any[] = [];
    snapshot.forEach(doc => {
      const data = doc.data() as any;
      categoriesList.push({ 
        id: doc.id, 
        ...data,
        slug: data?.slug || generateSlug(data?.name || doc.id)
      });
    });

    const parents = categoriesList.filter(c => !c.parentId);
    const subCategories = categoriesList.filter(c => c.parentId);

    const result = parents.map(parent => ({
      ...parent,
      subCategories: subCategories.filter(sub => sub.parentId === parent.id)
    }));

    if (!isBypass) {
      categoriesCache.data = result;
      categoriesCache.expiry = Date.now() + CACHE_DURATION_MS;
    }
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/categories/upload-image (Admin only)
const handleCategoryUpload = (req: any, res: any) => {
  if (!req.file) return res.status(400).json({ error: "No image file provided" });
  const url = `/uploads/categories/${req.file.filename}`;
  res.json({ success: true, url, filename: req.file.filename });
};
router.post("/categories/upload-image", authenticateJWT as any, requireRole(["SuperAdmin", "Manager", "Admin"]) as any, uploadCategoryImage.single("image"), handleCategoryUpload);
router.post("/admin/categories/upload-image", authenticateJWT as any, requireRole(["SuperAdmin", "Manager", "Admin"]) as any, uploadCategoryImage.single("image"), handleCategoryUpload);

// POST /api/categories (Admin only - Create/Update category or subcategory)
router.post("/categories", authenticateJWT as any, requireRole(["SuperAdmin", "Manager", "Admin"]) as any, async (req: any, res: any) => {
  try {
    const { id, name, parentId, imageUrl } = req.body || {};
    if (!name) {
      return res.status(400).json({ error: "Category name is required" });
    }
    const docId = id || db.collection("categories").doc().id;
    const docRef = db.collection("categories").doc(docId);
    const existingSnap = await docRef.get();
    const existing = existingSnap.exists ? existingSnap.data() : {};

    const cleanSlug = generateSlug(name);
    // Convert base64 to file on disk if needed
    let finalImageUrl = imageUrl ? saveBase64Image(imageUrl, "categories", "cat") : (existing.imageUrl || "");
    if (existing.imageUrl && finalImageUrl && existing.imageUrl !== finalImageUrl) {
      deleteUploadedFile(existing.imageUrl);
    }

    const data = {
      id: docId,
      name,
      slug: cleanSlug,
      parentId: parentId || null,
      imageUrl: finalImageUrl,
      updatedAt: new Date().toISOString()
    };
    await docRef.set(data, { merge: true });

    // Sync permanently with Prisma
    try {
      await prisma.category.upsert({
        where: { id: docId },
        create: { id: docId, name, imageUrl: finalImageUrl || null, parentId: data.parentId },
        update: { name, imageUrl: finalImageUrl || null, parentId: data.parentId }
      }).catch(async () => {
        await prisma.category.update({ where: { name }, data: { imageUrl: finalImageUrl || null, parentId: data.parentId } }).catch(() => null);
      });
    } catch (_) {}

    categoriesCache.data = null;
    try {
      const io = (req.app as any)?.get("io");
      if (io) {
        io.emit("content_updated", { type: "categories", id: docId });
        io.emit("data_sync", { type: "categories", id: docId });
      }
    } catch (_) {}
    emitStorefrontUpdate(req, "categories", { action: "create", id: docId });
    res.json({ message: "Category saved successfully", category: data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/categories/:id (Admin only - Update category)
router.put("/categories/:id", authenticateJWT as any, requireRole(["SuperAdmin", "Manager", "Admin"]) as any, async (req: any, res: any) => {
  try {
    const { name, parentId, imageUrl } = req.body || {};
    const docId = req.params.id;
    const docRef = db.collection("categories").doc(docId);
    const existingSnap = await docRef.get();
    const existing = existingSnap.exists ? existingSnap.data() : {};
    const cleanName = name || existing.name;

    let finalImageUrl = imageUrl !== undefined ? (imageUrl ? saveBase64Image(imageUrl, "categories", "cat") : "") : (existing.imageUrl || "");
    if (existing.imageUrl && finalImageUrl && existing.imageUrl !== finalImageUrl) {
      deleteUploadedFile(existing.imageUrl);
    }

    const data = {
      ...existing,
      id: docId,
      name: cleanName,
      slug: cleanName ? generateSlug(cleanName) : existing.slug,
      parentId: parentId !== undefined ? parentId : (existing.parentId || null),
      imageUrl: finalImageUrl,
      updatedAt: new Date().toISOString()
    };
    await docRef.set(data, { merge: true });

    // Sync permanently with Prisma
    try {
      await prisma.category.upsert({
        where: { id: docId },
        create: { id: docId, name: cleanName, imageUrl: finalImageUrl || null, parentId: data.parentId },
        update: { name: cleanName, imageUrl: finalImageUrl || null, parentId: data.parentId }
      }).catch(async () => {
        await prisma.category.update({ where: { name: cleanName }, data: { imageUrl: finalImageUrl || null, parentId: data.parentId } }).catch(() => null);
      });
    } catch (_) {}

    categoriesCache.data = null;
    try {
      const io = (req.app as any)?.get("io");
      if (io) {
        io.emit("content_updated", { type: "categories", id: docId });
        io.emit("data_sync", { type: "categories", id: docId });
      }
    } catch (_) {}
    emitStorefrontUpdate(req, "categories", { action: "update", id: docId });
    res.json({ message: "Category updated successfully", category: data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/categories/:id (Admin only)
router.delete("/categories/:id", authenticateJWT as any, requireRole(["SuperAdmin", "Manager", "Admin"]) as any, async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const snap = await db.collection("categories").doc(id).get().catch(() => null);
    if (snap && snap.exists) {
      deleteUploadedFile(snap.data()?.imageUrl);
    }
    await db.collection("categories").doc(id).delete();
    try {
      await prisma.category.delete({ where: { id } }).catch(() => null);
    } catch (_) {}
    categoriesCache.data = null;
    try {
      const io = (req.app as any)?.get("io");
      if (io) {
        io.emit("content_updated", { type: "categories", id });
        io.emit("data_sync", { type: "categories", id });
      }
    } catch (_) {}
    emitStorefrontUpdate(req, "categories", { action: "delete", id });
    res.json({ message: "Category deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/categories/bulk-delete (Admin only)
const bulkDeleteCategoriesHandler = async (req: any, res: any) => {
  try {
    const { ids } = req.body || {};
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, error: "Please provide an array of category IDs to delete" });
    }

    let count = 0;
    for (const id of ids) {
      try {
        const snap = await db.collection("categories").doc(id).get().catch(() => null);
        if (snap && snap.exists) {
          deleteUploadedFile(snap.data()?.imageUrl);
        }
        await db.collection("categories").doc(id).delete().catch(() => null);
        try {
          await prisma.category.delete({ where: { id } }).catch(() => null);
        } catch (_) {}
        count++;
      } catch (e) {
        console.warn(`Failed to delete category ${id}:`, e);
      }
    }

    categoriesCache.data = null;
    try {
      const io = (req.app as any)?.get("io");
      if (io) {
        io.emit("content_updated", { type: "categories", action: "bulk-delete", count });
        io.emit("data_sync", { type: "categories", action: "bulk-delete", count });
      }
    } catch (_) {}

    res.json({ success: true, message: `Successfully deleted ${count} category(ies)`, count });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

router.post("/categories/bulk-delete", authenticateJWT as any, requireRole(["SuperAdmin", "Manager", "Admin"]) as any, bulkDeleteCategoriesHandler);
router.post("/admin/categories/bulk-delete", authenticateJWT as any, requireRole(["SuperAdmin", "Manager", "Admin"]) as any, bulkDeleteCategoriesHandler);

// GET /api/brands
router.get("/brands", async (req: Request, res: Response) => {
  try {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");

    const isBypass = req.query.bypass === "true" || req.query.t;
    if (!isBypass && brandsCache.data && brandsCache.expiry > Date.now()) {
      return res.json(brandsCache.data);
    }

    const snapshot = await db.collection("brands").get();
    let brandsList: any[] = [];
    snapshot.forEach(doc => {
      const bData = doc.data() as any;
      brandsList.push({ 
        id: doc.id, 
        ...bData,
        slug: bData?.slug || generateSlug(bData?.name || doc.id)
      });
    });

    // Fallback to SQLite Prisma brands if Firestore mock is empty
    if (brandsList.length === 0) {
      try {
        const prismaBrands = await prisma.brand.findMany({ orderBy: { name: "asc" } });
        brandsList = prismaBrands.map(b => ({
          id: b.id,
          name: b.name,
          slug: generateSlug(b.name),
          logoUrl: b.logoUrl || "/placeholder-product.svg",
          originCountry: "International",
          isTopBrand: b.isTopBrand
        }));
      } catch (_) {}
    }

    if (!isBypass) {
      brandsCache.data = brandsList;
      brandsCache.expiry = Date.now() + CACHE_DURATION_MS;
    }
    res.json(brandsList);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/brands/upload-image (Admin only)
const handleBrandUpload = (req: any, res: any) => {
  if (!req.file) return res.status(400).json({ error: "No image file provided" });
  const url = `/uploads/branding/${req.file.filename}`;
  res.json({ success: true, url, filename: req.file.filename });
};
router.post("/brands/upload-image", authenticateJWT as any, requireRole(["SuperAdmin", "Manager", "Admin"]) as any, uploadBrandingImage.single("image"), handleBrandUpload);
router.post("/admin/brands/upload-image", authenticateJWT as any, requireRole(["SuperAdmin", "Manager", "Admin"]) as any, uploadBrandingImage.single("image"), handleBrandUpload);

// POST /api/brands (Admin only - Add/Update Brand)
router.post("/brands", authenticateJWT as any, requireRole(["SuperAdmin", "Manager", "Admin"]) as any, async (req: any, res: any) => {
  try {
    const { id, name, logoUrl, originCountry } = req.body || {};
    if (!name) return res.status(400).json({ error: "Brand name is required" });
    const cleanSlug = generateSlug(name);
    const docId = id || cleanSlug;
    const docRef = db.collection("brands").doc(docId);
    const existingDoc = await docRef.get();
    const existingData = existingDoc.exists ? existingDoc.data() : {};

    let finalLogoUrl = logoUrl ? saveBase64Image(logoUrl, "branding", "brand") : (existingData?.logoUrl || "/placeholder-product.svg");
    if (existingData?.logoUrl && finalLogoUrl && existingData.logoUrl !== finalLogoUrl && !existingData.logoUrl.includes("placeholder")) {
      deleteUploadedFile(existingData.logoUrl);
    }
    
    const data = {
      ...existingData,
      id: docId,
      name,
      slug: cleanSlug,
      originCountry: originCountry !== undefined ? originCountry : (existingData?.originCountry || "International"),
      logoUrl: finalLogoUrl,
      updatedAt: new Date().toISOString()
    };
    await docRef.set(data, { merge: true });

    // Sync permanently with Prisma
    try {
      await prisma.brand.upsert({
        where: { id: docId },
        create: { id: docId, name, slug: cleanSlug, logoUrl: finalLogoUrl, originCountry: data.originCountry },
        update: { name, slug: cleanSlug, logoUrl: finalLogoUrl, originCountry: data.originCountry }
      }).catch(async () => {
        await prisma.brand.update({ where: { name }, data: { logoUrl: finalLogoUrl, originCountry: data.originCountry } }).catch(() => null);
      });
    } catch (_) {}

    brandsCache.data = null;
    invalidatePrismaCache("brands");
    emitStorefrontUpdate(req, "brands", { id: docId });
    res.json({ message: "Brand saved successfully", brand: data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/brands/:id (Admin only)
router.delete("/brands/:id", authenticateJWT as any, requireRole(["SuperAdmin", "Manager", "Admin"]) as any, async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const snap = await db.collection("brands").doc(id).get().catch(() => null);
    if (snap && snap.exists) {
      deleteUploadedFile(snap.data()?.logoUrl);
    }
    await db.collection("brands").doc(id).delete();
    try {
      await prisma.brand.delete({ where: { id } }).catch(() => null);
    } catch (_) {}
    brandsCache.data = null;
    invalidatePrismaCache("brands");
    emitStorefrontUpdate(req, "brands", { action: "delete", id });
    res.json({ message: "Brand deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/brands/bulk-delete (Admin only)
const bulkDeleteBrandsHandler = async (req: any, res: any) => {
  try {
    const { ids } = req.body || {};
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, error: "Please provide an array of brand IDs to delete" });
    }

    let count = 0;
    for (const id of ids) {
      try {
        const snap = await db.collection("brands").doc(id).get().catch(() => null);
        if (snap && snap.exists) {
          deleteUploadedFile(snap.data()?.logoUrl);
        }
        await db.collection("brands").doc(id).delete().catch(() => null);
        try {
          await prisma.brand.delete({ where: { id } }).catch(() => null);
        } catch (_) {}
        count++;
      } catch (e) {
        console.warn(`Failed to delete brand ${id}:`, e);
      }
    }

    brandsCache.data = null;
    invalidatePrismaCache("brands");

    try {
      const io = (req.app as any)?.get("io");
      if (io) {
        io.emit("content_updated", { type: "brands", action: "bulk-delete", count });
        io.emit("data_sync", { type: "brands", action: "bulk-delete", count });
      }
    } catch (_) {}

    res.json({ success: true, message: `Successfully deleted ${count} brand(s)`, count });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

router.post("/brands/bulk-delete", authenticateJWT as any, requireRole(["SuperAdmin", "Manager", "Admin"]) as any, bulkDeleteBrandsHandler);
router.post("/admin/brands/bulk-delete", authenticateJWT as any, requireRole(["SuperAdmin", "Manager", "Admin"]) as any, bulkDeleteBrandsHandler);

function resolveFullUrl(req: Request, url?: string | null): string {
  if (!url || typeof url !== "string") return "/placeholder-product.svg";
  const clean = url.trim();
  if (clean.startsWith("http://") || clean.startsWith("https://") || clean.startsWith("data:")) return clean;
  const pathPart = clean.startsWith("/") ? clean : `/${clean}`;
  const host = req.get("host") || "localhost:5000";
  const proto = req.protocol === "https" || req.get("x-forwarded-proto") === "https" ? "https" : "http";
  return `${proto}://${host}${pathPart}`;
}

// GET /api/products and /api/admin/products
const getProductsHandler = async (req: Request, res: Response) => {
  try {
    const isBypass = req.query.bypass === "true" || req.query.t !== undefined || req.headers["cache-control"]?.includes("no-cache") || req.path.includes("/admin");
    const cacheKey = JSON.stringify(req.query);
    if (!isBypass) {
      const cached = productsCache.get(cacheKey);
      if (cached && cached.expiry > Date.now()) {
        res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
        return res.json(cached.data);
      }
    }

    const { category, categoryName, brand, campaign, search, minPrice, maxPrice, sort, ids, all, includeAll, limit, page } = req.query;

    const snapshot = await db.collection("products").get();
    let productsList: any[] = [];
    const showAll = all === "true" || includeAll === "true";

    snapshot.forEach((doc: any) => {
      const data = doc.data();
      const statusLower = (data.status || "").toLowerCase();
      // If showAll is true, include everything. Otherwise include all products except explicitly deleted/archived
      if (showAll || !data.status || (statusLower !== "deleted" && statusLower !== "archived")) {
        const primaryVar = data.variants?.[0];
        const primaryImg = data.imageUrl || data.images?.find((i: any) => i.isPrimary)?.url || data.images?.[0]?.url || "/placeholder-product.svg";
        const resolvedMainImg = resolveFullUrl(req, primaryImg);
        const resolvedImages = (data.images && data.images.length > 0)
          ? data.images.map((im: any) => ({ ...im, url: resolveFullUrl(req, im.url) }))
          : [{ id: `img-${doc.id}`, url: resolvedMainImg, isPrimary: true }];
        const resolvedVariants = (data.variants && data.variants.length > 0)
          ? data.variants.map((v: any) => ({ ...v, imageUrl: v.imageUrl ? resolveFullUrl(req, v.imageUrl) : resolvedMainImg }))
          : [];
        const stockVal = data.stock !== undefined ? Number(data.stock) : (resolvedVariants.reduce((sum: number, v: any) => sum + (v.stock || 0), 0) || 50);

        productsList.push({
          id: doc.id,
          ...data,
          status: data.status || "Active",
          isActive: data.isActive !== undefined ? Boolean(data.isActive) : (statusLower === "active" || !data.status),
          inStock: data.inStock !== undefined ? Boolean(data.inStock) : (stockVal > 0),
          price: data.price !== undefined ? Number(data.price) : (primaryVar ? Number(primaryVar.price) : 0),
          discountPrice: data.discountPrice !== undefined ? data.discountPrice : (primaryVar?.discountPrice ?? null),
          stock: stockVal,
          imageUrl: resolvedMainImg,
          images: resolvedImages,
          variants: resolvedVariants
        });
      }
    });

    // Merge active Combos from Prisma so they appear on /shop and categories
    try {
      const combos = await prisma.combo.findMany({
        where: showAll ? {} : { isActive: true },
        include: {
          items: true
        }
      });

      combos.forEach(c => {
        const mainImg = c.bannerImage || "/placeholder-product.svg";
        const resolvedImg = resolveFullUrl(req, mainImg);
        productsList.push({
          id: c.id,
          name: c.title,
          slug: c.slug,
          description: c.description || "",
          isCombo: true,
          comboItems: c.items,
          price: c.regularPrice || c.comboPrice,
          discountPrice: c.comboPrice < c.regularPrice ? c.comboPrice : null,
          stock: 50,
          inStock: true,
          status: "Active",
          isActive: c.isActive,
          imageUrl: resolvedImg,
          images: [{ id: `combo-${c.id}`, url: resolvedImg, isPrimary: true }],
          variants: [{
            id: `var-combo-${c.id}`,
            name: "Combo Set",
            price: c.regularPrice || c.comboPrice,
            discountPrice: c.comboPrice < c.regularPrice ? c.comboPrice : null,
            stock: 50
          }],
          brand: { name: "GlowGoodly Combos", slug: "glowgoodly-combos" },
          categoryId: c.categoryId || "cat-combo",
          subcategoryId: c.subcategoryId,
          category: { id: c.categoryId || "cat-combo", name: "Combo Deals" }
        });
      });
    } catch (e) {
      console.warn("Failed to merge combos in getProductsHandler:", e);
    }

    // Support fast query by ID list (e.g. for Wishlist)
    if (ids) {
      const idList = (ids as string).split(",").map(i => i.trim());
      const filteredByIds = productsList.filter(p => idList.includes(p.id));
      productsCache.set(cacheKey, { data: filteredByIds, expiry: Date.now() + CACHE_DURATION_MS });
      return res.json(filteredByIds);
    }

    // 1. Filter by category (direct or parent)
    if (category) {
      const catId = category as string;
      productsList = productsList.filter(p => p.categoryId === catId || p.category?.parentId === catId);
    } else if (categoryName) {
      const catStr = (categoryName as string).toLowerCase();
      const searchTerms = [catStr];
      if (catStr === "skincare" || catStr === "skin") searchTerms.push("skincare", "skin");
      if (catStr === "haircare" || catStr === "hair") searchTerms.push("haircare", "hair");

      productsList = productsList.filter(p => {
        const cName = p.category?.name?.toLowerCase() || "";
        const pName = p.category?.parent?.name?.toLowerCase() || "";
        return searchTerms.some(term => cName.includes(term) || pName.includes(term));
      });
    }

    // 2. Filter by brand (support ID, slug, and name)
    if (brand) {
      let brandKeys: string[] = [];
      if (typeof brand === "string") {
        brandKeys = brand.includes(",") ? brand.split(",").map(b => b.trim().toLowerCase()) : [brand.trim().toLowerCase()];
      } else if (Array.isArray(brand)) {
        brandKeys = (brand as string[]).map(b => b.trim().toLowerCase());
      }
      productsList = productsList.filter(p => {
        const bId = (p.brandId || "").toLowerCase();
        const bSlug = (p.brand?.slug || generateSlug(p.brand?.name || "")).toLowerCase();
        const bName = (p.brand?.name || "").toLowerCase();
        return brandKeys.some(k => 
          bId === k || 
          bSlug === k || 
          bName === k || 
          generateSlug(k) === bSlug
        );
      });
    }

    // 3. Filter by campaign
    if (campaign) {
      productsList = productsList.filter(p => p.campaignName === campaign);
    }

    // 4. Filter by search
    if (search) {
      const q = (search as string).toLowerCase();
      productsList = productsList.filter(p => 
        p.name.toLowerCase().includes(q) || 
        (p.description && p.description.toLowerCase().includes(q))
      );
    }

    // 5. Filter by price bounds (minPrice / maxPrice)
    if (minPrice || maxPrice) {
      const min = minPrice ? parseFloat(minPrice as string) : 0;
      const max = maxPrice ? parseFloat(maxPrice as string) : Infinity;
      productsList = productsList.filter(p => {
        return p.variants && p.variants.some((v: any) => v.price >= min && v.price <= max);
      });
    }

    // 6. Sort
    if (sort === "price_asc") {
      productsList.sort((a, b) => (a.variants?.[0]?.price || 0) - (b.variants?.[0]?.price || 0));
    } else if (sort === "price_desc") {
      productsList.sort((a, b) => (b.variants?.[0]?.price || 0) - (a.variants?.[0]?.price || 0));
    } else if (sort === "newest") {
      productsList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else {
      productsList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    // Strip heavy description/ingredients/howToUse fields for super lightweight list response (35x smaller payload)
    const optimizedList = productsList.map(p => {
      const slug = p.slug || generateSlug(p.name || p.id);
      const { description, ingredients, howToUse, metaDescription, metaKeywords, ...rest } = p;
      return { ...rest, slug };
    });

    const totalCount = optimizedList.length;
    const limitNum = limit ? parseInt(limit as string, 10) : undefined;
    const pageNum = parseInt(page as string, 10) || 1;

    let resultList = optimizedList;
    if (limitNum && limitNum > 0) {
      const startIndex = (pageNum - 1) * limitNum;
      resultList = optimizedList.slice(startIndex, startIndex + limitNum);
    }

    res.setHeader("X-Total-Count", totalCount.toString());
    res.setHeader("X-Page", pageNum.toString());
    if (limitNum) res.setHeader("X-Limit", limitNum.toString());

    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.json(resultList);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

router.get("/products", getProductsHandler);
router.get("/admin/products", getProductsHandler);

// GET /api/products/:id
router.get("/products/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const prodId = String(id);
    if (!prodId || prodId === "default" || prodId === "undefined") {
      return res.status(400).json({ error: "Invalid product id" });
    }

    const isBypass = req.query.bypass === "true" || req.query.t || req.headers["cache-control"] === "no-cache";
    if (!isBypass) {
      const cached = productDetailsCache.get(prodId);
      if (cached && cached.expiry > Date.now()) {
        return res.json(cached.data);
      }
    }

    let doc = await db.collection("products").doc(prodId).get();
    let productData: any = null;

    if (doc.exists) {
      const d = doc.data() as any;
      productData = { id: doc.id, ...d, slug: d?.slug || generateSlug(d?.name || doc.id) };
    } else {
      // Fast lookup: check productsCache first if available, else query products
      const cacheAll = productsCache.get(JSON.stringify({ includeAll: "true" })) || productsCache.get(JSON.stringify({}));
      let allList: any[] = [];
      if (cacheAll && cacheAll.data) {
        allList = cacheAll.data;
      } else {
        const snap = await db.collection("products").get();
        snap.forEach(d => {
          const dData = d.data() as any;
          allList.push({ id: d.id, ...dData, slug: dData?.slug || generateSlug(dData?.name || d.id) });
        });
      }

      const cleanTarget = decodeURIComponent(prodId).toLowerCase().trim();
      const targetSlug = generateSlug(cleanTarget);

      const found = allList.find(p => 
        p.id === prodId || 
        (p.slug && p.slug.toLowerCase() === cleanTarget) ||
        (p.slug && p.slug.toLowerCase() === targetSlug) ||
        (p.name && generateSlug(p.name) === targetSlug)
      );

      if (found) {
        productData = { ...found, slug: found.slug || generateSlug(found.name || found.id) };
      }
    }

    if (!productData) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Fetch approved reviews safely without requiring Firestore composite index
    let reviews: any[] = [];
    try {
      const reviewsSnapshot = await db.collection("reviews")
        .where("productId", "==", productData.id)
        .get();
        
      reviewsSnapshot.forEach(rDoc => {
        const rData = rDoc.data();
        if (rData && (rData.isApproved === true || rData.isApproved === "true" || rData.isApproved === undefined)) {
          reviews.push({ id: rDoc.id, ...rData });
        }
      });
      reviews.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    } catch (e) {
      console.warn("Could not fetch reviews for product", id, e);
    }
    productData.reviews = reviews;

    // Get related products safely
    let relatedProducts: any[] = [];
    try {
      if (productData.categoryId) {
        const allProductsSnap = await db.collection("products").limit(30).get();
        allProductsSnap.forEach(rDoc => {
          if (rDoc.id !== productData.id && relatedProducts.length < 8) {
            const pData = rDoc.data() as any;
            if (pData.categoryId === productData.categoryId) {
              relatedProducts.push({ 
                id: rDoc.id, 
                ...pData,
                slug: pData?.slug || generateSlug(pData?.name || rDoc.id)
              });
            }
          }
        });
      }
    } catch (e) {
      console.warn("Could not fetch related products for category", productData.categoryId, e);
    }

    const payload = { product: productData, relatedProducts };

    if (!isBypass) {
      const expiry = Date.now() + CACHE_DURATION_MS;
      productDetailsCache.set(prodId, { data: payload, expiry });
      if (productData.id) {
        productDetailsCache.set(productData.id, { data: payload, expiry });
      }
      if (productData.slug) {
        productDetailsCache.set(productData.slug, { data: payload, expiry });
      }
    }

    res.json(payload);
  } catch (error: any) {
    console.error("Error in GET /products/:id", error);
    res.status(500).json({ error: error.message || "Failed to fetch product" });
  }
});

// POST /api/products/:id/reviews
router.post("/products/:id/reviews", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const prodId = String(id);
    const { customerName, rating, comment } = req.body;

    if (!customerName || !rating || !comment) {
      return res.status(400).json({ error: "Customer name, rating, and comment are required" });
    }

    let targetProductId = prodId;
    const productDoc = await db.collection("products").doc(prodId).get();
    if (!productDoc.exists) {
      const snap = await db.collection("products").get();
      let found = false;
      snap.forEach(d => {
        const dData = d.data() as any;
        const dSlug = dData?.slug || generateSlug(dData?.name || d.id);
        if (d.id === prodId || dData?.id === prodId || dSlug === prodId || generateSlug(d.id) === prodId) {
          targetProductId = d.id;
          found = true;
        }
      });
      if (!found) {
        return res.status(404).json({ error: "Product not found" });
      }
    }

    const reviewRef = db.collection("reviews").doc();
    const review = {
      productId: targetProductId,
      customerName,
      rating: parseInt(rating),
      comment,
      isApproved: false, // Pending admin approval
      createdAt: new Date().toISOString(),
    };

    await reviewRef.set(review);
    productDetailsCache.delete(targetProductId);
    productDetailsCache.delete(prodId);

    res.status(201).json({
      message: "Review submitted successfully and is pending approval.",
      review: { id: reviewRef.id, ...review },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/products (Admin only - Create product)
router.post("/products", authenticateJWT as any, requireRole(["SuperAdmin", "Manager", "Admin"]) as any, async (req: Request, res: Response) => {
  try {
    const { name, description, imageUrl, price, discountPrice, costPrice, stock, metaTitle, metaDescription, metaKeywords, campaignName, variants } = req.body;
    let brandId = req.body.brandId;
    let categoryId = req.body.categoryId;
    
    if (!name) {
      return res.status(400).json({ error: "Product name is required" });
    }

    if (!brandId) {
      const brandSnapshot = await db.collection("brands").limit(1).get();
      if (!brandSnapshot.empty) {
        brandId = brandSnapshot.docs[0].id;
      }
    }
    if (!categoryId) {
      const catSnapshot = await db.collection("categories").limit(1).get();
      if (!catSnapshot.empty) {
        categoryId = catSnapshot.docs[0].id;
      }
    }

    let variantCreateList = [];
    if (variants && Array.isArray(variants) && variants.length > 0) {
      variantCreateList = variants.map((v: any) => ({
        id: v.id || `var-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        name: v.name || "Default",
        price: parseFloat(v.price),
        discountPrice: v.discountPrice ? parseFloat(v.discountPrice) : null,
        costPrice: v.costPrice ? parseFloat(v.costPrice) : null,
        stock: parseInt(v.stock) || 0,
        shadeColor: v.shadeColor || null,
        sizeValue: v.sizeValue || null,
        imageUrl: v.imageUrl || null,
        sku: v.sku || `SKU-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`
      }));
    } else {
      if (!price) {
        return res.status(400).json({ error: "Price is required when variants are not specified" });
      }
      variantCreateList = [{
        id: `var-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        name: "Default",
        price: parseFloat(price),
        discountPrice: discountPrice ? parseFloat(discountPrice) : null,
        costPrice: costPrice ? parseFloat(costPrice) : null,
        stock: parseInt(stock) || 50,
        sku: `SKU-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`
      }];
    }

    // Fetch category and brand denormalized info
    const categoryDoc = await db.collection("categories").doc(categoryId).get();
    const brandDoc = await db.collection("brands").doc(brandId).get();

    const categoryJson = categoryDoc.exists ? { id: categoryDoc.id, ...categoryDoc.data() } : null;
    const brandJson = brandDoc.exists ? { id: brandDoc.id, ...brandDoc.data() } : null;

    const docRef = db.collection("products").doc();
    const cleanSlug = req.body.slug ? generateSlug(req.body.slug) : generateSlug(name);
    const primaryImgUrl = imageUrl || variantCreateList[0]?.imageUrl || "/placeholder-product.svg";
    const product = {
      name,
      slug: cleanSlug,
      description: description || "",
      brandId,
      brand: brandJson,
      categoryId,
      category: categoryJson,
      price: variantCreateList[0]?.price || (price ? parseFloat(price) : 0),
      discountPrice: variantCreateList[0]?.discountPrice !== undefined ? variantCreateList[0]?.discountPrice : (discountPrice ? parseFloat(discountPrice) : null),
      costPrice: variantCreateList[0]?.costPrice !== undefined ? variantCreateList[0]?.costPrice : (costPrice ? parseFloat(costPrice) : null),
      stock: variantCreateList[0]?.stock !== undefined ? variantCreateList[0]?.stock : (stock ? parseInt(stock) : 50),
      imageUrl: primaryImgUrl,
      status: "Active",
      isActive: true,
      inStock: true,
      metaTitle: metaTitle || null,
      metaDescription: metaDescription || null,
      metaKeywords: metaKeywords || null,
      campaignName: campaignName || null,
      images: (() => {
        const list: any[] = [];
        if (imageUrl) list.push({ id: `img-${Date.now()}-1`, url: imageUrl, isPrimary: true });
        if (req.body.imageUrl2) list.push({ id: `img-${Date.now()}-2`, url: req.body.imageUrl2, isPrimary: false });
        if (req.body.imageUrl3) list.push({ id: `img-${Date.now()}-3`, url: req.body.imageUrl3, isPrimary: false });
        if (req.body.imageUrl4) list.push({ id: `img-${Date.now()}-4`, url: req.body.imageUrl4, isPrimary: false });
        if (Array.isArray(req.body.images)) {
          req.body.images.forEach((img: any, idx: number) => {
            const url = typeof img === "string" ? img : img?.url;
            if (url && !list.some(item => item.url === url)) {
              list.push({ id: `img-extra-${Date.now()}-${idx}`, url, isPrimary: list.length === 0 });
            }
          });
        }
        variantCreateList.forEach((v: any) => {
          if (v.imageUrl && !list.some(img => img.url === v.imageUrl)) {
            list.push({ id: `img-var-${v.id}`, url: v.imageUrl, isPrimary: list.length === 0 });
          }
        });
        if (list.length === 0) {
          list.push({ id: `img-${Date.now()}`, url: "/placeholder-product.svg", isPrimary: true });
        }
        return list;
      })(),
      variants: variantCreateList,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await docRef.set(product);
    clearProductsCache();
    invalidatePrismaCache("products");
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    emitStorefrontUpdate(req, "products", { action: "create", id: docRef.id });
    res.status(201).json({ id: docRef.id, ...product });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT & PATCH /api/products/:id & /api/admin/products/:id (Admin only - Update product)
const updateProductHandler = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, brandId, categoryId, imageUrl, price, discountPrice, costPrice, stock, metaTitle, metaDescription, metaKeywords, campaignName, variants } = req.body;

    const productDoc = await db.collection("products").doc(id as string).get();
    if (!productDoc.exists) {
      return res.status(404).json({ error: "Product not found" });
    }

    const currentProduct = productDoc.data() as any;

    let brandJson = currentProduct.brand;
    if (brandId && brandId !== currentProduct.brandId) {
      const brandDoc = await db.collection("brands").doc(brandId).get();
      brandJson = brandDoc.exists ? { id: brandDoc.id, ...brandDoc.data() } : null;
    }

    let categoryJson = currentProduct.category;
    if (categoryId && categoryId !== currentProduct.categoryId) {
      const categoryDoc = await db.collection("categories").doc(categoryId).get();
      categoryJson = categoryDoc.exists ? { id: categoryDoc.id, ...categoryDoc.data() } : null;
    }

    let updatedVariants = currentProduct.variants || [];
    if (variants && Array.isArray(variants)) {
      if (variants.length === 0) {
        updatedVariants = [{
          id: currentProduct.variants?.[0]?.id || `var-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          name: "Default",
          price: price !== undefined ? parseFloat(price) : (currentProduct.price || 0),
          discountPrice: discountPrice !== undefined ? (discountPrice ? parseFloat(discountPrice) : null) : (currentProduct.discountPrice || null),
          costPrice: costPrice !== undefined ? (costPrice ? parseFloat(costPrice) : null) : (currentProduct.costPrice || null),
          stock: stock !== undefined ? parseInt(stock) : (currentProduct.stock || 50),
          shadeColor: null,
          sizeValue: null,
          imageUrl: imageUrl || currentProduct.imageUrl || null,
          sku: currentProduct.variants?.[0]?.sku || `SKU-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`
        }];
      } else {
        updatedVariants = variants.map((v: any) => ({
          id: v.id || `var-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          name: v.name || "Default",
          price: v.price !== undefined ? parseFloat(v.price) : 0,
          discountPrice: v.discountPrice ? parseFloat(v.discountPrice) : null,
          costPrice: v.costPrice ? parseFloat(v.costPrice) : null,
          stock: v.stock !== undefined ? parseInt(v.stock) : 50,
          shadeColor: v.shadeColor || null,
          sizeValue: v.sizeValue || null,
          imageUrl: v.imageUrl || null,
          sku: v.sku || `SKU-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`
        }));
      }
    } else if (price) {
      if (updatedVariants.length > 0) {
        updatedVariants[0].price = parseFloat(price);
        updatedVariants[0].discountPrice = discountPrice ? parseFloat(discountPrice) : null;
        updatedVariants[0].costPrice = costPrice ? parseFloat(costPrice) : null;
        updatedVariants[0].stock = stock !== undefined ? parseInt(stock) : updatedVariants[0].stock;
      }
    }

    // Rebuild images strictly from Main Cover URL + active remaining variants' images
    let updatedImages: any[] = [];
    const primaryUrl = imageUrl || currentProduct.imageUrl || currentProduct.images?.find((i: any) => i.isPrimary)?.url || currentProduct.images?.[0]?.url;
    if (primaryUrl) {
      updatedImages.push({ id: `img-primary-${id}`, url: primaryUrl, isPrimary: true });
    }
    updatedVariants.forEach((v: any, idx: number) => {
      if (v.imageUrl && v.imageUrl.trim() !== "" && !updatedImages.some(img => img.url === v.imageUrl)) {
        updatedImages.push({ id: `img-var-${v.id || idx}`, url: v.imageUrl, isPrimary: false });
      }
    });
    if (updatedImages.length === 0 && currentProduct.images?.length > 0) {
      updatedImages = currentProduct.images;
    }

    const cleanSlug = req.body.slug 
      ? generateSlug(req.body.slug) 
      : (name ? generateSlug(name) : (currentProduct.slug || generateSlug(currentProduct.name || id)));

    const updatedProduct = {
      ...currentProduct,
      name: name !== undefined ? name : currentProduct.name,
      slug: cleanSlug,
      description: description !== undefined ? description : currentProduct.description,
      brandId: brandId !== undefined ? brandId : currentProduct.brandId,
      brand: brandJson,
      categoryId: categoryId !== undefined ? categoryId : currentProduct.categoryId,
      category: categoryJson,
      metaTitle: metaTitle !== undefined ? metaTitle : currentProduct.metaTitle,
      metaDescription: metaDescription !== undefined ? metaDescription : currentProduct.metaDescription,
      metaKeywords: metaKeywords !== undefined ? metaKeywords : currentProduct.metaKeywords,
      campaignName: campaignName !== undefined ? campaignName : currentProduct.campaignName,
      status: req.body.status || currentProduct.status || "Active",
      isActive: req.body.isActive !== undefined ? Boolean(req.body.isActive) : true,
      inStock: req.body.inStock !== undefined ? Boolean(req.body.inStock) : true,
      images: updatedImages,
      variants: updatedVariants,
      price: updatedVariants[0]?.price || 0,
      discountPrice: updatedVariants[0]?.discountPrice || null,
      stock: updatedVariants[0]?.stock || 0,
      updatedAt: new Date().toISOString(),
    };

    await db.collection("products").doc(id as string).set(updatedProduct);
    clearProductsCache();
    invalidatePrismaCache("products");
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    emitStorefrontUpdate(req, "products", { action: "update", id });
    res.json({ id, ...updatedProduct });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

router.put("/products/:id", authenticateJWT as any, requireRole(["SuperAdmin", "Manager", "Admin"]) as any, updateProductHandler);
router.patch("/products/:id", authenticateJWT as any, requireRole(["SuperAdmin", "Manager", "Admin"]) as any, updateProductHandler);
router.put("/admin/products/:id", authenticateJWT as any, requireRole(["SuperAdmin", "Manager", "Admin"]) as any, updateProductHandler);
router.patch("/admin/products/:id", authenticateJWT as any, requireRole(["SuperAdmin", "Manager", "Admin"]) as any, updateProductHandler);

// DELETE /api/products/:id & /api/admin/products/:id (Admin only - Delete product & clean uploaded images)
const deleteProductHandler = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const docRef = db.collection("products").doc(id as string);
    const doc = await docRef.get();
    if (!doc.exists) {
      return res.status(404).json({ error: "Product not found" });
    }

    const prodData = (doc.data && doc.data()) || {};

    // 1. Collect all uploaded image URLs for physical file cleanup
    const imagesToClean: string[] = [];
    if (prodData.imageUrl) imagesToClean.push(prodData.imageUrl);
    if (prodData.image) imagesToClean.push(prodData.image);
    if (Array.isArray(prodData.images)) {
      prodData.images.forEach((img: any) => {
        if (typeof img === "string") imagesToClean.push(img);
        else if (img?.url) imagesToClean.push(img.url);
      });
    }
    if (Array.isArray(prodData.variants)) {
      prodData.variants.forEach((v: any) => {
        if (v.imageUrl) imagesToClean.push(v.imageUrl);
      });
    }

    // 2. Safely delete image files from backend/uploads
    imagesToClean.forEach((imgUrl) => {
      try {
        if (typeof imgUrl === "string" && imgUrl.includes("/uploads/")) {
          const filename = path.basename(imgUrl.split("?")[0]);
          const possibleUploadPaths = [
            path.join(__dirname, "..", "..", "uploads", filename),
            path.join(process.cwd(), "uploads", filename),
            path.join(process.cwd(), "backend", "uploads", filename),
            path.join(process.cwd(), "frontend", "public", "uploads", filename)
          ];
          for (const uploadPath of possibleUploadPaths) {
            if (fs.existsSync(uploadPath)) {
              fs.unlinkSync(uploadPath);
              break;
            }
          }
        }
      } catch (cleanErr) {
        console.warn(`[Product Image Cleanup] Could not delete file: ${imgUrl}`, cleanErr);
      }
    });

    // 3. Delete from database & cascade relations
    try {
      await prisma.review.deleteMany({ where: { productId: id as string } });
    } catch (e) {}
    try {
      await prisma.variant.deleteMany({ where: { productId: id as string } });
    } catch (e) {}
    try {
      await prisma.productImage.deleteMany({ where: { productId: id as string } });
    } catch (e) {}
    try {
      await prisma.product.deleteMany({ where: { id: id as string } });
    } catch (e) {}

    await docRef.delete();
    clearProductsCache();
    invalidatePrismaCache("products");
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    emitStorefrontUpdate(req, "products", { action: "delete", id });
    res.json({ message: "Product deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

router.delete("/products/:id", authenticateJWT as any, requireRole(["SuperAdmin", "Manager", "Admin"]) as any, deleteProductHandler);
router.delete("/admin/products/:id", authenticateJWT as any, requireRole(["SuperAdmin", "Manager", "Admin"]) as any, deleteProductHandler);

// POST /api/products/bulk-delete (Admin only)
const bulkDeleteProductsHandler = async (req: Request, res: Response) => {
  try {
    const { ids } = req.body || {};
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, error: "Please provide an array of product IDs to delete" });
    }

    let count = 0;
    for (const rawId of ids) {
      const id = String(rawId);
      try {
        const docRef = db.collection("products").doc(id);
        const doc = await docRef.get().catch(() => null);
        let prodData: any = doc && doc.exists ? doc.data() : null;

        if (!prodData) {
          try {
            const p = await prisma.product.findUnique({
              where: { id },
              include: { images: true, variants: true }
            });
            if (p) prodData = p;
          } catch (_) {}
        }

        if (prodData) {
          // Cleanup disk images
          const imagesToClean: string[] = [];
          if (prodData.imageUrl) imagesToClean.push(prodData.imageUrl);
          if (prodData.image) imagesToClean.push(prodData.image);
          if (Array.isArray(prodData.images)) {
            prodData.images.forEach((img: any) => {
              if (typeof img === "string") imagesToClean.push(img);
              else if (img?.url) imagesToClean.push(img.url);
            });
          }
          if (Array.isArray(prodData.variants)) {
            prodData.variants.forEach((v: any) => {
              if (v.imageUrl) imagesToClean.push(v.imageUrl);
            });
          }
          imagesToClean.forEach((imgUrl) => deleteUploadedFile(imgUrl));
        }

        // Delete Prisma cascades
        await prisma.review.deleteMany({ where: { productId: id } }).catch(() => null);
        await prisma.variant.deleteMany({ where: { productId: id } }).catch(() => null);
        await prisma.productImage.deleteMany({ where: { productId: id } }).catch(() => null);
        await prisma.product.deleteMany({ where: { id } }).catch(() => null);
        await docRef.delete().catch(() => null);

        count++;
      } catch (errItem) {
        console.warn(`Failed to delete product ${id}:`, errItem);
      }
    }

    clearProductsCache();
    invalidatePrismaCache("products");

    try {
      const io = (req.app as any)?.get("io");
      if (io) {
        io.emit("content_updated", { type: "products", action: "bulk-delete", count });
        io.emit("data_sync", { type: "products", action: "bulk-delete", count });
      }
    } catch (_) {}

    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.json({ success: true, message: `Successfully deleted ${count} product(s)`, count });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || "Failed to bulk delete products" });
  }
};

router.post("/products/bulk-delete", authenticateJWT as any, requireRole(["SuperAdmin", "Manager", "Admin"]) as any, bulkDeleteProductsHandler);
router.post("/admin/products/bulk-delete", authenticateJWT as any, requireRole(["SuperAdmin", "Manager", "Admin"]) as any, bulkDeleteProductsHandler);

export default router;
