import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shop All Authentic Cosmetics & Skincare — GlowGoodly Bangladesh",
  description: "Browse 100% authentic cosmetics, Korean skincare, makeup tools, fragrances, and hair care products in Bangladesh. Fast nationwide cash on delivery at GlowGoodly.",
  keywords: ["shop cosmetics bd", "buy skincare online bangladesh", "glowgoodly shop", "authentic makeup dhaka", "beauty products price in bd"],
  alternates: {
    canonical: "https://shop.glowgoodly.com/shop",
  },
  openGraph: {
    title: "Shop All Products | GlowGoodly Bangladesh",
    description: "Browse 100% authentic cosmetics, skincare, and hair care products with fast cash on delivery.",
    url: "https://shop.glowgoodly.com/shop",
    siteName: "GlowGoodly",
    type: "website",
    images: [{ url: "/images/logo.png", width: 512, height: 512, alt: "GlowGoodly Shop" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Shop All Authentic Products | GlowGoodly BD",
    description: "Browse 100% authentic cosmetics, skincare, and hair care products in Bangladesh.",
    images: ["/images/logo.png"],
  },
};

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
