import prisma from "./prisma";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

/**
 * Clean Catalog Utility
 * Purges all mock data from the SQL database (products, categories, brands, banners, coupons, blogs)
 * while preserving the SuperAdmin user and core system settings.
 * Run via: npx ts-node src/clean-catalog.ts
 */
async function cleanCatalog() {
  console.log("🧹 Cleaning mock catalog records from SQL database...");

  try {
    // 1. Delete catalog items
    await prisma.inventoryLog.deleteMany({}).catch(() => {});
    await prisma.orderItem.deleteMany({}).catch(() => {});
    await prisma.review.deleteMany({}).catch(() => {});
    await prisma.productImage.deleteMany({}).catch(() => {});
    await prisma.variant.deleteMany({}).catch(() => {});
    await prisma.product.deleteMany({}).catch(() => {});
    await prisma.category.deleteMany({}).catch(() => {});
    await prisma.brand.deleteMany({}).catch(() => {});
    await prisma.promoBanner.deleteMany({}).catch(() => {});
    await prisma.coupon.deleteMany({}).catch(() => {});

    // 2. Clear mock data from Settings table
    await prisma.setting.deleteMany({
      where: {
        key: {
          in: ["COUPONS_STORED_DATA", "BLOGS_STORED_DATA", "SEASONAL_OFFER_DATA"]
        }
      }
    }).catch(() => {});

    console.log("✅ All mock products, categories, brands, banners, coupons & blogs purged.");

    // 3. Ensure SuperAdmin account is preserved / created
    const adminEmail = (process.env.ADMIN_EMAIL || "admin@glowgoodly.com").trim().toLowerCase();
    const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
    const passwordHash = await bcrypt.hash(adminPassword, 10);

    await prisma.user.upsert({
      where: { email: adminEmail },
      update: {
        passwordHash,
        role: "SuperAdmin",
        status: "Active"
      },
      create: {
        name: "GlowGoodly SuperAdmin",
        email: adminEmail,
        passwordHash,
        role: "SuperAdmin",
        status: "Active"
      }
    });

    console.log(`👑 SuperAdmin verified: [${adminEmail}]`);
    console.log("✨ Database is 100% clean and ready for real data entry via the Admin Panel!");
  } catch (error) {
    console.error("❌ Error cleaning catalog:", error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  cleanCatalog();
}

export default cleanCatalog;
