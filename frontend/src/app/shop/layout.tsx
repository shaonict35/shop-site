import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shop All Products | GlowGoodly Bangladesh",
  description: "Browse our extensive catalog of authentic cosmetics, skincare, and hair care products in Bangladesh. Find the best beauty deals at GlowGoodly.",
  keywords: ["shop cosmetics bd", "buy skincare online bangladesh", "glowgoodly shop", "authentic makeup dhaka", "beauty products price in bd"],
};

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
