const { PrismaClient } = require("@prisma/client");
require("dotenv").config();

const prisma = new PrismaClient();

const banners = [
  // Hero Carousel Sliders
  {
    page: "Hero Slides",
    title: "Nirvana Hero Slider Banner",
    imageUrl: "/images/sliders/slider-1.png",
    mobileImageUrl: "/images/sliders/slider-1.png",
    tabletImageUrl: "/images/sliders/slider-1.png",
    linkUrl: "/shop?category=skincare",
    bgColor: "linear-gradient(135deg, #e63b7a 0%, #ff758c 100%)",
    isActive: true,
    sortOrder: 0
  },
  {
    page: "Hero Slides",
    title: "Unilever Campaign Banner",
    imageUrl: "/images/sliders/slider-2.png",
    mobileImageUrl: "/images/sliders/slider-2.png",
    tabletImageUrl: "/images/sliders/slider-2.png",
    linkUrl: "/shop?category=skincare",
    bgColor: "linear-gradient(135deg, #495057 0%, #1a1a2e 100%)",
    isActive: true,
    sortOrder: 1
  },
  {
    page: "Hero Slides",
    title: "Treasure of Glow Web Slider",
    imageUrl: "/images/sliders/slider-3.png",
    mobileImageUrl: "/images/sliders/slider-3.png",
    tabletImageUrl: "/images/sliders/slider-3.png",
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
    mobileImageUrl: "/images/deals/deal-1.png",
    tabletImageUrl: "/images/deals/deal-1.png",
    linkUrl: "/shop?category=clearance-sale",
    isActive: true,
    sortOrder: 0
  },
  {
    page: "Deal Card 2",
    title: "Deal Card 2 - Marico Free Delivery",
    imageUrl: "/images/deals/deal-2.png",
    mobileImageUrl: "/images/deals/deal-2.png",
    tabletImageUrl: "/images/deals/deal-2.png",
    linkUrl: "/shop?category=skincare",
    isActive: true,
    sortOrder: 1
  },
  {
    page: "Deal Card 3",
    title: "Deal Card 3 - PNS Campaign",
    imageUrl: "/images/deals/deal-3.gif",
    mobileImageUrl: "/images/deals/deal-3.gif",
    tabletImageUrl: "/images/deals/deal-3.gif",
    linkUrl: "/shop?category=combo",
    isActive: true,
    sortOrder: 2
  },
  {
    page: "Deal Card 4",
    title: "Deal Card 4 - Senora Deal",
    imageUrl: "/images/deals/deal-4.jpg",
    mobileImageUrl: "/images/deals/deal-4.jpg",
    tabletImageUrl: "/images/deals/deal-4.jpg",
    linkUrl: "/shop?category=makeup",
    isActive: true,
    sortOrder: 3
  },

  // Brand Offers
  {
    page: "Brand Offer 1",
    title: "Brand Offer 1 - The Ordinary",
    imageUrl: "/images/brands/brand-offer-1.png",
    mobileImageUrl: "/images/brands/brand-offer-1.png",
    tabletImageUrl: "/images/brands/brand-offer-1.png",
    linkUrl: "/shop?brand=the-ordinary",
    isActive: true,
    sortOrder: 0
  },
  {
    page: "Brand Offer 2",
    title: "Brand Offer 2 - Skin Cafe",
    imageUrl: "/images/brands/brand-offer-2.gif",
    mobileImageUrl: "/images/brands/brand-offer-2.gif",
    tabletImageUrl: "/images/brands/brand-offer-2.gif",
    linkUrl: "/shop?brand=skin-cafe",
    isActive: true,
    sortOrder: 1
  },
  {
    page: "Brand Offer 5",
    title: "Brand Offer 5 - Treasure of Glow",
    imageUrl: "/images/brands/brand-offer-5.png",
    mobileImageUrl: "/images/brands/brand-offer-5.png",
    tabletImageUrl: "/images/brands/brand-offer-5.png",
    linkUrl: "/shop?brand=the-ordinary",
    isActive: true,
    sortOrder: 5
  },
  {
    page: "Brand Offer 6",
    title: "Brand Offer 6 - Trimmer Offer",
    imageUrl: "/images/brands/brand-offer-6.gif",
    mobileImageUrl: "/images/brands/brand-offer-6.gif",
    tabletImageUrl: "/images/brands/brand-offer-6.gif",
    linkUrl: "/shop?brand=skin-cafe",
    isActive: true,
    sortOrder: 6
  },

  // Campaigns
  {
    page: "BOGO",
    title: "BOGO Offer",
    imageUrl: "/images/deals/deal-1.png",
    mobileImageUrl: "/images/deals/deal-1.png",
    tabletImageUrl: "/images/deals/deal-1.png",
    linkUrl: "/shop?category=bogo",
    isActive: true,
    sortOrder: 0
  },
  {
    page: "COMBO",
    title: "COMBO Offer",
    imageUrl: "/images/deals/deal-2.png",
    mobileImageUrl: "/images/deals/deal-2.png",
    tabletImageUrl: "/images/deals/deal-2.png",
    linkUrl: "/shop?category=combo",
    isActive: true,
    sortOrder: 0
  },
  {
    page: "OFFERS",
    title: "OFFERS",
    imageUrl: "/images/deals/deal-3.gif",
    mobileImageUrl: "/images/deals/deal-3.gif",
    tabletImageUrl: "/images/deals/deal-3.gif",
    linkUrl: "/shop?category=exclusive",
    isActive: true,
    sortOrder: 0
  },
  {
    page: "Clearance SALE",
    title: "Clearance SALE Offer",
    imageUrl: "/images/deals/deal-4.jpg",
    mobileImageUrl: "/images/deals/deal-4.jpg",
    tabletImageUrl: "/images/deals/deal-4.jpg",
    linkUrl: "/shop?category=clearance-sale",
    isActive: true,
    sortOrder: 0
  }
];

async function seedBanners() {
  try {
    console.log("Seeding promotional banners into GlowGoodly database...");

    // Reset DELETED_BANNERS setting so seeded banners become active
    await prisma.setting.upsert({
      where: { key: "DELETED_BANNERS" },
      update: { value: JSON.stringify({ ids: [] }) },
      create: { key: "DELETED_BANNERS", value: JSON.stringify({ ids: [] }) }
    });

    let seededCount = 0;
    // Attempt inserting via Backend REST API
    for (const b of banners) {
      try {
        const res = await fetch("http://localhost:5000/api/banners", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(b)
        });
        if (res.ok) seededCount++;
      } catch (e) {
        // Backend not listening, skip API push
      }
    }

    if (seededCount > 0) {
      console.log(`✅ Successfully seeded ${seededCount} promotional banners via API!`);
    } else {
      console.log(`✅ Cleared deleted banners cache. Next API call to /api/banners will auto-initialize default banners.`);
    }
  } catch (err) {
    console.error("Error seeding banners:", err);
  } finally {
    await prisma.$disconnect();
    console.log("Prisma disconnected.");
  }
}

seedBanners().catch(console.error);
