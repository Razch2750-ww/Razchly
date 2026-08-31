# Razchly Design System

## Obsidian Ledger

Razchly uses **Obsidian Ledger**, a two-material visual system inspired by a bound financial statement: an obsidian command frame surrounds a warm paper workspace. This is an **Operate** product. The interface is designed for fast financial decisions, dense scanning, and repeated daily use—not for marketing-page spectacle.

The redesign is intentionally independent of a user's saved legacy theme for its core composition. Theme choices may still color supporting routes and charts; the product frame, primary statement, transaction ledger, and entry sheet retain Razchly's signature identity so the interface never falls back to a generic dashboard.

## Materials and tokens

| Role | Token | Value |
|---|---|---|
| Command frame | `--ledger-frame` | `#10120F` |
| Raised frame | `--ledger-frame-soft` | `#171915` |
| Statement paper | `--ledger-paper` | `#F3EEE3` |
| Raised paper | `--ledger-paper-raised` | `#F8F4EA` |
| Ink | `--ledger-ink` | `#161713` |
| Gold action | `--ledger-gold` | `#D7B669` |
| Positive data | `--success-color` | `#287658` |
| Negative data | `--danger-color` | `#B1433E` |

Gold identifies brand, current navigation, and the most important action. Green and red only communicate financial meaning. There are no gradients, neon halos, or decorative glass surfaces.

## Typography

- **Statement/display:** DM Serif Display. Used for route titles, balances, and statement numerals.
- **Interface/body:** Outfit. Used for navigation, labels, controls, and long-form UI copy.
- **Tabular data:** JetBrains Mono. Used in dense ledgers, compact amounts, timestamps, and chart axes.
- Display tracking never passes `-0.04em`; body text remains comfortably readable and no operational label is smaller than 11px.

## Composition

### Global shell

- Desktop uses an L-frame with an 82px collapsed command rail. Each route owns one page header; shell utilities never repeat the route title.
- Mobile uses a dark bottom dock with four destinations and a centered add control aligned inside the bar.
- Search, profile, and navigation live in the rail; route identity appears only once inside the active workspace.

### Dashboard

- The desktop first viewport is an asymmetric `8 + 4` statement.
- The 8-column paper surface combines net worth, account rows, cashflow, and monthly totals as one document.
- The 4-column dark ledger holds liquidity, monthly spending, savings progress, and the primary add action.
- Supporting charts and accounts use shared ruled planes rather than a grid of independent rounded cards.
- Mobile begins with a paper balance statement, followed by a dark rhythm block and ruled transaction rows.

### Transactions

- The transaction ledger is the dominant workspace.
- Order is header → integrated period/filter band → monthly statement → ledger → deeper analysis.
- Entry uses a native bottom sheet on mobile. Nominal is the dominant first field; account, category, note, and time follow.
- Export and AI strategy remain available but do not compete with transaction entry.

## Shape, depth, and motion

- Structural radii are 12–16px. Ledger rows and data planes generally use square edges and hairline rules.
- Depth is reserved for a raised paper sheet over the dark frame. No card combines a border with a generic floating shadow.
- The authored moment is the financial statement reveal. Route changes use one short ease-out; controls use color and opacity.
- `prefers-reduced-motion` disables reveals and transitions without hiding content.

## Accessibility and responsive floor

- Touch targets are at least 44px.
- Keyboard focus uses a visible gold-derived ring with offset.
- Body and placeholder contrast target WCAG AA; red and green are never the only identifier in controls.
- Financial values use tabular numerals and wrap instead of truncating.
- Desktop reference: 1440–1680px. Mobile reference: 360–430px. The layout becomes a single-column, thumb-first workflow below 768px.

## Refusals

No gradient text, glow, nested cards, icon-card repetition, decorative badges, radial FAB menus, marketing scroll hijacks, invented financial claims, placeholder controls, or visual changes to Firebase data shapes and route behavior.
