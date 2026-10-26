import fs from "fs";
import path from "path";

export interface CatalogProduct {
  id: string;
  name: string;
  slug?: string;
  description: string;
  ingredients?: string;
  howToUse?: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  brandId?: string;
  brand: { id: string; name: string; logoUrl?: string | null };
  categoryId?: string;
  category: { id: string; name: string; parentId?: string | null };
  campaignName?: string | null;
  status: string;
  variants: Array<{
    id: string;
    productId?: string;
    name: string;
    shadeColor?: string | null;
    sizeValue?: string | null;
    price: number;
    discountPrice: number | null;
    costPrice?: number | null;
    stock: number;
    sku: string;
    imageUrl?: string | null;
  }>;
  images: Array<{
    id: string;
    productId?: string;
    url: string;
    isPrimary: boolean;
  }>;
  createdAt?: string;
  updatedAt?: string;
}

export function generateSlug(text: string): string {
  if (!text) return "";
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ─── INITIAL BASE PRODUCTS ───────────────────────────────────────────────────
const PARACHUTE_BABY_SOAP: CatalogProduct = {
  id: "9b70ea94-bbec-4d46-9a1f-b09ba335da81",
  name: "Parachute Just for Baby - Baby Soap Pack of 2 Combo ( x 2) (Expiry: October 2026)",
  slug: "parachute-just-for-baby-baby-soap-pack-of-2-combo-x-2-expiry-october-2026",
  description: "Parachute Just for Baby - Baby Soap Pack of 2 Combo (125g x 2) is 100% authentic, high quality mom & baby skincare product. Gentle formulation tested for delicate skin with nourishing olive oil and almond milk extracts.",
  ingredients: "Olive Oil, Almond Milk extracts, gentle cleansing base, natural fragrance.",
  howToUse: "Wet baby's skin with warm water. Gently lather soap and rinse thoroughly.",
  metaTitle: "Buy Parachute Just for Baby - Baby Soap Pack of 2 Combo (125g x 2) Online BD",
  metaDescription: "Buy authentic Parachute Just for Baby - Baby Soap Pack of 2 Combo at best price in Bangladesh from GlowGoodly.",
  metaKeywords: "Parachute Just for Baby, Baby Soap, Mom and baby bd, glowgoodly",
  brandId: "brand-parachute",
  brand: { id: "brand-parachute", name: "Parachute Just for Baby", logoUrl: "https://upload.wikimedia.org/wikipedia/commons/4/4b/Marico_Logo.svg" },
  categoryId: "cat-mom-baby",
  category: { id: "cat-mom-baby", name: "Mom & Baby", parentId: null },
  campaignName: "COMBO",
  status: "Active",
  variants: [
    {
      id: "263c68eb-24c8-44da-8805-202d92f4e2d8",
      productId: "9b70ea94-bbec-4d46-9a1f-b09ba335da81",
      name: "125g x 2 Combo Pack",
      shadeColor: null,
      sizeValue: "125g x 2",
      price: 300,
      discountPrice: 210,
      stock: 25,
      sku: "40365",
      imageUrl: "https://bk.shajgoj.com/storage/2024/08/parachute-just-for-baby-baby-soap-125g-pack-of-2-combo-125g-x-2-small.PNG"
    }
  ],
  images: [
    {
      id: "0bfc09f8-e4d8-4a7c-8cfe-a1671378eb56",
      productId: "9b70ea94-bbec-4d46-9a1f-b09ba335da81",
      url: "https://bk.shajgoj.com/storage/2024/08/parachute-just-for-baby-baby-soap-125g-pack-of-2-combo-125g-x-2.PNG",
      isPrimary: true
    }
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

let cachedFallbackProducts: CatalogProduct[] | null = null;

export function getFallbackCatalogProducts(): CatalogProduct[] {
  if (cachedFallbackProducts && cachedFallbackProducts.length > 0) {
    return cachedFallbackProducts;
  }

  const products: CatalogProduct[] = [PARACHUTE_BABY_SOAP];

  // Try to load fallback products from local backend/data or frontend/src/data
  const candidatePaths = [
    path.resolve(__dirname, "../data/fallbackProducts.json"),
    path.resolve(process.cwd(), "data/fallbackProducts.json"),
    path.resolve(process.cwd(), "backend/data/fallbackProducts.json"),
    path.resolve(__dirname, "../../frontend/src/data/fallbackProducts.json"),
    path.resolve(process.cwd(), "frontend/src/data/fallbackProducts.json"),
    path.resolve(process.cwd(), "../frontend/src/data/fallbackProducts.json"),
    path.resolve(__dirname, "../public/data/fallbackProducts.json")
  ];

  for (const p of candidatePaths) {
    if (fs.existsSync(p)) {
      try {
        const raw = fs.readFileSync(p, "utf8");
        const list = JSON.parse(raw);
        if (Array.isArray(list) && list.length > 0) {
          list.forEach((item: any) => {
            if (item && item.id && !products.some(existing => existing.id === item.id)) {
              products.push({
                ...item,
                slug: item.slug || generateSlug(item.name || item.id),
                status: item.status || "Active",
                variants: Array.isArray(item.variants) ? item.variants : [],
                images: Array.isArray(item.images) ? item.images : []
              });
            }
          });
          break;
        }
      } catch (err) {
        console.warn("Could not read fallback products file at:", p);
      }
    }
  }

  cachedFallbackProducts = products;
  return products;
}

export function findCatalogProduct(idOrSlug: string): CatalogProduct | null {
  if (!idOrSlug) return null;
  let decoded = idOrSlug;
  try {
    decoded = decodeURIComponent(idOrSlug).toLowerCase().trim();
  } catch {
    decoded = String(idOrSlug).toLowerCase().trim();
  }
  const prods = getFallbackCatalogProducts();

  // 1. Direct match by id or slug
  const direct = prods.find(p => 
    p.id.toLowerCase() === decoded || 
    (p.slug && p.slug.toLowerCase() === decoded) ||
    generateSlug(p.name).toLowerCase() === decoded
  );
  if (direct) return direct;

  // 2. Loose alphanumeric match
  const normTarget = decoded.replace(/[^\w]/g, "");
  if (normTarget) {
    const loose = prods.find(p => {
      const sNorm = (p.slug || "").replace(/[^\w]/g, "").toLowerCase();
      const nNorm = generateSlug(p.name).replace(/[^\w]/g, "").toLowerCase();
      const idNorm = p.id.replace(/[^\w]/g, "").toLowerCase();
      return sNorm === normTarget || nNorm === normTarget || idNorm === normTarget;
    });
    if (loose) return loose;
  }

  return null;
}

export function getFallbackCategories() {

  const prods = getFallbackCatalogProducts();
  const set = new Map<string, any>();

  set.set("cat-skincare", { id: "cat-skincare", name: "Skincare", parentId: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  set.set("cat-makeup", { id: "cat-makeup", name: "Makeup", parentId: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  set.set("cat-haircare", { id: "cat-haircare", name: "Haircare", parentId: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  set.set("cat-tools", { id: "cat-tools", name: "Makeup Tools", parentId: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  set.set("cat-clearance", { id: "cat-clearance", name: "Clearance Sale", parentId: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  set.set("cat-combo", { id: "cat-combo", name: "Combo", parentId: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  set.set("cat-mom-baby", { id: "cat-mom-baby", name: "Mom & Baby", parentId: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });

  prods.forEach(p => {
    if (p.category && p.category.name && !set.has(p.category.id || p.category.name)) {
      set.set(p.category.id || p.category.name, {
        id: p.category.id || `cat-${generateSlug(p.category.name)}`,
        name: p.category.name,
        parentId: p.category.parentId || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
  });

  return Array.from(set.values());
}

export function getFallbackBrands() {
  const prods = getFallbackCatalogProducts();
  const set = new Map<string, any>();

  prods.forEach(p => {
    if (p.brand && p.brand.name && !set.has(p.brand.name)) {
      set.set(p.brand.name, {
        id: p.brand.id || `brand-${generateSlug(p.brand.name)}`,
        name: p.brand.name,
        logoUrl: p.brand.logoUrl || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
  });

  return Array.from(set.values());
}

export function getFallbackBanners() {
  return [
    {
      id: "hero-slide-1",
      page: "Hero Slides",
      title: "Hero Slide 1 - Nirvana Makeup",
      imageUrl: "/images/sliders/slider-1.png",
      mobileImageUrl: "/images/sliders/slider-1.png",
      tabletImageUrl: "/images/sliders/slider-1.png",
      linkUrl: "/shop?brand=nirvana",
      bgColor: "linear-gradient(135deg, #e63b7a 0%, #ff758c 100%)",
      isActive: true,
      sortOrder: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: "hero-slide-2",
      page: "Hero Slides",
      title: "Hero Slide 2 - July Jaw Droppers",
      imageUrl: "/images/sliders/slider-2.png",
      mobileImageUrl: "/images/sliders/slider-2.png",
      tabletImageUrl: "/images/sliders/slider-2.png",
      linkUrl: "/shop?deal=jaw-droppers",
      bgColor: "linear-gradient(135deg, #495057 0%, #1a1a2e 100%)",
      isActive: true,
      sortOrder: 2,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: "hero-slide-3",
      page: "Hero Slides",
      title: "Hero Slide 3 - Treasure of Glow",
      imageUrl: "/images/sliders/slider-3.png",
      mobileImageUrl: "/images/sliders/slider-3.png",
      tabletImageUrl: "/images/sliders/slider-3.png",
      linkUrl: "/shop?deal=treasure-of-glow",
      bgColor: "linear-gradient(135deg, #0e1e38 0%, #0a101f 100%)",
      isActive: true,
      sortOrder: 3,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: "homepage-wide-banner",
      page: "Homepage Wide Banner",
      title: "Beauty Must Haves Exclusive Savings",
      imageUrl: "/hero-slide-1.png",
      mobileImageUrl: "/hero-slide-1.png",
      tabletImageUrl: "/hero-slide-1.png",
      linkUrl: "/shop",
      isActive: true,
      sortOrder: 4,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: "deal-card-1",
      page: "Deal Card 1",
      title: "Deal Card 1 - Ombre 30% Off",
      imageUrl: "/images/deals/deal-1.png",
      mobileImageUrl: "/images/deals/deal-1.png",
      tabletImageUrl: "/images/deals/deal-1.png",
      linkUrl: "/shop?deal=ombre",
      isActive: true,
      sortOrder: 5,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: "deal-card-2",
      page: "Deal Card 2",
      title: "Deal Card 2 - Marico Free Delivery",
      imageUrl: "/images/deals/deal-2.png",
      mobileImageUrl: "/images/deals/deal-2.png",
      tabletImageUrl: "/images/deals/deal-2.png",
      linkUrl: "/shop?deal=marico",
      isActive: true,
      sortOrder: 6,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: "deal-card-3",
      page: "Deal Card 3",
      title: "Deal Card 3 - PNS Campaign",
      imageUrl: "/images/deals/deal-3.gif",
      mobileImageUrl: "/images/deals/deal-3.gif",
      tabletImageUrl: "/images/deals/deal-3.gif",
      linkUrl: "/shop?deal=pns",
      isActive: true,
      sortOrder: 7,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: "deal-card-4",
      page: "Deal Card 4",
      title: "Deal Card 4 - Senora Deal",
      imageUrl: "/images/deals/deal-4.jpg",
      mobileImageUrl: "/images/deals/deal-4.jpg",
      tabletImageUrl: "/images/deals/deal-4.jpg",
      linkUrl: "/shop?deal=senora",
      isActive: true,
      sortOrder: 8,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];
}
