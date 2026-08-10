const { PrismaClient } = require('@prisma/client');
const { PrismaLibSql } = require('@prisma/adapter-libsql');
const adapter = new PrismaLibSql({ url: 'file:./dev.db' });
const prisma = new PrismaClient({ adapter });

async function main() {
  const banners = await prisma.promoBanner.findMany();
  console.log('BANNERS:', JSON.stringify(banners, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
