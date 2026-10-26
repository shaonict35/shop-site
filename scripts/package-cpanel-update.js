const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const outDir = path.join(rootDir, 'cpanel_updated_files');

// Ensure output dir is clean
if (fs.existsSync(outDir)) {
  fs.rmSync(outDir, { recursive: true, force: true });
}
fs.mkdirSync(outDir, { recursive: true });

// Copy frontend public .htaccess to out/.htaccess
const frontendHtaccess = path.join(rootDir, 'frontend', 'public', '.htaccess');
const frontendOutHtaccess = path.join(rootDir, 'frontend', 'out', '.htaccess');
if (fs.existsSync(path.join(rootDir, 'frontend', 'out'))) {
  fs.copyFileSync(frontendHtaccess, frontendOutHtaccess);
  console.log('✓ Copied .htaccess to frontend/out/.htaccess');
}

// List of updated files to package
const filesToPackage = [
  // Backend Source Files
  { src: 'backend/src/server.ts', dest: 'backend/src/server.ts' },
  { src: 'backend/src/middleware/auth.ts', dest: 'backend/src/middleware/auth.ts' },
  { src: 'backend/src/routes/orders.ts', dest: 'backend/src/routes/orders.ts' },
  { src: 'backend/src/routes/notifications.ts', dest: 'backend/src/routes/notifications.ts' },
  { src: 'backend/src/routes/banners.ts', dest: 'backend/src/routes/banners.ts' },
  { src: 'backend/src/routes/products.ts', dest: 'backend/src/routes/products.ts' },
  { src: 'backend/src/services/imageStorage.ts', dest: 'backend/src/services/imageStorage.ts' },
  { src: 'backend/src/catalogFallback.ts', dest: 'backend/src/catalogFallback.ts' },
  { src: 'backend/data/fallbackProducts.json', dest: 'backend/data/fallbackProducts.json' },

  // Backend Compiled JavaScript Dist Files (ready to run on cPanel Node.js without rebuilding)
  { src: 'backend/dist/server.js', dest: 'backend/dist/server.js' },
  { src: 'backend/dist/middleware/auth.js', dest: 'backend/dist/middleware/auth.js' },
  { src: 'backend/dist/routes/orders.js', dest: 'backend/dist/routes/orders.js' },
  { src: 'backend/dist/routes/notifications.js', dest: 'backend/dist/routes/notifications.js' },
  { src: 'backend/dist/routes/banners.js', dest: 'backend/dist/routes/banners.js' },
  { src: 'backend/dist/routes/products.js', dest: 'backend/dist/routes/products.js' },
  { src: 'backend/dist/services/imageStorage.js', dest: 'backend/dist/services/imageStorage.js' },
  { src: 'backend/dist/catalogFallback.js', dest: 'backend/dist/catalogFallback.js' },

  // Frontend Components & Pages
  { src: 'frontend/src/components/OfflineSaleModule.tsx', dest: 'frontend/src/components/OfflineSaleModule.tsx' },
  { src: 'frontend/src/app/layout.tsx', dest: 'frontend/src/app/layout.tsx' },
  { src: 'frontend/src/app/valobasa/page.tsx', dest: 'frontend/src/app/valobasa/page.tsx' },
  { src: 'frontend/src/app/admin/page.tsx', dest: 'frontend/src/app/admin/page.tsx' },
  { src: 'frontend/src/app/page.tsx', dest: 'frontend/src/app/page.tsx' },
  { src: 'frontend/public/sw.js', dest: 'frontend/public/sw.js' },
  { src: 'frontend/public/.htaccess', dest: 'frontend/public/.htaccess' },

  // cPanel public_html root files (.htaccess and sw.js for PushAlert)
  { src: 'frontend/public/.htaccess', dest: 'public_html/.htaccess' },
  { src: 'frontend/public/sw.js', dest: 'public_html/sw.js' }
];

