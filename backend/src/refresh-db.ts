import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import dotenv from "dotenv";

dotenv.config();

const dbUrl = process.env.DATABASE_URL || "file:./dev.db";
const adapter = new PrismaLibSql({ url: dbUrl });
const prisma = new PrismaClient({ adapter });

const BRAND_LOGOS: Record<string, string> = {
  "M.A.C": "/images/brands/mac.svg",
  "THE BODY SHOP": "/images/brands/the-body-shop.svg",
  "NYX": "/images/brands/nyx.svg",
  "MAYBELLINE": "/images/brands/maybelline.svg",
  "REVLON": "/images/brands/revlon.svg",
  "WET N WILD": "/images/brands/wet-n-wild.svg",
  "E.L.F.": "/images/brands/elf.svg",
  "WARDAH": "",
  "FLORMAR": "",
  "COLOURPOP": "",
  "SKIN CAFE": "",
  "L.A. GIRL": "",
  "NICKA K": "",
  "TOPFACE": "",
  "SWISS BEAUTY": "",
  "PASTEL": "",
  "GUERNISS": "",
  "SOME BY MI": "",
  "3W CLINIC": "",
  "5LANC": "",
  "DOVE": "",
  "L'OREAL": ""
};

const CATEGORIES_LIST = [
  "Makeup", "Skin", "Hair", "Personal Care", "Mom & Baby", "Fragrance", "Undergarments", "Combo", "Clearance Sale", "Men", "BOGO"
];

function getBaseProductName(name: string, brandName: string): string {
  let base = name;
  if (name.toLowerCase().startsWith(brandName.toLowerCase())) {
    base = name.substring(brandName.length).trim();
  }

  // 1. Split by hyphen or colon or en-dash to isolate shades
  base = base.split(/\s*-\s*|\s*:\s*|\s*–\s*/)[0].trim();

  // 2. Remove common shade codes or numeric codes (e.g. GS008, 750, 26, N03, B05)
  base = base.replace(/\s+(?:GS\d+|PF-[A-Z0-9]+|[A-Z]\d+|\d+(?:\.\d+)?)\b/gi, "").trim();

  // 3. Remove common trailing color names/words in cosmetics to consolidate variants
  const commonColors = [
    "camel", "grege", "retro", "babe", "tan", "porcelain", "brick", "brown", "maroon", 
    "hot", "nude", "café", "cafe", "mocha", "raspberry", "lust", "on", "honey", "watermilon",
    "watermelon", "red", "pink", "orange", "peach", "gold", "silver", "black", "white", "warm", "worm"
  ];

  for (let iter = 0; iter < 3; iter++) {
    const words = base.split(/\s+/);
    if (words.length > 2) {
      const lastWord = words[words.length - 1].toLowerCase().replace(/[^a-z]/g, "");
      if (commonColors.includes(lastWord)) {
        words.pop();
        base = words.join(" ");
      } else {
        break;
      }
    } else {
      break;
    }
  }

  // 4. Clean standard size designations
  base = base
    .replace(/\s*\(\s*Shade\s+[A-Za-z0-9]+\s*\)/gi, "")
    .replace(/\s*Shade\s+[A-Za-z0-9]+/gi, "")
    .replace(/\s*\d+ml/gi, "")
    .replace(/\s*\d+g/gi, "")
    .trim();

  return base.length > 5 ? `${brandName} ${base}` : name;
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function queryAlgolia(params: { facetFilters?: any[][]; query?: string; hitsPerPage?: number }, retries = 3): Promise<any[]> {
  const searchUrl = "https://khoj.shajgoj.com/products/1/indexes/*/queries?defaultFacet=product-category";
  
  const searchParams: any = {
    hitsPerPage: params.hitsPerPage || 15,
    page: 0,
    query: params.query || ""
  };

  if (params.facetFilters && params.facetFilters.length > 0) {
    searchParams.facetFilters = params.facetFilters;
  }

  const payload = [
    {
      indexName: "products",
      params: searchParams
    }
  ];

  await delay(800);

  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(searchUrl, {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
          "Referer": "https://shop.shajgoj.com/",
          "Origin": "https://shop.shajgoj.com"
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error(`Algolia search returned status ${res.status}`);
      }

      const data: any = await res.json();
      return data.results?.[0]?.hits || [];
    } catch (err: any) {
      console.warn(`Algolia query failed (attempt ${i + 1}/${retries}) for query "${params.query || params.facetFilters}":`, err.message);
      if (i === retries - 1) return [];
      await delay(2000);
    }
  }
  return [];
}

