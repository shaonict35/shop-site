import { Router, Request, Response } from "express";
import db from "../firebase";

const router = Router();

const DEFAULT_PAGES_DATA: Record<string, { title: string; contentHtml: string }> = {
  "about": {
    title: "Our Story",
    contentHtml: `
      <h2>Welcome to GlowGoodly Bangladesh</h2>
      <p>GlowGoodly is Bangladesh's premier luxury beauty and cosmetics destination. We are committed to providing 100% authentic international skincare, hair care, personal care, and makeup products directly to your doorstep.</p>
      <h3>Our Vision</h3>
      <p>To empower every individual with genuine, cruelty-free, and clinically safe beauty solutions that suit South Asian skin tones and concerns.</p>
      <ul style="line-height: 2;">
        <li><strong>Over 400+ Exclusive Global Brands:</strong> COSRX, The Ordinary, CeraVe, Beauty of Joseon, L'Oreal, and more.</li>
        <li><strong>15,000+ Verified Authentic Products:</strong> Directly imported from brand headquarters worldwide.</li>
        <li><strong>Fast 24-48h Express Delivery:</strong> Reliable fulfillment across Dhaka and all 64 districts.</li>
      </ul>

      <div style="margin-top: 30px; background-color: #fff0f4; padding: 24px; border-radius: 12px; border-left: 5px solid #e63b7a;">
        <h3 style="color: #e63b7a; font-size: 18px; font-weight: 800; margin-top: 0; text-transform: uppercase;">
          Our Promises (আমাদের অঙ্গীকার)
        </h3>
        <ul style="line-height: 2; margin-bottom: 0; padding-left: 20px;">
          <li><strong>1. 100% Authentic & Genuine Products:</strong> We work directly with verified brands and authorized distributors.</li>
          <li><strong>2. Fast Nationwide Delivery:</strong> Inside Dhaka ৳70, Sub Area (Keraniganj, Savar, Gazipur, Narayanganj) ৳100, Outside Dhaka ৳130.</li>
          <li><strong>3. Hassle-Free 7-Day Return Policy:</strong> Easy return and instant store replacement for any defective or damaged items.</li>
          <li><strong>4. Safe & Secure Payments:</strong> bKash Direct Merchant & Bangla QR Payment (01609013011) along with Cash on Delivery.</li>
          <li><strong>5. 24/7 Dedicated Customer Support:</strong> Always here to assist you with order inquiries and personalized beauty advice.</li>
        </ul>
      </div>
    `
  },
  "authenticity": {
    title: "100% Authenticity Guarantee",
    contentHtml: `
      <h2>Zero Tolerance For Counterfeit Products</h2>
      <p>Every product sold on GlowGoodly is sourced directly from authorized brand distributors or brand headquarters worldwide. We take authenticity very seriously.</p>
      <h3>How We Verify Integrity:</h3>
      <ul style="line-height: 2;">
        <li><strong>Direct Supply Chain Partnerships:</strong> Sourced directly from manufacturers and verified distributors.</li>
        <li><strong>Original Batch Numbers & Hologram Seals:</strong> Product verification codes intact on every single item.</li>
        <li><strong>100% Money-Back Guarantee:</strong> Full cash refund if any item fails authenticity inspection.</li>
      </ul>
    `
  },
  "shipping-delivery": {
    title: "Shipping & Delivery Policy",
    contentHtml: `
      <h2>Delivery Charges & Delivery Timeframes</h2>
      <p>We deliver nationwide across Bangladesh using fast express courier services. Below are our standard delivery zones and charges:</p>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0; border: 1px solid #cbd5e1;">
        <tr style="background-color: #f1f5f9; text-align: left;">
          <th style="padding: 12px; border: 1px solid #cbd5e1; font-weight: 800;">Delivery Zone</th>
          <th style="padding: 12px; border: 1px solid #cbd5e1; font-weight: 800;">Coverage Areas</th>
          <th style="padding: 12px; border: 1px solid #cbd5e1; font-weight: 800;">Delivery Fee</th>
          <th style="padding: 12px; border: 1px solid #cbd5e1; font-weight: 800;">Estimated Time</th>
        </tr>
        <tr>
          <td style="padding: 12px; border: 1px solid #cbd5e1; font-weight: 700;">Inside Dhaka City</td>
          <td style="padding: 12px; border: 1px solid #cbd5e1;">Dhaka Metropolitan Areas</td>
          <td style="padding: 12px; border: 1px solid #cbd5e1; color: #e63b7a; font-weight: 800;">৳70</td>
          <td style="padding: 12px; border: 1px solid #cbd5e1;">24 - 48 Hours</td>
        </tr>
        <tr>
          <td style="padding: 12px; border: 1px solid #cbd5e1; font-weight: 700;">Sub Area</td>
          <td style="padding: 12px; border: 1px solid #cbd5e1; font-weight: 600; color: #0f172a;">Keraniganj, Savar, Gazipur, Narayanganj</td>
          <td style="padding: 12px; border: 1px solid #cbd5e1; color: #e63b7a; font-weight: 800;">৳100</td>
          <td style="padding: 12px; border: 1px solid #cbd5e1;">2 - 3 Business Days</td>
        </tr>
        <tr>
          <td style="padding: 12px; border: 1px solid #cbd5e1; font-weight: 700;">Outside Dhaka</td>
          <td style="padding: 12px; border: 1px solid #cbd5e1;">All Other 63 Districts</td>
          <td style="padding: 12px; border: 1px solid #cbd5e1; color: #e63b7a; font-weight: 800;">৳130</td>
          <td style="padding: 12px; border: 1px solid #cbd5e1;">2 - 4 Business Days</td>
        </tr>
      </table>
      <h3>Important Delivery Notice:</h3>
      <p style="color: #be123c; font-weight: 700; background-color: #ffe4e6; padding: 12px; borderRadius: 8px;">
        ⚠️ For orders exceeding ৳1,000 outside Dhaka City & Sub Areas (Keraniganj, Savar, Gazipur, Narayanganj), Cash on Delivery (COD) is unavailable. Please select Bangla QR during checkout to complete your purchase.
      </p>
    `
  },
  "refund-policy": {
    title: "Refund & Return Policy",
    contentHtml: `
      <h2>Hassle-Free 7-Day Return Policy</h2>
      <p>Customer satisfaction is our highest priority. If you receive a damaged, defective, or incorrect product, you can request a return or full refund within 7 days of receiving your order.</p>
      <h3>Return Guidelines & Conditions:</h3>
      <ul style="line-height: 2;">
        <li><strong>Original Packaging Intact:</strong> Product seal, box, and stickers must be unopened and undamaged.</li>
        <li><strong>Unboxing Proof:</strong> An unboxing video or photo taken at the time of delivery is required for transit damage claims.</li>
        <li><strong>Fast Refunds:</strong> Refunds are processed back to your bKash, Nagad, or Bank Account within 3 business days of return inspection.</li>
      </ul>
    `
  },
  "terms": {
    title: "Terms & Conditions",
    contentHtml: `
      <h2>GlowGoodly Terms of Service</h2>
      <p>Welcome to GlowGoodly. By browsing or placing an order on our platform, you agree to comply with our store terms and guidelines.</p>
      <h3>Pricing & Currency</h3>
      <p>All prices listed on GlowGoodly are in Bangladeshi Taka (BDT) and inclusive of applicable taxes. Prices are subject to change without prior notice during special campaigns.</p>
      <h3>Cash on Delivery (COD) Policy & ৳1,000 Threshold Condition</h3>
      <p style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 14px; borderRadius: 6px; font-weight: 700; color: #991b1b;">
        Cash on Delivery (COD) is available up to ৳1,000 for Outside Dhaka and Sub Area deliveries (Keraniganj, Savar, Gazipur, Narayanganj). Orders exceeding ৳1,000 outside Dhaka / Sub Areas require advance digital payment via Bangla QR.
      </p>
    `
  },
  "privacy-policy": {
    title: "Privacy Policy",
    contentHtml: `
      <h2>Your Data Security & Privacy Protection</h2>
      <p>GlowGoodly respects your personal data. We collect customer name, mobile number, and shipping address solely for processing your orders and fulfilling deliveries.</p>
      <h3>Data Confidentiality:</h3>
      <ul style="line-height: 2;">
        <li>We never sell or share your personal contact details with unauthorized third parties.</li>
        <li>All digital payment transactions (Bangla QR, bKash, Nagad, SSLCommerz) are processed securely through end-to-end encrypted banking gateways.</li>
        <li>You can request account or order data deletion at any time by contacting our support team.</li>
      </ul>
    `
  },
  "faq": {
    title: "Frequently Asked Questions (FAQs)",
    contentHtml: `
      <h2>Frequently Asked Questions</h2>
      <h3>1. Are all products 100% authentic?</h3>
      <p>Yes, absolutely. We source all cosmetics and skincare products directly from brand manufacturers and official regional importers.</p>
      <h3>2. What payment methods are accepted?</h3>
      <p>We accept Cash on Delivery (COD) and Bangla QR (bKash / Nagad / Rocket / Cards).</p>
      <h3>3. How do I pay using Bangla QR?</h3>
      <p>During checkout, select Bangla QR and tap Place Order. Enter your mobile wallet number (bKash / Nagad / Rocket) and complete payment using merchant number <strong>01609013011</strong> (GlowGoodly).</p>
      <h3>4. Why is Cash on Delivery disabled for my order?</h3>
      <p>For locations outside Dhaka Metropolitan area and Sub Areas (Keraniganj, Savar, Gazipur, Narayanganj), Cash on Delivery is available for order totals up to ৳1,000. Orders above ৳1,000 require advance payment via Bangla QR.</p>
    `
  },
  "points": {
    title: "GlowGoodly Beauty Points & Rewards",
    contentHtml: `
      <h2>Earn GlowPoints On Every Purchase!</h2>
      <p>Join the GlowGoodly Rewards Club! Spend BDT 100 on any beauty items and earn 5 GlowPoints automatically credited to your account profile.</p>
      <h3>Point Redemption Levels:</h3>
      <ul style="line-height: 2;">
        <li><strong>100 Points:</strong> Redeem for ৳50 Instant Shopping Voucher</li>
        <li><strong>200 Points:</strong> Redeem for ৳120 Instant Shopping Voucher</li>
        <li><strong>500 Points:</strong> Redeem for ৳350 Instant Shopping Voucher</li>
      </ul>
    `
  },
  "contact": {
    title: "Contact Us & Customer Support",
    contentHtml: `
      <h2>We Are Here To Assist You 24/7!</h2>
      <p>Have questions about your order, skin type consultation, or shipping? Reach out to our customer care team anytime.</p>
      <div style="background-color: #f8fafc; padding: 20px; border-radius: 10px; border: 1px solid #cbd5e1; margin-top: 15px; line-height: 2;">
        <p><strong>📞 Customer Support Hotline:</strong> 01609013011 (10 AM - 10 PM)</p>
        <p><strong>💬 Official Merchant Number:</strong> 01609013011 (GlowGoodly)</p>
        <p><strong>✉️ Email Address:</strong> support@glowgoodly.com</p>
        <p><strong>📍 Corporate Office:</strong> House 12, Road 5, Dhanmondi, Dhaka 1205, Bangladesh</p>
      </div>
    `
  }
};


