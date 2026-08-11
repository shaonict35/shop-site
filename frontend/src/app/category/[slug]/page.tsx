import CategoryClient from "./CategoryClient";

export async function generateStaticParams() {
  return [
    { slug: "makeup" },
    { slug: "skincare" },
    { slug: "haircare" },
    { slug: "personal-care" },
    { slug: "mom-baby" },
    { slug: "fragrance" },
    { slug: "undergarments" },
    { slug: "combo" },
    { slug: "jewellery" },
    { slug: "clearance-sale" },
    { slug: "men" },
  ];
}

export default function Page() {
  return <CategoryClient />;
}
