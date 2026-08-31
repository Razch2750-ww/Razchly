# Obsidian Ledger v2

## Design direction

Razchly is a digital passbook inside a private command frame. The visual language combines the authority of a printed financial statement with the speed of a modern operating tool.

Keywords: precise, private, editorial, tactile, calm, operational, Indonesian fintech.

Razchly must not resemble a crypto exchange, generic admin template, glass dashboard, or a grid of decorative cards.

## Core palette

These are the default `Kinpaku Slate` values. The theme picker may recolor paper, wash, ink, rule, frame, frame surface, and both action accents while preserving the same hierarchy, geometry, and semantic color rules.

| Role | Token | Value |
|---|---|---|
| Command frame | `--ledger-frame` | `#10120F` |
| Raised frame | `--ledger-frame-soft` | `#1D211A` |
| Statement paper | `--ledger-paper` | `#F3EEE3` |
| Raised paper | `--ledger-paper-raised` | `#FBF7ED` |
| Paper wash | `--ledger-paper-wash` | `#DDD3BE` |
| Ink | `--ledger-ink` | `#161713` |
| Rule | `--ledger-rule` | `#ADA796` |
| Paper action | `--ledger-gold` | `#765519` |
| Frame action | `--ledger-accent-frame` | `#D7B669` |
| Positive | `--success-paper` | `#21654C` |
| Negative | `--danger-paper` | `#9D3F3C` |

Gold is the single brand accent. Green and red are semantic data colors only. Do not add gradients, neon, or unrelated accent colors.

## Theme architecture

Every preset maps the same semantic roles instead of supplying unrelated accent swatches:

- canvas, raised surface, primary text, secondary text, and rule;
- command frame, frame surface, frame text, frame-muted text, and a contrast-safe frame accent;
- paper accent plus its explicit foreground color;
- success, danger, and warning variants for paper and frame contexts;
- four chart colors that remain secondary to the active action color.

The 30 presets are intentionally grouped by temperature and material instead of being minor shade variants: warm paper, ice/cobalt, botanical, rose, violet, navy, plum, forest, cocoa, and true-black AMOLED families. Every choice also carries a tone label and a miniature frame/paper/chart preview in the Theme Atlas.

`ThemeApplicator` publishes these roles to both the legacy `--app-*` compatibility tokens and the Obsidian Ledger tokens. Route CSS must consume semantic variables and must not special-case a theme ID. The existing 30 IDs remain stable so saved user preferences continue to load.

Light themes still use a dark command frame. Dark and AMOLED themes compose their own canvas and elevations instead of mechanically inverting a light palette. Kinpaku Slate remains the default two-material theme: warm statement paper inside a charcoal frame.

## Typography

### Display

DM Serif Display is justified by the passbook and financial-statement concept. Use it for major balances, route titles, and one authored statement moment per page.

### Interface

Outfit is used for navigation, forms, buttons, supporting copy, and dense controls.

### Data

JetBrains Mono is used for compact currency, percentages, time, identifiers, and chart axes. Large statement balances may use the display face with tabular numerals enabled.

### Scale

| Role | Desktop | Mobile |
|---|---:|---:|
| Statement balance | 52-92px | 38-52px |
| Route title | 40-68px | 28-36px |
| Section title | 20-28px | 18-22px |
| Body | 14-16px | 14-16px |
| Supporting | 12-13px | 12-13px |
| Operational minimum | 11px | 11px |

Tracking never goes below `-0.04em`. Body copy uses balanced or pretty wrapping where supported.

## Shape system

- Data planes and ledger rows: 0 to 6px radius
- Form controls: 8 to 12px radius
- Raised paper and sheets: 14 to 16px radius
- Pills: compact status or segmented controls only
- Buttons are not automatically pill-shaped

## Depth

- Prefer spacing and rules over borders and shadows.
- A surface uses either a border or elevation unless the raised-paper concept requires both.
- Shadows are reserved for paper sheets, dialogs, and menus.
- No glow, generic hover lift, or shadow on every card.

## Route signatures

| Surface | Signature |
|---|---|
| Login | Dark editorial promise plus a real illustrative statement labeled as example |
| Dashboard | 8 + 4 financial statement and a daybook transaction ledger |
| Transactions | Dominant reconciliable ledger with a number-first entry sheet |
| Investments | Portfolio register with asset-class tabs and one primary performance chart |
| AI Trading | Analysis desk with engine choice, evidence, risk, and action separated clearly |
| Loans | Receivable and payable register with due-state emphasis |
| Attendance | Time ledger and one obvious check-in or check-out action |
| Grab | Daily driver settlement sheet with transparent allocation |
| Savings | Goal folios showing remaining amount and next decision, not decorative rings |
| Analyze | Camera or upload workbench with explicit extraction states |
| Settings | Quiet indexed configuration document |

## Route Atlas relayout

All authenticated routes share the same header rhythm, rule weight, control sizing, and semantic tokens through `page-register`. Their composition changes with the task so the product is consistent without becoming repetitive:

- Dashboard uses a statement-ledger opening, then a 1/3 wallet-to-cashflow workbench and a 13/7 analysis split.
- Transactions removes the duplicated shell title and becomes a reconciliation desk: one dark filter band, a narrow analysis rail, and one dominant ledger surface.
- Investments preserves the 5/3/4 portfolio hierarchy and separates the analysis desk from the holdings register.
- Loans and Grab use folio/register geometry; Attendance puts the live shift first; Savings gives the editor a wide column and decisions a narrow rail.
- Analyze keeps intake and extraction as two explicit stages; AI Trading keeps the market canvas dominant and tabs secondary.
- Settings uses an index plus one active editor on desktop, and a compact single-column document on mobile.

At mobile widths every route collapses to one task per view, retains 44px controls, and uses the theme's frame/surface contrast without introducing horizontal page overflow.

## Browser surfaces

Selection, caret, scrollbars, focus rings, underlines, native date controls, and autofill colors must use the same palette. These details are part of the design system.

## Refusals

- No gradient text
- No glassmorphism as decoration
- No nested cards
- No three identical metric cards as a default section
- No icon tile repeated for every row
- No radial floating action menu
- No invented financial claims
- No progress ring or filled track when a number communicates the state better
- No motion whose only purpose is visual spectacle
- No visual change to Firebase fields, route paths, or calculation behavior
