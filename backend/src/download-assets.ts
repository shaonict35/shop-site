import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const FRONTEND_PUBLIC_DIR = "c:\\Users\\USER\\Downloads\\Glowgoodly\\Glowgoodly\\frontend\\public";
const IMAGES_DIR = path.join(FRONTEND_PUBLIC_DIR, "images");
const DEALS_DIR = path.join(IMAGES_DIR, "deals");
const SLIDERS_DIR = path.join(IMAGES_DIR, "sliders");
const BRANDS_DIR = path.join(IMAGES_DIR, "brands");

const ASSETS_TO_DOWNLOAD = {
  sliders: [
    { name: "slider-1.png", url: "https://bk.shajgoj.com/storage/2025/09/nirvana-hero-sliding-banner-1.png" },
    { name: "slider-2.png", url: "https://bk.shajgoj.com/storage/2026/07/shajgoj-unilever-slider-banner.png" },
    { name: "slider-3.png", url: "https://bk.shajgoj.com/storage/2026/02/shajgoj-treasure-of-glow-web-slider.png" }
  ],
  deals: [
    { name: "deal-1.png", url: "https://bk.shajgoj.com/storage/2026/04/dycm-banner-ombre-16-off.png" },
    { name: "deal-2.png", url: "https://bk.shajgoj.com/storage/2026/06/marico-free-delivery-dycm-banner.png" },
    { name: "deal-3.gif", url: "https://bk.shajgoj.com/storage/2026/05/pns-shajgoj-banner-2-1-1.gif" },
    { name: "deal-4.jpg", url: "https://bk.shajgoj.com/storage/2026/02/senora-feather-light-8-pads-buy-2-get-101-tk-off-01.jpg" }
  ],
  brands: [
    { name: "mac.svg", url: "https://upload.wikimedia.org/wikipedia/commons/e/e4/MAC_Cosmetics_logo.svg" },
    { name: "the-body-shop.svg", url: "https://upload.wikimedia.org/wikipedia/commons/e/ea/The_Body_Shop_Logo.svg" },
    { name: "nyx.svg", url: "https://upload.wikimedia.org/wikipedia/commons/2/2f/NYX_Professional_Makeup_logo.svg" },
    { name: "maybelline.svg", url: "https://upload.wikimedia.org/wikipedia/commons/a/a4/Maybelline-Logo.svg" },
    { name: "revlon.svg", url: "https://upload.wikimedia.org/wikipedia/commons/9/91/Revlon_logo.svg" },
    { name: "wet-n-wild.svg", url: "https://upload.wikimedia.org/wikipedia/commons/d/de/Wet_n_Wild_logo.svg" },
    { name: "elf.svg", url: "https://upload.wikimedia.org/wikipedia/commons/a/ab/Elf_Cosmetics_logo.svg" }
  ]
};

function downloadFileWithCurl(url: string, destPath: string) {
  try {
    execSync(`curl.exe -L -s -k -A "Mozilla/5.0" "${url}" -o "${destPath}"`);
    console.log(`Downloaded with curl: ${url} -> ${destPath}`);
  } catch (err: any) {
    console.error(`Failed to download ${url} with curl:`, err.message);
  }
}

async function main() {
  console.log("=== STARTING WIKIMEDIA ASSET DOWNLOAD WITH CURL ===");

  [IMAGES_DIR, DEALS_DIR, SLIDERS_DIR, BRANDS_DIR].forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`Created directory: ${dir}`);
    }
  });

  console.log("\nDownloading sliders...");
  for (const s of ASSETS_TO_DOWNLOAD.sliders) {
    downloadFileWithCurl(s.url, path.join(SLIDERS_DIR, s.name));
  }

  console.log("\nDownloading deals...");
  for (const d of ASSETS_TO_DOWNLOAD.deals) {
    downloadFileWithCurl(d.url, path.join(DEALS_DIR, d.name));
  }

  console.log("\nDownloading brand logos...");
  for (const b of ASSETS_TO_DOWNLOAD.brands) {
    downloadFileWithCurl(b.url, path.join(BRANDS_DIR, b.name));
  }

  console.log("\n=== ASSET DOWNLOAD COMPLETED ===");
}

main().catch(console.error);
