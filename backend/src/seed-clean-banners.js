const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const MASTER_BANNERS = [
  // Hero Slides Carousel (3 Slides)
  {
    id: "hero-slide-1",
    title: "Hero Slide 1 - Nirvana Makeup",
    page: "Hero Slides",
    imageUrl: "/images/sliders/slider-1.png",
    mobileImageUrl: "/images/sliders/slider-1.png",
    tabletImageUrl: "/images/sliders/slider-1.png",
    linkUrl: "/shop?brand=nirvana",
    isActive: true,
    sortOrder: 1
  },
  {
    id: "hero-slide-2",
    title: "Hero Slide 2 - July Jaw Droppers",
    page: "Hero Slides",
    imageUrl: "/images/sliders/slider-2.png",
    mobileImageUrl: "/images/sliders/slider-2.png",
    tabletImageUrl: "/images/sliders/slider-2.png",
    linkUrl: "/shop?deal=jaw-droppers",
    isActive: true,
    sortOrder: 2
  },
  {
    id: "hero-slide-3",
    title: "Hero Slide 3 - Treasure of Glow",
    page: "Hero Slides",
    imageUrl: "/images/sliders/slider-3.png",
    mobileImageUrl: "/images/sliders/slider-3.png",
    tabletImageUrl: "/images/sliders/slider-3.png",
    linkUrl: "/shop?deal=treasure-of-glow",
    isActive: true,
    sortOrder: 3
  },
  // Homepage Wide Banner (Original Beauty Must Haves banner)
  {
    id: "homepage-wide-banner",
    title: "Beauty Must Haves Exclusive Savings",
    page: "Homepage Wide Banner",
    imageUrl: "/hero-slide-1.png",
    mobileImageUrl: "/hero-slide-1.png",
    tabletImageUrl: "/hero-slide-1.png",
    linkUrl: "/shop",
    isActive: true,
    sortOrder: 4
  },
  // Deals You Cannot Miss (4 Cards)
  {
    id: "deal-card-1",
    title: "Deal Card 1 - Ombre 30% Off",
    page: "Deal Card 1",
    imageUrl: "/images/deals/deal-1.png",
    mobileImageUrl: "/images/deals/deal-1.png",
    tabletImageUrl: "/images/deals/deal-1.png",
    linkUrl: "/shop?deal=ombre",
    isActive: true,
    sortOrder: 2
  },
  {
    id: "deal-card-2",
    title: "Deal Card 2 - Marico Free Delivery",
    page: "Deal Card 2",
    imageUrl: "/images/deals/deal-2.png",
    mobileImageUrl: "/images/deals/deal-2.png",
    tabletImageUrl: "/images/deals/deal-2.png",
    linkUrl: "/shop?deal=marico",
    isActive: true,
    sortOrder: 3
  },
  {
    id: "deal-card-3",
    title: "Deal Card 3 - PNS Campaign",
    page: "Deal Card 3",
    imageUrl: "/images/deals/deal-3.gif",
    mobileImageUrl: "/images/deals/deal-3.gif",
    tabletImageUrl: "/images/deals/deal-3.gif",
    linkUrl: "/shop?deal=pns",
    isActive: true,
    sortOrder: 4
  },
  {
    id: "deal-card-4",
    title: "Deal Card 4 - Senora Deal",
    page: "Deal Card 4",
    imageUrl: "/images/deals/deal-4.jpg",
    mobileImageUrl: "/images/deals/deal-4.jpg",
    tabletImageUrl: "/images/deals/deal-4.jpg",
    linkUrl: "/shop?deal=senora",
    isActive: true,
    sortOrder: 5
  },
  // Top Brands & Offers (4 Cards)
  {
    id: "brand-offer-1",
    title: "Brand Offer 1 - The Ordinary",
    page: "Brand Offer 1",
    imageUrl: "/images/brands/brand-offer-1.png",
    mobileImageUrl: "/images/brands/brand-offer-1.png",
    tabletImageUrl: "/images/brands/brand-offer-1.png",
    linkUrl: "/shop?brand=the-ordinary",
    isActive: true,
    sortOrder: 6
  },
  {
    id: "brand-offer-2",
    title: "Brand Offer 2 - Skin Cafe",
    page: "Brand Offer 2",
    imageUrl: "/images/brands/brand-offer-2.gif",
    mobileImageUrl: "/images/brands/brand-offer-2.gif",
    tabletImageUrl: "/images/brands/brand-offer-2.gif",
    linkUrl: "/shop?brand=skin-cafe",
    isActive: true,
    sortOrder: 7
  },
  {
    id: "brand-offer-5",
    title: "Brand Offer 5 - Treasure of Glow",
    page: "Brand Offer 5",
    imageUrl: "/images/brands/brand-offer-5.png",
    mobileImageUrl: "/images/brands/brand-offer-5.png",
    tabletImageUrl: "/images/brands/brand-offer-5.png",
    linkUrl: "/shop?brand=treasure-of-glow",
    isActive: true,
    sortOrder: 8
  },
  {
    id: "brand-offer-6",
    title: "Brand Offer 6 - Trimmer Offer",
    page: "Brand Offer 6",
    imageUrl: "/images/brands/brand-offer-6.gif",
    mobileImageUrl: "/images/brands/brand-offer-6.gif",
    tabletImageUrl: "/images/brands/brand-offer-6.gif",
    linkUrl: "/shop?category=trimmer",
    isActive: true,
    sortOrder: 9
  },
  // Limited Time Offers (4 Cards)
  {
    id: "limited-bogo",
    title: "BOGO Offer",
    page: "BOGO",
    imageUrl: "/images/deals/deal-1.png",
    mobileImageUrl: "/images/deals/deal-1.png",
    tabletImageUrl: "/images/deals/deal-1.png",
    linkUrl: "/shop?campaign=BOGO",
    isActive: true,
    sortOrder: 10
  },
  {
    id: "limited-combo",
    title: "COMBO Offer",
    page: "COMBO",
    imageUrl: "/images/deals/deal-2.png",
    mobileImageUrl: "/images/deals/deal-2.png",
    tabletImageUrl: "/images/deals/deal-2.png",
    linkUrl: "/shop?campaign=COMBO",
    isActive: true,
    sortOrder: 11
  },
  {
    id: "limited-offers",
    title: "OFFERS Mega Savings",
    page: "OFFERS",
    imageUrl: "/images/deals/deal-3.gif",
    mobileImageUrl: "/images/deals/deal-3.gif",
    tabletImageUrl: "/images/deals/deal-3.gif",
    linkUrl: "/shop?campaign=OFFERS",
    isActive: true,
    sortOrder: 12
  },
  {
    id: "limited-clearance",
    title: "Clearance SALE Deals",
    page: "Clearance SALE",
    imageUrl: "/images/deals/deal-4.jpg",
    mobileImageUrl: "/images/deals/deal-4.jpg",
    tabletImageUrl: "/images/deals/deal-4.jpg",
    linkUrl: "/shop?campaign=Clearance%20SALE",
    isActive: true,
    sortOrder: 13
  }
];

async function seedCleanBanners() {
  console.log("Seeding clean master banners into promoBanner...");
  for (const b of MASTER_BANNERS) {
    await prisma.promoBanner.upsert({
      where: { id: b.id },
      update: {
        title: b.title,
        page: b.page,
        imageUrl: b.imageUrl,
        mobileImageUrl: b.mobileImageUrl,
        tabletImageUrl: b.tabletImageUrl,
        linkUrl: b.linkUrl,
        isActive: b.isActive,
        sortOrder: b.sortOrder
      },
      create: {
        id: b.id,
        title: b.title,
        page: b.page,
        imageUrl: b.imageUrl,
        mobileImageUrl: b.mobileImageUrl,
        tabletImageUrl: b.tabletImageUrl,
        linkUrl: b.linkUrl,
        isActive: b.isActive,
        sortOrder: b.sortOrder
      }
    });
  }
  console.log(`Successfully seeded ${MASTER_BANNERS.length} master banner slots!`);
  await prisma.$disconnect();
}

seedCleanBanners().catch((err) => {
  console.error("Error seeding banners:", err);
  process.exit(1);
});
