"use client";

import React, { useState, useEffect, useMemo } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import MobileNavbar from "../../components/MobileNavbar";
import Link from "next/link";
import { API_BASE, getProductUrl } from "../../utils/api";

interface ProductItem {
  id: string;
  name: string;
  brand: string;
  price: string;
  originalPrice?: string;
  img: string;
  tag: string;
  link: string;
}

interface PageContent {
  num: number;
  type: "cover" | "toc" | "editorial" | "feature" | "spotlight" | "tips" | "products" | "reviews" | "backcover";
  title: string;
  subtitle: string;
  category?: string;
  accent: string;
  bg: string;
  img?: string;
  body?: string[];
  steps?: { n: string; t: string; d: string }[];
  tips?: string[];
  sections?: { num: string; title: string; desc: string }[];
  products?: ProductItem[];
  reviews?: { name: string; loc: string; product: string; text: string }[];
  headline?: string;
  tagline?: string;
}

function getMagazinePages(dynamicProducts: ProductItem[], issueNumber: number = 1): PageContent[] {
  const isIssue2 = issueNumber === 2;

  return [
    // Page 1: Cover (Distinct for each issue)
    {
      num: 1,
      type: "cover",
      title: "GLOWGOODLY",
      subtitle: isIssue2 ? "২য় সংখ্যা • FESTIVE GLOW EDITION • ২০২৬" : "১ম সংখ্যা • RADIANCE EDITION • ২০২৬",
      headline: isIssue2 ? "জয়া আহসান" : "বিদ্যা সিনহা মিম",
      tagline: isIssue2 
        ? "এলিগ্যান্স অ্যান্ড গ্লো: উইন্টার নারিশমেন্ট, উৎসবের সাজ ও রূপচর্চার বিজ্ঞান • ২৫ পাতার সম্পূর্ণ গাইড" 
        : "দ্য গ্লো আপ: অভিনয়, ক্যারিয়ার ও নিখুঁত রূপচর্চার গোপন বিজ্ঞান • ২৫ পাতার সম্পূর্ণ গাইড",
      accent: isIssue2 ? "#10b981" : "#e63b7a",
      bg: isIssue2 
        ? "linear-gradient(135deg, #092015 0%, #133928 50%, #051a10 100%)" 
        : "linear-gradient(135deg, #1a0a2e 0%, #2d1345 50%, #4a154b 100%)",
      img: isIssue2 ? "/magazines/issue2_cover.jpg" : "/magazines/issue1_cover.jpg",
      tips: isIssue2 ? [
        "উইন্টার ডিপ হাইড্রেশন ও সেরামাইড রিপেয়ার",
        "ব্রাইডাল ও উৎসবের গ্ল্যামার মেকআপ গাইড",
        "লিপস্টিক পারফেকশন ও ঠোঁটের এক্সফোলিয়েশন",
        "ঠান্ডা আবহাওয়ায় চুল ও স্ক্যাল্প প্রটেকশন",
        "১০০% অথেনটিক গ্লোবাল বিউটি কালেকশন"
      ] : [
        "৫-স্টেপ কোর স্কিনকেয়ার রুটিন",
        "K-Beauty গ্লাস স্কিন ও হাইড্রেশন সিক্রেটস",
        "সানস্ক্রিন কমপ্লিট ডার্মাটোলজি গাইড",
        "চুল পড়া বন্ধ ও স্ক্যাল্প হেলথ সলিউশন",
        "১০০% অথেনটিক গ্লোবাল বিউটি কালেকশন"
      ]
    },
    // Page 2: Table of Contents & Welcome
    {
      num: 2,
      type: "toc",
      title: isIssue2 ? "সূচিপত্র ও সম্পাদকীয় (২য় সংখ্যা)" : "সূচিপত্র ও সম্পাদকীয় (১ম সংখ্যা)",
      subtitle: isIssue2 ? "Festive Glow & Winter Defense Table of Contents" : "Table of Contents & Editor's Note",
      accent: isIssue2 ? "#10b981" : "#e63b7a",
      bg: "linear-gradient(160deg, #fff8fc, #fde8f3)",
      sections: isIssue2 ? [
        { num: "০৩", title: "উইন্টার স্কিন রিপেয়ার ও সেরামাইড", desc: "শীতের শুষ্কতা ও টানটান ভাব দূর করার উপায়" },
        { num: "০৪", title: "ব্রাইডাল ও ফেস্টিভ স্কিনকেয়ার টাইমলাইন", desc: "বিয়ে বা উৎসবের ২ মাস আগের রূপচর্চা প্ল্যান" },
        { num: "০৫", title: "সকালের হাইড্রেশন ও ডিফেন্স রুটিন", desc: "হাইড্রেটিং টোনার ও সানস্ক্রিনের কার্যকারিতা" },
        { num: "০৬", title: "রাতের নারিশিং স্লিপিং মাস্ক", desc: "ঘুমের মধ্যে আর্দ্রতা ধরে রেখে প্লাম্প স্কিন" },
        { num: "০৭", title: "উৎসবের সান্ধ্য মেকআপ মাস্টারক্লাস", desc: "স্মোকি আই, উইং লাইনার ও পারফেক্ট ব্লাশ" },
        { num: "০৮", title: "ঠোঁটের যত্ন ও লং-ওয়্যার লিপস্টিক", desc: "ফাটা ঠোঁট সারিয়ে নিখুঁত ম্যাট ফিনিশ" },
        { num: "০৯", title: "হট অয়েল থেরাপি ও খুশকি প্রতিরোধ", desc: "শীতকালে স্ক্যাল্পের স্বাস্থ্য ও চুল পড়া রোধ" },
        { num: "১০", title: "বডি বাটার ও হাত-পায়ের কেয়ার", desc: "কনুই ও গোড়ালি ফাটা রোধের সহজ সমাধান" },
        { num: "১১", title: "শীতের ডায়েট ও গ্লোয়িং হারবাল টি", desc: "অ্যান্টিঅক্সিডেন্ট ও ভেতর থেকে আর্দ্রতা বজায় রাখা" },
        { num: "১২-২৫", title: "শীর্ষ পণ্য, ঘরোয়া রেসিপি ও লাইভ শপ", desc: "সম্পূর্ণ ২৫ পাতার বিস্তারিত বিউটি গাইড" }
      ] : [
        { num: "০৩", title: "অথেনটিক রূপচর্চার মূল দর্শন", desc: "ভেজালমুক্ত ১০০% অরিজিনাল স্কিনকেয়ারের গুরুত্ব" },
        { num: "০৪", title: "আপনার ত্বকের ধরন শনাক্ত করুন", desc: "ড্রাই, অয়েলি, কম্বিনেশন ও সেনসিটিভ স্কিন টেস্ট" },
        { num: "০৫", title: "সকালের স্কিনকেয়ার রুটিন", desc: "ত্বক সুরক্ষিত ও ফ্রেশ রাখার ৫টি সহজ ধাপ" },
        { num: "০৬", title: "রাতের গোল্ডেন রিপেয়ার রুটিন", desc: "ঘুমের মধ্যে স্কিন ব্যারিয়ার পুনর্গঠন" },
        { num: "০৭", title: "K-Beauty রহস্য ও ৭-স্কিন মেথড", desc: "কোরিয়ান গ্লাস স্কিন পাওয়ার গোপন বিজ্ঞান" },
        { num: "০৮", title: "হায়ালুরোনিক অ্যাসিড ও সেরামাইড", desc: "ডিপ হাইড্রেশন ও ব্যারিয়ার প্রোটেকশন" },
        { num: "০৯", title: "নিয়াসিনামাইড ও ভিটামিন সি", desc: "দাগহীন উজ্জ্বল ও মসৃণ ত্বকের ফর্মুলা" },
        { num: "১০", title: "রেটিনল ও অ্যান্টি-এজিং সায়েন্স", desc: "বলিরেখা দূর করে তারুণ্য ধরে রাখার উপায়" },
        { num: "১১", title: "সানস্ক্রিন কমপ্লিট মাস্টারক্লাস", desc: "SPF 30 vs SPF 50 এবং সঠিক ব্যবহারের নিয়ম" },
        { num: "১২-২৫", title: "মেকআপ, হেয়ারকেয়ার, ঘরোয়া রেসিপি ও লাইভ শপ", desc: "সম্পূর্ণ ২৫ পাতার বিস্তারিত বিউটি গাইড" }
      ],
      body: [
        "প্রিয় পাঠক,",
        isIssue2 
          ? "GlowGoodly ডিজিটাল ম্যাগাজিনের ২য় সংখ্যা (Festive Glow Edition)-এ আপনাকে স্বাগতম। শীতের শুষ্ক আবহাওয়া এবং উৎসবের মৌসুমে আপনার ত্বকের সর্বোচ্চ যত্ন নিশ্চিত করতেই আমাদের এই বিশেষ সংখ্যা।"
          : "GlowGoodly ডিজিটাল ম্যাগাজিনের ১ম সংখ্যায় আপনাকে আন্তরিক স্বাগতম। আমাদের লক্ষ্য কেবল পণ্য বিক্রি নয়, বরং আপনাকে ত্বকের সঠিক বিজ্ঞান ও নির্ভরযোগ্য পরিচর্যার দিশা দেওয়া।",
        "ভেজাল ক্রিম ও বিভ্রান্তিকর বিজ্ঞাপনের ভিড়ে আপনার ত্বককে সুরক্ষিত রেখে সুস্থ সুন্দর করে তোলাই আমাদের মূল অঙ্গীকার।"
      ]
    },
    // Page 3: The Philosophy of Authentic Beauty
    {
      num: 3,
      type: "editorial",
      title: "অথেনটিক রূপচর্চার মূল দর্শন",
      subtitle: "Zero Tolerance for Counterfeits • 100% Genuine Care",
      accent: "#e63b7a",
      bg: "linear-gradient(160deg, #fff8fc, #fff0f5)",
      img: "https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=600&auto=format&fit=crop&q=80",
      body: [
        "বাংলাদেশে বর্তমানে রূপচর্চার বাজারে সবচেয়ে বড় হুমকি হলো ভেজাল, নকল ও নিষিদ্ধ স্টেরয়েড মিশ্রিত নাইট ক্রিম। এসব ক্রিম সাময়িকভাবে ত্বক ফর্সা করলেও পরবর্তীতে স্থায়ী পিগমেন্টেশন, মেছতা এবং ত্বকের চামড়া পাতলা করে অপূরণীয় ক্ষতি ডেকে আনে।",
        "GlowGoodly শুরু থেকেই 'জিরো টলারেন্স ফর কাউন্টারফিটস' নীতি মেনে চলে। আমাদের প্রতিটি পণ্য কোরিয়া, আমেরিকা, যুক্তরাজ্য ও ফ্রান্সের অনুমোদিত ডিস্ট্রিবিউটরদের থেকে সরাসরি সংগৃহীত।",
        "আসল রূপচর্চার ৩টি গোল্ডেন রুল:",
        "১. ধারাবাহিকতা: রাতারাতি ফলের পেছনে না ছুটে প্রতিদিনের জেন্টল কেয়ার বজায় রাখুন।",
        "২. প্রিভেনশন: সূর্যের ক্ষতিকর রশ্মি থেকে ত্বককে প্রতিদিন বাঁচিয়ে রাখলে বয়সের ছাপ দেরিতে আসবে।",
        "৩. সচেতন উপাদান: বোতলের লেবেল পড়ে নিজের ত্বকের প্রয়োজনে সঠিক উপাদানটি বেছে নিন।"
      ]
    },
    // Page 4: Skin Types
    {
      num: 4,
      type: "feature",
      title: "আপনার ত্বকের ধরন শনাক্ত করুন",
      subtitle: "The Foundation of Every Successful Routine",
      accent: "#bf360c",
      bg: "linear-gradient(135deg, #fff3e0, #ffe0b2)",
      img: "https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?w=600&auto=format&fit=crop&q=80",
      steps: [
        { n: "০১", t: "ড্রাই স্কিন (Dry Skin)", d: "ত্বকে টানটান ভাব, খসখসে অনুভূতি বা মরা চামড়া ওঠে। প্রয়োজন সেরামাইড যুক্ত মিল্ক ক্লেনজার ও ভারী ময়েশ্চারাইজার।" },
        { n: "০২", t: "অয়েলি স্কিন (Oily Skin)", d: "পুরো মুখে অতিরিক্ত তেল, চকচকে ভাব ও বড় রোমকূপ। প্রয়োজন জেল-বেসড ক্লেনজার ও স্যালিসিলিক এসিড।" },
        { n: "০৩", t: "কম্বিনেশন স্কিন (Combination Skin)", d: "টি-জোন (কপাল ও নাক) তেলতেলে কিন্তু গাল স্বাভাবিক বা শুষ্ক। প্রয়োজন হালকা ব্যালেন্সিং হাইড্রেশন।" },
        { n: "০৪", t: "সেনসিটিভ স্কিন (Sensitive Skin)", d: "খুব সহজেই লালচে ভাব, চুলকানি বা জ্বালাপোড়া করে। প্রয়োজন সেন্টেলা (Cica) ও সুদিং প্যান্থেনল।" },
        { n: "০৫", t: "নরমাল স্কিন (Normal Skin)", d: "তেল ও শুষ্কতার সঠিক ভারসাম্য। নিয়মিত পরিষ্কার ও সানস্ক্রিন দিয়েই ত্বক সুন্দর রাখা সম্ভব।" }
      ]
    },
    // Page 5: Morning Skincare
    {
      num: 5,
      type: "feature",
      title: "সকালের স্কিনকেয়ার রুটিন",
      subtitle: "5 Steps to Protect, Hydrate and Defend All Day",
      accent: "#e63b7a",
      bg: "linear-gradient(135deg, #fce4ec, #f8bbd0)",
      img: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&auto=format&fit=crop&q=80",
      steps: [
        { n: "ধাপ ১", t: "জেন্টল ক্লেনজার (Gentle Cleanser)", d: "রাতের ঘাম ও তেল ধুতে মাইল্ড লো-পিএইচ ফেসওয়াশ ব্যবহার করুন। সাবান জাতীয় ক্ষারযুক্ত পণ্য এড়িয়ে চলুন।" },
        { n: "ধাপ ২", t: "হাইড্রেটিং টোনার (Hydrating Toner)", d: "অ্যালকোহলমুক্ত টোনার হাত দিয়ে আলতোভাবে মুখে চেপে চেপে বসিয়ে ত্বকের আর্দ্রতা ফিরিয়ে আনুন।" },
        { n: "ধাপ ৩", t: "ভিটামিন সি সিরাম (Vitamin C Serum)", d: "সকালে ৩-৪ ফোঁটা ভিটামিন সি অ্যান্টিঅক্সিডেন্ট সানস্ক্রিনের কার্যক্ষমতা দ্বিগুণ বাড়িয়ে দেয়।" },
        { n: "ধাপ ৪", t: "লাইটওয়েট ময়েশ্চারাইজার (Moisturizer)", d: "আমাদের আবহাওয়ায় ওয়াটার জেল বা হালকা লোশন দিয়ে ত্বকের পানির স্তর লক করুন।" },
        { n: "ধাপ ৫", t: "সানস্ক্রিন SPF 50+ (Sunscreen)", d: "সবচেয়ে গুরুত্বপূর্ণ ধাপ! বাইরে বের হওয়ার ১৫ মিনিট আগে দুই আঙুল পরিমাণ সানস্ক্রিন লাগান।" }
      ]
    },
    // Page 6: Night Skincare
    {
      num: 6,
      type: "feature",
      title: "রাতের গোল্ডেন রিপেয়ার রুটিন",
      subtitle: "5 Steps to Repair, Renew and Rebuild Overnight",
      accent: "#2e7d32",
      bg: "linear-gradient(135deg, #e8f5e9, #c8e6c9)",
      img: "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=600&auto=format&fit=crop&q=80",
      steps: [
        { n: "ধাপ ১", t: "ডাবল ক্লিনজিং (Double Cleanse)", d: "মাইসেলার ওয়াটার বা ক্লিনজিং অয়েল দিয়ে সানস্ক্রিন ও ধুলোবালি গলিয়ে তারপর সাধারণ ফেসওয়াশ দিয়ে ধুন।" },
        { n: "ধাপ ২", t: "এক্সফোলিয়েশন (AHA / BHA)", d: "সপ্তাহে ১-২ বার মৃত কোষ পরিষ্কার করতে মৃদু কেমিক্যাল এক্সফোলিয়েটর ব্যবহার করুন।" },
        { n: "ধাপ ৩", t: "অ্যাক্টিভ সিরাম (Retinol / Niacinamide)", d: "রাতে ত্বকের সেল টার্নওভার তুঙ্গে থাকে। রেটিনল বা নিয়াসিনামাইড দাগ ও বলিরেখা দূর করে।" },
        { n: "ধাপ ৪", t: "আই ক্রিম (Eye Cream)", d: "চোখের চারপাশের পাতলা চামড়ায় হালকা ড্যাব করে আই ক্রিম লাগান ডার্ক সার্কেল ও ফোলা ভাব কমাতে।" },
        { n: "ধাপ ৫", t: "রিপেয়ারিং নাইট ক্রিম (Night Mask)", d: "সেরামাইড ও পেপটাইড যুক্ত ঘন ক্রিম বা স্লিপিং মাস্ক দিয়ে আর্দ্রতা সারা রাত আটকে রাখুন।" }
      ]
    },
    // Page 7: K-Beauty Secrets
    {
      num: 7,
      type: "spotlight",
      title: "K-Beauty রহস্য ও ৭-স্কিন মেথড",
      subtitle: "The Science of Layered Hydration for Glass Skin",
      accent: "#e67e22",
      bg: "linear-gradient(135deg, #fdf4e3, #fce8c8)",
      img: "https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=600&auto=format&fit=crop&q=80",
      body: [
        "কোরিয়ান স্কিনকেয়ার বা K-Beauty বিশ্বজুড়ে তুমুল জনপ্রিয় হওয়ার কারণ হলো এটি ত্বককে আক্রমণ না করে পরম যত্নে সারিয়ে তোলে।",
        "বিখ্যাত ৭-স্কিন মেথড কী?",
        "একবারে ভারী ক্রিমের বদলে পাতলা ও হাইড্রেটিং টোনার অল্প অল্প করে ৩ থেকে ৭ বার ত্বকে চেপে চেপে শুষে নিতে দেওয়া হয়। এতে ত্বকের ভেতরের প্রতিটি স্তরে পানির অভাব পূরণ হয়ে কাঁচের মতো আলো প্রতিফলিত করে।"
      ],
      tips: [
        "হাইড্রেটিং শিট মাস্ক সপ্তাহে ২ বার ফ্রিজে রেখে ঠান্ডা ব্যবহার করুন",
        "স্নেইল মিউসিন (শামুকের নির্যাস) ক্ষত সারায় ও গভীর আর্দ্রতা যোগায়",
        "সেন্টেলা এশিয়াটিকা (Cica) রোদে পোড়া ও ব্রণের লালচে ভাব দ্রুত কমায়",
        "মুখ ধোয়ার পর তোয়ালে দিয়ে ঘষবেন না, হাত দিয়ে পানি শুকিয়ে নিন",
        "দিনে বাইরে থাকলে ৩ ঘণ্টা পরপর সানস্ক্রিন স্টিক বা স্প্রে ব্যবহার করুন"
      ]
    },
    // Page 8: Hyaluronic Acid & Ceramides
    {
      num: 8,
      type: "feature",
      title: "হায়ালুরোনিক অ্যাসিড ও সেরামাইড",
      subtitle: "The Dynamic Duo for Supple, Barrier-Protected Skin",
      accent: "#0277bd",
      bg: "linear-gradient(135deg, #e8f4f8, #b3d9e8)",
      img: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&auto=format&fit=crop&q=80",
      steps: [
        { n: "💧", t: "হায়ালুরোনিক অ্যাসিড (HA)", d: "নিজের ওজনের ১,০০০ গুণ পানি ধরে রাখতে পারে। সবসময় হালকা ভেজা ত্বকে লাগিয়ে সাথে সাথে ক্রিম দিয়ে লক করতে হয়।" },
        { n: "🛡️", t: "সেরামাইড (Ceramides)", d: "ত্বকের কোষের মাঝের আঠা হিসেবে কাজ করে। সেরামাইড কমে গেলে ত্বক জ্বলে, খসখসে হয় এবং সহজে জীবাণু ঢোকে।" },
        { n: "⚡", t: "একত্রে ব্যবহারের ফলাফল", d: "HA ভেতর থেকে পানি টানে আর সেরামাইড সেই পানিকে বাষ্প হয়ে উড়ে যেতে দেয় না — ত্বক হয় নিখুঁত প্লাম্প।" }
      ]
    },
    // Page 9: Niacinamide & Vitamin C
    {
      num: 9,
      type: "feature",
      title: "নিয়াসিনামাইড ও ভিটামিন সি",
      subtitle: "Eradicate Dark Spots, Hyperpigmentation & Dullness",
      accent: "#f57f17",
      bg: "linear-gradient(160deg, #fff8e1, #ffecb3)",
      img: "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=600&auto=format&fit=crop&q=80",
      steps: [
        { n: "🍊", t: "ভিটামিন সি (L-Ascorbic Acid)", d: "অতিরিক্ত মেলানিন তৈরি বন্ধ করে, মেছতা ও ব্রণের কালো দাগ হালকা করে এবং প্রাকৃতিক কোলাজেন বাড়ায়।" },
        { n: "✨", t: "নিয়াসিনামাইড (Vitamin B3)", d: "অতিরিক্ত তেল বা সিবাম নিয়ন্ত্রণ করে, রোমকূপের মুখ ছোট করে এবং ত্বকের অসম রঙ দূর করে।" },
        { n: "💡", t: "ব্যবহারের সঠিক নিয়ম", d: "সকালে ভিটামিন সি + সানস্ক্রিন এবং রাতে নিয়াসিনামাইড সিরাম সবচেয়ে কার্যকর ও নিরাপদ সমন্বয়।" }
      ]
    },
    // Page 10: Retinol & Anti-Aging
    {
      num: 10,
      type: "editorial",
      title: "রেটিনল ও অ্যান্টি-এজিং সায়েন্স",
      subtitle: "Preserving Youthful Elasticity and Smoothing Fine Lines",
      accent: "#4a148c",
      bg: "linear-gradient(135deg, #f3e5f5, #e1bee7)",
      img: "https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?w=600&auto=format&fit=crop&q=80",
      body: [
        "২৫ বছর বয়সের পর থেকে প্রতি বছর প্রাকৃতিকভাবে আমাদের শরীরের কোলাজেন উৎপাদন প্রায় ১% হারে কমতে থাকে। বিজ্ঞানে রেটিনয়েডই একমাত্র উপাদান যা নতুন কোলাজেন তৈরি করতে শতভাগ প্রমাণিত।",
        "নতুনদের জন্য রেটিনল ব্যবহারের নিয়ম:",
        "• প্রথম ২ সপ্তাহ: প্রতি ৩ রাতে মাত্র একবার মটর দানার সমপরিমাণ লাগান।",
        "• পরের ২ সপ্তাহ: প্রতি ২ রাতে একবার।",
        "• স্যান্ডউইচ মেথড: প্রথমে হালকা ময়েশ্চারাইজার, তারপর রেটিনল, তার ওপর আবার থিক ক্রিম — এতে ত্বকে কোনো জ্বালাপোড়া বা খোসা ওঠার ভয় থাকে না।"
      ]
    },
    // Page 11: Sunscreen Complete Guide
    {
      num: 11,
      type: "feature",
      title: "সানস্ক্রিন কমপ্লিট মাস্টারক্লাস",
      subtitle: "Why Sunscreen is the Non-Negotiable Core of Every Routine",
      accent: "#c62828",
      bg: "linear-gradient(160deg, #fce4ec, #f8bbd0)",
      img: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&auto=format&fit=crop&q=80",
      steps: [
        { n: "☀️", t: "SPF 30 বনাম SPF 50", d: "SPF 30 প্রায় ৯৭% এবং SPF 50 প্রায় ৯৮% ক্ষতিকর UVB রশ্মি ব্লক করে। প্রতিদিনের জন্য SPF 50+ PA++++ সেরা।" },
        { n: "🛡️", t: "মিনারেল বনাম কেমিক্যাল", d: "মিনারেল সানস্ক্রিন সংবেদনশীল ও ব্রণপ্রবণ ত্বকে দারুণ। কেমিক্যাল সানস্ক্রিন হালকা এবং কোনো সাদা ভাব ফেলে না।" },
        { n: "✌️", t: "দুই আঙুলের নিয়ম (Two Fingers)", d: "তর্জনী ও মধ্যমা আঙুল বরাবর সানস্ক্রিন নিয়ে পুরো মুখ ও গলায় সমানভাবে লাগাতে হবে।" },
        { n: "⏰", t: "রি-অ্যাপ্লিকেশন", d: "বাইরে রোদ বা ঘামের মধ্যে থাকলে প্রতি ৩ ঘণ্টা পরপর সানস্ক্রিন পুনরায় লাগানো জরুরি।" }
      ]
    },
    // Page 12: Acne & Blemish Care
    {
      num: 12,
      type: "tips",
      title: "ব্রণ ও ব্ল্যাকহেডস সমাধানের প্রোটোকল",
      subtitle: "Clear Breakouts Without Damaging Your Skin Barrier",
      accent: "#00695c",
      bg: "linear-gradient(135deg, #e0f7fa, #80deea)",
      img: "https://images.unsplash.com/photo-1531983412531-1f49a365ffed?w=600&auto=format&fit=crop&q=80",
      tips: [
        "স্যালিসিলিক এসিড (BHA): তেলের ভেতরে ঢুকে রোমকূপের জমাট ময়লা ও ব্ল্যাকহেডস গলিয়ে দেয়",
        "পিম্পল প্যাচ (Acne Patch): ব্রণে হাত দেওয়া বন্ধ করে এবং পুঁজ দ্রুত শুষে নেয়",
        "কখনওই ব্রণ নখ দিয়ে খুঁটবেন না, এতে চিরস্থায়ী গর্ত বা গাঢ় কালো দাগ পড়ে যায়",
        "ব্রণ হলেও ময়েশ্চারাইজার বাদ দেবেন না; ত্বক শুষ্ক হলে আরও বেশি তেল ক্ষরণ করে",
        "বালিশের কভার প্রতি সপ্তাহে অন্তত ২ বার পরিষ্কার সুতি বা সিল্ক কভার দিয়ে পরিবর্তন করুন"
      ]
    },
    // Page 13: Flawless Face Makeup
    {
      num: 13,
      type: "feature",
      title: "বেস মেকআপ ও নিখুঁত ফাউন্ডেশন",
      subtitle: "Primer, Shade Matching, and Seamless Blending Techniques",
      accent: "#1565c0",
      bg: "linear-gradient(135deg, #e3f2fd, #bbdefb)",
      img: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600&auto=format&fit=crop&q=80",
      steps: [
        { n: "০১", t: "স্কিন প্রিপারেশন", d: "মেকআপের ১০ মিনিট আগে ময়েশ্চারাইজার ও নন-গ্রিজি সানস্ক্রিন লাগিয়ে ত্বক তৈরি করুন।" },
        { n: "০২", t: "প্রাইমার সিলেকশন", d: "অয়েলি ত্বকে পোর-ব্লারিং ম্যাট প্রাইমার এবং শুষ্ক ত্বকে ডিউই হাইড্রেটিং প্রাইমার ব্যবহার করুন।" },
        { n: "০৩", t: "আন্ডারটোন ম্যাচিং", d: "হাতের শিরার রঙ দেখে সঠিক আন্ডারটোন (ওয়ার্ম, কুল বা নিউট্রাল) নির্বাচন করুন।" },
        { n: "০৪", t: "ড্যাব অ্যান্ড ব্লেন্ড", d: "ভেজা মেকআপ স্পঞ্জ দিয়ে ফাউন্ডেশন কখনোই টেনে ঘষবেন না, হালকা ট্যাপ করে ব্লেন্ড করুন।" },
        { n: "০৫", t: "লকিং উইথ স্প্রে", d: "মেকআপ দীর্ঘস্থায়ী ও স্বাভাবিক দেখাতে সেটিং পাউডারের পর হাইড্রেটিং সেটিং স্প্রে দিন।" }
      ]
    },
    // Page 14: Eye Makeup
    {
      num: 14,
      type: "feature",
      title: "চোখের মোহময়ী রূপ ও মাস্কারা",
      subtitle: "From Effortless Daytime Definition to Sultry Evening Drama",
      accent: "#6a1b9a",
      bg: "linear-gradient(135deg, #f3e5f5, #ce93d8)",
      img: "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=600&auto=format&fit=crop&q=80",
      steps: [
        { n: "০১", t: "আই প্রাইমার", d: "আইশ্যাডোর রঙ নিখুঁতভাবে ফুটিয়ে তুলতে এবং সারাদিন ক্রিজ না করার জন্য প্রাইমার আবশ্যক।" },
        { n: "০২", t: "ট্রানজিশন শেড", d: "চোখের ভাঁজে হালকা বাদামি বা পিচ রঙের শেড ফ্লফি ব্রাশ দিয়ে ব্লেন্ড করুন।" },
        { n: "০৩", t: "আউটার ভি ডেপথ", d: "চোখের বাইরের কোণে সামান্য গাঢ় শেড দিয়ে চোখকে আকর্ষণীয় গভীরতা দিন।" },
        { n: "০৪", t: "শিমার লিড", d: "চোখের পাতার মাঝে আঙুলের ডগায় সামান্য শিমার বা গ্লিটার শেড ড্যাব করুন।" },
        { n: "০৫", t: "উইং লাইনার ও মাস্কারা", d: "চোখের পাতার গোড়ায় মাস্কারা হালকা কাঁপিয়ে ওপরের দিকে টানলে ঘন পাপড়ির লুক আসে।" }
      ]
    },
    // Page 15: Lip Care
    {
      num: 15,
      type: "spotlight",
      title: "নরম ঠোঁট ও লিপস্টিক পারফেকশন",
      subtitle: "Hydration, Precision Contouring, and All-Day Color",
      accent: "#0277bd",
      bg: "linear-gradient(135deg, #e8f4f8, #b3d9e8)",
      img: "https://images.unsplash.com/photo-1586495777744-4e6232bf2b09?w=600&auto=format&fit=crop&q=80",
      body: [
        "ঠোঁটের চামড়া আমাদের মুখের অন্য যেকোনো অংশের চেয়ে ৩ গুণ পাতলা এবং এতে কোনো তেলের গ্রন্থি নেই। তাই ফাটা বা রুক্ষ ঠোঁটে ম্যাট লিপস্টিক সুন্দর দেখায় না।"
      ],
      tips: [
        "প্রতি রাতে ঘুমানোর আগে থিক বেরি লিপ স্লিপিং মাস্ক বা ভ্যাসলিন লাগান",
        "সপ্তাহে একবার ব্রাউন সুগার ও নারিকেল তেল দিয়ে হালকা স্ক্রাব করুন",
        "ম্যাট লিপস্টিক পরার ১০ মিনিট আগে লিপ বাম লাগিয়ে অতিরিক্ত তেল মুছে নিন",
        "লিপ লাইনার দিয়ে সীমানা এঁকে নিলে লিপস্টিক ছড়ায় না এবং দীর্ঘস্থায়ী হয়",
        "ঠোঁট কখনোই জিহ্বা দিয়ে ভেজাবেন না — লালার এনজাইমে ঠোঁট আরও বেশি ফেটে যায়"
      ]
    },
    // Page 16: Hair Care Science
    {
      num: 16,
      type: "feature",
      title: "চুলের যত্ন ও স্ক্যাল্প হেলথ সায়েন্স",
      subtitle: "Healthy, Voluminous Hair Begins at the Scalp",
      accent: "#33691e",
      bg: "linear-gradient(135deg, #f1f8e9, #dcedc8)",
      img: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&auto=format&fit=crop&q=80",
      steps: [
        { n: "০১", t: "সালফেট-ফ্রি শ্যাম্পু", d: "স্ক্যাল্পের প্রাকৃতিক লিপিড স্তর রক্ষা করতে সালফেটমুক্ত শ্যাম্পু দিয়ে শুধু মাথার ত্বক পরিষ্কার করুন।" },
        { n: "০২", t: "কন্ডিশনার নিয়ম", d: "কন্ডিশনার কখনোই স্ক্যাল্পে লাগাবেন না, শুধু চুলের মাঝামাঝি থেকে আগা পর্যন্ত দিন।" },
        { n: "০৩", t: "ঠান্ডা পানির রিঞ্জ", d: "চুল ধোয়ার শেষে একবার ঠান্ডা পানির ঝাপটা দিলে চুলের কিউটিকেল বন্ধ হয়ে সিল্কি শাইন দেয়।" },
        { n: "০৪", t: "ভেজা চুলে সতর্কতা", d: "ভেজা চুল সবচেয়ে দুর্বল থাকে। কখনোই ভেজা চুল শক্ত করে বাঁধবেন না বা আঁচড়াবেন না।" }
      ]
    },
    // Page 17: Anti Hair Fall
    {
      num: 17,
      type: "tips",
      title: "চুল পড়া বন্ধ ও নতুন চুল গজানোর উপায়",
      subtitle: "Clinically Proven Remedies to Reduce Shedding and Stimulate Growth",
      accent: "#c62828",
      bg: "linear-gradient(135deg, #fce4ec, #f48fb1)",
      img: "https://images.unsplash.com/photo-1499557354967-2b2d8910bcca?w=600&auto=format&fit=crop&q=80",
      tips: [
        "রোজমেরি অয়েল (Rosemary Oil): গবেষণায় প্রমাণিত এটি চুলের ফলিকল উজ্জীবিত করতে অসাধারণ কার্যকর",
        "প্রতিদিন ৪ মিনিট আঙুলের ডগা দিয়ে স্ক্যাল্প ম্যাসাজ করলে রক্ত সঞ্চালন তুঙ্গে থাকে",
        "বায়োটিন ও ওমেগা-৩ যুক্ত খাদ্য (ডিম, বাদাম ও সামুদ্রিক মাছ) চুলের গোড়া শক্ত করে",
        "ঘুমানোর সময় সুতি কভারের বদলে সাটিন বা সিল্কের কভার ব্যবহার করলে ঘর্ষণজনিত চুল ভাঙা বন্ধ হয়",
        "অতিরিক্ত ড্রায়ার ও স্ট্রেইটনারের হিট এড়িয়ে চলুন; ব্যবহারের আগে হিট প্রোটেক্ট্যান্ট স্প্রে দিন"
      ]
    },
    // Page 18: Kitchen DIY Masks
    {
      num: 18,
      type: "tips",
      title: "৫টি ঘরোয়া কার্যকরী বিউটি রেসিপি",
      subtitle: "Safe, All-Natural Treatments from Everyday Pantry Essentials",
      accent: "#00695c",
      bg: "linear-gradient(135deg, #e0f7fa, #80deea)",
      img: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=600&auto=format&fit=crop&q=80",
      tips: [
        "১. উজ্জ্বলতার ফেসপ্যাক: ১ চামচ কাঁচা মধু + ১ চিমটি কাস্তুরী হলুদ + ১ চামচ টকদই (১৫ মিনিট)",
        "২. রোদে পোড়া দাগ দূর করতে: ২ চামচ তাজা অ্যালোভেরা জেল + ১ চামচ শসার রস (২০ মিনিট)",
        "৩. ফ্রিজি চুলের স্মুদি: ১টি পাকা কলা চটকানো + ১ চামচ খাঁটি নারিকেল তেল + ১ চামচ মধু (৩০ মিনিট)",
        "৪. বডি স্ক্রাব: ২ চামচ কফি গুঁড়া + ১ চামচ চিনি + ২ চামচ আমন্ড তেল দিয়ে গোসলের আগে ম্যাসাজ",
        "৫. নরম ঠোঁটের পলিশ: আধ চামচ ব্রাউন সুগার + কয়েক ফোঁটা খাঁটি মধু দিয়ে আলতো ঘষে ধুয়ে ফেলুন"
      ]
    },
    // Page 19: Body Care
    {
      num: 19,
      type: "feature",
      title: "বডি কেয়ার ও গ্লো রিচুয়াল",
      subtitle: "Extend Your Skincare Standards From Neck to Toe",
      accent: "#e67e22",
      bg: "linear-gradient(135deg, #fdf4e3, #fce8c8)",
      img: "https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=600&auto=format&fit=crop&q=80",
      steps: [
        { n: "০১", t: "ঘাড় ও গলার যত্ন", d: "মুখের সিরাম, ময়েশ্চারাইজার ও সানস্ক্রিন সবসময় গলা ও ঘাড়ে লাগাতে ভুলবেন না।" },
        { n: "০২", t: "৩ মিনিটের নিয়ম", d: "গোসল শেষে শরীর সামান্য ভেজা থাকতেই ৩ মিনিটের মধ্যে বডি লোশন বা বাটার লাগান।" },
        { n: "০৩", t: "কনুই ও হাঁটুর যত্ন", d: "ইউরিয়া বা ল্যাকটিক এসিড যুক্ত লোশন কনুই ও হাঁটুর কালো চামড়া দ্রুত নরম ও ফর্সা করে।" },
        { n: "০৪", t: "হাতের সুরক্ষা", d: "ঘন ঘন হাত ধোয়ার পর সেরামাইড হ্যান্ড ক্রিম লাগিয়ে নখ ও কিউটিকেল ভালো রাখুন।" }
      ]
    },
    // Page 20: Seasonal Care
    {
      num: 20,
      type: "editorial",
      title: "ঋতুভিত্তিক ত্বকের বিশেষ যত্ন",
      subtitle: "Adjusting Your Regimen Across Our Distinct Climate Shifts",
      accent: "#283593",
      bg: "linear-gradient(160deg, #e8eaf6, #c5cae9)",
      img: "https://images.unsplash.com/photo-1555887399-bac7bf547231?w=600&auto=format&fit=crop&q=80",
      body: [
        "গ্রীষ্ম ও বর্ষাকাল (মার্চ - অক্টোবর):",
        "প্রচণ্ড গরম ও অতিরিক্ত আর্দ্রতায় ফাঙ্গাল একনে ও রোমকূপ বন্ধ হওয়ার প্রবণতা বাড়ে। জেল ক্লেনজার, ওয়াটার-বেসড সিরাম এবং নন-কমেডোজেনিক ম্যাট সানস্ক্রিন বেছে নিন।",
        "শীতকাল (নভেম্বর - ফেব্রুয়ারি):",
        "শুষ্ক ঠাণ্ডা বাতাসে চামড়া টানটান হয় ও ঠোঁট ফাটে। মিল্ক ক্লেনজার ব্যবহার করুন এবং রাতে নাইট ক্রিমের ওপর ২ ফোঁটা রোজহিপ বা আরগান তেল দিয়ে আর্দ্রতা লক করুন।",
        "ঢাকার ধুলোবালি প্রতিরোধ:",
        "বাইরে থেকে এসে ডাবল ক্লিনজিং এবং সকালে ভিটামিন সি অ্যান্টিঅক্সিডেন্ট ধুলো ও ধোঁয়ার ক্ষতিকর কণা থেকে ত্বক রক্ষা করে।"
      ]
    },
    // Page 21: Superfoods & Sleep
    {
      num: 21,
      type: "feature",
      title: "ভেতর থেকে রূপচর্চা: খাবার ও ঘুম",
      subtitle: "How Nutrition and Rest Directly Govern Your Skin Complexion",
      accent: "#827717",
      bg: "linear-gradient(135deg, #f9fbe7, #f0f4c3)",
      img: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&auto=format&fit=crop&q=80",
      steps: [
        { n: "🥑", t: "ওমেগা-৩ ও স্বাস্থ্যকর ফ্যাট", d: "বাদাম, চিয়া সিডস ও সামুদ্রিক মাছ ত্বকের কোষীয় প্রাচীর মজবুত ও নরম রাখে।" },
        { n: "🫐", t: "অ্যান্টিঅক্সিডেন্ট ফলমূল", d: "পেঁপে, আমলকি, লেবু ও বেরিজাতীয় ফল কোলাজেন তৈরি দ্বিগুণ বাড়িয়ে দেয়।" },
        { n: "💧", t: "৮ গ্লাস বিশুদ্ধ পানি", d: "কোষীয় টক্সিন বের করতে এবং ত্বক ভেতর থেকে উজ্জ্বল রাখতে প্রতিদিন পর্যাপ্ত পানি আবশ্যক।" },
        { n: "😴", t: "৭-৮ ঘণ্টার গভীর ঘুম", d: "ঘুমের সময় মানব গ্রোথ হরমোন নিঃসৃত হয়ে নতুন চামড়া তৈরি করে ও চোখের কালি দূর করে।" }
      ]
    },
    // Page 22: Men's Grooming
    {
      num: 22,
      type: "spotlight",
      title: "পুরুষের ত্বক ও দাড়ির সহজ রূপচর্চা",
      subtitle: "Simple, High-Performance Skincare Tailored for Men",
      accent: "#bf360c",
      bg: "linear-gradient(135deg, #fbe9e7, #ffccbc)",
      img: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=600&auto=format&fit=crop&q=80",
      body: [
        "পুরুষের ত্বক সাধারণত ২০% বেশি পুরু এবং এতে সিবাম বা তেলের ক্ষরণ বেশি হয়। পুরুষের রূপচর্চা কোনো বিলাসিতা নয়, এটি মৌলিক স্বাস্থ্য সচেতনতা।"
      ],
      tips: [
        "১. সকালে ও রাতে স্যালিসিলিক এসিড যুক্ত ফেসওয়াশ দিয়ে মুখ ধোবেন",
        "২. বাইরে বের হলে অবশ্যই অয়েল-ফ্রি ম্যাট ফিনিশ সানস্ক্রিন লাগান",
        "৩. শেভ করার পর অ্যালকোহলমুক্ত নারিশিং আফটারশেভ বাম লাগিয়ে রেজার বার্ন রোধ করুন",
        "৪. দাড়ি নরম ও খুশকিমুক্ত রাখতে আরগান বিয়ার্ড অয়েল আঙুল দিয়ে স্কিনে ম্যাসাজ করুন",
        "৫. সপ্তাহে একদিন স্ক্রাব ব্যবহার করে ইনগ্রোন হেয়ার ও রোমকূপের ময়লা দূর করুন"
      ]
    },
    // Page 23: Top 10 Products (DYNAMIC FROM BACKEND)
    {
      num: 23,
      type: "products",
      title: "শীর্ষ ১০টি পরীক্ষিত গ্লোবাল প্রোডাক্ট",
      subtitle: "Direct From Our Store • 100% Genuine Imported Care",
      accent: "#e63b7a",
      bg: "linear-gradient(160deg, #fff8fc, #fde8f3)",
      products: dynamicProducts
    },
    // Page 24: Customer Reviews
    {
      num: 24,
      type: "reviews",
      title: "গ্রাহকদের বাস্তব অভিজ্ঞতা ও রূপান্তর",
      subtitle: "Honest Feedback from Verified Bangladeshi Skincare Lovers",
      accent: "#e65100",
      bg: "linear-gradient(160deg, #fff3e0, #ffe0b2)",
      reviews: [
        { name: "ফারজানা হক", loc: "উত্তরা, ঢাকা", product: "CeraVe Moisturizing Cream & COSRX Essence", text: "অনলাইনের নকল ক্রিম ব্যবহার করে আমার স্কিন ব্যারিয়ার একদম নষ্ট হয়ে গিয়েছিল। GlowGoodly থেকে ১০০% অথেনটিক প্রোডাক্ট পাওয়ার পর মাত্র ১ মাসেই আমার স্কিন সুস্থ ও মসৃণ হয়েছে!" },
        { name: "ডাঃ নাজমুল করিম", loc: "ধানমন্ডি, ঢাকা", product: "Beauty of Joseon Sunscreen", text: "ঢাকার তীব্র রোদে কোনো সানস্ক্রিন সহ্য হতো না, ভারী লাগতো। এই সানস্ক্রিনটি একদমই লাইটওয়েট, কোনো সাদা দাগ থাকে না। অরিজিনাল প্রোডাক্টের জন্য GlowGoodly সেরা।" },
        { name: "তাসনীম রহমান", loc: "নাসিরাবাদ, চট্টগ্রাম", product: "The Ordinary Niacinamide & Zinc", text: "আমার মুখের ব্রণের দাগ আর বড় রোমকূপের সমস্যা ৩ সপ্তাহেই অনেক হালকা হয়ে গেছে। প্যাকেজিং ও ক্যাশ অন ডেলিভারি সার্ভিস অসাধারণ!" }
      ]
    },
    // Page 25: Back Cover (Bangladeshi Heroine - Joya Ahsan)
    {
      num: 25,
      type: "backcover",
      title: "GLOWGOODLY",
      subtitle: isIssue2 ? "THE RADIANCE WITHIN • জয়া আহসান" : "THE BEAUTY EDIT • GLOWGOODLY",
      headline: isIssue2 ? "সৌন্দর্যের নতুন সংজ্ঞা • জয়া আহসান" : "আপনার প্রতিদিনের সৌন্দর্যের বিশ্বস্ত সঙ্গী",
      tagline: "Your Most Trusted Authentic Beauty Destination in Bangladesh",
      accent: "#ffd700",
      bg: "linear-gradient(135deg, #132e22 0%, #1a4231 40%, #0d281d 75%, #061811 100%)",
      img: "/magazines/backcover.jpg",
      body: [
        `GlowGoodly ডিজিটাল ম্যাগাজিনের ${isIssue2 ? "২য়" : "১ম"} সংখ্যা পড়ার জন্য আপনাকে আন্তরিক ধন্যবাদ।`,
        "আমাদের অঙ্গীকার:",
        "• ১০০% অথেনটিক গ্লোবাল ব্র্যান্ডের নিশ্চয়তা",
        "• ৬৪ জেলায় দ্রুত ক্যাশ অন ডেলিভারি সুবিধা",
        "• ২৪/৭ অভিজ্ঞ বিউটি কনসালট্যান্ট ও সহায়তা",
        "ওয়েবসাইট: https://www.glowgoodly.com",
        "ফেসবুক: facebook.com/glowgoodly | ইনস্টাগ্রাম: @glowgoodly",
        "© ২০২৬ GlowGoodly Limited. সর্বস্বত্ব সংরক্ষিত।"
      ]
    }
  ];
}

