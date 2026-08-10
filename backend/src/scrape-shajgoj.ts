import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import puppeteer from "puppeteer-core";
import dotenv from "dotenv";

dotenv.config();

// Initialize Prisma with LibSQL adapter matching src/prisma.ts
const dbUrl = process.env.DATABASE_URL || "file:./dev.db";
const adapter = new PrismaLibSql({ url: dbUrl });
const prisma = new PrismaClient({ adapter });

// Helper to strip HTML tags if any remain
function stripHtml(html: string | null): string {
  if (!html) return "";
  return html
    .replace(/<\/p>/g, "\n\n")
    .replace(/<br\s*\/?>/g, "\n")
    .replace(/<[^>]+>/g, "")
    .trim();
}

async function run() {
  const args = process.argv.slice(2);
  const isDryRun = args.includes("--dry-run");
  
  let limit = 20;
  const limitIdx = args.indexOf("--limit");
  if (limitIdx !== -1 && args[limitIdx + 1]) {
    limit = parseInt(args[limitIdx + 1], 10);
  }

  console.log(`Starting Shajgoj Scraper. Mode: ${isDryRun ? "DRY RUN" : "IMPORT"}, Limit: ${limit}`);

  // 1. Load existing products from DB to avoid duplication
  const existingProducts = await prisma.product.findMany({
    select: { name: true }
  });
  const existingNames = new Set(existingProducts.map(p => p.name.toLowerCase().trim()));
  console.log(`Loaded ${existingNames.size} existing products from local database.`);

  // 2. Fetch product catalog listings from Shajgoj Search API
  console.log("Querying Shajgoj search engine...");
  const searchUrl = "https://khoj.shajgoj.com/products/1/indexes/*/queries?defaultFacet=product-category";
  
  const payload = [
    {
      indexName: "products",
      params: {
        facetFilters: [["categories.lvl0:Makeup"]],
        facets: ["brand", "categories.lvl0", "categories.lvl1", "price"],
        hitsPerPage: 100,
        page: 0,
        query: ""
      }
    },
    {
      indexName: "products",
      params: {
        facetFilters: [["categories.lvl0:Skin"]],
        facets: ["brand", "categories.lvl0", "categories.lvl1", "price"],
        hitsPerPage: 100,
        page: 0,
        query: ""
      }
    }
  ];

  let hits: any[] = [];
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
      throw new Error(`Search API returned status ${res.status}`);
    }

    const data: any = await res.json();
    if (data.results) {
      data.results.forEach((result: any) => {
        if (result.hits) {
          hits = hits.concat(result.hits);
        }
      });
    }
  } catch (err: any) {
    console.error("Failed to query search API:", err.message);
    process.exit(1);
  }

  console.log(`Fetched ${hits.length} products from Shajgoj search catalog.`);

  // 3. Filter out products that already exist
  const newHits = hits.filter(hit => {
    const hitName = hit.name.toLowerCase().trim();
    return !existingNames.has(hitName);
  });

  // Remove duplicates from the crawled list itself
  const uniqueNewHitsMap = new Map<string, any>();
  newHits.forEach(hit => {
    uniqueNewHitsMap.set(hit.name.toLowerCase().trim(), hit);
  });
  const uniqueNewHits = Array.from(uniqueNewHitsMap.values());

  console.log(`Identified ${uniqueNewHits.length} new products to potentially import.`);

  if (uniqueNewHits.length === 0) {
    console.log("No new products found to import.");
    process.exit(0);
  }

  // 4. Launch Puppeteer to scrape product details
  console.log("Launching browser via local Google Chrome...");
  const browser = await puppeteer.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  const page = await browser.newPage();
  
  // Set headers to look like a standard browser
  await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");

  const importBatch = uniqueNewHits.slice(0, limit);
  let importedCount = 0;

  for (const hit of importBatch) {
    console.log(`\n----------------------------------------`);
    console.log(`Processing product: "${hit.name}"`);
    console.log(`Brand: ${hit.brand ? hit.brand.join(", ") : "N/A"}, Price: ৳${hit.price}, Sale Price: ৳${hit.sale_price || 'N/A'}`);

    const productUrl = `https://shop.shajgoj.com/product/${hit.slug}`;
    console.log(`Navigating to detail page: ${productUrl}`);

    let scrapedDescription = "";
    let scrapedIngredients = "";

    try {
      await page.goto(productUrl, {
        waitUntil: "domcontentloaded",
        timeout: 20000
      });

      // Extract description and ingredients from the DOM
      const pageData = await page.evaluate(() => {
        const descEl = document.querySelector(".product-description");
        const ingEl = document.querySelector(".product-ingredients");
        return {
          description: descEl ? (descEl as HTMLElement).innerText : "",
          ingredients: ingEl ? (ingEl as HTMLElement).innerText : ""
        };
      });

      scrapedDescription = stripHtml(pageData.description);
      scrapedIngredients = stripHtml(pageData.ingredients);

      console.log(`Successfully scraped details from DOM.`);
    } catch (err: any) {
      console.log(`Warning: Failed to load details page (${err.message}). Using fallbacks.`);
    }

    // Fallbacks if scraping failed
    if (!scrapedDescription.trim()) {
      scrapedDescription = `${hit.name}. Authentic beauty product imported from authorized distributors.`;
    }

    // --- SEO Engine Optimization ---
    const brandName = (hit.brand && hit.brand[0]) ? hit.brand[0] : "Generic";
    
    // Generate SEO optimized fields
    const rawMetaTitle = `${hit.name} by ${brandName} | Buy Online | GlowGoodly`;
    const metaTitle = rawMetaTitle.length > 60 ? rawMetaTitle.substring(0, 57) + "..." : rawMetaTitle;

    const mainCategory = (hit.categories && hit.categories[0]) ? hit.categories[0] : "Cosmetics";
    const metaDescription = `Buy 100% genuine ${hit.name} by ${brandName} online in Bangladesh. GlowGoodly guarantees authentic products with secure payments. Order now!`.substring(0, 160);

    const generatedKeywords = [
      brandName.toLowerCase(),
      hit.name.toLowerCase(),
      mainCategory.toLowerCase(),
      "authentic makeup",
      "buy cosmetics bangladesh",
      "glowgoodly shop"
    ].join(", ");

    if (isDryRun) {
      console.log("[DRY RUN] Generated SEO Fields:");
      console.log(`- Meta Title: "${metaTitle}"`);
      console.log(`- Meta Description: "${metaDescription}"`);
      console.log(`- Meta Keywords: "${generatedKeywords}"`);
      console.log(`- Scraped Description (snippet): "${scrapedDescription.substring(0, 150)}..."`);
      console.log(`- Scraped Ingredients: "${scrapedIngredients || 'None'}"`);
      continue;
    }

    // --- Database Write ---
    try {
      // 1. Resolve Brand
      let dbBrand = await prisma.brand.findFirst({
        where: { name: brandName }
      });
      if (!dbBrand) {
        dbBrand = await prisma.brand.create({
          data: {
            name: brandName,
            isTopBrand: true
          }
        });
        console.log(`Created new brand: "${brandName}"`);
      }

      // 2. Resolve Category
      // Try to find matching subcategory or main category
      let categoryId = "";
      const shajgojCategories = hit.categories || [];
      
      for (const catName of shajgojCategories) {
        const match = await prisma.category.findFirst({
          where: { name: catName }
        });
        if (match) {
          categoryId = match.id;
          break;
        }
      }

      if (!categoryId) {
        // Fallback to "Makeup" or "Skin" matching the first parent category
        const matchedParent = shajgojCategories.includes("Skin") ? "Skin" : "Makeup";
        const fallbackCat = await prisma.category.findFirst({
          where: { name: matchedParent }
        });
        categoryId = fallbackCat ? fallbackCat.id : "";
      }

      if (!categoryId) {
        throw new Error("Could not find a valid category mapping in database.");
      }

      // 3. Create Product
      const product = await prisma.product.create({
        data: {
          name: hit.name,
          description: scrapedDescription,
          ingredients: scrapedIngredients || null,
          howToUse: null,
          brandId: dbBrand.id,
          categoryId,
          status: "Active",
          metaTitle,
          metaDescription,
          metaKeywords: generatedKeywords
        }
      });

      // 4. Create ProductImage
      const imageUrl = hit.thumbnail || "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=800&q=80";
      await prisma.productImage.create({
        data: {
          productId: product.id,
          url: imageUrl,
          isPrimary: true
        }
      });

      // 5. Create Default Variant
      const regularPrice = hit.price ? parseFloat(hit.price) : 0;
      const salePrice = hit.has_sale ? parseFloat(hit.sale_price) : null;
      
      await prisma.variant.create({
        data: {
          productId: product.id,
          name: "Default",
          price: regularPrice,
          discountPrice: salePrice,
          stock: 50,
          sku: hit.product_sku || `${hit.slug}-default`
        }
      });

      importedCount++;
      console.log(`Success: Imported product and variant successfully.`);

    } catch (dbErr: any) {
      console.error(`Error: Failed to save product to database:`, dbErr.message);
    }
  }

  await browser.close();
  console.log(`\n========================================`);
  console.log(`Scraping and import completed.`);
  console.log(`Total processed: ${importBatch.length}`);
  console.log(`Total successfully imported: ${importedCount}`);

  await prisma.$disconnect();
}

run();
