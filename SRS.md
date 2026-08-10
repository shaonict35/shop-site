# Software Requirements Specification (SRS)
**Project Name:** GlowGoodly Custom E-commerce Platform  
**Target UI/UX Standard:** https://shop.shajgoj.com/ (Strictly Follow Clean, Fast, Mobile-Responsive UI)  
**Goal:** Transition from WordPress to a Custom-Coded, App-Ready Platform.

---

## 1. Architectural & Technology Approach
API-First Architecture: Backend RESTful API or GraphQL needs to be built so that the same API can be reused in the future for iOS & Android Mobile Apps.

**Technology Stack (Recommended):**
- **Frontend (Web):** Next.js / React.js (for SEO and fast rendering).
- **Backend:** Node.js (Express/NestJS) or Next.js API Routes.
- **Database:** PostgreSQL or MongoDB.

---

## 2. Frontend Page Structure (Reference: shop.shajgoj.com)
The development team must study and follow the UI/UX, page flow, and user journey of shop.shajgoj.com. The following pages must be created:
- **Homepage:** Dynamic sliders, category circles, top brands, best-selling products, flash sales, and promotional banners.
- **Category & Brand Pages (Product Listing):** Advanced filtering (price, brand, skin type, concern, etc.), sorting options, and smooth pagination/infinite scroll.
- **Product Details Page (PDP):** Multiple product images with zoom, variant selection (shade/color/ml), stock status, product description, ingredients, how to use, customer reviews, and "Related/Similar Products" section.
- **Cart System:** Smooth "Side Cart Drawer" (like Shajgoj) and a dedicated Cart Page.
- **Checkout Page:** Smooth, fast, and one-page checkout UI. Address auto-fill or map integration.
- **Customer Account Dashboard:**
  - Profile Settings
  - Order History & Live Tracking
  - Saved Addresses
  - Wishlist
  - Loyalty Points / GlowGoodly Balance
- **Offers/Campaign Page:** Dedicated page for all current discounts, coupons, and promotional deals.
- **Blog/Beauty Advice Page:** Content marketing blog section (UI layout in Phase 1).
- **Static Pages:** About Us, Contact Us, Privacy Policy, Terms & Conditions, Return & Refund Policy, FAQ.

---

## 3. Backend & Admin Panel Modules
### 3.1 Product & Inventory Management
- Maintain Category, Sub-category, and Brand list.
- Variable Products: Track inventory by color, shade, volume (ml/gm).
- Inventory Control: Real-time stock updates, low stock alert system.
- Vendor Management: Vendor database, commission tracking.

### 3.2 Order Management
- Status Updates: Pending > Processing > Shipped > Delivered > Cancelled.
- Order Details: Salesman details tracking, order notes, invoice PDF generation.
- Incomplete/Abandoned Orders: Tracking users who leave during checkout.

### 3.3 Customer Management & CRM
- Customer purchase history, loyalty points, and profile details.
- Fraud Customer Tracking: Flag suspicious customers (Red/Yellow) based on IP, phone number, or return history.
- Customer product reviews approval control.

### 3.4 Delivery & Courier Automation
- Delivery Zone: Zone-based (Inside/Outside Dhaka) delivery charge setting.
- Courier Management: One-click order sync with courier APIs (Pathao, Steadfast, etc.) and live tracking link generation.
- Delivery Expense: Track courier charges and in-house delivery rider expenses.

### 3.5 Promotions & Campaigns
- Coupon Management (Fixed/Percentage, usage limits, category limits).
- Buy 1 Get 1 (BOGO), Combo offers, and Flash Sales module.

### 3.6 CMS (Website Content Management)
- Admin control to update homepage banners, sliders, popups, and promotional text.

### 3.7 Staff & Role Management
- Role-Based Access Control (RBAC): Super Admin, Manager, Salesman, Rider. Custom menu visibility.

### 3.8 Analytics & Reporting
- Sales Report (Daily, Weekly, Monthly, Yearly).
- Inventory/Stock Report.
- Customer/User Activity Report.
- Profit/Loss Summary & Financial Analytics.

---

## 4. Dynamic 3rd-Party API Integrations
*Note: API keys must NOT be hardcoded in codebase or `.env`. Admin panel must have an "Integration Settings" menu for dynamic configuration.*
- **Meta & Google Integration:**
  - Facebook Pixel ID, Meta CAPI Token.
  - GA4 Measurement ID, GTM Container ID.
- **SMS Gateway API:**
  - SMS Provider Base URL, API Key, Sender ID.
  - Customizable SMS Templates (Order Placed, Shipped, Delivered).
- **Courier API:**
  - Pathao/Steadfast API Secret, Client ID, Store ID.
- **Payment Gateway:**
  - SSLCommerz/bKash/aamarpay Merchant ID & Password.

---

## 5. Non-Functional Requirements
- **Speed & Performance:** First Contentful Paint (FCP) must be under 1.5 seconds. Highly optimized code.
- **Mobile-First Design:** Optimized UI for mobile users (bottom navigation, touch-friendly buttons).
- **Security:** JWT authentication, SQL injection & XSS protection, rate limiting.

---

## 6. Phase-wise Delivery Plan
- **Phase 1:** Figma/UI Design Approval.
- **Phase 2:** API Architecture & Database Design.
- **Phase 3:** Frontend Web Development & Backend Admin Panel completion.
- **Phase 4:** UAT (User Testing), Speed Optimization, & Final Go-Live.
