# Obsidian Ledger v2

## Design direction

Razchly is a digital passbook inside a private command frame. The visual language combines the authority of a printed financial statement with the speed of a modern operating tool.

Keywords: precise, private, editorial, tactile, calm, operational, Indonesian fintech.

Razchly must not resemble a crypto exchange, generic admin template, glass dashboard, or a grid of decorative cards.

## Core palette

These are the default `Kinpaku Slate` values. The existing theme picker may recolor paper, ink, rule, frame, and accent tokens while preserving the same hierarchy, geometry, and semantic color rules.

| Role | Token | Value |
|---|---|---|
| Command frame | `--ledger-frame` | `#10120F` |
| Raised frame | `--ledger-frame-soft` | `#171915` |
| Statement paper | `--ledger-paper` | `#F3EEE3` |
| Raised paper | `--ledger-paper-raised` | `#F8F4EA` |
| Ink | `--ledger-ink` | `#161713` |
| Rule | `--ledger-rule` | `rgba(22, 23, 19, 0.18)` |
| Antique gold | `--ledger-gold` | `#D7B669` |
| Positive | `--success-color` | `#287658` |
| Negative | `--danger-color` | `#B1433E` |

Gold is the single brand accent. Green and red are semantic data colors only. Do not add gradients, neon, or unrelated accent colors.

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
