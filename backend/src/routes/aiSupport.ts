import { Router, Request, Response } from "express";
import db from "../firebase";
import prisma from "../prisma";

const router = Router();

// In-Memory Rate Limiter for AI Support endpoints: Max 120 requests/min per IP
const aiRateLimits = new Map<string, { count: number; resetTime: number }>();
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of aiRateLimits.entries()) {
    if (now > entry.resetTime) aiRateLimits.delete(ip);
  }
}, 5 * 60 * 1000);

function aiSupportRateLimiter(req: Request, res: Response, next: Function) {
  const ip = (typeof req.headers["x-forwarded-for"] === "string" ? req.headers["x-forwarded-for"].split(",")[0].trim() : req.ip) || "unknown";
  const now = Date.now();
  const windowMs = 60 * 1000;
  const max = 120;

  const entry = aiRateLimits.get(ip) || { count: 0, resetTime: now + windowMs };
  if (now > entry.resetTime) {
    entry.count = 1;
    entry.resetTime = now + windowMs;
  } else {
    entry.count += 1;
  }
  aiRateLimits.set(ip, entry);

  if (entry.count > max) {
    return res.status(429).json({
      error: "Too Many Requests",
      message: "AI support rate limit exceeded. Please wait a moment before sending another query."
    });
  }
  next();
}

function generateSlug(text: string): string {
  if (!text) return "";
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function formatProductForAi(p: any): any {
  const slug = p.slug || generateSlug(p.name || p.id);
  const regularPrice = Number(p.price || p.variants?.[0]?.price || 0);
  const discountPrice = p.discountPrice !== undefined && p.discountPrice !== null ? Number(p.discountPrice) : (p.variants?.[0]?.discountPrice ? Number(p.variants[0].discountPrice) : null);
  const hasDiscount = Boolean(discountPrice && discountPrice > 0 && discountPrice < regularPrice);
  const discountPercentage = hasDiscount ? Math.round(((regularPrice - (discountPrice as number)) / regularPrice) * 100) : 0;
  
  const stockQuantity = Number(p.stock !== undefined ? p.stock : (p.variants?.[0]?.stock ?? 50));
  const inStock = stockQuantity > 0;

  // Filter and sanitize variants (CRITICAL: exclude costPrice)
  const variants = Array.isArray(p.variants)
    ? p.variants.map((v: any) => {
        const vRegPrice = Number(v.price || regularPrice);
        const vDiscPrice = v.discountPrice !== undefined && v.discountPrice !== null ? Number(v.discountPrice) : null;
        const vStock = Number(v.stock !== undefined ? v.stock : 50);
        return {
          id: v.id,
          name: v.name || "Default",
          price: vRegPrice,
          discountPrice: vDiscPrice,
          inStock: vStock > 0,
          stock: vStock,
          shadeColor: v.shadeColor || null,
          sizeValue: v.sizeValue || null,
          sku: v.sku || null,
          imageUrl: v.imageUrl || null
        };
      })
    : [];

  const mainImageUrl = p.imageUrl || p.images?.find((i: any) => i.isPrimary)?.url || p.images?.[0]?.url || "/placeholder-product.svg";

  return {
    id: p.id,
    name: p.name,
    slug,
    brand: p.brand ? { id: p.brand.id || p.brandId, name: p.brand.name, slug: p.brand.slug || generateSlug(p.brand.name) } : null,
    category: p.category ? { id: p.category.id || p.categoryId, name: p.category.name, slug: p.category.slug || generateSlug(p.category.name) } : null,
    sellingPrice: regularPrice,
    discountPrice,
    hasDiscount,
    discountPercentage,
    inStock,
    stockQuantity,
    description: (p.description || "").replace(/<[^>]*>?/gm, "").trim(),
    shortDescription: (p.shortDescription || p.description || "").replace(/<[^>]*>?/gm, "").slice(0, 200).trim(),
    specifications: {
      volume: p.volume || null,
      skinType: p.skinType || null,
      countryOfOrigin: p.countryOfOrigin || null,
      benefits: p.benefits || null
    },
    ingredients: p.ingredients || null,
    howToUse: p.howToUse || null,
    variants,
    imageUrl: mainImageUrl,
    productUrl: `https://shop.glowgoodly.com/product/${slug}`
  };
}

/**
 * GET /api/ai-support/products
 * Read-only list of active products for Tawk.to AI Assist
 */
router.get("/ai-support/products", aiSupportRateLimiter as any, async (req: Request, res: Response) => {
  try {
    const { limit, page, category, brand } = req.query;
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string, 10) || 20));
    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);

    const snapshot = await db.collection("products").get();
    let list: any[] = [];

    snapshot.forEach(doc => {
      const data = doc.data() as any;
      const statusLower = (data.status || "").toLowerCase();
      // Exclude deleted, archived, or draft products
      if (statusLower === "active" || !data.status) {
        list.push({ id: doc.id, ...data });
      }
    });

    if (category && typeof category === "string") {
      const catClean = category.trim().toLowerCase();
      list = list.filter(p => 
        (p.categoryId && p.categoryId.toLowerCase().includes(catClean)) ||
        (p.category?.name && p.category.name.toLowerCase().includes(catClean)) ||
        (p.category?.slug && p.category.slug.toLowerCase().includes(catClean))
      );
    }

    if (brand && typeof brand === "string") {
      const brandClean = brand.trim().toLowerCase();
      list = list.filter(p => 
        (p.brandId && p.brandId.toLowerCase().includes(brandClean)) ||
        (p.brand?.name && p.brand.name.toLowerCase().includes(brandClean)) ||
        (p.brand?.slug && p.brand.slug.toLowerCase().includes(brandClean))
      );
    }

    const totalCount = list.length;
    const startIndex = (pageNum - 1) * limitNum;
    const paginated = list.slice(startIndex, startIndex + limitNum);

    const formatted = paginated.map(formatProductForAi);

    res.setHeader("X-Total-Count", totalCount.toString());
    res.setHeader("X-Page", pageNum.toString());
    res.setHeader("X-Limit", limitNum.toString());
    res.setHeader("Cache-Control", "public, max-age=60, s-maxage=60");

    res.json({
      success: true,
      total: totalCount,
      page: pageNum,
      limit: limitNum,
      products: formatted
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || "Failed to retrieve AI support products" });
  }
});

