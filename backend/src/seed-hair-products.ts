import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function seedHair() {
  console.log("Seeding Hair Care Category and Products...");

  // 1. Ensure Brand
  const brand = await prisma.brand.upsert({
    where: { id: "brand-haircare" },
    update: {},
    create: {
      id: "brand-haircare",
      name: "Hair Care Specialists",
      logoUrl: "https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=200&q=80"
    }
  });

  // 2. Ensure Category
  const cat = await prisma.category.upsert({
    where: { id: "fa11da9b-9385-40af-8cc1-58d70e828244" },
    update: {},
    create: {
      id: "fa11da9b-9385-40af-8cc1-58d70e828244",
      name: "Haircare"
    }
  });

  const hairItems = [
    {
      id: "prod-hair-1",
      sku: "SKU-HAIR-001",
      name: "Olaplex No. 3 Hair Perfector Repairing Treatment",
      description: "Concentrated treatment that strengthens hair from within, reducing breakage and improving look and feel.",
      price: 3200,
      discountPrice: 2850,
      image: "https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=500&q=80",
      size: "100ml",
      stock: 25
    },
    {
      id: "prod-hair-2",
      sku: "SKU-HAIR-002",
      name: "L'Oreal Paris Elvive Extraordinary Oil Serum",
      description: "Nourishing hair serum infused with 6 precious floral oils for brilliant shine and silky smoothness.",
      price: 1250,
      discountPrice: 990,
      image: "https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=500&q=80",
      size: "100ml",
      stock: 35
    },
    {
      id: "prod-hair-3",
      sku: "SKU-HAIR-003",
      name: "Tresemme Keratin Smooth Anti-Frizz Pro Shampoo",
      description: "Infused with keratin and marula oil, giving up to 72 hours of frizz control and salon smoothness.",
      price: 950,
      discountPrice: 780,
      image: "https://images.unsplash.com/photo-1608248597359-25f053ca2651?w=500&q=80",
      size: "400ml",
      stock: 40
    },
    {
      id: "prod-hair-4",
      sku: "SKU-HAIR-004",
      name: "The Ordinary Multi-Peptide Serum for Hair Density",
      description: "Concentrated leave-in serum that supports scalp health for visibly thicker and healthier hair.",
      price: 2150,
      discountPrice: 1850,
      image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500&q=80",
      size: "60ml",
      stock: 20
    }
  ];

  for (const item of hairItems) {
    const existing = await prisma.product.findUnique({ where: { id: item.id } });
    if (!existing) {
      await prisma.product.create({
        data: {
          id: item.id,
          name: item.name,
          description: item.description,
          categoryId: cat.id,
          brandId: brand.id,
          images: {
            create: [
              {
                url: item.image,
                isPrimary: true
              }
            ]
          },
          variants: {
            create: [
              {
                sku: item.sku,
                name: item.size,
                price: item.price,
                discountPrice: item.discountPrice,
                stock: item.stock
              }
            ]
          }
        }
      });
      console.log(`✅ Seeded hair product: ${item.name}`);
    } else {
      console.log(`ℹ️ Already exists: ${item.name}`);
    }
  }

  console.log("🎉 Hair Care seeding finished!");
}

seedHair()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