async function saveGroupedProducts(hits: any[], campaignOverride?: string, categoryOverride?: string) {
  const groups: Record<string, { primaryHit: any; skus: any[] }> = {};

  for (const hit of hits) {
    const brandName = (hit.brand && hit.brand[0]) ? hit.brand[0].trim() : "Generic";
    const pgId = (hit.product_groups && hit.product_groups[0]) ? `PG-${hit.product_groups[0].id}` : null;
    const groupKey = pgId || getBaseProductName(hit.name, brandName).toLowerCase().trim();

    if (!groups[groupKey]) {
      groups[groupKey] = {
        primaryHit: hit,
        skus: []
      };
    }

    if (hit.product_groups && hit.product_groups[0] && hit.product_groups[0].skus) {
      hit.product_groups[0].skus.forEach((sku: any) => {
        if (!groups[groupKey].skus.some(s => s.sku === sku.sku)) {
          groups[groupKey].skus.push(sku);
        }
      });
    } else {
      const simpleSku = hit.product_sku || `SKU-${hit.id}`;
      if (!groups[groupKey].skus.some(s => s.sku === simpleSku)) {
        groups[groupKey].skus.push({
          sku: simpleSku,
          name: hit.name,
          price: hit.price,
          sale_price: hit.sale_price,
          has_sale: hit.has_sale,
          stock: hit.stock,
          thumbnail: hit.thumbnail,
          thumbnail_cdn: hit.thumbnail_cdn || hit.thumbnail
        });
      }
    }
  }

  for (const [key, group] of Object.entries(groups)) {
    // Crucial: Add an 80ms delay between product inserts to prevent SQLite lockups on Windows
    await delay(80);
    
    const hit = group.primaryHit;
    const brandName = (hit.brand && hit.brand[0]) ? hit.brand[0].trim() : "Generic";
    const categoryName = categoryOverride || ((hit.categories && hit.categories[0]) ? hit.categories[0].trim() : "Makeup");

    const baseName = getBaseProductName(hit.name, brandName);

    // 1. Brand Setup
    const logoUrl = BRAND_LOGOS[brandName.toUpperCase()] || "";
    const brand = await prisma.brand.upsert({
      where: { name: brandName },
      update: { logoUrl },
      create: { name: brandName, logoUrl, isTopBrand: true }
    });

    // 2. Category Setup
    const category = await prisma.category.upsert({
      where: { name: categoryName },
      update: {},
      create: { name: categoryName }
    });

    // 3. Create Product
    const metaTitle = `${baseName} | GlowGoodly`;
    const metaDescription = `Buy authentic ${baseName} at GlowGoodly. High quality beauty product from ${brandName}.`;
    const metaKeywords = `${brandName}, ${categoryName}, ${baseName}, cosmetics, skincare, makeup`;

    let finalCampaign = campaignOverride || null;
    if (!finalCampaign && hit.has_sale) {
      finalCampaign = "CLEARANCE";
    }

    const product = await prisma.product.create({
      data: {
        name: baseName,
        description: baseName + ". Premium authentic beauty solution.",
        metaTitle,
        metaDescription,
        metaKeywords,
        brandId: brand.id,
        categoryId: category.id,
        status: "Active",
        campaignName: finalCampaign
      }
    });

    // 4. Save Product Primary Image
    if (hit.thumbnail) {
      const mainImgUrl = hit.thumbnail.startsWith("http") ? hit.thumbnail : `https://bk.shajgoj.com/storage/${hit.thumbnail}`;
      await prisma.productImage.create({
        data: {
          productId: product.id,
          url: mainImgUrl,
          isPrimary: true
        }
      });
    }

    // 5. Save variants
    for (const skuObj of group.skus) {
      const variantName = skuObj.color_name || skuObj.size || skuObj.name || "Standard";
      const price = Number(skuObj.price || hit.price || 100);
      const discountPrice = skuObj.has_sale ? Number(skuObj.sale_price || hit.sale_price) : null;
      const shadeColor = skuObj.color_code || null;
      const sizeValue = skuObj.size || null;
      const stock = Number(skuObj.stock || 10);
      const skuCode = skuObj.sku;

      let vImg = skuObj.thumbnail_cdn || skuObj.thumbnail || null;
      if (vImg && !vImg.startsWith("http")) {
        vImg = `https://bk.shajgoj.com/storage/${vImg}`;
      }

      if (vImg) {
        const imageExists = await prisma.productImage.findFirst({
          where: { productId: product.id, url: vImg }
        });
        if (!imageExists) {
          await prisma.productImage.create({
            data: {
              productId: product.id,
              url: vImg,
              isPrimary: false
            }
          });
        }
      }

      try {
        await prisma.variant.create({
          data: {
            productId: product.id,
            name: variantName,
            price,
            discountPrice,
            stock,
            sku: skuCode,
            shadeColor,
            sizeValue,
            imageUrl: vImg || (hit.thumbnail.startsWith("http") ? hit.thumbnail : `https://bk.shajgoj.com/storage/${hit.thumbnail}`)
          }
        });
      } catch (err: any) {
        // Safe fallback
      }
    }
  }
}

