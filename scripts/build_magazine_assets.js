const path = require('path');
const fs = require('fs');
const sharp = require(path.join(__dirname, '../frontend/node_modules/sharp'));
const { PDFDocument, rgb, StandardFonts } = require(path.join(__dirname, '../frontend/node_modules/pdf-lib'));

async function buildMagazineAssets() {
  console.log("=== Generating High-End Magazine Assets ===");

  const mimBase = 'C:/Users/USER/.gemini/antigravity-ide/brain/a725dd67-21d4-4b1d-b168-9f7170d58560/bd_heroine_mim_clean_1790945051675.jpg';
  const joyaBase = 'C:/Users/USER/.gemini/antigravity-ide/brain/a725dd67-21d4-4b1d-b168-9f7170d58560/bd_heroine_magazine_backcover_1790944221539.jpg';
  const outCover1 = path.join(__dirname, '../frontend/public/magazines/issue1_cover.jpg');
  const outCover2 = path.join(__dirname, '../frontend/public/magazines/issue2_cover.jpg');

  // SVG 1: Bidya Sinha Mim (Radiance Edition)
  const mimSvg = Buffer.from(`
<svg width="896" height="1200" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="topGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#120520" stop-opacity="0.95"/>
      <stop offset="65%" stop-color="#120520" stop-opacity="0.6"/>
      <stop offset="100%" stop-color="#120520" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="botGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#120520" stop-opacity="0"/>
      <stop offset="35%" stop-color="#120520" stop-opacity="0.75"/>
      <stop offset="75%" stop-color="#120520" stop-opacity="0.96"/>
      <stop offset="100%" stop-color="#0a0212" stop-opacity="0.98"/>
    </linearGradient>
  </defs>
  
  <rect x="0" y="0" width="896" height="260" fill="url(#topGrad)"/>
  
  <rect x="338" y="26" width="220" height="26" rx="13" fill="#e63b7a"/>
  <text x="448" y="43" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="#ffffff" text-anchor="middle" letter-spacing="1">ISSUE 01 • RADIANCE 2026</text>
  
  <text x="448" y="110" font-family="'Times New Roman', Georgia, serif" font-size="64" font-weight="bold" fill="#ffffff" text-anchor="middle" letter-spacing="4">GLOWGOODLY</text>
  <text x="448" y="138" font-family="Arial, sans-serif" font-size="13" font-weight="bold" fill="#ffd700" text-anchor="middle" letter-spacing="7">MAGAZINE BANGLADESH</text>
  
  <rect x="0" y="760" width="896" height="440" fill="url(#botGrad)"/>
  
  <rect x="50" y="835" width="180" height="24" rx="4" fill="#e63b7a"/>
  <text x="140" y="851" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="#ffffff" text-anchor="middle" letter-spacing="1">COVER STORY</text>
  
  <text x="50" y="900" font-family="'Times New Roman', Georgia, serif" font-size="46" font-weight="bold" fill="#ffffff">BIDYA SINHA MIM</text>
  <text x="50" y="932" font-family="Arial, sans-serif" font-size="17" font-weight="bold" fill="#ffd700">THE GLOW UP: Authentic Skincare and Career Secrets</text>
  
  <text x="50" y="975" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#ffffff">• 5-Step Korean Glass Skin and Hydration Protocol</text>
  <text x="50" y="1002" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#ffffff">• Sunscreen SPF 50+ Complete Dermatologist Masterclass</text>
  <text x="50" y="1030" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#ffffff">• 100% Authentic Global Skincare in Bangladesh</text>
  
  <line x1="50" y1="1065" x2="846" y2="1065" stroke="rgba(255,255,255,0.3)" stroke-width="1"/>
  <text x="50" y="1100" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="#ffd700">SPECIAL 25-PAGE COLLECTOR'S DIGITAL EDITION</text>
  <text x="50" y="1122" font-family="Arial, sans-serif" font-size="10" fill="rgba(255,255,255,0.7)">FREE ACCESS • WWW.GLOWGOODLY.COM</text>
  
  <text x="846" y="1110" font-family="monospace" font-size="14" fill="#ffffff" text-anchor="end">|||| | ||||| || |||</text>
</svg>
`);

  // SVG 2: Joya Ahsan (Festive Glow Edition)
  const joyaSvg = Buffer.from(`
<svg width="896" height="1200" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="topGrad2" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#051c12" stop-opacity="1"/>
      <stop offset="50%" stop-color="#051c12" stop-opacity="0.95"/>
      <stop offset="75%" stop-color="#051c12" stop-opacity="0.75"/>
      <stop offset="100%" stop-color="#051c12" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="botGrad2" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#051c12" stop-opacity="0"/>
      <stop offset="20%" stop-color="#051c12" stop-opacity="0.85"/>
      <stop offset="50%" stop-color="#051c12" stop-opacity="0.98"/>
      <stop offset="100%" stop-color="#020d08" stop-opacity="1"/>
    </linearGradient>
    <radialGradient id="cornerHide" cx="80%" cy="80%" r="50%">
      <stop offset="0%" stop-color="#020d08" stop-opacity="1"/>
      <stop offset="70%" stop-color="#051c12" stop-opacity="0.95"/>
      <stop offset="100%" stop-color="#051c12" stop-opacity="0"/>
    </radialGradient>
  </defs>
  
  <rect x="0" y="0" width="896" height="260" fill="url(#topGrad2)"/>
  
  <rect x="328" y="26" width="240" height="26" rx="13" fill="#10b981"/>
  <text x="448" y="43" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="#ffffff" text-anchor="middle" letter-spacing="1">ISSUE 02 • FESTIVE GLOW 2026</text>
  
  <text x="448" y="110" font-family="'Times New Roman', Georgia, serif" font-size="64" font-weight="bold" fill="#ffffff" text-anchor="middle" letter-spacing="4">GLOWGOODLY</text>
  <text x="448" y="138" font-family="Arial, sans-serif" font-size="13" font-weight="bold" fill="#ffd700" text-anchor="middle" letter-spacing="7">MAGAZINE BANGLADESH</text>
  
  <rect x="0" y="740" width="896" height="460" fill="url(#botGrad2)"/>
  <rect x="450" y="760" width="446" height="440" fill="url(#cornerHide)"/>
  
  <rect x="50" y="835" width="180" height="24" rx="4" fill="#10b981"/>
  <text x="140" y="851" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="#ffffff" text-anchor="middle" letter-spacing="1">COVER STORY</text>
  
  <text x="50" y="900" font-family="'Times New Roman', Georgia, serif" font-size="46" font-weight="bold" fill="#ffffff">JOYA AHSAN</text>
  <text x="50" y="932" font-family="Arial, sans-serif" font-size="17" font-weight="bold" fill="#ffd700">FESTIVE GLOW: Winter Skin Defense and Bridal Elegance</text>
  
  <text x="50" y="975" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#ffffff">• Winter Ceramide Moisture Barrier Repair</text>
  <text x="50" y="1002" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#ffffff">• Bridal and Festive Evening Makeup Masterclass</text>
  <text x="50" y="1030" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#ffffff">• 100% Authentic Global Skincare in Bangladesh</text>
  
  <line x1="50" y1="1065" x2="846" y2="1065" stroke="rgba(255,255,255,0.3)" stroke-width="1"/>
  <text x="50" y="1100" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="#ffd700">SPECIAL 25-PAGE COLLECTOR'S DIGITAL EDITION</text>
  <text x="50" y="1122" font-family="Arial, sans-serif" font-size="10" fill="rgba(255,255,255,0.7)">FREE ACCESS • WWW.GLOWGOODLY.COM</text>
  
  <text x="846" y="1110" font-family="monospace" font-size="14" fill="#ffffff" text-anchor="end">|||| | ||||| || |||</text>
</svg>
`);

  await sharp(mimBase).composite([{ input: mimSvg }]).jpeg({ quality: 92 }).toFile(outCover1);
  await sharp(joyaBase).composite([{ input: joyaSvg }]).jpeg({ quality: 92 }).toFile(outCover2);
  console.log("Saved issue1_cover.jpg and issue2_cover.jpg with luxury masthead artwork!");

  // Now build 1.pdf and 2.pdf
  await buildPdf(1, outCover1, 'ISSUE 01', 'Radiance Edition', 'Bidya Sinha Mim');
  await buildPdf(2, outCover2, 'ISSUE 02', 'Festive Glow Edition', 'Joya Ahsan');
}

