import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import dotenv from "dotenv";

dotenv.config();

const dbUrl = process.env.DATABASE_URL || "file:./dev.db";
const adapter = new PrismaLibSql({ url: dbUrl });
const prisma = new PrismaClient({ adapter });

const BRAND_LOGOS: Record<string, string> = {
  "NICKA K": "https://logo.clearbit.com/nicka.com",
  "L'OREAL": "https://logo.clearbit.com/loreal.com",
  "FLORMAR": "https://logo.clearbit.com/flormar.com",
  "TOPFACE": "https://logo.clearbit.com/topface.com.tr",
  "THE BODY SHOP": "https://logo.clearbit.com/thebodyshop.com",
  "REVLON": "https://logo.clearbit.com/revlon.com",
  "DOVE": "https://logo.clearbit.com/dove.com",
  "SWISS BEAUTY": "https://logo.clearbit.com/swissbeauty.in",
  "PASTEL": "https://logo.clearbit.com/pastel.com.tr",
  "GUERNISS": "https://logo.clearbit.com/guerniss.com",
  "SOME BY MI": "https://logo.clearbit.com/somebymi.co.kr",
  "3W CLINIC": "https://logo.clearbit.com/3wclinic.co.kr",
  "5LANC": "https://logo.clearbit.com/5lanc.jp",
  "M.A.C": "https://logo.clearbit.com/maccosmetics.com",
  "NYX": "https://logo.clearbit.com/nyxcosmetics.com",
  "WARDAH": "https://logo.clearbit.com/wardahbeauty.com",
  "MAYBELLINE": "https://logo.clearbit.com/maybelline.com",
  "WET N WILD": "https://logo.clearbit.com/wetnwildbeauty.com",
  "COLOURPOP": "https://logo.clearbit.com/colourpop.com",
  "SKIN CAFE": "https://logo.clearbit.com/skincafebd.com",
  "L.A. GIRL": "https://logo.clearbit.com/lagirlusa.com",
  "E.L.F.": "https://logo.clearbit.com/elfcosmetics.com"
};

const CATEGORY_TARGETS = [
  // Face & Makeup
  "Contour",
  "BB & CC cream",
  "Lip Plumper",
  "Lip Balm",
  "Lip Stain",
  "Nail Polish",
  "Nail Art",
  "Nail Polish Sets",
  "Nail Care",
  "Nail Polish Remover",
  "Face Brush",
  "Blush Brush",
  "Brush Sets",
  "Eye Brush",
  "Eyelash Curler",
  "Makeup Pouch",

  // Skincare
  "Face Scrub",
  "Cleansing Balm",
  "Day Cream",
  "Night Cream",
  "Face Gel",
  "Body Lotion",
  "Body Butter",
  "Face Serum",
  "Sheet Mask",
  "Face Toner",
  "Sunscreen",
  "Acne Patch",
  "Acne Treatment",
  "Anti Aging",
  "Dry Skin",
  "Brightening",
  "Pore Care",

  // Haircare
  "Shampoo",
  "Dry Shampoo",
  "Clarifying Shampoo",
  "Co-wash",
  "Conditioner",
  "Leave-In Conditioner",
  "Hair Mask",
  "Hair Cream",
  "Coconut Oil",
  "Argan Oil",
  "Castor Oil",
  "Onion Hair Oil",
  "Hair Fall",
  "Dandruff",
  "Dry & Frizzy Hair",
  "Damaged Hair Recovery",

  // Personal Care & Hygiene
  "Deodorant",
  "Roll-on",
  "Body Spray",
  "Intimate Wash",
  "Hand Sanitizer",
  "Body Wash",
  "Bar Soap",
  "Shower Gel",
  "Toothpaste",
  "Dental Floss",
  "Sanitary Napkin",
  "Panty Liner",
  "Menstrual Cup",
  "Feminine Wash"
];

function getHighResImageUrl(urlStr: string | null | undefined): string {
  if (!urlStr) return "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&auto=format&fit=crop&q=80";
  if (urlStr.startsWith("http")) {
    return urlStr.replace(/\?.*$/, ""); // Strip compression query params if any
  }
  return `https://bk.shajgoj.com/storage/${urlStr}`;
}

