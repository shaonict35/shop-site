const fs = require("fs");
const path = require("path");

const targetDir = path.join(__dirname, "../frontend/public/images/brands");

const brandSvgs = {
  "cerave.svg": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 60" width="200" height="60">
  <rect width="200" height="60" fill="transparent"/>
  <text x="100" y="38" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="28" font-weight="800" fill="#004b91" text-anchor="middle" letter-spacing="-0.5">
    Cera<tspan font-weight="900" fill="#008080">Ve</tspan>
  </text>
  <text x="100" y="49" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="7" font-weight="700" fill="#718096" text-anchor="middle" letter-spacing="1.5">
    DEVELOPED WITH DERMATOLOGISTS
  </text>
</svg>`,

  "the-ordinary.svg": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 60" width="200" height="60">
  <rect width="200" height="60" fill="transparent"/>
  <text x="100" y="34" font-family="Georgia, serif" font-size="21" font-weight="700" fill="#1a202c" text-anchor="middle" letter-spacing="0.5">
    The Ordinary.
  </text>
  <text x="100" y="48" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" font-size="6.5" font-weight="600" fill="#718096" text-anchor="middle" letter-spacing="1">
    CLINICAL FORMULATIONS WITH INTEGRITY
  </text>
</svg>`,

  "loreal.svg": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 60" width="200" height="60">
  <rect width="200" height="60" fill="transparent"/>
  <text x="100" y="34" font-family="'Didot', 'Bodoni MT', 'Cinzel', serif" font-size="24" font-weight="900" fill="#111827" text-anchor="middle" letter-spacing="4">
    L'ORÉAL
  </text>
  <text x="100" y="47" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="8" font-weight="700" fill="#dc2626" text-anchor="middle" letter-spacing="3.5">
    PARIS
  </text>
</svg>`,

  "maybelline.svg": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 60" width="200" height="60">
  <rect width="200" height="60" fill="transparent"/>
  <text x="100" y="33" font-family="Impact, Arial Black, sans-serif" font-size="21" font-weight="900" fill="#111827" text-anchor="middle" letter-spacing="1.5">
    MAYBELLINE
  </text>
  <text x="100" y="47" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="8" font-weight="800" fill="#db2777" text-anchor="middle" letter-spacing="3">
    NEW YORK
  </text>
</svg>`,

  "cosrx.svg": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 60" width="200" height="60">
  <rect width="200" height="60" fill="transparent"/>
  <text x="100" y="38" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" font-size="26" font-weight="900" fill="#0f172a" text-anchor="middle" letter-spacing="3">
    COSRX
  </text>
  <circle cx="152" cy="24" r="3" fill="#ef4444"/>
  <text x="100" y="50" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="7" font-weight="700" fill="#64748b" text-anchor="middle" letter-spacing="1">
    EXPECTING TOMORROW
  </text>
</svg>`,

  "innisfree.svg": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 60" width="200" height="60">
  <rect width="200" height="60" fill="transparent"/>
  <text x="100" y="36" font-family="'Century Gothic', -apple-system, sans-serif" font-size="23" font-weight="700" fill="#15803d" text-anchor="middle" letter-spacing="0.5">
    innisfree
  </text>
  <text x="100" y="48" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="7" font-weight="600" fill="#4ade80" text-anchor="middle" letter-spacing="1.5">
    NATURAL BENEFIT FROM JEJU
  </text>
</svg>`,

  "cetaphil.svg": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 60" width="200" height="60">
  <rect width="200" height="60" fill="transparent"/>
  <text x="100" y="36" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" font-size="24" font-weight="900" fill="#0284c7" text-anchor="middle" letter-spacing="0.5">
    Cetaphil
  </text>
  <text x="100" y="48" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="7" font-weight="700" fill="#16a34a" text-anchor="middle" letter-spacing="1">
    GENTLE SKINCARE
  </text>
</svg>`,

  "nivea.svg": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 60" width="200" height="60">
  <rect width="200" height="60" fill="transparent"/>
  <rect x="25" y="10" width="150" height="40" rx="8" fill="#002d72"/>
  <text x="100" y="37" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="3">
    NIVEA
  </text>
</svg>`,

  "olay.svg": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 60" width="200" height="60">
  <rect width="200" height="60" fill="transparent"/>
  <text x="100" y="37" font-family="Georgia, serif" font-size="26" font-weight="800" fill="#b45309" text-anchor="middle" letter-spacing="3">
    OLAY
  </text>
  <text x="100" y="49" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="6.5" font-weight="700" fill="#78350f" text-anchor="middle" letter-spacing="2">
    FEARLESS ARTISTRY
  </text>
</svg>`,

  "revlon.svg": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 60" width="200" height="60">
  <rect width="200" height="60" fill="transparent"/>
  <text x="100" y="36" font-family="'Futura', 'Trebuchet MS', Arial, sans-serif" font-size="23" font-weight="900" fill="#111827" text-anchor="middle" letter-spacing="4">
    REVLON
  </text>
  <rect x="50" y="42" width="100" height="2" fill="#e11d48"/>
</svg>`,

  "mac.svg": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 60" width="200" height="60">
  <rect width="200" height="60" fill="transparent"/>
  <text x="100" y="38" font-family="'Century Gothic', sans-serif" font-size="24" font-weight="900" fill="#000000" text-anchor="middle" letter-spacing="4">
    M · A · C
  </text>
</svg>`,

  "the-body-shop.svg": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 60" width="200" height="60">
  <rect width="200" height="60" fill="transparent"/>
  <text x="100" y="32" font-family="'Century Gothic', sans-serif" font-size="16" font-weight="900" fill="#047857" text-anchor="middle" letter-spacing="2">
    THE BODY SHOP
  </text>
  <text x="100" y="46" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="7" font-weight="700" fill="#059669" text-anchor="middle" letter-spacing="1">
    ETHICAL &amp; NATURAL BEAUTY
  </text>
</svg>`,

  "nyx.svg": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 60" width="200" height="60">
  <rect width="200" height="60" fill="transparent"/>
  <text x="100" y="33" font-family="Arial Black, Impact, sans-serif" font-size="22" font-weight="900" fill="#000000" text-anchor="middle" letter-spacing="2">
    NYX
  </text>
  <text x="100" y="46" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="6.5" font-weight="800" fill="#ec4899" text-anchor="middle" letter-spacing="2">
    PROFESSIONAL MAKEUP
  </text>
</svg>`,

  "elf.svg": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 60" width="200" height="60">
  <rect width="200" height="60" fill="transparent"/>
  <text x="100" y="38" font-family="'Century Gothic', sans-serif" font-size="26" font-weight="700" fill="#000000" text-anchor="middle" letter-spacing="2">
    e.l.f.
  </text>
  <text x="100" y="49" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="6" font-weight="800" fill="#9ca3af" text-anchor="middle" letter-spacing="2">
    EYES LIPS FACE
  </text>
</svg>`,

  "wet-n-wild.svg": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 60" width="200" height="60">
  <rect width="200" height="60" fill="transparent"/>
  <text x="100" y="36" font-family="'Century Gothic', sans-serif" font-size="21" font-weight="800" fill="#000000" text-anchor="middle" letter-spacing="1">
    wet <tspan font-weight="400" fill="#6b7280">n</tspan> wild
  </text>
</svg>`,

  "calvin-klein.svg": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 60" width="200" height="60">
  <rect width="200" height="60" fill="transparent"/>
  <text x="100" y="37" font-family="'Century Gothic', Futura, sans-serif" font-size="20" font-weight="800" fill="#111827" text-anchor="middle" letter-spacing="2">
    Calvin Klein
  </text>
</svg>`,

  "gillette.svg": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 60" width="200" height="60">
  <rect width="200" height="60" fill="transparent"/>
  <text x="100" y="38" font-family="Arial Black, Impact, sans-serif" font-style="italic" font-size="23" font-weight="900" fill="#002d72" text-anchor="middle" letter-spacing="1">
    Gillette
  </text>
</svg>`,

  "huggies.svg": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 60" width="200" height="60">
  <rect width="200" height="60" fill="transparent"/>
  <text x="100" y="38" font-family="Arial Rounded MT Bold, -apple-system, sans-serif" font-size="24" font-weight="900" fill="#dc2626" text-anchor="middle" letter-spacing="1">
    HUGGIES
  </text>
</svg>`,

  "farlin.svg": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 60" width="200" height="60">
  <rect width="200" height="60" fill="transparent"/>
  <text x="100" y="37" font-family="'Century Gothic', sans-serif" font-size="23" font-weight="900" fill="#0284c7" text-anchor="middle" letter-spacing="3">
    FARLIN
  </text>
</svg>`,

  "secret.svg": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 60" width="200" height="60">
  <rect width="200" height="60" fill="transparent"/>
  <text x="100" y="38" font-family="Georgia, serif" font-style="italic" font-size="24" font-weight="700" fill="#4338ca" text-anchor="middle" letter-spacing="1">
    Secret
  </text>
</svg>`,

  "skin-cafe.svg": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 60" width="200" height="60">
  <rect width="200" height="60" fill="transparent"/>
  <text x="100" y="35" font-family="'Century Gothic', sans-serif" font-size="20" font-weight="900" fill="#92400e" text-anchor="middle" letter-spacing="2">
    SKIN CAFE
  </text>
  <text x="100" y="47" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="6.5" font-weight="700" fill="#b45309" text-anchor="middle" letter-spacing="1">
    100% NATURAL &amp; PURE
  </text>
</svg>`,

  "beauty-glazed.svg": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 60" width="200" height="60">
  <rect width="200" height="60" fill="transparent"/>
  <text x="100" y="36" font-family="Arial, Helvetica, sans-serif" font-size="18" font-weight="900" fill="#db2777" text-anchor="middle" letter-spacing="2">
    BEAUTY GLAZED
  </text>
</svg>`,

  "pudaier.svg": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 60" width="200" height="60">
  <rect width="200" height="60" fill="transparent"/>
  <text x="100" y="37" font-family="'Century Gothic', sans-serif" font-size="22" font-weight="800" fill="#18181b" text-anchor="middle" letter-spacing="3">
    PUDAIER
  </text>
</svg>`
};

Object.entries(brandSvgs).forEach(([filename, svg]) => {
  const filePath = path.join(targetDir, filename);
  fs.writeFileSync(filePath, svg.trim());
  console.log("Created: " + filename);

  // Also create corresponding .png fallback as valid SVG content
  const pngName = filename.replace(/\.svg$/, ".png");
  const pngPath = path.join(targetDir, pngName);
  fs.writeFileSync(pngPath, svg.trim());
});

console.log("All brand vector SVGs successfully generated!");