async function main() {
  console.log("=== STARTING FULL DATABASE REFRESH & GROUPED SEEDING ===");

  // 1. Delete all tables in proper relational order
  console.log("Deleting existing records...");
  await prisma.variant.deleteMany({});
  await prisma.productImage.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.brand.deleteMany({});
  await prisma.promoBanner.deleteMany({});
  await prisma.notification.deleteMany({});
  console.log("Database cleared successfully.");

  // 2. Setup Promo Banners (Using local downloaded paths)
  console.log("Creating banner sliders and cards...");
  
  // Hero sliders (Exactly 3 slides!)
  const sliders = [
    {
      page: "Homepage",
      title: "Nirvana Hero Slider Banner",
      imageUrl: "/images/sliders/slider-1.png",
      linkUrl: "/shop?category=skincare",
      bgColor: "linear-gradient(135deg, #e63b7a 0%, #ff758c 100%)",
      sortOrder: 0
    },
    {
      page: "Homepage",
      title: "Unilever Campaign Banner",
      imageUrl: "/images/sliders/slider-2.png",
      linkUrl: "/shop?category=skincare",
      bgColor: "linear-gradient(135deg, #495057 0%, #1a1a2e 100%)",
      sortOrder: 1
    },
    {
      page: "Homepage",
      title: "Treasure of Glow Web Slider",
      imageUrl: "/images/sliders/slider-3.png",
      linkUrl: "/shop?category=skincare",
      bgColor: "linear-gradient(135deg, #0e1e38 0%, #0a101f 100%)",
      sortOrder: 2
    }
  ];

  for (const s of sliders) {
    await prisma.promoBanner.create({ data: s });
  }

  // Deals You Cannot Miss
  const dealCards = [
    {
      page: "Deal Card 1",
      title: "Deal Card 1 - Ombre 30% Off",
      imageUrl: "/images/deals/deal-1.png",
      linkUrl: "/shop?category=clearance-sale",
      sortOrder: 0
    },
    {
      page: "Deal Card 2",
      title: "Deal Card 2 - Marico Free Delivery",
      imageUrl: "/images/deals/deal-2.png",
      linkUrl: "/shop?category=skincare",
      sortOrder: 1
    },
    {
      page: "Deal Card 3",
      title: "Deal Card 3 - PNS Campaign",
      imageUrl: "/images/deals/deal-3.gif",
      linkUrl: "/shop?category=combo",
      sortOrder: 2
    },
    {
      page: "Deal Card 4",
      title: "Deal Card 4 - Senora Deal",
      imageUrl: "/images/deals/deal-4.jpg",
      linkUrl: "/shop?category=makeup",
      sortOrder: 3
    }
  ];

  for (const d of dealCards) {
    await prisma.promoBanner.create({ data: d });
  }

  // Brand Offers
  const brandOffers = [
    {
      page: "Brand Offer 1",
      title: "Brand Offer 1 - The Ordinary",
      imageUrl: "https://bk.shajgoj.com/storage/2026/05/shajgoj-the-ordinary-top-brand-banner-33.png",
      linkUrl: "/shop?brand=the-ordinary",
      sortOrder: 0
    },
    {
      page: "Brand Offer 2",
      title: "Brand Offer 2 - Skin Cafe",
      imageUrl: "https://bk.shajgoj.com/storage/2026/04/skin-cafe-shower-gel-top-brand-banner.gif",
      linkUrl: "/shop?brand=skin-cafe",
      sortOrder: 1
    },
    {
      page: "Brand Offer 5",
      title: "Brand Offer 5 - Treasure of Glow",
      imageUrl: "https://bk.shajgoj.com/storage/2026/04/treasure-of-glow.png",
      linkUrl: "/shop?brand=the-ordinary",
      sortOrder: 5
    },
    {
      page: "Brand Offer 6",
      title: "Brand Offer 6 - Trimmer Offer",
      imageUrl: "https://bk.shajgoj.com/storage/2026/05/trimmer-gif.gif",
      linkUrl: "/shop?brand=skin-cafe",
      sortOrder: 6
    }
  ];

  for (const bo of brandOffers) {
    await prisma.promoBanner.create({ data: bo });
  }

  // Campaigns
  const campaignBanners = [
    {
      page: "BOGO",
      title: "BOGO Offer",
      imageUrl: "https://bk.shajgoj.com/storage/2025/05/bogo-9lad.png",
      linkUrl: "/shop?category=bogo",
      sortOrder: 0
    },
    {
      page: "COMBO",
      title: "COMBO Offer",
      imageUrl: "https://bk.shajgoj.com/storage/2025/05/combo.png",
      linkUrl: "/shop?category=combo",
      sortOrder: 0
    },
    {
      page: "OFFERS",
      title: "OFFERS",
      imageUrl: "https://bk.shajgoj.com/storage/2025/05/offers.png",
      linkUrl: "/shop?category=exclusive",
      sortOrder: 0
    },
    {
      page: "Clearance SALE",
      title: "Clearance SALE Offer",
      imageUrl: "https://bk.shajgoj.com/storage/2025/05/clearance-sale.png",
      linkUrl: "/shop?category=clearance-sale",
      sortOrder: 0
    }
  ];

  for (const cb of campaignBanners) {
    await prisma.promoBanner.create({ data: cb });
  }

  // 3. Setup Brands
  console.log("Setting up brands...");
  for (const [bName, logo] of Object.entries(BRAND_LOGOS)) {
    await prisma.brand.create({
      data: { name: bName, logoUrl: logo, isTopBrand: true }
    });
  }

  // 4. Setup Categories
  console.log("Setting up categories...");
  for (const catName of CATEGORIES_LIST) {
    await prisma.category.create({
      data: { name: catName }
    });
  }

  // 5. Query and Seeding Shajgoj Products
  console.log("Fetching brand products from Shajgoj...");
  for (const bName of Object.keys(BRAND_LOGOS)) {
    const hits = await queryAlgolia({
      facetFilters: [[`brand:${bName}`]],
      hitsPerPage: 10
    });
    console.log(`Scraped ${hits.length} products for brand: "${bName}"`);
    await saveGroupedProducts(hits);
  }

  // 6. Fetch BOGO Products specifically from Shajgoj
  console.log("Fetching BOGO products from Shajgoj...");
  const bogoHits = await queryAlgolia({
    query: "Buy 1 Get 1",
    hitsPerPage: 15
  });
  console.log(`Scraped ${bogoHits.length} BOGO products from Shajgoj.`);
  await saveGroupedProducts(bogoHits, "BOGO", "BOGO");

  // 7. Fetch Combo Products specifically
  console.log("Fetching Combo products from Shajgoj...");
  const comboHits = await queryAlgolia({
    query: "Combo",
    hitsPerPage: 10
  });
  console.log(`Scraped ${comboHits.length} Combo products.`);
  await saveGroupedProducts(comboHits, "COMBO", "Combo");

  // 8. Fetch Clearance Products specifically
  console.log("Fetching Clearance products from Shajgoj...");
  const clearanceHits = await queryAlgolia({
    query: "Clearance",
    hitsPerPage: 10
  });
  console.log(`Scraped ${clearanceHits.length} Clearance products.`);
  await saveGroupedProducts(clearanceHits, "CLEARANCE", "Clearance Sale");

  console.log("\n=== DATABASE REFRESH & GROUPED SEEDING COMPLETED ===");
}

main().catch(console.error).finally(() => prisma.$disconnect());
