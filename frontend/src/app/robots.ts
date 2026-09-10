import { MetadataRoute } from 'next';

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://shop.glowgoodly.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/valobasa/',
          '/api/',
          '/account/',
          '/checkout/',
          '/cart/',
          '/thank-you/',
          '/bkash-portal/',
          '/*?*search=',
          '/*?*sort='
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: [
          '/admin/',
          '/valobasa/',
          '/api/',
          '/account/',
          '/checkout/',
          '/cart/',
          '/thank-you/',
          '/bkash-portal/'
        ],
      },
      {
        userAgent: 'Bingbot',
        allow: '/',
        disallow: [
          '/admin/',
          '/valobasa/',
          '/api/',
          '/account/',
          '/checkout/',
          '/cart/',
          '/thank-you/',
          '/bkash-portal/'
        ],
      }
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
