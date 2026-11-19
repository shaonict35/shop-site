const path = require('path');
const fs = require('fs');
const { PDFDocument, rgb, StandardFonts } = require(path.join(__dirname, '../frontend/node_modules/pdf-lib'));

const PAGES_CONTENT = [
  {
    page: 1,
    isCover: true,
    title: "GLOW",
    subtitle: "BY GLOWGOODLY",
    issue: "ISSUE 01 | APRIL - MAY 2026",
    tagline: "UNVEIL YOUR NATURAL RADIANCE",
    desc: "The Ultimate 25-Page Skincare, Makeup & Authentic Beauty Guide",
    highlights: [
      "5-Step Core Skincare Routine",
      "Korean Glass Skin & Hydration Secrets",
      "Dermatologist Sunscreen & SPF Masterclass",
      "Hair Fall Solutions & Scalp Health",
      "100% Authentic Global Beauty in Bangladesh"
    ]
  },
  {
    page: 2,
    title: "TABLE OF CONTENTS & EDITOR'S NOTE",
    subtitle: "Welcome to GlowGoodly Magazine Issue 01",
    sections: [
      { num: "03", title: "The Philosophy of Authentic Beauty", desc: "Why genuine skincare transforms lives" },
      { num: "04", title: "Knowing Your True Skin Type", desc: "Normal, dry, oily, combo & sensitive" },
      { num: "05", title: "Morning Skincare Essentials", desc: "5 crucial steps to protect your skin" },
      { num: "06", title: "Night Recovery & Regeneration", desc: "Rebuilding your skin barrier while you sleep" },
      { num: "07", title: "K-Beauty Secrets & 7-Skin Method", desc: "The art of lightweight hydration layering" },
      { num: "08", title: "Hero Ingredient: Hyaluronic & Ceramides", desc: "Moisture locking & moisture barrier repair" },
      { num: "09", title: "Hero Ingredient: Niacinamide & Vitamin C", desc: "Fading dark spots and brightening tone" },
      { num: "10", title: "Anti-Aging Science: Retinol & Peptides", desc: "Collagen preservation and wrinkle defense" },
      { num: "11", title: "Sun Protection Masterclass", desc: "SPF 30 vs 50, UVA/UVB & reapplication" },
      { num: "12", title: "Acne & Blemish Clarifying Protocol", desc: "Gentle salicylic acid & Centella solutions" },
      { num: "13-25", title: "Makeup, Hair, Body, Superfoods & Reviews", desc: "Complete beauty mastery inside" }
    ],
    note: "Dear Reader, Welcome to our first digital edition. We created this comprehensive guide to give you genuine, honest and effective beauty education without confusing jargon. Glow with confidence!"
  },
  {
    page: 3,
    title: "THE PHILOSOPHY OF AUTHENTIC BEAUTY",
    subtitle: "Zero Tolerance for Counterfeits • 100% Genuine Care",
    body: [
      "In Bangladesh, the cosmetics market has unfortunately been flooded with counterfeit, expired, and unregulated steroid-laced creams. These counterfeit products cause irreversible skin thinning, severe hyperpigmentation, and long-term health hazards.",
      "GlowGoodly was founded on a simple, uncompromising promise: 100% Authentic, Direct-from-Brand Skincare and Cosmetics. Every single product in our warehouse is sourced from authorized global distributors across Korea, the USA, the UK, and Japan.",
      "True beauty is not about artificial bleaching or unrealistic overnight results. It is about nurturing healthy, glowing, and resilient skin that thrives at every age.",
      "Core Pillars of Healthy Skin:",
      "1. Consistency over intensity - regular gentle care beats harsh weekly treatments.",
      "2. Prevention over cure - daily sunscreen saves years of corrective treatments.",
      "3. Ingredient awareness - know what goes on your face and why."
    ]
  },
  {
    page: 4,
    title: "KNOW YOUR TRUE SKIN TYPE",
    subtitle: "The Foundation of Every Successful Routine",
    body: [
      "Before investing in skincare, identifying your baseline skin type is essential. Using products formulated for oily skin on dry skin can cause peeling, while rich creams on congested skin can trigger cystic breakouts.",
      "The Bare-Face Test: Wash your face with a gentle cleanser, pat dry, and wait 30 minutes without applying any toner or cream. Observe:",
      "• DRY SKIN: Feels tight, uncomfortable, flaky, or rough. Needs rich ceramides, squalane, and cream cleansers.",
      "• OILY SKIN: Shows noticeable shine and excess sebum across the forehead, nose, cheeks, and chin. Needs lightweight gel textures and niacinamide.",
      "• COMBINATION SKIN: Oily T-zone (forehead and nose) but normal or dry cheeks. Needs targeted balancing routines.",
      "• SENSITIVE SKIN: Stings, flushes red easily, or reacts to fragrance. Needs soothing Centella Asiatica, Mugwort, and Panthenol.",
      "• NORMAL SKIN: Balanced, comfortable, neither too oily nor dry. Focus on maintenance and antioxidant defense."
    ]
  },
  {
    page: 5,
    title: "THE ESSENTIAL MORNING ROUTINE",
    subtitle: "5 Steps to Protect, Hydrate and Defend All Day",
    body: [
      "Your morning routine is your shield against UV rays, urban air pollution, and moisture loss.",
      "STEP 1: GENTLE CLEANSER",
      "Rinse away overnight sebum and dead cells with a non-stripping, low-pH cleanser. Never use harsh bar soaps.",
      "STEP 2: HYDRATING TONER",
      "Pat on an alcohol-free hydrating toner to replenish moisture and prep your skin for deeper absorption.",
      "STEP 3: ANTIOXIDANT SERUM (VITAMIN C)",
      "Apply 3-4 drops of Vitamin C (L-Ascorbic Acid or derivatives) to neutralize free radicals and boost sun protection.",
      "STEP 4: LIGHTWEIGHT MOISTURIZER",
      "Lock in hydration with an oil-free water gel or soothing lotion suited to our warm Bangladesh climate.",
      "STEP 5: BROAD-SPECTRUM SUNSCREEN SPF 50+",
      "The most vital step! Apply 2 finger lengths of SPF 50+ PA++++ at least 15 minutes before stepping outdoors."
    ]
  },
  {
    page: 6,
    title: "THE GOLDEN NIGHT RECOVERY ROUTINE",
    subtitle: "5 Steps to Repair, Renew and Rebuild Overnight",
    body: [
      "While you sleep, skin blood flow increases and cellular regeneration peaks. Your nighttime routine maximizes this natural recovery window.",
      "STEP 1: DOUBLE CLEANSING",
      "Start with a cleansing oil or micellar water to dissolve stubborn waterproof sunscreen and makeup. Follow with your water-based cleanser.",
      "STEP 2: GENTLE EXFOLIATION (2X WEEKLY)",
      "Use a mild chemical exfoliant (AHA like lactic acid for dry skin; BHA like salicylic acid for oily/acne skin). Avoid abrasive physical scrubs.",
      "STEP 3: ACTIVE TREATMENT (RETINOL / NIACINAMIDE)",
      "Target signs of aging, uneven texture, or enlarged pores with science-backed actives. Start retinol 2 nights a week.",
      "STEP 4: NOURISHING EYE CREAM",
      "Tap gently around the orbital bone with your ring finger to hydrate delicate skin and prevent fine crow's feet.",
      "STEP 5: REPAIRING NIGHT CREAM OR SLEEPING MASK",
      "Seal all your hard work with a rich ceramide cream that prevents transepidermal water loss until morning."
    ]
  },
  {
    page: 7,
    title: "K-BEAUTY SECRETS & THE 7-SKIN METHOD",
    subtitle: "Unlocking Korean Glass Skin Through Hydration Layering",
    body: [
      "Korean skincare (K-Beauty) revolutionized global beauty by replacing harsh astringents with gentle, deeply hydrating fermented extracts, snail mucin, and botanical soothing agents.",
      "WHAT IS GLASS SKIN?",
      "Glass skin refers to a complexion that is so hydrated, calm, and evenly textured that it appears translucent and reflects light naturally — without heavy makeup.",
      "THE FAMOUS 7-SKIN METHOD:",
      "Instead of applying a single thick layer of heavy cream, K-Beauty dermatologists recommend applying 3 to 7 thin layers of a watery, alcohol-free hydrating toner.",
      "How to do it: Dispense a few drops of toner into your palms, press gently into your skin until absorbed, wait 30 seconds, and repeat 3 to 5 times. Your skin will instantly plump up like a hydrated sponge.",
      "Hero K-Beauty Ingredients:",
      "• Snail Secretion Filtrate: Deep cellular repair, wound healing, and elasticity boost.",
      "• Centella Asiatica (Cica): Calms redness, strengthens weak barriers, and cools irritation.",
      "• Fermented Galactomyces: Refines skin texture and enhances natural luminosity."
    ]
  },
  {
    page: 8,
    title: "DEEP HYDRATION: HYALURONIC ACID & CERAMIDES",
    subtitle: "The Dynamic Duo for Supple, Barrier-Protected Skin",
    body: [
      "Dehydrated skin is a condition, not a skin type — even the oiliest skin can be severely dehydrated, causing it to overcompensate by pumping out excess grease.",
      "HYALURONIC ACID: THE MOISTURE MAGNET",
      "Hyaluronic acid is a humectant capable of binding up to 1,000 times its weight in water. For best results, always apply hyaluronic acid onto damp skin, then seal immediately with a moisturizer to prevent moisture from evaporating into dry air.",
      "CERAMIDES: THE CELLULAR MORTAR",
      "If skin cells are bricks, ceramides are the mortar holding them together. Ceramides make up over 50% of the skin's lipid barrier. When ceramide levels drop due to weather, aging, or over-exfoliation, the barrier cracks, leading to stinging, red patches, and flaking.",
      "When to Combine Both:",
      "Pairing a multi-molecular Hyaluronic Acid serum with a 3-Ceramide moisturizing lotion creates the ultimate hydration cycle: water is pulled deep into the dermis and tightly locked beneath a resilient lipid shield."
    ]
  },
  {
    page: 9,
    title: "BRIGHTENING SCIENCE: NIACINAMIDE & VITAMIN C",
    subtitle: "Eradicate Dark Spots, Hyperpigmentation & Dullness",
    body: [
      "Sun exposure, hormonal changes, and post-acne marks often leave stubborn brown patches (melasma and PIH). Two clinically proven ingredients lead the fight for even tone:",
      "VITAMIN C (L-ASCORBIC ACID)",
      "• Mechanism: Inhibits the tyrosinase enzyme, preventing excess melanin production while stimulating fresh collagen synthesis.",
      "• Best Used: In the morning under sunscreen to double your defense against UV-induced oxidative stress.",
      "• Pro Tip: Store pure Vitamin C serums in a cool, dark place or refrigerator to prevent oxidation.",
      "NIACINAMIDE (VITAMIN B3)",
      "• Mechanism: Blocks the transfer of pigment from melanocytes to surface skin cells, reduces enlarged pores, and regulates sebum.",
      "• Ideal Concentration: 2% to 5% is clinically effective without causing redness or irritation.",
      "Can They Be Used Together?",
      "Yes! Modern dermatological consensus proves that Vitamin C and Niacinamide are safe and synergistic together, providing unmatched brightening and skin resilience."
    ]
  },
  {
    page: 10,
    title: "ANTI-AGING SCIENCE: RETINOL & PEPTIDES",
    subtitle: "Preserving Youthful Elasticity and Smoothing Fine Lines",
    body: [
      "Starting in our mid-twenties, natural collagen production drops by approximately 1% each year. Retinoids remain the gold-standard medical ingredient for reversing visible signs of aging.",
      "HOW RETINOL WORKS:",
      "Retinol (Vitamin A) penetrates deeply into the dermis to speed up cell turnover, stimulate collagen and elastin production, and clear micro-comedones before they form acne.",
      "THE 'RETINIZATION' PROTOCOL FOR BEGINNERS:",
      "• Week 1-2: Apply once every 3 nights.",
      "• Week 3-4: Apply every other night.",
      "• Week 5+: Nightly if tolerated without dryness or peeling.",
      "• The Sandwich Method: Apply a light layer of moisturizer, wait 5 minutes, apply pea-sized retinol, then top with a richer moisturizer to eliminate flaking.",
      "PEPTIDES: THE GENTLE BUILDERS",
      "Peptides are short chains of amino acids that signal skin cells to build fresh collagen. Unlike retinol, peptides cause zero irritation and can be used morning and night by all skin types, including sensitive skin."
    ]
  },
  {
    page: 11,
    title: "SUN PROTECTION MASTERCLASS",
    subtitle: "Why Sunscreen is the Non-Negotiable Core of Every Routine",
    body: [
      "Up to 80% of visible facial aging, hyperpigmentation, and loss of firmness is directly attributable to chronic ultraviolet radiation (photoaging).",
      "DECODING SUNSCREEN LABELS:",
      "• SPF (Sun Protection Factor): Measures protection against UVB rays that cause burning.",
      "  - SPF 30 blocks ~97% of UVB rays.",
      "  - SPF 50 blocks ~98% of UVB rays.",
      "• PA Rating (PA+ to PA++++): Measures protection against UVA rays that penetrate deeply, destroying collagen and causing dark spots.",
      "PHYSICAL (MINERAL) VS CHEMICAL SUNSCREENS:",
      "• Mineral (Zinc Oxide / Titanium Dioxide): Sits on top of skin, reflects rays like a shield. Ideal for sensitive, acne-prone skin and children.",
      "• Chemical: Absorbs UV rays and converts them into harmless heat. Typically lighter, zero white cast, and ideal under makeup.",
      "APPLICATION RULES:",
      "• Amount: Use 2 full finger lengths for the face and neck.",
      "• Timing: Apply 15-20 minutes before sunlight exposure.",
      "• Reapplication: Reapply every 2 to 3 hours when outdoors, sweating, or after swimming."
    ]
  },
  {
    page: 12,
    title: "ACNE & BLEMISH CLARIFYING PROTOCOL",
    subtitle: "Clear Breakouts Without Damaging Your Skin Barrier",
    body: [
      "Acne is a medical condition driven by four factors: excess sebum, dead cell accumulation, C. acnes bacteria, and localized inflammation. Aggressive scrubbing only spreads bacteria and worsens redness.",
      "THE CLARIFYING ARSENAL:",
      "1. Salicylic Acid (BHA 1-2%): Oil-soluble acid that penetrates deep into clogged pores, dissolving stubborn sebum and blackheads from within.",
      "2. Benzoyl Peroxide (2.5%): Kills acne-causing bacteria on contact without inducing bacterial resistance.",
      "3. Centella Asiatica & Tea Tree: Calms inflamed angry pimples and speeds up healing time.",
      "4. Hydrocolloid Acne Patches: Protect active pimples from dirty fingers, absorb pus overnight, and prevent picking scars.",
      "WHAT NEVER TO DO:",
      "• Never pop, squeeze, or scratch pimples with unsterilized fingernails.",
      "• Never use high-alcohol astringents or drying toothpaste on spots.",
      "• Never skip moisturizer when having breakouts — dry skin produces more oil!"
    ]
  },
  {
    page: 13,
    title: "FLAWLESS BASE MAKEUP MASTERCLASS",
    subtitle: "Primer, Shade Matching, and Seamless Blending Techniques",
    body: [
      "A radiant makeup look always begins with properly prepped skin. When your base is smooth and well-hydrated, foundation melts into the skin naturally without caking or clinging to dry patches.",
      "STEP-BY-STEP BASE PERFECTION:",
      "1. Skin Prep: Cleanse, apply lightweight moisturizer, and finish with a non-greasy sunscreen. Wait 5 full minutes before applying makeup.",
      "2. Primer: Use a gripping hydrating primer for dry skin or a pore-blurring matte primer on the T-zone for oily skin.",
      "3. Undertone Matching:",
      "   - Cool: Veins appear blue/purple; silver jewelry flatters.",
      "   - Warm: Veins appear greenish; gold jewelry flatters.",
      "   - Neutral: Mix of blue and green veins; both jewelry tones suit.",
      "4. Application Technique: Dampen your makeup sponge with setting mist. Dab — never drag — foundation across the skin from the center outward.",
      "5. Setting: Press translucent setting powder lightly into oily areas using a velour puff, then seal with a fine hydrating setting spray."
    ]
  },
  {
    page: 14,
    title: "ENCHANTING EYE MAKEUP",
    subtitle: "From Effortless Daytime Definition to Sultry Evening Drama",
    body: [
      "Eyes are the focal point of facial harmony. Mastering a few fundamental blending techniques will elevate any beauty look effortlessly.",
      "THE 5-STEP EYESHADOW ANATOMY:",
      "1. Base Primer: Neutralizes discoloration on lids and prevents shadow from creasing into folds throughout the day.",
      "2. Transition Shade: A warm matte shade 1-2 tones deeper than your skin tone swept across the crease to create dimension.",
      "3. Outer V Depth: A rich chocolate brown, plum, or charcoal pressed into the outer corner of the eye.",
      "4. Shimmer on the Lid: A champagne, rose gold, or bronze shimmer tapped onto the center of the lid using a finger.",
      "5. Inner Corner Highlight: A tiny touch of pearlescent highlighter on the inner tear duct to instantly awaken tired eyes.",
      "EYELINER & MASCARA TIPS:",
      "• Look down into a mirror when drawing your winged line for maximum symmetry.",
      "• Wiggle your mascara wand at the lash base before combing upward to build volume without clumping."
    ]
  },
  {
    page: 15,
    title: "LUSCIOUS LIP CARE & LIPSTICK MASTERY",
    subtitle: "Hydration, Precision Contouring, and All-Day Color",
    body: [
      "The skin on your lips is three times thinner than facial skin and has zero sebaceous oil glands, making it uniquely vulnerable to cracking and dehydration.",
      "THE COMPLETE LIP RITUAL:",
      "1. Gentle Exfoliation: Once a week, buff away dead skin flakes using a soft toothbrush or brown sugar and coconut oil scrub.",
      "2. Overnight Lip Mask: Apply a thick peptide or berry sleeping mask before bed to wake up to smooth, plump lips.",
      "3. Precision Lip Liner: Outline the natural lip boundary with a nude liner matching your natural lip contour. Overline only slightly at the Cupid's bow and center of the bottom lip.",
      "4. Long-Lasting Lipstick Application: Apply your favorite matte or satin liquid lipstick, blot gently with a tissue, dust a whisper of translucent powder through the tissue, and reapply a second light coat.",
      "5. Plumping Gloss Touch: Add a high-shine clear gloss exclusively to the center of your bottom lip to create the illusion of fuller, juicier lips."
    ]
  },
  {
    page: 16,
    title: "HAIR CARE SCIENCE & SCALP HEALTH",
    subtitle: "Healthy, Voluminous Hair Begins at the Scalp",
    body: [
      "Healthy hair follicles require a balanced, clean, and well-circulated scalp environment. Treating the scalp like facial skin is the newest frontier in modern hair care.",
      "SULFATE-FREE CLEANSING:",
      "Traditional harsh sulfate shampoos strip natural oils, leading to rebound oiliness and dry, brittle hair shafts. Sulfate-free formulas gently cleanse without disturbing the scalp microbiome.",
      "HOW TO WASH CORRECTLY:",
      "• Shampoo the scalp only: Gently massage your scalp with fingertips — never fingernails. The lather running down the lengths is plenty to clean the ends.",
      "• Condition the ends only: Keep conditioner at least 2 inches away from the scalp to avoid clogging hair follicles.",
      "• Water Temperature: Wash with lukewarm water and finish with a cool rinse to seal the hair cuticle and maximize shine.",
      "• Never Sleep With Wet Hair: Wet hair is in its weakest, most elastic state. Sleeping with damp hair encourages fungal growth and causes friction breakage."
    ]
  },
  {
    page: 17,
    title: "ANTI-HAIR FALL & GROWTH ESSENTIALS",
    subtitle: "Clinically Proven Remedies to Reduce Shedding and Stimulate Growth",
    body: [
      "Losing 50 to 100 strands a day is completely normal. However, sudden excessive shedding often points to telogen effluvium triggered by stress, nutritional deficits, or post-illness recovery.",
      "POWERHOUSE INGREDIENTS FOR HAIR GROWTH:",
      "• Rosemary Oil: Multiple clinical trials prove that 2% rosemary oil extract performs comparably to 2% minoxidil in promoting hair count without side effects.",
      "• Biotin & Keratin: Strengthen the protein matrix of the hair cortex, reducing mid-shaft snapping.",
      "• Scalp Massage: 4 minutes of daily scalp massage with fingertips or a silicone brush increases blood perfusion to the dermal papilla cells.",
      "NUTRITIONAL FOUNDATION:",
      "Hair is composed primarily of keratin protein. Ensure your diet includes adequate eggs, lentils, spinach, pumpkin seeds (for zinc), and salmon or chia seeds (for essential omega-3s).",
      "Friction Defense: Switch to a 100% pure silk or satin pillowcase to eliminate nighttime friction tangles and frizz."
    ]
  },
  {
    page: 18,
    title: "5 TESTED KITCHEN BEAUTY RECIPES",
    subtitle: "Safe, All-Natural Treatments from Everyday Pantry Essentials",
    body: [
      "Natural ingredients provide gentle, effective nourishing benefits when prepared freshly and used correctly.",
      "1. GLOW & CLARIFY FACE PACK:",
      "1 tbsp raw organic honey + 1/4 tsp Kasturi turmeric powder + 1 tbsp fresh curd. Leave on for 15 minutes. Turmeric fights acne while lactic acid in curd gently smooths skin.",
      "2. SOOTHING ALOE & CUCUMBER MASK:",
      "2 tbsp fresh aloe vera gel + 1 tbsp blended cucumber juice. Apply chilled for 20 minutes to soothe sunburn, inflammation, and heat redness.",
      "3. DEEP NOURISHING HAIR SMOOTHIE:",
      "1 ripe mashed banana + 1 tbsp virgin coconut oil + 1 tbsp honey. Coat hair lengths for 30 minutes before shampooing to tame wild frizz.",
      "4. EXFOLIATING CAFFEINE BODY SCRUB:",
      "2 tbsp fresh coffee grounds + 1 tbsp brown sugar + 2 tbsp sweet almond oil. Massage onto legs and arms in circular motions in the shower.",
      "5. ROSY LIP POLISH:",
      "1/2 tsp organic brown sugar + 1/2 tsp rosehip oil + 1 drop pure honey. Gently buff across lips for 60 seconds and wipe with warm water."
    ]
  },
  {
    page: 19,
    title: "LUXURY BODY CARE & GLOW RITUALS",
    subtitle: "Extend Your Skincare Standards From Neck to Toe",
    body: [
      "True self-care does not end at the jawline. The skin on your neck, décolletage, hands, and legs requires consistent hydration and sun protection.",
      "THE COMPLETE BODY PROTOCOL:",
      "1. Don't Neglect the Neck: Always extend your facial serum, moisturizer, and sunscreen down your neck and chest to prevent 'tech neck' creasing.",
      "2. The 3-Minute Rule: Apply your rich body lotion or body butter within 3 minutes of stepping out of the shower while skin is still slightly damp.",
      "3. Rough Elbows & Knees: Use a body lotion containing 10% Urea or Glycolic Acid (AHA) to effortlessly dissolve thick, darkened skin patches.",
      "4. Hand Care Defense: Keep a tube of ceramide hand cream by your bedside and next to every sink. Hands show aging faster than faces due to frequent washing.",
      "5. Sunscreen for Exposed Limbs: Driving or walking under the tropical sun without arm sunscreen causes severe uneven tanning and sun spots."
    ]
  },
  {
    page: 20,
    title: "SEASONAL BEAUTY IN BANGLADESH",
    subtitle: "Adjusting Your Regimen Across Our Distinct Climate Shifts",
    body: [
      "Our unique Bangladeshi climate requires strategic seasonal adaptation rather than a rigid, unchanging routine year-round.",
      "SUMMER & MONSOON (MARCH - OCTOBER):",
      "• Challenges: Scorching heat, extreme 90%+ humidity, fungal acne, blocked pores.",
      "• Strategy: Switch to lightweight water gels, foaming cleansers, and oil-free sunscreen. Carry facial blotting paper and use weekly clay masks.",
      "WINTER (NOVEMBER - FEBRUARY):",
      "• Challenges: Dry dusty winds, low humidity, cracked lips, dull ashen skin.",
      "• Strategy: Swap foaming washes for cream cleansers. Layer facial oils (like rosehip or squalane) over your night cream, and switch to nourishing body butters.",
      "POLLUTION DEFENSE YEAR-ROUND:",
      "Urban Dhaka air has elevated particulate matter (PM2.5). Double cleansing at night and morning antioxidant serums (Vitamin C / Ferulic acid) are essential shields."
    ]
  },
  {
    page: 21,
    title: "BEAUTY FROM WITHIN: SUPERFOODS & SLEEP",
    subtitle: "How Nutrition and Rest Directly Govern Your Skin Complexion",
    body: [
      "Topical skincare treats the outer 20% of your skin, while your internal biology governs the remaining 80%. What you eat and how deeply you sleep dictates your cellular vitality.",
      "THE BEAUTY SUPERFOOD CHECKLIST:",
      "• Fatty Fish & Flaxseeds: Rich in Omega-3 fatty acids that strengthen the intracellular lipid matrix.",
      "• Papaya & Citrus Fruits: High in Vitamin C to fuel ongoing collagen synthesis.",
      "• Spinach & Broccoli: Packed with lutein and chlorophyll to protect against environmental damage.",
      "• Green Tea: Contains EGCG catechins that calm systemic inflammation.",
      "THE BEAUTY SLEEP TRUTH:",
      "During deep sleep (non-REM stage 3), the body releases Human Growth Hormone (HGH), which repairs damaged collagen and replenishes cellular energy reserves. Chronic sleep deprivation elevates cortisol, triggering breakouts and accelerating collagen degradation."
    ]
  },
  {
    page: 22,
    title: "MEN'S GROOMING ESSENTIALS",
    subtitle: "Simple, High-Performance Skincare Tailored for Men",
    body: [
      "Male skin is biologically approximately 20% thicker than female skin, contains higher collagen density, and produces more sebum due to testosterone. Skincare is not vanity; it is basic personal hygiene and self-respect.",
      "THE STREAMLINED 3-STEP MEN'S SYSTEM:",
      "1. CLEANSE (Morning & Night):",
      "Use a revitalizing salicylic acid face wash to clear heavy grime, oil, and sweat without stripping.",
      "2. PROTECT & HYDRATE (Morning):",
      "Apply a fast-absorbing, matte-finish SPF 50 sunscreen. No shine, no white cast — just pure defense against sun spots and rough texture.",
      "3. REPAIR (Night):",
      "Apply a lightweight gel moisturizer or soothing aftershave balm to calm razor burn and prevent ingrown hairs.",
      "BEARD HEALTH TIPS:",
      "• Massage 2-3 drops of argan or jojoba beard oil into the facial skin beneath your beard to eliminate 'beardruff' and itching.",
      "• Keep beard edges cleanly trimmed and brushed with a natural boar bristle comb."
    ]
  },
  {
    page: 23,
    title: "TOP 10 DERMATOLOGIST PICKS AT GLOWGOODLY",
    subtitle: "The Most Verified, High-Efficacy Global Products in Our Store",
    body: [
      "Here are our most celebrated, 100% authentic hero products loved by thousands of happy Bangladeshi customers:",
      "1. COSRX Advanced Snail 96 Mucin Power Essence (Korea) - Ultimate repair and deep hydration.",
      "2. Beauty of Joseon Relief Sun: Rice + Probiotics SPF 50+ (Korea) - Lightweight, dewy zero-cast sunscreen.",
      "3. The Ordinary Niacinamide 10% + Zinc 1% (Canada) - Oil control, pore tightening and blemish defense.",
      "4. CeraVe Moisturizing Cream (USA) - 3 essential ceramides and hyaluronic acid for barrier restoration.",
      "5. Neutrogena Hydro Boost Water Gel (USA) - Hyaluronic-infused instant thirst quencher.",
      "6. La Roche-Posay Anthelios UVMune 400 SPF 50+ (France) - European medical-grade sun shield.",
      "7. Some By Mi AHA BHA PHA 30 Days Miracle Toner (Korea) - Gentle chemical exfoliation.",
      "8. The Ordinary Granactive Retinoid 2% Emulsion (Canada) - Non-irritating youth preservation.",
      "9. Laneige Lip Sleeping Mask Berry (Korea) - Rich antioxidant overnight lip rejuvenation.",
      "10. Moroccan Argan Hair Oil Treatment (UK) - Instant frizz smoothing and luminous shine."
    ]
  },
  {
    page: 24,
    title: "COMMUNITY VOICES & REAL TRANSFORMATIONS",
    subtitle: "Honest Feedback from Verified Bangladeshi Skincare Lovers",
    body: [
      "Here is what real customers across Dhaka, Chittagong, Sylhet, and Rajshahi have to say about their GlowGoodly experience:",
      "★★★★★ 'Before finding GlowGoodly, I wasted thousands of Taka on fake products from unverified online pages. GlowGoodly's CeraVe and COSRX completely cured my damaged barrier in 4 weeks. 100% authentic guarantee gives me absolute peace of mind!'",
      "— Farzana Hoque, Uttara, Dhaka",
      "★★★★★ 'Their delivery is unbelievably fast, and the packaging is immaculate. The Beauty of Joseon sunscreen has become my daily staple — no greasy feeling in Dhaka's heat!'",
      "— Dr. Nazmul Karim, Dhanmondi, Dhaka",
      "★★★★★ 'As someone with sensitive eczema-prone skin, finding original products was a nightmare. GlowGoodly is a blessing for skincare lovers in Bangladesh. Keep up the high standard!'",
      "— Tasneem Rahman, Nasirabad, Chittagong"
    ]
  },
  {
    page: 25,
    isBackCover: true,
    title: "GLOW",
    subtitle: "BY GLOWGOODLY",
    tagline: "Your Most Trusted Beauty Companion in Bangladesh",
    body: [
      "Thank you for reading the premiere issue of GlowGoodly Digital Magazine.",
      "Our Mission:",
      "To empower every individual with authentic global beauty products, scientific skincare knowledge, and the confidence to celebrate their unique natural beauty.",
      "• 100% Authentic Guarantee",
      "• Fast Cash on Delivery Across Bangladesh",
      "• Expert Skin Consultation & 24/7 Support",
      "Connect With Us:",
      "Website: https://shop.glowgoodly.com",
      "Facebook: facebook.com/glowgoodly",
      "Instagram: @glowgoodly",
      "Helpline: +880 1700-000000",
      "© 2026 GlowGoodly Limited. All Rights Reserved."
    ]
  }
];

