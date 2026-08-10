const { PrismaClient } = require("@prisma/client");
const { PrismaLibSql } = require("@prisma/adapter-libsql");
require("dotenv").config();

const dbUrl = process.env.DATABASE_URL || "file:./dev.db";
const adapter = new PrismaLibSql({ url: dbUrl });
const prisma = new PrismaClient({ adapter });

async function insertBanners() {
  const existing = await prisma.promoBanner.count();
  if (existing > 0) {
    console.log("Banners already exist:", existing);
    return;
  }
  const result = await prisma.promoBanner.createMany({
    data: [
      {
        title: "GlowGoodly — Premium Beauty Destination Bangladesh",
        imageUrl: "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=1400&q=90&fit=crop",
        linkUrl: "/shop",
        bgColor: "#1a1a2e",
        isActive: true,
        sortOrder: 0,
      },
      {
        title: "Exclusive Korean Skincare — Up to 40% Off",
        imageUrl: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=1400&q=90&fit=crop",
        linkUrl: "/category/skincare",
        bgColor: "#e63b7a",
        isActive: true,
        sortOrder: 1,
      },
    ],
  });
  console.log("Banners created:", result.count);
}

insertBanners()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
