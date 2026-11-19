import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hair Care 101 — Hair Fall & Damage Recovery Guide",
  description: "Combat hair fall, dandruff, and frizzy hair in Bangladesh with proven hair care rituals. Discover sulfate-free shampoo, conditioner, hair masks, and scalp oils at GlowGoodly.",
  keywords: ["hair care routine bd", "hair fall solution bangladesh", "dandruff treatment dhaka", "hair care 101", "glowgoodly haircare"],
  alternates: {
    canonical: "https://shop.glowgoodly.com/hair-care-101",
  },
  openGraph: {
    title: "Hair Care 101 — Healthy Hair & Scalp Guide | GlowGoodly BD",
    description: "Combat hair fall, dandruff, and frizzy hair with genuine hair care products.",
    url: "https://shop.glowgoodly.com/hair-care-101",
    siteName: "GlowGoodly",
    type: "article",
    images: [{ url: "/images/logo.png", width: 512, height: 512, alt: "Hair Care 101 GlowGoodly" }],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

