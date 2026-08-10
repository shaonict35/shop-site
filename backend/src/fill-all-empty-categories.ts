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

const ALL_CATEGORY_CONFIG = [
  {
    parent: "Makeup",
    subs: [
      "Face Primer", "Concealer", "Foundation", "Compact Powder", "Contour", "Loose Powder", "Blush", "BB & CC Cream", "Highlighter", "Makeup Remover",
      "Kajal", "Eyeliner", "Mascara", "Eye Shadow", "Eyebrow Gel", "Eye Primer", "False Eyelashes",
      "Lipstick", "Liquid Lipstick", "Lip Crayon", "Lip Gloss", "Lip Liner", "Lip Plumper", "Lip Balm", "Lip Stain",
      "Nail Polish", "Nail Art", "Nail Polish Sets", "Nail Care", "Nail Polish Remover",
      "Face Brush", "Blush Brush", "Brush Sets", "Eye Brush", "Eyelash Curler", "Makeup Pouch"
    ]
  },
  {
    parent: "Skin",
    subs: [
      "Face Wash", "Cleansing Oil", "Micellar Water", "Face Scrub", "Cleansing Balm",
      "Day Cream", "Night Cream", "Face Gel", "Body Lotion", "Body Butter",
      "Face Serum", "Sheet Mask", "Face Toner", "Sunscreen", "Acne Patch",
      "Acne Treatment", "Anti Aging", "Dry Skin", "Brightening", "Pore Care"
    ]
  },
  {
    parent: "Hair",
    subs: [
      "Shampoo", "Dry Shampoo", "Clarifying Shampoo", "Co-wash",
      "Conditioner", "Leave-In Conditioner", "Hair Mask", "Hair Cream",
      "Coconut Oil", "Argan Oil", "Castor Oil", "Onion Hair Oil", "Herbal Oil",
      "Hair Fall", "Dandruff", "Dry & Frizzy Hair", "Damaged Hair Recovery"
    ]
  },
  {
    parent: "Personal care",
    subs: [
      "Deodorant", "Roll-on", "Body Spray", "Intimate Wash", "Hand Sanitizer",
      "Body Wash", "Bar Soap", "Shower Gel",
      "Toothpaste", "Toothbrush", "Mouthwash", "Dental Floss",
      "Sanitary Napkin", "Panty Liner", "Menstrual Cup", "Feminine Wash"
    ]
  },
  {
    parent: "Mom & Baby",
    subs: [
      "Baby Lotion", "Baby Oil", "Baby Wash", "Diaper Cream",
      "Stretch Mark Cream", "Nursing Pads", "Nipple Cream",
      "Baby Shampoo", "Baby Powder", "Baby Sunscreen", "Wipes",
      "Pregnancy Supplements", "Lactation Support"
    ]
  },
  {
    parent: "Fragrance",
    subs: [
      "Womens Perfume", "Mens Cologne", "Unisex Fragrance",
      "Attar", "Body Mist", "Perfume Gift Set",
      "Roll-On Perfume", "Solid Perfume", "Hair Mist"
    ]
  },
  {
    parent: "Men",
    subs: [
      "Grooming", "Hygiene", "Skincare",
      "Mens Face Wash", "Shaving Gel & Foam", "Beard Oil & Cream", "Aftershave Balm",
      "Anti Hair Fall Shampoo", "Anti Dandruff Shampoo", "Hair Styling Wax", "Hair Styling Gel",
      "Mens Deodorants", "Mens Body Spray", "Mens Cologne", "Mens Body Wash"
    ]
  },
  {
    parent: "Perfect Match COMBO",
    subs: [
      "Skin Combos", "Makeup Combos", "Hair Combos",
      "Acne Clearance Combo", "Brightening Kit", "Anti-Aging Regimen",
      "Everyday Makeup Kit", "Bridal Glow Combo", "Party Glam Kit",
      "Hair Fall Defense Trio", "Dandruff Solution Combo", "Smooth & Shine Kit"
    ]
  },
  {
    parent: "Clearance SALE",
    subs: [
      "Makeup Deals", "Skincare Deals", "Haircare Deals",
      "Lipsticks under 499", "Palettes at 40% Off", "Face products deals",
      "Serums Flat 30% Off", "Cleansers B1G1", "Sheet masks packs",
      "Hair Oils Flat 20% Off", "Hair Masques Deals", "Shampoo Combs Packs"
    ]
  },
  {
    parent: "BOGO",
    subs: [
      "Buy 1 Get 1 Free", "BOGO Cosmetics", "BOGO Skincare", "BOGO Haircare", "BOGO Combos"
    ]
  },
  {
    parent: "Exclusive OFFERS",
    subs: [
      "VIP Offers", "Luxury Brands Discount", "Limited Collection", "Exclusive Gift Sets"
    ]
  }
];

