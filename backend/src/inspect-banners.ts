import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import dotenv from "dotenv";

dotenv.config();

const dbUrl = process.env.DATABASE_URL || "file:./dev.db";
const prisma = new PrismaClient();

async function main() {
  const banners = await prisma.promoBanner.findMany();
  console.log("=== ALL PROMO BANNERS IN DB ===");
  banners.forEach((b) => {
    console.log(`ID: ${b.id} | Page: ${b.page} | Title: ${b.title} | Order: ${b.sortOrder} | Active: ${b.isActive}`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
