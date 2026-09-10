const { PrismaClient } = require("@prisma/client");
require("dotenv").config();

const prisma = new PrismaClient();

async function seedBanners() {
  try {
    console.log("Seeding promotional banners into database...");
    
    // Clear existing banners
    await prisma.promoBanner.deleteMany({});
    console.log("Cleared existing promo banners.");

    const banners = [
      // Hero Carousel Sliders
      {
        page: "Hero Slides",
        title: "Nirvana Hero Slider Banner",
        imageUrl: "/images/sliders/slider-1.png",
        linkUrl: "/shop?category=skincare",
        bgColor: "linear-gradient(135deg, #e63b7a 0%, #ff758c 100%)",
        isActive: true,
        sortOrder: 0
      },
      {
        page: "Hero Slides",
        title: "Unilever Campaign Banner",
        imageUrl: "/images/sliders/slider-2.png",
        linkUrl: "/shop?category=skincare",
        bgColor: "linear-gradient(135deg, #495057 0%, #1a1a2e 100%)",
        isActive: true,
        sortOrder: 1
      },
      {
        page: "Hero Slides",
        title: "Treasure of Glow Web Slider",
        imageUrl: "/images/sliders/slider-3.png",
        linkUrl: "/shop?category=skincare",
        bgColor: "linear-gradient(135deg, #0e1e38 0%, #0a101f 100%)",
        isActive: true,
        sortOrder: 2
      },

      // Deals You Cannot Miss
      {
        page: "Deal Card 1",
        title: "Deal Card 1 - Ombre 30% Off",
        imageUrl: "/images/deals/deal-1.png",
        linkUrl: "/shop?category=clearance-sale",
        isActive: true,
        sortOrder: 0
      },
      {
        page: "Deal Card 2",
        title: "Deal Card 2 - Marico Free Delivery",
        imageUrl: "/images/deals/deal-2.png",
        linkUrl: "/shop?category=skincare",
        isActive: true,
        sortOrder: 1
      },
      {
        page: "Deal Card 3",
        title: "Deal Card 3 - PNS Campaign",
        imageUrl: "/images/deals/deal-3.gif",
        linkUrl: "/shop?category=combo",
        isActive: true,
        sortOrder: 2
      },
      {
        page: "Deal Card 4",
        title: "Deal Card 4 - Senora Deal",
        imageUrl: "/images/deals/deal-4.jpg",
        linkUrl: "/shop?category=makeup",
        isActive: true,
        sortOrder: 3
      },

      // Brand Offers
      {
        page: "Brand Offer 1",
        title: "Brand Offer 1 - The Ordinary",
        imageUrl: "https://bk.shajgoj.com/storage/2026/05/shajgoj-the-ordinary-top-brand-banner-33.png",
        linkUrl: "/shop?brand=the-ordinary",
        isActive: true,
        sortOrder: 0
      },
      {
        page: "Brand Offer 2",
        title: "Brand Offer 2 - Skin Cafe",
        imageUrl: "https://bk.shajgoj.com/storage/2026/04/skin-cafe-shower-gel-top-brand-banner.gif",
        linkUrl: "/shop?brand=skin-cafe",
        isActive: true,
        sortOrder: 1
      },
      {
        page: "Brand Offer 5",
        title: "Brand Offer 5 - Treasure of Glow",
        imageUrl: "https://bk.shajgoj.com/storage/2026/04/treasure-of-glow.png",
        linkUrl: "/shop?brand=the-ordinary",
        isActive: true,
        sortOrder: 5
      },
      {
        page: "Brand Offer 6",
        title: "Brand Offer 6 - Trimmer Offer",
        imageUrl: "https://bk.shajgoj.com/storage/2026/05/trimmer-gif.gif",
        linkUrl: "/shop?brand=skin-cafe",
        isActive: true,
        sortOrder: 6
      },

      // Campaigns
      {
        page: "BOGO",
        title: "BOGO Offer",
        imageUrl: "https://bk.shajgoj.com/storage/2025/05/bogo-9lad.png",
        linkUrl: "/shop?category=bogo",
        isActive: true,
        sortOrder: 0
      },
      {
        page: "COMBO",
        title: "COMBO Offer",
        imageUrl: "https://bk.shajgoj.com/storage/2025/05/combo.png",
        linkUrl: "/shop?category=combo",
        isActive: true,
        sortOrder: 0
      },
      {
        page: "OFFERS",
        title: "OFFERS",
        imageUrl: "https://bk.shajgoj.com/storage/2025/05/offers.png",
        linkUrl: "/shop?category=exclusive",
        isActive: true,
        sortOrder: 0
      },
      {
        page: "Clearance SALE",
        title: "Clearance SALE Offer",
        imageUrl: "https://bk.shajgoj.com/storage/2025/05/clearance-sale.png",
        linkUrl: "/shop?category=clearance-sale",
        isActive: true,
        sortOrder: 0
      }
    ];

    for (const b of banners) {
      await prisma.promoBanner.create({ data: b });
    }

    console.log(`✅ Successfully seeded ${banners.length} promotional banners!`);
  } catch (err) {
    console.error("Error seeding banners:", err);
  } finally {
    await prisma.$disconnect();
    console.log("Prisma disconnected.");
  }
}

seedBanners().catch(console.error);
