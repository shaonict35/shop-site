const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const db = require('./dist/firebase').default;

async function check() {
  const pBrands = await prisma.brand.findMany().catch(e => e.message);
  const fBrands = [];
  const snap = await db.collection('brands').get();
  snap.forEach(d => fBrands.push({ id: d.id, ...d.data() }));

  console.log('Prisma brands count:', Array.isArray(pBrands) ? pBrands.length : pBrands);
  console.log('Firebase brands count:', fBrands.length);
  if (fBrands.length > 0) {
    console.log('First 3 Firebase brands:', JSON.stringify(fBrands.slice(0, 3)));
  }
  if (Array.isArray(pBrands) && pBrands.length > 0) {
    console.log('First 3 Prisma brands:', JSON.stringify(pBrands.slice(0, 3)));
  }
}

check().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
