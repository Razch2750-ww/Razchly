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
- Desktop: toolbar, 8 + 4 statement, account and cashflow workbench, analysis, transaction ledger

### Transactions

- Mobile: compact header, period controls, statement, filters, ledger rows, entry sheet
- Desktop: large route header, filter band, monthly statement, dominant table, deeper charts

### Investments and AI trading

- Mobile: asset or engine selector before chart, compact metrics below
- Desktop: selector and holdings register alongside one dominant analysis area
- Never compress chart labels below readable size; reduce tick count instead

### Loans, Attendance, Grab, Savings

- Mobile: primary action within the first viewport, summary followed by chronological rows
- Desktop: summary and primary action share the header region, register follows

### Analyze

- Mobile: upload or camera action first, preview second, extracted form third
- Desktop: source and preview may sit beside extracted fields

### Settings

- Mobile: section list and active editor stack vertically
- Desktop: persistent section navigation plus active form surface
- Theme categories remain in one three-part control at all widths.
- Theme previews use one column on narrow phones, expand with available width, and never shrink below a readable miniature statement.

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
