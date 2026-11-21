require('dotenv').config();

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const db = require('./dist/firebase').default;

const MASTER_BRANDS = [
  { name: "The Ordinary", slug: "the-ordinary", logoUrl: "/images/brands/the-ordinary.png", originCountry: "Canada", isTopBrand: true },
  { name: "CeraVe", slug: "cerave", logoUrl: "/images/brands/cerave.png", originCountry: "USA", isTopBrand: true },
  { name: "COSRX", slug: "cosrx", logoUrl: "/images/brands/cosrx.png", originCountry: "South Korea", isTopBrand: true },
  { name: "Beauty of Joseon", slug: "beauty-of-joseon", logoUrl: "/images/brands/innisfree.png", originCountry: "South Korea", isTopBrand: true },
  { name: "La Roche-Posay", slug: "la-roche-posay", logoUrl: "/images/brands/cetaphil.png", originCountry: "France", isTopBrand: true },
  { name: "L'Oreal Paris", slug: "loreal", logoUrl: "/images/brands/loreal.png", originCountry: "France", isTopBrand: true },
  { name: "Maybelline", slug: "maybelline", logoUrl: "/images/brands/maybelline.png", originCountry: "USA", isTopBrand: true },
  { name: "MAC", slug: "mac", logoUrl: "/images/brands/mac.png", originCountry: "Canada", isTopBrand: true },
  { name: "NYX", slug: "nyx", logoUrl: "/images/brands/nyx.png", originCountry: "USA", isTopBrand: true },
  { name: "Innisfree", slug: "innisfree", logoUrl: "/images/brands/innisfree.png", originCountry: "South Korea", isTopBrand: true },
  { name: "Cetaphil", slug: "cetaphil", logoUrl: "/images/brands/cetaphil.png", originCountry: "Switzerland", isTopBrand: true },
  { name: "Nivea", slug: "nivea", logoUrl: "/images/brands/nivea.png", originCountry: "Germany", isTopBrand: true },
  { name: "E.L.F.", slug: "elf", logoUrl: "/images/brands/elf.png", originCountry: "USA", isTopBrand: true },
  { name: "The Body Shop", slug: "the-body-shop", logoUrl: "/images/brands/the-body-shop.png", originCountry: "UK", isTopBrand: true },
  { name: "Wet n Wild", slug: "wet-n-wild", logoUrl: "/images/brands/wet-n-wild.png", originCountry: "USA", isTopBrand: true },
  { name: "Revlon", slug: "revlon", logoUrl: "/images/brands/revlon.png", originCountry: "USA", isTopBrand: true },
  { name: "Beauty Glazed", slug: "beauty-glazed", logoUrl: "/images/brands/beauty-glazed.png", originCountry: "China", isTopBrand: true },
  { name: "Skin Cafe", slug: "skin-cafe", logoUrl: "/images/brands/skin-cafe.png", originCountry: "Bangladesh", isTopBrand: true },
  { name: "Calvin Klein", slug: "calvin-klein", logoUrl: "/images/brands/calvin-klein.png", originCountry: "USA", isTopBrand: true },
  { name: "Olay", slug: "olay", logoUrl: "/images/brands/olay.png", originCountry: "USA", isTopBrand: true },
  { name: "Pudaier", slug: "pudaier", logoUrl: "/images/brands/pudaier.png", originCountry: "China", isTopBrand: true },
  { name: "Secret", slug: "secret", logoUrl: "/images/brands/secret.png", originCountry: "USA", isTopBrand: true },
  { name: "Gillette", slug: "gillette", logoUrl: "/images/brands/gillette.png", originCountry: "USA", isTopBrand: true },
  { name: "Huggies", slug: "huggies", logoUrl: "/images/brands/huggies.png", originCountry: "USA", isTopBrand: true },
  { name: "Farlin", slug: "farlin", logoUrl: "/images/brands/farlin.png", originCountry: "Taiwan", isTopBrand: true },
  { name: "Neutrogena", slug: "neutrogena", logoUrl: "/images/brands/cerave.png", originCountry: "USA", isTopBrand: true },
  { name: "AXIS-Y", slug: "axis-y", logoUrl: "/images/brands/cosrx.png", originCountry: "South Korea", isTopBrand: true },
  { name: "Some By Mi", slug: "some-by-mi", logoUrl: "/images/brands/the-ordinary.png", originCountry: "South Korea", isTopBrand: true },
  { name: "Garnier", slug: "garnier", logoUrl: "/images/brands/loreal.png", originCountry: "France", isTopBrand: true },
  { name: "Dove", slug: "dove", logoUrl: "/images/brands/nivea.png", originCountry: "UK", isTopBrand: true },
  { name: "Simple", slug: "simple", logoUrl: "/images/brands/cetaphil.png", originCountry: "UK", isTopBrand: true }
];

async function seed() {
  console.log('Seeding ' + MASTER_BRANDS.length + ' master brands...');
  for (const b of MASTER_BRANDS) {
    const docId = `brand-${b.slug}`;
    const brandData = {
      id: docId,
      name: b.name,
      slug: b.slug,
      logoUrl: b.logoUrl,
      originCountry: b.originCountry,
      isTopBrand: b.isTopBrand,
      updatedAt: new Date().toISOString()
    };

    await db.collection("brands").doc(docId).set(brandData, { merge: true });

    await prisma.brand.upsert({
      where: { id: docId },
      create: {
        id: docId,
        name: b.name,
        logoUrl: b.logoUrl,
        isTopBrand: b.isTopBrand
      },
      update: {
        name: b.name,
        logoUrl: b.logoUrl,
        isTopBrand: b.isTopBrand
      }
    });
  }
  console.log('Done seeding brands!');
}

seed().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
