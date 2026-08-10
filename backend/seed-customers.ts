import prisma from './src/prisma';
async function seed() {
  const customers = [
    { name: 'Sabbir Hossain', email: 'sabbir@example.com', phone: '01711000001', passwordHash: 'hash', role: 'Customer', status: 'Active' },
    { name: 'Nusrat Jahan', email: 'nusrat@example.com', phone: '01711000002', passwordHash: 'hash', role: 'Customer', status: 'Active' },
    { name: 'Rafiqul Islam', email: 'rafiq@example.com', phone: '01711000003', passwordHash: 'hash', role: 'Customer', status: 'Blocked' },
    { name: 'Ayesha Siddiqua', email: 'ayesha@example.com', phone: '01711000004', passwordHash: 'hash', role: 'Customer', status: 'Active' },
    { name: 'Mehedi Hasan', email: 'mehedi@example.com', phone: '01711000005', passwordHash: 'hash', role: 'Customer', status: 'Fraud' }
  ];
  for (const c of customers) {
    const exists = await prisma.user.findUnique({ where: { email: c.email } });
    if (!exists) {
      await prisma.user.create({ data: c });
    }
  }
  console.log('Seeded 5 dummy customers');
}
seed().catch(console.error).finally(() => prisma.$disconnect());
