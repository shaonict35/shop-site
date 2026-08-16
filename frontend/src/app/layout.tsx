import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { AppProvider } from "../context/AppContext";
import TrackingScripts from "../components/TrackingScripts";
import ChatWidget from "../components/ChatWidget";
import SplashScreen from "../components/SplashScreen";

export const metadata: Metadata = {
  metadataBase: new URL("https://shop.glowgoodly.com"),
  title: "Home-Glowgoodly",
  description: "Shop 100% authentic makeup, skincare, and hair care products at GlowGoodly. Fast delivery across Bangladesh. Buy original brands like CeraVe, COSRX, and The Ordinary in BD.",
  keywords: ["cosmetics in bangladesh", "skincare bd", "authentic makeup bangladesh", "buy cosmetics online bd", "GlowGoodly", "best beauty shop dhaka", "korean skincare bd", "buy makeup online dhaka"],
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
        url: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=1200&h=630&fit=crop",
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
    images: ["https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=1200&h=630&fit=crop"],
  },
  icons: {
    icon: [
      { url: "/icon.png", type: "image/png" },
      { url: "/favicon.ico" },
    ],
    shortcut: ["/favicon.ico"],
    apple: ["/apple-icon.png"],
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
      "logo": "https://shop.glowgoodly.com/cosmetics_circle_illustration.png",
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
        {/* Favicon & Browser Tab Icons */}
        <link rel="icon" href="/icon.png" type="image/png" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-icon.png" />
        {/* Resource Preconnect & Performance Hints */}
        <link rel="preconnect" href="https://images.unsplash.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://bk.shajgoj.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://logo.clearbit.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://www.clarity.ms" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
        <link rel="dns-prefetch" href="https://bk.shajgoj.com" />
        <link rel="dns-prefetch" href="https://www.clarity.ms" />

        {/* Google Schema.org JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(storeSchemaJsonLd) }}
        />
      </head>
      <body suppressHydrationWarning>
        {/* Microsoft Clarity */}
        <Script id="clarity-script" strategy="afterInteractive">
          {`
            (function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "xymnbupcto");
          `}
        </Script>

        {/* Facebook Pixel */}
        <Script id="meta-pixel-script" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '921781274061851');
            fbq('track', 'PageView');
          `}
        </Script>

        {/* Google Tag Manager */}
        <Script id="gtm-script" strategy="afterInteractive">
          {`
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','GTM-W78SB3GC');
          `}
        </Script>

        {/* Google Analytics 4 */}
        <Script src="https://www.googletagmanager.com/gtag/js?id=G-533220314" strategy="afterInteractive" />
        <Script id="ga4-script" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-533220314');
            gtag('config', '533220314');
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
          <SplashScreen />
          <TrackingScripts />
          {children}
          <ChatWidget />
          <PromoSocketListener />
        </AppProvider>
      </body>
    </html>
  );
}
