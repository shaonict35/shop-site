import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import puppeteer from "puppeteer-core";
import dotenv from "dotenv";

dotenv.config();

const dbUrl = process.env.DATABASE_URL || "file:./dev.db";
const adapter = new PrismaLibSql({ url: dbUrl });
const prisma = new PrismaClient({ adapter });

function stripHtml(html: string | null): string {
  if (!html) return "";
  return html
    .replace(/<\/p>/g, "\n\n")
    .replace(/<br\s*\/?>/g, "\n")
    .replace(/<[^>]+>/g, "")
    .trim();
}

async function run() {
  console.log("Starting scrape-fill-empty task...");

  // 1. Fetch empty categories and empty brands from DB
  const emptyCategories = await prisma.category.findMany({
    where: { products: { none: {} } },
    select: { id: true, name: true }
  });
  const emptyBrands = await prisma.brand.findMany({
    where: { products: { none: {} } },
    select: { id: true, name: true }
  });

  const emptyCatNamesLower = new Set(emptyCategories.map(c => c.name.toLowerCase().trim()));
  const emptyBrandNamesLower = new Set(emptyBrands.map(b => b.name.toLowerCase().trim()));

  console.log(`Found ${emptyCategories.length} empty categories and ${emptyBrands.length} empty brands in local database.`);

  // 2. Fetch products from Shajgoj Search API
  console.log("Querying Shajgoj search engine for Makeup, Skin, Hair and Personal Care...");
  const searchUrl = "https://khoj.shajgoj.com/products/1/indexes/*/queries?defaultFacet=product-category";
  
  const payload = [
    {
      indexName: "products",
      params: {
        facetFilters: [["categories.lvl0:Makeup"]],
        facets: ["brand", "categories.lvl0", "categories.lvl1", "price"],
        hitsPerPage: 150,
        page: 0,
        query: ""
      }
    },
    {
      indexName: "products",
      params: {
        facetFilters: [["categories.lvl0:Skin"]],
        facets: ["brand", "categories.lvl0", "categories.lvl1", "price"],
        hitsPerPage: 150,
        page: 0,
        query: ""
      }
    },
    {
      indexName: "products",
      params: {
        facetFilters: [["categories.lvl0:Hair"]],
        facets: ["brand", "categories.lvl0", "categories.lvl1", "price"],
        hitsPerPage: 150,
        page: 0,
        query: ""
      }
    },
    {
      indexName: "products",
      params: {
        facetFilters: [["categories.lvl0:Personal Care"]],
        facets: ["brand", "categories.lvl0", "categories.lvl1", "price"],
        hitsPerPage: 150,
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

  console.log(`Fetched ${hits.length} raw products from Shajgoj.`);

  // 3. Match products to empty categories or empty brands
  const candidates: any[] = [];
  const candidateNames = new Set<string>();

  for (const hit of hits) {
    const hitName = hit.name.toLowerCase().trim();
    if (candidateNames.has(hitName)) continue;

    const brandName = (hit.brand && hit.brand[0]) ? hit.brand[0].toLowerCase().trim() : "";
    const shajgojCategories = (hit.categories || []).map((c: string) => c.toLowerCase().trim());

    // Check if it matches an empty brand
    const isBrandEmpty = brandName && emptyBrandNamesLower.has(brandName);
    
    // Check if it matches an empty category
    let isCategoryEmpty = false;
    for (const catName of shajgojCategories) {
      if (emptyCatNamesLower.has(catName)) {
        isCategoryEmpty = true;
        break;
      }
    }

    if (isBrandEmpty || isCategoryEmpty) {
      candidates.push(hit);
      candidateNames.add(hitName);
    }
  }

  console.log(`Identified ${candidates.length} candidate products that can fill empty categories/brands.`);

  if (candidates.length === 0) {
    console.log("No empty category/brand matching products found on Shajgoj.");
  } else {
    // 4. Launch browser via local Google Chrome to scrape detail descriptions
    console.log("Launching browser via local Google Chrome...");
    let browser: any;
    let page: any;
    try {
      browser = await puppeteer.launch({
        executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"]
      });
      page = await browser.newPage();
      await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
    } catch (e: any) {
      console.log(`Could not launch Puppeteer browser: ${e.message}. Will use fallbacks.`);
    }

    // Limit to 50 items to run in a few minutes
    const importBatch = candidates.slice(0, 50);
    let importedCount = 0;

    for (const hit of importBatch) {
      console.log(`\nImporting candidate: "${hit.name}"`);
      const brandName = (hit.brand && hit.brand[0]) ? hit.brand[0] : "Generic";
      
      let scrapedDescription = "";
      let scrapedIngredients = "";

      if (page) {
        const productUrl = `https://shop.shajgoj.com/product/${hit.slug}`;
        console.log(`Navigating to: ${productUrl}`);
        try {
          await page.goto(productUrl, {
            waitUntil: "domcontentloaded",
            timeout: 8000
          });
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
        } catch (err: any) {
          console.log(`Warning: Failed to load details page (${err.message}). Using fallbacks.`);
        }
      }

      if (!scrapedDescription.trim()) {
        scrapedDescription = `${hit.name}. Authentic beauty product imported from authorized distributors.`;
      }

      const rawMetaTitle = `${hit.name} by ${brandName} | Buy Online | GlowGoodly`;
      const metaTitle = rawMetaTitle.length > 60 ? rawMetaTitle.substring(0, 57) + "..." : rawMetaTitle;
      const metaDescription = `Buy 100% genuine ${hit.name} by ${brandName} online in Bangladesh. GlowGoodly guarantees authentic products.`.substring(0, 160);
      const generatedKeywords = [brandName.toLowerCase(), hit.name.toLowerCase(), "authentic beauty", "glowgoodly"].join(", ");

      try {
        // Resolve Brand
        let dbBrand = await prisma.brand.findFirst({
          where: { name: { equals: brandName } }
        });
        if (!dbBrand) {
          dbBrand = await prisma.brand.create({
            data: {
              name: brandName,
              isTopBrand: false
            }
          });
        }

        // Resolve Category
        let categoryId = "";
        const shajgojCategories = hit.categories || [];
        for (const catName of shajgojCategories) {
          const match = await prisma.category.findFirst({
            where: { name: { equals: catName } }
          });
          if (match) {
            categoryId = match.id;
            break;
          }
        }

        if (!categoryId) {
          // Find or create category matching the first category on the list or fallback to Makeup
          const fallbackName = shajgojCategories[0] || "Makeup";
          let fallbackCat = await prisma.category.findFirst({
            where: { name: { equals: fallbackName } }
          });
          if (!fallbackCat) {
            fallbackCat = await prisma.category.create({
              data: { name: fallbackName }
            });
          }
          categoryId = fallbackCat.id;
        }

        // Create product if it doesn't already exist in database
        const existingProd = await prisma.product.findFirst({
          where: { name: hit.name }
        });

        if (!existingProd) {
          const product = await prisma.product.create({
            data: {
              name: hit.name,
              description: scrapedDescription,
              ingredients: scrapedIngredients || null,
              brandId: dbBrand.id,
              categoryId,
              status: "Active",
              metaTitle,
              metaDescription,
              metaKeywords: generatedKeywords,
              images: {
                create: [{ url: hit.thumbnail || "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&q=80", isPrimary: true }]
              },
              variants: {
                create: [{
                  name: "Default",
                  price: hit.price ? parseFloat(hit.price) : 0,
                  discountPrice: hit.has_sale ? parseFloat(hit.sale_price) : null,
                  stock: 50,
                  sku: hit.product_sku || `${hit.slug}-${Date.now()}`
                }]
              }
            }
          });
          importedCount++;
          console.log(`Success: Imported product "${hit.name}"`);
        } else {
          console.log(`Skipped: Product already exists`);
        }
      } catch (dbErr: any) {
        console.error(`Database error while importing:`, dbErr.message);
      }
    }

    if (browser) {
      await browser.close();
    }
    console.log(`Import completed. Successfully imported ${importedCount} products.`);
  }

  // 5. Seed Homepage and other Banners from Shajgoj
  console.log("\nSeeding Shajgoj homepage & promotion banners...");
  
  // Clear existing banners
  await prisma.promoBanner.deleteMany({});
  console.log("Cleared existing promo banners.");

  const shajgojBanners = [
    {
      title: "Nirvana Hero Slider Banner",
      imageUrl: "https://bk.shajgoj.com/storage/2025/09/nirvana-hero-sliding-banner-1.png",
      linkUrl: "/shop?brand=nirvana-color",
      bgColor: "#e63b7a",
      page: "Homepage",
      isActive: true,
      sortOrder: 0
    },
    {
      title: "Unilever Campaign Banner",
      imageUrl: "https://bk.shajgoj.com/storage/2026/07/shajgoj-unilever-slider-banner.png",
      linkUrl: "/shop",
      bgColor: "#1a1a2e",
      page: "Homepage",
      isActive: true,
      sortOrder: 1
    },
    {
      title: "Treasure of Glow Web Slider",
      imageUrl: "https://bk.shajgoj.com/storage/2026/02/shajgoj-treasure-of-glow-web-slider.png",
      linkUrl: "/shop",
      bgColor: "#1a1a2e",
      page: "Homepage",
      isActive: true,
      sortOrder: 2
    },
    {
      title: "COSRX Exclusives Slider",
      imageUrl: "https://bk.shajgoj.com/storage/2025/05/shajgoj-cosrx-exclusives-slider-app.png",
      linkUrl: "/shop?brand=cosrx",
      bgColor: "#1a1a2e",
      page: "Homepage",
      isActive: true,
      sortOrder: 3
    },
    {
      title: "Banner Promotion - Prime Banner Web",
      imageUrl: "https://bk.shajgoj.com/storage/2026/07/prime-banner-web.png",
      linkUrl: "/shop",
      bgColor: "#1a1a2e",
      page: "Banner Promotion",
      isActive: true,
      sortOrder: 0
    },
    {
      title: "Deals You Cannot Miss - Marico Free Delivery",
      imageUrl: "https://bk.shajgoj.com/storage/2026/06/marico-free-delivery-dycm-banner.png",
      linkUrl: "/shop",
      bgColor: "#1a1a2e",
      page: "Deals you cannot miss",
      isActive: true,
      sortOrder: 0
    },
    {
      title: "Extra Discount Summer Banner",
      imageUrl: "https://bk.shajgoj.com/storage/2026/04/shajgoj-banner-for-summer.jpg",
      linkUrl: "/shop",
      bgColor: "#1a1a2e",
      page: "Extra Discount Step-by-Step Deal",
      isActive: true,
      sortOrder: 0
    },
    {
      title: "Homepage Wide Banner",
      imageUrl: "https://bk.shajgoj.com/storage/2026/07/prime-banner-web.png",
      linkUrl: "/shop",
      bgColor: "#1a1a2e",
      page: "Homepage Wide Banner",
      isActive: true,
      sortOrder: 0
    },
    {
      title: "Deal Card 1 - Senora BOGO",
      imageUrl: "https://bk.shajgoj.com/storage/2026/02/senora-feather-light-8-pads-buy-2-get-101-tk-off-01.jpg",
      linkUrl: "/shop",
      bgColor: "#1a1a2e",
      page: "Deal Card 1",
      isActive: true,
      sortOrder: 0
    },
    {
      title: "Deal Card 2 - Trimmer Gift",
      imageUrl: "https://bk.shajgoj.com/storage/2026/05/trimmer-gif.gif",
      linkUrl: "/shop",
      bgColor: "#1a1a2e",
      page: "Deal Card 2",
      isActive: true,
      sortOrder: 0
    },
    {
      title: "Deal Card 3 - Treasure of Glow",
      imageUrl: "https://bk.shajgoj.com/storage/2026/04/treasure-of-glow.png",
      linkUrl: "/shop",
      bgColor: "#1a1a2e",
      page: "Deal Card 3",
      isActive: true,
      sortOrder: 0
    },
    {
      title: "Deal Card 4 - PNS Campaign",
      imageUrl: "https://bk.shajgoj.com/storage/2026/05/pns-shajgoj-banner-2-1-1.gif",
      linkUrl: "/shop",
      bgColor: "#1a1a2e",
      page: "Deal Card 4",
      isActive: true,
      sortOrder: 0
    },
    {
      title: "Brand Offer 1 - The Ordinary",
      imageUrl: "https://bk.shajgoj.com/storage/2026/05/shajgoj-the-ordinary-top-brand-banner-33.png",
      linkUrl: "/shop?brand=the-ordinary",
      bgColor: "#1a1a2e",
      page: "Brand Offer 1",
      isActive: true,
      sortOrder: 0
    },
    {
      title: "Brand Offer 2 - Skin Cafe",
      imageUrl: "https://bk.shajgoj.com/storage/2026/04/skin-cafe-shower-gel-top-brand-banner.gif",
      linkUrl: "/shop?brand=skin-cafe",
      bgColor: "#1a1a2e",
      page: "Brand Offer 2",
      isActive: true,
      sortOrder: 0
    },
    {
      title: "Brand Offer 3 - July Jaw Droppers",
      imageUrl: "https://bk.shajgoj.com/storage/2026/07/july-jaw-droppers-app.png",
      linkUrl: "/shop",
      bgColor: "#1a1a2e",
      page: "Brand Offer 3",
      isActive: true,
      sortOrder: 0
    },
    {
      title: "Brand Offer 4 - Korean Skincare Festival",
      imageUrl: "https://bk.shajgoj.com/storage/2025/09/shajgoj-korean-skin-care-festival.png",
      linkUrl: "/shop",
      bgColor: "#1a1a2e",
      page: "Brand Offer 4",
      isActive: true,
      sortOrder: 0
    },
    {
      title: "BOGO Offer",
      imageUrl: "https://bk.shajgoj.com/storage/2025/05/bogo-9lad.png",
      linkUrl: "/shop?campaign=BOGO",
      bgColor: "#1a1a2e",
      page: "BOGO",
      isActive: true,
      sortOrder: 0
    },
    {
      title: "COMBO Offer",
      imageUrl: "https://bk.shajgoj.com/storage/2025/05/combo.png",
      linkUrl: "/shop?campaign=COMBO",
      bgColor: "#1a1a2e",
      page: "COMBO",
      isActive: true,
      sortOrder: 0
    },
    {
      title: "OFFERS",
      imageUrl: "https://bk.shajgoj.com/storage/2025/05/offers.png",
      linkUrl: "/shop?campaign=EXCLUSIVE",
      bgColor: "#1a1a2e",
      page: "OFFERS",
      isActive: true,
      sortOrder: 0
    },
    {
      title: "Clearance SALE Offer",
      imageUrl: "https://bk.shajgoj.com/storage/2025/05/clearance-sale.png",
      linkUrl: "/shop?campaign=CLEARANCE",
      bgColor: "#1a1a2e",
      page: "Clearance SALE",
      isActive: true,
      sortOrder: 0
    }
  ];

  await prisma.promoBanner.createMany({
    data: shajgojBanners
  });
  console.log(`Successfully seeded ${shajgojBanners.length} banners into the database.`);

  await prisma.$disconnect();
}

run();
