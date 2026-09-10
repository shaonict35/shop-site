import prisma from './src/prisma';
async function cleanDummyCustomers() {
  const result = await prisma.user.deleteMany({
    where: {
      OR: [
        { email: { endsWith: '@example.com' } },
        { email: { contains: 'dummy' } }
      ]
    }
  });
  console.log(`Removed ${result.count} dummy customers from database.`);
}
cleanDummyCustomers().catch(console.error).finally(() => prisma.$disconnect());
