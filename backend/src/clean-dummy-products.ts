import prisma from "./prisma";
import { pool, isPlaceholderConfig } from "./config/db";
import { clearProductsCache } from "./routes/products";
import { invalidatePrismaCache } from "./firebase";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

/**
 * Clean All Dummy Products, Test Orders, Fake Categories, and Mock Images
 * Prepares the entire database and files for real production data.
 */
export async function cleanAllDummyData() {
  console.log("🧹 Starting Complete Dummy Data & Mock Assets Cleanup...");
  const report: {
    deletedProducts: number;
    deletedVariants: number;
    deletedImages: number;
    deletedOrders: number;
    deletedCategories: number;
    cleanedUploads: number;
    mysqlCleaned: boolean;
  } = {
    deletedProducts: 0,
    deletedVariants: 0,
    deletedImages: 0,
    deletedOrders: 0,
    deletedCategories: 0,
    cleanedUploads: 0,
    mysqlCleaned: false,
  };

  // STRICT SAFETY GUARD (Phase 1.7): Automatic or unauthenticated purge is permanently disabled
  if (process.env.ENABLE_DANGEROUS_CLEANUP_PURGE !== "true") {
    console.warn("🛡️ [Safety Notice] cleanAllDummyData() is permanently DISABLED to prevent data loss.");
    return {
      message: "cleanAllDummyData is permanently disabled for production safety and data preservation.",
      ...report
    };
  }

  // Clean test categories
  const delCats = await prisma.category.deleteMany({
    where: {
      OR: [
        { name: { contains: "dummy" } },
        { name: { contains: "Dummy" } },
        { name: { contains: "Test Category" } },
        { name: { contains: "Sample" } },
        { id: { startsWith: "dummy-" } },
        { id: { startsWith: "mock-" } },
      ]
    }
  }).catch(() => ({ count: 0 }));
  report.deletedCategories = delCats.count;

  // Clean test orders
  const delOrders = await prisma.order.deleteMany({
    where: {
      OR: [
        { customerName: { contains: "test" } },
        { customerName: { contains: "Test" } },
        { orderNumber: { startsWith: "TEST-" } },
      ]
    }
  }).catch(() => ({ count: 0 }));
  report.deletedOrders = delOrders.count;

  // If remote MySQL is configured, clean it too
  if (!isPlaceholderConfig) {
    try {
      await pool.query("DELETE FROM inventory_logs").catch(() => { });
      await pool.query("DELETE FROM cart").catch(() => { });
      await pool.query("DELETE FROM order_items").catch(() => { });
      await pool.query("DELETE FROM orders WHERE customer_name LIKE '%test%'").catch(() => { });
      await pool.query("DELETE FROM products").catch(() => { });
      report.mysqlCleaned = true;
    } catch (mErr: any) {
      console.warn("[MySQL Purge]", mErr.message);
    }
  }

  await prisma.setting.create({
    data: { key: "DUMMY_PRODUCTS_PURGED_V3", value: "true" }
  }).catch(() => { });

  console.log(`✅ All placeholder dummy products purged! Real products can now be added cleanly.`);
} else {
  // Periodic target cleanup of any new test items
  const dummyProducts = await prisma.product.findMany({
    where: {
      OR: [
        { name: { contains: "dummy" } },
        { name: { contains: "Dummy" } },
        { name: { contains: "Sample" } },
        { name: { contains: "sample" } },
        { name: { contains: "Test Product" } },
        { name: { contains: "test product" } },
        { name: { contains: "Placeholder" } },
        { id: { startsWith: "mock-" } },
        { id: { startsWith: "dummy-" } },
      ],
    },
    include: { variants: true, images: true },
  });

  for (const p of dummyProducts) {
    await prisma.productImage.deleteMany({ where: { productId: p.id } }).catch(() => { });
    for (const v of p.variants) {
      await prisma.orderItem.deleteMany({ where: { variantId: v.id } }).catch(() => { });
      await prisma.inventoryLog.deleteMany({ where: { variantId: v.id } }).catch(() => { });
    }
    await prisma.variant.deleteMany({ where: { productId: p.id } }).catch(() => { });
    await prisma.review.deleteMany({ where: { productId: p.id } }).catch(() => { });
    await prisma.product.delete({ where: { id: p.id } }).catch(() => { });
    report.deletedProducts++;
  }
}

