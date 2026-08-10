import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import dotenv from "dotenv";

dotenv.config();

const dbUrl = process.env.DATABASE_URL || "file:./dev.db";
const adapter = new PrismaLibSql({ url: dbUrl });
const prisma = new PrismaClient({ adapter });

async function main() {
  const banners = await prisma.promoBanner.findMany();
  console.log("=== ALL BANNERS ===");
  banners.forEach((b: any) => {
    console.log(`Page: "${b.page}" | Title: "${b.title}" | Active: ${b.isActive}`);
  });

  console.log("\n=== FILTERED FOR HOMEPAGE SLIDERS (!page || page === 'Homepage') ===");
  const homeBanners = banners.filter((b: any) => !b.page || b.page === "Homepage");
  homeBanners.forEach((b: any) => {
    console.log(`Title: "${b.title}" | ImageUrl: "${b.imageUrl}"`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
