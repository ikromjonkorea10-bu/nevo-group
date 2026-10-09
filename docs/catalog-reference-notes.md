# Vero.uz Catalog Architecture & Interaction Inspection Notes

Generated after in-depth analysis of `https://www.vero.uz/ru/catalog` and its category routes (`/ru/catalog/suv-taminoti-va-isitish`, `/kanalizatsiya-tizimlari`, `/santexnika-va-isitish-armaturasi`, `/suv-isitish-qozonlari`, `/asbob-jihozlar`) across desktop (1440px) and mobile (390px) viewports.

---

## 1. Product Card Click & Product View Architecture

- **Card Click Behavior**:
  - Clicking on a product card or image does **NOT** trigger a traditional full-page navigation.
  - Instead, clicking opens an accessible, high-performance **ProductModal / Lightbox** (`createPortal`, fixed overlay `z-[200]`, backdrop `bg-black/80 backdrop-blur-sm`).
  - URL synchronization: the modal reflects state via URL query (`?open=<product-slug>`), enabling direct deep-linking, browser history navigation (Back button closes modal), and social sharing without full page reload.
  - Cards with 3D models or multi-angle photos render an interactive 3D viewer / drag-to-rotate canvas with rotate, zoom in/out, and reset controls.
- **ProductModal Layout**:
  - **Left side / main area**: Large high-resolution product photography with zoom and drag interaction. Top-left displays product SKU/article code badge.
  - **Right side / aside**: "O'lchamlar / Размеры" specification table with ruler icon, sticky table header, tabular numbers (`font-variant-numeric: tabular-nums`), package quantity (`В упаковке`), diameter/dimension columns, and pricing/order notice.
  - **Bottom bar / CTA row**: Product title, unit description, and immediate action buttons: "Buyurtma berish" (direct operator/Telegram CTA) and "Savatga qo'shish / Narx so'rash".
  - **Accessibility**: Focus trap, Escape key closes modal, click outside on backdrop closes, restored focus on opener.

---

## 2. Hover, Scroll-Reveal & Sticky Behaviors

- **Desktop Image Zoom-Lens Hover**:
  - On desktop hover over product cards, a circular magnifying lens (`cursor-zoom-in`, 140px diameter, white ring shadow) calculates pointer offset relative to natural image dimensions to provide instantaneous high-res inspection without lag.
  - On mobile, standard fluid touch interaction applies.
- **Hero Video & Stacking Cards**:
  - **Catalog Hero Video**: Full-width `<video src="..." poster="..." autoplay muted loop playsinline preload="metadata">` with dark radial & linear gradient overlay (`#0A0F1E / #070D1B`), gentle 1.05 scale and high brightness/contrast tuning. Automatically respects `prefers-reduced-motion` and data-saver connections.
  - **Stacking Category Cards (`data-card="true"`)**: Sticky positioning with calculated offset (`top: 96 + 22*i px`). A requestAnimationFrame scroll listener tracks distance between consecutive cards, gradually scaling down the outgoing card (`scale(1 - 0.055*n)`), reducing brightness (`filter: brightness(1 - 0.4*n)`), and shifting `translateY(-8*n px)`.
- **Sticky Elements**:
  - The Quick Search bar sticks beneath the primary header (`sticky top-0 z-30 bg-[#070D1B]`) with a colorful animated "border-beam" running gradient light.
  - On category pages, a sticky horizontal group chip bar (`scroll-spy`) sticks at top, scrolling into view and highlighting the active subgroup.

---

## 3. QuickSearch (⌘K / Ctrl+K) Command Palette

- **Trigger**:
  - Global keyboard shortcut `⌘K` (Mac) / `Ctrl+K` (Windows/Linux) or clicking the search trigger in header/hero.
  - Input shows `kbd` badge with shortcut symbol.
- **Search Capabilities**:
  - Instant fuzzy matching across Categories, Subcategories, Product Titles, Article Codes/SKU, and Brands.
  - Displays instant live dropdown overlay (`max-h-[62vh]` with scrollbar) categorized by matches, showing thumbnail, category tag, SKU, and highlighted search term.
  - Keyboard navigation: `ArrowDown` / `ArrowUp` to traverse results, `Enter` to open, `Escape` to dismiss.
  - Recent searches stored in `localStorage`.

---

## 4. Sliders & Motion Dynamics

- **Main Category Slideshow**:
  - Tall cover cards (aspect-ratio ~3:4 desktop, ~4:5 mobile) with full-bleed background images, dark atmospheric overlay, category icon, large typography, and "Ochish" pill button with arrow.
  - Motion: Easing `cubic-bezier(0.16, 1, 0.3, 1)`, touch scroll-snap, arrow button controls, progress indicator bar, keyboard arrow navigation.
  - Hover: Background image scales `1.04` - `1.06`, card translates `translateY(-4px)` to `-6px`, arrow translates right `translateX(4px)`.
- **Product Slideshow (on mobile / dense subcategories)**:
  - Free-mode touch dragging with momentum snap, navigation arrows, touch-friendly 44px tap targets.
- **Lighthouse & Performance Best Practices**:
  - 100/100 Lighthouse performance: Preload hero poster, lazy load below-the-fold media, explicit `aspect-ratio` on every image container to eliminate CLS (Cumulative Layout Shift = 0).
  - All brand styling, fonts, and colors adhere strictly to NEVO GROUP's corporate identity (Sky Blue / Cyan `#38BDF8`, deep industrial navy `#070D1B`). Zero Vero copy/assets.
