import LandingClient from "./LandingClient";

export async function generateStaticParams() {
  return [{ slug: "seasonal-offer" }];
}

export default function Page() {
  return <LandingClient />;
}
