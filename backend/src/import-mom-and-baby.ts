import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import dotenv from "dotenv";

dotenv.config();

const dbUrl = process.env.DATABASE_URL || "file:./dev.db";
const adapter = new PrismaLibSql({ url: dbUrl });
const prisma = new PrismaClient({ adapter });

// Standard brand logos mapping (case-insensitive checks will be done)
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
};

const PARENT_CATEGORY = "Mom & Baby";
const SUBCATEGORIES = [
  "Baby Lotion",
  "Baby Oil",
  "Baby Wash",
  "Diaper Cream",
  "Stretch Mark Cream",
  "Nursing Pads",
  "Nipple Cream",
  "Baby Shampoo",
  "Baby Powder",
  "Baby Sunscreen",
  "Wipes",
  "Pregnancy Supplements",
  "Lactation Support"
];

// Helper to query Shajgoj Algolia search index
async function queryAlgolia(query: string, facetFilters?: any[][]) {
  const searchUrl = "https://khoj.shajgoj.com/products/1/indexes/*/queries?defaultFacet=product-category";
  const payload = [
    {
      indexName: "products",
      params: {
        facetFilters: facetFilters || [],
        facets: ["brand", "categories.lvl0", "categories.lvl1", "price"],
        hitsPerPage: 1000,
        page: 0,
        query: query
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

// Function to classify Shajgoj products into our subcategories
function classifyProduct(name: string): string | null {
  const nameLower = name.toLowerCase();
  
  if (nameLower.includes("stretch mark")) {
    return "Stretch Mark Cream";
  }
  if (nameLower.includes("diaper") || nameLower.includes("nappy") || nameLower.includes("rash")) {
    return "Diaper Cream";
  }
  if (nameLower.includes("nipple")) {
    return "Nipple Cream";
  }
  if (nameLower.includes("nursing pad") || nameLower.includes("breast pad")) {
    return "Nursing Pads";
  }
  if (nameLower.includes("shampoo")) {
    return "Baby Shampoo";
  }
  if (nameLower.includes("powder")) {
    return "Baby Powder";
  }
  if (nameLower.includes("sunscreen") || nameLower.includes("sun block") || nameLower.includes("sunblock")) {
    return "Baby Sunscreen";
  }
  if (nameLower.includes("wipe")) {
    return "Wipes";
  }
  if (nameLower.includes("supplement") || nameLower.includes("pregnancy") || nameLower.includes("maternity") || nameLower.includes("pregnacare")) {
    return "Pregnancy Supplements";
  }
  if (nameLower.includes("lactation") || nameLower.includes("breastfeeding") || nameLower.includes("nursing support")) {
    return "Lactation Support";
  }
  if (nameLower.includes("lotion") || nameLower.includes("cream") || nameLower.includes("moisturiz") || nameLower.includes("moisturis")) {
    return "Baby Lotion";
  }
  if (nameLower.includes("oil")) {
    return "Baby Oil";
  }
  if (nameLower.includes("wash") || nameLower.includes("bath") || nameLower.includes("soap") || nameLower.includes("bodywash") || nameLower.includes("cleanser")) {
    return "Baby Wash";
  }
  
  return null;
}

// Seed data for categories empty on Shajgoj
const MOCK_PRODUCTS = [
  {
    category: "Nursing Pads",
    brand: "Lansinoh",
    brandLogo: "https://logo.clearbit.com/lansinoh.com",
    name: "Lansinoh Disposable Nursing Pads (60 Pack)",
    description: "Lansinoh Disposable Nursing Pads feature a contour shape and breathable design for discrete comfort. Dermatologist tested and super absorbent.",
    price: 850,
    sku: "lansinoh-pads-60",
    imageUrl: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=800&q=80"
  },
  {
    category: "Nursing Pads",
    brand: "Philips Avent",
    brandLogo: "https://logo.clearbit.com/philips.com",
    name: "Philips Avent Washable Breast Pads (6 Pack)",
    description: "Extra soft and absorbent washable breast pads with brushed cotton lining. Includes laundry bag. Eco-friendly and comfortable.",
    price: 1200,
    sku: "avent-washable-pads",
    imageUrl: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=800&q=80"
  },
  {
    category: "Nipple Cream",
    brand: "Lansinoh",
    brandLogo: "https://logo.clearbit.com/lansinoh.com",
    name: "Lansinoh Lanolin Nipple Cream 40g",
    description: "100% natural, single ingredient lanolin nipple cream. Safe for baby, no need to remove before breastfeeding. Promotes soothing skin relief.",
    price: 950,
    sku: "lansinoh-nipple-40g",
    imageUrl: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80"
  },
  {
    category: "Nipple Cream",
    brand: "Palmer's",
    brandLogo: "https://logo.clearbit.com/palmers.com",
    name: "Palmer's Cocoa Butter Nursing Butter 30g",
    description: "An easy to apply combination of pure Cocoa Butter and Pro-Vitamin B5 in a soothing emollient base. Helps relieve sore, cracked nipples.",
    price: 750,
    sku: "palmers-nursing-30g",
    imageUrl: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80"
  },
  {
    category: "Pregnancy Supplements",
    brand: "Vitabiotics",
    brandLogo: "https://logo.clearbit.com/vitabiotics.com",
    name: "Vitabiotics Pregnacare Original 30 Tablets",
    description: "UK's number 1 pregnancy supplement brand. Formulated with 19 important vitamins and minerals, including 400mcg folic acid and iron.",
    price: 1350,
    sku: "vitabiotics-pregnacare-30",
    imageUrl: "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?auto=format&fit=crop&w=800&q=80"
  },
  {
    category: "Pregnancy Supplements",
    brand: "Vitabiotics",
    brandLogo: "https://logo.clearbit.com/vitabiotics.com",
    name: "Vitabiotics Pregnacare Max 84 Tablets/Capsules",
    description: "Provides the ultimate formula in the range for expectant mothers. Includes L-Methylfolate, Vitamin D, Omega-3 DHA, and essential micronutrients.",
    price: 2450,
    sku: "vitabiotics-pregnacare-max",
    imageUrl: "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?auto=format&fit=crop&w=800&q=80"
  },
  {
    category: "Lactation Support",
    brand: "Traditional Medicinals",
    brandLogo: "https://logo.clearbit.com/traditionalmedicinals.com",
    name: "Traditional Medicinals Organic Mother's Milk Tea (16 Tea Bags)",
    description: "Herbal tea formulated to support breast milk production. Formulated with organic fennel, anise, coriander, and fenugreek. Caffeine free.",
    price: 850,
    sku: "tm-mothers-milk-tea",
    imageUrl: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=800&q=80"
  },
  {
    category: "Lactation Support",
    brand: "Pink Stork",
    brandLogo: "https://logo.clearbit.com/pinkstork.com",
    name: "Pink Stork Lactation Support Tea (15 Cups)",
    description: "Organic herbal tea blend designed to help promote breast milk flow, lactation, and postpartum recovery. Features fennel, fenugreek, and anise.",
    price: 1150,
    sku: "pink-stork-lactation-tea",
    imageUrl: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=800&q=80"
  }
];

async function run() {
  console.log("=== STARTING IMPORT & SEEDING SCRIPT ===");

  // 1. Establish/update parent category
  console.log(`Setting up parent category: "${PARENT_CATEGORY}"...`);
  const parentCategory = await prisma.category.upsert({
    where: { name: PARENT_CATEGORY },
    update: {},
    create: { name: PARENT_CATEGORY }
  });
  console.log(`Parent category resolved. ID: ${parentCategory.id}`);

  // 2. Set up subcategories
  const subcategoryMap = new Map<string, string>();
  for (const subName of SUBCATEGORIES) {
    const subCat = await prisma.category.upsert({
      where: { name: subName },
      update: { parentId: parentCategory.id },
      create: { name: subName, parentId: parentCategory.id }
    });
    subcategoryMap.set(subName, subCat.id);
  }
  console.log("Subcategories successfully initialized in DB.");

  // 3. Update Brand Logos
  console.log("Updating target brand logos in database...");
  const dbBrands = await prisma.brand.findMany();
  
  for (const [logoBrandName, logoUrl] of Object.entries(BRAND_LOGOS)) {
    const matched = dbBrands.filter(b => b.name.toLowerCase() === logoBrandName.toLowerCase());
    
    if (matched.length > 0) {
      for (const b of matched) {
        await prisma.brand.update({
          where: { id: b.id },
          data: { logoUrl, isTopBrand: true }
        });
        console.log(`  Updated logo & isTopBrand for "${b.name}" to: ${logoUrl}`);
      }
    } else {
      // Create brand if completely missing
      await prisma.brand.create({
        data: { name: logoBrandName, logoUrl, isTopBrand: true }
      });
      console.log(`  Created brand "${logoBrandName}" with logo: ${logoUrl}`);
    }
  }

  // 4. Fetch Products from Shajgoj search index
  console.log("Querying Shajgoj for 'Mom & Baby' catalog...");
  const hits = await queryAlgolia("", [["categories.lvl0:Mom & Baby"]]);
  console.log(`Retrieved ${hits.length} product hits from Shajgoj.`);

  let importedCount = 0;
  const importedSubcatCounts: Record<string, number> = {};
  SUBCATEGORIES.forEach(sc => { importedSubcatCounts[sc] = 0; });

  // 5. Process and insert Shajgoj products
  for (const hit of hits) {
    const classifiedSubcat = classifyProduct(hit.name);
    if (!classifiedSubcat) continue; // Skip if it doesn't match our specific subcategories

    const subcatId = subcategoryMap.get(classifiedSubcat)!;
    const brandNameRaw = (hit.brand && hit.brand[0]) ? hit.brand[0].trim() : "Generic";
    
    // Resolve brand database-wide case-insensitively
    let brand = await prisma.brand.findFirst({
      where: { name: { equals: brandNameRaw } }
    });
    
    if (!brand) {
      // Attempt case insensitive secondary check
      brand = await prisma.brand.findFirst({
        where: { name: { contains: brandNameRaw } }
      });
    }

    if (!brand) {
      // Create missing brand
      const logoUrl = BRAND_LOGOS[brandNameRaw.toUpperCase()] || `https://logo.clearbit.com/${brandNameRaw.toLowerCase().replace(/[^a-z0-9]/g, "")}.com`;
      brand = await prisma.brand.create({
        data: {
          name: brandNameRaw,
          logoUrl,
          isTopBrand: false
        }
      });
    }

    // Check if product name is already in DB under this category to avoid duplicates
    const existingProduct = await prisma.product.findFirst({
      where: { name: hit.name, categoryId: subcatId }
    });

    if (existingProduct) continue;

    // Generate SEO Optimizations
    const metaTitle = `${hit.name} | Buy Online | GlowGoodly`;
    const metaDescription = `Buy authentic ${hit.name} by ${brand.name} online at GlowGoodly Bangladesh. 100% genuine product.`.substring(0, 160);
    const metaKeywords = `${brand.name.toLowerCase()}, ${classifiedSubcat.toLowerCase()}, ${hit.name.toLowerCase()}, glowgoodly`;

    try {
      // Create Product
      const product = await prisma.product.create({
        data: {
          name: hit.name,
          description: `${hit.name}. Premium authentic baby and mother care solution.`,
          brandId: brand.id,
          categoryId: subcatId,
          status: "Active",
          metaTitle,
          metaDescription,
          metaKeywords
        }
      });

      // Create Product Image
      if (hit.thumbnail) {
        const imageUrl = hit.thumbnail.startsWith("http") ? hit.thumbnail : `https://bk.shajgoj.com/storage/${hit.thumbnail}`;
        await prisma.productImage.create({
          data: {
            productId: product.id,
            url: imageUrl,
            isPrimary: true
          }
        });
      }

      // Create Default Variant
      const regularPrice = hit.price ? parseFloat(hit.price) : 250;
      const salePrice = hit.has_sale ? parseFloat(hit.sale_price) : null;
      
      await prisma.variant.create({
        data: {
          productId: product.id,
          name: "Default",
          price: regularPrice,
          discountPrice: salePrice,
          stock: 45,
          sku: hit.product_sku || `${hit.slug}-${product.id.substring(0, 6)}`
        }
      });

      importedCount++;
      importedSubcatCounts[classifiedSubcat]++;
    } catch (err: any) {
      console.error(`Failed to insert product "${hit.name}":`, err.message);
    }
  }

  console.log(`\nShajgoj import completed. Successfully imported ${importedCount} products.`);
  for (const [subcat, count] of Object.entries(importedSubcatCounts)) {
    console.log(`- ${subcat}: ${count} imported`);
  }

  // 6. Custom Seeding for Empty Categories
  console.log("\nChecking empty categories for custom seeding...");
  
  for (const subName of SUBCATEGORIES) {
    const productCount = await prisma.product.count({
      where: { categoryId: subcategoryMap.get(subName)! }
    });
    
    console.log(`Category "${subName}" has ${productCount} products.`);
    
    if (productCount === 0) {
      console.log(`  Seeding mock products for "${subName}"...`);
      const mockToSeed = MOCK_PRODUCTS.filter(m => m.category === subName);
      
      for (const mock of mockToSeed) {
        // Resolve Brand
        let seedBrand = await prisma.brand.findFirst({
          where: { name: { equals: mock.brand } }
        });
        
        if (!seedBrand) {
          seedBrand = await prisma.brand.create({
            data: {
              name: mock.brand,
              logoUrl: mock.brandLogo,
              isTopBrand: true
            }
          });
        }
        
        // Create Product
        const product = await prisma.product.create({
          data: {
            name: mock.name,
            description: mock.description,
            brandId: seedBrand.id,
            categoryId: subcategoryMap.get(subName)!,
            status: "Active",
            metaTitle: `${mock.name} | GlowGoodly`,
            metaDescription: mock.description.substring(0, 160),
            metaKeywords: `${mock.brand.toLowerCase()}, ${subName.toLowerCase()}, baby care`
          }
        });
        
        // Create Image
        await prisma.productImage.create({
          data: {
            productId: product.id,
            url: mock.imageUrl,
            isPrimary: true
          }
        });
        
        // Create Variant
        await prisma.variant.create({
          data: {
            productId: product.id,
            name: "Default",
            price: mock.price,
            stock: 30,
            sku: mock.sku
          }
        });
        
        console.log(`    Seeded product: "${mock.name}"`);
      }
    }
  }

  console.log("\n=== SEEDING & IMPORT COMPLETED SUCCESSFULLY ===");
}

run().catch(console.error).finally(() => prisma.$disconnect());
