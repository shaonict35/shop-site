import { emitStorefrontUpdate } from "../utils/socketSync";
import { Request, Response } from "express";
import prisma from "../prisma";
import { deleteUploadedFile } from "../utils/file-cleanup";
import { sendSuccess, sendError } from "../utils/response";

export const VALID_SECTION_KEYS = [
  "DEALS_YOU_CANNOT_MISS",
  "TOP_BRANDS_OFFERS",
  "LIMITED_TIME_OFFERS",
  "SHOP_BY_CATEGORY",
  "SHOP_BY_CONCERN",
] as const;

export type SectionKey = typeof VALID_SECTION_KEYS[number];

// Initial default seeds if table is empty
const DEFAULT_SECTION_ITEMS: Array<{
  sectionKey: SectionKey;
  title: string;
  subtitle: string;
  imageUrl: string;
  linkUrl: string;
  order: number;
}> = [
  // 1. DEALS YOU CANNOT MISS
  {
    sectionKey: "DEALS_YOU_CANNOT_MISS",
    title: "Ombre 30% Off",
    subtitle: "Exclusive Brand Offer",
    imageUrl: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=500&q=80",
    linkUrl: "/shop?deal=ombre",
    order: 0,
  },
  {
    sectionKey: "DEALS_YOU_CANNOT_MISS",
    title: "Serum Flat 25% Off",
    subtitle: "Limited Time Stock",
    imageUrl: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=500&q=80",
    linkUrl: "/shop?deal=serum",
    order: 1,
  },
  {
    sectionKey: "DEALS_YOU_CANNOT_MISS",
    title: "Lipstick Buy 1 Get 1",
    subtitle: "Glamour Collection",
    imageUrl: "https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=500&q=80",
    linkUrl: "/shop?deal=lipstick",
    order: 2,
  },
  {
    sectionKey: "DEALS_YOU_CANNOT_MISS",
    title: "Sunscreen Special",
    subtitle: "SPF 50+ UV Guard",
    imageUrl: "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=500&q=80",
    linkUrl: "/shop?deal=sunscreen",
    order: 3,
  },

  // 2. TOP BRANDS & OFFERS
  {
    sectionKey: "TOP_BRANDS_OFFERS",
    title: "The Ordinary",
    subtitle: "Up to 30% Off",
    imageUrl: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500&q=80",
    linkUrl: "/shop?brand=the-ordinary",
    order: 0,
  },
  {
    sectionKey: "TOP_BRANDS_OFFERS",
    title: "CeraVe",
    subtitle: "Dermatologist Recommended",
    imageUrl: "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=500&q=80",
    linkUrl: "/shop?brand=cerave",
    order: 1,
  },
  {
    sectionKey: "TOP_BRANDS_OFFERS",
    title: "COSRX",
    subtitle: "K-Beauty Best Sellers",
    imageUrl: "https://images.unsplash.com/photo-1608248597359-0a6e70908750?w=500&q=80",
    linkUrl: "/shop?brand=cosrx",
    order: 2,
  },
  {
    sectionKey: "TOP_BRANDS_OFFERS",
    title: "Neutrogena",
    subtitle: "Hydro Boost Range",
    imageUrl: "https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=500&q=80",
    linkUrl: "/shop?brand=neutrogena",
    order: 3,
  },

  // 3. LIMITED TIME OFFERS
  {
    sectionKey: "LIMITED_TIME_OFFERS",
    title: "BOGO Deals",
    subtitle: "Buy 1 Get 1 Free",
    imageUrl: "https://images.unsplash.com/photo-1512290900672-1f5be2fa8e71?w=500&q=80",
    linkUrl: "/shop?campaign=BOGO",
    order: 0,
  },
  {
    sectionKey: "LIMITED_TIME_OFFERS",
    title: "Combo Specials",
    subtitle: "Save up to 40% on Bundles",
    imageUrl: "https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=500&q=80",
    linkUrl: "/shop?campaign=COMBO",
    order: 1,
  },
  {
    sectionKey: "LIMITED_TIME_OFFERS",
    title: "Exclusive Offers",
    subtitle: "Limited Stock Deals",
    imageUrl: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=500&q=80",
    linkUrl: "/shop?campaign=OFFERS",
    order: 2,
  },

  // 4. SHOP BEAUTY PRODUCTS BY CATEGORY
  {
    sectionKey: "SHOP_BY_CATEGORY",
    title: "Makeup",
    subtitle: "Lipsticks, Foundations & More",
    imageUrl: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=500&q=80",
    linkUrl: "/shop?category=makeup",
    order: 0,
  },
  {
    sectionKey: "SHOP_BY_CATEGORY",
    title: "Skin Care",
    subtitle: "Serums, Toners & Creams",
    imageUrl: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500&q=80",
    linkUrl: "/shop?category=skincare",
    order: 1,
  },
  {
    sectionKey: "SHOP_BY_CATEGORY",
    title: "Hair Care",
    subtitle: "Shampoo, Conditioners & Oils",
    imageUrl: "https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=500&q=80",
    linkUrl: "/shop?category=haircare",
    order: 2,
  },
  {
    sectionKey: "SHOP_BY_CATEGORY",
    title: "Personal Care",
    subtitle: "Body Washes & Lotions",
    imageUrl: "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=500&q=80",
    linkUrl: "/shop?category=personal-care",
    order: 3,
  },
  {
    sectionKey: "SHOP_BY_CATEGORY",
    title: "Mom & Baby",
    subtitle: "Gentle Care for Little Ones",
    imageUrl: "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=500&q=80",
    linkUrl: "/shop?category=mom-baby",
    order: 4,
  },
  {
    sectionKey: "SHOP_BY_CATEGORY",
    title: "Fragrance",
    subtitle: "Perfumes & Body Mists",
    imageUrl: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=500&q=80",
    linkUrl: "/shop?category=fragrance",
    order: 5,
  },

  // 5. SHOP BY CONCERN
  {
    sectionKey: "SHOP_BY_CONCERN",
    title: "Acne Treatment",
    subtitle: "Target Blemishes & Breakouts",
    imageUrl: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500&q=80",
    linkUrl: "/shop?category=skincare&sub=Acne%20Treatment",
    order: 0,
  },
  {
    sectionKey: "SHOP_BY_CONCERN",
    title: "Anti Aging",
    subtitle: "Retinol & Peptide Formulations",
    imageUrl: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=500&q=80",
    linkUrl: "/shop?category=skincare&sub=Anti%20Aging",
    order: 1,
  },
  {
    sectionKey: "SHOP_BY_CONCERN",
    title: "Dandruff Solution",
    subtitle: "Scalp Clarifying Treatments",
    imageUrl: "https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=500&q=80",
    linkUrl: "/shop?category=haircare&sub=Dandruff",
    order: 2,
  },
  {
    sectionKey: "SHOP_BY_CONCERN",
    title: "Dry Skin Treatment",
    subtitle: "Hyaluronic Acid Hydration",
    imageUrl: "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=500&q=80",
    linkUrl: "/shop?category=skincare&sub=Dry%20Skin",
    order: 3,
  },
  {
    sectionKey: "SHOP_BY_CONCERN",
    title: "Hair Fall Treatment",
    subtitle: "Strengthen Roots & Scalp",
    imageUrl: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=500&q=80",
    linkUrl: "/shop?category=haircare&sub=Hair%20Fall",
    order: 4,
  },
  {
    sectionKey: "SHOP_BY_CONCERN",
    title: "Oil Control",
    subtitle: "Niacinamide & Salicylic Acid",
    imageUrl: "https://images.unsplash.com/photo-1608248597359-0a6e70908750?w=500&q=80",
    linkUrl: "/shop?category=skincare",
    order: 5,
  },
];

