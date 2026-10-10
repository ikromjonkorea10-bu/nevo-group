# NEVO GROUP — Motion, Architecture & Quality Benchmark (Phase 0)

> **Document Type:** Craft, Motion & Architectural Design Specification  
> **Purpose:** Deconstruct and measure the quality standards, physics, timing curves, and interaction hierarchy of high-end industrial engineering experiences (e.g. `vero.uz`) so NEVO GROUP matches the same structural caliber and cinematic polish without copying identity, visual motifs, or intellectual property.  
> **Status:** Measured & Codified  

---

## 1. Section Rhythm & Atmospheric Contrast

High-end digital experiences avoid monotonous single-tone layouts. Instead, they establish a deliberate **light/dark alternation** that creates natural reading pauses, emphasizes product materiality, and drives momentum down the page:

```
[ Section 1: Hero ]         Dark Cinematic Navy (#070D1B) with ambient glow & video
         ↓
[ Section 2: Proof Band ]    Deep Industrial Surface (#0A1329) with count-up gauges
         ↓
[ Section 3: Catalog ]       Light "Studio" Surface (#F8FAFC / #FFFFFF) with clean product cards
         ↓
[ Section 4: Workflow ]      Dark Tech Slate (#0B1528) with blueprint pipeline illustration
         ↓
[ Section 5: Trust & FAQ ]   Crisp Studio White (#FFFFFF) with high-contrast typography
         ↓
[ Section 6: Footer ]        Deep Architectural Onyx (#040711) with golden hairline borders
```

### The "Studio Surface" Principle for E-Commerce Products
- **Past Anti-Pattern:** Placing cut-out product photos in white rectangular cards overlaid directly onto dark navy backgrounds. This creates a jarring "cookie-cutter" look.
- **NEVO Standard:** The entire catalog section shifts to an expansive light studio surface (`#F8FAFC`). Within this canvas, product images sit naturally on neutral or slightly tinted backdrops (`#F1F5F9`) with faint industrial borders (`rgba(0, 0, 0, 0.06)`) and subtle elevation shadows (`0 4px 20px -2px rgba(15, 23, 42, 0.08)`).

---

## 2. Motion Dynamics & Physics Specification

All animations must operate strictly on **GPU-accelerated properties** (`transform` and `opacity`). Never animate `width`, `height`, `top`, `margin`, or `filter: blur()` continuously during scroll to prevent layout thrashing and maintain 60 FPS on mobile chips.

### Key Timing Curves & Easings

| Motion Pattern | Duration | Easing Curve | Purpose & Application |
| :--- | :--- | :--- | :--- |
| **Headline Blur-In** | `1000ms` | `cubic-bezier(0.22, 1, 0.3, 1)` | Staggered entrance for hero typography: `opacity: 0 → 1`, `transform: translateY(24px) → 0`, `filter: blur(10px) → blur(0)` on initial mount only. |
| **Ken Burns Pacing** | `18000ms` | `ease-out` | Ultra-slow ambient camera drift on hero background imagery: `scale(1.0) → scale(1.08)`. |
| **Card Lift & Hover** | `280ms` | `cubic-bezier(0.16, 1, 0.3, 1)` | Responsive hover states: `transform: translateY(-6px)`, box shadow expands with brand cyan tint. |
| **Horizontal Marquee**| `45000ms` | `linear infinite` | Seamless brand logo strip running horizontally. Suspends on `:hover` or touch tap. |
| **Vertical Testimonial Columns** | `22s / 31s / 19s` | `linear infinite` | 3 vertical columns scrolling at staggered differential speeds to eliminate synchronized visual looping. Fade masks (`mask-image: linear-gradient(to bottom, transparent, black 15%, black 85%, transparent)`) soften top/bottom seams. |
| **Scroll Mouse Indicator** | `1900ms` | `ease-in-out infinite` | Mouse pill cue: internal dot travels `translateY(0) → translateY(12px)` while fading opacity `1 → 0`. |
| **Header Glass Transition** | `320ms` | `cubic-bezier(0.4, 0, 0.2, 1)` | Transparent at scroll top (`y < 40px`); transforms into `backdrop-filter: blur(16px)` with `background: rgba(7, 13, 27, 0.82)` and hairline border. |

---

## 3. Signature NEVO Brand Motifs (Non-Copying Differentiation)

To ensure zero visual confusion or plagiarism with competitor brands:

### A. The Blueprint Pipeline Line Art
- Rather than generic competitor wipe effects, NEVO uses an SVG line-art illustration representing precision pipeline flow (valves, bends, flanges).
- **Behavior:** As the user scrolls into view, an `IntersectionObserver` animates SVG `stroke-dashoffset` from `100%` to `0%` over `1.4s`, visually "welding" or drawing the pipeline across section dividers.

### B. The Pressure Gauge Metric Displays
- Competitor pattern: Plain text numbers in boxes with generic icons.
- **NEVO Standard:** The 4 corporate metrics feature animated **circular gauge arcs** (SVG dial indicators) with a ticking needle count-up effect. When scrolled into view, the needle smoothly sweeps to the target percentage or capacity value.

### C. Signature Palette & Hairlines
- **Primary:** Deep Industrial Navy (`#070D1B`, `#0A1329`)
- **Accent Highlighting:** Precision Cyan / Electric Sky (`#38BDF8`, `#0284C7`)
- **Metallic Proof:** Burnished Industrial Bronze / Gold (`#D97706`, `#F59E0B`)
- **Surface Geometry:** 1px hairline borders with subtle radial gradients (`linear-gradient(135deg, rgba(56, 189, 248, 0.3), rgba(255, 255, 255, 0.05))`).

---

## 4. Mobile Ergonomics & Viewport Rules (390px Benchmark)

1. **Zero CTA Obstruction:**
   - Any floating interaction (e.g. consultation FAB) must NEVER reside in the center viewport.
   - On screens `< 768px`, consultation triggers are cleanly integrated into the sticky bottom navigation bar or pinned at `bottom: 84px; right: 16px`, completely clear of hero headlines and primary actions.
2. **Touch Targets:**
   - Minimum 48x48px touch boundaries on all interactive elements (navigation chips, slider arrows, filter pills, modal close triggers).
3. **No Horizontal Overflow:**
   - All carousels and sliders use CSS Scroll Snap (`scroll-snap-type: x mandatory`) or Swiper with isolated touch bounds, preventing `overflow-x` body wobble.
4. **Hardware Acceleration:**
   - Sliders use `transform: translate3d(x, 0, 0)` with `will-change: transform` during active drag, releasing memory when idle.

---

## 5. Reduced-Motion & Accessibility (a11y) Constraints

When `prefers-reduced-motion: reduce` is active:
- Disable auto-scrolling marquees, Ken Burns zoom, headline blur filters, and continuous needle animations.
- Replace animated transitions with immediate opacity fades (`150ms`).
- Retain full functionality: all content remains 100% readable and accessible via standard keyboard navigation (`Tab`, `Enter`, `Escape`, `ArrowLeft`, `ArrowRight`).
