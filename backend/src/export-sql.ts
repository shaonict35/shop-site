import prisma from "./prisma";
import fs from "fs";
import path from "path";

function escapeSqlString(str: string | null | undefined): string {
  if (str === null || str === undefined) return "NULL";
  const escaped = str
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "''")
    .replace(/\0/g, "\\0")
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r")
    .replace(/\x1a/g, "\\Z");
  return `'${escaped}'`;
}

function formatDate(date: Date | null | undefined): string {
  if (!date) return "NOW()";
  return escapeSqlString(date.toISOString().slice(0, 19).replace('T', ' '));
}

async function exportSql() {
  console.log("🚀 Generating MySQL SQL Dump from dev.db...");

  let sql = `-- GlowGoodly MySQL Database Dump
-- Compatible with phpMyAdmin / MySQL 5.7+ & 8.0+
SET FOREIGN_KEY_CHECKS = 0;

-- Drop existing tables
DROP TABLE IF EXISTS \`OrderItem\`;
DROP TABLE IF EXISTS \`Order\`;
DROP TABLE IF EXISTS \`Address\`;
DROP TABLE IF EXISTS \`User\`;
DROP TABLE IF EXISTS \`Variant\`;
DROP TABLE IF EXISTS \`ProductImage\`;
DROP TABLE IF EXISTS \`Review\`;
DROP TABLE IF EXISTS \`Product\`;
DROP TABLE IF EXISTS \`Brand\`;
DROP TABLE IF EXISTS \`Category\`;
DROP TABLE IF EXISTS \`PromoBanner\`;
DROP TABLE IF EXISTS \`Setting\`;
DROP TABLE IF EXISTS \`Notification\`;
DROP TABLE IF EXISTS \`Coupon\`;
DROP TABLE IF EXISTS \`Vendor\`;
DROP TABLE IF EXISTS \`Campaign\`;
DROP TABLE IF EXISTS \`InventoryLog\`;
DROP TABLE IF EXISTS \`Visitor\`;
DROP TABLE IF EXISTS \`ChatMessage\`;
DROP TABLE IF EXISTS \`FcmToken\`;
DROP TABLE IF EXISTS \`MenuItem\`;
DROP TABLE IF EXISTS \`CmsPage\`;

-- 1. User
CREATE TABLE \`User\` (
  \`id\` VARCHAR(191) NOT NULL,
  \`name\` VARCHAR(191) NOT NULL,
  \`email\` VARCHAR(191) NOT NULL UNIQUE,
  \`passwordHash\` VARCHAR(191) NOT NULL,
  \`phone\` VARCHAR(191) NULL,
  \`role\` VARCHAR(191) NOT NULL DEFAULT 'Customer',
  \`points\` INT NOT NULL DEFAULT 0,
  \`status\` VARCHAR(191) NOT NULL DEFAULT 'Active',
  \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  \`updatedAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Brand
CREATE TABLE \`Brand\` (
  \`id\` VARCHAR(191) NOT NULL,
  \`name\` VARCHAR(191) NOT NULL UNIQUE,
  \`logoUrl\` TEXT NULL,
  \`isTopBrand\` TINYINT(1) NOT NULL DEFAULT 0,
  \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  \`updatedAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Category
CREATE TABLE \`Category\` (
  \`id\` VARCHAR(191) NOT NULL,
  \`name\` VARCHAR(191) NOT NULL UNIQUE,
  \`imageUrl\` TEXT NULL,
  \`parentId\` VARCHAR(191) NULL,
  \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  \`updatedAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (\`id\`),
  KEY \`parentId\` (\`parentId\`),
  CONSTRAINT \`Category_parentId_fkey\` FOREIGN KEY (\`parentId\`) REFERENCES \`Category\` (\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Product
CREATE TABLE \`Product\` (
  \`id\` VARCHAR(191) NOT NULL,
  \`name\` VARCHAR(191) NOT NULL,
  \`description\` TEXT NOT NULL,
  \`ingredients\` TEXT NULL,
  \`howToUse\` TEXT NULL,
  \`brandId\` VARCHAR(191) NOT NULL,
  \`categoryId\` VARCHAR(191) NOT NULL,
  \`status\` VARCHAR(191) NOT NULL DEFAULT 'Active',
  \`metaTitle\` VARCHAR(191) NULL,
  \`metaDescription\` TEXT NULL,
  \`metaKeywords\` TEXT NULL,
  \`campaignName\` VARCHAR(191) NULL,
  \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  \`updatedAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (\`id\`),
  KEY \`brandId\` (\`brandId\`),
  KEY \`categoryId\` (\`categoryId\`),
  KEY \`status\` (\`status\`),
  KEY \`campaignName\` (\`campaignName\`),
  CONSTRAINT \`Product_brandId_fkey\` FOREIGN KEY (\`brandId\`) REFERENCES \`Brand\` (\`id\`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT \`Product_categoryId_fkey\` FOREIGN KEY (\`categoryId\`) REFERENCES \`Category\` (\`id\`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. ProductImage
CREATE TABLE \`ProductImage\` (
  \`id\` VARCHAR(191) NOT NULL,
  \`productId\` VARCHAR(191) NOT NULL,
  \`url\` TEXT NOT NULL,
  \`isPrimary\` TINYINT(1) NOT NULL DEFAULT 0,
  \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (\`id\`),
  KEY \`productId\` (\`productId\`),
  CONSTRAINT \`ProductImage_productId_fkey\` FOREIGN KEY (\`productId\`) REFERENCES \`Product\` (\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Variant
CREATE TABLE \`Variant\` (
  \`id\` VARCHAR(191) NOT NULL,
  \`productId\` VARCHAR(191) NOT NULL,
  \`name\` VARCHAR(191) NOT NULL,
  \`shadeColor\` VARCHAR(191) NULL,
  \`sizeValue\` VARCHAR(191) NULL,
  \`price\` DOUBLE NOT NULL,
  \`discountPrice\` DOUBLE NULL,
  \`costPrice\` DOUBLE NULL,
  \`stock\` INT NOT NULL DEFAULT 0,
  \`sku\` VARCHAR(191) NOT NULL UNIQUE,
  \`imageUrl\` TEXT NULL,
  \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  \`updatedAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (\`id\`),
  KEY \`productId\` (\`productId\`),
  CONSTRAINT \`Variant_productId_fkey\` FOREIGN KEY (\`productId\`) REFERENCES \`Product\` (\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. PromoBanner
CREATE TABLE \`PromoBanner\` (
  \`id\` VARCHAR(191) NOT NULL,
  \`title\` VARCHAR(191) NOT NULL,
  \`imageUrl\` TEXT NOT NULL,
  \`mobileImageUrl\` TEXT NULL,
  \`tabletImageUrl\` TEXT NULL,
  \`linkUrl\` TEXT NULL,
  \`bgColor\` VARCHAR(191) NOT NULL DEFAULT '#1a1a2e',
  \`page\` VARCHAR(191) NOT NULL DEFAULT 'Homepage',
  \`isActive\` TINYINT(1) NOT NULL DEFAULT 1,
  \`sortOrder\` INT NOT NULL DEFAULT 0,
  \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  \`updatedAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Setting
CREATE TABLE \`Setting\` (
  \`id\` VARCHAR(191) NOT NULL,
  \`key\` VARCHAR(191) NOT NULL UNIQUE,
  \`value\` LONGTEXT NOT NULL,
  \`updatedAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

`;

  // Fetch Brands (deduplicate case-insensitively)
  const rawBrands = await prisma.brand.findMany();
  const brandSeen = new Set<string>();
  const brands = rawBrands.filter(b => {
    const lower = b.name.toLowerCase().trim();
    if (brandSeen.has(lower)) return false;
    brandSeen.add(lower);
    return true;
  });

  console.log(`Exporting ${brands.length} Unique Brands (from ${rawBrands.length})...`);
  if (brands.length > 0) {
    const brandRows = brands.map(b => `(${escapeSqlString(b.id)}, ${escapeSqlString(b.name)}, ${escapeSqlString(b.logoUrl)}, ${b.isTopBrand ? 1 : 0}, ${formatDate(b.createdAt)}, ${formatDate(b.updatedAt)})`);
    for (let i = 0; i < brandRows.length; i += 50) {
      const chunk = brandRows.slice(i, i + 50);
      sql += `INSERT IGNORE INTO \`Brand\` (\`id\`, \`name\`, \`logoUrl\`, \`isTopBrand\`, \`createdAt\`, \`updatedAt\`) VALUES\n` + chunk.join(",\n") + ";\n\n";
    }
  }

  // Fetch Categories (deduplicate case-insensitively)
  const rawCategories = await prisma.category.findMany();
  const categorySeen = new Set<string>();
  const categories = rawCategories.filter(c => {
    const lower = c.name.toLowerCase().trim();
    if (categorySeen.has(lower)) return false;
    categorySeen.add(lower);
    return true;
  });

  console.log(`Exporting ${categories.length} Unique Categories (from ${rawCategories.length})...`);
  if (categories.length > 0) {
    const catRows = categories.map(c => `(${escapeSqlString(c.id)}, ${escapeSqlString(c.name)}, ${escapeSqlString(c.imageUrl)}, ${escapeSqlString(c.parentId)}, ${formatDate(c.createdAt)}, ${formatDate(c.updatedAt)})`);
    for (let i = 0; i < catRows.length; i += 50) {
      const chunk = catRows.slice(i, i + 50);
      sql += `INSERT IGNORE INTO \`Category\` (\`id\`, \`name\`, \`imageUrl\`, \`parentId\`, \`createdAt\`, \`updatedAt\`) VALUES\n` + chunk.join(",\n") + ";\n\n";
    }
  }

  // Fetch Products
  const products = await prisma.product.findMany();
  console.log(`Exporting ${products.length} Products...`);
  if (products.length > 0) {
    const productRows = products.map(p => `(${escapeSqlString(p.id)}, ${escapeSqlString(p.name)}, ${escapeSqlString(p.description)}, ${escapeSqlString(p.ingredients)}, ${escapeSqlString(p.howToUse)}, ${escapeSqlString(p.brandId)}, ${escapeSqlString(p.categoryId)}, ${escapeSqlString(p.status)}, ${escapeSqlString(p.metaTitle)}, ${escapeSqlString(p.metaDescription)}, ${escapeSqlString(p.metaKeywords)}, ${escapeSqlString(p.campaignName)}, ${formatDate(p.createdAt)}, ${formatDate(p.updatedAt)})`);
    
    // Chunk product inserts into 50 rows
    for (let i = 0; i < productRows.length; i += 50) {
      const chunk = productRows.slice(i, i + 50);
      sql += `INSERT IGNORE INTO \`Product\` (\`id\`, \`name\`, \`description\`, \`ingredients\`, \`howToUse\`, \`brandId\`, \`categoryId\`, \`status\`, \`metaTitle\`, \`metaDescription\`, \`metaKeywords\`, \`campaignName\`, \`createdAt\`, \`updatedAt\`) VALUES\n` + chunk.join(",\n") + ";\n\n";
    }
  }

  // Fetch ProductImages
  const images = await prisma.productImage.findMany();
  console.log(`Exporting ${images.length} Product Images...`);
  if (images.length > 0) {
    const imageRows = images.map(img => `(${escapeSqlString(img.id)}, ${escapeSqlString(img.productId)}, ${escapeSqlString(img.url)}, ${img.isPrimary ? 1 : 0}, ${formatDate(img.createdAt)})`);
    for (let i = 0; i < imageRows.length; i += 50) {
      const chunk = imageRows.slice(i, i + 50);
      sql += `INSERT IGNORE INTO \`ProductImage\` (\`id\`, \`productId\`, \`url\`, \`isPrimary\`, \`createdAt\`) VALUES\n` + chunk.join(",\n") + ";\n\n";
    }
  }

  // Fetch Variants
  const rawVariants = await prisma.variant.findMany();
  const skuSeen = new Set<string>();
  const variants = rawVariants.filter(v => {
    const lower = v.sku.toLowerCase().trim();
    if (skuSeen.has(lower)) return false;
    skuSeen.add(lower);
    return true;
  });

  console.log(`Exporting ${variants.length} Unique Variants...`);
  if (variants.length > 0) {
    const variantRows = variants.map(v => `(${escapeSqlString(v.id)}, ${escapeSqlString(v.productId)}, ${escapeSqlString(v.name)}, ${escapeSqlString(v.shadeColor)}, ${escapeSqlString(v.sizeValue)}, ${v.price}, ${v.discountPrice ?? 'NULL'}, ${v.costPrice ?? 'NULL'}, ${v.stock}, ${escapeSqlString(v.sku)}, ${escapeSqlString(v.imageUrl)}, ${formatDate(v.createdAt)}, ${formatDate(v.updatedAt)})`);
    for (let i = 0; i < variantRows.length; i += 50) {
      const chunk = variantRows.slice(i, i + 50);
      sql += `INSERT IGNORE INTO \`Variant\` (\`id\`, \`productId\`, \`name\`, \`shadeColor\`, \`sizeValue\`, \`price\`, \`discountPrice\`, \`costPrice\`, \`stock\`, \`sku\`, \`imageUrl\`, \`createdAt\`, \`updatedAt\`) VALUES\n` + chunk.join(",\n") + ";\n\n";
    }
  }

  // Fetch Banners
  const banners = await prisma.promoBanner.findMany();
  console.log(`Exporting ${banners.length} Banners...`);
  if (banners.length > 0) {
    const bannerRows = banners.map(b => `(${escapeSqlString(b.id)}, ${escapeSqlString(b.title)}, ${escapeSqlString(b.imageUrl)}, ${escapeSqlString((b as any).mobileImageUrl)}, ${escapeSqlString((b as any).tabletImageUrl)}, ${escapeSqlString(b.linkUrl)}, ${escapeSqlString(b.bgColor)}, ${escapeSqlString(b.page)}, ${b.isActive ? 1 : 0}, ${b.sortOrder}, ${formatDate(b.createdAt)}, ${formatDate(b.updatedAt)})`);
    for (let i = 0; i < bannerRows.length; i += 50) {
      const chunk = bannerRows.slice(i, i + 50);
      sql += `INSERT IGNORE INTO \`PromoBanner\` (\`id\`, \`title\`, \`imageUrl\`, \`mobileImageUrl\`, \`tabletImageUrl\`, \`linkUrl\`, \`bgColor\`, \`page\`, \`isActive\`, \`sortOrder\`, \`createdAt\`, \`updatedAt\`) VALUES\n` + chunk.join(",\n") + ";\n\n";
    }
  }

  // Fetch Settings
  const settings = await prisma.setting.findMany();
  console.log(`Exporting ${settings.length} Settings...`);
  if (settings.length > 0) {
    const settingRows = settings.map(s => `(${escapeSqlString(s.id)}, ${escapeSqlString(s.key)}, ${escapeSqlString(s.value)}, ${formatDate(s.updatedAt)})`);
    for (let i = 0; i < settingRows.length; i += 50) {
      const chunk = settingRows.slice(i, i + 50);
      sql += `INSERT IGNORE INTO \`Setting\` (\`id\`, \`key\`, \`value\`, \`updatedAt\`) VALUES\n` + chunk.join(",\n") + ";\n\n";
    }
  }

  sql += `\nSET FOREIGN_KEY_CHECKS = 1;\n-- Export Completed Successfully!\n`;

  const outputPath = path.join(__dirname, "..", "glowgoodly_database_dump.sql");
  fs.writeFileSync(outputPath, sql, "utf-8");
  console.log(`✅ SQL Dump file created successfully at: ${outputPath}`);
}

exportSql().catch(console.error).finally(() => prisma.$disconnect());
