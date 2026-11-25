import { emitStorefrontUpdate } from "../utils/socketSync";
import { Router, Request, Response } from "express";
import prisma from "../prisma";
import { pool, isPlaceholderConfig } from "../config/db";
import { clearProductsCache } from "./products";
import { authenticateJWT, requireRole } from "../middleware/auth";

const router = Router();

/**
 * Record Sale in Inventory Logs (Called when orders are placed)
 */
export async function recordInventorySale(
  items: Array<{ productId?: string; variantId?: string; quantity: number; productName?: string }>,
  orderNumber: string,
  options?: { skipPrismaStockUpdate?: boolean }
) {
  try {
    for (const item of items) {
      const qty = Math.max(1, Number(item.quantity) || 1);
      const note = `Order #${orderNumber} Sale`;

      // 1. Prisma / SQLite record & stock deduction (Skip if already performed inside atomic transaction)
      if (item.variantId && !options?.skipPrismaStockUpdate) {
        await prisma.inventoryLog.create({
          data: {
            variantId: item.variantId,
            quantity: -qty,
            reason: `Sale (${note})`
          }
        }).catch(() => { });

        await prisma.variant.update({
          where: { id: item.variantId },
          data: { stock: { decrement: qty } }
        }).catch(() => { });
      }

      // 2. Remote MySQL record (if configured & active)
      if (!isPlaceholderConfig && item.productId) {
        try {
          // Deduct stock in MySQL products table
          await pool.query(
            "UPDATE products SET stock_quantity = GREATEST(0, stock_quantity - ?) WHERE id = ? OR sku = ?",
            [qty, item.productId, item.productId]
          );

          // Insert 'sale' into inventory_logs table
          const logId = "log-" + Date.now() + "-" + Math.floor(Math.random() * 1000);
          await pool.query(
            "INSERT INTO inventory_logs (id, product_id, change_type, quantity_changed, note) VALUES (?, ?, 'sale', ?, ?)",
            [logId, item.productId, -qty, note]
          );
        } catch (mySqlErr: any) {
          console.warn("[MySQL Inventory Sale Log]", mySqlErr.message);
        }
      }
    }
  } catch (err: any) {
    console.error("Error recording inventory sale log:", err.message);
  }
}

/**
 * GET /api/inventory/status
 * Overview of all product inventory, stock levels, and alert indicators
 */