console.log('Copying files to cpanel_updated_files package...');
filesToPackage.forEach(({ src, dest }) => {
  const fullSrc = path.join(rootDir, src);
  const fullDest = path.join(outDir, dest);
  if (fs.existsSync(fullSrc)) {
    fs.mkdirSync(path.dirname(fullDest), { recursive: true });
    fs.copyFileSync(fullSrc, fullDest);
    console.log(`✓ [COPIED] ${src} -> ${dest}`);
  } else {
    console.warn(`! [MISSING] ${src}`);
  }
});

// Create README_CPANEL_INSTRUCTIONS.txt
const readmeContent = `========================================================================
GLOWGOODLY - cPanel Update & File Replacement Instructions (বাংলা গাইড)
========================================================================

এই প্যাকেজে আপনার রিকোয়েস্ট করা সব কয়টি ফিক্স করা ফাইল সাজিয়ে রাখা হয়েছে।
কোন ফাইলটি cPanel-এ কোথায় রিপ্লেস করবেন নিচে বিস্তারিত দেওয়া হলো:

1. [Backend Node.js Server ফিক্স] ("Failed to fetch", CORS Error, Offline POS, Token):
   যদি আপনার cPanel-এ TypeScript চালিত থাকে (src ফোল্ডার):
   - backend/src/server.ts -> cPanel-এর backend/src/server.ts-এ রিপ্লেস করুন
   - backend/src/routes/orders.ts -> cPanel-এর backend/src/routes/orders.ts-এ রিপ্লেস করুন
   - backend/src/middleware/auth.ts -> cPanel-এর backend/src/middleware/auth.ts-এ রিপ্লেস করুন
   - backend/src/routes/banners.ts -> cPanel-এর backend/src/routes/banners.ts-এ রিপ্লেস করুন
   - backend/src/routes/products.ts -> cPanel-এর backend/src/routes/products.ts-এ রিপ্লেস করুন
   - backend/src/services/imageStorage.ts -> cPanel-এর backend/src/services/imageStorage.ts-এ রিপ্লেস করুন
   - backend/src/catalogFallback.ts -> cPanel-এর backend/src/catalogFallback.ts-এ রিপ্লেস করুন
   - backend/data/fallbackProducts.json -> cPanel-এর backend/data/fallbackProducts.json-এ রিপ্লেস করুন

   যদি আপনার cPanel সরাসরি Compiled JavaScript (dist ফোল্ডার) দিয়ে চলে:
   - backend/dist/server.js -> cPanel-এর backend/dist/server.js
   - backend/dist/routes/orders.js -> cPanel-এর backend/dist/routes/orders.js
   - backend/dist/middleware/auth.js -> cPanel-এর backend/dist/middleware/auth.js
   - backend/dist/routes/banners.js -> cPanel-এর backend/dist/routes/banners.js
   - backend/dist/routes/products.js -> cPanel-এর backend/dist/routes/products.js
   - backend/dist/services/imageStorage.js -> cPanel-এর backend/dist/services/imageStorage.js
   - backend/dist/catalogFallback.js -> cPanel-এর backend/dist/catalogFallback.js

   (সব ফাইল রিপ্লেস করার পর cPanel "Setup Node.js App" থেকে Restart Application বাটনে ক্লিক করবেন)

2. [Frontend Admin Panel & Offline Sale / POS Module]:
   - frontend/src/components/OfflineSaleModule.tsx -> cPanel-এর frontend/src/components/OfflineSaleModule.tsx
   - frontend/src/app/valobasa/page.tsx -> cPanel-এর frontend/src/app/valobasa/page.tsx
   - frontend/src/app/admin/page.tsx -> cPanel-এর frontend/src/app/admin/page.tsx
   - frontend/src/app/page.tsx -> cPanel-এর frontend/src/app/page.tsx

3. [Apache / cPanel Website Routing ফিক্স] (.htaccess):
   - public_html/.htaccess -> cPanel-এর public_html/.htaccess ফাইলে রিপ্লেস করুন

========================================================================
কোন কোন সমস্যার সম্পূর্ণ সমাধান করা হয়েছে:
1. "Failed to fetch" / "Error saving category" / "Error deleting brand":
   ব্যাকএন্ডের CORS Preflight OPTIONS-এ ব্রাউজারের পাঠানো \`x-admin-key\` এবং কাস্টম হেডার এলাউ করা না থাকায় ব্রাউজার রিকোয়েস্ট ব্লক করে দিতো। এটি পুরোপুরি ফিক্স করা হয়েছে এবং ১০০ এমবি বডি সাইজ এলাউ করা হয়েছে।
2. নতুন "Offline Sale (POS)":
   অ্যাডমিন প্যানেলে সম্পূর্ণ আলাদা একটি অফলাইন / শোরুম বিক্রয় কাউন্টার মডিউল যোগ করা হয়েছে:
   - লাইভ প্রডাক্ট সার্চ ও ক্যাটালগ গ্রিড (স্টক ইন্ডিকেটর ও শেড/ভেরিয়েন্ট সিলেক্টরসহ)
   - কার্ট কোয়ান্টিটি স্ট্যাপার ও কাস্টম প্রাইস এডিট
   - ডিসকাউন্ট ও নেট টোটাল হিসেব
   - Cash / bKash / Nagad / Card পেমেন্ট মেথড
   - ক্যাশ পেমেন্টে গৃহীত টাকা লিখলে কত টাকা ফেরত (Change Due) দিতে হবে স্বয়ংক্রিয় হিসাব
   - "Complete Sale & Print Receipt" বাটনে ক্লিক করলেই স্বয়ংক্রিয়ভাবে ডাটাবেজ থেকে স্টক কমে যাবে এবং প্রফেশনাল থার্মাল/A4 ক্যাশ মেমো প্রিন্ট প্রিভিউ ওপেন হবে
   - বিগত সব অফলাইন বিক্রির হিস্টোরি ও রি-প্রিন্ট সুবিধা
3. Home Banner Video/GIF/SVG/PDF এবং ডিলিট সুবিধা
========================================================================
4. Brands Add & Delete: অ্যাডমিন প্যানেলে /admin/brands এন্ডপয়েন্ট এবং মাস্টার অথেনটিকেশন যুক্ত করা হয়েছে। নতুন ব্র্যান্ড তৈরি ও ডিলিট করা এখন পুরোপুরি কাজ করছে।
5. Single Product Page: সব প্রডাক্টের slug রাউটিং ফিক্স করা হয়েছে এবং ৩,২১৪টি ক্যাটালগ প্রডাক্টের ডেটা যুক্ত করা হয়েছে যাতে যেকোনো প্রডাক্টে ক্লিক করলে ডিটেইলস সুন্দরভাবে দেখা যায়।
6. PushAlert Integration: PushAlert স্ক্রিপ্ট, sw.js সার্ভিস ওয়ার্কার ফাইল এবং অ্যাডমিন প্যানেলে ব্রডকাস্ট নোটিফিকেশন পাঠানোর স্বয়ংক্রিয় মডিউল যুক্ত করা হয়েছে।
7. Admin Sidebar Dropdowns: Home Slides এবং Categories ড্রপডাউন পূর্বে পেজ লোড হওয়ার পর ডিফল্টভাবে ওপেন থাকতো, তা বন্ধ করে ক্লিক করলেই কেবল স্মুথভাবে ওপেন হওয়ার ফিক্স দেওয়া হয়েছে।
========================================================================
`;

fs.writeFileSync(path.join(outDir, 'README_CPANEL_INSTRUCTIONS.txt'), readmeContent, 'utf8');
console.log('✓ Created README_CPANEL_INSTRUCTIONS.txt');

// Create ZIP file using PowerShell Compress-Archive
const zipPath = path.join(rootDir, 'cpanel_updated_files.zip');
if (fs.existsSync(zipPath)) {
  fs.unlinkSync(zipPath);
}

try {
  execSync(`powershell -command "Compress-Archive -Path '${outDir}\\*' -DestinationPath '${zipPath}' -Force"`);
  console.log(`✓ Successfully created ZIP archive: ${zipPath}`);
} catch (zipErr) {
  console.warn('PowerShell zip creation failed, files remain in cpanel_updated_files folder', zipErr);
}
