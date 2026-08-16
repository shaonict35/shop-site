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
  "L'OREAL": "https://logo.clearbit.com/loreal.com",
  "CERAVE": "https://logo.clearbit.com/cerave.com",
  "COSRX": "https://logo.clearbit.com/cosrx.com",
  "THE ORDINARY": "https://logo.clearbit.com/theordinary.com",
  "NEUTROGENA": "https://logo.clearbit.com/neutrogena.com",
  "CETAPHIL": "https://logo.clearbit.com/cetaphil.com",
  "SIMPLE": "https://logo.clearbit.com/simple.co.uk",
  "POND'S": "https://logo.clearbit.com/ponds.com",
  "GARNIER": "https://logo.clearbit.com/garnier.com",
  "OLAY": "https://logo.clearbit.com/olay.com",
  "NIVEA": "https://logo.clearbit.com/nivea.com",
  "INKEY LIST": "https://logo.clearbit.com/theinkeylist.com",
  "ANUA": "https://logo.clearbit.com/anua.kr",
  "BEAUTY OF JOSEON": "https://logo.clearbit.com/beautyofjoseon.com",
  "SKIN1004": "https://logo.clearbit.com/skin1004.com",
  "LANEIGE": "https://logo.clearbit.com/laneige.com",
  "INNISFREE": "https://logo.clearbit.com/innisfree.com"
};

const CATEGORY_FACETS = [
  "categories.lvl0:Makeup",
  "categories.lvl0:Skin",
  "categories.lvl0:Hair",
  "categories.lvl0:Personal Care",
  "categories.lvl0:Mom & Baby",
  "categories.lvl0:Fragrance",
  "categories.lvl0:Undergarments",
  "categories.lvl0:Combo",
  "categories.lvl0:Clearance Sale",
  "categories.lvl0:Men",
  "categories.lvl0:BOGO"
];

function getBaseProductName(name: string, brandName: string): string {
  let base = name;
  if (name.toLowerCase().startsWith(brandName.toLowerCase())) {
    base = name.substring(brandName.length).trim();
  }

  base = base
    .replace(/\s*-\s*[A-Za-z0-9]+(?:\s+[A-Za-z0-9]+)*\s*$/g, "")
    .replace(/\s*\(\s*Shade\s+[A-Za-z0-9]+\s*\)/gi, "")
    .replace(/\s*Shade\s+[A-Za-z0-9]+/gi, "")
    .replace(/\s*\d+ml/gi, "")
    .replace(/\s*\d+g/gi, "")
    .trim();

  return base.length > 5 ? `${brandName} ${base}` : name;
}

