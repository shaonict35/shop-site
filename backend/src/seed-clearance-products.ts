import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function seedClearance() {
  console.log("Seeding Clearance Category and Products...");

  // 1. Ensure Brand
  const brand = await prisma.brand.upsert({
    where: { id: "brand-clearance" },
    update: {},
    create: {
      id: "brand-clearance",
      name: "Clearance Specials",
      logoUrl: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=200&q=80"
    }
  });

  // 2. Ensure Category
  const cat = await prisma.category.upsert({
    where: { id: "cat-clearance-sale" },
    update: {},
    create: {
      id: "cat-clearance-sale",
      name: "Clearance Sale"
    }
  });

  const clearanceItems = [
    {
      id: "prod-clearance-1",
      sku: "SKU-CLR-001",
      name: "COSRX Low pH Good Morning Gel Cleanser (Clearance Sale)",
      description: "Gentle morning gel cleanser formulated with purifying botanical ingredients.",
      price: 1350,
      discountPrice: 850,
      image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500&q=80",
      size: "150ml",
      stock: 15
    },
    {
      id: "prod-clearance-2",
      sku: "SKU-CLR-002",
      name: "Beauty of Joseon Relief Sun Rice + Probiotics SPF50+ (Clearance Stock)",
      description: "Organic sunscreen enriched with 30% rice extract and grain fermented extracts.",
      price: 1650,
      discountPrice: 1150,
      image: "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=500&q=80",
      size: "50ml",
      stock: 20
    },
    {
      id: "prod-clearance-3",
      sku: "SKU-CLR-003",
      name: "The Ordinary Niacinamide 10% + Zinc 1% High-Strength Serum (Special Clearance)",
      description: "High-strength vitamin and mineral blemish formula with niacinamide and zinc.",
      price: 1400,
      discountPrice: 990,
      image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=500&q=80",
      size: "30ml",
      stock: 12
    },
    {
      id: "prod-clearance-4",
      sku: "SKU-CLR-004",
      name: "Laneige Lip Sleeping Mask Intense Moisture Berry (Final Clearance)",
      description: "Leave-on lip mask that soothes and moisturizes for smoother, more supple lips overnight.",
      price: 1950,
      discountPrice: 1250,
      image: "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=500&q=80",
      size: "20g",
      stock: 18
    }
  ];

  for (const item of clearanceItems) {
    const existing = await prisma.product.findUnique({ where: { id: item.id } });
    if (!existing) {
      await prisma.product.create({
        data: {
          id: item.id,
          name: item.name,
          description: item.description,
          brandId: brand.id,
          categoryId: cat.id,
          campaignName: "Clearance SALE",
          images: {
            create: [{ url: item.image, isPrimary: true }]
          },
          variants: {
            create: [{
              name: item.size,
              sku: item.sku,
              price: item.price,
              discountPrice: item.discountPrice,
              stock: item.stock
            }]
          }
        }
      });
      console.log(`Created clearance product: ${item.name}`);
    }
  }

  console.log("Clearance products seeding complete!");
}

seedClearance().catch(console.error).finally(() => prisma.$disconnect());
