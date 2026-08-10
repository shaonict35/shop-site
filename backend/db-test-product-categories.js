const { PrismaClient } = require('@prisma/client');
const { PrismaLibSql } = require('@prisma/adapter-libsql');
const adapter = new PrismaLibSql({ url: 'file:./dev.db' });
const prisma = new PrismaClient({ adapter });

async function main() {
  const counts = await prisma.product.groupBy({
    by: ['categoryId'],
    _count: {
      id: true
    }
  });

  const categories = await prisma.category.findMany({
    include: {
      parent: true
    }
  });
  const catMap = new Map(categories.map(c => [c.id, c]));

  const result = counts.map(c => {
    const cat = catMap.get(c.categoryId);
    return {
      categoryId: c.categoryId,
      categoryName: cat ? cat.name : 'Unknown',
      parentName: cat?.parent ? cat.parent.name : 'None',
      productCount: c._count.id
    };
  });

  console.log('PRODUCT CATEGORIES IN DB:', JSON.stringify(result, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
