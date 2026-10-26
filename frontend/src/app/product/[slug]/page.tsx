import type { Metadata } from "next";
import ProductClient from "./ProductClient";
import fallbackProducts from "../../../data/fallbackProducts.json";
import { generateSlug, findLooseProduct } from "../../../utils/productMatcher";

export async function generateStaticParams() {
  const set = new Set<string>();

  // 1. Core static routes for client-side dynamic rendering in cPanel SPA mode
  set.add("default");
  set.add("[slug]");
  set.add("beauty-of-joseon-relief-sun-clearance");
  set.add("beauty-of-joseon-relief-sun-rice-probiotics-spf50-clearance-stock");

  // 2. Pre-seed with all canonical product slugs and IDs from catalog data (3,214 products)
  if (Array.isArray(fallbackProducts)) {
    fallbackProducts.forEach((p: any) => {
      if (p.slug) set.add(String(p.slug));
      else if (p.name) set.add(generateSlug(p.name));
      if (p.id) set.add(String(p.id));
    });
  }

  return Array.from(set).filter(Boolean).map((slug) => ({ slug }));
}

interface Props {
  params: Promise<{ slug: string }>;
}

async function getProduct(slug: string) {
  if (!slug || slug === "default" || slug === "undefined" || slug === "[slug]") return null;

  let decoded = slug;
  try {
    decoded = decodeURIComponent(slug);
  } catch {
    decoded = slug;
  }

  // 1. Instant local lookup in catalog data (fast build time, full SEO and rich schema)
  const localMatch = findLooseProduct(decoded);
  if (localMatch) {
    return localMatch;
  }

  // 2. Quick fallback query to backend API if run with active backend
  const apiUrls = [
    process.env.NEXT_PUBLIC_API_URL,
    "http://localhost:5000",
  ].filter(Boolean) as string[];

  for (const url of apiUrls) {
    try {
      const apiBase = url.replace(/\/+$/, "") + (url.endsWith("/api") ? "" : "/api");
      const res = await fetch(`${apiBase}/products/${encodeURIComponent(decoded)}`, {
        signal: AbortSignal.timeout(400),
      });
      if (res.ok) {
        const data = await res.json();
        const prod = data?.product || (data?.id ? data : null);
        if (prod && (prod.id || prod.name)) return prod;
      }
    } catch {
      // Continue
    }
  }

  return null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  let decodedSlug = "";
  try {
    decodedSlug = resolvedParams?.slug ? decodeURIComponent(resolvedParams.slug) : "";
  } catch {
    decodedSlug = resolvedParams?.slug || "";
  }
  const product = await getProduct(decodedSlug);

  if (!product) {
    return {
      title: "Authentic Product",
      description: "Explore 100% genuine cosmetics and skincare products at GlowGoodly Bangladesh.",
    };
  }

  const cleanDescription = (product.metaDescription || product.description || "")
    .replace(/<[^>]*>?/gm, "")
    .slice(0, 160)
    .trim();

  const description = cleanDescription
    ? `${cleanDescription} — Buy authentic in Bangladesh at GlowGoodly with fast cash on delivery.`
    : `Buy authentic ${product.name} at GlowGoodly Bangladesh. 100% original guaranteed with fast delivery across BD.`;

  const primaryImage =
    product.images?.find((img: any) => img.isPrimary)?.url ||
    product.images?.[0]?.url ||
    "https://shop.glowgoodly.com/user-glow-logo.png";

  const productSlug = product.slug || decodedSlug;

  return {
    title: `${product.name} — Authentic in Bangladesh`,
    description,
    keywords: [
      product.name,
      `${product.name} price in bd`,
      `${product.brand?.name || "cosmetics"} bangladesh`,
      "buy authentic skincare bd",
      "glowgoodly",
    ],
    alternates: {
      canonical: `https://shop.glowgoodly.com/product/${productSlug}`,
    },
    openGraph: {
      title: `${product.name} | GlowGoodly Bangladesh`,
      description,
      url: `https://shop.glowgoodly.com/product/${productSlug}`,
      siteName: "GlowGoodly",
      images: [
        {
          url: primaryImage,
          width: 800,
          height: 800,
          alt: product.name,
        },
      ],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${product.name} | GlowGoodly BD`,
      description,
      images: [primaryImage],
    },
  };
}

export default async function Page({ params }: Props) {
  const resolvedParams = await params;
  let decodedSlug = "";
  try {
    decodedSlug = resolvedParams?.slug ? decodeURIComponent(resolvedParams.slug) : "";
  } catch {
    decodedSlug = resolvedParams?.slug || "";
  }
  const product = await getProduct(decodedSlug);

  let jsonLd = null;
  if (product) {
    const primaryVariant = product.variants?.[0];
    const price = primaryVariant?.discountPrice || primaryVariant?.price || 0;
    const inStock = product.variants?.some((v: any) => v.stock > 0) ?? true;
    const images = product.images?.map((img: any) => img.url) || [];
    const reviews = product.reviews || [];
    const reviewCount = reviews.length;
    const avgRating =
      reviewCount > 0
        ? (
            reviews.reduce(
              (acc: number, r: any) => acc + (Number(r.rating) || 5),
              0
            ) / reviewCount
          ).toFixed(1)
        : "5.0";

    jsonLd = {
      "@context": "https://schema.org",
      "@type": "Product",
      "name": product.name,
      "image":
        images.length > 0
          ? images
          : ["https://shop.glowgoodly.com/user-glow-logo.png"],
      "description": (
        product.metaDescription ||
        product.description ||
        product.name
      )
        .replace(/<[^>]*>?/gm, "")
        .slice(0, 300),
      "sku": primaryVariant?.sku || product.id,
      "brand": {
        "@type": "Brand",
        "name": product.brand?.name || "Authentic",
      },
      "offers": {
        "@type": "Offer",
        "url": `https://shop.glowgoodly.com/product/${product.slug || product.id}`,
        "priceCurrency": "BDT",
        "price": price,
        "priceValidUntil": "2027-12-31",
        "availability": inStock
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
        "itemCondition": "https://schema.org/NewCondition",
        "seller": {
          "@type": "Organization",
          "name": "GlowGoodly Bangladesh",
        },
      },
      ...(reviewCount > 0
        ? {
            aggregateRating: {
              "@type": "AggregateRating",
              ratingValue: avgRating,
              reviewCount: reviewCount,
            },
            review: reviews.map((rev: any) => ({
              "@type": "Review",
              author: {
                "@type": "Person",
                name: rev.customerName || "Customer",
              },
              datePublished: rev.createdAt,
              reviewBody: rev.comment || "",
              reviewRating: {
                "@type": "Rating",
                ratingValue: rev.rating || 5,
              },
            })),
          }
        : {}),
    };
  }

  const breadcrumbJsonLd = product ? {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://shop.glowgoodly.com"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": product.category?.name || "Shop",
        "item": `https://shop.glowgoodly.com/shop?category=${encodeURIComponent(product.category?.slug || product.category?.name || "all")}`
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": product.name,
        "item": `https://shop.glowgoodly.com/product/${product.slug || product.id}`
      }
    ]
  } : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      {breadcrumbJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
        />
      )}
      <ProductClient initialProduct={product} slug={decodedSlug} />
    </>
  );
}
