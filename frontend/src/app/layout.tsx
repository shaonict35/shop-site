import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import { AppProvider } from "../context/AppContext";
import TrackingScripts from "../components/TrackingScripts";
import ChatWidget from "../components/ChatWidget";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#e63b7a",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://shop.glowgoodly.com"),
  title: {
    default: "GlowGoodly | 100% Authentic Skincare & Premium Cosmetics Bangladesh",
    template: "%s | GlowGoodly BD"
  },
  description: "Shop 100% authentic cosmetics, Korean skincare, and hair care products at GlowGoodly. Fast cash on delivery across Bangladesh. Buy original CeraVe, COSRX, and The Ordinary in BD.",
  keywords: ["cosmetics in bangladesh", "skincare bd", "authentic makeup bangladesh", "buy cosmetics online bd", "GlowGoodly", "best beauty shop dhaka", "korean skincare bd", "buy makeup online dhaka"],
  authors: [{ name: "GlowGoodly Team", url: "https://shop.glowgoodly.com" }],
  creator: "GlowGoodly",
  publisher: "GlowGoodly",
  category: "ecommerce",
  formatDetection: {
    telephone: true,
    address: true,
    email: true,
  },
  alternates: {
    canonical: "https://shop.glowgoodly.com",
  },
  openGraph: {
    title: "GlowGoodly | Authentic Beauty & Skincare in Bangladesh",
    description: "Shop 100% authentic makeup, skincare, and hair care at GlowGoodly. Fast delivery across Bangladesh.",
    url: "https://shop.glowgoodly.com",
    siteName: "GlowGoodly",
    locale: "en_BD",
    type: "website",
    images: [
      {
        url: "/beauty_banner.png",
        width: 1200,
        height: 630,
        alt: "GlowGoodly Authentic Cosmetics Bangladesh",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "GlowGoodly | Authentic Beauty & Skincare in Bangladesh",
    description: "Shop 100% authentic makeup, skincare, and hair care at GlowGoodly.",
    images: ["/beauty_banner.png"],
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-32x32.png", type: "image/png", sizes: "32x32" },
      { url: "/icon.png", type: "image/png", sizes: "192x192" },
      { url: "/images/logo.png", type: "image/png", sizes: "512x512" },
    ],
    shortcut: "/favicon.ico",
    apple: [
      { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

const storeSchemaJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "OnlineStore",
      "@id": "https://shop.glowgoodly.com/#store",
      "name": "GlowGoodly Bangladesh",
      "url": "https://shop.glowgoodly.com",
      "logo": "https://shop.glowgoodly.com/images/logo.png",
      "description": "Premium 100% authentic cosmetics, skincare, and hair care store in Bangladesh.",
      "telephone": "+8801700000000",
      "priceRange": "BDT 150 - 15000",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "Gulshan 2",
        "addressLocality": "Dhaka",
        "postalCode": "1212",
        "addressCountry": "BD"
      },
      "sameAs": [
        "https://facebook.com/glowgoodly",
        "https://instagram.com/glowgoodly"
      ]
    },
    {
      "@type": "WebSite",
      "@id": "https://shop.glowgoodly.com/#website",
      "url": "https://shop.glowgoodly.com",
      "name": "GlowGoodly",
      "publisher": {
        "@id": "https://shop.glowgoodly.com/#store"
      },
      "potentialAction": {
        "@type": "SearchAction",
        "target": "https://shop.glowgoodly.com/shop?search={search_term_string}",
        "query-input": "required name=search_term_string"
      }
    }
  ]
};

import PromoSocketListener from "../components/PromoSocketListener";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        {/* Resource Preconnect & Performance Hints */}
        <link rel="preconnect" href="https://logo.clearbit.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://www.clarity.ms" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://www.clarity.ms" />

        {/* Favicon & Touch Icons */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icon.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-icon.png" />

        {/* Google Schema.org JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(storeSchemaJsonLd) }}
        />
      </head>
      <body suppressHydrationWarning>
        {/* Microsoft Clarity (Production Only) */}
        <Script id="clarity-script" strategy="afterInteractive">
          {`
            if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
              (function(c,l,a,r,i,t,y){
                  c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                  t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                  y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
              })(window, document, "clarity", "script", "xymnbupcto");
            }
          `}
        </Script>



        {/* Google Tag Manager & Google Analytics 4 (Production Only) */}
        <Script id="analytics-init" strategy="afterInteractive">
          {`
            if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
              // GTM
              (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','GTM-W78SB3GC');

              // GA4
              var s = document.createElement('script');
              s.async = true;
              s.src = 'https://www.googletagmanager.com/gtag/js?id=G-533220314';
              document.head.appendChild(s);
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-533220314');
            }
          `}
        </Script>

        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-W78SB3GC"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
        <AppProvider>
          <TrackingScripts />
          {children}
          <ChatWidget />
          <PromoSocketListener />
        </AppProvider>
      </body>
    </html>
  );
}
