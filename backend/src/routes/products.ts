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

// Master Preloaded Store Categories Hierarchy
export const MASTER_CATEGORIES_DATA = [
  {
    id: "cat-makeup",
    name: "Makeup",
    slug: "makeup",
    subCategories: [
      { id: "sub-mu-1", name: "Face Primer", slug: "face-primer" },
      { id: "sub-mu-2", name: "Foundation", slug: "foundation" },
      { id: "sub-mu-3", name: "Concealer", slug: "concealer" },
      { id: "sub-mu-4", name: "Compact Powder", slug: "compact-powder" },
      { id: "sub-mu-5", name: "Loose Powder & Contour", slug: "loose-powder-contour" },
      { id: "sub-mu-6", name: "Blush & Highlighter", slug: "blush-highlighter" },
      { id: "sub-mu-7", name: "Lipstick", slug: "lipstick" },
      { id: "sub-mu-8", name: "Liquid Lipstick", slug: "liquid-lipstick" },
      { id: "sub-mu-9", name: "Lip Balm & Gloss", slug: "lip-balm-gloss" },
      { id: "sub-mu-10", name: "Kajal & Eyeliner", slug: "kajal-eyeliner" },
      { id: "sub-mu-11", name: "Mascara", slug: "mascara" },
      { id: "sub-mu-12", name: "Eye Shadow", slug: "eye-shadow" },
      { id: "sub-mu-13", name: "Nail Polish", slug: "nail-polish" },
      { id: "sub-mu-14", name: "Makeup Remover", slug: "makeup-remover" },
      { id: "sub-mu-15", name: "Brushes & Tools", slug: "brushes-tools" }
    ]
  },
  {
    id: "cat-skin",
    name: "Skin Care",
    slug: "skincare",
    subCategories: [
      { id: "sub-sk-1", name: "Face Wash", slug: "face-wash" },
      { id: "sub-sk-2", name: "Cleansing Balm & Oil", slug: "cleansing-balm-oil" },
      { id: "sub-sk-3", name: "Face Serum", slug: "face-serum" },
      { id: "sub-sk-4", name: "Face Toner & Mist", slug: "face-toner-mist" },
      { id: "sub-sk-5", name: "Sunscreen", slug: "sunscreen" },
      { id: "sub-sk-6", name: "Day Cream", slug: "day-cream" },
      { id: "sub-sk-7", name: "Night Cream", slug: "night-cream" },
      { id: "sub-sk-8", name: "Body Lotion", slug: "body-lotion" },
      { id: "sub-sk-9", name: "Sheet Mask", slug: "sheet-mask" },
      { id: "sub-sk-10", name: "Acne Treatment", slug: "acne-treatment" },
      { id: "sub-sk-11", name: "Eye Cream", slug: "eye-cream" }
    ]
  },
  {
    id: "cat-hair",
    name: "Hair Care",
    slug: "haircare",
    subCategories: [
      { id: "sub-hr-1", name: "Shampoo", slug: "shampoo" },
      { id: "sub-hr-2", name: "Conditioner", slug: "conditioner" },
      { id: "sub-hr-3", name: "Hair Oil", slug: "hair-oil" },
      { id: "sub-hr-4", name: "Hair Serum", slug: "hair-serum" },
      { id: "sub-hr-5", name: "Hair Mask", slug: "hair-mask" },
      { id: "sub-hr-6", name: "Hair Fall Defense", slug: "hair-fall-defense" },
      { id: "sub-hr-7", name: "Dandruff Solution", slug: "dandruff-solution" }
    ]
  },
  {
    id: "cat-personal",
    name: "Personal Care",
    slug: "personal-care",
    subCategories: [
      { id: "sub-pc-1", name: "Body Wash", slug: "body-wash" },
      { id: "sub-pc-2", name: "Shower Gel", slug: "shower-gel" },
      { id: "sub-pc-3", name: "Deodorant & Roll-on", slug: "deodorant-roll-on" },
      { id: "sub-pc-4", name: "Body Mist", slug: "body-mist" },
      { id: "sub-pc-5", name: "Hand & Foot Care", slug: "hand-foot-care" },
      { id: "sub-pc-6", name: "Feminine Hygiene", slug: "feminine-hygiene" }
    ]
  },
  {
    id: "cat-mom-baby",
    name: "Mom & Baby",
    slug: "mom-baby",
    subCategories: [
      { id: "sub-mb-1", name: "Baby Lotion", slug: "baby-lotion" },
      { id: "sub-mb-2", name: "Baby Wash & Shampoo", slug: "baby-wash-shampoo" },
      { id: "sub-mb-3", name: "Baby Oil", slug: "baby-oil" },
      { id: "sub-mb-4", name: "Diapers & Wipes", slug: "diapers-wipes" },
      { id: "sub-mb-5", name: "Stretch Mark Cream", slug: "stretch-mark-cream" }
    ]
  },
  {
    id: "cat-fragrance",
    name: "Fragrance",
    slug: "fragrance",
    subCategories: [
      { id: "sub-fr-1", name: "Womens Perfume", slug: "womens-perfume" },
      { id: "sub-fr-2", name: "Mens Cologne", slug: "mens-cologne" },
      { id: "sub-fr-3", name: "Body Mist", slug: "body-mist" },
      { id: "sub-fr-4", name: "Attar & Oud", slug: "attar-oud" }
    ]
  },
  {
    id: "cat-undergarments",
    name: "Undergarments",
    slug: "undergarments",
    subCategories: [
      { id: "sub-ug-1", name: "Bras", slug: "bras" },
      { id: "sub-ug-2", name: "Panties", slug: "panties" },
      { id: "sub-ug-3", name: "Shapewear", slug: "shapewear" }
    ]
  },
  {
    id: "cat-combo",
    name: "Combo Deals",
    slug: "combo",
    subCategories: [
      { id: "sub-cb-1", name: "Skin Combos", slug: "skin-combos" },
      { id: "sub-cb-2", name: "Makeup Combos", slug: "makeup-combos" },
      { id: "sub-cb-3", name: "Hair Combos", slug: "hair-combos" }
    ]
  },
  {
    id: "cat-clearance",
    name: "Clearance Sale",
    slug: "clearance-sale",
    subCategories: [
      { id: "sub-cs-1", name: "Makeup Deals", slug: "makeup-deals" },
      { id: "sub-cs-2", name: "Skincare Deals", slug: "skincare-deals" },
      { id: "sub-cs-3", name: "Haircare Deals", slug: "haircare-deals" }
    ]
  }
];