export async function ensureDefaultSectionsSeeded() {
  try {
    const count = await prisma.homepageSectionBanner.count();
    if (count === 0) {
      console.log("🌱 Seeding default Homepage Section Banners...");
      for (const item of DEFAULT_SECTION_ITEMS) {
        await prisma.homepageSectionBanner.create({
          data: {
            sectionKey: item.sectionKey,
            title: item.title,
            subtitle: item.subtitle,
            imageUrl: item.imageUrl,
            linkUrl: item.linkUrl,
            order: item.order,
            isActive: true,
          },
        });
      }
      console.log("✅ Seeded default Homepage Section Banners successfully.");
    }
  } catch (err) {
    console.warn("⚠️ Could not seed default homepage sections:", err);
  }
}

function broadcastSync(req: Request) {
  try {
    emitStorefrontUpdate(req, "homepage_sections", { timestamp: Date.now() });
    const io = (req.app as any)?.get("io");
    if (io) {
      io.emit("homepage_sections:updated", { timestamp: Date.now() });
      io.emit("content_updated", { type: "homepage_sections", timestamp: Date.now() });
    }
  } catch (e) {
    console.warn("Socket broadcast error:", e);
  }
}

/**
 * GET /api/sections
 * Fetches all section items grouped by sectionKey
 */
