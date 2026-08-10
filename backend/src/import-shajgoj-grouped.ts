import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import dotenv from "dotenv";

dotenv.config();

const dbUrl = process.env.DATABASE_URL || "file:./dev.db";
const adapter = new PrismaLibSql({ url: dbUrl });
const prisma = new PrismaClient({ adapter });

const BRAND_LOGOS: Record<string, string> = {
  "M.A.C": "https://logo.clearbit.com/maccosmetics.com",
  "THE BODY SHOP": "https://logo.clearbit.com/thebodyshop.com",
  "NYX": "https://logo.clearbit.com/nyxcosmetics.com",
  "WARDAH": "https://logo.clearbit.com/wardahbeauty.com",
  "MAYBELLINE": "https://logo.clearbit.com/maybelline.com",
  "REVLON": "https://logo.clearbit.com/revlon.com",
  "WET N WILD": "https://logo.clearbit.com/wetnwildbeauty.com",
  "FLORMAR": "https://logo.clearbit.com/flormar.com",
  "COLOURPOP": "https://logo.clearbit.com/colourpop.com",
  "SKIN CAFE": "https://logo.clearbit.com/skincafebd.com",
  "L.A. GIRL": "https://logo.clearbit.com/lagirlusa.com",
  "E.L.F.": "https://logo.clearbit.com/elfcosmetics.com",
  "NICKA K": "https://logo.clearbit.com/nicka.com",
  "TOPFACE": "https://logo.clearbit.com/topface.com.tr",
  "SWISS BEAUTY": "https://logo.clearbit.com/swissbeauty.in",
  "PASTEL": "https://logo.clearbit.com/pastel.com.tr",
  "GUERNISS": "https://logo.clearbit.com/guerniss.com",
  "SOME BY MI": "https://logo.clearbit.com/somebymi.co.kr",
  "3W CLINIC": "https://logo.clearbit.com/3wclinic.co.kr",
  "5LANC": "https://logo.clearbit.com/5lanc.jp",
  "DOVE": "https://logo.clearbit.com/dove.com",
  "L'OREAL": "https://logo.clearbit.com/loreal.com"
};

const CATEGORIES_LIST = [
  "Makeup", "Skin", "Hair", "Personal Care", "Mom & Baby", "Fragrance", "Undergarments", "Combo", "Jewellery", "Clearance Sale", "Men"
];

function getBaseProductName(name: string, brandName: string): string {
  let base = name;
  if (name.toLowerCase().startsWith(brandName.toLowerCase())) {
    base = name.substring(brandName.length).trim();
  }

  // Strip trailing shades
  base = base
    .replace(/\s*-\s*[A-Za-z0-9]+(?:\s+[A-Za-z0-9]+)*\s*$/g, "")
    .replace(/\s*\(\s*Shade\s+[A-Za-z0-9]+\s*\)/gi, "")
    .replace(/\s*Shade\s+[A-Za-z0-9]+/gi, "")
    .replace(/\s*\d+ml/gi, "")
    .replace(/\s*\d+g/gi, "")
    .trim();

  return base.length > 5 ? `${brandName} ${base}` : name;
}

async function queryAlgolia(params: { facetFilters?: any[][]; query?: string; hitsPerPage?: number }) {
  const searchUrl = "https://khoj.shajgoj.com/products/1/indexes/*/queries?defaultFacet=product-category";
  const payload = [
    {
      indexName: "products",
      params: {
        facetFilters: params.facetFilters || [],
        hitsPerPage: params.hitsPerPage || 12,
        page: 0,
        query: params.query || ""
      }
    }
  ];

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
    console.error("Algolia request failed:", err.message);
    return [];
  }
}

async function processAndSaveGroupedProducts(hits: any[]) {
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

  console.log(`Grouped ${hits.length} search hits into ${Object.keys(groups).length} unique parent products.`);

  for (const [key, group] of Object.entries(groups)) {
    const hit = group.primaryHit;
    const brandName = (hit.brand && hit.brand[0]) ? hit.brand[0].trim() : "Generic";
    const categoryName = (hit.categories && hit.categories[0]) ? hit.categories[0].trim() : "Makeup";

    const baseName = getBaseProductName(hit.name, brandName);

    // 1. Ensure Brand exists
    const logoUrl = BRAND_LOGOS[brandName.toUpperCase()] || `https://logo.clearbit.com/${brandName.toLowerCase().replace(/[^a-z0-9]/g, "")}.com`;
    const brand = await prisma.brand.upsert({
      where: { name: brandName },
      update: { logoUrl },
      create: { name: brandName, logoUrl, isTopBrand: true }
    });

    // 2. Ensure Category exists
    const category = await prisma.category.upsert({
      where: { name: categoryName },
      update: {},
      create: { name: categoryName }
    });

    // 3. Create Product
    const metaTitle = `${baseName} | GlowGoodly`;
    const metaDescription = `Buy authentic ${baseName} at GlowGoodly. High quality beauty product from ${brandName}.`;
    const metaKeywords = `${brandName}, ${categoryName}, ${baseName}, cosmetics, skincare, makeup`;

    const product = await prisma.product.create({
      data: {
        name: baseName,
        description: baseName + ". Premium authentic beauty solution.",
        metaTitle,
        metaDescription,
        metaKeywords,
        brandId: brand.id,
        categoryId: category.id,
        status: "Active"
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
        console.error(`Failed to insert variant ${skuCode} under ${baseName}:`, err.message);
      }
    }

    console.log(`Saved Product: "${baseName}" with ${group.skus.length} variants/shades.`);
  }
}

async function main() {
  console.log("=== STARTING OPTIMIZED GROUPED SHAJGOJ IMPORTER ===");

  // 1. Clean existing products, variants, and images to avoid duplicate shade products
  console.log("Deleting old products, variants, and images to start fresh...");
  await prisma.variant.deleteMany({});
  await prisma.productImage.deleteMany({});
  await prisma.product.deleteMany({});
  console.log("Database cleared successfully.");

  // 2. Ensure all 22 brands exist in the database and have updated logoUrls
  console.log("Setting up brands list...");
  for (const [bName, logo] of Object.entries(BRAND_LOGOS)) {
    await prisma.brand.upsert({
      where: { name: bName },
      update: { logoUrl: logo, isTopBrand: true },
      create: { name: bName, logoUrl: logo, isTopBrand: true }
    });
  }

  let allHits: any[] = [];

  // 3. Query ONLY the 22 target brands (speeding up import dramatically)
  for (const bName of Object.keys(BRAND_LOGOS)) {
    console.log(`Querying Algolia search for brand: "${bName}"`);
    const hits = await queryAlgolia({
      facetFilters: [[`brand:${bName}`]],
      hitsPerPage: 15
    });
    console.log(`Found ${hits.length} hits for brand "${bName}".`);
    allHits = allHits.concat(hits);
  }

  // 4. Query categories list
  for (const catName of CATEGORIES_LIST) {
    console.log(`Querying Algolia search for category: "${catName}"`);
    const hits = await queryAlgolia({
      query: catName,
      hitsPerPage: 8
    });
    console.log(`Found ${hits.length} hits for category "${catName}".`);
    allHits = allHits.concat(hits);
  }

  // 5. Process grouped products
  await processAndSaveGroupedProducts(allHits);

  console.log("\n=== GROUPED SEEDING & IMPORTING COMPLETED SUCCESSFULLY ===");
}

main().catch(console.error).finally(() => prisma.$disconnect());