export const MASTER_BRANDS_DATA = [
  { id: "brand-the-ordinary", name: "The Ordinary", slug: "the-ordinary" },
  { id: "brand-cerave", name: "CeraVe", slug: "cerave" },
  { id: "brand-cosrx", name: "COSRX", slug: "cosrx" },
  { id: "brand-beauty-of-joseon", name: "Beauty of Joseon", slug: "beauty-of-joseon" },
  { id: "brand-la-roche-posay", name: "La Roche-Posay", slug: "la-roche-posay" },
  { id: "brand-loreal", name: "L'Oreal Paris", slug: "loreal-paris" },
  { id: "brand-neutrogena", name: "Neutrogena", slug: "neutrogena" },
  { id: "brand-innisfree", name: "Innisfree", slug: "innisfree" },
  { id: "brand-axis-y", name: "AXIS-Y", slug: "axis-y" },
  { id: "brand-some-by-mi", name: "Some By Mi", slug: "some-by-mi" },
  { id: "brand-garnier", name: "Garnier", slug: "garnier" },
  { id: "brand-nivea", name: "Nivea", slug: "nivea" },
  { id: "brand-dove", name: "Dove", slug: "dove" },
  { id: "brand-simple", name: "Simple", slug: "simple" },
  { id: "brand-nirvana", name: "Nirvana Color", slug: "nirvana-color" },
  { id: "brand-mac", name: "MAC", slug: "mac" },
  { id: "brand-maybelline", name: "Maybelline", slug: "maybelline" }
];