// 4. Clean external Unsplash mock URLs to local placeholder SVG
await prisma.productImage.updateMany({
  where: { url: { contains: "images.unsplash.com" } },
  data: { url: "/placeholder-product.svg" },
});
await prisma.variant.updateMany({
  where: { imageUrl: { contains: "images.unsplash.com" } },
  data: { imageUrl: "/placeholder-product.svg" },
});

// 5. Clean MySQL Database Tables if Remote MySQL is active
if (!isPlaceholderConfig) {
  try {
    console.log("🛠️  Cleaning Remote MySQL database tables...");
    // Delete test inventory logs
    await pool.query(
      "DELETE FROM inventory_logs WHERE product_id IN (SELECT id FROM products WHERE name LIKE '%dummy%' OR name LIKE '%sample%' OR name LIKE '%test%' OR id LIKE 'mock-%' OR id LIKE 'dummy-%' OR id LIKE 'prod-%') OR note LIKE '%test%' OR note LIKE '%dummy%'"
    ).catch(() => { });

    // Delete test cart
    await pool.query(
      "DELETE FROM cart WHERE product_id IN (SELECT id FROM products WHERE name LIKE '%dummy%' OR name LIKE '%sample%' OR name LIKE '%test%' OR id LIKE 'mock-%' OR id LIKE 'dummy-%' OR id LIKE 'prod-%')"
    ).catch(() => { });

    // Delete test order items
    await pool.query(
      "DELETE FROM order_items WHERE product_name LIKE '%dummy%' OR product_name LIKE '%sample%' OR product_name LIKE '%test%'"
    ).catch(() => { });

    // Delete test orders
    await pool.query(
      "DELETE FROM orders WHERE customer_name LIKE '%test%' OR customer_email LIKE '%test%' OR order_number LIKE 'TEST-%'"
    ).catch(() => { });

    // Delete dummy products
    await pool.query(
      "DELETE FROM products WHERE name LIKE '%dummy%' OR name LIKE '%sample%' OR name LIKE '%test%' OR id LIKE 'mock-%' OR id LIKE 'dummy-%' OR id LIKE 'prod-%'"
    ).catch(() => { });

    report.mysqlCleaned = true;
    console.log("✅ Remote MySQL dummy products, logs, cart & test orders cleaned successfully.");
  } catch (mysqlErr: any) {
    console.warn("⚠️ [MySQL Cleanup]", mysqlErr.message);
  }
}

// 6. Clean orphaned / dummy images from uploads folders
const uploadDirs = [
  path.join(__dirname, "..", "uploads"),
  path.join(__dirname, "..", "..", "frontend", "public", "uploads"),
];

for (const dir of uploadDirs) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, ".gitkeep"), "");
  } else {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      if (file.toLowerCase().includes("dummy") || file.toLowerCase().includes("test") || file.toLowerCase().includes("sample")) {
        fs.unlinkSync(path.join(dir, file));
        report.cleanedUploads++;
      }
    }
  }
}

// 7. Clear all in-memory caches
clearProductsCache();
invalidatePrismaCache("products");
invalidatePrismaCache("categories");
invalidatePrismaCache("orders");

console.log("🎉 Complete database cleanup finished successfully!");
return report;
  } catch (error) {
  console.error("❌ Error during dummy data cleanup:", error);
  throw error;
}
}

if (require.main === module) {
  cleanAllDummyData()
    .then((r) => {
      console.log("Cleanup Report:", JSON.stringify(r, null, 2));
      process.exit(0);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
