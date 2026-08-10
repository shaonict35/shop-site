import { Metadata } from "next";

export const metadata: Metadata = {
  title: "All Brands | GlowGoodly Bangladesh",
  description: "Explore top authentic beauty and skincare brands available at GlowGoodly. Shop CeraVe, COSRX, The Ordinary, L'Oreal, and more in Bangladesh.",
  keywords: ["authentic cosmetics brands bd", "skincare brands bangladesh", "cerave bd", "cosrx bangladesh", "buy makeup brands dhaka"],
};

export default function BrandsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
