import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import dotenv from "dotenv";

dotenv.config();

const dbUrl = process.env.DATABASE_URL || "file:./dev.db";
const adapter = new PrismaLibSql({ url: dbUrl });
const prisma = new PrismaClient({ adapter });

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

function deriveShadeColor(variantName: string, productName: string): string | null {
  const text = `${variantName} ${productName}`.toLowerCase();
  
  // 1. Try to find hex code if explicitly present like #FF0055
  const hexMatch = text.match(/#([0-9a-f]{6})/i);
  if (hexMatch) return `#${hexMatch[1]}`;

  // 2. Try matching color keywords
  for (const [key, hex] of Object.entries(SHADE_COLOR_MAP)) {
    if (text.includes(key)) {
      return hex;
    }
  }

  // 3. Deterministic color generation based on shade number if present
  const numMatch = text.match(/(?:shade|no\.?|#)\s*(\d+)/i);
  if (numMatch) {
    const num = parseInt(numMatch[1], 10);
    const hues = [0, 15, 30, 45, 330, 345, 350, 10, 25, 340];
    const hue = hues[num % hues.length];
    const sat = 65 + (num * 7) % 30;
    const light = 40 + (num * 11) % 35;
    return `hsl(${hue}, ${sat}%, ${light}%)`;
  }

  return null;
}

const CATEGORY_HIERARCHY: Record<string, string[]> = {
  "Makeup": [
    "Face Primer", "Concealer", "Foundation", "Compact Powder", "Contour", "Loose Powder", "Blush", "BB & CC Cream", "Highlighter", "Makeup Remover",
    "Kajal", "Eyeliner", "Mascara", "Eye Shadow", "Eyebrow Gel", "Eye Primer", "False Eyelashes",
    "Lipstick", "Liquid Lipstick", "Lip Crayon", "Lip Gloss", "Lip Liner", "Lip Plumper", "Lip Balm", "Lip Stain",
    "Nail Polish", "Nail Art", "Nail Polish Sets", "Nail Care", "Nail Polish Remover",
    "Face Brush", "Blush Brush", "Brush Sets", "Eye Brush", "Eyelash Curler", "Makeup Pouch"
  ],
  "Skin": [
    "Face Wash", "Cleansing Oil", "Micellar Water", "Face Scrub", "Cleansing Balm",
    "Day Cream", "Night Cream", "Face Gel", "Body Lotion", "Body Butter",
    "Face Serum", "Sheet Mask", "Face Toner", "Sunscreen", "Acne Patch",
    "Acne Treatment", "Anti Aging", "Dry Skin", "Brightening", "Pore Care"
  ],
  "Hair": [
    "Shampoo", "Dry Shampoo", "Clarifying Shampoo", "Co-wash",
    "Conditioner", "Leave-In Conditioner", "Hair Mask", "Hair Cream",
    "Coconut Oil", "Argan Oil", "Castor Oil", "Onion Hair Oil", "Herbal Oil",
    "Hair Fall", "Dandruff", "Dry & Frizzy Hair", "Damaged Hair Recovery"
  ],
  "Personal Care": [
    "Deodorant", "Roll-on", "Body Spray", "Intimate Wash", "Hand Sanitizer",
    "Body Wash", "Bar Soap", "Shower Gel",
    "Toothpaste", "Toothbrush", "Mouthwash", "Dental Floss",
    "Sanitary Napkin", "Panty Liner", "Menstrual Cup", "Feminine Wash"
  ],
  "Mom & Baby": [
    "Baby Lotion", "Baby Oil", "Baby Wash", "Diaper Cream",
    "Stretch Mark Cream", "Nursing Pads", "Nipple Cream",
    "Baby Shampoo", "Baby Powder", "Baby Sunscreen", "Wipes",
    "Pregnancy Supplements", "Lactation Support"
  ],
  "Fragrance": [
    "Womens Perfume", "Mens Cologne", "Unisex Fragrance",
    "Attar", "Body Mist", "Perfume Gift Set",
    "Roll-On Perfume", "Solid Perfume", "Hair Mist"
  ],
  "Men": [
    "Grooming", "Hygiene", "Skincare",
    "Mens Face Wash", "Shaving Gel & Foam", "Beard Oil & Cream", "Aftershave Balm",
    "Anti Hair Fall Shampoo", "Anti Dandruff Shampoo", "Hair Styling Wax", "Hair Styling Gel",
    "Mens Deodorants", "Mens Body Spray", "Mens Cologne", "Mens Body Wash"
  ],
  "Combo": [
    "Skin Combos", "Makeup Combos", "Hair Combos",
    "Acne Clearance Combo", "Brightening Kit", "Anti-Aging Regimen",
    "Everyday Makeup Kit", "Bridal Glow Combo", "Party Glam Kit"
  ],
  "Clearance Sale": [
    "Makeup Deals", "Skincare Deals", "Haircare Deals",
    "Lipsticks under 499", "Palettes at 40% Off", "Face products deals"
  ]
};

async function main() {
  console.log("=== STEP 1: Setting up Category Hierarchy ===");
  for (const [parentName, subNames] of Object.entries(CATEGORY_HIERARCHY)) {
    const parentCat = await prisma.category.upsert({
      where: { name: parentName },
      update: {},
      create: { name: parentName }
    });

    for (const subName of subNames) {
      await prisma.category.upsert({
        where: { name: subName },
        update: { parentId: parentCat.id },
        create: { name: subName, parentId: parentCat.id }
      });
    }
  }
  console.log("Category hierarchy configured successfully.");

  console.log("=== STEP 2: Processing Products & Updating Shades ===");
  const products = await prisma.product.findMany({
    include: {
      category: true,
      variants: true
    }
  });

  let updatedShadesCount = 0;

  for (const prod of products) {
    const isCosmeticCategory = [
      "Lipstick", "Liquid Lipstick", "Lip Crayon", "Lip Gloss", "Lip Liner", "Lip Balm", "Lip Stain",
      "Foundation", "Concealer", "Blush", "Compact Powder", "Highlighter", "Contour",
      "Eye Shadow", "Eyeliner", "Kajal", "Nail Polish", "Nail Polish Sets", "Makeup"
    ].some(c => prod.category.name.toLowerCase().includes(c.toLowerCase()) || prod.name.toLowerCase().includes(c.toLowerCase()));

    for (const variant of prod.variants) {
      if (!variant.shadeColor && (isCosmeticCategory || variant.name !== "Default")) {
        const color = deriveShadeColor(variant.name, prod.name);
        if (color) {
          await prisma.variant.update({
            where: { id: variant.id },
            data: { shadeColor: color }
          });
          updatedShadesCount++;
        }
      }
    }
  }

  console.log(`Updated ${updatedShadesCount} product variants with shade colors.`);

  console.log("=== STEP 3: Ensuring Category-wise Product Distribution ===");
  const categories = await prisma.category.findMany({
    include: { _count: { select: { products: true } } }
  });

  const emptyCategories = categories.filter(c => c._count.products === 0);
  console.log(`Found ${emptyCategories.length} categories needing product population.`);

  for (const cat of emptyCategories) {
    let sampleProducts = await prisma.product.findMany({
      where: {
        OR: [
          { name: { contains: cat.name } },
          { description: { contains: cat.name } }
        ]
      },
      take: 6
    });

    if (sampleProducts.length === 0 && cat.parentId) {
      const parent = await prisma.category.findUnique({ where: { id: cat.parentId } });
      if (parent) {
        sampleProducts = await prisma.product.findMany({
          where: { categoryId: parent.id },
          take: 6
        });
      }
    }

    if (sampleProducts.length > 0) {
      for (const sp of sampleProducts) {
        await prisma.product.update({
          where: { id: sp.id },
          data: { categoryId: cat.id }
        });
      }
    }
  }

  const finalProductCount = await prisma.product.count();
  const finalVariantCount = await prisma.variant.count();
  const finalShadeCount = await prisma.variant.count({ where: { shadeColor: { not: null } } });

  console.log("=== SUMMARY ===");
  console.log({
    finalProductCount,
    finalVariantCount,
    finalShadeCount
  });
}

main()
  .catch((e) => {
    console.error("Error running seed script:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
