import prisma from "./prisma";

async function main() {
  const emptyCategories = await prisma.category.findMany({
    where: {
      products: { none: {} }
    },
    select: { id: true, name: true }
  });

  const emptyBrands = await prisma.brand.findMany({
    where: {
      products: { none: {} }
    },
    select: { id: true, name: true }
  });

  console.log("=== Empty Categories ===");
  console.log(JSON.stringify(emptyCategories, null, 2));

  console.log("\n=== Empty Brands ===");
  console.log(JSON.stringify(emptyBrands, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
