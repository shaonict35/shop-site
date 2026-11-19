import fs from "fs";
import prisma from "./prisma";

// Category hierarchy mapping matching frontend Header.tsx
const CATEGORY_MAP = [
  { name: "Makeup", slug: "makeup", subs: ["Face Primer", "Concealer", "Foundation", "Compact Powder", "Contour", "Loose Powder", "Blush", "BB & CC Cream", "Highlighter", "Makeup Remover", "Kajal", "Eyeliner", "Mascara", "Eye Shadow", "Eyebrow Gel", "Eye Primer", "False Eyelashes", "Lipstick", "Liquid Lipstick", "Lip Crayon", "Lip Gloss", "Lip Liner", "Lip Plumper", "Lip Balm", "Lip Stain", "Nail Polish", "Nail Art", "Nail Polish Sets", "Nail Care", "Nail Polish Remover", "Face Brush", "Blush Brush", "Brush Sets", "Eye Brush", "Eyelash Curler", "Makeup Pouch"] },
  { name: "Skin", slug: "skincare", subs: ["Face Wash", "Cleansing Oil", "Micellar Water", "Face Scrub", "Cleansing Balm", "Day Cream", "Night Cream", "Face Gel", "Body Lotion", "Body Butter", "Face Serum", "Sheet Mask", "Face Toner", "Sunscreen", "Acne Patch", "Acne Treatment", "Anti Aging", "Dry Skin", "Brightening", "Pore Care"] },
  { name: "Hair", slug: "haircare", subs: ["Shampoo", "Dry Shampoo", "Clarifying Shampoo", "Co-wash", "Conditioner", "Leave-In Conditioner", "Hair Mask", "Hair Cream", "Coconut Oil", "Argan Oil", "Castor Oil", "Onion Hair Oil", "Herbal Oil", "Hair Fall", "Dandruff", "Dry & Frizzy Hair", "Damaged Hair Recovery"] },
  { name: "Personal Care", slug: "personal-care", subs: ["Body Wash", "Shower Gel", "Soap Bar", "Body Scrub", "Bath Salts", "Body Lotion", "Body Cream", "Body Oil", "Foot Care", "Hand Cream", "Deodorants", "Body Spray", "Oral Care", "Feminine Hygiene", "Hand Sanitizer"] },
  { name: "Mom & Baby", slug: "mom-baby", subs: ["Baby Skin", "Baby Hair", "Baby Bath", "Mom Care", "Baby Wash", "Baby Shampoo", "Baby Lotion", "Baby Oil", "Baby Powder", "Baby Wipes", "Baby Diapers", "Nappy Cream", "Baby Detergent", "Stretch Mark Cream", "Maternity Pads", "Nursing Care", "Mom Supplements"] },
  { name: "Fragrance", slug: "fragrance", subs: ["Women Fragrance", "Men Fragrance", "Unisex", "Body Mist", "Eau De Parfum", "Eau De Toilette", "Gift Sets", "Cologne", "Mens EDP", "Body Spray", "Aftershave", "Floral notes", "Woody notes", "Citrus notes", "Spicy notes"] },
  { name: "Undergarments", slug: "undergarments", subs: ["Bra", "Panty", "Shapewear", "T-Shirt Bra", "Sports Bra", "Lace Bra", "Strapless Bra", "Push Up Bra", "Cotton Panty", "Hipster", "Bikini", "Seamless Panty", "Panty Packs", "Tummy Shaper", "Thigh Shaper", "Body Shaper Briefs"] },
  { name: "Combo", slug: "combo", subs: ["Skin Combos", "Makeup Combos", "Hair Combos", "Acne Clearance Combo", "Brightening Kit", "Anti-Aging Regimen", "Everyday Makeup Kit", "Bridal Glow Combo", "Party Glam Kit", "Hair Fall Defense Trio", "Dandruff Solution Combo", "Smooth & Shine Kit"] },
  { name: "Jewellery", slug: "jewellery", subs: ["Earrings", "Necklace", "Bracelet", "Ring", "Jhumkas", "Studs", "Hoop Earrings", "Drop Earrings", "Ear Cuffs", "Chokers", "Pendant Necklaces", "Pearl Necklaces", "Layered Chains", "Bangles", "Charm Bracelets", "Adjustable Rings", "Finger Rings"] },
  { name: "Clearance Sale", slug: "clearance-sale", subs: ["Makeup Deals", "Skincare Deals", "Haircare Deals", "Lipsticks under 499", "Palettes at 40% Off", "Face products deals", "Serums Flat 30% Off", "Cleansers B1G1", "Sheet masks packs", "Hair Oils Flat 20% Off", "Hair Masques Deals", "Shampoo Combs Packs"] },
  { name: "Men", slug: "men", subs: ["Grooming", "Hygiene", "Skincare", "Mens Face Wash", "Shaving Gel & Foam", "Beard Oil & Cream", "Aftershave Balm", "Anti Hair Fall Shampoo", "Anti Dandruff Shampoo", "Hair Styling Wax", "Hair Styling Gel", "Mens Deodorants", "Mens Body Spray", "Mens Cologne", "Mens Body Wash"] }
];

function stripHtml(html: string | null): string {
  if (!html) return "";
  return html
    .replace(/<\/p>/g, "\n\n")
    .replace(/<br\s*\/?>/g, "\n")
    .replace(/<[^>]+>/g, "")
    .trim();
}

