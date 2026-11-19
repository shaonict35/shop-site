import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Makeup 101 — Complete Beauty & Cosmetic Guide",
  description: "Master makeup essentials in Bangladesh. Step-by-step beauty routines for face primer, foundation, concealer, eyes, and lips with 100% authentic cosmetics at GlowGoodly.",
  keywords: ["makeup guide bangladesh", "how to apply foundation", "makeup 101 bd", "authentic cosmetics dhaka", "glowgoodly makeup"],
  alternates: {
    canonical: "https://shop.glowgoodly.com/makeup-101",
  },
  openGraph: {
    title: "Makeup 101 — Master Beauty Essentials | GlowGoodly BD",
    description: "Step-by-step beauty routines for flawless makeup with authentic cosmetics.",
    url: "https://shop.glowgoodly.com/makeup-101",
    siteName: "GlowGoodly",
    type: "article",
    images: [{ url: "/images/logo.png", width: 512, height: 512, alt: "Makeup 101 GlowGoodly" }],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

