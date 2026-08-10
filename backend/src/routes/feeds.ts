import { Router, Request, Response } from "express";
import db from "../firebase";

const router = Router();

// Facebook / TikTok Product XML Feed Endpoint
router.get("/products/feed/facebook.xml", async (req: Request, res: Response) => {
  try {
    const snapshot = await db.collection("products").get();
    const products: any[] = [];
    snapshot.forEach(doc => {
      products.push({ id: doc.id, ...doc.data() });
    });

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">\n`;
    xml += `  <channel>\n`;
    xml += `    <title>GlowGoodly Cosmetics BD Catalog</title>\n`;
    xml += `    <link>https://shop.glowgoodly.com</link>\n`;
    xml += `    <description>Authentic Cosmetics & Skincare Products Bangladesh</description>\n`;

    products.forEach(p => {
      const price = p.price || p.variants?.[0]?.price || 0;
      const imageUrl = p.imageUrl || p.images?.[0]?.url || "https://shop.glowgoodly.com/cosmetics_circle_illustration.png";
      xml += `    <item>\n`;
      xml += `      <g:id>${p.id}</g:id>\n`;
      xml += `      <g:title><![CDATA[${p.name}]]></g:title>\n`;
      xml += `      <g:description><![CDATA[${p.description || "100% Authentic Cosmetics BD"}]]></g:description>\n`;
      xml += `      <g:link>https://shop.glowgoodly.com/product/${p.id}</g:link>\n`;
      xml += `      <g:image_link>${imageUrl}</g:image_link>\n`;
      xml += `      <g:brand><![CDATA[${p.brandName || "GlowGoodly"}]]></g:brand>\n`;
      xml += `      <g:condition>new</g:condition>\n`;
      xml += `      <g:availability>${(p.stock || 50) > 0 ? "in stock" : "out of stock"}</g:availability>\n`;
      xml += `      <g:price>${price} BDT</g:price>\n`;
      xml += `    </item>\n`;
    });

    xml += `  </channel>\n`;
    xml += `</rss>`;

    res.header("Content-Type", "application/xml");
    res.send(xml);
  } catch (error: any) {
    res.status(500).send(`<error>${error.message}</error>`);
  }
});

export default router;