router.get("/status", async (req: Request, res: Response) => {
  try {
    // 1. Check if remote MySQL is active and has data
    if (!isPlaceholderConfig) {
      try {
        const [rows] = await pool.query(
          "SELECT id, name, sku, price, stock_quantity, low_stock_threshold, image_url, status FROM products ORDER BY stock_quantity ASC"
        );
        const mySqlProducts = rows as any[];
        if (mySqlProducts.length > 0) {
          const items = mySqlProducts.map(p => ({
            id: p.id,
            name: p.name,
            sku: p.sku || `SKU-${p.id.slice(0, 8)}`,
            price: Number(p.price) || 0,
            stock: Number(p.stock_quantity) || 0,
            lowStockThreshold: Number(p.low_stock_threshold) || 5,
            imageUrl: p.image_url || "/placeholder-product.svg",
            status: Number(p.stock_quantity) === 0 ? "Out of Stock" : Number(p.stock_quantity) <= Number(p.low_stock_threshold || 5) ? "Low Stock" : "In Stock"
          }));

          const lowStockCount = items.filter(i => i.stock > 0 && i.stock <= i.lowStockThreshold).length;
          const outOfStockCount = items.filter(i => i.stock === 0).length;

          return res.json({
            source: "mysql",
            totalItems: items.length,
            lowStockCount,
            outOfStockCount,
            items
          });
        }
      } catch (e: any) {
        console.warn("[MySQL Inventory Status Fallback]", e.message);
      }
    }

    // 2. Primary / Local Prisma inventory query
    const products = await prisma.product.findMany({
      include: {
        variants: true,
        images: true,
        brand: true,
        category: true
      }
    });

    const items = products.flatMap(p => {
      const primaryImg = p.images?.find(i => i.isPrimary)?.url || p.images?.[0]?.url || "/placeholder-product.svg";
      if (p.variants && p.variants.length > 0) {
        return p.variants.map(v => ({
          id: p.id,
          variantId: v.id,
          name: `${p.name} (${v.name})`,
          sku: v.sku || `SKU-${v.id.slice(0, 8)}`,
          price: v.discountPrice || v.price,
          costPrice: v.costPrice || 0,
          stock: v.stock,
          lowStockThreshold: 5,
          imageUrl: v.imageUrl || primaryImg,
          brand: p.brand?.name,
          category: p.category?.name,
          note: p.note || "",
          status: v.stock === 0 ? "Out of Stock" : v.stock <= 5 ? "Low Stock" : "In Stock"
        }));
      }
      return [{
        id: p.id,
        variantId: null,
        name: p.name,
        sku: `SKU-${p.id.slice(0, 8)}`,
        price: 0,
        costPrice: 0,
        stock: 0,
        lowStockThreshold: 5,
        imageUrl: primaryImg,
        brand: p.brand?.name,
        category: p.category?.name,
        note: p.note || "",
        status: "Out of Stock"
      }];
    });

    const lowStockCount = items.filter(i => i.stock > 0 && i.stock <= i.lowStockThreshold).length;
    const outOfStockCount = items.filter(i => i.stock === 0).length;

    res.json({
      source: "prisma",
      totalItems: items.length,
      lowStockCount,
      outOfStockCount,
      items
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/inventory/low-stock
 * Items needing restock (stock <= threshold)
 */
router.get("/low-stock", async (req: Request, res: Response) => {
  try {
    const threshold = parseInt((req.query.threshold as string) || "5", 10);

    if (!isPlaceholderConfig) {
      try {
        const [rows] = await pool.query(
          "SELECT * FROM products WHERE stock_quantity <= ? ORDER BY stock_quantity ASC",
          [threshold]
        );
        return res.json({ lowStockItems: rows });
      } catch (e) { }
    }

    const variants = await prisma.variant.findMany({
      where: { stock: { lte: threshold } },
      include: {
        product: { include: { brand: true, category: true, images: true } }
      },
      orderBy: { stock: "asc" }
    });

    const lowStockItems = variants.map(v => ({
      productId: v.productId,
      variantId: v.id,
      name: `${v.product.name} (${v.name})`,
      sku: v.sku,
      currentStock: v.stock,
      threshold,
      price: v.discountPrice || v.price,
      imageUrl: v.imageUrl || v.product.images?.[0]?.url || "/placeholder-product.svg"
    }));

    res.json({ count: lowStockItems.length, lowStockItems });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/inventory/logs
 * Inventory adjustment & restock audit history
 */
router.get(["/logs", "/admin/logs"], async (req: Request, res: Response) => {
  try {
    const limit = parseInt((req.query.limit as string) || "50", 10);

    // MySQL logs if active
    if (!isPlaceholderConfig) {
      try {
        const [rows] = await pool.query(
          `SELECT l.*, p.name as product_name, p.sku 
           FROM inventory_logs l 
           LEFT JOIN products p ON l.product_id = p.id 
           ORDER BY l.created_at DESC LIMIT ?`,
          [limit]
        );
        if (Array.isArray(rows) && rows.length > 0) {
          return res.json({ source: "mysql", logs: rows });
        }
      } catch (e) { }
    }

    // Prisma logs
    const logs = await prisma.inventoryLog.findMany({
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        variant: {
          include: { product: true }
        }
      }
    });

    const formatted = logs.map(l => ({
      id: l.id,
      productId: l.variant?.productId,
      productName: l.variant ? `${l.variant.product.name} (${l.variant.name})` : "Product Item",
      changeType: l.quantity > 0 ? "restock" : l.reason.toLowerCase(),
      quantityChanged: l.quantity,
      reason: l.reason,
      note: l.note || l.reason,
      createdAt: l.createdAt
    }));

    res.json({ source: "prisma", logs: formatted });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/inventory/restock
 * Admin: Manually restock product or adjust stock
 */
router.post("/restock", authenticateJWT as any, requireRole(["SuperAdmin", "Admin", "Manager"]) as any, async (req: Request, res: Response) => {
  try {
    const { productId, variantId, quantity, note, changeType = "restock" } = req.body;

    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty <= 0) {
      return res.status(400).json({ error: "Please enter a valid positive quantity to restock" });
    }

    const restockNote = note || `Manual ${changeType} via Admin Panel`;
    let updatedStock = 0;

    // 1. Update Prisma / SQLite
    if (variantId) {
      const variant = await prisma.variant.update({
        where: { id: variantId },
        data: { stock: { increment: qty } }
      });
      updatedStock = variant.stock;

      await prisma.inventoryLog.create({
        data: {
          variantId,
          quantity: qty,
          reason: changeType,
          note: restockNote
        }
      });
    } else if (productId) {
      // Find first variant of product
      const v = await prisma.variant.findFirst({ where: { productId } });
      if (v) {
        const variant = await prisma.variant.update({
          where: { id: v.id },
          data: { stock: { increment: qty } }
        });
        updatedStock = variant.stock;
        await prisma.inventoryLog.create({
          data: {
            variantId: v.id,
            quantity: qty,
            reason: changeType,
            note: restockNote
          }
        });
      }
    }

    // 2. Update remote MySQL if configured
    if (!isPlaceholderConfig && productId) {
      try {
        await pool.query(
          "UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ? OR sku = ?",
          [qty, productId, productId]
        );

        const logId = "log-" + Date.now();
        await pool.query(
          "INSERT INTO inventory_logs (id, product_id, change_type, quantity_changed, note) VALUES (?, ?, ?, ?, ?)",
          [logId, productId, changeType, qty, restockNote]
        );
      } catch (mySqlErr: any) {
        console.warn("[MySQL Restock sync warning]", mySqlErr.message);
      }
    }

    // Clear product cache so updated stock reflects immediately
    clearProductsCache();
    emitStorefrontUpdate(req, "inventory", { action: "restock", productId, variantId, quantity: qty });

    res.json({
      success: true,
      message: `Successfully restocked +${qty} units.`,
      updatedStock,
      log: {
        changeType,
        quantityChanged: qty,
        note: restockNote,
        timestamp: new Date().toISOString()
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/inventory/adjust
 * Stock adjustment (+ or -) with mandatory/optional note
 */
router.post("/adjust", authenticateJWT as any, requireRole(["SuperAdmin", "Admin", "Manager"]) as any, async (req: Request, res: Response) => {
  try {
    const { productId, variantId, quantity, note, reason = "Stock Adjustment" } = req.body;
    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty === 0) {
      return res.status(400).json({ error: "Please enter a valid non-zero adjustment quantity" });
    }

    const adjustNote = note || `Manual adjustment (${reason})`;
    let updatedStock = 0;

    if (variantId) {
      const v = await prisma.variant.update({
        where: { id: String(variantId) },
        data: { stock: { increment: qty } }
      });
      updatedStock = v.stock;
      await prisma.inventoryLog.create({
        data: {
          variantId: v.id,
          quantity: qty,
          reason,
          note: adjustNote
        }
      });
    } else if (productId) {
      const v = await prisma.variant.findFirst({ where: { productId: String(productId) } });
      if (v) {
        const updatedV = await prisma.variant.update({
          where: { id: v.id },
          data: { stock: { increment: qty } }
        });
        updatedStock = updatedV.stock;
        await prisma.inventoryLog.create({
          data: {
            variantId: v.id,
            quantity: qty,
            reason,
            note: adjustNote
          }
        });
      }
    }

    clearProductsCache();
    res.json({
      success: true,
      message: `Stock adjusted by ${qty > 0 ? '+' : ''}${qty} units.`,
      updatedStock,
      note: adjustNote
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * PATCH /api/inventory/log/:id/note
 * Quick inline edit for log note
 */
router.patch("/log/:id/note", authenticateJWT as any, requireRole(["SuperAdmin", "Admin", "Manager"]) as any, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { note } = req.body;
    const updated = await prisma.inventoryLog.update({
      where: { id: String(id) },
      data: { note: String(note || "") }
    });
    res.json({ success: true, updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * PATCH /api/inventory/product/:id/note
 * Quick inline edit for product internal note
 */
router.patch("/product/:id/note", authenticateJWT as any, requireRole(["SuperAdmin", "Admin", "Manager"]) as any, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { note } = req.body;
    const updated = await prisma.product.update({
      where: { id: String(id) },
      data: { note: String(note || "") }
    });
    clearProductsCache();
    res.json({ success: true, updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

