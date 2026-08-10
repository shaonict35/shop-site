import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import dotenv from "dotenv";

dotenv.config();

const dbUrl = process.env.DATABASE_URL || "file:./dev.db";
const adapter = new PrismaLibSql({ url: dbUrl });
const prisma = new PrismaClient({ adapter });

async function run() {
  console.log("Fetching brands taxonomy list from Shajgoj...");
  const brandsApi = "https://bk.shajgoj.com/api/taxonomies/get-menu-brands";
  
  try {
    const res = await fetch(brandsApi);
    if (!res.ok) {
      throw new Error(`Brands API returned status ${res.status}`);
    }

    const data: any = await res.json();
    
    // Extract top brands and other brands
    const topBrands = data.top_brands || [];
    const allBrandsRaw = data.all_brands || {};
    
    // Flat map all brands
    const allBrandsList: any[] = [];
    Object.keys(allBrandsRaw).forEach(letter => {
      const letterBrands = allBrandsRaw[letter];
      if (Array.isArray(letterBrands)) {
        allBrandsList.push(...letterBrands);
      }
    });

    console.log(`Fetched ${topBrands.length} top brands and ${allBrandsList.length} total brands.`);

    // 1. Get existing brands from local database
    const existing = await prisma.brand.findMany({ select: { name: true } });
    const existingNames = new Set(existing.map(b => b.name.toLowerCase().trim()));
    console.log(`Loaded ${existingNames.size} existing brands from database.`);

    // 2. Prepare brands to seed
    // We'll merge top brands and other brands, making sure top brands are marked correctly
    const brandMap = new Map<string, { name: string; slug: string; isTopBrand: boolean }>();
    
    topBrands.forEach((b: any) => {
      const name = b.name.trim();
      brandMap.set(name.toLowerCase(), {
        name,
        slug: b.slug,
        isTopBrand: true
      });
    });

    allBrandsList.forEach((b: any) => {
      const name = b.name.trim();
      const key = name.toLowerCase();
      if (!brandMap.has(key)) {
        brandMap.set(key, {
          name,
          slug: b.slug,
          isTopBrand: false
        });
      }
    });

    console.log(`Resolved ${brandMap.size} unique brands to verify.`);

    let createdCount = 0;
    let updatedCount = 0;

    // Loop and insert/update
    for (const [key, b] of brandMap.entries()) {
      // Skip if name is empty
      if (!b.name) continue;

      // Clearbit logo lookup or fallback URL
      let logoUrl = `https://logo.clearbit.com/${b.slug}.com`;
      
      // Fallback overrides for popular brands if clearbit domain fails
      if (b.slug === "loreal") {
        logoUrl = "https://logo.clearbit.com/loreal.com";
      } else if (b.slug === "m-a-c") {
        logoUrl = "https://logo.clearbit.com/maccosmetics.com";
      } else if (b.slug === "nyx") {
        logoUrl = "https://logo.clearbit.com/nyxcosmetics.com";
      } else if (b.slug === "e-l-f") {
        logoUrl = "https://logo.clearbit.com/elfcosmetics.com";
      } else if (b.slug === "skin-cafe") {
        logoUrl = "https://logo.clearbit.com/skincafebd.com";
      } else if (b.slug === "la-girl" || b.slug === "l-a-girl") {
        logoUrl = "https://logo.clearbit.com/lagirlusa.com";
      } else if (b.slug === "wet-n-wild") {
        logoUrl = "https://logo.clearbit.com/wetnwildbeauty.com";
      } else if (b.slug === "the-body-shop") {
        logoUrl = "https://logo.clearbit.com/thebodyshop.com";
      } else if (b.slug === "maybelline") {
        logoUrl = "https://logo.clearbit.com/maybelline.com";
      } else if (b.slug === "revlon") {
        logoUrl = "https://logo.clearbit.com/revlon.com";
      }

      if (existingNames.has(key)) {
        // Just update isTopBrand and logoUrl if missing
        const existingBrand = await prisma.brand.findFirst({ where: { name: b.name } });
        if (existingBrand && (!existingBrand.logoUrl || existingBrand.isTopBrand !== b.isTopBrand)) {
          await prisma.brand.update({
            where: { id: existingBrand.id },
            data: {
              isTopBrand: b.isTopBrand,
              logoUrl: existingBrand.logoUrl || logoUrl
            }
          });
          updatedCount++;
        }
      } else {
        // Create new brand
        await prisma.brand.create({
          data: {
            name: b.name,
            logoUrl,
            isTopBrand: b.isTopBrand
          }
        });
        createdCount++;
      }
    }

    console.log(`\n========================================`);
    console.log("Brands importer execution completed.");
    console.log(`Brands Created: ${createdCount}`);
    console.log(`Brands Updated: ${updatedCount}`);
    
  } catch (err: any) {
    console.error("Error importing brands:", err.message);
  } finally {
    await prisma.$disconnect();
  }
}

run();
