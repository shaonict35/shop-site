import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Frequently Asked Questions (FAQ) — Delivery, Authenticity & Orders",
  description: "Find answers to frequently asked questions about GlowGoodly: product authenticity, shipping charges across Bangladesh, delivery times, and returns.",
  keywords: ["glowgoodly faq", "cosmetics delivery dhaka", "is glowgoodly authentic", "bangladesh cosmetics shipping", "return policy bd"],
  alternates: {
    canonical: "https://shop.glowgoodly.com/faq",
  },
  openGraph: {
    title: "FAQ — GlowGoodly Bangladesh",
    description: "Answers to common questions about authenticity, delivery rates, and order tracking at GlowGoodly.",
    url: "https://shop.glowgoodly.com/faq",
  },
};

const faqSchemaJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Are the products authentic?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes, 100%! We guarantee that all our cosmetics, skincare, and fragrances are 100% authentic and sourced directly from brands or authorized distributors."
      }
    },
    {
      "@type": "Question",
      "name": "What are the shipping charges?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Our delivery charges are BDT 70 inside Dhaka City, BDT 100 for Keraniganj, Savar, Narayanganj & Gazipur, and BDT 130 for anywhere else in Bangladesh."
      }
    },
    {
      "@type": "Question",
      "name": "How long does delivery take?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Orders inside Dhaka are delivered within 24-48 hours. Orders outside Dhaka take 2 to 4 working days."
      }
    },
    {
      "@type": "Question",
      "name": "How do I check my order status?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "You can track your order using the order number generated during checkout on our tracking page. Once an admin updates status to 'Shipped', a live Pathao/Steadfast tracking link is generated."
      }
    },
    {
      "@type": "Question",
      "name": "How does the loyalty program work?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Registered customers earn loyalty points (5% of the total order value) on every checkout. These points accumulate in your profile and can be redeemed for discounts on subsequent checkouts."
      }
    }
  ]
};

export default function FAQLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchemaJsonLd) }}
      />
      {children}
    </>
  );
}
