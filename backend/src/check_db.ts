import prisma from "./prisma";

async function main() {
  console.log("--- Categories in DB ---");
  const categories = await prisma.category.findMany({
    include: {
      parent: true,
      subCategories: true,
      _count: { select: { products: true } }
    }
  });
  console.log(JSON.stringify(categories, null, 2));

  console.log("--- Products in DB ---");
  const products = await prisma.product.findMany({
    select: {
      id: true,
      name: true,
      categoryId: true,
      category: {
        select: {
          id: true,
          name: true,
          parent: {
            select: {
              id: true,
              name: true
            }
          }
        }
      }
    }
  });
  console.log(JSON.stringify(products, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
