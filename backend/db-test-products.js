const { PrismaClient } = require('@prisma/client');
const { PrismaLibSql } = require('@prisma/adapter-libsql');
const adapter = new PrismaLibSql({ url: 'file:./dev.db' });
const prisma = new PrismaClient({ adapter });

async function main() {
  const products = await prisma.product.findMany({
    take: 5,
    include: {
      category: {
        include: {
          parent: true
        }
      }
    }
  });
  console.log('PRODUCTS:', JSON.stringify(products.map(p => ({
    name: p.name,
    categoryId: p.categoryId,
    categoryName: p.category?.name,
    categoryParentName: p.category?.parent?.name
  })), null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
