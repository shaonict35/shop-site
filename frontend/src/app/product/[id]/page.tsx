import ProductClient from "./ProductClient";

export const dynamicParams = true;

export async function generateStaticParams() {
  return [{ id: "default" }];
}

export default function Page() {
  return <ProductClient />;
}
