# Prompt for Gemini: Build "NEVO GROUP" Catalog Website (Frontend Only)

Paste everything below into Gemini (CLI or chat).

---

Build a static frontend for an e-commerce catalog website called **NEVO GROUP**, a plumbing and construction-supplies store based in Uzbekistan. No backend, no database, no real payment processing — use mock/hardcoded data and client-side state only (e.g. cart stored in memory or localStorage). Choose whatever modern frontend stack you think fits best (e.g. Next.js/React, or plain HTML/CSS/JS — your call), and explain your choice briefly before starting.

## Brand & Language
- Site name: **NEVO GROUP**
- Tagline: "Santexnika va qurilish mahsulotlari" (Plumbing and construction products)
- Language: Uzbek (Latin script) throughout — all UI text, labels, buttons
- Primary theme color: blue (#1D4ED8)
- Logo: simple placeholder logo (text-based is fine: "NEVO GROUP" with an icon)
- Contact info to display in header/footer: phone numbers `+998 95 260 11 00` and `+998 99 863 11 00`, Instagram handle `@nevo_group_uzbekistan`

## Site Structure / Pages

1. **Homepage (`/`)**
   - Top announcement bar: "O'zbekiston bo'ylab yetkazib berish" (Delivery across Uzbekistan) + contact links
   - Header nav: logo, links to 5 category sections, cart icon, phone number
   - Hero section: headline "10 000+ santexnika va qurilish mahsulotlari — barchasi bir joyda", subtext about wide assortment and delivery, two CTA buttons ("Mahsulotlarni ko'rish" / "Menga mahsulot topib bering"), plus a small grid of 4 product thumbnail images
   - "Product finder" teaser section: text inviting the user to describe what they need (name, description, quantity) and get 3 matching offers — CTA button "3 xil taklif olish"
   - Stats strip: 3 stats — "10 000+ Mahsulot", "O'zbekiston bo'ylab yetkazib berish", "Tezkor buyurtma va aloqa"
   - "Mashhur bo'limlar" (Popular sections): cards for Katalog (539 products), and the 5 categories, each with a product count and short description
   - "Tanlangan mahsulotlar" (Featured products): horizontal scroll/grid of 9 product cards (see Product Data below)
   - "Arzon narxlar" (Budget-friendly): another product grid, 8 cheap fitting items
   - "Nega NEVO GROUP?" (Why us): 8-item benefit grid (icons + short label + short description) — e.g. 10 000+ mahsulot, 5 ta bo'lim, Narx ko'rinib turadi (no hidden prices), Yetkazib berish, Tanlashda yordam, Instagram va telefon, Tezkor javob, 539 ta pozitsiya
   - CTA banner: "Uy uchunmi yoki qurilish uchunmi?" with a button to view products and a "contact an expert" link
   - Final CTA: "Kerakli mahsulotni topdingizmi?" with a "Bog'lanish" (Contact) button and "Mutaxassisdan so'rash" (Ask an expert) link
   - Footer: logo + tagline, contact info, links to the 5 categories, links to Catalog / Product finder / Bulk order / Cart / How to order, and a disclaimer: "Narxlar va rasmlar NEVO GROUP praysidan olingan. Prays vaqti-vaqti bilan yangilanadi — aniq narx va mavjudlikni operatorimiz tasdiqlaydi." (Prices/images come from the price list and are updated periodically; the operator confirms exact price/availability.)

2. **Catalog page (`/catalog`)**
   - Grid of all products with filter/sort controls (sort by price, filter by category)
   - Each product card: image, category tag, brand tag, name, price (formatted like "6 000 so'm"), unit (e.g. "1 metr", "1 dona"), SKU code, "Savatga" (Add to cart) button

3. **Category pages (`/bolim/[slug]`)** for each of the 5 categories:
   - `truba-va-fitinglar` (Pipes & fittings) — 382 products
   - `zapor-armatura` (Shutoff valves) — 113 products
   - `yongin-jihozlari` (Fire equipment) — 17 products
   - `isitish-tizimi` (Heating systems) — 16 products
   - `elektr-jihozlari` (Electrical equipment) — 11 products
   - Same product grid layout as catalog, pre-filtered

4. **Product detail page (`/product/[id]`)**
   - Large image, name, category/brand tags, price, unit, SKU, quantity selector, "Savatga" button, and a short generic description block

5. **Product finder page (`/tanlash`)**
   - Simple multi-step or single-form questionnaire (mock, no real logic needed) that asks a few questions and "recommends" 3 products from the mock catalog

6. **Bulk order page (`/katta-buyurtma`)**
   - A form (name, phone, list of needed items as free text) — on submit, just show a "so'rovingiz qabul qilindi" (request received) confirmation, no real backend

7. **Cart page (`/savat`)**
   - List of items added to cart (client-side state), quantity controls, remove button, total price, "Buyurtma berish" (Place order) button that shows a mock confirmation

8. **Contact page (`/aloqa`)**
   - Phone numbers, Instagram, a simple contact form (non-functional/mock), and "how to order" instructions

## Product Data (use these as mock/seed data; feel free to synthesize more to fill category counts)

Featured products (Trubalar / NEVO brand, unit = 1 metr):
| Name | Price | SKU |
|---|---|---|
| PP-R truba PN16 sovuq suv d20 | 6 000 so'm | NG-TF-1001 |
| PP-R truba PN16 sovuq suv d25 | 9 000 so'm | NG-TF-1002 |
| PP-R truba PN16 sovuq suv d32 | 14 000 so'm | NG-TF-1003 |
| PP-R truba PN16 sovuq suv d40 | 22 000 so'm | NG-TF-1004 |
| PP-R truba PN16 sovuq suv d50 | 35 000 so'm | NG-TF-1005 |
| PP-R truba PN16 sovuq suv d63 | 56 000 so'm | NG-TF-1006 |
| PP-R truba PN16 sovuq suv d75 | 84 000 so'm | NG-TF-1007 |
| PP-R truba PN16 sovuq suv d90 | 130 000 so'm | NG-TF-1008 |

Budget items (PPR fitinglar / AQUA LINE brand, unit = 1 dona):
| Name | Price | SKU |
|---|---|---|
| AQUA LINE mufta d20 | 586 so'm | NG-TF-1042 |
| AQUA LINE burchak 45 daraja d20 | 705 so'm | NG-TF-1054 |
| AQUA LINE burchak 90 daraja d20 | 732 so'm | NG-TF-1048 |
| AQUA LINE mufta d25 | 841 so'm | NG-TF-1043 |
| AQUA LINE burchak 45 daraja d25 | 1 029 so'm | NG-TF-1055 |
| AQUA LINE burchak 90 daraja d25 | 1 053 so'm | NG-TF-1049 |
| AQUA LINE troynik d20 | 1 080 so'm | NG-TF-1060 |
| AQUA LINE mufta d32 | 1 476 so'm | NG-TF-1044 |

Use placeholder/generic product photos (solid-color or simple icon illustrations) for: PPR pipe, PE fitting, cast-iron valve ("zadvijka"), water heater ("boyler"), pipe coupling ("mufta"), 45°/90° elbow ("burchak"), tee ("troynik"). Generate additional mock products (with plausible Uzbek names, prices in so'm, and SKUs following the `NG-TF-####` pattern) to reasonably populate each category — you don't need exactly 539 total, a representative sample (e.g. 20-40 per category) is fine.

## Design Requirements
- Clean, modern e-commerce look: white background, blue (#1D4ED8) accents, card-based product grids with rounded corners and subtle shadows
- Fully responsive (mobile-first) — this is a business targeting phone-heavy users in Uzbekistan
- Product cards show category + brand tags as small pills, price in bold, unit and SKU in small gray text
- Sticky header with cart icon showing item count
- Currency formatting: Uzbek so'm with space as thousands separator (e.g. "130 000 so'm")

## Deliverable
- A working, navigable multi-page (or client-routed single-page) site with all pages above wired together via real navigation links
- Mock cart functionality that persists across page navigation (localStorage or global state) even though there's no real checkout
- Clearly comment in the code that all prices/data are placeholder/mock content for a demo, not real inventory
