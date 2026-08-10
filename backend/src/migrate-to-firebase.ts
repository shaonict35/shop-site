import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import dotenv from "dotenv";
import db from "./firebase";

dotenv.config();

const dbUrl = process.env.DATABASE_URL || "file:./dev.db";
const adapter = new PrismaLibSql({ url: dbUrl });
const prisma = new PrismaClient({ adapter });

async function migrate() {
  console.log("=== STARTING SQLITE TO FIREBASE MIGRATION ===");

  if (typeof db.collection !== "function") {
    console.error("\n❌ ERROR: Firebase is not configured correctly!");
    console.error("Please ensure that 'firebase-service-account.json' exists in the backend root");
    console.error("or that Firebase environment variables are defined in your .env file.\n");
    process.exit(1);
  }

  try {
    // 1. Migrate Categories
    console.log("Migrating Categories...");
    const categories = await prisma.category.findMany();
    console.log(`Found ${categories.length} categories to migrate.`);
    
    let catCount = 0;
    for (const cat of categories) {
      await db.collection("categories").doc(cat.id).set({
        name: cat.name,
        parentId: cat.parentId || null,
        createdAt: cat.createdAt.toISOString(),
        updatedAt: cat.updatedAt.toISOString(),
      });
      catCount++;
    }
    console.log(`Successfully migrated ${catCount} categories.`);

    // 2. Migrate Brands
    console.log("\nMigrating Brands...");
    const brands = await prisma.brand.findMany();
    console.log(`Found ${brands.length} brands to migrate.`);
    
    let brandCount = 0;
    for (const brand of brands) {
      await db.collection("brands").doc(brand.id).set({
        name: brand.name,
        logoUrl: brand.logoUrl || null,
        createdAt: brand.createdAt.toISOString(),
        updatedAt: brand.updatedAt.toISOString(),
      });
      brandCount++;
    }
    console.log(`Successfully migrated ${brandCount} brands.`);

    // 3. Migrate Products (including variants, images, categories, and brands nested for NoSQL optimization)
    console.log("\nMigrating Products...");
    const products = await prisma.product.findMany({
      include: {
        variants: true,
        images: true,
      }
    });
    console.log(`Found ${products.length} products to migrate.`);

    const allCategories = await prisma.category.findMany({
      include: { parent: true }
    });
    const categoryMap = new Map(allCategories.map(c => [c.id, c]));

    const allBrands = await prisma.brand.findMany();
    const brandMap = new Map(allBrands.map(b => [b.id, b]));

    let prodCount = 0;
    for (const p of products) {
      // Clean variants
      const variants = p.variants.map(v => ({
        id: v.id,
        name: v.name,
        sku: v.sku || null,
        price: v.price,
        discountPrice: v.discountPrice || null,
        stock: v.stock,
      }));

      // Clean images
      const images = p.images.map(img => ({
        id: img.id,
        url: img.url,
        isPrimary: img.isPrimary,
      }));

      const cat = categoryMap.get(p.categoryId);
      const brand = p.brandId ? brandMap.get(p.brandId) : null;

      const categoryJson = cat ? {
        id: cat.id,
        name: cat.name,
        parentId: cat.parentId || null,
        parent: cat.parent ? {
          id: cat.parent.id,
          name: cat.parent.name
        } : null
      } : null;

      const brandJson = brand ? {
        id: brand.id,
        name: brand.name,
        logoUrl: brand.logoUrl || null
      } : null;

      await db.collection("products").doc(p.id).set({
        name: p.name,
        description: p.description || null,
        brandId: p.brandId || null,
        brand: brandJson,
        categoryId: p.categoryId,
        category: categoryJson,
        campaignName: p.campaignName || null,
        status: p.status,
        variants,
        images,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      });
      prodCount++;
      if (prodCount % 100 === 0) {
        console.log(`  Migrated ${prodCount} products...`);
      }
    }
    console.log(`Successfully migrated ${prodCount} products.`);

    // 4. Migrate Banners
    console.log("\nMigrating Banners...");
    const banners = await prisma.promoBanner.findMany();
    console.log(`Found ${banners.length} banners to migrate.`);

    let bannerCount = 0;
    for (const b of banners) {
      await db.collection("banners").doc(b.id).set({
        title: b.title,
        imageUrl: b.imageUrl,
        linkUrl: b.linkUrl || null,
        bgColor: b.bgColor || "#1a1a2e",
        page: b.page || "Homepage",
        isActive: b.isActive,
        sortOrder: b.sortOrder,
        createdAt: b.createdAt.toISOString(),
        updatedAt: b.updatedAt.toISOString(),
      });
      bannerCount++;
    }
    console.log(`Successfully migrated ${bannerCount} banners.`);

    // 5. Migrate Settings
    console.log("\nMigrating Settings...");
    const settings = await prisma.setting.findMany();
    console.log(`Found ${settings.length} settings to migrate.`);

    let settingsCount = 0;
    for (const s of settings) {
      await db.collection("settings").doc(s.id).set({
        key: s.key,
        value: s.value,
        updatedAt: s.updatedAt.toISOString(),
      });
      settingsCount++;
    }
    console.log(`Successfully migrated ${settingsCount} settings.`);

    // 6. Migrate Notifications
    console.log("\nMigrating Notifications...");
    const notifications = await prisma.notification.findMany();
    console.log(`Found ${notifications.length} notifications to migrate.`);

    let notifCount = 0;
    for (const n of notifications) {
      await db.collection("notifications").doc(n.id).set({
        title: n.title,
        message: n.message,
        linkUrl: n.linkUrl || null,
        isActive: n.isActive,
        createdAt: n.createdAt.toISOString(),
        updatedAt: n.updatedAt.toISOString(),
      });
      notifCount++;
    }
    console.log(`Successfully migrated ${notifCount} notifications.`);

    console.log("\n=== MIGRATION COMPLETED SUCCESSFULLY ===");
  } catch (error: any) {
    console.error("\n❌ MIGRATION FAILED WITH ERROR:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

migrate();