async function main() {
  console.log("Reading raw products file...");
  const filePath = "C:\\Users\\skhan\\.gemini\\antigravity-ide\\brain\\973ef02a-b64b-4f4d-9575-c9341a0080d4\\.system_generated\\steps\\165\\content.md";
  const rawContent = fs.readFileSync(filePath, "utf-8");

  // Find where JSON data starts
  const delimiterIndex = rawContent.indexOf("---");
  if (delimiterIndex === -1) {
    throw new Error("Could not find delimiter in file");
  }

  const jsonText = rawContent.substring(delimiterIndex + 3).trim();
  const wcProducts = JSON.parse(jsonText);
  console.log(`Found ${wcProducts.length} products to import.`);

  console.log("Cleaning database tables...");
  // Clear existing product data
  await prisma.orderItem.deleteMany({});
  await prisma.review.deleteMany({});
  await prisma.productImage.deleteMany({});
  await prisma.variant.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.brand.deleteMany({});
  await prisma.category.deleteMany({});
  console.log("Database cleared.");

  // Pre-populate Categories and Subcategories
  console.log("Creating categories and subcategories...");
  const categoryDbMap = new Map<string, any>(); // key: Name (lowercase) -> db category object

  for (const cat of CATEGORY_MAP) {
    const parentKey = cat.name.toLowerCase();
    let dbParent = categoryDbMap.get(parentKey);
    if (!dbParent) {
      dbParent = await prisma.category.create({
        data: {
          name: cat.name,
          imageUrl: null,
        },
      });
      categoryDbMap.set(parentKey, dbParent);
    }

    // Create subcategories
    for (const sub of cat.subs) {
      const subKey = sub.toLowerCase();
      let dbSub = categoryDbMap.get(subKey);
      if (!dbSub) {
        dbSub = await prisma.category.create({
          data: {
            name: sub,
            parentId: dbParent.id,
            imageUrl: null,
          },
        });
        categoryDbMap.set(subKey, dbSub);
      }
    }
  }
  console.log("Categories and subcategories initialized.");

  // Cache for Brands to avoid multiple writes
  const brandDbMap = new Map<string, any>();

  console.log("Importing products...");
  for (const wp of wcProducts) {
    // 1. Determine Brand
    let brandId: string;
    const wpBrand = wp.brands && wp.brands[0];
    const brandName = wpBrand ? wpBrand.name : "Generic";
    const brandKey = brandName.toLowerCase();

    if (brandDbMap.has(brandKey)) {
      brandId = brandDbMap.get(brandKey).id;
    } else {
      const dbBrand = await prisma.brand.create({
        data: {
          name: brandName,
          isTopBrand: wpBrand ? true : false,
        },
      });
      brandDbMap.set(brandKey, dbBrand);
      brandId = dbBrand.id;
    }

    // 2. Determine Category
    let categoryId: string | null = null;
    const wpCategories = wp.categories || [];
    
    // First, look for a matching subcategory
    for (const wc of wpCategories) {
      const match = categoryDbMap.get(wc.name.toLowerCase());
      if (match && match.parentId) { // If it is a subcategory (has parentId)
        categoryId = match.id;
        break;
      }
    }

    // If no subcategory matches, look for matching parent category
    if (!categoryId) {
      for (const wc of wpCategories) {
        const nameLower = wc.name.toLowerCase();
        let targetKey = nameLower;
        if (nameLower === "skincare") targetKey = "skin";
        if (nameLower === "haircare") targetKey = "hair";

        const match = categoryDbMap.get(targetKey);
        if (match && !match.parentId) {
          categoryId = match.id;
          break;
        }
      }
    }

    // Fallback to the first available category, or default to Makeup
    if (!categoryId) {
      const defaultCat = categoryDbMap.get("makeup");
      categoryId = defaultCat ? defaultCat.id : "";
    }

    // 3. Create Product
    const desc = stripHtml(wp.description);
    const shortDesc = stripHtml(wp.short_description);

    const product = await prisma.product.create({
      data: {
        name: wp.name,
        description: desc || shortDesc || "No description available.",
        brandId,
        categoryId,
        status: "Active",
      },
    });

    // 4. Create Product Images
    if (wp.images && wp.images.length > 0) {
      for (let i = 0; i < wp.images.length; i++) {
        await prisma.productImage.create({
          data: {
            productId: product.id,
            url: wp.images[i].src,
            isPrimary: i === 0,
          },
        });
      }
    }

    // 5. Create Variants
    const regPrice = parseFloat(wp.prices.regular_price) / 100;
    const salePrice = wp.on_sale ? parseFloat(wp.prices.sale_price) / 100 : null;

    if (wp.variations && wp.variations.length > 0) {
      for (let j = 0; j < wp.variations.length; j++) {
        const v = wp.variations[j];
        const vName = v.attributes.map((a: any) => a.value).join(" / ");
        await prisma.variant.create({
          data: {
            productId: product.id,
            name: vName || `Variant ${j + 1}`,
            price: regPrice,
            discountPrice: salePrice,
            stock: wp.is_in_stock ? 50 : 0,
            sku: wp.sku ? `${wp.sku}-${v.id}` : `${wp.slug}-${v.id}`,
          },
        });
      }
    } else {
      // Create single default variant
      await prisma.variant.create({
        data: {
          productId: product.id,
          name: "Default",
          price: regPrice,
          discountPrice: salePrice,
          stock: wp.is_in_stock ? 50 : 0,
          sku: wp.sku || `${wp.slug}-default`,
        },
      });
    }
  }

  console.log("Import completed successfully!");
}

main()
  .catch((e) => {
    console.error("Import failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