export async function getAllSections(req: Request, res: Response) {
  try {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");

    const items = await prisma.homepageSectionBanner.findMany({
      orderBy: [{ sectionKey: "asc" }, { order: "asc" }],
    });

    const grouped: Record<string, typeof items> = {
      DEALS_YOU_CANNOT_MISS: [],
      TOP_BRANDS_OFFERS: [],
      LIMITED_TIME_OFFERS: [],
      SHOP_BY_CATEGORY: [],
      SHOP_BY_CONCERN: [],
    };

    items.forEach((item) => {
      if (!grouped[item.sectionKey]) {
        grouped[item.sectionKey] = [];
      }
      grouped[item.sectionKey].push(item);
    });

    return sendSuccess(res, {
      items,
      grouped,
    }, "Homepage sections retrieved successfully");
  } catch (err: any) {
    console.error("Error in getAllSections:", err);
    return sendError(res, "Failed to fetch homepage sections", 500, err);
  }
}

/**
 * GET /api/sections/:sectionKey
 * Fetches items for a specific sectionKey
 */
export async function getSectionByKey(req: Request, res: Response) {
  try {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");

    const { sectionKey } = req.params;
    const keyStr = String(sectionKey || "").toUpperCase();
    const items = await prisma.homepageSectionBanner.findMany({
      where: {
        sectionKey: keyStr,
        isActive: true,
      },
      orderBy: { order: "asc" },
    });

    return sendSuccess(res, items, `Section ${sectionKey} items retrieved successfully`);
  } catch (err: any) {
    console.error(`Error in getSectionByKey (${req.params.sectionKey}):`, err);
    return sendError(res, "Failed to fetch section items", 500, err);
  }
}

/**
 * POST /api/admin/sections
 * Admin creates a new section card
 */
export async function createSectionItem(req: Request, res: Response) {
  try {
    const { sectionKey, title, subtitle, linkUrl, order, isActive } = req.body;

    if (!sectionKey) {
      return sendError(res, "sectionKey is required (e.g. DEALS_YOU_CANNOT_MISS, TOP_BRANDS_OFFERS)", 400);
    }

    let imageUrl = req.body.imageUrl || "";
    if (req.file) {
      imageUrl = `/uploads/sections/${req.file.filename}`;
    }

    if (!imageUrl) {
      return sendError(res, "Image file or imageUrl is required", 400);
    }

    const sortOrder = order !== undefined ? parseInt(String(order), 10) : 0;
    const active = isActive !== undefined ? (String(isActive) === "true" || isActive === true) : true;

    const newItem = await prisma.homepageSectionBanner.create({
      data: {
        sectionKey: String(sectionKey).toUpperCase().trim(),
        title: title ? String(title).trim() : null,
        subtitle: subtitle ? String(subtitle).trim() : null,
        imageUrl: String(imageUrl).trim(),
        linkUrl: linkUrl ? String(linkUrl).trim() : null,
        order: isNaN(sortOrder) ? 0 : sortOrder,
        isActive: active,
      },
    });

    broadcastSync(req);

    return sendSuccess(res, newItem, "Homepage section card created successfully", 201);
  } catch (err: any) {
    console.error("Error creating section item:", err);
    return sendError(res, "Failed to create section card", 500, err);
  }
}

/**
 * PUT /api/admin/sections/:id
 * Admin updates an existing section card
 */
