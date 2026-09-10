import type { Metadata } from "next";
import ProductClient from "./ProductClient";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

async function getProduct(id: string) {
  if (!id || id === "default" || id === "undefined") return null;
  try {
    const apiBase = process.env.NEXT_PUBLIC_API_URL
      ? process.env.NEXT_PUBLIC_API_URL.replace(/\/+$/, "") + "/api"
      : "http://localhost:5000/api";

    const res = await fetch(`${apiBase}/products/${id}`, {
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(3500),
    });

    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const product = await getProduct(id);

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
      canonical: `https://shop.glowgoodly.com/product/${id}`,
    },
    openGraph: {
      title: `${product.name} | GlowGoodly™ Bangladesh`,
      description,
      url: `https://shop.glowgoodly.com/product/${id}`,
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
      title: `${product.name} | GlowGoodly™ BD`,
      description,
      images: [primaryImage],
    },
  };
}

export default async function Page({ params }: Props) {
  const { id } = await params;
  const product = await getProduct(id);

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
        "url": `https://shop.glowgoodly.com/product/${product.id}`,
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
          }
        : {}),
    };
  }

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <ProductClient />
    </>
  );
}