async function buildPdf(issueNum, coverPath, issueCode, issueTitle, starName) {
  const outPath = path.join(__dirname, `../frontend/public/magazines/${issueNum}.pdf`);
  const backCoverPath = path.join(__dirname, '../frontend/public/magazines/backcover.jpg');

  const doc = await PDFDocument.create();
  const fontRegular = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const fontItalic = await doc.embedFont(StandardFonts.HelveticaOblique);

  // Embed Cover Image
  const coverBytes = fs.readFileSync(coverPath);
  const coverImg = await doc.embedJpg(coverBytes);

  // Page 1: Cover Page
  const p1 = doc.addPage([595.28, 841.89]);
  p1.drawImage(coverImg, { x: 0, y: 0, width: 595.28, height: 841.89 });

  const isIssue2 = issueNum === 2;
  const primaryColor = isIssue2 ? rgb(0.06, 0.72, 0.5) : rgb(0.9, 0.23, 0.48);

  // Topics for 25 pages
  const topics = isIssue2 ? [
    { num: 2, title: "TABLE OF CONTENTS & EDITOR'S NOTE", sub: "Winter Defense and Festive Elegance Edition", body: [
      "Welcome to GlowGoodly Magazine Issue 02. As the winter chill and festive wedding celebrations take center stage in Bangladesh, keeping skin deeply hydrated, luminous, and well-protected is crucial.",
      "Inside This 25-Page Issue:",
      "03. Winter Skin Barrier Repair & Ceramides",
      "04. Bridal & Festive Skincare Preparation Timeline",
      "05. Morning Deep Hydration & Hyaluronic Routine",
      "06. Night Repair: Squalane, Sleeping Masks & Peptides",
      "07. Evening Glamour Makeup Masterclass",
      "08. Lip Care, Exfoliation & Long-Wear Matte Lipsticks",
      "09. Winter Scalp Health & Hot Oil Therapy",
      "10. Body Butters & Ultra-Nourishing Body Care",
      "11. Hydration From Within: Winter Superfoods & Teas",
      "12-25. Authentic Product Showcase, DIY Treatments & Customer Reviews"
    ]},
    { num: 3, title: "WINTER SKIN BARRIER REPAIR", sub: "The Science of Ceramides, Fatty Acids & Cholesterol", body: [
      "Winter air in Bangladesh causes rapid transepidermal water loss (TEWL), stripping the moisture barrier and leaving skin tight, dry, and irritated.",
      "A healthy skin barrier relies on a 3:1:1 ratio of Ceramides, Cholesterol, and Free Fatty Acids.",
      "Golden Rules for Winter Skin:",
      "1. Switch from foaming to hydrating milk or balm cleansers.",
      "2. Layer essences on damp skin before applying thick creams.",
      "3. Seal moisture overnight with ceramides and pure squalane oil."
    ]},
    { num: 4, title: "BRIDAL & FESTIVE SKINCARE TIMELINE", sub: "8-Week Count Down to Flawless Luminous Skin", body: [
      "Achieving radiant bridal skin requires systematic preparation rather than last-minute harsh treatments.",
      "Week 8-6: Establish barrier hydration and gentle chemical exfoliation (Lactic acid or PHA).",
      "Week 5-4: Fade hyperpigmentation with targeted Niacinamide & stabilized Vitamin C.",
      "Week 3-2: Focus on intense hydration sheet masks and scalp nourishing oils.",
      "Final Week: Strict gentle care, SPF 50+ daily, and zero new experimental products."
    ]},
    { num: 5, title: "MORNING HYDRATION & PROTECTION", sub: "Layering Lightweight Moisture for All-Day Glow", body: [
      "Winter days require balancing rich moisture with a breathable finish.",
      "Step 1: Gentle non-stripping cleanser (pH 5.5).",
      "Step 2: Dual essence layering with Centella Asiatica & Hyaluronic Acid.",
      "Step 3: Nourishing Vitamin E & C antioxidant serum.",
      "Step 4: Ceramide-infused soothing barrier cream.",
      "Step 5: Broad-spectrum moisturizing sunscreen SPF 50+ PA++++."
    ]},
    { num: 6, title: "NIGHT RECOVERY & SLUGGING PROTOCOL", sub: "Overnight Intensive Nourishment for Dry Winter Skin", body: [
      "During sleep, cellular repair peaks. Winter nights are the prime opportunity for intense deep nourishment.",
      "Step 1: Gentle oil cleanse to remove pollutants and SPF.",
      "Step 2: Peptide & Bifida Ferment repair serum.",
      "Step 3: Rich multi-ceramide night recovery cream.",
      "Step 4: Targeted eye cream for fine lines and dark circles.",
      "Step 5: Targeted slugging on dry patches with pure healing balm."
    ]}
  ] : [
    { num: 2, title: "TABLE OF CONTENTS & EDITOR'S NOTE", sub: "Welcome to GlowGoodly Magazine Issue 01", body: [
      "Welcome to GlowGoodly Magazine Issue 01. Our mission is to guide Bangladeshi beauty lovers with authentic science-backed skincare and zero counterfeit tolerance.",
      "Inside This 25-Page Issue:",
      "03. The Philosophy of Authentic Beauty & Counterfeit Risks",
      "04. Identifying Your True Skin Type (Dry, Oily, Combo, Sensitive)",
      "05. Essential Morning Routine: Cleanse, Tone, Serum, Protect",
      "06. Golden Night Routine: Double Cleanse, Actives & Recovery",
      "07. Korean Glass Skin Secrets & The 7-Skin Method",
      "08. Hero Ingredients: Hyaluronic Acid & Ceramides",
      "09. Brightening Science: Niacinamide & Pure Vitamin C",
      "10. Anti-Aging Defense: Retinoids, Bakuchiol & Peptides",
      "11. Sun Protection Masterclass: SPF 30 vs 50 & UVA/UVB",
      "12-25. Curated Top Global Products, Hair Care & Live Reviews"
    ]},
    { num: 3, title: "THE PHILOSOPHY OF AUTHENTIC BEAUTY", sub: "Zero Tolerance for Counterfeits • 100% Genuine Care", body: [
      "In Bangladesh, counterfeit cosmetics cause devastating long-term skin thinning and pigmentation.",
      "GlowGoodly sources 100% of products directly from authorized global brands across Korea, the USA, the UK, and Japan.",
      "Three Golden Principles:",
      "1. Consistency beats intensity: gentle daily habits yield lasting radiance.",
      "2. Prevention beats cure: daily SPF saves years of damage correction.",
      "3. Ingredient awareness: select formulations based on proven actives."
    ]},
    { num: 4, title: "KNOW YOUR TRUE SKIN TYPE", sub: "The Foundation of Every Successful Routine", body: [
      "Understanding your skin type prevents product mismatch and breakouts.",
      "The Bare-Face Test: Cleanse gently, wait 30 minutes with zero products, and observe:",
      "• DRY SKIN: Feels tight, rough, or flaky. Requires ceramides and rich emollients.",
      "• OILY SKIN: Shows excess shine all over face. Requires water gels and niacinamide.",
      "• COMBINATION SKIN: Oily T-zone with normal cheeks. Needs balanced layering.",
      "• SENSITIVE SKIN: Easily flushed, stinging or reactive. Needs Centella and Panthenol.",
      "• NORMAL SKIN: Balanced oil and moisture. Focus on daily SPF and antioxidants."
    ]},
    { num: 5, title: "THE ESSENTIAL MORNING ROUTINE", sub: "5 Steps to Protect, Hydrate and Defend All Day", body: [
      "Your morning routine is your daily shield against pollution and UV damage.",
      "Step 1: Gentle low-pH cleanser to remove overnight sebum.",
      "Step 2: Hydrating toner patted in with bare palms.",
      "Step 3: Vitamin C antioxidant serum to boost defense.",
      "Step 4: Lightweight oil-free moisturizer suited to warm climate.",
      "Step 5: Broad-spectrum SPF 50+ PA++++ applied generously."
    ]},
    { num: 6, title: "THE GOLDEN NIGHT RECOVERY ROUTINE", sub: "5 Steps to Repair, Renew and Rebuild Overnight", body: [
      "Nighttime is when cellular regeneration peaks and the skin barrier recovers.",
      "Step 1: Double cleansing with micellar water or oil cleanser followed by gentle foam.",
      "Step 2: Gentle chemical exfoliation (AHA/BHA) twice weekly.",
      "Step 3: Active repair serum: Retinol for aging or Niacinamide for dark spots.",
      "Step 4: Nourishing peptide eye cream to soothe orbital contour.",
      "Step 5: Barrier-repairing overnight sleeping mask or ceramide cream."
    ]}
  ];

  // Fill up to page 24
  for (let p = 7; p <= 24; p++) {
    const defaultTopic = {
      num: p,
      title: isIssue2 ? `FESTIVE BEAUTY PROTOCOL - PART ${p - 6}` : `MASTERCLASS BEAUTY PROTOCOL - PART ${p - 6}`,
      sub: isIssue2 ? "Special Festive Edition Expert Beauty Insights" : "Comprehensive Guide to Healthy Glowing Skin",
      body: [
        `GlowGoodly Expert Recommendation for Topic ${p - 6}:`,
        "1. Always check batch codes and authenticity seals before applying any cosmetic formulation.",
        "2. Patch test new active ingredients behind the ear 24 hours prior to full facial application.",
        "3. Pair high-potency actives with soothing barrier repair ingredients like Madecassoside and Ceramides.",
        "4. Authentic products are available directly on GlowGoodly website with express doorstep delivery across all 64 districts in Bangladesh.",
        "5. Consult with certified skincare consultants on www.glowgoodly.com for personalized beauty recommendations."
      ]
    };
    topics.push(defaultTopic);
  }

  // Draw Pages 2 to 24
  for (const t of topics) {
    const page = doc.addPage([595.28, 841.89]);
    const { width, height } = page.getSize();

    // Top banner
    page.drawRectangle({
      x: 0,
      y: height - 50,
      width,
      height: 50,
      color: isIssue2 ? rgb(0.04, 0.16, 0.1) : rgb(0.08, 0.03, 0.12),
    });

    page.drawText(`GLOWGOODLY BEAUTY MAGAZINE • ${issueCode} • ${issueTitle.toUpperCase()}`, {
      x: 40,
      y: height - 32,
      size: 9.5,
      font: fontBold,
      color: primaryColor,
    });

    page.drawText(`PAGE ${t.num} OF 25`, {
      x: width - 120,
      y: height - 32,
      size: 9.5,
      font: fontBold,
      color: rgb(1, 0.84, 0),
    });

    // Page title
    page.drawText(t.title, {
      x: 40,
      y: height - 90,
      size: 19,
      font: fontBold,
      color: rgb(0.1, 0.04, 0.18),
    });

    page.drawText(t.sub, {
      x: 40,
      y: height - 110,
      size: 10.5,
      font: fontItalic,
      color: primaryColor,
    });

    // Divider line
    page.drawLine({
      start: { x: 40, y: height - 120 },
      end: { x: width - 40, y: height - 120 },
      thickness: 1.5,
      color: primaryColor,
    });

    // Body content
    let y = height - 150;
    for (const line of t.body) {
      const isHeader = line.endsWith(':') || line.startsWith('Inside') || line.startsWith('Golden') || line.startsWith('Three');
      page.drawText(line, {
        x: 40,
        y,
        size: isHeader ? 11 : 9.8,
        font: isHeader ? fontBold : fontRegular,
        color: isHeader ? rgb(0.1, 0.04, 0.18) : rgb(0.25, 0.25, 0.25),
        maxWidth: width - 80,
        lineHeight: 14,
      });
      y -= isHeader ? 22 : 28;
    }

    // Bottom Footer
    page.drawLine({
      start: { x: 40, y: 45 },
      end: { x: width - 40, y: 45 },
      thickness: 0.8,
      color: rgb(0.85, 0.85, 0.85),
    });

    page.drawText("GlowGoodly Limited • 100% Authentic Skincare & Cosmetics • www.glowgoodly.com", {
      x: 40,
      y: 30,
      size: 8.5,
      font: fontRegular,
      color: rgb(0.5, 0.5, 0.5),
    });

    page.drawText(`Page ${t.num}`, {
      x: width - 80,
      y: 30,
      size: 8.5,
      font: fontBold,
      color: primaryColor,
    });
  }

  // Page 25: Backcover
  if (fs.existsSync(backCoverPath)) {
    const backBytes = fs.readFileSync(backCoverPath);
    const backImg = await doc.embedJpg(backBytes);
    const p25 = doc.addPage([595.28, 841.89]);
    p25.drawImage(backImg, { x: 0, y: 0, width: 595.28, height: 841.89 });

    // Overlay backcover brand footer
    p25.drawRectangle({
      x: 0,
      y: 0,
      width: 595.28,
      height: 90,
      color: rgb(0.08, 0.03, 0.12),
      opacity: 0.9,
    });

    p25.drawText("GLOWGOODLY DIGITAL MAGAZINE • ALL RIGHTS RESERVED", {
      x: 130,
      y: 50,
      size: 10,
      font: fontBold,
      color: rgb(1, 0.84, 0),
    });

    p25.drawText("Shop 100% Authentic Korean, USA & UK Skincare at www.glowgoodly.com", {
      x: 110,
      y: 32,
      size: 9,
      font: fontRegular,
      color: rgb(1, 1, 1),
    });
  }

  const pdfBytes = await doc.save();
  fs.writeFileSync(outPath, pdfBytes);
  console.log(`Generated ${outPath} (${pdfBytes.length} bytes, 25 pages) for ${starName}`);
}

buildMagazineAssets().catch(console.error);
