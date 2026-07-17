# Design Specification: Cosmic Bento Redesign (Approach A)

**Date:** 2026-07-16  
**Author:** AI Coding Assistant (Antigravity)  
**Status:** Under Review  

---

## 1. Visual Goals & Design Direction
This redesign overhaul will reshape the layouts, sizes, and styling of all pages and tabs in the **Razchly** application to feel cohesive, premium, and free of typical AI templates ("anti-AI slop").

### Key Principles:
1. **Fluid Spotlight Backglow:** Every interactive card/element will use the updated `HoverCard` component, which renders a hardware-accelerated, cursor-following glow and outer glow using the active theme's accent color (`var(--color-app-accent1)`).
2. **Unified Border & Rounding System:**
   - Container card boxes and main modules: `rounded-[24px]` / `rounded-3xl`
   - Child cards, list items, and buttons: `rounded-2xl` (`1rem`)
   - Borders: Transparent borders (`border border-app-border/40`) to allow spotlight backglows to shine through naturally.
3. **Typography & Breathing Space (Negative Space):**
   - Increase desktop padding from `p-4` to `p-6` or `p-8` for major containers.
   - Use clean typography size hierarchy (larger bold section headers, readable small uppercase category titles).
   - Ensure numerical details use monospace values (`font-mono`) to prevent digit width jitter.
4. **Anti-AI Slop Safeguards:**
   - Avoid generic, over-saturated gradient meshes. Instead, use clean, semi-transparent radial spotlights and background glow effects aligned with the active theme variables.
   - Avoid nesting cards inside cards inside cards. Instead, separate lists and inline sections with thin dividers (`divide-y divide-app-border/30`) or single-level bento blocks.

---

## 2. Component Redesign Specs

### A. Main Dashboard (`src/components/Dashboard.tsx`)
- **Bento Grid Refactoring:**
  - Group desktop top widgets (Total Balance, Cash Flow Masuk/Keluar, Investments, Loans) into a structured bento grid with consistent heights and margins.
  - Standardize rounded borders to `rounded-[24px]`.
  - Wrap all interactive widgets (Total Saldo, Masuk, Keluar, Investasi, Pinjaman) with the updated `HoverCard` for the spotlight backglow.
  - Clean up spacing, list items, and borders in the "Dompet Saya" and "Transaksi Terakhir" sections.

### B. Investments Portofolio (`src/components/Investments.tsx`)
- Group summary widgets (Total Nilai, Modal, Imbal Hasil) into a clean, horizontal summary strip or side-by-side bento card.
  - Apply the `HoverCard` spotlight backglow to the asset summary boxes.
  - Reshape lists of assets and transaction history into structured, modern border-less lists with consistent hover scales.

### C. Loans & Debts (`src/components/Loans.tsx`)
- Reshape the Loan summary cards (Total Piutang, Total Hutang) to be symmetric with clean badges.
  - Enhance the lists of active loans to use unified `rounded-2xl` shapes with thin dividers and elegant hover interactions.
  - Clean up the detail modals and inline transaction logs.

### D. Attendance Tracker (`src/components/Attendance.tsx`)
- Redesign the Check-In/Check-Out console. Replace any bulky or basic shapes with a high-end circular gauge or a sleek pill-shaped control panel.
  - Reshape the daily logs calendar/list into a clean, modern grid with high readability.

### E. Transactions Ledger (`src/components/Transactions.tsx`)
- Revamp the filters panel. Use elegant pill selectors with custom background transitions instead of generic button grids.
  - Reshape the transaction list into a clean, highly structured bento table or list.

### F. Grab Details (`src/components/GrabDetails.tsx`) & Image Analysis (`src/components/ImageAnalysis.tsx`)
- Standardize cards, drop zones, form fields, and summaries to follow the new rounding (`rounded-[24px]`) and padding guidelines.
  - Ensure all loading state indicators use the premium shimmer effects defined in `index.css`.

### G. Settings (`src/components/Settings.tsx`)
- Refactor the configuration blocks (Theme Selection, Account Management, Target Settings) into modern, clean rows with unified shapes and border-less fields.
  - Theme cards in the selector will have the hover spotlight glow for an immersive preview experience.

---

## 3. Verification & Safety Plan
To ensure we preserve all existing features and avoid breaking the codebase, we will:
1. Validate that all Firestore CRUD queries, state variables, and props remain completely intact.
2. Proactively run the TypeScript compiler (`npm run lint`) to confirm type safety after every component modification.
3. Validate layout rendering and verify there are no overflows or spacing regressions.
