# NEVO GROUP — Launch & Production Readiness Checklist

This document details all technical, administrative, and domain configuration steps required for the official public launch of **https://nevogroup.uz**.

---

## 1. Stealth Preview Deactivation Protocol

Currently, the public storefront is protected by the stealth preview mechanism (`?preview=1` query parameter / `localStorage.nevo_admin_preview === '1'`). Visitors without preview authentication see the clean Maintenance / Technical Mode screen.

### How to Turn Off Preview Mode at Launch:
1. In `src/main.js`:
   - Change line 44 / 173 default:
     ```javascript
     // Change isPreviewAuthorized to true by default:
     const isPreviewAuthorized = true;
     ```
   - In `router()`:
     Remove or bypass the `if (!isPreview)` maintenance screen check so all visitors see the live storefront.
   - Remove `#preview-badge` from DOM template.
2. Verify `index.html` meta tags and `robots.txt` allow full crawling.
3. Deploy to production via `git push origin main`.

---

## 2. Supabase Auth & Storage Production Settings

To ensure admin logins, magic links, password resets, and file uploads operate seamlessly on `https://nevogroup.uz`:

### A. Authentication URL Configuration
1. Open [Supabase Dashboard](https://supabase.com/dashboard) -> Select Project (`zohcxekupvkljojqdqtg`).
2. Go to **Authentication** -> **URL Configuration**.
3. Set **Site URL**:
   ```
   https://nevogroup.uz
   ```
4. In **Redirect URLs**, add:
   ```
   https://nevogroup.uz/admin/
   https://nevogroup.uz/admin/**
   http://localhost:5173/admin/
   http://localhost:4173/admin/
   ```
5. Save changes.

### B. Storage Buckets & Policies
1. Verify `product-images` bucket exists with public read permissions for product photos.
2. Confirm RLS policy allows authenticated admin users to INSERT/UPDATE/DELETE assets.

---

## 3. Domain, DNS & Canonical Redirect Verification

1. **Apex & Subdomain Routing**:
   - `https://nevogroup.uz` (Canonical Apex)
   - `http://nevogroup.uz` -> 301 redirects to `https://nevogroup.uz`
   - `http://www.nevogroup.uz` and `https://www.nevogroup.uz` -> 308/301 redirects to `https://nevogroup.uz`
   - `https://nevo-group.vercel.app` -> 308/301 redirects to `https://nevogroup.uz`
   - Handled via `vercel.json` redirects configuration.
2. **DNS Health & Auto-Renew**:
   - Ensure domain registration at registrar has auto-renew enabled with a verified owner payment card.
   - DNS records pointed to Vercel CNAME/A records (`76.76.21.21`).
   - SSL/TLS certificate auto-issued and valid (Let's Encrypt via Vercel).

---

## 4. Search Engines & Webmaster Verification

1. **Google Search Console**:
   - Add property: `https://nevogroup.uz/`
   - Submit XML Sitemap: `https://nevogroup.uz/sitemap.xml`
   - Verify indexing of `/`, `/katalog`, `/katalog/*`, `/aloqa`, `/savat`.
2. **Yandex Webmaster**:
   - Add property: `https://nevogroup.uz/`
   - Submit sitemap and check Cyrillic indexing for Russian queries across Uzbekistan.
3. **Structured Data Validation**:
   - Test URLs via Google Rich Results Test to confirm `HardwareStore`, `Product`, `CollectionPage`, `BreadcrumbList`, and `FAQPage` JSON-LD schemas.

---

## 5. Owner Assets & Business Claims Verification

Single source of truth: `src/config/site-claims.json`.

- [ ] Confirm warehouse address and operating hours in `src/data/content.js`.
- [ ] Confirm official phone numbers (`+998 91 582 34 34`, `+998 97 707 34 34`).
- [ ] Supply real PDF product catalogs (> 50 KB each) into `public/catalogs/` or Supabase storage.
- [ ] Add real verified customer testimonials via Admin panel.
- [ ] Review translated technical specifications (PP-R, PN20, PN25, SDR 11, Dn) across Uzbek, Russian, and English.
