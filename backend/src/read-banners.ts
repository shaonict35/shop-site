import prisma from "./prisma";

async function main() {
  const banners = await prisma.promoBanner.findMany();
  console.log("Promo Banners count:", banners.length);
  console.log(JSON.stringify(banners.map(b => ({ id: b.id, title: b.title, page: b.page })), null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
