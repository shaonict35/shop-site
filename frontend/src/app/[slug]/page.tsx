import CmsClient from "./CmsClient";

export const dynamicParams = true;

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
