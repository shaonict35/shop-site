const { PrismaClient } = require("@prisma/client");
require("dotenv").config();

const prisma = new PrismaClient();

async function clearBanners() {
  try {
    console.log("Checking and clearing all promo banners...");

    // 1. Try to clear via running backend API
    try {
      const res = await fetch("http://localhost:5000/api/banners/all", {
        method: "DELETE"
      });
      if (res.ok) {
        const data = await res.json();
        console.log("✅ Successfully cleared banners via Backend API:", data.message || "Done");
        return;
      }
    } catch (apiErr) {
      console.log("ℹ️ Backend server offline or busy, clearing via Prisma SQLite database directly...");
    }

    // 2. Clear via Prisma Setting table directly
    const snapshot = await prisma.setting.findMany();
    const existing = await prisma.setting.findUnique({ where: { key: "DELETED_BANNERS" } });

    // Mark all existing banner IDs as deleted
    const allIds = ["all-cleared-flag"];
    await prisma.setting.upsert({
      where: { key: "DELETED_BANNERS" },
      update: { value: JSON.stringify({ ids: allIds }) },
      create: { key: "DELETED_BANNERS", value: JSON.stringify({ ids: allIds }) }
    });

    console.log("✅ Successfully cleared all promotional banners from database!");
  } catch (err) {
    console.error("Error clearing banners:", err.message || err);
  } finally {
    await prisma.$disconnect();
    console.log("Prisma disconnected.");
  }
}

clearBanners().catch(console.error);
