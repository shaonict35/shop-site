import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import dotenv from "dotenv";

dotenv.config();

const dbUrl = process.env.DATABASE_URL || "file:./dev.db";
const adapter = new PrismaLibSql({ url: dbUrl });
const prisma = new PrismaClient({ adapter });

const PARENT_MAPPING: Record<string, string[]> = {
  "Makeup": [
    "Contour", "BB & CC cream", "BB & CC Cream", "Lip Plumper", "Lip Balm", "Lip Stain",
    "Nail Polish", "Nail Art", "Nail Polish Sets", "Nail Care", "Nail Polish Remover",
    "Face Brush", "Blush Brush", "Brush Sets", "Eye Brush", "Eyelash Curler", "Makeup Pouch",
    "Face Primer", "Concealer", "Foundation", "Compact Powder", "Loose Powder", "Blush",
    "Highlighter", "Makeup Remover", "Kajal", "Eyeliner", "Mascara", "Eye Shadow",
    "Eyebrow Gel", "Eye Primer", "False Eyelashes", "Lipstick", "Liquid Lipstick",
    "Lip Crayon", "Lip Gloss", "Lip Liner"
  ],
  "Skin": [
    "Face Scrub", "Cleansing Balm", "Day Cream", "Night Cream", "Face Gel", "Body Lotion",
    "Body Butter", "Face Serum", "Sheet Mask", "Face Toner", "Sunscreen", "Acne Patch",
    "Acne Treatment", "Anti Aging", "Dry Skin", "Brightening", "Pore Care", "Face Wash",
    "Cleansing Oil", "Micellar Water"
  ],
  "Hair": [
    "Shampoo", "Dry Shampoo", "Clarifying Shampoo", "Co-wash", "Conditioner",
    "Leave-In Conditioner", "Hair Mask", "Hair Cream", "Coconut Oil", "Argan Oil",
    "Castor Oil", "Onion Hair Oil", "Herbal Oil", "Hair Fall", "Dandruff",
    "Dry & Frizzy Hair", "Damaged Hair Recovery"
  ],
  "Personal care": [
    "Deodorant", "Roll-on", "Body Spray", "Intimate Wash", "Hand Sanitizer", "Body Wash",
    "Bar Soap", "Shower Gel", "Toothpaste", "Toothbrush", "Mouthwash", "Dental Floss",
    "Sanitary Napkin", "Panty Liner", "Menstrual Cup", "Feminine Wash"
  ]
};

async function fixParents() {
  console.log("🔗 Linking subcategories to Parent Categories in database...");

  for (const [parentName, subs] of Object.entries(PARENT_MAPPING)) {
    // 1. Ensure Parent category exists
    const parentCat = await prisma.category.upsert({
      where: { name: parentName },
      update: {},
      create: { name: parentName }
    });

    for (const subName of subs) {
      // Find category by subName case-insensitively or exact match
      const matchingCats = await prisma.category.findMany({
        where: {
          name: {
            contains: subName
          }
        }
      });

      for (const cat of matchingCats) {
        if (cat.id !== parentCat.id && cat.parentId !== parentCat.id) {
          await prisma.category.update({
            where: { id: cat.id },
            data: { parentId: parentCat.id }
          });
          console.log(`   Linked "${cat.name}" -> Parent "${parentName}"`);
        }
      }
    }
  }

  console.log("✅ Parent Category Linking Complete!");
  process.exit(0);
}

fixParents().catch((e) => {
  console.error("Error linking parents:", e);
  process.exit(1);
});
