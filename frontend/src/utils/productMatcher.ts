import fallbackProducts from "../data/fallbackProducts.json";

export function generateSlug(text: string): string {
  if (!text) return "";
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // remove special characters
    .replace(/[\s_-]+/g, "-") // collapse spaces and dashes
    .replace(/^-+|-+$/g, ""); // trim dashes
}

export function normalizeKey(str: string): string {
  if (!str) return "";
  return str.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function findLooseProduct(target: string | null | undefined): any | null {
  if (!target || !Array.isArray(fallbackProducts)) return null;

  let raw = target.toString().trim();
  // Strip path prefixes if full URL or path was passed
  raw = raw.replace(/^https?:\/\/[^\/]+/i, "");
  raw = raw.replace(/^\/?(?:product|products)\//i, "");
  // Strip trailing slashes, leading slashes, .html
  raw = raw.replace(/^[\/\\]+|[\/\\]+$/g, "").replace(/\.html$/i, "");
  try {
    raw = decodeURIComponent(raw);
  } catch {}

  const rawLower = raw.toLowerCase().trim();
  if (!rawLower || rawLower === "default" || rawLower === "[slug]") return null;

  const rawNorm = normalizeKey(rawLower);

  // 1. Direct ID / Slug exact match (0ms instant lookup)
  for (const p of fallbackProducts as any[]) {
    if (!p) continue;
    if (p.id && String(p.id).toLowerCase() === rawLower) return p;
    if (p.slug && String(p.slug).toLowerCase() === rawLower) return p;
    if (p.name && generateSlug(p.name) === rawLower) return p;
  }

  // 2. High-priority clearance & promotional aliases
  if (rawLower.includes("beauty-of-joseon-relief-sun")) {
    const boj = (fallbackProducts as any[]).find(
      (p: any) => p?.id === "prod-clearance-2" || (p?.slug && p.slug.includes("beauty-of-joseon-relief-sun"))
    );
    if (boj) return boj;
  }
  if (rawLower.includes("cosrx-low-ph")) {
    const cosrx = (fallbackProducts as any[]).find(
      (p: any) => p?.id === "prod-clearance-1" || (p?.slug && p.slug.includes("cosrx-low-ph"))
    );
    if (cosrx) return cosrx;
  }
  if (rawLower.includes("laneige-lip-sleeping-mask")) {
    const laneige = (fallbackProducts as any[]).find(
      (p: any) => p?.id === "prod-clearance-4" || (p?.slug && p.slug.includes("laneige-lip"))
    );
    if (laneige) return laneige;
  }
  if (rawLower.includes("parachute-just-for-baby")) {
    const parachute = (fallbackProducts as any[]).find(
      (p: any) => p?.id === "9b70ea94-bbec-4d46-9a1f-b09ba335da81" || (p?.name && p.name.includes("Parachute Just for Baby"))
    );
    if (parachute) return parachute;
  }

  // 3. Normalized exact match (ignores hyphens, underscores, spaces, punctuation)
  if (rawNorm.length > 3) {
    for (const p of fallbackProducts as any[]) {
      if (!p) continue;
      if (p.id && normalizeKey(p.id) === rawNorm) return p;
      if (p.slug && normalizeKey(p.slug) === rawNorm) return p;
      if (p.name && normalizeKey(p.name) === rawNorm) return p;
    }
  }

  // 4. Substring inclusion match (e.g. slug without clearance suffix or prefix)
  if (rawLower.length > 5) {
    for (const p of fallbackProducts as any[]) {
      if (!p) continue;
      const pSlug = (p.slug || "").toLowerCase();
      if (pSlug && (pSlug.includes(rawLower) || rawLower.includes(pSlug))) return p;
      const pNameSlug = generateSlug(p.name || "");
      if (pNameSlug && (pNameSlug.includes(rawLower) || rawLower.includes(pNameSlug))) return p;
    }
  }

  // 5. Token overlap match (e.g. 60%+ of slug words match product name/slug)
  const tokens = rawLower.split(/[-_\s]+/).filter((t) => t.length >= 3);
  if (tokens.length >= 2) {
    let bestMatch: any = null;
    let highestScore = 0;

    for (const p of fallbackProducts as any[]) {
      if (!p || !p.name) continue;
      const targetText = `${p.name} ${p.slug || ""}`.toLowerCase();
      let matches = 0;
      for (const token of tokens) {
        if (targetText.includes(token)) {
          matches++;
        }
      }
      const score = matches / tokens.length;
      if (score > highestScore && score >= 0.6) {
        highestScore = score;
        bestMatch = p;
      }
    }
    if (bestMatch) return bestMatch;
  }

  return null;
}
