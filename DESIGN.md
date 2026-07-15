# 🎨 DESIGN.md — Razchly Design Tokens & System

## 1. Design Philosophy
Razchly utilizes a high-end, responsive dark theme (named **Cosmic Slate**) designed for low-strain night usage, focusing on typography hierarchy, generous whitespace, and premium interactive micro-animations. It draws inspiration from Stripe (flat overlays), Linear (sharp borders & monochromatic tones), and Vercel (clean typography).

---

## 2. Visual Palette (Design Tokens)

### Theme Ground
- **Page Background:** `#090d16` (Deep Space Dark)
- **Card/Surface Background:** `#121824` / `#161f30` (Slate Grey-Blue)
- **Border Stroke:** `#222f47` (Graphite Border)

### Accent Anchors
- **Primary Accent (Kinpaku Gold):** `oklch(84% 0.19 80.46)` / `#f5c463`
- **Secondary State (Verdigris Patina):** `oklch(70% 0.12 188)` / `#5ec3b5`
- **Success Green:** `#10b981` (Emerald)
- **Destructive Red:** `#ef4444` (Coral Red)

### Typography Colors
- **Headings & Bold Text:** `#f1f5f9` (Champagne Near-White)
- **Body Text:** `#cbd5e1` (Warm Grey)
- **Muted Text / Metadata:** `#64748b` (Slate Muted)

---

## 3. Typography & Spacing
- **Font Stack:**
  - **Headings:** Outfit / Inter, system-ui, sans-serif.
  - **Body:** Inter, system-ui, sans-serif.
  - **Monospace (for numbers & tickers):** JetBrains Mono, Fira Code, monospace.
- **Base Spacing Scale:** 4px grid (4px, 8px, 12px, 16px, 24px, 32px, 48px).
- **Border Radius:** `8px` (Standard Card), `12px` (Modal / Large Container).

---

## 4. UI Elements & Components Guidelines

### Dashboard Cards
- Minimalist containers with subtle inner borders.
- Hover states with light translate-Y transform (`-2px`) and enhanced glow.

### Data Tables
- Clean borders without heavy vertical lines.
- Sticky headers and monospace formatting for numerical columns to ease scanning.

### Interactive Charts
- Recharts styled with gradients.
- Responsive colors (green when 30d asset trend is positive, red when negative).

---

## 5. Motion & Micro-Animations
- Powered by **Motion** (Framer Motion).
- **Page Transitions:** Fade-in with 20px Y-axis offset, spring transition.
- **Button Clicks:** Scale down to `0.98` on tap.
- **Modal Modals:** Pop in from scale `0.95` to `1` with smooth easing.