let isPagesCleanedInDb = false;

async function ensureCleanPagesInDb() {
  if (isPagesCleanedInDb) return;
  try {
    for (const [slug, data] of Object.entries(DEFAULT_PAGES_DATA)) {
      const pageItem = { slug, title: data.title, contentHtml: data.contentHtml, updatedAt: new Date().toISOString() };
      await db.collection("cms_pages").doc(slug).set(pageItem);
    }
  } catch (e) {
    console.error("Error cleaning CMS pages in database:", e);
  } finally {
    isPagesCleanedInDb = true;
  }
}

// GET /api/pages/:slug — Public: Get CMS Page content
router.get("/pages/:slug", async (req: Request, res: Response) => {
  try {
    await ensureCleanPagesInDb();
    const { slug } = req.params;
    const cleanSlug = String(slug).toLowerCase().trim();

    const docRef = db.collection("cms_pages").doc(cleanSlug);
    const doc = await docRef.get();

    if (doc.exists) {
      return res.json(doc.data());
    }

    // Fallback to default page template data if not yet created in DB
    const defaultPage = DEFAULT_PAGES_DATA[cleanSlug];
    if (defaultPage) {
      const pagePayload = {
        slug: cleanSlug,
        title: defaultPage.title,
        contentHtml: defaultPage.contentHtml,
        updatedAt: new Date().toISOString(),
      };
      await docRef.set(pagePayload).catch(() => {});
      return res.json(pagePayload);
    }

    res.status(404).json({ error: "Page not found" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/pages — Admin: Get list of all CMS pages
router.get("/admin/pages", async (req: Request, res: Response) => {
  try {
    const snapshot = await db.collection("cms_pages").get();
    const pages: any[] = [];
    snapshot.forEach((doc: any) => {
      pages.push({ id: doc.id, ...doc.data() });
    });

    if (pages.length === 0) {
      // Seed initial default pages
      for (const [slug, data] of Object.entries(DEFAULT_PAGES_DATA)) {
        const pageItem = { slug, title: data.title, contentHtml: data.contentHtml, updatedAt: new Date().toISOString() };
        await db.collection("cms_pages").doc(slug).set(pageItem);
        pages.push(pageItem);
      }
    }

    res.json(pages);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/pages — Admin: Save/Update CMS page content
router.post("/api/admin/pages", async (req: Request, res: Response) => {
  try {
    const { slug, title, contentHtml, metaTitle, metaDescription } = req.body;
    if (!slug || !title) {
      return res.status(400).json({ error: "Page slug and title are required" });
    }

    const cleanSlug = String(slug).toLowerCase().trim();
    const docRef = db.collection("cms_pages").doc(cleanSlug);

    const pageData = {
      slug: cleanSlug,
      title,
      contentHtml: contentHtml || "",
      metaTitle: metaTitle || null,
      metaDescription: metaDescription || null,
      updatedAt: new Date().toISOString(),
    };

    await docRef.set(pageData);
    res.json({ success: true, page: pageData });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