export default function ShajgojStyleMagazinePage() {
  const [activeIssue, setActiveIssue] = useState<number | null>(null);
  const [activePage, setActivePage] = useState<number>(0);
  const [viewMode, setViewMode] = useState<"book" | "scroll">("book");
  const [backendProducts, setBackendProducts] = useState<any[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState<boolean>(false);

  // Fetch dynamic products from backend API
  useEffect(() => {
    let isMounted = true;
    async function loadBackendProducts() {
      setIsLoadingProducts(true);
      try {
        const res = await fetch(`${API_BASE}/products`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted && Array.isArray(data) && data.length > 0) {
            setBackendProducts(data);
          }
        }
      } catch (err) {
        console.warn("Could not fetch backend products for magazine:", err);
      } finally {
        if (isMounted) setIsLoadingProducts(false);
      }
    }
    loadBackendProducts();
    return () => {
      isMounted = false;
    };
  }, []);

  // Compute live dynamic product items for the magazine
  const dynamicProductItems = useMemo<ProductItem[]>(() => {
    const items: ProductItem[] = [];

    if (backendProducts && backendProducts.length > 0) {
      backendProducts.forEach((p, idx) => {
        const firstVariant = p.variants?.[0];
        const priceNum = firstVariant?.discountPrice || firstVariant?.price || p.price || 1200;
        const origPriceNum = firstVariant?.price;
        const imgUrl = p.images?.[0]?.url || "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400&q=80";
        const brandName = p.brand?.name || "Global Brand";
        const url = getProductUrl(p);

        items.push({
          id: p.id,
          name: p.name,
          brand: brandName,
          price: `৳ ${Number(priceNum).toLocaleString()}`,
          originalPrice: origPriceNum && origPriceNum > priceNum ? `৳ ${Number(origPriceNum).toLocaleString()}` : undefined,
          img: imgUrl,
          tag: idx === 0 ? "BESTSELLER" : idx === 1 ? "EDITOR'S PICK" : idx === 2 ? "TOP RATED" : "AUTHENTIC",
          link: url
        });
      });
    }

    // Top curated items to ensure a rich 6-8 item showcase
    const curatedPicks: ProductItem[] = [
      { id: "c1", name: "COSRX Advanced Snail 96 Mucin Power Essence", brand: "COSRX (Korea)", price: "৳ ১,২০০", img: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400&q=80", tag: "K-BEAUTY HERO", link: "/shop?category=skin-care" },
      { id: "c2", name: "Beauty of Joseon Relief Sun Rice + Probiotics SPF50+", brand: "Beauty of Joseon", price: "৳ ১,৩৫০", img: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&q=80", tag: "HOLY GRAIL", link: "/shop?category=skin-care" },
      { id: "c3", name: "The Ordinary Niacinamide 10% + Zinc 1%", brand: "The Ordinary", price: "৳ ৯৫০", img: "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=400&q=80", tag: "PORE MINIMIZER", link: "/shop?category=skin-care" },
      { id: "c4", name: "CeraVe Moisturizing Cream for Dry Skin", brand: "CeraVe (USA)", price: "৳ ১,৮৫০", img: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&q=80", tag: "BARRIER REPAIR", link: "/shop?category=skin-care" },
      { id: "c5", name: "Neutrogena Hydro Boost Water Gel", brand: "Neutrogena (USA)", price: "৳ ১,৪৫০", img: "https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?w=400&q=80", tag: "DEEP HYDRATION", link: "/shop?category=skin-care" },
      { id: "c6", name: "Laneige Lip Sleeping Mask EX (Berry)", brand: "Laneige (Korea)", price: "৳ ৮৫০", img: "https://images.unsplash.com/photo-1586495777744-4e6232bf2b09?w=400&q=80", tag: "LIP HERO", link: "/shop?category=makeup" }
    ];

    for (const cp of curatedPicks) {
      if (items.length >= 6) break;
      if (!items.find(x => x.name.toLowerCase().includes(cp.name.slice(0, 10).toLowerCase()))) {
        items.push(cp);
      }
    }

    return items;
  }, [backendProducts]);

  // Derive pages based on activeIssue (so Issue 1 shows Mim cover, Issue 2 shows Joya cover!)
  const magazinePages = useMemo(() => getMagazinePages(dynamicProductItems, activeIssue || 1), [dynamicProductItems, activeIssue]);

  const openIssueReader = (issueNumber: number, startPage: number = 0) => {
    setActiveIssue(issueNumber);
    setActivePage(startPage);
    document.body.style.overflow = "hidden";
  };

  const closeIssueReader = () => {
    setActiveIssue(null);
    document.body.style.overflow = "auto";
  };

  const nextPage = () => {
    if (activePage < magazinePages.length - 1) {
      setActivePage(p => p + 1);
    }
  };

  const prevPage = () => {
    if (activePage > 0) {
      setActivePage(p => p - 1);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeIssue !== null) {
        if (e.key === "ArrowRight") nextPage();
        if (e.key === "ArrowLeft") prevPage();
        if (e.key === "Escape") closeIssueReader();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeIssue, activePage, magazinePages.length]);

  const currentPageData = magazinePages[activePage] || magazinePages[0];

  return (
    <div style={{ backgroundColor: "#ffffff", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Header />

      {/* TOP HEADER BANNER */}
      <div 
        style={{ 
          color: "#ffffff", 
          padding: "45px 20px 35px",
          display: "flex", 
          flexDirection: "column",
          justifyContent: "center", 
          alignItems: "center",
          textAlign: "center",
          background: "linear-gradient(135deg, #120520 0%, #2a0b38 40%, #5c143e 80%, #120520 100%)",
          boxShadow: "inset 0 -20px 40px rgba(0,0,0,0.4), 0 4px 20px rgba(0,0,0,0.15)",
          position: "relative",
          overflow: "hidden"
        }}
      >
        <div style={{ position: "absolute", top: 0, left: "20%", width: "400px", height: "400px", background: "radial-gradient(circle, rgba(230,59,122,0.18) 0%, transparent 70%)", filter: "blur(40px)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: 0, right: "20%", width: "350px", height: "350px", background: "radial-gradient(circle, rgba(255,215,0,0.15) 0%, transparent 70%)", filter: "blur(40px)", pointerEvents: "none" }} />

        <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
          <span style={{ height: "1px", width: "40px", backgroundColor: "#ffd700" }}></span>
          <span style={{ fontSize: "11px", fontWeight: "900", letterSpacing: "3px", color: "#ffd700", textTransform: "uppercase" }}>
            AUTHENTIC BEAUTY JOURNAL
          </span>
          <span style={{ height: "1px", width: "40px", backgroundColor: "#ffd700" }}></span>
        </div>

        <h1 style={{ fontSize: "38px", fontWeight: "900", margin: "0 0 8px", letterSpacing: "2px", fontFamily: "'Playfair Display', Georgia, serif", color: "#ffffff", textShadow: "0 4px 15px rgba(0,0,0,0.6)" }}>
          GlowGoodly Magazine
        </h1>

        <p style={{ color: "rgba(255,255,255,0.85)", fontSize: "14px", margin: "0 0 16px", maxWidth: "600px", lineHeight: 1.6, fontWeight: 500 }}>
          বাংলাদেশ ও বৈশ্বিক রূপচর্চার পূর্ণাঙ্গ ডিজিটাল বিউটি জার্নাল • ১০০% পরীক্ষিত ডার্মাটোলজি গাইড ও এক্সক্লুসিভ লাইভ শপ
        </p>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", justifyContent: "center" }}>
          <span style={{ background: "rgba(255,255,255,0.1)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", fontSize: "11.5px", fontWeight: "700", padding: "5px 14px", borderRadius: "20px" }}>
            ✨ ২৫ পৃষ্ঠার সম্পূর্ণ সংস্করণ
          </span>
          <span style={{ background: "rgba(255,255,255,0.1)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.2)", color: "#ffd700", fontSize: "11.5px", fontWeight: "700", padding: "5px 14px", borderRadius: "20px" }}>
            💎 কভার স্টার: বিদ্যা সিনহা মিম ও জয়া আহসান
          </span>
          <span style={{ background: "rgba(255,255,255,0.1)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", fontSize: "11.5px", fontWeight: "700", padding: "5px 14px", borderRadius: "20px" }}>
            📥 ফ্রি PDF ডাউনলোড
          </span>
        </div>
      </div>

      {/* MAIN CONTAINER */}
      <main className="container" style={{ maxWidth: "1200px", margin: "40px auto 80px", padding: "0 20px", flex: 1 }}>
        
        {/* Intro text & Download Links */}
        <div style={{ marginBottom: "36px", borderBottom: "1.5px solid #f1f5f9", paddingBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "14px" }}>
          <div>
            <h2 style={{ fontSize: "24px", fontWeight: "900", color: "#1a0a2e", margin: "0 0 6px" }}>
              আমাদের ডিজিটাল ম্যাগাজিন সংস্করণ
            </h2>
            <p style={{ color: "#64748b", fontSize: "14.5px", margin: 0 }}>
              ম্যাগাজিন কভারে ক্লিক করে বইয়ের মতো পাতা উল্টে পড়ুন অথবা সংশ্লিষ্ট সংখ্যার হাই-রেজ্যুলেশন PDF ফাইল ওপেন করুন।
            </p>
          </div>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <a 
              href="/magazines/1.pdf" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "linear-gradient(135deg, #fdf2f8, #fce7f3)", color: "#e63b7a", border: "1.5px solid #fbcfe8", padding: "9px 16px", borderRadius: "25px", fontSize: "12.5px", fontWeight: "800", textDecoration: "none", boxShadow: "0 2px 8px rgba(230,59,122,0.12)" }}
            >
              📄 ১ম সংখ্যা PDF (মিম কভার)
            </a>
            <a 
              href="/magazines/2.pdf" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "linear-gradient(135deg, #ecfdf5, #d1fae5)", color: "#059669", border: "1.5px solid #a7f3d0", padding: "9px 16px", borderRadius: "25px", fontSize: "12.5px", fontWeight: "800", textDecoration: "none", boxShadow: "0 2px 8px rgba(5,150,105,0.12)" }}
            >
              📄 ২য় সংখ্যা PDF (জয়া আহসান কভার)
            </a>
          </div>
        </div>

        {/* ISSUE SHELF */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "36px", justifyContent: "flex-start", paddingBottom: "40px" }}>
          
          {/* Issue 1: Radiance Edition (Featuring Bidya Sinha Saha Mim) */}
          <div style={{ width: "340px", display: "flex", flexDirection: "column" }}>
            <a 
              href="/magazines/1.pdf" 
              target="_blank" 
              rel="noopener noreferrer"
              title="১ম সংখ্যা PDF ওপেন করুন"
              style={{ 
                cursor: "pointer", 
                borderRadius: "16px", 
                overflow: "hidden", 
                boxShadow: "0 16px 40px rgba(0,0,0,0.18)", 
                border: "2px solid #fce7f3",
                position: "relative",
                transition: "transform 0.3s ease, box-shadow 0.3s ease",
                backgroundColor: "#1a0a2e",
                display: "block",
                textDecoration: "none"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-8px)";
                e.currentTarget.style.boxShadow = "0 24px 50px rgba(230,59,122,0.3)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 16px 40px rgba(0,0,0,0.18)";
              }}
            >
              <img 
                src="/magazines/issue1_cover.jpg" 
                alt="GlowGoodly Magazine Issue 1 - Bidya Sinha Mim" 
                style={{ width: "100%", height: "460px", objectFit: "cover", display: "block" }} 
              />
              <div style={{ position: "absolute", bottom: "14px", left: "14px", right: "14px", background: "rgba(18, 5, 32, 0.88)", backdropFilter: "blur(8px)", borderRadius: "8px", padding: "8px 12px", display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid rgba(255,215,0,0.35)" }}>
                <span style={{ color: "#ffd700", fontSize: "12px", fontWeight: "800" }}>📄 ক্লিক করে 1.pdf পড়ুন</span>
                <span style={{ background: "#e63b7a", color: "#ffffff", padding: "2px 8px", borderRadius: "4px", fontSize: "10px", fontWeight: "900" }}>1.pdf ↗</span>
              </div>
            </a>

            <h2 style={{ fontWeight: 800, color: "#1a0a2e", fontSize: "18px", margin: "16px 0 6px" }}>
              ১ম সংখ্যা | Radiance Edition
            </h2>
            <p style={{ color: "#64748b", fontSize: "13.5px", margin: "0 0 14px", lineHeight: 1.5 }}>
              বিদ্যা সিনহা মিম কভার স্টোরি, স্কিন টাইপ টেস্ট, K-Beauty সিক্রেটস ও সানস্ক্রিন গাইড।
            </p>

            <div style={{ display: "flex", gap: "10px" }}>
              <a 
                href="/magazines/1.pdf" 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ flex: 1.1, background: "linear-gradient(135deg, #e63b7a, #c2185b)", color: "#ffffff", border: "none", borderRadius: "8px", padding: "11px", fontWeight: "800", fontSize: "13px", cursor: "pointer", textDecoration: "none", textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", boxShadow: "0 4px 12px rgba(230,59,122,0.25)" }}
              >
                📄 1.pdf ওপেন
              </a>
              <button 
                onClick={() => openIssueReader(1, 0)}
                style={{ flex: 1, background: "#f8fafc", color: "#334155", border: "1px solid #cbd5e1", borderRadius: "8px", padding: "11px", fontWeight: "800", fontSize: "13px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
              >
                📖 অনলাইন রিডার
              </button>
            </div>
          </div>

          {/* Issue 2: Festive Glow Edition (Featuring Joya Ahsan) */}
          <div style={{ width: "340px", display: "flex", flexDirection: "column" }}>
            <a 
              href="/magazines/2.pdf" 
              target="_blank" 
              rel="noopener noreferrer"
              title="২য় সংখ্যা PDF ওপেন করুন"
              style={{ 
                cursor: "pointer", 
                borderRadius: "16px", 
                overflow: "hidden", 
                boxShadow: "0 16px 40px rgba(0,0,0,0.18)", 
                border: "2px solid #d1fae5",
                position: "relative",
                transition: "transform 0.3s ease, box-shadow 0.3s ease",
                backgroundColor: "#092015",
                display: "block",
                textDecoration: "none"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-8px)";
                e.currentTarget.style.boxShadow = "0 24px 50px rgba(16,185,129,0.3)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 16px 40px rgba(0,0,0,0.18)";
              }}
            >
              <img 
                src="/magazines/issue2_cover.jpg" 
                alt="GlowGoodly Magazine Issue 2 - Joya Ahsan" 
                style={{ width: "100%", height: "460px", objectFit: "cover", display: "block" }} 
              />
              <div style={{ position: "absolute", bottom: "14px", left: "14px", right: "14px", background: "rgba(5, 28, 18, 0.88)", backdropFilter: "blur(8px)", borderRadius: "8px", padding: "8px 12px", display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid rgba(255,215,0,0.35)" }}>
                <span style={{ color: "#ffd700", fontSize: "12px", fontWeight: "800" }}>📄 ক্লিক করে 2.pdf পড়ুন</span>
                <span style={{ background: "#10b981", color: "#ffffff", padding: "2px 8px", borderRadius: "4px", fontSize: "10px", fontWeight: "900" }}>2.pdf ↗</span>
              </div>
            </a>

            <h2 style={{ fontWeight: 800, color: "#1a0a2e", fontSize: "18px", margin: "16px 0 6px" }}>
              ২য় সংখ্যা | Festive Glow Edition
            </h2>
            <p style={{ color: "#64748b", fontSize: "13.5px", margin: "0 0 14px", lineHeight: 1.5 }}>
              জয়া আহসান কভার স্টোরি, উইন্টার স্কিন রিপেয়ার, ব্রাইডাল রূপচর্চা ও উৎসবের গ্ল্যামার লুক।
            </p>

            <div style={{ display: "flex", gap: "10px" }}>
              <a 
                href="/magazines/2.pdf" 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ flex: 1.1, background: "linear-gradient(135deg, #059669, #047857)", color: "#ffffff", border: "none", borderRadius: "8px", padding: "11px", fontWeight: "800", fontSize: "13px", cursor: "pointer", textDecoration: "none", textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", boxShadow: "0 4px 12px rgba(5,150,105,0.25)" }}
              >
                📄 2.pdf ওপেন
              </a>
              <button 
                onClick={() => openIssueReader(2, 0)}
                style={{ flex: 1, background: "#f8fafc", color: "#334155", border: "1px solid #cbd5e1", borderRadius: "8px", padding: "11px", fontWeight: "800", fontSize: "13px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
              >
                📖 অনলাইন রিডার
              </button>
            </div>
          </div>

          {/* Upcoming Issue 3 */}
          <div style={{ width: "340px", display: "flex", flexDirection: "column", opacity: 0.85 }}>
            <div 
              style={{ 
                borderRadius: "16px", 
                overflow: "hidden", 
                boxShadow: "0 8px 24px rgba(0,0,0,0.08)", 
                border: "2px dashed #cbd5e1",
                height: "460px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#f8fafc",
                padding: "30px",
                textAlign: "center"
              }}
            >
              <div style={{ fontSize: "52px", marginBottom: "16px" }}>✨</div>
              <span style={{ background: "#e2e8f0", color: "#475569", padding: "5px 14px", borderRadius: "14px", fontSize: "11.5px", fontWeight: "900", marginBottom: "12px" }}>
                শীঘ্রই আসছে
              </span>
              <h3 style={{ color: "#1a0a2e", fontSize: "20px", fontWeight: "900", margin: "0 0 8px", fontFamily: "'Playfair Display', Georgia, serif" }}>
                3rd Issue: Monsoon Care
              </h3>
              <p style={{ color: "#64748b", fontSize: "13px", margin: 0, lineHeight: 1.6 }}>
                বর্ষাকালের স্কিন ও হেয়ার কেয়ার নিয়ে আমাদের পরবর্তী স্পেশাল সংখ্যা তৈরি হচ্ছে।
              </p>
            </div>

            <h2 style={{ fontWeight: 800, color: "#64748b", fontSize: "18px", margin: "16px 0 6px" }}>
              ৩য় সংখ্যা | Coming Soon
            </h2>
            <p style={{ color: "#94a3b8", fontSize: "13.5px", margin: "0 0 14px" }}>
              প্রি-নোটিফিকেশন পেতে আমাদের সাথে যুক্ত থাকুন।
            </p>

            <button 
              disabled
              style={{ background: "#e2e8f0", color: "#94a3b8", border: "none", borderRadius: "8px", padding: "11px", fontWeight: "800", fontSize: "13px", cursor: "not-allowed" }}
            >
              শীঘ্রই আসছে
            </button>
          </div>

        </div>

      </main>

      {/* FULLSCREEN POPUP DIGITAL READER MODAL */}
      {activeIssue !== null && (
        <div 
          style={{ 
            position: "fixed", 
            inset: 0, 
            backgroundColor: "rgba(10, 3, 20, 0.95)", 
            backdropFilter: "blur(14px)",
            zIndex: 99999, 
            display: "flex", 
            flexDirection: "column",
            overflow: "hidden"
          }}
        >
          {/* TOP CONTROLS BAR */}
          <div 
            style={{ 
              background: "linear-gradient(90deg, #120520, #2d0b38)", 
              borderBottom: "1px solid rgba(230,59,122,0.3)", 
              padding: "10px 20px", 
              display: "flex", 
              justifyContent: "space-between", 
              alignItems: "center",
              flexWrap: "wrap",
              gap: "12px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.5)"
            }}
          >
            {/* Logo & Issue Title */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "20px", fontWeight: "900", background: "linear-gradient(135deg, #ffd700, #ff85b3)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", letterSpacing: "1px", fontFamily: "'Playfair Display', serif" }}>
                  GLOWGOODLY
                </span>
                <span style={{ fontSize: "10px", background: "rgba(230,59,122,0.25)", color: "#ff85b3", padding: "2px 8px", borderRadius: "10px", fontWeight: "900", border: "1px solid rgba(230,59,122,0.4)" }}>
                  MAGAZINE
                </span>
              </div>
              <span style={{ color: "rgba(255,255,255,0.3)" }}>|</span>
              <span style={{ color: "#ffd700", fontSize: "12px", fontWeight: "800" }}>
                {activeIssue === 1 ? "১ম সংখ্যা: বিদ্যা সিনহা মিম" : "২য় সংখ্যা: জয়া আহসান"}
              </span>
            </div>

            {/* View Mode Switcher */}
            <div style={{ display: "flex", alignItems: "center", background: "rgba(0,0,0,0.4)", borderRadius: "8px", padding: "3px", border: "1px solid rgba(255,255,255,0.12)" }}>
              <button 
                onClick={() => setViewMode("book")}
                style={{ 
                  background: viewMode === "book" ? "linear-gradient(135deg, #e63b7a, #c2185b)" : "transparent", 
                  color: "#ffffff", 
                  border: "none", 
                  borderRadius: "6px", 
                  padding: "5px 12px", 
                  fontSize: "12px", 
                  fontWeight: "800", 
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px"
                }}
              >
                📖 বই ভিউ
              </button>
              <button 
                onClick={() => setViewMode("scroll")}
                style={{ 
                  background: viewMode === "scroll" ? "linear-gradient(135deg, #e63b7a, #c2185b)" : "transparent", 
                  color: "#ffffff", 
                  border: "none", 
                  borderRadius: "6px", 
                  padding: "5px 12px", 
                  fontSize: "12px", 
                  fontWeight: "800", 
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px"
                }}
              >
                📜 স্ক্রোল ভিউ
              </button>
            </div>

            {/* Page Jump Selector */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.7)", fontWeight: "600" }}>পাতায় যান:</span>
              <select 
                value={activePage} 
                onChange={(e) => setActivePage(Number(e.target.value))}
                style={{ background: "#2d0b38", color: "#ffd700", border: "1px solid rgba(230,59,122,0.5)", borderRadius: "6px", padding: "5px 10px", fontSize: "12px", fontWeight: "800", outline: "none", cursor: "pointer" }}
              >
                {magazinePages.map((pg, i) => (
                  <option key={pg.num} value={i} style={{ background: "#1a0a2e", color: "#fff" }}>
                    পাতা {i + 1}: {pg.title}
                  </option>
                ))}
              </select>
            </div>

            {/* PDF Link & Close */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <a 
                href={`/magazines/${activeIssue}.pdf`} 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ background: "rgba(230,59,122,0.25)", color: "#ffd700", border: "1.5px solid #e63b7a", borderRadius: "6px", padding: "6px 14px", fontSize: "12px", fontWeight: "800", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "5px", boxShadow: "0 2px 8px rgba(230,59,122,0.2)" }}
              >
                📥 {activeIssue === 1 ? "১ম সংখ্যা PDF (মিম)" : "২য় সংখ্যা PDF (জয়া)"} ডাউনলোড
              </a>
              <button 
                onClick={closeIssueReader}
                style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "#ffffff", width: "34px", height: "34px", borderRadius: "50%", cursor: "pointer", fontSize: "17px", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.2s" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#e63b7a")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.15)")}
                title="বন্ধ করুন (Esc)"
              >
                ✕
              </button>
            </div>
          </div>

          {/* READER CONTENT AREA */}
          <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", alignItems: "center", padding: "24px 12px" }}>
            
            {/* VIEW MODE 1: BOOK FLIPBOOK VIEW */}
            {viewMode === "book" && (
              <div style={{ maxWidth: "800px", width: "100%", margin: "auto", position: "relative" }}>
                
                {/* Previous Page Floating Arrow */}
                <button 
                  onClick={prevPage} 
                  disabled={activePage === 0}
                  style={{ 
                    position: "fixed", 
                    left: "20px", 
                    top: "50%", 
                    transform: "translateY(-50%)", 
                    background: activePage === 0 ? "rgba(255,255,255,0.05)" : "linear-gradient(135deg, #e63b7a, #c2185b)", 
                    color: "#ffffff", 
                    border: "none", 
                    width: "50px", 
                    height: "50px", 
                    borderRadius: "50%", 
                    cursor: activePage === 0 ? "not-allowed" : "pointer", 
                    fontSize: "26px", 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
                    zIndex: 10
                  }}
                  title="আগের পাতা (Left Arrow)"
                >
                  ‹
                </button>

                {/* Next Page Floating Arrow */}
                <button 
                  onClick={nextPage} 
                  disabled={activePage === magazinePages.length - 1}
                  style={{ 
                    position: "fixed", 
                    right: "20px", 
                    top: "50%", 
                    transform: "translateY(-50%)", 
                    background: activePage === magazinePages.length - 1 ? "rgba(255,255,255,0.05)" : "linear-gradient(135deg, #e63b7a, #c2185b)", 
                    color: "#ffffff", 
                    border: "none", 
                    width: "50px", 
                    height: "50px", 
                    borderRadius: "50%", 
                    cursor: activePage === magazinePages.length - 1 ? "not-allowed" : "pointer", 
                    fontSize: "26px", 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
                    zIndex: 10
                  }}
                  title="পরের পাতা (Right Arrow)"
                >
                  ›
                </button>

                {/* Magazine Paper Sheet */}
                <div 
                  style={{ 
                    background: currentPageData.bg, 
                    borderRadius: "18px", 
                    minHeight: "780px", 
                    padding: currentPageData.type === "cover" || currentPageData.type === "backcover" ? "0" : "36px 36px", 
                    boxShadow: "0 30px 70px rgba(0,0,0,0.6), 0 0 2px rgba(255,255,255,0.2)", 
                    position: "relative",
                    overflow: "hidden",
                    border: "1px solid rgba(255,255,255,0.18)"
                  }}
                >
                  {/* Page Top Header Ribbon */}
                  {currentPageData.type !== "cover" && currentPageData.type !== "backcover" && (
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1.5px solid ${currentPageData.accent}30`, paddingBottom: "12px", marginBottom: "24px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "11px", fontWeight: "900", color: currentPageData.accent, letterSpacing: "1.5px" }}>
                        <span>GLOWGOODLY BEAUTY MAGAZINE</span>
                        <span style={{ color: "rgba(0,0,0,0.2)" }}>|</span>
                        <span>ISSUE 0{activeIssue}</span>
                      </div>
                      <div style={{ background: currentPageData.accent, color: "#ffffff", padding: "3px 12px", borderRadius: "12px", fontSize: "11px", fontWeight: "900" }}>
                        পাতা {activePage + 1} / ২৫
                      </div>
                    </div>
                  )}

                  {/* Page 1: COVER (High-Res Luxury Magazine Cover) */}
                  {currentPageData.type === "cover" && (
                    <div style={{ position: "relative", minHeight: "800px", borderRadius: "14px", overflow: "hidden", display: "flex", justifyContent: "center", alignItems: "center", backgroundColor: "#0b0314" }}>
                      <img 
                        src={currentPageData.img} 
                        alt={currentPageData.headline || "GlowGoodly Magazine Cover"} 
                        style={{ width: "100%", height: "auto", display: "block" }} 
                      />
                    </div>
                  )}

                  {/* Page 2: Table of Contents */}
                  {currentPageData.type === "toc" && (
                    <div>
                      <h2 style={{ fontSize: "28px", fontWeight: "900", color: "#1a0a2e", margin: "0 0 4px", fontFamily: "'Playfair Display', Georgia, serif" }}>
                        {currentPageData.title}
                      </h2>
                      <p style={{ color: "#64748b", fontSize: "13.5px", margin: "0 0 20px", fontWeight: "600" }}>
                        {currentPageData.subtitle}
                      </p>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "24px" }}>
                        {currentPageData.sections?.map((s, i) => (
                          <div key={i} onClick={() => setActivePage(i + 2 < 25 ? i + 2 : 24)} style={{ cursor: "pointer", background: "rgba(255,255,255,0.8)", padding: "10px 14px", borderRadius: "8px", border: "1px solid rgba(230,59,122,0.18)", display: "flex", gap: "12px", alignItems: "center", transition: "transform 0.15s" }}>
                            <span style={{ fontSize: "17px", fontWeight: "900", color: currentPageData.accent }}>{s.num}</span>
                            <div>
                              <div style={{ fontSize: "12.5px", fontWeight: "800", color: "#1a0a2e" }}>{s.title}</div>
                              <div style={{ fontSize: "11px", color: "#64748b" }}>{s.desc}</div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div style={{ background: "#ffffff", padding: "18px", borderRadius: "12px", borderLeft: `4px solid ${currentPageData.accent}`, boxShadow: "0 4px 12px rgba(0,0,0,0.04)" }}>
                        {currentPageData.body?.map((p, i) => (
                          <p key={i} style={{ fontSize: "13.5px", color: "#334155", margin: "0 0 8px", lineHeight: 1.65, fontWeight: 500 }}>
                            {p}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Editorial / Spotlight */}
                  {(currentPageData.type === "editorial" || currentPageData.type === "spotlight") && (
                    <div>
                      <h2 style={{ fontSize: "28px", fontWeight: "900", color: "#1a0a2e", margin: "0 0 4px", fontFamily: "'Playfair Display', Georgia, serif" }}>
                        {currentPageData.title}
                      </h2>
                      <p style={{ color: "#64748b", fontSize: "13.5px", margin: "0 0 20px", fontWeight: "600" }}>
                        {currentPageData.subtitle}
                      </p>

                      {currentPageData.img && (
                        <div style={{ width: "100%", height: "220px", borderRadius: "14px", overflow: "hidden", marginBottom: "20px", boxShadow: "0 8px 24px rgba(0,0,0,0.08)" }}>
                          <img src={currentPageData.img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        </div>
                      )}

                      <div style={{ marginBottom: "20px" }}>
                        {currentPageData.body?.map((b, i) => (
                          <p key={i} style={{ fontSize: "14.5px", lineHeight: 1.85, color: "#334155", margin: "0 0 12px", fontWeight: 500 }}>
                            {b}
                          </p>
                        ))}
                      </div>

                      {currentPageData.tips && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                          {currentPageData.tips.map((t, i) => (
                            <div key={i} style={{ background: "rgba(255,255,255,0.8)", padding: "11px 16px", borderRadius: "10px", borderLeft: `3.5px solid ${currentPageData.accent}`, fontSize: "13.5px", color: "#1e293b", fontWeight: "600" }}>
                              {t}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Feature Pages (Steps) */}
                  {currentPageData.type === "feature" && (
                    <div>
                      <h2 style={{ fontSize: "28px", fontWeight: "900", color: "#1a0a2e", margin: "0 0 4px", fontFamily: "'Playfair Display', Georgia, serif" }}>
                        {currentPageData.title}
                      </h2>
                      <p style={{ color: "#64748b", fontSize: "13.5px", margin: "0 0 18px", fontWeight: "600" }}>
                        {currentPageData.subtitle}
                      </p>

                      {currentPageData.img && (
                        <div style={{ width: "100%", height: "180px", borderRadius: "14px", overflow: "hidden", marginBottom: "18px", boxShadow: "0 8px 22px rgba(0,0,0,0.08)" }}>
                          <img src={currentPageData.img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        </div>
                      )}

                      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        {currentPageData.steps?.map((s, i) => (
                          <div key={i} style={{ display: "flex", gap: "14px", alignItems: "flex-start", background: "rgba(255,255,255,0.8)", padding: "12px 16px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.7)" }}>
                            <span style={{ fontSize: "18px", fontWeight: "900", color: currentPageData.accent, minWidth: "32px" }}>
                              {s.n}
                            </span>
                            <div>
                              <div style={{ fontWeight: "800", fontSize: "14px", color: "#1a0a2e", marginBottom: "3px" }}>{s.t}</div>
                              <div style={{ fontSize: "13px", color: "#475569", lineHeight: 1.55, fontWeight: "500" }}>{s.d}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tips Pages */}
                  {currentPageData.type === "tips" && (
                    <div>
                      <h2 style={{ fontSize: "28px", fontWeight: "900", color: "#1a0a2e", margin: "0 0 4px", fontFamily: "'Playfair Display', Georgia, serif" }}>
                        {currentPageData.title}
                      </h2>
                      <p style={{ color: "#64748b", fontSize: "13.5px", margin: "0 0 18px", fontWeight: "600" }}>
                        {currentPageData.subtitle}
                      </p>

                      {currentPageData.img && (
                        <div style={{ width: "100%", height: "190px", borderRadius: "14px", overflow: "hidden", marginBottom: "18px" }}>
                          <img src={currentPageData.img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        </div>
                      )}

                      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        {currentPageData.tips?.map((t, i) => (
                          <div key={i} style={{ background: "rgba(255,255,255,0.85)", padding: "12px 16px", borderRadius: "10px", fontSize: "13.5px", color: "#1e293b", fontWeight: "600", lineHeight: 1.6, borderLeft: `4px solid ${currentPageData.accent}` }}>
                            {t}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Page 23: DYNAMIC PRODUCTS (From Backend API) */}
                  {currentPageData.type === "products" && (
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "16px" }}>
                        <div>
                          <h2 style={{ fontSize: "28px", fontWeight: "900", color: "#1a0a2e", margin: "0 0 4px", fontFamily: "'Playfair Display', Georgia, serif" }}>
                            {currentPageData.title}
                          </h2>
                          <p style={{ color: "#64748b", fontSize: "13.5px", margin: 0, fontWeight: "600" }}>
                            {currentPageData.subtitle}
                          </p>
                        </div>
                        <span style={{ fontSize: "11px", fontWeight: "800", color: "#e63b7a", background: "#fce7f3", padding: "4px 12px", borderRadius: "14px" }}>
                          {backendProducts.length > 0 ? "লাইভ শপ স্টক" : "ভেরিফায়েড কালেকশন"}
                        </span>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: "14px", marginBottom: "22px" }}>
                        {currentPageData.products?.map((pr, i) => (
                          <div key={i} style={{ background: "#ffffff", borderRadius: "12px", overflow: "hidden", border: "1px solid #f1f5f9", boxShadow: "0 4px 14px rgba(0,0,0,0.06)", display: "flex", flexDirection: "column", transition: "transform 0.2s, box-shadow 0.2s" }}>
                            <div style={{ height: "135px", position: "relative", backgroundColor: "#f8fafc" }}>
                              <img src={pr.img} alt={pr.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                              <span style={{ position: "absolute", top: "8px", left: "8px", background: "rgba(230,59,122,0.92)", color: "#fff", fontSize: "9.5px", fontWeight: "900", padding: "3px 8px", borderRadius: "10px", backdropFilter: "blur(4px)" }}>
                                {pr.tag}
                              </span>
                            </div>
                            <div style={{ padding: "12px", display: "flex", flexDirection: "column", flex: 1, justifyContent: "space-between" }}>
                              <div>
                                <div style={{ fontSize: "10.5px", color: "#64748b", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px" }}>{pr.brand}</div>
                                <h4 style={{ fontSize: "12.5px", fontWeight: "800", color: "#1a0a2e", margin: "4px 0 8px", lineHeight: 1.35, height: "34px", overflow: "hidden" }}>{pr.name}</h4>
                                <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
                                  <span style={{ fontSize: "15px", fontWeight: "900", color: "#e63b7a" }}>{pr.price}</span>
                                  {pr.originalPrice && <span style={{ fontSize: "11px", color: "#94a3b8", textDecoration: "line-through" }}>{pr.originalPrice}</span>}
                                </div>
                              </div>
                              <Link 
                                href={pr.link || "/shop"} 
                                target="_blank" 
                                style={{ marginTop: "10px", display: "block", textAlign: "center", background: "linear-gradient(135deg, #e63b7a, #c2185b)", color: "#ffffff", padding: "8px 12px", borderRadius: "6px", fontWeight: "800", fontSize: "12px", textDecoration: "none", boxShadow: "0 2px 8px rgba(230,59,122,0.3)" }}
                              >
                                অর্ডার করুন / ভিউ →
                              </Link>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div style={{ textAlign: "center", background: "rgba(255,255,255,0.8)", padding: "16px", borderRadius: "12px", border: "1.5px dashed #e63b7a" }}>
                        <p style={{ margin: "0 0 10px", fontSize: "13.5px", color: "#1a0a2e", fontWeight: "800" }}>
                          আমাদের শপে রয়েছে ৫০০+ ১০০% অরিজিনাল স্কিনকেয়ার ও কসমেটিক্স আইটেম
                        </p>
                        <Link href="/shop" target="_blank" style={{ display: "inline-block", background: "#1a0a2e", color: "#ffd700", padding: "10px 24px", borderRadius: "25px", fontWeight: "800", fontSize: "13px", textDecoration: "none" }}>
                          সম্পূর্ণ শপ ব্রাউজ করুন →
                        </Link>
                      </div>
                    </div>
                  )}

                  {/* Customer Reviews */}
                  {currentPageData.type === "reviews" && (
                    <div>
                      <h2 style={{ fontSize: "28px", fontWeight: "900", color: "#1a0a2e", margin: "0 0 4px", fontFamily: "'Playfair Display', Georgia, serif" }}>
                        {currentPageData.title}
                      </h2>
                      <p style={{ color: "#64748b", fontSize: "13.5px", margin: "0 0 20px", fontWeight: "600" }}>
                        {currentPageData.subtitle}
                      </p>

                      <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                        {currentPageData.reviews?.map((r, i) => (
                          <div key={i} style={{ background: "#ffffff", padding: "16px 20px", borderRadius: "12px", border: "1px solid #fed7aa", boxShadow: "0 4px 14px rgba(0,0,0,0.04)" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                              <div>
                                <span style={{ fontWeight: "800", fontSize: "14px", color: "#1a0a2e" }}>{r.name}</span>
                                <span style={{ fontSize: "12px", color: "#9a3412", marginLeft: "8px" }}>({r.loc})</span>
                              </div>
                              <span style={{ color: "#f59e0b", fontSize: "13px" }}>★★★★★</span>
                            </div>
                            <div style={{ fontSize: "11px", fontWeight: "800", color: "#e65100", marginBottom: "6px" }}>ব্যবহার করেছেন: {r.product}</div>
                            <p style={{ fontSize: "13.5px", color: "#334155", margin: 0, lineHeight: 1.6 }}>“{r.text}”</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Page 25: BACK COVER (Bangladeshi Heroine - Joya Ahsan) */}
                  {currentPageData.type === "backcover" && (
                    <div style={{ position: "relative", minHeight: "780px", display: "flex", flexDirection: "column", justifyContent: "space-between", color: "#ffffff" }}>
                      <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
                        <img src={currentPageData.img} alt="Backcover Bangladeshi Heroine" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(10,25,20,0.7) 0%, rgba(10,25,20,0.2) 30%, rgba(10,25,20,0.85) 75%, rgba(10,25,20,0.98) 100%)" }} />
                      </div>

                      {/* Top Header */}
                      <div style={{ position: "relative", zIndex: 1, padding: "32px 32px 0", textAlign: "center" }}>
                        <h1 style={{ fontSize: "44px", fontWeight: "900", margin: "0", fontFamily: "'Playfair Display', Georgia, serif", letterSpacing: "3px", color: "#ffd700", textShadow: "0 3px 15px rgba(0,0,0,0.8)" }}>
                          GLOWGOODLY
                        </h1>
                        <div style={{ fontSize: "12.5px", fontWeight: "800", letterSpacing: "4px", color: "rgba(255,255,255,0.9)", textTransform: "uppercase" }}>
                          THE RADIANCE WITHIN • জয়া আহসান
                        </div>
                      </div>

                      {/* Center Quote */}
                      <div style={{ position: "relative", zIndex: 1, padding: "20px 32px", textAlign: "center", maxWidth: "560px", margin: "0 auto" }}>
                        <div style={{ fontSize: "38px", color: "#ffd700", lineHeight: 1 }}>“</div>
                        <p style={{ fontSize: "19px", fontStyle: "italic", fontWeight: "700", color: "#ffffff", margin: "0 0 10px", lineHeight: 1.5, textShadow: "0 2px 10px rgba(0,0,0,0.8)" }}>
                          রূপচর্চা কেবল বাহিরের সাজ নয়, এটি নিজের প্রতি ভালোবাসা ও সুস্থতার আত্মবিশ্বাস।
                        </p>
                        <div style={{ fontSize: "14px", color: "#ffd700", fontWeight: "800" }}>— জয়া আহসান</div>
                      </div>

                      {/* Bottom Manifesto Box */}
                      <div style={{ position: "relative", zIndex: 1, padding: "26px 32px", background: "rgba(6,20,15,0.85)", backdropFilter: "blur(10px)", borderTop: "1.5px solid rgba(255,215,0,0.3)" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                          <div>
                            <div style={{ fontSize: "12.5px", fontWeight: "900", color: "#ffd700", marginBottom: "6px" }}>আমাদের অঙ্গীকার:</div>
                            <div style={{ fontSize: "11.5px", color: "rgba(255,255,255,0.85)", lineHeight: 1.6 }}>
                              ✓ ১০০% অথেনটিক গ্লোবাল প্রোডাক্ট গ্যারান্টি<br />
                              ✓ ৬৪ জেলায় ক্যাশ অন ডেলিভারি সুবিধা<br />
                              ✓ ফ্রি স্কিন কনসালট্যান্ট ও ২৪/৭ সহায়তা
                            </div>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontSize: "12.5px", fontWeight: "900", color: "#ffd700", marginBottom: "6px" }}>যোগাযোগ ও অর্ডার:</div>
                            <div style={{ fontSize: "11.5px", color: "rgba(255,255,255,0.85)", lineHeight: 1.6 }}>
                              ওয়েবসাইট: www.glowgoodly.com<br />
                              হটলাইন: 01700-000000<br />
                              ফেসবুক ও ইনস্টাগ্রাম: @glowgoodly
                            </div>
                          </div>
                        </div>
                        <div style={{ textAlign: "center", borderTop: "1px solid rgba(255,255,255,0.15)", paddingTop: "10px", fontSize: "11.5px", color: "rgba(255,255,255,0.6)" }}>
                          © ২০২৬ GlowGoodly Limited. সর্বস্বত্ব সংরক্ষিত।
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Page Bottom Navigation Buttons */}
                  {currentPageData.type !== "cover" && currentPageData.type !== "backcover" && (
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "32px", paddingTop: "16px", borderTop: "1px solid rgba(0,0,0,0.08)" }}>
                      <button 
                        onClick={prevPage} 
                        disabled={activePage === 0}
                        style={{ background: "rgba(0,0,0,0.06)", border: "none", borderRadius: "8px", padding: "9px 18px", color: activePage === 0 ? "#cbd5e1" : "#1a0a2e", cursor: activePage === 0 ? "not-allowed" : "pointer", fontWeight: "800", fontSize: "13px" }}
                      >
                        ← আগের পাতা
                      </button>
                      <span style={{ fontSize: "12.5px", color: "#64748b", fontWeight: "700" }}>
                        পাতা {activePage + 1} / ২৫
                      </span>
                      <button 
                        onClick={nextPage} 
                        disabled={activePage === magazinePages.length - 1}
                        style={{ background: "linear-gradient(135deg, #e63b7a, #c2185b)", border: "none", borderRadius: "8px", padding: "9px 18px", color: "#ffffff", cursor: activePage === magazinePages.length - 1 ? "not-allowed" : "pointer", fontWeight: "800", fontSize: "13px", boxShadow: "0 2px 8px rgba(230,59,122,0.3)" }}
                      >
                        পরের পাতা →
                      </button>
                    </div>
                  )}

                </div>

              </div>
            )}

            {/* VIEW MODE 2: CONTINUOUS SCROLL */}
            {viewMode === "scroll" && (
              <div style={{ maxWidth: "800px", width: "100%", display: "flex", flexDirection: "column", gap: "28px" }}>
                {magazinePages.map((pg, idx) => (
                  <div 
                    key={pg.num} 
                    style={{ 
                      background: pg.bg, 
                      borderRadius: "16px", 
                      padding: pg.type === "cover" || pg.type === "backcover" ? "0" : "36px 32px", 
                      boxShadow: "0 12px 35px rgba(0,0,0,0.35)", 
                      position: "relative",
                      overflow: "hidden"
                    }}
                  >
                    {/* Header bar */}
                    {pg.type !== "cover" && pg.type !== "backcover" && (
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1.5px solid ${pg.accent}30`, paddingBottom: "10px", marginBottom: "20px" }}>
                        <span style={{ fontSize: "11px", fontWeight: "900", color: pg.accent, letterSpacing: "1px" }}>
                          GLOWGOODLY MAGAZINE • ISSUE 0{activeIssue}
                        </span>
                        <span style={{ background: pg.accent, color: "#ffffff", padding: "3px 10px", borderRadius: "10px", fontSize: "11px", fontWeight: "900" }}>
                          PAGE {idx + 1} OF 25
                        </span>
                      </div>
                    )}

                    {/* Cover in Scroll */}
                    {pg.type === "cover" && (
                      <div style={{ position: "relative", borderRadius: "14px", overflow: "hidden", backgroundColor: "#0b0314" }}>
                        <img 
                          src={pg.img} 
                          alt={pg.headline || "GlowGoodly Magazine Cover"} 
                          style={{ width: "100%", height: "auto", display: "block" }} 
                        />
                      </div>
                    )}

                    {/* Backcover in Scroll */}
                    {pg.type === "backcover" && (
                      <div style={{ position: "relative", minHeight: "680px", display: "flex", flexDirection: "column", justifyContent: "space-between", color: "#ffffff" }}>
                        <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
                          <img src={pg.img} alt="Backcover" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(10,25,20,0.7) 0%, transparent 40%, rgba(10,25,20,0.95) 100%)" }} />
                        </div>
                        <div style={{ position: "relative", zIndex: 1, padding: "30px", textAlign: "center" }}>
                          <h1 style={{ fontSize: "40px", fontWeight: "900", margin: "0", fontFamily: "'Playfair Display', Georgia, serif", color: "#ffd700" }}>
                            GLOWGOODLY
                          </h1>
                          <div style={{ fontSize: "12px", color: "#ffffff", letterSpacing: "3px" }}>THE RADIANCE WITHIN • জয়া আহসান</div>
                        </div>
                        <div style={{ position: "relative", zIndex: 1, padding: "24px 30px", background: "rgba(6,20,15,0.85)" }}>
                          <p style={{ fontStyle: "italic", fontSize: "16px", color: "#ffd700", margin: "0 0 8px" }}>“রূপচর্চা কেবল বাহিরের সাজ নয়, এটি নিজের প্রতি ভালোবাসা।”</p>
                          <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.8)" }}>© ২০২৬ GlowGoodly Limited. www.glowgoodly.com</div>
                        </div>
                      </div>
                    )}

                    {/* Regular pages in scroll */}
                    {pg.type !== "cover" && pg.type !== "backcover" && (
                      <>
                        <h2 style={{ fontSize: "24px", fontWeight: "900", color: "#1a0a2e", margin: "0 0 4px", fontFamily: "'Playfair Display', Georgia, serif" }}>
                          {pg.title}
                        </h2>
                        <p style={{ color: "#64748b", fontSize: "13px", margin: "0 0 16px", fontWeight: "600" }}>
                          {pg.subtitle}
                        </p>

                        {pg.img && (
                          <div style={{ width: "100%", height: "200px", borderRadius: "10px", overflow: "hidden", marginBottom: "16px" }}>
                            <img src={pg.img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          </div>
                        )}

                        {pg.body && (
                          <div style={{ marginBottom: "16px" }}>
                            {pg.body.map((b, bi) => (
                              <p key={bi} style={{ fontSize: "14px", color: "#334155", margin: "0 0 10px", lineHeight: 1.7 }}>
                                {b}
                              </p>
                            ))}
                          </div>
                        )}

                        {pg.steps && (
                          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            {pg.steps.map((st, si) => (
                              <div key={si} style={{ background: "rgba(255,255,255,0.75)", padding: "10px 14px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.6)" }}>
                                <div style={{ fontWeight: "800", fontSize: "13px", color: "#1a0a2e" }}>{st.n}. {st.t}</div>
                                <div style={{ fontSize: "12px", color: "#475569", marginTop: "2px" }}>{st.d}</div>
                              </div>
                            ))}
                          </div>
                        )}

                        {pg.tips && (
                          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            {pg.tips.map((tp, ti) => (
                              <div key={ti} style={{ background: "rgba(255,255,255,0.85)", padding: "10px 14px", borderRadius: "8px", fontSize: "13px", color: "#1e293b", fontWeight: "600", borderLeft: `3px solid ${pg.accent}` }}>
                                {tp}
                              </div>
                            ))}
                          </div>
                        )}

                        {pg.type === "products" && (
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginTop: "14px" }}>
                            {pg.products?.map((pr, pi) => (
                              <div key={pi} style={{ background: "#ffffff", borderRadius: "8px", overflow: "hidden", border: "1px solid #e2e8f0", padding: "8px" }}>
                                <img src={pr.img} alt={pr.name} style={{ width: "100%", height: "90px", objectFit: "cover", borderRadius: "6px" }} />
                                <div style={{ fontSize: "10px", color: "#64748b", fontWeight: "700", marginTop: "6px" }}>{pr.brand}</div>
                                <div style={{ fontSize: "11px", fontWeight: "800", color: "#1a0a2e", height: "28px", overflow: "hidden" }}>{pr.name}</div>
                                <div style={{ fontSize: "13px", fontWeight: "900", color: "#e63b7a", margin: "4px 0" }}>{pr.price}</div>
                                <Link href={pr.link || "/shop"} target="_blank" style={{ display: "block", textAlign: "center", background: "#e63b7a", color: "#fff", padding: "4px", borderRadius: "4px", fontSize: "11px", fontWeight: "800", textDecoration: "none" }}>
                                  অর্ডার করুন →
                                </Link>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}

          </div>
        </div>
      )}

      <Footer />
      <MobileNavbar />
    </div>
  );
}
