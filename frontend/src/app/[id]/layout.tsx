import { Metadata, ResolvingMetadata } from "next";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { id } = await params;
  try {
    const res = await fetch(`http://localhost:5000/api/products/${id}`, { next: { revalidate: 60 } });
    const product = await res.json();

    if (product && product.product) {
      const p = product.product;
      const brandName = p.brand?.name || "Premium Brand";
      const catName = p.category?.name || "Skincare";
      
      return {
        title: `${p.name} | Buy in Bangladesh | GlowGoodly`,
        description: `Buy authentic ${p.name} by ${brandName} at the best price in Bangladesh. 100% original ${catName} products with fast delivery in BD.`,
        keywords: [p.name, brandName, `${brandName} in bangladesh`, `buy ${catName} online bd`, "authentic makeup dhaka", "glowgoodly bd", `${p.name} price in bd`],
        openGraph: {
          title: `${p.name} - 100% Authentic in Bangladesh`,
          description: `Shop original ${p.name} from GlowGoodly. Fast home delivery across BD.`,
          images: p.images?.length > 0 ? [p.images[0].url] : [],
        },
      };
    }
  } catch (error) {
    console.error("Error generating metadata", error);
  }

  return {
    title: "Buy Authentic Beauty Products in Bangladesh | GlowGoodly",
    description: "Discover 100% original cosmetics, skincare, and hair care products at GlowGoodly Bangladesh.",
  };
}

export default function ProductLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
