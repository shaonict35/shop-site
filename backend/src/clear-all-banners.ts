import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  const result = await prisma.promoBanner.deleteMany();
  console.log(`Deleted ${result.count} banners from database.`);
  await prisma.setting.deleteMany({
    where: { key: { in: ["DELETED_BANNERS"] } }
  });
  console.log("Cleared DELETED_BANNERS setting.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