export async function updateSectionItem(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const targetId = String(id);
    const existing = await prisma.homepageSectionBanner.findUnique({
      where: { id: targetId },
    });

    if (!existing) {
      return sendError(res, `Section item with ID ${id} not found`, 404);
    }

    const { sectionKey, title, subtitle, linkUrl, order, isActive } = req.body;
    let imageUrl = existing.imageUrl;

    if (req.file) {
      // Delete old file if it was locally hosted
      deleteUploadedFile(existing.imageUrl);
      imageUrl = `/uploads/sections/${req.file.filename}`;
    } else if (req.body.imageUrl && req.body.imageUrl !== existing.imageUrl) {
      // If replaced with a new URL, clean up old local file
      deleteUploadedFile(existing.imageUrl);
      imageUrl = req.body.imageUrl.trim();
    }

    const updateData: any = {
      imageUrl,
    };

    if (sectionKey) updateData.sectionKey = String(sectionKey).toUpperCase().trim();
    if (title !== undefined) updateData.title = title ? String(title).trim() : null;
    if (subtitle !== undefined) updateData.subtitle = subtitle ? String(subtitle).trim() : null;
    if (linkUrl !== undefined) updateData.linkUrl = linkUrl ? String(linkUrl).trim() : null;
    if (order !== undefined) updateData.order = parseInt(String(order), 10) || 0;
    if (isActive !== undefined) updateData.isActive = String(isActive) === "true" || isActive === true;

    const updated = await prisma.homepageSectionBanner.update({
      where: { id: targetId },
      data: updateData,
    });

    broadcastSync(req);

    return sendSuccess(res, updated, "Homepage section card updated successfully");
  } catch (err: any) {
    console.error(`Error updating section item ${req.params.id}:`, err);
    return sendError(res, "Failed to update section card", 500, err);
  }
}

/**
 * DELETE /api/admin/sections/:id
 * Admin deletes a section card
 */
export async function deleteSectionItem(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const targetId = String(id);
    const existing = await prisma.homepageSectionBanner.findUnique({
      where: { id: targetId },
    });

    if (!existing) {
      return sendError(res, `Section card with ID ${id} not found`, 404);
    }

    // Delete image file safely from disk
    deleteUploadedFile(existing.imageUrl);

    await prisma.homepageSectionBanner.delete({
      where: { id: targetId },
    });

    broadcastSync(req);

    return sendSuccess(res, { id }, "Homepage section card deleted successfully");
  } catch (err: any) {
    console.error(`Error deleting section item ${req.params.id}:`, err);
    return sendError(res, "Failed to delete section card", 500, err);
  }
}

/**
 * POST /api/admin/sections/reorder
 * Admin updates order of section cards in bulk
 */
export async function reorderSectionItems(req: Request, res: Response) {
  try {
    const { items } = req.body;
    if (!Array.isArray(items)) {
      return sendError(res, "items must be an array of { id, order }", 400);
    }

    for (const item of items) {
      if (item.id && typeof item.order === "number") {
        await prisma.homepageSectionBanner.update({
          where: { id: String(item.id) },
          data: { order: item.order },
        });
      }
    }

    broadcastSync(req);

    return sendSuccess(res, { count: items.length }, "Section items reordered successfully");
  } catch (err: any) {
    console.error("Error reordering section items:", err);
    return sendError(res, "Failed to reorder section items", 500, err);
  }
}

/**
 * POST /api/admin/sections/bulk-delete
 * Admin bulk deletes section cards
 */
export async function bulkDeleteSectionItems(req: Request, res: Response) {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return sendError(res, "ids must be a non-empty array of section item IDs", 400);
    }

    let deletedCount = 0;
    for (const rawId of ids) {
      const id = String(rawId);
      try {
        const existing = await prisma.homepageSectionBanner.findUnique({ where: { id } });
        if (existing) {
          deleteUploadedFile(existing.imageUrl);
          await prisma.homepageSectionBanner.delete({ where: { id } });
          deletedCount++;
        }
      } catch (e) {
        console.warn(`Failed to delete section card ${id}:`, e);
      }
    }

    broadcastSync(req);

    return sendSuccess(res, { deletedCount }, `Successfully deleted ${deletedCount} section card(s)`);
  } catch (err: any) {
    console.error("Error bulk deleting section items:", err);
    return sendError(res, "Failed to bulk delete section items", 500, err);
  }
}
