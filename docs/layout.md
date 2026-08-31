# Layout System

## Global shell

Razchly uses an L-shaped command frame around the active workspace.

### Desktop, 1024px and wider

- Collapsed rail: 82px
- Expanded rail: 224px
- Command bar: 78px
- Workspace fills the remaining viewport and owns its vertical scrolling
- Route transitions occur inside the workspace, never on the shell
- The command bar contains route identity, command search, date, sync state, and profile

### Tablet, 768px to 1023px

- Use the collapsed rail only
- Keep route content single-column when a wide chart or table cannot preserve readability
- Hide secondary header text before truncating primary controls

### Mobile, below 768px

- No desktop rail or command bar
- Persistent 72px bottom dock plus safe-area inset
- Four primary destinations with one centered add action
- Route content scrolls behind neither the dock nor the action sheet
- Sheets rise from the bottom; full-screen dialogs are reserved for complex focus tasks

## Content frame

- Maximum useful desktop width: 1600px
- Default route gutter: 28px desktop, 16px mobile
- Large operational sections use 24px to 40px internal spacing
- Dense lists use 12px to 16px vertical rhythm
- Main content never uses `height: 100vh`; use `100dvh` only at the application shell

## Page templates

### Statement template

Used by Dashboard and Transactions.

- Large financial statement as the first desktop surface
- Asymmetric `8 + 4` grid
- Main paper area carries the central financial narrative
- Dark side ledger carries decisions, exceptions, and the primary action
- Mobile converts the statement to a single raised paper sheet

### Workbench template

Used by Investments, Loans, Attendance, Grab, Savings, Analyze, and AI Trading.

- Route header and actions
- One dominant work surface
- Supporting metrics grouped by meaning, not equal-size card rows
- Detail list or chart follows the dominant surface
- Secondary analysis appears after the task flow, not before it

### Settings template

- Desktop uses a stable section index plus one active editing surface
- Mobile uses disclosure sections or a section list followed by the active editor
- Save actions remain close to the fields they affect

## Layer scale

| Layer | Purpose |
|---:|---|
| 0 | Route content |
| 10 | Sticky table headers and local menus |
| 20 | Desktop command bar and mobile dock |
| 30 | Popovers |
| 40 | Sheet backdrop |
| 50 | Dialog, command palette, and sheet |
| 60 | Skip link and critical toast |

Avoid arbitrary z-index values outside this scale.

## Scroll rules

- The shell never scrolls.
- Each route owns exactly one primary vertical scroller.
- Tables may own horizontal scrolling only when column collapse would remove essential data.
- Sticky elements stay inside their route scroller.
- Opening a dialog or sheet prevents accidental interaction with the obscured surface.

## Alignment rules

- Currency columns align right.
- Labels align to the start of their content region.
- Shared headings and controls use optical, not merely mathematical, centering.
- Use grid for page structure and flex for small control groups.
- Avoid nested containers whose only purpose is another rounded background.

## Route Atlas rhythm

The `page-register` marker applies one shared rhythm to every route: a low-noise header rule, fluid gutters, tabular numeric alignment, and alternating paper/wash planes. The route classes then choose the composition that matches the job. This keeps the visual language recognizable while avoiding a repeated wall of equal cards.

Desktop compositions use a dominant plane plus a supporting rail or register. On mobile, the same planes stack in task order; supporting panels become rule-separated sections rather than compressed multi-column cards. Theme `wash` and `frameSurface` tokens are used for those secondary planes so all 30 themes retain a distinct sense of depth.
