# Razchly Design System

## 1. Design Philosophy
Razchly uses a premium utilitarian fintech language named **Kinpaku Slate**. The interface is optimized for frequent financial tasks: numbers lead, controls stay quiet, and hierarchy comes from typography, spacing, and fine dividers rather than stacked decorative cards. The visual world is charcoal with one muted-gold brand accent.

The application is an **Operate** surface. Motion is reserved for route hierarchy, sheets, and direct interaction feedback. Marketing-style scroll effects do not belong inside the authenticated product.

---

## 2. Visual Palette (Design Tokens)

### Theme Ground
- **Page Background:** `#0D0E0C` (Charcoal)
- **Card/Surface Background:** derived by mixing the canvas with 6% white
- **Hover Surface:** derived by mixing the canvas with 10% white
- **Border Stroke:** derived by mixing the canvas with 12% white

### Accent Anchors
- **Primary Accent (Kinpaku Gold):** `#C7A55B`
- **Accent Highlight:** `#E1CE9C`
- **Success Green:** `#10b981` (Emerald)
- **Destructive Red:** `#ef4444` (Coral Red)

### Typography Colors
- **Headings & Bold Text:** `#f1f5f9` (Champagne Near-White)
- **Body Text:** `#cbd5e1` (Warm Grey)
- **Muted Text / Metadata:** `#64748b` (Slate Muted)

---

## 3. Typography & Spacing
- **Font Stack:**
  - **Headings:** Outfit / Avenir Next / system sans-serif.
  - **Body:** Outfit / Avenir Next / system sans-serif.
  - **Monospace (for numbers & tickers):** JetBrains Mono, Fira Code, monospace.
- **Base Spacing Scale:** 4px grid (4px, 8px, 12px, 16px, 24px, 32px, 48px).
- **Border Radius:** `12px` controls, `14px` surfaces, `18px` mobile sheets. Pills are reserved for compact semantic indicators.

---

## 4. UI Elements & Components Guidelines

### Dashboard Surfaces
- Use open layout and dividers first. Add a bordered surface only when it groups a real task or dataset.
- Never nest cards inside cards for decoration.
- Hover states use a 1px translate and color shift, without glow.

### Data Tables
- Clean borders without heavy vertical lines.
- Sticky headers and monospace formatting for numerical columns to ease scanning.

### Interactive Charts
- Recharts use flat strokes and restrained area fills.
- Green and red are semantic data colors only. Gold remains the brand/action color.

### Navigation
- Desktop uses a collapsible left rail with one active gold marker.
- Mobile uses four persistent destinations plus a centered add control aligned within the bar.
- The add control opens a native-feeling bottom action sheet. It never expands into floating radial buttons.

---

## 5. Motion & Micro-Animations
- Powered by **Motion** (Framer Motion).
- **Page Transitions:** 10px fade-up using an exponential ease-out.
- **Button Clicks:** Scale down to `0.98` on tap.
- **Sheets:** Rise from the bottom and retain clear spatial continuity.
- **Accessibility:** all motion collapses under `prefers-reduced-motion`; focus rings remain visible; touch targets are at least 44px.

## Responsive Commitments

- Desktop reference width: 1440-1680px.
- Mobile reference width: 360-430px.
- Multi-column dashboard layouts collapse to one column below 768px.
- Financial values use tabular numerals and must never be truncated without an accessible full value.

## Anti-patterns

- No gradient text, neon glow, purple-blue AI gradients, oversized pills, decorative badges, floating radial menus, generic three-card rows, or motion without task meaning.
- No route, field name, business logic, or Firebase data shape changes as part of visual redesign work.
