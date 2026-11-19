import prisma from "./prisma";
import bcrypt from "bcryptjs";

async function main() {
  console.log("Seeding started...");

  // 1. Create Default Admin User
  const adminEmail = "admin@glowgoodly.com";
  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash("admin123", 10);
    await prisma.user.create({
      data: {
        name: "GlowGoodly Admin",
        email: adminEmail,
        passwordHash,
        role: "SuperAdmin",
        status: "Active",
      },
    });
    console.log("Admin user created.");
  }

  // 2. Create Categories
  const skincare = await prisma.category.upsert({
    where: { name: "Skincare" },
    update: {},
    create: {
      name: "Skincare",
      imageUrl: "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=400&q=80",
    },
  });

  const makeup = await prisma.category.upsert({
    where: { name: "Makeup" },
    update: {},
    create: {
      name: "Makeup",
      imageUrl: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=400&q=80",
    },
  });

  const haircare = await prisma.category.upsert({
    where: { name: "Haircare" },
    update: {},
    create: {
      name: "Haircare",
      imageUrl: "https://images.unsplash.com/photo-1527799822367-a2505d994344?w=400&q=80",
    },
  });

  console.log("Categories created.");

  // 3. Create Brands
  const cerave = await prisma.brand.upsert({
    where: { name: "CeraVe" },
    update: {},
    create: { name: "CeraVe", logoUrl: "https://upload.wikimedia.org/wikipedia/commons/0/07/CeraVe_logo.svg", isTopBrand: true },
  });

  const ordinary = await prisma.brand.upsert({
    where: { name: "The Ordinary" },
    update: {},
    create: { name: "The Ordinary", logoUrl: "https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=400&q=80", isTopBrand: true },
  });

  const loreal = await prisma.brand.upsert({
    where: { name: "L'Oreal" },
    update: {},
    create: { name: "L'Oreal", logoUrl: "https://upload.wikimedia.org/wikipedia/commons/9/9d/L%27Or%C3%A9al_logo.svg", isTopBrand: true },
  });

  console.log("Brands created.");

  // 4. Create Products & Variants
  // Product 1: Moisturizer (Skincare)
  const p1 = await prisma.product.create({
    data: {
      name: "CeraVe Moisturizing Cream",
      description: "Developed with dermatologists, CeraVe Moisturizing Cream has a unique formula that provides 24-hour hydration and helps restore the protective skin barrier with three essential ceramides (1, 3, 6-II).",
      ingredients: "Aqua / Water / Eau, Glycerin, Cetearyl Alcohol, Caprylic/Capric Triglyceride, Cetyl Alcohol, Ceteareth-20, Petrolatum, Potassium Phosphate, Ceramides NP, AP, EOP.",
      howToUse: "Apply liberally as often as needed, or as directed by a physician. Suitable for use on face, body, and hands.",
      brandId: cerave.id,
      categoryId: skincare.id,
      status: "Active",
      images: {
        create: [
          { url: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&q=80", isPrimary: true },
          { url: "https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=600&q=80", isPrimary: false }
        ]
      },
      variants: {
        create: [
          { name: "177ml / 6 oz Tub", sizeValue: "177ml", price: 1200, discountPrice: 1050, stock: 50, sku: "CERA-MC-177" },
          { name: "340ml / 12 oz Tub", sizeValue: "340ml", price: 2100, discountPrice: 1950, stock: 30, sku: "CERA-MC-340" }
        ]
      }
    }
  });

  // Product 2: Serum (Skincare)
  const p2 = await prisma.product.create({
    data: {
      name: "The Ordinary Niacinamide 10% + Zinc 1%",
      description: "Niacinamide (Vitamin B3) is indicated to reduce the appearance of skin blemishes and congestion. A high 10% concentration of this vitamin is supported in the formula by zinc salt of pyrrolidone carboxylic acid to balance visible aspects of sebum activity.",
      ingredients: "Aqua (Water), Niacinamide, Pentylene Glycol, Zinc PCA, Dimethyl Isosorbide, Tamarindus Indica Seed Gum, Xanthan Gum, Isoceteth-20, Ethoxydiglycol, Phenoxyethanol, Chlorphenesin.",
      howToUse: "Apply a few drops to the entire face in the morning and evening before heavier creams.",
      brandId: ordinary.id,
      categoryId: skincare.id,
      status: "Active",
      images: {
        create: [
          { url: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&q=80", isPrimary: true }
        ]
      },
      variants: {
        create: [
          { name: "30ml Bottle", sizeValue: "30ml", price: 950, discountPrice: 850, stock: 100, sku: "ORD-NIA-30" },
          { name: "60ml Bottle", sizeValue: "60ml", price: 1650, discountPrice: 1500, stock: 45, sku: "ORD-NIA-60" }
        ]
      }
    }
  });

  // Product 3: Lipstick (Makeup - with shade variant colors!)
  const p3 = await prisma.product.create({
    data: {
      name: "L'Oreal Paris Color Riche Lipstick",
      description: "Indulge in richness beyond compare with our most luxuriously rich color and intensely rich hydration. Color Riche Lipstick contains nourishing ingredients like Omega 3 and Vitamin E.",
      ingredients: "Lanolin Liquida / Lanolin Oil, Oleyl Erucate, Sesamum Indicum Oil / Sesame Seed Oil, PPG-5 Lanolin Wax, Acetylated Lanolin, Cera Microcristallina / Microcrystalline Wax.",
      howToUse: "Apply starting in the center of your upper lip. Work from the center to outer edges of your lips, following the contour of your mouth. Then glide across the entire bottom lip.",
      brandId: loreal.id,
      categoryId: makeup.id,
      status: "Active",
      images: {
        create: [
          { url: "https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=600&q=80", isPrimary: true }
        ]
      },
      variants: {
        create: [
          { name: "Shade 125 Maison Marais", shadeColor: "#B22222", price: 1100, discountPrice: 950, stock: 25, sku: "LOR-CR-125" },
          { name: "Shade 302 Bois de Rose", shadeColor: "#C71585", price: 1100, discountPrice: 990, stock: 15, sku: "LOR-CR-302" },
          { name: "Shade 630 Beige A Nu", shadeColor: "#D2B48C", price: 1100, stock: 20, sku: "LOR-CR-630" }
        ]
      }
    }
  });

  console.log("Products and Variants created.");

  // 5. Default Integration Settings (Dynamic Configs)
  const defaultSettings = [
    // Meta & Google
    { key: "META_PIXEL_ID", value: "" },
    { key: "META_CAPI_TOKEN", value: "" },
    { key: "GA4_MEASUREMENT_ID", value: "" },
    { key: "GTM_CONTAINER_ID", value: "" },
    // SMS Gateway
    { key: "SMS_PROVIDER_URL", value: "https://api.sms-gateway.com/send" },
    { key: "SMS_API_KEY", value: "" },
    { key: "SMS_SENDER_ID", value: "GLOWGOODLY" },
    { key: "SMS_TEMPLATE_ORDER_PLACED", value: "Hi [CustomerName], your order [OrderNumber] of BDT [Total] has been placed successfully. Thank you!" },
    { key: "SMS_TEMPLATE_ORDER_SHIPPED", value: "Hi [CustomerName], your order [OrderNumber] has been shipped. Track your order here: [TrackingLink]" },
    // Courier API
    { key: "COURIER_PROVIDER", value: "Steadfast" }, // Pathao or Steadfast
    { key: "COURIER_API_SECRET", value: "" },
    { key: "COURIER_CLIENT_ID", value: "" },
    { key: "COURIER_STORE_ID", value: "" },
    // Payment Gateway
    { key: "PAYMENT_MERCHANT_ID", value: "" },
    { key: "PAYMENT_PASSWORD", value: "" },
  ];

  for (const s of defaultSettings) {
    await prisma.setting.upsert({
      where: { key: s.key },
      update: {},
      create: s,
    });
  }

  console.log("Default integration settings initialized.");
  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