export async function resolveCategory(catIdentifier?: string, subIdentifier?: string) {
  if (!catIdentifier && !subIdentifier) {
    return {
      categoryId: "cat-skin",
      subcategoryId: null,
      category: { id: "cat-skin", name: "Skin Care", displayName: "Skin Care", slug: "skincare" },
      subcategory: null
    };
  }

  const target = String(catIdentifier || subIdentifier || "").trim();
  const targetLower = target.toLowerCase();

  // 1. Search in MASTER_CATEGORIES_DATA
  for (const parent of MASTER_CATEGORIES_DATA) {
    // Check if target is this parent
    if (parent.id.toLowerCase() === targetLower || parent.name.toLowerCase() === targetLower || parent.slug.toLowerCase() === targetLower) {
      if (subIdentifier) {
        const subLower = String(subIdentifier).toLowerCase().trim();
        const foundSub = parent.subCategories.find(s => s.id.toLowerCase() === subLower || s.name.toLowerCase() === subLower || s.slug.toLowerCase() === subLower);
        if (foundSub) {
          return {
            categoryId: parent.id,
            subcategoryId: foundSub.id,
            category: {
              id: foundSub.id,
              name: `${parent.name} › ${foundSub.name}`,
              displayName: `${parent.name} › ${foundSub.name}`,
              slug: parent.slug,
              parentId: parent.id,
              parentName: parent.name,
              parent: { id: parent.id, name: parent.name, slug: parent.slug },
              subCategory: foundSub
            },
            subcategory: foundSub
          };
        }
      }
      return {
        categoryId: parent.id,
        subcategoryId: null,
        category: {
          id: parent.id,
          name: parent.name,
          displayName: parent.name,
          slug: parent.slug,
          parentId: null,
          parent: { id: parent.id, name: parent.name, slug: parent.slug }
        },
        subcategory: null
      };
    }

    // Check if target matches one of the subcategories in this parent
    const foundSub = parent.subCategories.find(s =>
      s.id.toLowerCase() === targetLower ||
      s.name.toLowerCase() === targetLower ||
      s.slug.toLowerCase() === targetLower ||
      targetLower.includes(s.name.toLowerCase()) ||
      s.name.toLowerCase().includes(targetLower)
    );
    if (foundSub) {
      return {
        categoryId: parent.id,
        subcategoryId: foundSub.id,
        category: {
          id: foundSub.id,
          name: `${parent.name} › ${foundSub.name}`,
          displayName: `${parent.name} › ${foundSub.name}`,
          slug: parent.slug,
          parentId: parent.id,
          parentName: parent.name,
          parent: { id: parent.id, name: parent.name, slug: parent.slug },
          subCategory: foundSub
        },
        subcategory: foundSub
      };
    }
  }

  // 2. Check Firestore "categories" collection
  try {
    const docRef = db.collection("categories").doc(target);
    const snap = await docRef.get();
    if (snap.exists) {
      const data = snap.data() as any;
      if (data.parentId) {
        const parentDoc = await db.collection("categories").doc(data.parentId).get();
        const parentData = parentDoc.exists ? (parentDoc.data() as any) : null;
        const parentName = parentData?.name || "Category";
        return {
          categoryId: data.parentId,
          subcategoryId: snap.id,
          category: {
            id: snap.id,
            name: `${parentName} › ${data.name}`,
            displayName: `${parentName} › ${data.name}`,
            slug: data.slug || generateSlug(data.name || snap.id),
            parentId: data.parentId,
            parentName,
            parent: parentData ? { id: parentDoc.id, ...parentData } : null,
            subCategory: { id: snap.id, ...data }
          },
          subcategory: { id: snap.id, ...data }
        };
      }
      return {
        categoryId: snap.id,
        subcategoryId: null,
        category: { id: snap.id, ...data, name: data.name || snap.id, slug: data.slug || generateSlug(data.name || snap.id) },
        subcategory: null
      };
    }

    // Query Firestore categories by slug or name
    const allCategoriesSnap = await db.collection("categories").get();
    let foundFirestore: any = null;
    allCategoriesSnap.forEach(d => {
      const dData = d.data() as any;
      if (d.id.toLowerCase() === targetLower || (dData.slug && dData.slug.toLowerCase() === targetLower) || (dData.name && dData.name.toLowerCase() === targetLower)) {
        foundFirestore = { id: d.id, ...dData };
      }
    });
    if (foundFirestore) {
      if (foundFirestore.parentId) {
        const pDoc = await db.collection("categories").doc(foundFirestore.parentId).get();
        const pData = pDoc.exists ? (pDoc.data() as any) : null;
        const pName = pData?.name || "Category";
        return {
          categoryId: foundFirestore.parentId,
          subcategoryId: foundFirestore.id,
          category: {
            id: foundFirestore.id,
            name: `${pName} › ${foundFirestore.name}`,
            displayName: `${pName} › ${foundFirestore.name}`,
            slug: foundFirestore.slug || generateSlug(foundFirestore.name),
            parentId: foundFirestore.parentId,
            parentName: pName,
            parent: pData ? { id: pDoc.id, ...pData } : null,
            subCategory: foundFirestore
          },
          subcategory: foundFirestore
        };
      }
      return {
        categoryId: foundFirestore.id,
        subcategoryId: null,
        category: foundFirestore,
        subcategory: null
      };
    }
  } catch (err) {
    console.warn("Firestore category lookup error:", err);
  }

  // 3. Fallback: Format clean display name
  const cleanName = target.replace(/^cat-|^sub-/, "").replace(/[-_]+/g, " ");
  const formattedName = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
  return {
    categoryId: target,
    subcategoryId: null,
    category: {
      id: target,
      name: formattedName,
      displayName: formattedName,
      slug: generateSlug(formattedName)
    },
    subcategory: null
  };
}

