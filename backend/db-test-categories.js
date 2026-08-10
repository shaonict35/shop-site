const { PrismaClient } = require('@prisma/client');
const { PrismaLibSql } = require('@prisma/adapter-libsql');
const adapter = new PrismaLibSql({ url: 'file:./dev.db' });
const prisma = new PrismaClient({ adapter });

async function main() {
  const categories = await prisma.category.findMany({
    include: {
      parent: true
    }
  });
  console.log('CATEGORIES:', JSON.stringify(categories.map(c => ({
    id: c.id,
    name: c.name,
    parentName: c.parent?.name
  })), null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
