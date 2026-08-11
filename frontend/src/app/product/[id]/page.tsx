import ProductClient from "./ProductClient";

export async function generateStaticParams() {
  return [{ id: "default" }];
}

export default function Page() {
  return <ProductClient />;
}
