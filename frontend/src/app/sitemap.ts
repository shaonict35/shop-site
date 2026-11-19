import { MetadataRoute } from 'next';
import { API_BASE, generateSlug } from '../utils/api';

export const dynamic = "force-static";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://shop.glowgoodly.com';

  const staticPages = [
    '',
    '/shop',
    '/about',
    '/contact',
    '/faq',
    '/brands',
    '/blog',
    '/authenticity',
    '/routine',
    '/makeup-101',
    '/skin-care-101',
    '/hair-care-101',
    '/shipping-delivery',
    '/privacy-policy',
    '/terms',
    '/refund-policy',
    '/trade-license',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: (route === '' ? ('daily' as const) : ('weekly' as const)),
    priority: route === '' ? 1.0 : (route === '/shop' ? 0.9 : 0.7),
  }));

  const categoryPages = [
    'makeup',
    'skincare',
    'haircare',
    'personal-care',
    'mom-baby',
    'fragrance',
    'undergarments',
    'combo',
    'bogo',
    'clearance-sale',
    'k-beauty',
  ].map((cat) => ({
    url: `${baseUrl}/shop?category=${cat}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.85,
  }));

  let productPages: MetadataRoute.Sitemap = [];
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(`${API_BASE}/products`, { 
      next: { revalidate: 3600 },
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (res.ok) {
      const products = await res.json();
      if (Array.isArray(products)) {
        productPages = products.map((p: any) => ({
          url: `${baseUrl}/product/${p.slug || generateSlug(p.name) || p.id}`,
          lastModified: p.updatedAt ? new Date(p.updatedAt) : new Date(),
          changeFrequency: 'weekly' as const,
          priority: 0.8,
        }));
      }
    }
  } catch (e) {
    console.warn('Sitemap using static page fallback');
  }

  return [...staticPages, ...categoryPages, ...productPages];
}