function getHighResImageUrl(urlStr: string | null | undefined): string {
  if (!urlStr) return "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&auto=format&fit=crop&q=80";
  let clean = urlStr.trim();
  if (clean.startsWith("http")) {
    return clean.replace(/\?.*$/, "");
  }
  return `https://bk.shajgoj.com/storage/${clean}`;
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
    console.error(`Algolia search failed for "${searchQuery}":`, err.message);
    return [];
  }
}

async function saveHitToDB(hit: any, targetCategoryName: string, parentCatId: string) {
  const brandName = (hit.brand && hit.brand[0]) ? hit.brand[0].trim() : "GlowGoodly";
  const catName = targetCategoryName;

  // Ensure Brand
  const logoUrl = BRAND_LOGOS[brandName.toUpperCase()] || `https://logo.clearbit.com/${brandName.toLowerCase().replace(/[^a-z0-9]/g, "")}.com`;
  const brand = await prisma.brand.upsert({
    where: { name: brandName },
    update: { logoUrl },
    create: { name: brandName, logoUrl, isTopBrand: true }
  });

  // Ensure Category linked to parent
  const category = await prisma.category.upsert({
    where: { name: catName },
    update: { parentId: parentCatId },
    create: { name: catName, parentId: parentCatId }
  });

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

    await prisma.productImage.create({
      data: {
        productId: product.id,
        url: mainImageUrl,
        isPrimary: true
      }
    });
  } else {
    // If product exists, check image quality
    const existingImages = await prisma.productImage.findMany({ where: { productId: product.id } });
    if (existingImages.length === 0 || existingImages.some(img => !img.url || img.url.includes("placeholder"))) {
      await prisma.productImage.deleteMany({ where: { productId: product.id } });
      await prisma.productImage.create({
        data: {
          productId: product.id,
          url: mainImageUrl,
          isPrimary: true
        }
      });
    }
  }

  // Create Variants
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
        // Ignore duplicate SKU
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

async function runAuditAndFill() {
  console.log("🔍 STARTING COMPREHENSIVE CATEGORY & IMAGE AUDIT...");
  let totalNewAdded = 0;

  for (const config of ALL_CATEGORY_CONFIG) {
    const parentCat = await prisma.category.upsert({
      where: { name: config.parent },
      update: {},
      create: { name: config.parent }
    });

    console.log(`\n📁 Checking Parent Category: "${config.parent}" (${config.subs.length} subcategories)`);

    for (const subName of config.subs) {
      // Check existing product count for this subcategory
      const existingSubCat = await prisma.category.findFirst({
        where: { name: subName }
      });

      let currentCount = 0;
      if (existingSubCat) {
        currentCount = await prisma.product.count({
          where: { categoryId: existingSubCat.id }
        });
      }

      console.log(`   └─ Subcategory: "${subName}" -> Current Products: ${currentCount}`);

      if (currentCount < 6) {
        console.log(`      ⚡ Fetching high-res products for "${subName}" from shop.shajgoj.com...`);
        const hits = await queryAlgolia(subName, 12);
        console.log(`      Found ${hits.length} products for "${subName}". Saving to DB...`);

        for (const hit of hits) {
          try {
            await saveHitToDB(hit, subName, parentCat.id);
            totalNewAdded++;
          } catch (e: any) {
            console.error(`      Error saving product "${hit.name}":`, e.message);
          }
        }
      } else if (existingSubCat && existingSubCat.parentId !== parentCat.id) {
        // Link parent category
        await prisma.category.update({
          where: { id: existingSubCat.id },
          data: { parentId: parentCat.id }
        });
      }
    }
  }

  // AUDIT EXISTING PRODUCT IMAGES (Ensure NO blurry/missing images)
  console.log("\n🖼️ AUDITING EXISTING PRODUCT IMAGES FOR CLARITY...");
  const allImages = await prisma.productImage.findMany();
  let fixCount = 0;

  for (const img of allImages) {
    if (!img.url || img.url.includes("placeholder") || img.url.includes("via.placeholder") || img.url.includes("w=100")) {
      const highRes = "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&auto=format&fit=crop&q=80";
      await prisma.productImage.update({
        where: { id: img.id },
        data: { url: highRes }
      });
      fixCount++;
    }
  }

  console.log(`\n✅ CATEGORY & IMAGE AUDIT COMPLETE!`);
  console.log(`   - New products imported for empty categories: ${totalNewAdded}`);
  console.log(`   - Product images fixed for high clarity: ${fixCount}\n`);
  process.exit(0);
}

runAuditAndFill().catch((e) => {
  console.error("Audit failed:", e);
  process.exit(1);
});
