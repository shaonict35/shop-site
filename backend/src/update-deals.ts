import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import dotenv from "dotenv";

dotenv.config();

const dbUrl = process.env.DATABASE_URL || "file:./dev.db";
const adapter = new PrismaLibSql({ url: dbUrl });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding correct Deals You Cannot Miss in the database...");

  const deals = [
    {
      page: "Deal Card 1",
      title: "Deal Card 1 - Ombre 30% Off",
      imageUrl: "https://bk.shajgoj.com/storage/2026/07/ombre-30-off.png",
      bgColor: "#ffffff",
      sortOrder: 1
    },
    {
      page: "Deal Card 2",
      title: "Deal Card 2 - Marico Free Delivery",
      imageUrl: "https://bk.shajgoj.com/storage/2026/07/marico-free-delivery.png",
      bgColor: "#ffffff",
      sortOrder: 2
    },
    {
      page: "Deal Card 3",
      title: "Deal Card 3 - PNS Campaign",
      imageUrl: "https://bk.shajgoj.com/storage/2026/07/pns-b2g1.png",
      bgColor: "#ffffff",
      sortOrder: 3
    },
    {
      page: "Deal Card 4",
      title: "Deal Card 4 - Senora Deal",
      imageUrl: "https://bk.shajgoj.com/storage/2026/07/senora-deal.png",
      bgColor: "#ffffff",
      sortOrder: 4
    }
  ];

  for (const deal of deals) {
    const existing = await prisma.promoBanner.findFirst({
      where: { page: deal.page }
    });

    if (existing) {
      await prisma.promoBanner.update({
        where: { id: existing.id },
        data: {
          title: deal.title,
          imageUrl: deal.imageUrl,
          bgColor: deal.bgColor
        }
      });
    } else {
      await prisma.promoBanner.create({
        data: {
          title: deal.title,
          imageUrl: deal.imageUrl,
          bgColor: deal.bgColor,
          page: deal.page,
          sortOrder: deal.sortOrder
        }
      });
    }
    console.log(`Updated/Created database banner record for "${deal.page}".`);
  }

  console.log("Deals seed complete!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