async function queryAlgolia(searchQuery: string, hitsPerPage = 12) {
  const searchUrl = "https://khoj.shajgoj.com/products/1/indexes/*/queries?defaultFacet=product-category";
  const payload = [
    {
      indexName: "products",
      params: {
        hitsPerPage,
        page: 0,
        query: searchQuery
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
    console.error(`Algolia request failed for query "${searchQuery}":`, err.message);
    return [];
  }
}

async function saveHitToDB(hit: any, targetCategoryName: string) {
  const brandName = (hit.brand && hit.brand[0]) ? hit.brand[0].trim() : "GlowGoodly";
  const catName = targetCategoryName;

  // 1. Ensure Brand
  const logoUrl = BRAND_LOGOS[brandName.toUpperCase()] || `https://logo.clearbit.com/${brandName.toLowerCase().replace(/[^a-z0-9]/g, "")}.com`;
  const brand = await prisma.brand.upsert({
    where: { name: brandName },
    update: { logoUrl },
    create: { name: brandName, logoUrl, isTopBrand: true }
  });

  // 2. Ensure Category
  const category = await prisma.category.upsert({
    where: { name: catName },
    update: {},
    create: { name: catName }
  });

  // Check if product already exists by name
  let product = await prisma.product.findFirst({
    where: { name: hit.name }
  });

  const mainImageUrl = getHighResImageUrl(hit.thumbnail_cdn || hit.thumbnail);

  if (!product) {
    const metaTitle = `${hit.name} | Buy Authentic in BD | GlowGoodly`;
    const metaDescription = `Buy 100% authentic ${hit.name} by ${brandName} online at GlowGoodly in Bangladesh. Fast delivery across Dhaka & BD.`;
    const metaKeywords = `${brandName}, ${catName}, ${hit.name}, cosmetics, skincare, hair care, bangladesh`;

    product = await prisma.product.create({
      data: {
        name: hit.name,
        description: `${hit.name}. 100% authentic beauty product from ${brandName}. Available for delivery across Bangladesh.`,
        metaTitle,
        metaDescription,
        metaKeywords,
        brandId: brand.id,
        categoryId: category.id,
        status: "Active"
      }
    });

    // Create primary image
    await prisma.productImage.create({
      data: {
        productId: product.id,
        url: mainImageUrl,
        isPrimary: true
      }
    });
  }

  // 3. Create/Upsert Variants
  const productGroups = hit.product_groups || [];
  let variantsAdded = 0;

  if (productGroups.length > 0 && productGroups[0].skus && productGroups[0].skus.length > 0) {
    for (const skuObj of productGroups[0].skus) {
      const variantName = skuObj.color_name || skuObj.size || skuObj.name || "Standard";
      const variantPrice = Number(skuObj.price || hit.price || 250);
      const discountPrice = skuObj.has_sale ? Number(skuObj.sale_price || hit.sale_price) : null;
      const shadeColor = skuObj.color_code || null;
      const sizeValue = skuObj.size || null;
      const stock = Number(skuObj.stock || 25);
      const skuCode = skuObj.sku || `SKU-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      const vImg = getHighResImageUrl(skuObj.thumbnail_cdn || skuObj.thumbnail || mainImageUrl);

      try {
        await prisma.variant.upsert({
          where: { sku: skuCode },
          update: {
            stock,
            price: variantPrice,
            discountPrice,
            imageUrl: vImg
          },
          create: {
            productId: product.id,
            name: variantName,
            price: variantPrice,
            discountPrice,
            stock,
            sku: skuCode,
            shadeColor,
            sizeValue,
            imageUrl: vImg
          }
        });
        variantsAdded++;
      } catch (e: any) {
        // Ignore duplicate SKU warnings
      }
    }
  }

  if (variantsAdded === 0) {
    const basePrice = Number(hit.price || 350);
    const salePrice = hit.has_sale ? Number(hit.sale_price) : null;
    const defaultSku = `SKU-${product.id.substring(0, 8).toUpperCase()}`;

    await prisma.variant.upsert({
      where: { sku: defaultSku },
      update: {
        price: basePrice,
        discountPrice: salePrice,
        imageUrl: mainImageUrl
      },
      create: {
        productId: product.id,
        name: "Regular",
        price: basePrice,
        discountPrice: salePrice,
        stock: 30,
        sku: defaultSku,
        imageUrl: mainImageUrl
      }
    });
  }
}

async function runImport() {
  console.log(`\n🚀 Starting Multi-Category Import for ${CATEGORY_TARGETS.length} categories from shop.shajgoj.com...`);
  let totalSaved = 0;

  for (const catName of CATEGORY_TARGETS) {
    console.log(`\n🔍 Fetching products for category: "${catName}"...`);
    const hits = await queryAlgolia(catName, 15);
    console.log(`   Found ${hits.length} hits for "${catName}".`);

    for (const hit of hits) {
      try {
        await saveHitToDB(hit, catName);
        totalSaved++;
      } catch (err: any) {
        console.error(`   Error saving product "${hit.name}":`, err.message);
      }
    }
  }

  console.log(`\n✅ Category Product Import Complete! Total product items processed: ${totalSaved}\n`);
  process.exit(0);
}

runImport().catch((e) => {
  console.error("Import failed:", e);
  process.exit(1);
});
