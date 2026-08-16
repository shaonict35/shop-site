import prisma from "./prisma";
import bcrypt from "bcryptjs";

export async function autoSeedDatabase() {
  try {
    // 1. Ensure Default Admin User exists
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
      console.log("🌱 Auto-seed: Default SuperAdmin created (admin@glowgoodly.com / admin123)");
    }

    // 2. Check if catalog data already exists
    const categoryCount = await prisma.category.count();
    const productCount = await prisma.product.count();

    if (categoryCount > 0 && productCount > 0) {
      return;
    }

    console.log("🌱 Auto-seed: Initializing store catalog in MySQL...");

    // 3. Create Categories
    const categoryNames = [
      "Skincare",
      "Makeup",
      "Haircare",
      "Personal Care",
      "Mom & Baby",
      "Fragrance",
      "Undergarments",
      "Combo",
      "Jewellery",
      "Clearance Sale",
      "Men"
    ];

    const categories: Record<string, any> = {};
    for (const name of categoryNames) {
      categories[name] = await prisma.category.upsert({
        where: { name },
        update: {},
        create: {
          name,
          imageUrl: `https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&q=80`
        }
      });
    }

    // 4. Create Top Brands
    const brandNames = [
      "CeraVe", "The Ordinary", "L'Oreal Paris", "COSRX", "Innisfree", 
      "Cetaphil", "Nivea", "Huggies", "Calvin Klein", "Farlin", "Gillette", 
      "Secret", "Olay", "Maybelline", "Revlon"
    ];
    const brands: Record<string, any> = {};
    for (const b of brandNames) {
      brands[b] = await prisma.brand.upsert({
        where: { name: b },
        update: {},
        create: {
          name: b,
          logoUrl: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=100&q=80",
          isTopBrand: true
        }
      });
    }

    // 5. Products Definition List
    const productsToSeed = [
      {
        name: "Maybelline Fit Me Matte Foundation",
        description: "Liquid Foundation with clay formula. Gives a natural, matte finish.",
        brand: "Maybelline",
        category: "Makeup",
        price: 1100,
        discountPrice: 950,
        imgUrl: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600&q=80",
        skuPrefix: "MAY-FND-MAT"
      },
      {
        name: "L'Oreal Infallible Face Primer",
        description: "High-end Face Primer to blur pores and prep skin for makeup.",
        brand: "L'Oreal Paris",
        category: "Makeup",
        price: 1350,
        discountPrice: 1200,
        imgUrl: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&q=80",
        skuPrefix: "LOR-PRM-INF"
      },
      {
        name: "The Ordinary Concealer",
        description: "High-spreadability suspension pigment system Concealer with high coverage.",
        brand: "The Ordinary",
        category: "Makeup",
        price: 900,
        discountPrice: 790,
        imgUrl: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&q=80",
        skuPrefix: "ORD-CON-60"
      },
      {
        name: "Maybelline Superstay Matte Ink Liquid Lipstick",
        description: "Long-lasting Liquid Lipstick in shade Pioneer. Up to 16HR wear.",
        brand: "Maybelline",
        category: "Makeup",
        price: 950,
        discountPrice: 850,
        imgUrl: "https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=600&q=80",
        skuPrefix: "MAY-LIP-SS"
      },
      {
        name: "Maybelline Fit Me Compact Powder",
        description: "Compact Powder to set makeup and control shine for up to 12 hours.",
        brand: "Maybelline",
        category: "Makeup",
        price: 850,
        discountPrice: 750,
        imgUrl: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600&q=80",
        skuPrefix: "MAY-CP-FIT"
      },
      {
        name: "Revlon Velvet Contour & Bronzer Palette",
        description: "Sculpting Contour kit with velvet finish and blendable highlight shades.",
        brand: "Revlon",
        category: "Makeup",
        price: 1450,
        discountPrice: 1300,
        imgUrl: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600&q=80",
        skuPrefix: "REV-CNT-VEL"
      },
      {
        name: "L'Oreal Paris Loose Powder setting powder",
        description: "Translucent Loose Powder to set makeup and blur fine lines.",
        brand: "L'Oreal Paris",
        category: "Makeup",
        price: 1250,
        discountPrice: 1100,
        imgUrl: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&q=80",
        skuPrefix: "LOR-LP-SET"
      },
      {
        name: "Maybelline Fit Me Blush",
        description: "Smooth powder Blush that provides natural, long-lasting color.",
        brand: "Maybelline",
        category: "Makeup",
        price: 890,
        discountPrice: 790,
        imgUrl: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600&q=80",
        skuPrefix: "MAY-BLSH-FIT"
      },
      {
        name: "Olay CC Cream - Daily BB & CC Cream SPF 15",
        description: "Broad-spectrum BB & CC Cream to hydrate, protect, and correct skin tone.",
        brand: "Olay",
        category: "Makeup",
        price: 1850,
        discountPrice: 1650,
        imgUrl: "https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=600&q=80",
        skuPrefix: "OLAY-CC-CRM"
      },
      {
        name: "Maybelline Master Chrome Highlighter",
        description: "Metallic Highlighter powder that melts onto skin for an ultra-reflective glow.",
        brand: "Maybelline",
        category: "Makeup",
        price: 1150,
        discountPrice: 990,
        imgUrl: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&q=80",
        skuPrefix: "MAY-HL-MST"
      },
      {
        name: "L'Oreal Micellar Makeup Remover Water",
        description: "Gentle Makeup Remover water that removes makeup, dirt, and oil in one step.",
        brand: "L'Oreal Paris",
        category: "Makeup",
        price: 950,
        discountPrice: 850,
        imgUrl: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&q=80",
        skuPrefix: "LOR-MRW-GEN"
      },
      {
        name: "L'Oreal Paris Matte Signature Eyeliner",
        description: "Liquid Eyeliner with intense color payoff and waterproof wear.",
        brand: "L'Oreal Paris",
        category: "Makeup",
        price: 1050,
        discountPrice: 950,
        imgUrl: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&q=80",
        skuPrefix: "LOR-EYL-MAT"
      },
      {
        name: "Maybelline Colossal Kajal Extra Black",
        description: "Intense black Kajal enriched with Aloe Vera. Up to 24HR smudgeproof wear.",
        brand: "Maybelline",
        category: "Makeup",
        price: 490,
        discountPrice: 390,
        imgUrl: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&q=80",
        skuPrefix: "MAY-KJL-COL"
      },
      {
        name: "Maybelline Lash Sensational Mascara",
        description: "Volumizing Mascara that defines lashes for a full fan effect.",
        brand: "Maybelline",
        category: "Makeup",
        price: 950,
        discountPrice: 850,
        imgUrl: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&q=80",
        skuPrefix: "MAY-MSC-SEN"
      },
      {
        name: "Revlon 16 Hour Eye Shadow Palette",
        description: "Richly pigmented Eye Shadow quad palette with smooth, blendable shades.",
        brand: "Revlon",
        category: "Makeup",
        price: 1350,
        discountPrice: 1200,
        imgUrl: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600&q=80",
        skuPrefix: "REV-ESH-16H"
      },
      {
        name: "Maybelline Brow Fast Sculpt Eyebrow Gel",
        description: "Tinted Eyebrow Gel that shapes, tames, and colors brows quickly.",
        brand: "Maybelline",
        category: "Makeup",
        price: 850,
        discountPrice: 750,
        imgUrl: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&q=80",
        skuPrefix: "MAY-BG-FST"
      },
      {
        name: "Revlon Prime Plus Eye Primer",
        description: "Smoothing Eye Primer that locks in eyeshadow color for long wear.",
        brand: "Revlon",
        category: "Makeup",
        price: 950,
        discountPrice: 850,
        imgUrl: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&q=80",
        skuPrefix: "REV-EP-PMP"
      },
      {
        name: "Revlon False Eyelashes - Natural Volume Set",
        description: "Lightweight, reusable False Eyelashes that blend with natural lashes.",
        brand: "Revlon",
        category: "Makeup",
        price: 650,
        discountPrice: 550,
        imgUrl: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&q=80",
        skuPrefix: "REV-FEY-NAT"
      },
      {
        name: "L'Oreal Color Riche Satin Lipstick",
        description: "Luxurious classic Lipstick containing nourishing Omega 3 and Vitamin E.",
        brand: "L'Oreal Paris",
        category: "Makeup",
        price: 1100,
        discountPrice: 950,
        imgUrl: "https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=600&q=80",
        skuPrefix: "LOR-LIP-CRT"
      },
      {
        name: "Revlon ColorStay Lip Crayon",
        description: "High-pigment Lip Crayon with smooth, velvety matte finish.",
        brand: "Revlon",
        category: "Makeup",
        price: 980,
        discountPrice: 850,
        imgUrl: "https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=600&q=80",
        skuPrefix: "REV-LC-CSY"
      },
      {
        name: "Maybelline Lifter Lip Gloss with Hyaluronic Acid",
        description: "Hydrating Lip Gloss that drenches lips with high-shine and volume.",
        brand: "Maybelline",
        category: "Makeup",
        price: 1150,
        discountPrice: 990,
        imgUrl: "https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=600&q=80",
        skuPrefix: "MAY-LG-LFT"
      },
      {
        name: "L'Oreal Color Riche Lip Liner",
        description: "Precision Lip Liner to define lip contours and extend lipstick wear.",
        brand: "L'Oreal Paris",
        category: "Makeup",
        price: 750,
        discountPrice: 650,
        imgUrl: "https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=600&q=80",
        skuPrefix: "LOR-LL-CRT"
      },
      {
        name: "Maybelline Sensational Lip Stain",
        description: "Water-based Lip Stain for a lightweight, long-lasting flush of color.",
        brand: "Maybelline",
        category: "Makeup",
        price: 950,
        discountPrice: 850,
        imgUrl: "https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=600&q=80",
        skuPrefix: "MAY-LS-SEN"
      },
      {
        name: "COSRX Salicylic Acid Face Wash",
        description: "Clarifying daily Face Wash for acne-prone skin.",
        brand: "COSRX",
        category: "Skincare",
        price: 1250,
        discountPrice: 1100,
        imgUrl: "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=600&q=80",
        skuPrefix: "COS-FW-SAL"
      },
      {
        name: "The Ordinary Squalane Cleansing Balm",
        description: "Gentle hydrating Cleansing Balm to remove makeup and cleanse skin.",
        brand: "The Ordinary",
        category: "Skincare",
        price: 1350,
        discountPrice: 1190,
        imgUrl: "https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=600&q=80",
        skuPrefix: "ORD-CB-SQ"
      },
      {
        name: "CeraVe Hydrating Face Wash",
        description: "Daily hydrating Face Wash for normal to dry skin with ceramides.",
        brand: "CeraVe",
        category: "Skincare",
        price: 1400,
        discountPrice: 1250,
        imgUrl: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&q=80",
        skuPrefix: "CER-FW-HYD"
      },
      {
        name: "The Ordinary Glycolic Acid Face Toner",
        description: "Exfoliating daily Face Toner to clarify and smooth skin texture.",
        brand: "The Ordinary",
        category: "Skincare",
        price: 1450,
        discountPrice: 1300,
        imgUrl: "https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=600&q=80",
        skuPrefix: "ORD-TON-GLY"
      },
      {
        name: "CeraVe AM Facial Day Cream SPF 30",
        description: "Moisturizing daily Day Cream with sunscreen protection.",
        brand: "CeraVe",
        category: "Skincare",
        price: 1950,
        discountPrice: 1750,
        imgUrl: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&q=80",
        skuPrefix: "CER-DC-AM"
      },
      {
        name: "CeraVe PM Facial Night Cream",
        description: "Lightweight nightly Night Cream to hydrate and rebuild skin barrier.",
        brand: "CeraVe",
        category: "Skincare",
        price: 1950,
        discountPrice: 1750,
        imgUrl: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&q=80",
        skuPrefix: "CER-NC-PM"
      },
      {
        name: "COSRX Centella Soothing Face Gel",
        description: "Lightweight hydrating Face Gel to calm redness and skin irritation.",
        brand: "COSRX",
        category: "Skincare",
        price: 1150,
        discountPrice: 990,
        imgUrl: "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=600&q=80",
        skuPrefix: "COS-FG-CEN"
      },
      {
        name: "Cetaphil Daily Body Lotion",
        description: "Lightweight hydrating Body Lotion for all skin types.",
        brand: "Cetaphil",
        category: "Skincare",
        price: 1550,
        discountPrice: 1400,
        imgUrl: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&q=80",
        skuPrefix: "CET-BL-DLY"
      },
      {
        name: "The Ordinary Hyaluronic Acid Face Serum",
        description: "Hydrating Face Serum that deeply plumps and hydrates skin cells.",
        brand: "The Ordinary",
        category: "Skincare",
        price: 1050,
        discountPrice: 950,
        imgUrl: "https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=600&q=80",
        skuPrefix: "ORD-SR-HYA"
      },
      {
        name: "Innisfree Brightening Sheet Mask",
        description: "Hydrating Korean Sheet Mask sheet mask infused with green tea extracts.",
        brand: "Innisfree",
        category: "Skincare",
        price: 190,
        discountPrice: 150,
        imgUrl: "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=600&q=80",
        skuPrefix: "INN-SM-BRG"
      },
      {
        name: "COSRX Aloe Soothing Sunscreen SPF 50",
        description: "Soothing Aloe daily Sunscreen to protect skin from UV rays.",
        brand: "COSRX",
        category: "Skincare",
        price: 1450,
        discountPrice: 1250,
        imgUrl: "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=600&q=80",
        skuPrefix: "COS-SS-ALO"
      },
      {
        name: "COSRX Acne Pimple Patch",
        description: "Hydrocolloid Acne Patch to treat pimples and acne spots overnight.",
        brand: "COSRX",
        category: "Skincare",
        price: 450,
        discountPrice: 350,
        imgUrl: "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=600&q=80",
        skuPrefix: "COS-AP-PMP"
      },
      {
        name: "The Ordinary Retinol 0.5% Anti Aging Serum",
        description: "Highly stable Retinol Anti Aging serum to reduce appearance of wrinkles.",
        brand: "The Ordinary",
        category: "Skincare",
        price: 1100,
        discountPrice: 950,
        imgUrl: "https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=600&q=80",
        skuPrefix: "ORD-SR-RET"
      },
      {
        name: "CeraVe Moisturizing Dry Skin Relief Cream",
        description: "Intense daily cream for Dry Skin relief with barrier ceramides.",
        brand: "CeraVe",
        category: "Skincare",
        price: 1350,
        discountPrice: 1200,
        imgUrl: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&q=80",
        skuPrefix: "CER-CR-DSK"
      },
      {
        name: "COSRX BHA Blackhead Power Pore Care Liquid",
        description: "BHA-infused Pore Care liquid that gently clarifies pores and blackheads.",
        brand: "COSRX",
        category: "Skincare",
        price: 1650,
        discountPrice: 1450,
        imgUrl: "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=600&q=80",
        skuPrefix: "COS-PC-BHA"
      },
      {
        name: "L'Oreal Anti Hair Fall Shampoo",
        description: "Strengthening Shampoo to reduce hair fall and split ends.",
        brand: "L'Oreal Paris",
        category: "Haircare",
        price: 850,
        discountPrice: 750,
        imgUrl: "https://images.unsplash.com/photo-1527799822367-a2505d994344?w=600&q=80",
        skuPrefix: "LOR-SH-AHF"
      },
      {
        name: "L'Oreal Hair Mask Treatment",
        description: "Deep conditioning Hair Mask to restore damaged hair fibers.",
        brand: "L'Oreal Paris",
        category: "Haircare",
        price: 1100,
        discountPrice: 990,
        imgUrl: "https://images.unsplash.com/photo-1527799822367-a2505d994344?w=600&q=80",
        skuPrefix: "LOR-HM-TRT"
      },
      {
        name: "Nivea Body Wash",
        description: "Nourishing daily Body Wash gel with moisturizing serum.",
        brand: "Nivea",
        category: "Personal Care",
        price: 650,
        discountPrice: 550,
        imgUrl: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600&q=80",
        skuPrefix: "NIV-BW-DLY"
      },
      {
        name: "Farlin Baby Wash",
        description: "Ultra-gentle Baby Wash formula for sensitive baby skin.",
        brand: "Farlin",
        category: "Mom & Baby",
        price: 950,
        discountPrice: 850,
        imgUrl: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600&q=80",
        skuPrefix: "FAR-BW-GEN"
      },
      {
        name: "Calvin Klein Eternity EDP Women Fragrance",
        description: "Classic floral Women Fragrance Eau De Parfum spray.",
        brand: "Calvin Klein",
        category: "Fragrance",
        price: 6500,
        discountPrice: 5800,
        imgUrl: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600&q=80",
        skuPrefix: "CK-ETN-EDP"
      },
      {
        name: "Premium Cotton T-Shirt Bra",
        description: "Seamless daily T-Shirt Bra with soft cotton lining.",
        brand: "Secret",
        category: "Undergarments",
        price: 850,
        discountPrice: null,
        imgUrl: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600&q=80",
        skuPrefix: "SEC-BRA-TSH"
      },
      {
        name: "GlowGoodly Acne Clearance Combo",
        description: "Complete Acne Clearance Combo containing face wash, serum and acne patch.",
        brand: "COSRX",
        category: "Combo",
        price: 2450,
        discountPrice: 2150,
        imgUrl: "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=600&q=80",
        skuPrefix: "COS-CMB-ACN"
      },
      {
        name: "Gold Plated Jhumkas",
        description: "Traditional designer Jhumkas earrings with pearl beads.",
        brand: "Revlon",
        category: "Jewellery",
        price: 650,
        discountPrice: null,
        imgUrl: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600&q=80",
        skuPrefix: "GEN-EBR-JHM"
      },
      {
        name: "Matte Lipsticks under 499 Deal",
        description: "Trending matte Lipsticks under 499 special clearance deal.",
        brand: "Maybelline",
        category: "Clearance Sale",
        price: 499,
        discountPrice: null,
        imgUrl: "https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=600&q=80",
        skuPrefix: "CLR-LIP-499"
      },
      {
        name: "Gillette Mens Face Wash",
        description: "Deep cleaning Mens Face Wash with refreshing charcoal action.",
        brand: "Gillette",
        category: "Men",
        price: 650,
        discountPrice: 550,
        imgUrl: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600&q=80",
        skuPrefix: "GIL-MFW-REF"
      }
    ];

    // 6. Insert Products with Variants
    for (const p of productsToSeed) {
      const brandId = brands[p.brand]?.id;
      const categoryId = categories[p.category]?.id;

      if (!brandId || !categoryId) continue;

      const existingProd = await prisma.product.findFirst({ where: { name: p.name } });
      if (!existingProd) {
        await prisma.product.create({
          data: {
            name: p.name,
            description: p.description,
            brandId,
            categoryId,
            status: "Active",
            images: {
              create: [
                { url: p.imgUrl, isPrimary: true }
              ]
            },
            variants: {
              create: [
                {
                  name: "Standard Pack",
                  price: p.price,
                  discountPrice: p.discountPrice || null,
                  stock: 100,
                  sku: `${p.skuPrefix}-STD`
                }
              ]
            }
          }
        });
      }
    }
    console.log(`🌱 Auto-seed: Inserted ${productsToSeed.length} catalog products with variants.`);

    // 7. Initialize Default Integration Settings
    const defaultSettings = [
      { key: "META_PIXEL_ID", value: "" },
      { key: "META_CAPI_TOKEN", value: "" },
      { key: "GA4_MEASUREMENT_ID", value: "" },
      { key: "GTM_CONTAINER_ID", value: "" },
      { key: "SMS_PROVIDER_URL", value: "https://api.sms-gateway.com/send" },
      { key: "SMS_API_KEY", value: "" },
      { key: "SMS_SENDER_ID", value: "GLOWGOODLY" },
      { key: "SMS_TEMPLATE_ORDER_PLACED", value: "Hi [CustomerName], your order [OrderNumber] of BDT [Total] has been placed successfully. Thank you!" },
      { key: "SMS_TEMPLATE_ORDER_SHIPPED", value: "Hi [CustomerName], your order [OrderNumber] has been shipped. Track your order here: [TrackingLink]" },
      { key: "COURIER_PROVIDER", value: "Steadfast" },
      { key: "COURIER_API_SECRET", value: "" },
      { key: "COURIER_CLIENT_ID", value: "" },
      { key: "COURIER_STORE_ID", value: "" },
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

    // 8. Default Promo Banners
    const bannerCount = await prisma.promoBanner.count();
    if (bannerCount === 0) {
      await prisma.promoBanner.createMany({
        data: [
          {
            title: "GlowGoodly — Premium Beauty Destination Bangladesh",
            imageUrl: "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=1400&q=90&fit=crop",
            linkUrl: "/shop",
            bgColor: "#1a1a2e",
            isActive: true,
            sortOrder: 0,
          },
          {
            title: "Exclusive Korean Skincare Offers — Up to 40% Off",
            imageUrl: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=1400&q=90&fit=crop",
            linkUrl: "/category/skincare",
            bgColor: "#e63b7a",
            isActive: true,
            sortOrder: 1,
          },
        ],
      });
      console.log("🌱 Auto-seed: Default promo banners initialized.");
    }

    console.log("✅ Auto-seed: Database successfully initialized!");
  } catch (error) {
    console.error("⚠️ Auto-seed encountered an error (continuing server startup):", error);
  }
}

if (require.main === module) {
  autoSeedDatabase().then(() => {
    console.log("Auto-seed script completed successfully.");
    process.exit(0);
  }).catch((err) => {
    console.error("Auto-seed error:", err);
    process.exit(1);
  });
}
