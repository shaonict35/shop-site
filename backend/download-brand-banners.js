const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const { PrismaLibSql } = require('@prisma/adapter-libsql');

const FRONTEND_PUBLIC_DIR = "c:\\Users\\USER\\Downloads\\Glowgoodly\\Glowgoodly\\frontend\\public";
const BRANDS_DIR = path.join(FRONTEND_PUBLIC_DIR, "images", "brands");

const BRAND_BANNERS = [
  { name: "brand-offer-1.png", page: "Brand Offer 1", url: "https://bk.shajgoj.com/storage/2026/05/shajgoj-the-ordinary-top-brand-banner-33.png" },
  { name: "brand-offer-2.gif", page: "Brand Offer 2", url: "https://bk.shajgoj.com/storage/2026/04/skin-cafe-shower-gel-top-brand-banner.gif" },
  { name: "brand-offer-5.png", page: "Brand Offer 5", url: "https://bk.shajgoj.com/storage/2026/04/treasure-of-glow.png" },
  { name: "brand-offer-6.gif", page: "Brand Offer 6", url: "https://bk.shajgoj.com/storage/2026/05/trimmer-gif.gif" }
];

function downloadFileWithCurl(url, destPath) {
  try {
    execSync(`curl.exe -L -s -k -A "Mozilla/5.0" "${url}" -o "${destPath}"`);
    console.log(`Downloaded: ${url} -> ${destPath}`);
  } catch (err) {
    console.error(`Failed to download ${url}:`, err.message);
  }
}

async function main() {
  if (!fs.existsSync(BRANDS_DIR)) {
    fs.mkdirSync(BRANDS_DIR, { recursive: true });
  }

  // 1. Download banners
  for (const b of BRAND_BANNERS) {
    const dest = path.join(BRANDS_DIR, b.name);
    downloadFileWithCurl(b.url, dest);
  }

  // 2. Update SQLite Database paths
  const adapter = new PrismaLibSql({ url: 'file:./dev.db' });
  const prisma = new PrismaClient({ adapter });

  for (const b of BRAND_BANNERS) {
    const localPath = `/images/brands/${b.name}`;
    await prisma.promoBanner.updateMany({
      where: { page: b.page },
      data: { imageUrl: localPath }
    });
    console.log(`Updated database path for ${b.page} to ${localPath}`);
  }

  await prisma.$disconnect();
  console.log("=== BRAND BANNERS ASSET DOWNLOAD & DB UPDATE COMPLETED ===");
}

main().catch(console.error);
