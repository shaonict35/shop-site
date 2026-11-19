const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const { PrismaLibSql } = require('@prisma/adapter-libsql');

const FRONTEND_PUBLIC_DIR = "c:\\Users\\USER\\Downloads\\Glowgoodly\\Glowgoodly\\frontend\\public";
const BRANDS_DIR = path.join(FRONTEND_PUBLIC_DIR, "images", "brands");

const BRANDS_TO_DOWNLOAD = [
  { name: "CeraVe", filename: "cerave.png", url: "https://bk.shajgoj.com/storage/2021/04/cerave.png" },
  { name: "The Ordinary", filename: "the-ordinary.png", url: "https://bk.shajgoj.com/storage/2021/04/the-ordinary.png" },
  { name: "L'Oreal Paris", filename: "loreal.png", url: "https://bk.shajgoj.com/storage/2021/04/loreal.png" },
  { name: "COSRX", filename: "cosrx.png", url: "https://bk.shajgoj.com/storage/2021/04/cosrx.png" },
  { name: "Innisfree", filename: "innisfree.png", url: "https://bk.shajgoj.com/storage/2021/04/innisfree.png" },
  { name: "Cetaphil", filename: "cetaphil.png", url: "https://bk.shajgoj.com/storage/2021/04/cetaphil.png" },
  { name: "Nivea", filename: "nivea.png", url: "https://bk.shajgoj.com/storage/2021/04/nivea.png" },
  { name: "Huggies", filename: "huggies.png", url: "https://bk.shajgoj.com/storage/2021/04/huggies.png" },
  { name: "Calvin Klein", filename: "calvin-klein.png", url: "https://bk.shajgoj.com/storage/2021/04/calvin-klein.png" },
  { name: "Farlin", filename: "farlin.png", url: "https://bk.shajgoj.com/storage/2021/04/farlin.png" },
  { name: "Gillette", filename: "gillette.png", url: "https://bk.shajgoj.com/storage/2021/04/gillette.png" },
  { name: "Secret", filename: "secret.png", url: "https://bk.shajgoj.com/storage/2021/04/secret.png" },
  { name: "Olay", filename: "olay.png", url: "https://bk.shajgoj.com/storage/2021/04/olay.png" },
  { name: "Maybelline", filename: "maybelline.png", url: "https://bk.shajgoj.com/storage/2021/04/maybelline.png" },
  { name: "Revlon", filename: "revlon.png", url: "https://bk.shajgoj.com/storage/2021/04/revlon.png" }
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

  // 1. Download brand logos
  for (const b of BRANDS_TO_DOWNLOAD) {
    const dest = path.join(BRANDS_DIR, b.filename);
    downloadFileWithCurl(b.url, dest);
  }

  // 2. Update DB logoUrl values
  const adapter = new PrismaLibSql({ url: 'file:./dev.db' });
  const prisma = new PrismaClient({ adapter });

  for (const b of BRANDS_TO_DOWNLOAD) {
    const localPath = `/images/brands/${b.filename}`;
    await prisma.brand.updateMany({
      where: { name: b.name },
      data: { logoUrl: localPath }
    });
    console.log(`Updated database logoUrl for ${b.name} to ${localPath}`);
  }

  await prisma.$disconnect();
  console.log("=== BRAND LOGOS DOWNLOAD & DB UPDATE COMPLETED ===");
}

main().catch(console.error);