export async function resolveBrand(brandIdentifier?: string) {
  if (!brandIdentifier) {
    return {
      brandId: "brand-cerave",
      brand: { id: "brand-cerave", name: "CeraVe", slug: "cerave" }
    };
  }

  const target = String(brandIdentifier).trim();
  const targetLower = target.toLowerCase();

  // 1. Check MASTER_BRANDS_DATA
  const foundMaster = MASTER_BRANDS_DATA.find(b =>
    b.id.toLowerCase() === targetLower ||
    b.name.toLowerCase() === targetLower ||
    b.slug.toLowerCase() === targetLower
  );
  if (foundMaster) {
    return {
      brandId: foundMaster.id,
      brand: { id: foundMaster.id, name: foundMaster.name, slug: foundMaster.slug }
    };
  }

  // 2. Check Firestore "brands" collection
  try {
    const docRef = db.collection("brands").doc(target);
    const snap = await docRef.get();
    if (snap.exists) {
      const data = snap.data() as any;
      return {
        brandId: snap.id,
        brand: { id: snap.id, ...data, name: data.name || snap.id, slug: data.slug || generateSlug(data.name || snap.id) }
      };
    }

    const allBrandsSnap = await db.collection("brands").get();
    let foundFirestore: any = null;
    allBrandsSnap.forEach(d => {
      const dData = d.data() as any;
      if (d.id.toLowerCase() === targetLower || (dData.slug && dData.slug.toLowerCase() === targetLower) || (dData.name && dData.name.toLowerCase() === targetLower)) {
        foundFirestore = { id: d.id, ...dData };
      }
    });
    if (foundFirestore) {
      return {
        brandId: foundFirestore.id,
        brand: foundFirestore
      };
    }
  } catch (err) {
    console.warn("Firestore brand lookup error:", err);
  }

  // 3. Fallback
  const cleanName = target.replace(/^brand-/, "").replace(/[-_]+/g, " ");
  const formattedName = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
  return {
    brandId: target,
    brand: { id: target, name: formattedName, slug: generateSlug(formattedName) }
  };
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

    let result = parents.map(parent => ({
      ...parent,
      subCategories: subCategories.filter(sub => sub.parentId === parent.id)
    }));

    // If Firestore has no categories or missing master categories, merge with MASTER_CATEGORIES_DATA
    if (result.length === 0) {
      result = MASTER_CATEGORIES_DATA;
    } else {
      MASTER_CATEGORIES_DATA.forEach(mc => {
        if (!result.some(r => r.id === mc.id || r.slug === mc.slug || r.name.toLowerCase() === mc.name.toLowerCase())) {
          result.push(mc);
        }
      });
    }

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

    if (brandsList.length === 0) {
      brandsList = MASTER_BRANDS_DATA;
    } else {
      MASTER_BRANDS_DATA.forEach(mb => {
        if (!brandsList.some(b => b.id === mb.id || b.slug === mb.slug || b.name.toLowerCase() === mb.name.toLowerCase())) {
          brandsList.push(mb);
        }
      });
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

        let finalCat = data.category;
        let finalSubcat = data.subcategory;
        if (!finalCat || !finalCat.name || finalCat.name === "Uncategorized") {
          const autoResolved = MASTER_CATEGORIES_DATA.find(mc => 
            mc.id === data.categoryId || 
            mc.slug === data.categoryId ||
            mc.subCategories.some(sc => sc.id === data.categoryId || sc.id === data.subcategoryId)
          );
          if (autoResolved) {
            const foundSub = autoResolved.subCategories.find(sc => sc.id === data.categoryId || sc.id === data.subcategoryId);
            finalCat = {
              id: foundSub ? foundSub.id : autoResolved.id,
              name: foundSub ? `${autoResolved.name} › ${foundSub.name}` : autoResolved.name,
              displayName: foundSub ? `${autoResolved.name} › ${foundSub.name}` : autoResolved.name,
              slug: autoResolved.slug,
              parent: { id: autoResolved.id, name: autoResolved.name, slug: autoResolved.slug },
              subCategory: foundSub || null
            };
            if (foundSub) finalSubcat = foundSub;
          }
        }

        let finalBrand = data.brand;
        if (!finalBrand || !finalBrand.name) {
          const autoBrand = MASTER_BRANDS_DATA.find(mb => mb.id === data.brandId || mb.slug === data.brandId);
          if (autoBrand) {
            finalBrand = autoBrand;
          }
        }

        productsList.push({
          id: doc.id,
          ...data,
          category: finalCat || data.category,
          subcategory: finalSubcat || data.subcategory,
          brand: finalBrand || data.brand,
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

    if (!productData.category || !productData.category.name || productData.category.name === "Uncategorized") {
      const autoResolved = MASTER_CATEGORIES_DATA.find(mc =>
        mc.id === productData.categoryId ||
        mc.slug === productData.categoryId ||
        mc.subCategories.some(sc => sc.id === productData.categoryId || sc.id === productData.subcategoryId)
      );
      if (autoResolved) {
        const foundSub = autoResolved.subCategories.find(sc => sc.id === productData.categoryId || sc.id === productData.subcategoryId);
        productData.category = {
          id: foundSub ? foundSub.id : autoResolved.id,
          name: foundSub ? `${autoResolved.name} › ${foundSub.name}` : autoResolved.name,
          displayName: foundSub ? `${autoResolved.name} › ${foundSub.name}` : autoResolved.name,
          slug: autoResolved.slug,
          parent: { id: autoResolved.id, name: autoResolved.name, slug: autoResolved.slug },
          subCategory: foundSub || null
        };
        if (foundSub) productData.subcategory = foundSub;
      }
    }
    if (!productData.brand || !productData.brand.name) {
      const autoBrand = MASTER_BRANDS_DATA.find(mb => mb.id === productData.brandId || mb.slug === productData.brandId);
      if (autoBrand) {
        productData.brand = autoBrand;
      }
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
router.post("/products", authenticateJWT as any, requireRole(["SuperAdmin", "Manager", "Admin", "Salesman"]) as any, async (req: Request, res: Response) => {
  try {
    const { name, description, imageUrl, imageUrl2, imageUrl3, imageUrl4, price, discountPrice, costPrice, stock, metaTitle, metaDescription, metaKeywords, campaignName, variants } = req.body;
    let brandId = req.body.brandId;
    let categoryId = req.body.categoryId;
    let subcategoryId = req.body.subcategoryId;
    
    if (!name) {
      return res.status(400).json({ error: "Product name is required" });
    }

    // Resolve Category & Subcategory robustly
    const resolvedCat = await resolveCategory(categoryId, subcategoryId);
    const resolvedBrand = await resolveBrand(brandId);

    const finalCategoryId = resolvedCat.categoryId || categoryId || "cat-skin";
    const finalSubcategoryId = resolvedCat.subcategoryId || subcategoryId || null;
    const categoryJson = resolvedCat.category;
    const subcategoryJson = resolvedCat.subcategory;

    const finalBrandId = resolvedBrand.brandId || brandId || "brand-cerave";
    const brandJson = resolvedBrand.brand;

    const numPrice = price !== undefined && price !== null && !isNaN(Number(price)) ? Number(price) : 0;
    const numCostPrice = costPrice !== undefined && costPrice !== null && !isNaN(Number(costPrice)) ? Number(costPrice) : null;
    const numDiscountPrice = discountPrice !== undefined && discountPrice !== null && !isNaN(Number(discountPrice)) ? Number(discountPrice) : null;
    const numStock = stock !== undefined && stock !== null && !isNaN(Number(stock)) ? Number(stock) : 50;

    let variantCreateList = [];
    if (variants && Array.isArray(variants) && variants.length > 0) {
      variantCreateList = variants.map((v: any, idx: number) => ({
        id: v.id || `var-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 5)}`,
        name: v.name || "Default",
        price: v.price !== undefined && v.price !== null && !isNaN(Number(v.price)) ? parseFloat(v.price) : numPrice,
        discountPrice: v.discountPrice ? parseFloat(v.discountPrice) : numDiscountPrice,
        costPrice: v.costPrice ? parseFloat(v.costPrice) : numCostPrice,
        stock: v.stock !== undefined && v.stock !== null && !isNaN(Number(v.stock)) ? parseInt(v.stock) : numStock,
        shadeColor: v.shadeColor || null,
        sizeValue: v.sizeValue || null,
        imageUrl: v.imageUrl || null,
        sku: v.sku || `SKU-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`
      }));
    } else {
      if (numPrice <= 0 && (!variants || variants.length === 0)) {
        return res.status(400).json({ error: "Price is required when variants are not specified" });
      }
      variantCreateList = [{
        id: `var-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        name: "Default",
        price: numPrice,
        discountPrice: numDiscountPrice,
        costPrice: numCostPrice,
        stock: numStock,
        sku: `SKU-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`
      }];
    }

    const docRef = db.collection("products").doc();
    const cleanSlug = req.body.slug ? generateSlug(req.body.slug) : generateSlug(name);
    const primaryImgUrl = imageUrl || variantCreateList[0]?.imageUrl || "/placeholder-product.svg";
    const product = {
      name,
      slug: cleanSlug,
      description: description || "",
      brandId: finalBrandId,
      brand: brandJson,
      categoryId: finalCategoryId,
      subcategoryId: finalSubcategoryId,
      category: categoryJson,
      subcategory: subcategoryJson,
      price: variantCreateList[0]?.price || numPrice,
      discountPrice: variantCreateList[0]?.discountPrice !== undefined ? variantCreateList[0]?.discountPrice : numDiscountPrice,
      costPrice: variantCreateList[0]?.costPrice !== undefined ? variantCreateList[0]?.costPrice : numCostPrice,
      stock: variantCreateList[0]?.stock !== undefined ? variantCreateList[0]?.stock : numStock,
      imageUrl: primaryImgUrl,
      imageUrl2: imageUrl2 || null,
      imageUrl3: imageUrl3 || null,
      imageUrl4: imageUrl4 || null,
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
        if (imageUrl2) list.push({ id: `img-${Date.now()}-2`, url: imageUrl2, isPrimary: false });
        if (imageUrl3) list.push({ id: `img-${Date.now()}-3`, url: imageUrl3, isPrimary: false });
        if (imageUrl4) list.push({ id: `img-${Date.now()}-4`, url: imageUrl4, isPrimary: false });
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
    try {
      await prisma.product.create({
        data: {
          id: docRef.id,
          name: product.name,
          slug: product.slug,
          description: product.description,
          price: product.price,
          discountPrice: product.discountPrice,
          stock: product.stock,
          imageUrl: product.imageUrl,
          brandId: product.brandId,
          categoryId: product.categoryId,
          status: product.status || "Active"
        }
      }).catch(() => null);
    } catch (_) {}

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
    const { name, description, brandId, categoryId, subcategoryId, imageUrl, imageUrl2, imageUrl3, imageUrl4, price, discountPrice, costPrice, stock, metaTitle, metaDescription, metaKeywords, campaignName, variants } = req.body;

    const productDoc = await db.collection("products").doc(id as string).get();
    if (!productDoc.exists) {
      return res.status(404).json({ error: "Product not found" });
    }

    const currentProduct = productDoc.data() as any;

    let brandJson = currentProduct.brand;
    let finalBrandId = currentProduct.brandId;
    if (brandId !== undefined) {
      const resolvedBrand = await resolveBrand(brandId);
      brandJson = resolvedBrand.brand;
      finalBrandId = resolvedBrand.brandId || brandId;
    }

    let categoryJson = currentProduct.category;
    let subcategoryJson = currentProduct.subcategory;
    let finalCategoryId = currentProduct.categoryId;
    let finalSubcategoryId = currentProduct.subcategoryId;
    if (categoryId !== undefined || subcategoryId !== undefined) {
      const targetCatId = categoryId !== undefined ? categoryId : currentProduct.categoryId;
      const targetSubId = subcategoryId !== undefined ? subcategoryId : currentProduct.subcategoryId;
      const resolvedCat = await resolveCategory(targetCatId, targetSubId);
      categoryJson = resolvedCat.category;
      subcategoryJson = resolvedCat.subcategory;
      finalCategoryId = resolvedCat.categoryId || targetCatId;
      finalSubcategoryId = resolvedCat.subcategoryId || targetSubId || null;
    }

    const numPrice = price !== undefined && price !== null && !isNaN(Number(price)) ? Number(price) : (currentProduct.price || 0);
    const numCostPrice = costPrice !== undefined && costPrice !== null && !isNaN(Number(costPrice)) ? Number(costPrice) : (currentProduct.costPrice || null);
    const numDiscountPrice = discountPrice !== undefined && discountPrice !== null && !isNaN(Number(discountPrice)) ? Number(discountPrice) : (currentProduct.discountPrice || null);
    const numStock = stock !== undefined && stock !== null && !isNaN(Number(stock)) ? Number(stock) : (currentProduct.stock || 50);

    let updatedVariants = currentProduct.variants || [];
    if (variants && Array.isArray(variants)) {
      if (variants.length === 0) {
        updatedVariants = [{
          id: currentProduct.variants?.[0]?.id || `var-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          name: "Default",
          price: numPrice,
          discountPrice: numDiscountPrice,
          costPrice: numCostPrice,
          stock: numStock,
          shadeColor: null,
          sizeValue: null,
          imageUrl: imageUrl || currentProduct.imageUrl || null,
          sku: currentProduct.variants?.[0]?.sku || `SKU-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`
        }];
      } else {
        updatedVariants = variants.map((v: any, idx: number) => ({
          id: v.id || `var-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 5)}`,
          name: v.name || "Default",
          price: (idx === 0 && price !== undefined) ? numPrice : (v.price !== undefined && v.price !== null && !isNaN(Number(v.price)) ? parseFloat(v.price) : numPrice),
          discountPrice: (idx === 0 && discountPrice !== undefined) ? numDiscountPrice : (v.discountPrice ? parseFloat(v.discountPrice) : null),
          costPrice: (idx === 0 && costPrice !== undefined) ? numCostPrice : (v.costPrice ? parseFloat(v.costPrice) : null),
          stock: (idx === 0 && stock !== undefined) ? numStock : (v.stock !== undefined && v.stock !== null && !isNaN(Number(v.stock)) ? parseInt(v.stock) : numStock),
          shadeColor: v.shadeColor || null,
          sizeValue: v.sizeValue || null,
          imageUrl: v.imageUrl || null,
          sku: v.sku || `SKU-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`
        }));
      }
    } else if (price !== undefined || stock !== undefined || costPrice !== undefined || discountPrice !== undefined) {
      if (updatedVariants.length > 0) {
        if (price !== undefined) updatedVariants[0].price = numPrice;
        if (discountPrice !== undefined) updatedVariants[0].discountPrice = numDiscountPrice;
        if (costPrice !== undefined) updatedVariants[0].costPrice = numCostPrice;
        if (stock !== undefined) updatedVariants[0].stock = numStock;
      } else {
        updatedVariants = [{
          id: `var-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          name: "Default",
          price: numPrice,
          discountPrice: numDiscountPrice,
          costPrice: numCostPrice,
          stock: numStock,
          sku: `SKU-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`
        }];
      }
    }

    // Rebuild images
    let updatedImages: any[] = [];
    const primaryUrl = imageUrl !== undefined ? imageUrl : (currentProduct.imageUrl || currentProduct.images?.[0]?.url);
    if (primaryUrl) {
      updatedImages.push({ id: `img-primary-${id}`, url: primaryUrl, isPrimary: true });
    }
    const finalImg2 = imageUrl2 !== undefined ? imageUrl2 : currentProduct.imageUrl2;
    if (finalImg2) updatedImages.push({ id: `img-2-${id}`, url: finalImg2, isPrimary: false });
    const finalImg3 = imageUrl3 !== undefined ? imageUrl3 : currentProduct.imageUrl3;
    if (finalImg3) updatedImages.push({ id: `img-3-${id}`, url: finalImg3, isPrimary: false });
    const finalImg4 = imageUrl4 !== undefined ? imageUrl4 : currentProduct.imageUrl4;
    if (finalImg4) updatedImages.push({ id: `img-4-${id}`, url: finalImg4, isPrimary: false });

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
      brandId: finalBrandId,
      brand: brandJson,
      categoryId: finalCategoryId,
      subcategoryId: finalSubcategoryId,
      category: categoryJson,
      subcategory: subcategoryJson,
      metaTitle: metaTitle !== undefined ? metaTitle : currentProduct.metaTitle,
      metaDescription: metaDescription !== undefined ? metaDescription : currentProduct.metaDescription,
      metaKeywords: metaKeywords !== undefined ? metaKeywords : currentProduct.metaKeywords,
      campaignName: campaignName !== undefined ? campaignName : currentProduct.campaignName,
      status: req.body.status || currentProduct.status || "Active",
      isActive: req.body.isActive !== undefined ? Boolean(req.body.isActive) : (currentProduct.isActive !== undefined ? currentProduct.isActive : true),
      inStock: req.body.inStock !== undefined ? Boolean(req.body.inStock) : (currentProduct.inStock !== undefined ? currentProduct.inStock : true),
      imageUrl: primaryUrl || currentProduct.imageUrl || "/placeholder-product.svg",
      imageUrl2: finalImg2 || null,
      imageUrl3: finalImg3 || null,
      imageUrl4: finalImg4 || null,
      images: updatedImages,
      variants: updatedVariants,
      price: numPrice,
      discountPrice: numDiscountPrice,
      costPrice: numCostPrice,
      stock: numStock,
      updatedAt: new Date().toISOString(),
    };

    await db.collection("products").doc(id as string).set(updatedProduct);

    // Sync with Prisma
    try {
      await prisma.product.upsert({
        where: { id: String(id) },
        create: {
          id: String(id),
          name: updatedProduct.name,
          slug: updatedProduct.slug,
          description: updatedProduct.description,
          price: updatedProduct.price,
          discountPrice: updatedProduct.discountPrice,
          stock: updatedProduct.stock,
          imageUrl: updatedProduct.imageUrl,
          brandId: updatedProduct.brandId,
          categoryId: updatedProduct.categoryId,
          status: updatedProduct.status || "Active"
        },
        update: {
          name: updatedProduct.name,
          slug: updatedProduct.slug,
          description: updatedProduct.description,
          price: updatedProduct.price,
          discountPrice: updatedProduct.discountPrice,
          stock: updatedProduct.stock,
          imageUrl: updatedProduct.imageUrl,
          brandId: updatedProduct.brandId,
          categoryId: updatedProduct.categoryId,
          status: updatedProduct.status || "Active"
        }
      }).catch(() => null);
    } catch (_) {}

    clearProductsCache();
    invalidatePrismaCache("products");
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    emitStorefrontUpdate(req, "products", { action: "update", id });
    res.json({ id, ...updatedProduct });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

router.put("/products/:id", authenticateJWT as any, requireRole(["SuperAdmin", "Manager", "Admin", "Salesman"]) as any, updateProductHandler);
router.patch("/products/:id", authenticateJWT as any, requireRole(["SuperAdmin", "Manager", "Admin", "Salesman"]) as any, updateProductHandler);
router.put("/admin/products/:id", authenticateJWT as any, requireRole(["SuperAdmin", "Manager", "Admin", "Salesman"]) as any, updateProductHandler);
router.patch("/admin/products/:id", authenticateJWT as any, requireRole(["SuperAdmin", "Manager", "Admin", "Salesman"]) as any, updateProductHandler);

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

router.delete("/products/:id", authenticateJWT as any, requireRole(["SuperAdmin", "Manager", "Admin", "Salesman"]) as any, deleteProductHandler);
router.delete("/admin/products/:id", authenticateJWT as any, requireRole(["SuperAdmin", "Manager", "Admin", "Salesman"]) as any, deleteProductHandler);

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