async function queryAlgoliaCategory(facet: string, page: number = 0, hitsPerPage: number = 100) {
  const searchUrl = "https://khoj.shajgoj.com/products/1/indexes/*/queries?defaultFacet=product-category";
  const payload = [
    {
      indexName: "products",
      params: {
        facetFilters: [[facet]],
        hitsPerPage: hitsPerPage,
        page: page,
        query: ""
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
      throw new Error(`Algolia status ${res.status}`);
    }

    const data: any = await res.json();
    return data.results?.[0]?.hits || [];
  } catch (err: any) {
    console.error(`Algolia query '${facet}' p${page} failed:`, err.message);
    return [];
  }
}

async function runImport() {
  console.log("🚀 Starting Full Shajgoj Product & Variant Database Import...");

  const allHitsMap = new Map<string, any>();

  for (const facet of CATEGORY_FACETS) {
    console.log(`📡 Fetching products for category facet: "${facet}"...`);
    for (let page = 0; page < 5; page++) {
      const hits = await queryAlgoliaCategory(facet, page, 100);
      if (!hits || hits.length === 0) break;
      for (const hit of hits) {
        const key = hit.objectID || hit.id || hit.name;
        if (hit.name && !allHitsMap.has(key)) {
          allHitsMap.set(key, hit);
        }
      }
    }
  }

  const fetchedHits = Array.from(allHitsMap.values());
  console.log(`📦 Total unique product hits collected: ${fetchedHits.length}`);

  if (fetchedHits.length === 0) {
    console.error("❌ No hits fetched from Shajgoj API. Aborting.");
    return;
  }

  // Group hits into parent products
  const groups: Record<string, { primaryHit: any; skus: any[] }> = {};

  for (const hit of fetchedHits) {
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
      const simpleSku = hit.product_sku || `SKU-${hit.id || Math.random().toString(36).substring(2, 9)}`;
      if (!groups[groupKey].skus.some(s => s.sku === simpleSku)) {
        groups[groupKey].skus.push({
          sku: simpleSku,
          name: hit.name,
          price: hit.price,
          sale_price: hit.sale_price,
          has_sale: hit.has_sale,
          stock: hit.stock || 50,
          thumbnail: hit.thumbnail,
          thumbnail_cdn: hit.thumbnail_cdn || hit.thumbnail
        });
      }
    }
  }

  const uniqueParentKeys = Object.keys(groups);
  console.log(`✨ Grouped into ${uniqueParentKeys.length} parent products with variants.`);

  // 2. Clear old dummy products and variants safely
  console.log("🧹 Purging old dummy products and variants from database...");
  try {
    await prisma.orderItem.deleteMany({});
    await prisma.variant.deleteMany({});
    await prisma.productImage.deleteMany({});
    await prisma.review.deleteMany({});
    await prisma.product.deleteMany({});
    console.log("✅ Cleared dummy database records successfully.");
  } catch (err: any) {
    console.warn("⚠️ Note during database purge:", err.message);
  }

  let importedProductCount = 0;
  let importedVariantCount = 0;

  for (const [key, group] of Object.entries(groups)) {
    const hit = group.primaryHit;
    const brandName = (hit.brand && hit.brand[0]) ? hit.brand[0].trim() : "Generic";
    const categoryName = (hit.categories && hit.categories[0]) ? hit.categories[0].trim() : "Makeup";

    const baseName = getBaseProductName(hit.name, brandName);

    // Ensure Brand exists
    const logoUrl = BRAND_LOGOS[brandName.toUpperCase()] || `https://logo.clearbit.com/${brandName.toLowerCase().replace(/[^a-z0-9]/g, "")}.com`;
    const brand = await prisma.brand.upsert({
      where: { name: brandName },
      update: { logoUrl },
      create: { name: brandName, logoUrl, isTopBrand: true }
    });

    // Ensure Category exists
    const category = await prisma.category.upsert({
      where: { name: categoryName },
      update: {},
      create: { name: categoryName }
    });

    // Generate SEO fields for Product
    const metaTitle = `Buy Original ${baseName} online in BD | GlowGoodly`;
    const metaDescription = `Shop 100% authentic ${baseName} by ${brandName} at best price in Bangladesh. Fast home delivery across Dhaka & BD with guarantee.`;
    const metaKeywords = `${brandName}, ${categoryName}, ${baseName}, buy cosmetics online bangladesh, original ${baseName} price in bd, GlowGoodly`;

    const description = hit.description || `${baseName} by ${brandName} is 100% authentic, high quality ${categoryName.toLowerCase()} product imported directly for beauty lovers in Bangladesh. Guaranteed original quality.`;
    const howToUse = hit.how_to_use || `Apply ${baseName} gently as per recommended quantity. Discontinue if irritation occurs.`;
    const ingredients = hit.ingredients || `Dermatologically tested ingredients suited for Asian skin tones and weather.`;

    // Create Product record
    const product = await prisma.product.create({
      data: {
        name: baseName,
        description: description,
        howToUse: howToUse,
        ingredients: ingredients,
        metaTitle: metaTitle,
        metaDescription: metaDescription,
        metaKeywords: metaKeywords,
        brandId: brand.id,
        categoryId: category.id,
        status: "Active"
      }
    });

    importedProductCount++;

    // Create Primary Image
    const primaryImgUrl = hit.thumbnail_cdn || hit.thumbnail ? 
      ((hit.thumbnail_cdn || hit.thumbnail).startsWith("http") ? (hit.thumbnail_cdn || hit.thumbnail) : `https://bk.shajgoj.com/storage/${hit.thumbnail_cdn || hit.thumbnail}`) 
      : "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=500&fit=crop";

    await prisma.productImage.create({
      data: {
        productId: product.id,
        url: primaryImgUrl,
        isPrimary: true
      }
    });

    // Insert all Variants for this product
    for (let index = 0; index < group.skus.length; index++) {
      const skuObj = group.skus[index];

      const variantName = skuObj.color_name || skuObj.size || skuObj.name || (group.skus.length > 1 ? `Option ${index + 1}` : "Standard");
      const price = Number(skuObj.price || hit.price || 500);
      const discountPrice = skuObj.has_sale && skuObj.sale_price ? Number(skuObj.sale_price) : (hit.has_sale && hit.sale_price ? Number(hit.sale_price) : null);
      const shadeColor = skuObj.color_code || null;
      const sizeValue = skuObj.size || null;
      const stock = Number(skuObj.stock || 25);
      const skuCode = skuObj.sku || `SKU-${product.id.slice(0, 5)}-${index + 1}`;

      let vImg = skuObj.thumbnail_cdn || skuObj.thumbnail || primaryImgUrl;
      if (vImg && !vImg.startsWith("http")) {
        vImg = `https://bk.shajgoj.com/storage/${vImg}`;
      }

      try {
        await prisma.variant.create({
          data: {
            productId: product.id,
            name: variantName,
            price: price,
            discountPrice: discountPrice,
            costPrice: Math.round(price * 0.7),
            stock: stock,
            sku: skuCode,
            shadeColor: shadeColor,
            sizeValue: sizeValue,
            imageUrl: vImg
          }
        });
        importedVariantCount++;
      } catch (err: any) {
        // Fallback for SKU duplicate collision
        await prisma.variant.create({
          data: {
            productId: product.id,
            name: variantName,
            price: price,
            discountPrice: discountPrice,
            costPrice: Math.round(price * 0.7),
            stock: stock,
            sku: `${skuCode}-${Math.random().toString(36).substring(2, 6)}`,
            shadeColor: shadeColor,
            sizeValue: sizeValue,
            imageUrl: vImg
          }
        });
        importedVariantCount++;
      }
    }
  }

  console.log(`\n🎉 IMPORT COMPLETED SUCCESSFULLY!`);
  console.log(` Total Products Saved to DB: ${importedProductCount}`);
  console.log(` Total Product Variants Saved to DB: ${importedVariantCount}`);
}

runImport()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error("💥 Import failed:", err);
    process.exit(1);
  });
