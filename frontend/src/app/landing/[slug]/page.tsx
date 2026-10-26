import LandingClient from "./LandingClient";
import fs from "fs";
import path from "path";

export async function generateStaticParams() {
  const set = new Set<string>();
  set.add("default");
  set.add("[slug]");
  set.add("seasonal-offer");

  // Read backend/data/landing_pages.json if exists
  try {
    const dataFile = path.resolve(process.cwd(), "..", "backend", "data", "landing_pages.json");
    if (fs.existsSync(dataFile)) {
      const raw = fs.readFileSync(dataFile, "utf-8");
      const list = JSON.parse(raw);
      if (Array.isArray(list)) {
        list.forEach((p: any) => {
          if (p.slug) set.add(String(p.slug));
        });
      }
    }
  } catch (e) {}

  const apiUrls = [
    process.env.NEXT_PUBLIC_API_URL,
    "http://localhost:5000",
    "https://api.glowgoodly.com"
  ].filter(Boolean) as string[];

  for (const url of apiUrls) {
    try {
      const apiBase = url.replace(/\/+$/, "") + (url.endsWith("/api") ? "" : "/api");
      const res = await fetch(`${apiBase}/settings/landing-pages`, {
        signal: AbortSignal.timeout(1500),
      });
      if (res.ok) {
        const pages = await res.json();
        if (Array.isArray(pages)) {
          pages.forEach((p: any) => {
            if (p.slug) set.add(String(p.slug));
          });
          break;
        }
      }
    } catch {}
  }

  return Array.from(set).map((slug) => ({ slug }));
}

export default function Page() {
  return <LandingClient />;
}

