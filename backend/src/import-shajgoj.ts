import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import dotenv from "dotenv";

dotenv.config();

const dbUrl = process.env.DATABASE_URL || "file:./dev.db";
const adapter = new PrismaLibSql({ url: dbUrl });
const prisma = new PrismaClient({ adapter });

const BRAND_LOGOS: Record<string, string> = {
  "NICKA K": "https://logo.clearbit.com/nicka.com",
  "L'Oreal": "https://logo.clearbit.com/loreal.com",
  "Flormar": "https://logo.clearbit.com/flormar.com",
  "Topface": "https://logo.clearbit.com/topface.com.tr",
  "The Body Shop": "https://logo.clearbit.com/thebodyshop.com",
  "Revlon": "https://logo.clearbit.com/revlon.com",
  "Dove": "https://logo.clearbit.com/dove.com",
  "Swiss Beauty": "https://logo.clearbit.com/swissbeauty.in",
  "Pastel": "https://logo.clearbit.com/pastel.com.tr",
  "Guerniss": "https://logo.clearbit.com/guerniss.com",
  "SOME BY MI": "https://logo.clearbit.com/somebymi.co.kr",
  "3W Clinic": "https://logo.clearbit.com/3wclinic.co.kr",
  "5LANC": "https://logo.clearbit.com/5lanc.jp",
  "M.A.C": "https://logo.clearbit.com/maccosmetics.com",
  "NYX": "https://logo.clearbit.com/nyxcosmetics.com",
  "Wardah": "https://logo.clearbit.com/wardahbeauty.com",
  "Maybelline": "https://logo.clearbit.com/maybelline.com",
  "Wet n Wild": "https://logo.clearbit.com/wetnwildbeauty.com",
  "Colourpop": "https://logo.clearbit.com/colourpop.com",
  "Skin Cafe": "https://logo.clearbit.com/skincafebd.com",
  "L.A. Girl": "https://logo.clearbit.com/lagirlusa.com",
  "e.l.f.": "https://logo.clearbit.com/elfcosmetics.com"
};

async function queryAlgolia(params: { facetFilters?: any[][]; query?: string; hitsPerPage?: number }) {
  const searchUrl = "https://khoj.shajgoj.com/products/1/indexes/*/queries?defaultFacet=product-category";
  const payload = [
    {
      indexName: "products",
      params: {
        facetFilters: params.facetFilters || [],
        hitsPerPage: params.hitsPerPage || 10,
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

async function saveProductToDB(hit: any) {
  const brandName = (hit.brand && hit.brand[0]) ? hit.brand[0].trim() : "Generic";
  const categoryName = (hit.categories && hit.categories[0]) ? hit.categories[0].trim() : "Makeup";

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

  // Check if product already exists
  const existingProduct = await prisma.product.findFirst({
    where: { name: hit.name }
  });
  if (existingProduct) {
    console.log(`Product "${hit.name}" already exists. Skipping.`);
    return;
  }

  // Generate SEO fields
  const metaTitle = `${hit.name} | GlowGoodly`;
  const metaDescription = `Buy authentic ${hit.name} at GlowGoodly. Premium quality beauty product from ${brandName} in Bangladesh.`;
  const metaKeywords = `${brandName}, ${categoryName}, ${hit.name}, cosmetics, skin care, makeup`;

  // 3. Create Product
  const product = await prisma.product.create({
    data: {
      name: hit.name,
      description: hit.name + ". Authentic beauty product.",
      metaTitle,
      metaDescription,
      metaKeywords,
      brandId: brand.id,
      categoryId: category.id,
      status: "Active"
    }
  });

  // 4. Create primary image
  if (hit.thumbnail) {
    await prisma.productImage.create({
      data: {
        productId: product.id,
        url: hit.thumbnail.startsWith("http") ? hit.thumbnail : `https://bk.shajgoj.com/storage/${hit.thumbnail}`,
        isPrimary: true
      }
    });
  }

  // 5. Create Variants (shades / sizes)
  const productGroups = hit.product_groups || [];
  let variantsAddedCount = 0;

  if (productGroups.length > 0 && productGroups[0].skus && productGroups[0].skus.length > 0) {
    for (const skuObj of productGroups[0].skus) {
      const variantName = skuObj.color_name || skuObj.size || skuObj.name || "Default";
      const variantPrice = Number(skuObj.price || hit.price || 100);
      const discountPrice = skuObj.has_sale ? Number(skuObj.sale_price || hit.sale_price) : null;
      const shadeColor = skuObj.color_code || null;
      const sizeValue = skuObj.size || null;
      const stock = Number(skuObj.stock || 10);
      const skuCode = skuObj.sku || `SKU-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      let vImg = skuObj.thumbnail_cdn || skuObj.thumbnail || null;
      if (vImg && !vImg.startsWith("http")) {
        vImg = `https://bk.shajgoj.com/storage/${vImg}`;
      }

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
        variantsAddedCount++;
      } catch (err: any) {
        console.error(`Failed to add variant ${skuCode}:`, err.message);
      }
    }
  }

  // If no variants added, create a default simple one
  if (variantsAddedCount === 0) {
    const skuCode = hit.product_sku || `SKU-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    await prisma.variant.upsert({
      where: { sku: skuCode },
      update: {},
      create: {
        productId: product.id,
        name: "Standard",
        price: Number(hit.price || 100),
        discountPrice: hit.has_sale ? Number(hit.sale_price) : null,
        stock: Number(hit.stock || 10),
        sku: skuCode
      }
    });
  }

  console.log(`Saved product "${hit.name}" with ${variantsAddedCount || 1} variants.`);
}

async function main() {
  console.log("Starting Shajgoj importer...");

  // 1. Ensure all 22 brands exist in the database and have updated logoUrls
  console.log("Setting up brands list...");
  for (const [bName, logo] of Object.entries(BRAND_LOGOS)) {
    await prisma.brand.upsert({
      where: { name: bName },
      update: { logoUrl: logo, isTopBrand: true },
      create: { name: bName, logoUrl: logo, isTopBrand: true }
    });
  }

  // 2. Query empty brands (brands with 0 products)
  const emptyBrands = await prisma.brand.findMany({
    where: { products: { none: {} } }
  });
  console.log(`Found ${emptyBrands.length} brands with 0 products in local DB.`);

  for (const brand of emptyBrands) {
    console.log(`Importing products for empty brand: "${brand.name}"`);
    const hits = await queryAlgolia({
      facetFilters: [[`brand:${brand.name}`]],
      hitsPerPage: 12
    });
    console.log(`Found ${hits.length} product hits on Shajgoj for brand "${brand.name}".`);
    for (const hit of hits) {
      await saveProductToDB(hit);
    }
  }

  // 3. Query empty categories (categories with 0 products)
  const emptyCategories = await prisma.category.findMany({
    where: { products: { none: {} } }
  });
  console.log(`Found ${emptyCategories.length} categories with 0 products in local DB.`);

  for (const cat of emptyCategories) {
    console.log(`Importing products for empty category: "${cat.name}"`);
    const hits = await queryAlgolia({
      query: cat.name,
      hitsPerPage: 8
    });
    console.log(`Found ${hits.length} product hits on Shajgoj for category "${cat.name}".`);
    for (const hit of hits) {
      await saveProductToDB(hit);
    }
  }

  console.log("\nSeeding & importing completed successfully!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
