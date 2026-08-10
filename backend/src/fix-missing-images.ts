import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import dotenv from "dotenv";

dotenv.config();

const dbUrl = process.env.DATABASE_URL || "file:./dev.db";
const adapter = new PrismaLibSql({ url: dbUrl });
const prisma = new PrismaClient({ adapter });

const DEFAULT_COSMETIC_IMAGES = [
  "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1608248597279-f99d160bfbc5?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&auto=format&fit=crop&q=80"
];

async function fixMissingImages() {
  console.log("🔍 Auditing products for missing images in database...");

  const allProducts = await prisma.product.findMany({
    include: { images: true, variants: true, category: true }
  });

  console.log(`Found ${allProducts.length} total products in database.`);

  let fixedCount = 0;

  for (let i = 0; i < allProducts.length; i++) {
    const p = allProducts[i];
    const hasValidImage = p.images.length > 0 && p.images.some(img => img.url && img.url.length > 5 && !img.url.includes("placeholder"));

    if (!hasValidImage) {
      // Choose high-res image based on product index
      const chosenUrl = DEFAULT_COSMETIC_IMAGES[i % DEFAULT_COSMETIC_IMAGES.length];

      // Remove invalid image records if any
      await prisma.productImage.deleteMany({ where: { productId: p.id } });

      // Create primary high-res image
      await prisma.productImage.create({
        data: {
          productId: p.id,
          url: chosenUrl,
          isPrimary: true
        }
      });

      // Update variant images if missing
      for (const v of p.variants) {
        if (!v.imageUrl || v.imageUrl.length < 5 || v.imageUrl.includes("placeholder")) {
          await prisma.variant.update({
            where: { id: v.id },
            data: { imageUrl: chosenUrl }
          });
        }
      }

      fixedCount++;
    }
  }

  console.log(`✅ IMAGE FIX COMPLETE! Fixed ${fixedCount} products that had missing images.`);
  process.exit(0);
}

fixMissingImages().catch((e) => {
  console.error("Error fixing missing images:", e);
  process.exit(1);
});
