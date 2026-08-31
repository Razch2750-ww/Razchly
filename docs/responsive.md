# Responsive Behavior

## Breakpoints

| Name | Range | Composition |
|---|---|---|
| Mobile | 320-767px | Single-column, bottom dock, sheets |
| Tablet | 768-1023px | Collapsed rail, simplified desktop content |
| Desktop | 1024-1439px | Full workbench with compact spacing |
| Wide | 1440-1600px | Full 8 + 4 statements and comfortable data density |
| Ultra-wide | Above 1600px | Centered max-width workspace, no uncontrolled stretching |

## Global rules

- Start with mobile task order, then enhance composition at `md` and `lg`.
- Use fluid gutters from 12px on very narrow phones to 20px on larger phones.
- Use `clamp()` for display type, major financial values, dock height, and repeated control sizing; body copy remains 14-16px.
- Never hide a primary action only because space is limited.
- Avoid horizontal page overflow.
- Use safe-area insets for the mobile dock and sheets.
- Financial values wrap or scale within defined limits; they are not silently truncated.
- Controls may shorten supporting labels but preserve accessible names.

## Route behavior

### Dashboard

- Mobile: header, raised balance statement, positions, wallets, analysis, daybook
- Desktop: toolbar and full-width statement, then a wide wallet/cashflow lane paired with an interest/daybook rail

### Transactions

- Mobile: compact header, period controls, statement, filters, ledger rows, entry sheet
- Desktop: one route header, dark filter band, narrow analysis rail, dominant reconciliation ledger, then deeper supporting analysis

### Investments and AI trading

- Mobile: asset or engine selector before chart, compact metrics below
- Tablet investments: chart deck spans both columns; return and allocation share the following row
- Desktop investments: chart deck stays dominant while return and allocation stack in a narrow rail
- Desktop AI trading: asset search remains in a narrow rail beside the market canvas; engine tabs follow below
- Never compress chart labels below readable size; reduce tick count instead

### Loans, Attendance, Grab, Savings

- Mobile: primary action within the first viewport, summary followed by chronological rows
- Loans: obligation and receivable folios stack on mobile and remain separate columns on desktop
- Attendance: live clock precedes history on mobile and becomes a sticky companion to the calendar on desktop
- Grab: period, metrics, categories, then chart on mobile; settlement chart becomes the dominant desktop canvas
- Savings: editor precedes forecast and goal status on mobile; forecast becomes a sticky desktop rail

### Analyze

- Mobile: upload or camera action first, preview second, extracted form third
- Desktop: the empty intake is centered; once extraction succeeds, source and review become a `5 + 7` verification desk

### Settings

- Mobile: section list and active editor stack vertically
- Desktop: persistent section navigation plus active form surface
- Theme categories remain in one three-part control at all widths.
- Theme previews use one column on narrow phones, expand with available width, and never shrink below a readable miniature statement.

### Route Atlas

All routes carry the `page-register` rhythm. At desktop, the route-specific dominant surface keeps its intended asymmetry (statement, ledger, analysis desk, or editor rail). At mobile, the same surface becomes the first section and supporting sections are separated by a single rule and the shared `--mobile-section-gap`; no route relies on a fixed desktop card width.

## Tables and long rows

At mobile widths, use one of two explicit modes:

1. Designed row with label, context, time, and amount.
2. Horizontal table scroller when all columns are essential.

Do not squeeze a desktop table until labels overlap.

## Modal behavior

- Below 768px, forms use bottom sheets with a maximum height and internal scroll.
- At 768px and above, forms use centered dialogs with bounded width.
- Destructive confirmation remains compact at all sizes.
- Virtual keyboard opening must not hide the active field or save action.

## Test matrix

Minimum manual widths:

- 320 by 568
- 360 by 800
- 390 by 844
- 768 by 1024
- 1024 by 768
- 1366 by 768
- 1440 by 900
- 1920 by 1080

At each width verify navigation, first primary action, longest realistic currency value, empty state, one populated list, and one open form.
