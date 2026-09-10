const { PrismaClient } = require("@prisma/client");
require("dotenv").config();

const prisma = new PrismaClient();

async function clearBanners() {
  try {
    console.log("Checking and clearing all promo banners...");
    if (prisma.promoBanner) {
      const deleted = await prisma.promoBanner.deleteMany({});
      console.log(`✅ Successfully cleared ${deleted.count} promo banners from database.`);
    } else {
      console.log("ℹ️ No promoBanner table found in Prisma schema.");
    }
  } catch (err) {
    console.error("Error clearing banners:", err.message || err);
  } finally {
    await prisma.$disconnect();
    console.log("Prisma disconnected.");
  }
}

clearBanners().catch(console.error);
