import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "All Products – GlowGoodly | 100% Authentic Beauty & Cosmetics BD",
  description: "Browse all 100% original skincare, makeup, haircare, baby care, and beauty products with best prices and fast nationwide delivery across Bangladesh.",
  alternates: {
    canonical: "https://glowgoodly.com/products",
  },
  openGraph: {
    title: "All Products – GlowGoodly",
    description: "Browse 100% original cosmetics, skincare, and beauty products in Bangladesh.",
    url: "https://glowgoodly.com/products",
    siteName: "GlowGoodly",
    type: "website",
  }
};

export default function ProductsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
