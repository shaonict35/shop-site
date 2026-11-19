import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Skin Care 101 — Daily Routine & Dermatologist-Approved Tips",
  description: "Learn the fundamentals of effective Korean and authentic skincare in Bangladesh. Cleanser, toner, serum, moisturizer, and sunscreen routine for healthy glowing skin.",
  keywords: ["skincare routine bd", "korean skincare guide bangladesh", "skin care 101", "acne treatment dhaka", "glowgoodly skincare"],
  alternates: {
    canonical: "https://shop.glowgoodly.com/skin-care-101",
  },
  openGraph: {
    title: "Skin Care 101 — Complete Skincare Routine Guide | GlowGoodly BD",
    description: "Learn how to build a personalized skincare routine with 100% genuine products.",
    url: "https://shop.glowgoodly.com/skin-care-101",
    siteName: "GlowGoodly",
    type: "article",
    images: [{ url: "/images/logo.png", width: 512, height: 512, alt: "Skin Care 101 GlowGoodly" }],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

