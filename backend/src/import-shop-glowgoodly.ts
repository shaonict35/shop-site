import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import dotenv from "dotenv";

dotenv.config();

const dbUrl = process.env.DATABASE_URL || "file:./dev.db";
const adapter = new PrismaLibSql({ url: dbUrl });
const prisma = new PrismaClient({ adapter });

function decodeHtmlEntities(text: string): string {
  if (!text) return "";
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#8217;/g, "'")
    .replace(/&#8211;/g, "-")
    .replace(/&#8212;/g, "—")
    .replace(/<[^>]*>?/gm, "") // strip HTML tags
    .trim();
}

// Common cosmetic shade color mapping for known shade names/numbers
const SHADE_COLOR_MAP: Record<string, string> = {
  "nude": "#D39E82",
  "pink": "#FF69B4",
  "red": "#DC143C",
  "ruby": "#9B111E",
  "cherry": "#D2042D",
  "coral": "#FF7F50",
  "peach": "#FFCBA4",
  "berry": "#8A0030",
  "plum": "#8E4585",
  "mauve": "#E0B0FF",
  "brown": "#8B4513",
  "rose": "#FF007F",
  "beige": "#F5F5DC",
  "caramel": "#C68E17",
  "chocolate": "#7B3F00",
  "bronze": "#CD7F32",
  "gold": "#FFD700",
  "maroon": "#800000",
  "crimson": "#DC143C",
  "burgundy": "#800020",
  "terracotta": "#E2725B",
  "tan": "#D2B48C",
  "ivory": "#FFFFF0",
  "sand": "#C2B280",
  "honey": "#E2A76F",
  "amber": "#FFBF00",
  "mocha": "#967969",
  "espresso": "#4B382A"
};

function deriveShadeColor(name: string): string | null {
  const text = name.toLowerCase();
  const hexMatch = text.match(/#([0-9a-f]{6})/i);
  if (hexMatch) return `#${hexMatch[1]}`;

  for (const [key, hex] of Object.entries(SHADE_COLOR_MAP)) {
    if (text.includes(key)) return hex;
  }

  const numMatch = text.match(/(?:shade|no\.?|#)\s*(\d+)/i);
  if (numMatch) {
    const num = parseInt(numMatch[1], 10);
    const hues = [0, 15, 30, 45, 330, 345, 350, 10, 25, 340];
    const hue = hues[num % hues.length];
    return `hsl(${hue}, 70%, 45%)`;
  }
  return null;
}

async function main() {
  console.log("=== STARTING IMPORT FROM SHOP.GLOWGOODLY.COM ===");

  let page = 1;
  let totalImported = 0;
  let totalUpdated = 0;

  while (true) {
    console.log(`Fetching page ${page} from shop.glowgoodly.com...`);
    const apiUrl = `https://shop.glowgoodly.com/wp-json/wc/store/v1/products?per_page=100&page=${page}`;
    
    let res: Response;
    try {
      res = await fetch(apiUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) GlowGoodlyImporter/1.0"
        }
      });
    } catch (e: any) {
      console.error(`Failed to fetch page ${page}:`, e.message);
      break;
    }

    if (!res.ok) {
      console.log(`End of pages or error at page ${page} (Status ${res.status})`);
      break;
    }

    const products: any[] = await res.json();
    if (!Array.isArray(products) || products.length === 0) {
      console.log("No more products found.");
      break;
    }

    for (const item of products) {
      const prodName = decodeHtmlEntities(item.name || "Untitled Product");
      const description = decodeHtmlEntities(item.description || item.short_description || prodName);
      
      // Calculate Price
      const minorUnit = item.prices?.currency_minor_unit ?? 2;
      const divisor = Math.pow(10, minorUnit);
      const rawPrice = Number(item.prices?.regular_price || item.prices?.price || 0) / divisor;
      const rawSalePrice = item.prices?.sale_price ? Number(item.prices.sale_price) / divisor : null;
      const price = rawPrice > 0 ? rawPrice : 500;
      const discountPrice = (rawSalePrice && rawSalePrice < price) ? rawSalePrice : null;

      // Extract Category
      let categoryName = "Makeup";
      if (item.categories && item.categories.length > 0) {
        categoryName = decodeHtmlEntities(item.categories[0].name);
      }

      // Upsert Category
      const category = await prisma.category.upsert({
        where: { name: categoryName },
        update: {},
        create: { name: categoryName }
      });

      // Extract Brand from title or attributes
      let brandName = "GlowGoodly";
      if (item.attributes && Array.isArray(item.attributes)) {
        const brandAttr = item.attributes.find((a: any) => a.name.toLowerCase() === "brand");
        if (brandAttr && brandAttr.terms && brandAttr.terms.length > 0) {
          brandName = decodeHtmlEntities(brandAttr.terms[0].name);
        }
      }
      if (brandName === "GlowGoodly") {
        const parts = prodName.split(" ");
        if (parts.length > 1) {
          const potentialBrand = parts[0].trim();
          if (["CeraVe", "COSRX", "Nivea", "Garnier", "Maybelline", "L'Oreal", "Dove", "Simple", "The Ordinary", "Colorbar", "Topface", "Imagic", "Lily"].includes(potentialBrand)) {
            brandName = potentialBrand;
          }
        }
      }

      const logoUrl = `https://logo.clearbit.com/${brandName.toLowerCase().replace(/[^a-z0-9]/g, "")}.com`;
      const brand = await prisma.brand.upsert({
        where: { name: brandName },
        update: { logoUrl },
        create: { name: brandName, logoUrl, isTopBrand: true }
      });

      // Upsert Product
      let product = await prisma.product.findFirst({
        where: { name: prodName }
      });

      const metaTitle = `${prodName} | Buy Authentic online at GlowGoodly`;
      const metaDescription = `Buy 100% authentic ${prodName} by ${brandName}. Price: BDT ${price}. Fast delivery across Bangladesh.`;
      const metaKeywords = `${brandName}, ${categoryName}, ${prodName}, authentic cosmetics BD`;

      if (!product) {
        product = await prisma.product.create({
          data: {
            name: prodName,
            description,
            metaTitle,
            metaDescription,
            metaKeywords,
            brandId: brand.id,
            categoryId: category.id,
            status: "Active"
          }
        });
        totalImported++;
      } else {
        await prisma.product.update({
          where: { id: product.id },
          data: {
            description,
            brandId: brand.id,
            categoryId: category.id,
            status: "Active"
          }
        });
        totalUpdated++;
      }

      // Add Product Images
      if (item.images && Array.isArray(item.images) && item.images.length > 0) {
        await prisma.productImage.deleteMany({ where: { productId: product.id } });
        for (let i = 0; i < item.images.length; i++) {
          const imgObj = item.images[i];
          if (imgObj.src) {
            await prisma.productImage.create({
              data: {
                productId: product.id,
                url: imgObj.src,
                isPrimary: i === 0
              }
            });
          }
        }
      }

      // Create Variants / Shades
      await prisma.variant.deleteMany({ where: { productId: product.id } });

      let createdVariant = false;

      // Check if product has variations/attributes
      if (item.attributes && Array.isArray(item.attributes)) {
        const shadeAttr = item.attributes.find((a: any) => 
          a.name.toLowerCase().includes("shade") || a.name.toLowerCase().includes("color") || a.name.toLowerCase().includes("variant")
        );

        if (shadeAttr && shadeAttr.terms && shadeAttr.terms.length > 0) {
          for (let sIdx = 0; sIdx < shadeAttr.terms.length; sIdx++) {
            const term = shadeAttr.terms[sIdx];
            const shadeName = decodeHtmlEntities(term.name);
            const shadeColor = deriveShadeColor(shadeName) || deriveShadeColor(prodName);
            const skuCode = `GG-${item.id}-${sIdx + 1}`;

            await prisma.variant.create({
              data: {
                productId: product.id,
                name: shadeName,
                shadeColor,
                price,
                discountPrice,
                stock: 25,
                sku: skuCode
              }
            });
            createdVariant = true;
          }
        }
      }

      if (!createdVariant) {
        // Fallback default variant with shade detection if applicable
        const shadeColor = deriveShadeColor(prodName);
        const skuCode = `GG-WP-${item.id}`;

        await prisma.variant.create({
          data: {
            productId: product.id,
            name: "Default Variant",
            shadeColor,
            price,
            discountPrice,
            stock: 50,
            sku: skuCode
          }
        });
      }
    }

    page++;
  }

  console.log("=== IMPORT FROM SHOP.GLOWGOODLY.COM COMPLETE ===");
  console.log({ totalImported, totalUpdated });
}

main()
  .catch((e) => {
    console.error("Import failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
