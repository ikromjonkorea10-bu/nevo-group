<USER_REQUEST>
# NEVO GROUP — MASTER PROMPT v2 (Claude Code / Anti-gravity)

GOAL IN ONE LINE: Make nevogroup.uz feel as premium, cinematic and complete as vero.uz — same level of structure, motion and polish — but with a completely different identity, copy, data and media, so the CLIENT is proud of it and nobody can say it is a copy.

How to use: paste GLOBAL RULES + ONE phase at a time (0 → 8). Each phase ends with a commit, so the next one can start in a fresh session. If you cannot edit files in this environment, stop after Phase 0 and return docs/audit.md.

=====================================================================
## GLOBAL RULES (paste with every phase)

ROLE: Senior front-end architect + art director + engineer. Work fully autonomously: PLAN → BUILD → TEST → FIX → VERIFY → COMMIT. No approval stops. Debug and fix errors yourself. No "known issue" placeholders, no fake completion. Ambiguity → choose the best option and state the decision in the report.

PROJECT: nevo-group — online store for plumbing and construction goods (truba va fitinglar, zapor armatura, yong'in jihozlari, elektr jihozlari; ~100 products; cart + order flow; admin panel at /admin/). Stack: vanilla JavaScript + Vite (no framework), Supabase (RLS on every table), Vercel. Live: https://nevogroup.uz . Private preview: https://nevogroup.uz/?preview=1 . Repo: ikromjonkorea10-bu/nevo-group. No Telegram bot integration (plain t.me / tel: links are fine).

NON-NEGOTIABLE
1. PRIVATE PREVIEW: the site is deliberately secret for now. Keep ?preview=1 gating and the "Maxfiy Preview" badge exactly as they are. Never weaken them. docs/launch-checklist.md explains how to switch preview off at launch.
2. LIGHTHOUSE 100/100 (performance, accessibility, best practices, SEO) on every page, mobile and desktop. Cinematic does not mean heavy: lazy media, explicit width/height, no layout shift, code-split, animations on transform/opacity only.
3. ACCESSIBILITY: landmarks, real buttons with aria-labels, visible focus, keyboard support everywhere, focus trap in modals, prefers-reduced-motion turns off autoplay, marquees, parallax, Ken Burns, blur-in and the intro.
4. LANGUAGES: Uzbek (Latin) is the source; RU and EN are first-class. Nothing user-facing outside dictionaries / translated data.
5. ORIGINALITY (see Phase 1): structure and motion QUALITY may match vero.uz; identity, words, numbers, names, images, videos, icons, fonts and colors must be Nevo's own. Never copy or hotlink anything from vero.uz, never use its commercial font "Magistral".
6. HONEST CONTENT: Nevo is a store/supplier. Every claim (years, partners, guarantee, "manufacturer", product count, reference projects) lives in src/config/site-claims.json with verified:true/false. Unverified claims and empty sections are hidden, never faked. No invented testimonials, partners, projects, certificates or numbers.
7. SECURITY: no secrets in the client, RLS everywhere, honeypot + rate limit on forms, strict CSP (never loosen it for a third-party font: self-host).
8. SELF-REVIEW LOOP (mandatory after every phase): screenshot every changed page at 390 / 768 / 1440 px in UZ, RU, EN → critique against the QUALITY RUBRIC at the end of this file → fix → repeat once more. Record in docs/review-log.md.
9. COMMITS: small, logical, clear messages; push after every phase; build + all guard scripts pass before each commit.
10. REPORT after each phase: what changed, files, Lighthouse, decisions, what the owner must supply/confirm.

=====================================================================
## PHASE 0 — RE-AUDIT (read-only → docs/audit.md, docs/site-reference-notes.md)

Open in a real browser (390/768/1440, UZ/RU/EN): https://nevogroup.uz/?preview=1 , #catalog , #catalog?category=truba-va-fitinglar&sub=PP-R%20quvurlar (click a product: it opens via ?open=<slug>), #savat, #aloqa, #tanlash, #katta-buyurtma, /admin/.
Reference for QUALITY and PATTERNS only: https://www.vero.uz/uz and /ru (home, catalog + 5 categories, about, masters, dealers, news, contacts, careers).

Verified findings on the live Nevo preview (confirm each, add more):
A. HERO COPY IS A WORD-FOR-WORD COPY OF VERO: H1 "… — muhandislik tizimlari uchun O'zbekistonda ishlab chiqarilgan kompleks yechimlar" and sub "Suv ta'minoti, isitish va kanalizatsiya uchun 1000+ turdagi quvur, fiting va komplektatsiyalar." Also copied: section title "O'zbekistonning Yirik Loyihalarida", stat labels (YIL TAJRIBA / MAHSULOT TURI / MAMNUN HAMKORLAR pattern), "Mahsulotlar va Katalog", the PDF-catalog block, and the project cards naming Nest One, Humo Arena, Islom Sivilizatsiyasi Markazi, Congress Hall, etc. (2 of 6 images empty).
B. Unverified/false claims: "1000+ turdagi" (catalog ≈ 100 products), "O'zbekistonda ishlab chiqarilgan" (store, not factory), "10+ yil", "3 000+ hamkor", "100% sifat kafolati". Hero and stats disagree with each other (1000+ vs 100+).
C. PDF catalogs: /catalogs/*.pdf (nevo-polimer-quvurlar, nevo-zapor-armatura, nevo-kanalizatsiya, nevo-isitish, nevo-yongin) return 200 but are 0 bytes; cards claim 3.4–6.2 MB; "Isitish va Suv Qozonlari" matches no real category.
D. PRODUCT DATA/IMAGES: several different products (e.g. NG-0001…NG-0004 vrezka xomuti 20/15, 25/15, 32/20, 40/20) show the SAME photo; photos sit in white square boxes on the dark theme (looks pasted); "Foto 3D" badge needs verification; product slugs are Russian-transliterated ("vreznoy-homut-20-15-nevo"); product GROUP names are RUSSIAN even in UZ mode ("Врезной хомут", "Отвод полиэтиленовый").
E. Typography: Plus Jakarta Sans declared but blocked by CSP (Google Fonts) → fallback; body renders in Inter.
F. i18n: RU home mostly Uzbek (56 untranslated nodes vs 22 translated); category names, top menu, subcategory chips, search placeholder, product names, prices ("18 000 so'm / dona"), "Omborda", floating CTA stay Uzbek in RU/EN; EN falls back to RUSSIAN; <title>/meta ignore the selected language.
G. Routing/SEO: hash routes (#catalog, #bolim/..., #catalog?category=...) are not indexable; www.nevogroup.uz and nevo-group.vercel.app serve the site instead of redirecting.
H. Layout/UX: the floating "Mutaxassisdan so'rash" button overlaps the hero CTA on desktop AND the hero headline on mobile; home is short (≈3800 px): no testimonials, brands, how-to-order, FAQ, news or contact section; one flat dark theme with white product boxes; no scroll storytelling.
I. Re-verify that no "vero" strings remain in served HTML/CSS/JS/comments (class names already look renamed, e.g. nevo-catalog-showcase-section).

Vero QUALITY BENCHMARK (measured, for matching craft — not for copying visuals): light/dark section rhythm (cinematic full-bleed hero → dark stat band → white project cards → logo strip → dark testimonial wall → dark footer); headline blur-in 1 s cubic-bezier(0.22,1,0.3,1); slow Ken Burns on media; horizontal marquees ≈45 s linear infinite; testimonial wall = 3 vertical auto-scrolling columns (17–39 s linear, different speeds, fade masks); animated scroll cue (dot 1.9 s ease-in-out); header transparent → glass on scroll with logo swap; count-up stats; wipe-reveal and beam/line-draw accents; mobile menu slide-in; everything feels premium because spacing, type scale and motion are systematic.

Deliver docs/audit.md (finding, file+line, severity, fix) and docs/i18n-audit.md (every untranslated string grouped: hardcoded UI, category/subcategory, product data, meta, forms/aria/alt/toasts/errors).

=====================================================================
## PHASE 1 — NEVO IDENTITY, ORIGINALITY, DESIGN SYSTEM

1. BRAND PACK: derive the palette from the real Nevo logo (/brand/nevo-logo.*; deep navy + brand blue #1D4ED8 family + the logo's gold/bronze as the signature accent). Create design tokens (colors, type scale, spacing 4/8 grid, radii, shadows, blur, z-index, motion durations/easings) in src/styles/tokens.css. Define a deliberate SECTION RHYTHM: dark cinematic hero → light "studio" product sections → dark proof sections → light FAQ/contact → dark footer. Product cards live on a light studio surface (no more white boxes pasted on dark).
2. SIGNATURE ELEMENTS that make Nevo unmistakably Nevo (not Vero): (a) a blueprint-line motif (thin pipe/valve line art that draws itself on scroll, stroke-dashoffset) used in dividers and hero accents; (b) a "pressure gauge" stat style (animated ring/needle count-up) instead of plain numbers; (c) gold hairline accents and blue glow on hover; (d) a distinctive logo-reveal intro. Do NOT use Vero's orange, its logo-piece animation, its beam/wipe visuals 1:1, or its layout of stat icons.
3. TYPOGRAPHY: display = "Exo 2" (500/600/700), body = "Inter" (400/500/600), self-hosted woff2 (latin, latin-ext, cyrillic), font-display: swap, preload Exo 2 600 + Inter 400, size-adjust fallbacks, tabular-nums for numbers. Remove the Google Fonts link. Verify oʻ gʻ and apostrophes in UZ and full Cyrillic in RU.
4. COPYWRITING (rewrite ALL copy; the current hero is a copy of Vero): write fresh, honest Uzbek copy for a store/supplier. Example direction (refine, keep truthful): H1 "Santexnika va qurilish mollari — ombordan, tez va ishonchli"; sub "Truba va fitinglar, zapor armatura, yong'in va elektr jihozlari. Optom va chakana narxlar, O'zbekiston bo'ylab yetkazib berish." CTAs "Katalogni ko'rish" / "Narx so'rash". Section titles, stat labels, CTAs, empty states and microcopy must all be original. Provide RU and EN versions by the same rules.
5. ORIGINALITY GUARD: scripts/check-originality.mjs in prebuild. It fails the build when src/, public/, dist/, SQL seeds or dictionaries contain: "vero.uz", "vero group", "vero-", "vero club", "yuqorida bo'l", or any phrase from docs/forbidden-phrases.txt (seed it with: "muhandislik tizimlari uchun O'zbekistonda ishlab chiqarilgan kompleks yechimlar", "1000+ turdagi quvur, fiting va komplektatsiyalar", "O'zbekistonning Yirik Loyihalarida", "Mijozlar biz haqimizda qanday fikrda", "Nest One", "Humo Arena", "Hilton Tashkent City", "Piramid Tower", "Congress Hall", "Savr Avenue", "Boulevard Residence", "Gardens Residence"), plus a 5-word-shingle similarity check against docs/vero-snapshot.txt (a text snapshot of the Vero pages, kept OUT of the deployed bundle) failing at ≥ 4 matching 5-word sequences. Also fails on external image/video URLs outside the allowlist (Supabase storage, own domain).
Commit. Review loop. Report.

=====================================================================
## PHASE 2 — DATA, PRODUCT IMAGES, HONESTY FIXES

1. site-claims.json + hide-if-unverified logic everywhere (hero stats, about, footer, meta). Remove the fake project cards; projects/partners/testimonials/news become data-driven (Supabase tables) and auto-hide when empty. Stats show only verified numbers (the real product count and real years/clients if the owner confirms; otherwise show real, checkable facts such as "100+ mahsulot", "4 ta asosiy bo'lim", "O'zbekiston bo'ylab yetkazib berish").
2. PDF CATALOGS: render a card only if the file exists and is > 50 KB; size label computed from the real file; remove cards that match no real category.
3. PRODUCT DATA CLEANUP: (a) group/subgroup names must exist in all three languages (stop Russian leaking into UZ); (b) ASCII, language-neutral product slugs (/katalog/<category>/<slug>) generated from the Uzbek name, with redirects from old slugs; (c) detect products that share an identical image hash and list them in docs/duplicate-images.md; show a clean neutral placeholder instead of a wrong photo; (d) verify the "Foto 3D" badge: show it only when a real multi-angle/3D asset exists.
4. ADMIN IMAGE PIPELINE ("every uploaded photo becomes a perfect store image"): on upload (client-side canvas or a Supabase Edge Function) → auto-trim empty margins, center on a square 1200×1200 canvas with consistent padding, normalize to the studio background tone used by cards, soft contact shadow, export WebP/AVIF + 600 px thumbnail + srcset, enforce size budget (≤ 150 KB main, ≤ 40 KB thumb), reject tiny images with a clear message, keep the original in a private bucket. Optional background removal behind a feature flag. Admin shows before/after and a "re-process" button.
5. Product card redesign: studio-light surface, image zoom-on-hover, code (NG-xxxx), spec line, stock chip, price per language, "Savatga" with micro-interaction (cart icon flies/pulses), quick-view modal with gallery slideshow (thumbnails, swipe, zoom, arrows), spec table, related products slider, share/copy link. ?open=<slug> deep links keep working.
Commit. Review loop. Report.

=====================================================================
## PHASE 3 — ROUTING, SEO, DOMAIN

1. VITE_SITE_URL=https://nevogroup.uz drives canonical, og:url, og:image (absolute), JSON-LD, sitemap.xml, robots.txt. No hardcoded nevo-group.vercel.app anywhere.
2. Replace hash routes with History-API paths: /katalog, /katalog/<kategoriya>, /katalog/<kategoriya>/<kichik-bolim>, /katalog/<kategoriya>/<mahsulot>, /savat, /aloqa, /biz-haqimizda, /yangiliklar, /hamkorlar; old hash links redirect. vercel.json SPA rewrites. Per-route title/description/canonical/hreflang; BreadcrumbList, ItemList, Product (with offers in UZS), LocalBusiness/Store, FAQPage JSON-LD; generated sitemap (excluded while preview mode is on).
3. vercel.json: 308 redirects www.nevogroup.uz and nevo-group.vercel.app → https://nevogroup.uz (keep path).
4. Verify admin login, uploads, forms on the real domain; list manual steps (Supabase Auth Site URL + Redirect URLs, Search Console, domain auto-renew).
Commit. Review loop. Report.

=====================================================================
## PHASE 4 — FULL UZ / RU / EN

- Dictionaries uz/ru/en.json with identical keys, lazy-loaded per language; zero hardcoded UI text.
- Data: translations jsonb {uz,ru,en} on categories, subcategories, products (name, description, spec labels/values, stock status). Migration moves existing data; translate ALL ~100 products + categories into RU and EN (technical terms PP-R, PN20, SDR 11, Dn stay). "so'm / dona" → "сум / шт." → "UZS / pcs"; "Omborda" → "В наличии" → "In stock".
- Fallback chain: requested → Uzbek (never another foreign language). Missing items logged to docs/i18n-missing.md.
- Intl.NumberFormat per locale; correct plural rules (RU 3 forms).
- Language state: localStorage + ?lang=, sets <html lang>, <title>, meta, og:locale, hreflang on every language/route change.
- Admin: UZ/RU/EN tabs, "missing translation" badge and filter.
- ⌘K search works across languages with identical results.
- scripts/check-i18n.mjs (prebuild): key parity, empty values, Uzbek markers (o', g', "ta ", " va ", " uchun ") in ru/en values; warns on products missing ru/en.
- Layout survives long RU/EN strings at 390/768/1440.
Commit. Review loop. Report (strings per language, products translated, missing IDs, RU/EN screenshots).

=====================================================================
## PHASE 5 — HOME + SITE SKELETON (cinematic, but Nevo's own)

SHELL: signature logo-reveal intro (first visit only, ≤ 1.8 s, skippable, sessionStorage, off for reduced-motion/bots); header transparent → glass blur on scroll with compact logo swap, centered nav, language dropdown, phone, cart badge, ⌘K; mobile slide-in menu with focus trap; footer (logo, short honest text, socials, links, contacts, hours, verified trust badges only). Floating expert/call button repositioned so it NEVER covers hero text or CTAs on any viewport (compact on mobile above the bottom nav; docks to a side rail on desktop; hides while hero CTAs are in view).

HOME (target ≥ 8 scenes, each with its own motion, all hide-if-empty):
1. Cinematic hero: full-bleed Nevo photo or looping video (poster, muted, lazy, data-saver aware), blur-in headline (1 s cubic-bezier(0.22,1,0.3,1)), staggered sub/CTAs, Ken Burns, scroll cue, blueprint-line draw accent, search-first CTA (big ⌘K field "Mahsulot qidiring: PN20, fiting, kran…").
2. "Gauge" stats band: verified numbers only, ring/needle count-up on view.
3. Category showcase: big cover cards with real counts (existing design, upgraded: tilt/parallax on hover, category-reactive backdrop).
4. Bestsellers / "Ombordan hoziroq" slider: real products, snap slider, quick add to cart.
5. Why Nevo: 4 honest benefit cards (only owner-confirmed facts: stock availability, delivery, wholesale/retail pricing, consultation) with line-art icons.
6. How to order: 3–4 animated steps (tanlang → savatga → buyurtma → yetkazib berish) linking to the existing "Qanday buyurtma beriladi" and #tanlash wizard.
7. Brands & partners marquee (real brand names already in the data, e.g. ALL AYZEN, Absan Sanat, Nevo — logos only if available, else elegant text marks): infinite marquee 45 s linear, pause on hover, edge fade.
8. Social proof wall: 3 vertical auto-scrolling testimonial columns (17–39 s linear, fade masks, pause on hover) with ReviewForm → Supabase moderation; hide until ≥ 3 approved real reviews exist.
9. Real projects/orders gallery (only real, with owner permission) — hide if empty.
10. News/updates preview (hide if empty), FAQ accordion (accessible), contact band with map + quick form, bulk-order CTA (#katta-buyurtma).
PAGES: Biz haqimizda (real story, verified facts, gallery), Hamkorlar (Leaflet/OSM map, benefits), Yangiliklar (filters, article pages from Supabase `news`), Aloqa (contact cards with actions, map, application form → Supabase `leads`, FAQ), Savat/checkout polished, 404. Optional feature-flag pages (Ustalar uchun, Karyera) only if the owner enables them.
ADMIN: CRUD for news, testimonials moderation, partners/brands, projects, FAQ, claims, categories (cover_image), leads inbox with status.
Libraries: Swiper (sliders) + Leaflet (map) only; everything else native CSS/JS.
Commit. Review loop. Report.

=====================================================================
## PHASE 6 — CATALOG EXPERIENCE (index + category + product + search)

/katalog index:
- CatalogHero with CATEGORY-REACTIVE BACKGROUND SLIDESHOW: slides keyed by category slug; image from category `cover_image` (admin-editable; start from existing wide images /images/hero/hero-plant-1.jpg, hero-valves-2.jpg, hero-factory-3.jpg or Nevo's own); two stacked layers crossfading 1.2 s; autoplay every 6 s; hover/focus on a category card (desktop) or the card centered in the scroll-snap row (mobile, IntersectionObserver) switches the slide and pauses autoplay 4 s; Ken Burns 1.0→1.06 over 10 s; pauses when document.hidden / hero out of view; reduced-motion = static first image; dark-navy gradient keeps text ≥ 4.5:1 on every slide; decorative (aria-hidden); first slide eager and LCP-safe, others via requestIdleCallback; WebP ≤ 120 KB, 1600 px + 800 px variant; fixed height, no layout shift; fallback = CSS blueprint backdrop (zero requests); isolated in .catalog-hero-bg.
- CategorySlideshow: tall cover cards (~3:4), snap/drag/arrows/progress bar/keyboard, hover scale 1.06 + lift + arrow slide-in, real counts.
- ⌘K QuickSearch: command palette, fuzzy search over categories/groups/products in the active language + Uzbek, thumbnails, ↑ ↓ Enter Esc, recent searches.
- CatalogDownloads only for real PDFs.
/katalog/<kategoriya>: CategoryHero (cover, real count, breadcrumbs, back), sticky chip nav with scroll-spy per group/subgroup, grouped product grids (2/3/4/5 cols) + mobile free-mode sliders for long groups, filters (brand, size, price range, in stock) and sort, skeleton loaders, empty state.
Product view: gallery slideshow (thumbnails, swipe, zoom, keyboard), specs table, price + stock, quantity stepper, "Savatga" + "Narx so'rash" (tel:/t.me links), related slider, copy-link, JSON-LD Product.
Commit. Review loop. Report with before/after screenshots at 390 and 1440.

=====================================================================
## PHASE 7 — MEDIA SYSTEM AND GUARDS

- src/config/media-manifest.json: every slot {id, page, section, type, recommended size/aspect, alt key, source: nevo|placeholder, path}.
- No real asset yet → locally generated neutral placeholder (brand gradient + blueprint pattern, slot label only in dev) that keeps the exact aspect ratio. Videos without a file → poster + CSS motion, no video request. Never use stock or third-party brand imagery.
- scripts/check-media-manifest.mjs: ids used/declared, files exist, budgets (images ≤ 250 KB, hero poster ≤ 150 KB, video ≤ 6 MB), width/height + alt on every <img>.
- docs/media-checklist.md: priority list for the owner (hero video/poster, category covers 1600 px, product photos incl. the ~24 to reshoot and all duplicates from docs/duplicate-images.md, brand logos, real project photos, news images).
Commit. Review loop. Report.

=====================================================================
## PHASE 8 — FINAL QA AND LAUNCH

- Real-browser test at 390/768/1440 in UZ/RU/EN: every page and scene, intro skip, header states, mobile menu, all sliders/marquees/walls (drag, loop seams, pause), catalog background slideshow (autoplay, hover switch, mobile snap switch, reduced-motion), ⌘K, product view, cart → order flow, forms (valid/invalid/success/honeypot), map, 404, admin CRUD end-to-end.
- Lighthouse 100/100 on every page; check-originality, check-i18n, check-media-manifest all green; redirects, canonical, hreflang, sitemap, robots verified.
- docs/launch-checklist.md: how to disable preview mode, Supabase URL settings, Search Console, domain auto-renew + registrant email, everything the owner must supply/confirm (real claims, projects, partners, reviews, PDFs, videos, product photos, translation review of technical terms).
- Final report: route map, files per phase, Lighthouse per page, feature flags, remaining owner tasks.

=====================================================================
## QUALITY RUBRIC (score each 1–5; do not stop until every item ≥ 4, then note the score in docs/review-log.md)

1. First impression (hero): would a client say "wow" within 3 seconds? Clear value, strong image, readable text, one obvious CTA.
2. Originality: could anyone mistake it for vero.uz? (must be NO) — different palette, copy, signature motifs, imagery.
3. Rhythm: light/dark alternation, generous spacing, consistent type scale, nothing pasted-on (no white boxes on dark).
4. Motion: purposeful, 60 fps, transform/opacity only, respects reduced-motion, never blocks reading or clicking.
5. Content honesty: every number, name and claim is verified or hidden.
6. Catalog usability: find any product in ≤ 3 interactions (search, chips, filters); cards, prices, stock, cart feel premium.
7. Language completeness: zero stray Uzbek in RU/EN, zero Cyrillic in UZ/EN, correct plurals and number formats.
8. Mobile: thumb-reachable actions, no overlap (floating button!), no horizontal scroll at 320–443 px.
9. Performance and accessibility: Lighthouse 100, keyboard-only walkthrough passes.
10. Client delight: would the owner proudly send this link to a customer today? List anything that still feels "template-like" and fix it.
</USER_REQUEST>
<ADDITIONAL_METADATA>
The current local time is: 2026-10-10T21:17:02+09:00.
</ADDITIONAL_METADATA>