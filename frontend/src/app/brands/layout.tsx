import { Metadata } from "next";

export const metadata: Metadata = {
  title: "All Brands — 100% Genuine International Beauty Brands",
  description: "Browse 100% original international skincare & makeup brands available in Bangladesh at GlowGoodly. CeraVe, The Ordinary, COSRX, M.A.C, Laneige, and more.",
  keywords: ["cosmetics brands bangladesh", "the ordinary bangladesh", "cerave bd", "cosrx bangladesh", "authentic brands dhaka", "korean skincare brands"],
  alternates: {
    canonical: "https://shop.glowgoodly.com/brands",
  },
  openGraph: {
    title: "All Beauty & Skincare Brands | GlowGoodly Bangladesh",
    description: "Shop top international cosmetics and skincare brands with 100% authenticity guaranteed in BD.",
    url: "https://shop.glowgoodly.com/brands",
  },
};

export default function BrandsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
