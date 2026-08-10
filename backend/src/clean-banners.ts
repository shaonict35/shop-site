import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import dotenv from "dotenv";

dotenv.config();

const dbUrl = process.env.DATABASE_URL || "file:./dev.db";
const adapter = new PrismaLibSql({ url: dbUrl });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Starting banner cleanup in database...");

  // 1. Delete 4th hero banner slider
  const deletedHero4 = await prisma.promoBanner.deleteMany({
    where: {
      id: "7bd4f020-6d8a-46d4-9459-013363b8ad8a"
    }
  });
  console.log(`Deleted ${deletedHero4.count} records matching 4th hero banner.`);

  // 2. Delete Brand Offer 3 and Brand Offer 4
  const deletedOffers = await prisma.promoBanner.deleteMany({
    where: {
      page: { in: ["Brand Offer 3", "Brand Offer 4"] }
    }
  });
  console.log(`Deleted ${deletedOffers.count} records for Brand Offer 3 and 4.`);

  // 3. Delete Extra Discount banner
  const deletedExtra = await prisma.promoBanner.deleteMany({
    where: {
      page: { contains: "Extra Discount" }
    }
  });
  console.log(`Deleted ${deletedExtra.count} records for Extra Discount banner.`);

  // 4. Ensure Brand Offer 5 has unique landscape banner (Treasure of Glow)
  const existingOffer5 = await prisma.promoBanner.findFirst({
    where: { page: "Brand Offer 5" }
  });

  if (existingOffer5) {
    await prisma.promoBanner.update({
      where: { id: existingOffer5.id },
      data: {
        title: "Brand Offer 5 - Treasure of Glow",
        imageUrl: "https://bk.shajgoj.com/storage/2026/04/treasure-of-glow.png",
        bgColor: "#1a1a2e"
      }
    });
  } else {
    await prisma.promoBanner.create({
      data: {
        title: "Brand Offer 5 - Treasure of Glow",
        imageUrl: "https://bk.shajgoj.com/storage/2026/04/treasure-of-glow.png",
        bgColor: "#1a1a2e",
        page: "Brand Offer 5",
        sortOrder: 5
      }
    });
  }
  console.log("Updated/Created Brand Offer 5 with Treasure of Glow landscape banner.");

  // 5. Ensure Brand Offer 6 has unique landscape banner (Trimmer Offer)
  const existingOffer6 = await prisma.promoBanner.findFirst({
    where: { page: "Brand Offer 6" }
  });

  if (existingOffer6) {
    await prisma.promoBanner.update({
      where: { id: existingOffer6.id },
      data: {
        title: "Brand Offer 6 - Trimmer Offer",
        imageUrl: "https://bk.shajgoj.com/storage/2026/05/trimmer-gif.gif",
        bgColor: "#ffffff"
      }
    });
  } else {
    await prisma.promoBanner.create({
      data: {
        title: "Brand Offer 6 - Trimmer Offer",
        imageUrl: "https://bk.shajgoj.com/storage/2026/05/trimmer-gif.gif",
        bgColor: "#ffffff",
        page: "Brand Offer 6",
        sortOrder: 6
      }
    });
  }
  console.log("Updated/Created Brand Offer 6 with Trimmer landscape banner.");

  console.log("Database banner cleanup complete!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