/**
 * GET /api/ai-support/search?q=keyword
 * Full-text keyword search across active products
 */
router.get("/ai-support/search", aiSupportRateLimiter as any, async (req: Request, res: Response) => {
  try {
    const rawQ = req.query.q;
    if (!rawQ || typeof rawQ !== "string" || !rawQ.trim()) {
      return res.status(400).json({ success: false, error: "Search query 'q' parameter is required and cannot be empty." });
    }

    const q = rawQ.trim().toLowerCase().slice(0, 100);
    const limit = Math.min(30, Math.max(1, parseInt(req.query.limit as string, 10) || 10));

    const snapshot = await db.collection("products").get();
    let matches: any[] = [];

    snapshot.forEach(doc => {
      const data = doc.data() as any;
      const statusLower = (data.status || "").toLowerCase();
      if (statusLower === "active" || !data.status) {
        const name = (data.name || "").toLowerCase();
        const brand = (data.brand?.name || data.brandId || "").toLowerCase();
        const category = (data.category?.name || data.categoryId || "").toLowerCase();
        const skinType = (data.skinType || "").toLowerCase();
        const description = (data.description || "").toLowerCase();
        const ingredients = (data.ingredients || "").toLowerCase();

        if (
          name.includes(q) ||
          brand.includes(q) ||
          category.includes(q) ||
          skinType.includes(q) ||
          description.includes(q) ||
          ingredients.includes(q)
        ) {
          matches.push({ id: doc.id, ...data });
        }
      }
    });

    const formatted = matches.slice(0, limit).map(formatProductForAi);

    res.setHeader("Cache-Control", "public, max-age=30, s-maxage=30");
    res.json({
      success: true,
      query: q,
      count: formatted.length,
      results: formatted
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || "Search failed" });
  }
});

/**
 * GET /api/ai-support/products/:id
 * Retrieve exact product details by ID or slug
 */
router.get("/ai-support/products/:id", aiSupportRateLimiter as any, async (req: Request, res: Response) => {
  try {
    const rawId = req.params.id;
    if (!rawId || typeof rawId !== "string" || !rawId.trim()) {
      return res.status(400).json({ success: false, error: "Valid product ID or slug is required" });
    }

    const cleanTarget = decodeURIComponent(rawId).trim().toLowerCase();
    const targetSlug = generateSlug(cleanTarget);

    const doc = await db.collection("products").doc(rawId).get();
    let foundProduct: any = null;

    if (doc.exists) {
      const d = doc.data() as any;
      const statusLower = (d.status || "").toLowerCase();
      if (statusLower === "active" || !d.status) {
        foundProduct = { id: doc.id, ...d };
      }
    } else {
      // Lookup by slug or name in active collection
      const snap = await db.collection("products").get();
      snap.forEach(d => {
        if (foundProduct) return;
        const dData = d.data() as any;
        const statusLower = (dData.status || "").toLowerCase();
        if (statusLower === "active" || !dData.status) {
          const itemSlug = (dData.slug || generateSlug(dData.name || d.id)).toLowerCase();
          const itemNameSlug = generateSlug(dData.name || "");
          if (
            d.id.toLowerCase() === cleanTarget ||
            itemSlug === cleanTarget ||
            itemSlug === targetSlug ||
            itemNameSlug === targetSlug
          ) {
            foundProduct = { id: d.id, ...dData };
          }
        }
      });
    }

    if (!foundProduct) {
      return res.status(404).json({
        success: false,
        error: "Product not found or currently inactive",
        query: rawId
      });
    }

    const formatted = formatProductForAi(foundProduct);
    res.setHeader("Cache-Control", "public, max-age=60, s-maxage=60");
    res.json({
      success: true,
      product: formatted
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || "Failed to retrieve product details" });
  }
});

export default router;