function clean(str) {
  if (!str) return '';
  return String(str)
    .replace(/[★☆]/g, '*')
    .replace(/[•]/g, '-')
    .replace(/[—–]/g, '-')
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/©/g, '(c)')
    .replace(/[^\x00-\x7F]/g, ' ');
}

async function createMagazinePdf() {
  const pdfDoc = await PDFDocument.create();
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  for (let i = 0; i < PAGES_CONTENT.length; i++) {
    const data = PAGES_CONTENT[i];
    const page = pdfDoc.addPage([595.28, 841.89]); // A4 size in points
    const { width, height } = page.getSize();
    const origDrawText = page.drawText.bind(page);
    page.drawText = (text, options) => origDrawText(clean(text), options);

    if (data.isCover) {
      // Draw Cover Page
      // Background gradient-like blocks
      page.drawRectangle({
        x: 0,
        y: 0,
        width,
        height,
        color: rgb(0.1, 0.04, 0.18), // Deep luxury plum
      });

      page.drawRectangle({
        x: 20,
        y: 20,
        width: width - 40,
        height: height - 40,
        borderColor: rgb(0.9, 0.23, 0.48), // Pink border
        borderWidth: 2,
        color: rgb(0.12, 0.05, 0.22),
      });

      // Top Tag
      page.drawText(data.issue, {
        x: 50,
        y: height - 70,
        size: 11,
        font: fontBold,
        color: rgb(0.9, 0.23, 0.48),
      });

      page.drawText("SPECIAL 25-PAGE COLLECTOR'S EDITION", {
        x: width - 300,
        y: height - 70,
        size: 10,
        font: fontBold,
        color: rgb(0.79, 0.64, 0.31),
      });

      // Big Title
      page.drawText(data.title, {
        x: 50,
        y: height - 160,
        size: 84,
        font: fontBold,
        color: rgb(0.9, 0.23, 0.48),
      });

      page.drawText(data.subtitle, {
        x: 55,
        y: height - 190,
        size: 18,
        font: fontBold,
        color: rgb(0.79, 0.64, 0.31),
      });

      // Gold line
      page.drawLine({
        start: { x: 50, y: height - 210 },
        end: { x: width - 50, y: height - 210 },
        thickness: 2,
        color: rgb(0.79, 0.64, 0.31),
      });

      page.drawText(data.tagline, {
        x: 50,
        y: height - 260,
        size: 20,
        font: fontBold,
        color: rgb(1, 1, 1),
      });

      page.drawText(data.desc, {
        x: 50,
        y: height - 290,
        size: 12,
        font: fontRegular,
        color: rgb(0.9, 0.9, 0.9),
      });

      // Highlights Box
      page.drawRectangle({
        x: 50,
        y: 120,
        width: width - 100,
        height: 240,
        color: rgb(0.18, 0.08, 0.3),
        borderColor: rgb(0.9, 0.23, 0.48),
        borderWidth: 1,
      });

      page.drawText("INSIDE THIS ISSUE:", {
        x: 75,
        y: 325,
        size: 14,
        font: fontBold,
        color: rgb(0.79, 0.64, 0.31),
      });

      let yPos = 295;
      for (const h of data.highlights) {
        page.drawText(`*  ${h}`, {
          x: 75,
          y: yPos,
          size: 12,
          font: fontBold,
          color: rgb(1, 1, 1),
        });
        yPos -= 34;
      }

      // Footer brand
      page.drawText("100% AUTHENTIC COSMETICS & SKINCARE • WWW.GLOWGOODLY.COM", {
        x: 90,
        y: 45,
        size: 10,
        font: fontBold,
        color: rgb(0.79, 0.64, 0.31),
      });

    } else if (data.isBackCover) {
      // Draw Back Cover
      page.drawRectangle({
        x: 0,
        y: 0,
        width,
        height,
        color: rgb(0.1, 0.04, 0.18),
      });

      page.drawRectangle({
        x: 20,
        y: 20,
        width: width - 40,
        height: height - 40,
        borderColor: rgb(0.79, 0.64, 0.31),
        borderWidth: 2,
        color: rgb(0.12, 0.05, 0.22),
      });

      page.drawText(data.title, {
        x: 60,
        y: height - 120,
        size: 48,
        font: fontBold,
        color: rgb(0.9, 0.23, 0.48),
      });

      page.drawText(data.subtitle, {
        x: 60,
        y: height - 145,
        size: 14,
        font: fontBold,
        color: rgb(0.79, 0.64, 0.31),
      });

      page.drawText(data.tagline, {
        x: 60,
        y: height - 180,
        size: 14,
        font: fontBold,
        color: rgb(1, 1, 1),
      });

      let yPos = height - 230;
      for (const line of data.body) {
        page.drawText(line, {
          x: 60,
          y: yPos,
          size: 11,
          font: line.startsWith("•") || line.endsWith(":") ? fontBold : fontRegular,
          color: line.endsWith(":") ? rgb(0.79, 0.64, 0.31) : rgb(0.9, 0.9, 0.9),
        });
        yPos -= 24;
      }

      page.drawText("PAGE 25 OF 25", {
        x: width - 150,
        y: 45,
        size: 10,
        font: fontBold,
        color: rgb(0.79, 0.64, 0.31),
      });

    } else {
      // Standard Editorial Page (2 to 24)
      // Top header banner
      page.drawRectangle({
        x: 0,
        y: height - 45,
        width,
        height: 45,
        color: rgb(0.1, 0.04, 0.18),
      });

      page.drawText("GLOWGOODLY BEAUTY MAGAZINE", {
        x: 40,
        y: height - 28,
        size: 10,
        font: fontBold,
        color: rgb(0.9, 0.23, 0.48),
      });

      page.drawText(`PAGE ${data.page} OF 25`, {
        x: width - 130,
        y: height - 28,
        size: 10,
        font: fontBold,
        color: rgb(0.79, 0.64, 0.31),
      });

      // Page Title
      page.drawText(data.title, {
        x: 40,
        y: height - 90,
        size: 20,
        font: fontBold,
        color: rgb(0.1, 0.04, 0.18),
      });

      page.drawText(data.subtitle, {
        x: 40,
        y: height - 110,
        size: 11,
        font: fontOblique,
        color: rgb(0.9, 0.23, 0.48),
      });

      // Pink accent divider
      page.drawLine({
        start: { x: 40, y: height - 120 },
        end: { x: width - 40, y: height - 120 },
        thickness: 1.5,
        color: rgb(0.9, 0.23, 0.48),
      });

      let y = height - 150;

      if (data.sections) {
        // Table of contents
        for (const s of data.sections) {
          page.drawText(`${s.num}. ${s.title}`, {
            x: 40,
            y,
            size: 11,
            font: fontBold,
            color: rgb(0.1, 0.04, 0.18),
          });
          page.drawText(`   ${s.desc}`, {
            x: 40,
            y: y - 14,
            size: 9.5,
            font: fontRegular,
            color: rgb(0.4, 0.4, 0.4),
          });
          y -= 38;
        }

        if (data.note) {
          page.drawRectangle({
            x: 40,
            y: 80,
            width: width - 80,
            height: 90,
            color: rgb(0.98, 0.94, 0.96),
            borderColor: rgb(0.9, 0.23, 0.48),
            borderWidth: 1,
          });
          page.drawText("EDITOR'S NOTE", {
            x: 55,
            y: 150,
            size: 10,
            font: fontBold,
            color: rgb(0.9, 0.23, 0.48),
          });
          page.drawText(data.note, {
            x: 55,
            y: 130,
            size: 9.5,
            font: fontOblique,
            color: rgb(0.2, 0.2, 0.2),
            maxWidth: width - 110,
            lineHeight: 14,
          });
        }
      } else if (data.body) {
        // Content blocks
        for (const para of data.body) {
          const isHeading = para.startsWith("•") || para.startsWith("STEP") || para.endsWith(":") || para.startsWith("1.") || para.startsWith("2.") || para.startsWith("3.") || para.startsWith("4.") || para.startsWith("5.") || para.startsWith("★");
          page.drawText(para, {
            x: 40,
            y,
            size: isHeading ? 10.5 : 9.5,
            font: isHeading ? fontBold : fontRegular,
            color: isHeading ? rgb(0.1, 0.04, 0.18) : rgb(0.25, 0.25, 0.25),
            maxWidth: width - 80,
            lineHeight: 14,
          });
          y -= isHeading ? 22 : 36;
        }
      }

      // Bottom footer rule
      page.drawLine({
        start: { x: 40, y: 40 },
        end: { x: width - 40, y: 40 },
        thickness: 0.8,
        color: rgb(0.85, 0.85, 0.85),
      });

      page.drawText("GlowGoodly Limited • 100% Authentic Skincare & Cosmetics • www.glowgoodly.com", {
        x: 40,
        y: 25,
        size: 8.5,
        font: fontRegular,
        color: rgb(0.5, 0.5, 0.5),
      });
      page.drawText(`Page ${data.page}`, {
        x: width - 80,
        y: 25,
        size: 8.5,
        font: fontBold,
        color: rgb(0.9, 0.23, 0.48),
      });
    }
  }

  const pdfBytes = await pdfDoc.save();
  const outPath1 = path.join(__dirname, '../frontend/public/magazines/1.pdf');
  const outPath2 = path.join(__dirname, '../frontend/public/magazines/2.pdf');
  fs.writeFileSync(outPath1, pdfBytes);
  fs.writeFileSync(outPath2, pdfBytes);
  console.log(`Successfully generated 25-page PDF files at ${outPath1} (${pdfBytes.length} bytes) and ${outPath2}`);
}

createMagazinePdf().catch(console.error);
