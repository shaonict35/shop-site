import CmsClient from "./CmsClient";

export async function generateStaticParams() {
  return [
    { slug: "about" },
    { slug: "contact" },
    { slug: "faq" },
    { slug: "privacy-policy" },
    { slug: "terms" },
    { slug: "refund-policy" },
  ];
}

export default function Page() {
  return <CmsClient />;
}
