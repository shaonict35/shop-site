import { MetadataRoute } from 'next';
import { API_BASE } from '../utils/api';

export const dynamic = "force-static";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://shop.glowgoodly.com';

  const staticPages = [
    '',
    '/shop',
    '/about',
    '/contact',
    '/faq',
    '/login',
    '/account',
    '/wishlist',
    '/checkout',
    '/privacy-policy',
    '/terms-and-conditions',
    '/refund-policy',
    '/routine',
    '/makeup-101',
    '/skin-care-101',
    '/hair-care-101',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1.0 : 0.8,
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
    'men',
  ].map((cat) => ({
    url: `${baseUrl}/shop?category=${cat}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.9,
  }));

  let productPages: MetadataRoute.Sitemap = [];
  try {
    const res = await fetch(`${API_BASE}/products`, { next: { revalidate: 3600 } });
    if (res.ok) {
      const products = await res.json();
      if (Array.isArray(products)) {
        productPages = products.map((p: any) => ({
          url: `${baseUrl}/product/${p.id}`,
          lastModified: new Date(),
          changeFrequency: 'weekly' as const,
          priority: 0.8,
        }));
      }
    }
  } catch (e) {
    console.error('Sitemap product fetch error:', e);
  }

  return [...staticPages, ...categoryPages, ...productPages];
}
