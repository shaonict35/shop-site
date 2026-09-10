import { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us — Authentic Cosmetics & Skincare Bangladesh",
  description: "Learn about GlowGoodly Bangladesh: our mission, authenticity guarantee, and our commitment to bringing 100% original cosmetics and skincare to BD.",
  keywords: ["about glowgoodly", "authentic cosmetics bangladesh", "original skincare shop dhaka", "glowgoodly story"],
  alternates: {
    canonical: "https://shop.glowgoodly.com/about",
  },
  openGraph: {
    title: "About GlowGoodly™ Bangladesh",
    description: "Learn about our commitment to 100% authentic cosmetics and premium skincare across Bangladesh.",
    url: "https://shop.glowgoodly.com/about",
  },
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
