import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us — Customer Support & Order Assistance",
  description: "Get in touch with GlowGoodly customer support. Have questions about orders, deliveries, or beauty product authenticity? Contact us today.",
  keywords: ["contact glowgoodly", "glowgoodly phone number", "glowgoodly address dhaka", "beauty shop support bangladesh"],
  alternates: {
    canonical: "https://shop.glowgoodly.com/contact",
  },
  openGraph: {
    title: "Contact GlowGoodly Support Bangladesh",
    description: "Need help with your order or product inquiries? Contact GlowGoodly customer support.",
    url: "https://shop.glowgoodly.com/contact",
  },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
